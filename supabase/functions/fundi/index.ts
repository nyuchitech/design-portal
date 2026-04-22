// Nyuchi Design Portal — fundi edge function.
//
// "Fundi" is the L9 self-healing actor in the 3D frontend architecture.
// The L8 assurance layer detects runtime issues and reports them; fundi
// promotes the worst ones into GitHub issues so a human (or Claude Code)
// can fix them, and maintains an append-only healing log.
//
// This function is the single ingress point for fundi. It has two routes:
//
//   POST /fundi
//     Report a new issue from an L8 assurance callsite.
//     Body: {
//       "scope":     "registry" | "mcp" | "docs" | "api" | "ui" | ...,
//       "severity":  "critical" | "high" | "medium" | "low",
//       "symptom":   "Short human-readable title",
//       "context":   { ...arbitrary structured data... },
//       "fingerprint": "optional stable hash — collapses duplicates",
//       "source":    "design-portal" | "mukoko-*" | ...
//     }
//
//   POST /fundi/heal
//     Cron-triggered (or manually invoked). Picks up any open fundi_issues
//     with no GitHub issue yet, opens one, records the mapping, and appends
//     to fundi_healing_log. Idempotent: safe to invoke more than once; a
//     fingerprint guard prevents duplicate GH issues.
//
// Deploy:
//   supabase functions deploy fundi --project-ref grjsboqkaywpwatvrzmy
//
// Required secrets (set with `supabase secrets set KEY=...`):
//   GITHUB_TOKEN          — PAT with `repo:issues` scope on nyuchi/design-portal
//   FUNDI_GITHUB_REPO     — default: "nyuchi/design-portal"
//
// Schedule the heal pass every 15 minutes via Supabase cron (pg_cron):
//   select cron.schedule(
//     'fundi-heal',
//     '*/15 * * * *',
//     $$
//       select net.http_post(
//         url:='https://<project>.supabase.co/functions/v1/fundi/heal',
//         headers:=jsonb_build_object(
//           'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
//           'Content-Type',  'application/json'
//         ),
//         body:='{}'::jsonb
//       );
//     $$
//   );

import { adminClient } from "../_shared/supabase.ts"
import { json, preflight } from "../_shared/cors.ts"

const GITHUB_REPO = Deno.env.get("FUNDI_GITHUB_REPO") ?? "nyuchi/design-portal"
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN")

const MAX_HEAL_BATCH = 10 // don't open more than this many GH issues per pass

type Severity = "critical" | "high" | "medium" | "low"

interface FundiIssueInput {
  scope: string
  severity: Severity
  symptom: string
  context?: Record<string, unknown>
  fingerprint?: string
  source?: string
}

interface FundiIssueRow {
  id: number
  scope: string
  severity: Severity
  symptom: string
  context: Record<string, unknown> | null
  fingerprint: string | null
  source: string | null
  status: string
  github_issue_number: number | null
  created_at: string
}

function fingerprintFor(input: FundiIssueInput): string {
  if (input.fingerprint) return input.fingerprint
  // Stable hash: scope + severity + symptom (first 120 chars)
  const raw = `${input.scope}|${input.severity}|${input.symptom.slice(0, 120)}`
  // FNV-1a 32-bit — cheap and dependency-free
  let h = 0x811c9dc5
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, "0")
}

// Scope segments are embedded into GitHub issue labels
// (`fundi:scope:<scope>`). GitHub rejects labels >50 chars or with
// special characters, and we don't want a malformed scope to either
// pollute the label namespace or fail the heal call. Allow a tight
// alphanum + dot/hyphen/underscore set, 1-40 chars.
const SCOPE_PATTERN = /^[a-z0-9._-]{1,40}$/i

function validateInput(body: unknown): FundiIssueInput | string {
  if (!body || typeof body !== "object") return "body must be an object"
  const b = body as Record<string, unknown>
  if (typeof b.scope !== "string" || !b.scope) return "scope (string) required"
  if (!SCOPE_PATTERN.test(b.scope)) {
    return "scope must be 1-40 chars of [a-z0-9._-] (case-insensitive)"
  }
  if (!["critical", "high", "medium", "low"].includes(b.severity as string)) {
    return "severity must be critical|high|medium|low"
  }
  if (typeof b.symptom !== "string" || !b.symptom) return "symptom (string) required"
  if (b.symptom.length > 200) return "symptom must be 1-200 chars"
  return {
    scope: b.scope,
    severity: b.severity as Severity,
    symptom: b.symptom,
    context: (b.context ?? null) as Record<string, unknown>,
    fingerprint: typeof b.fingerprint === "string" ? b.fingerprint : undefined,
    source: typeof b.source === "string" ? b.source : "design-portal",
  }
}

async function ingest(input: FundiIssueInput) {
  const fingerprint = fingerprintFor(input)
  const supabase = adminClient()

  // Deduplicate by fingerprint — if an open row exists, bump its occurrence
  // count (via healing log) instead of inserting a new row.
  const { data: existing } = await supabase
    .from("fundi_issues")
    .select("id, status")
    .eq("fingerprint", fingerprint)
    .in("status", ["open", "in_progress"])
    .maybeSingle()

  if (existing) {
    await supabase.from("fundi_healing_log").insert({
      issue_id: existing.id,
      action: "duplicate_reported",
      payload: { symptom: input.symptom, context: input.context },
    })
    return { id: existing.id, deduplicated: true }
  }

  const { data, error } = await supabase
    .from("fundi_issues")
    .insert({
      scope: input.scope,
      severity: input.severity,
      symptom: input.symptom,
      context: input.context ?? null,
      fingerprint,
      source: input.source ?? "design-portal",
      status: "open",
    })
    .select("id")
    .single()

  if (error) throw new Error(`Ingest failed: ${error.message}`)
  return { id: data.id, deduplicated: false }
}

async function openGithubIssue(issue: FundiIssueRow): Promise<number> {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN not configured")
  }

  const severityLabel = `fundi:${issue.severity}`
  const scopeLabel = `fundi:scope:${issue.scope}`
  const title = `[fundi] ${issue.symptom}`
  const body =
    `**Autogenerated by fundi** (L9 self-healing actor).\n\n` +
    `- Severity: \`${issue.severity}\`\n` +
    `- Scope: \`${issue.scope}\`\n` +
    `- Source: \`${issue.source ?? "design-portal"}\`\n` +
    `- Fingerprint: \`${issue.fingerprint ?? ""}\`\n` +
    `- Supabase row: \`fundi_issues.id = ${issue.id}\`\n` +
    `- Detected: ${issue.created_at}\n\n` +
    `### Context\n\n\`\`\`json\n${JSON.stringify(issue.context ?? {}, null, 2)}\n\`\`\`\n\n` +
    `---\n` +
    `Close this issue via \`UPDATE fundi_issues SET status='resolved' WHERE id=${issue.id};\` ` +
    `or let a human close it in GitHub — fundi syncs either way.`

  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "fundi-edge-function",
    },
    body: JSON.stringify({
      title,
      body,
      labels: ["fundi", severityLabel, scopeLabel],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GitHub API ${response.status}: ${text.slice(0, 500)}`)
  }

  const created = (await response.json()) as { number: number }
  return created.number
}

async function heal() {
  const supabase = adminClient()

  const { data: openIssues, error } = await supabase
    .from("fundi_issues")
    .select("id, scope, severity, symptom, context, fingerprint, source, status, github_issue_number, created_at")
    .is("github_issue_number", null)
    .eq("status", "open")
    .order("severity", { ascending: true }) // critical/high first (alphabetical works: critical<high<low<medium — use priority map instead)
    .limit(MAX_HEAL_BATCH * 2)

  if (error) throw new Error(`Heal scan failed: ${error.message}`)

  const severityPriority: Record<Severity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }
  const queue = (openIssues as FundiIssueRow[] | null ?? [])
    .sort((a, b) => severityPriority[a.severity] - severityPriority[b.severity])
    .slice(0, MAX_HEAL_BATCH)

  const results: Array<{ id: number; github_issue_number?: number; error?: string }> = []
  for (const issue of queue) {
    try {
      const ghNumber = await openGithubIssue(issue)
      await supabase
        .from("fundi_issues")
        .update({ github_issue_number: ghNumber, status: "in_progress" })
        .eq("id", issue.id)
      await supabase.from("fundi_healing_log").insert({
        issue_id: issue.id,
        action: "github_issue_opened",
        payload: { github_issue_number: ghNumber, repo: GITHUB_REPO },
      })
      results.push({ id: issue.id, github_issue_number: ghNumber })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await supabase.from("fundi_healing_log").insert({
        issue_id: issue.id,
        action: "github_issue_failed",
        payload: { error: message },
      })
      results.push({ id: issue.id, error: message })
    }
  }

  return { healed: results.filter((r) => !r.error).length, failed: results.filter((r) => r.error).length, details: results }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight("POST, OPTIONS")
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, methods: "POST, OPTIONS" })
  }

  const url = new URL(req.url)
  // Supabase routes POST /functions/v1/fundi/heal → req.url path ends with /heal
  const path = url.pathname.replace(/\/+$/, "")

  try {
    if (path.endsWith("/heal")) {
      // /heal is a privileged endpoint — it opens real GitHub issues
      // using the repo PAT. Require a Bearer token matching either the
      // Supabase service-role key (used by the documented pg_cron
      // schedule) or a dedicated FUNDI_HEAL_TOKEN secret if operators
      // want to isolate the trigger from service-role access.
      const provided = (req.headers.get("authorization") ?? "")
        .replace(/^Bearer\s+/i, "")
        .trim()
      const expectedServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      const expectedHealToken = Deno.env.get("FUNDI_HEAL_TOKEN")
      const ok =
        (!!expectedServiceRole && provided === expectedServiceRole) ||
        (!!expectedHealToken && provided === expectedHealToken)
      if (!ok) {
        return json(
          { error: "Unauthorized" },
          { status: 401, methods: "POST, OPTIONS" }
        )
      }
      const result = await heal()
      return json(result, { status: 200, methods: "POST, OPTIONS" })
    }

    // Default path: ingest a new issue.
    const body = await req.json().catch(() => null)
    const validated = validateInput(body)
    if (typeof validated === "string") {
      return json({ error: validated }, { status: 400, methods: "POST, OPTIONS" })
    }
    const result = await ingest(validated)
    return json(result, { status: 202, methods: "POST, OPTIONS" })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error"
    console.error("[fundi]", message)
    return json({ error: message }, { status: 500, methods: "POST, OPTIONS" })
  }
})
