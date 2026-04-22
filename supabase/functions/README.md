# Supabase Edge Functions

Deno-runtime functions that run close to the database. Two are scaffolded here:

| Function    | Route (Supabase-prefixed)                     | Purpose                                                                                                                       |
| ----------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `analytics` | `POST /functions/v1/analytics`                | Fire-and-forget ingest for `usage_events`. Replaces the inline `trackApiCall` / `trackMcpTool` path from Next.js.             |
| `fundi`     | `POST /functions/v1/fundi` and `.../heal`     | Ingests self-healing issues from L8 assurance callsites; opens GitHub issues for the worst ones on a cron-driven `heal` pass. |

Project ref: `grjsboqkaywpwatvrzmy` (`nyuchi_design_db`, region `ap-southeast-1`).

## Prerequisites

1. Install the Supabase CLI: `brew install supabase/tap/supabase` (or see <https://supabase.com/docs/guides/cli>).
2. `supabase login` with a PAT that has access to the `nyuchi_design_db` project.
3. `supabase link --project-ref grjsboqkaywpwatvrzmy` from the repo root.

## Required database tables

Both tables are already created by prior migrations (see `components.architecture_layer = 8/9` rows in `architecture_frontend_layers` once FRD-10 / #46 lands). If you need to recreate them:

```sql
create table public.usage_events (
  id              bigint generated always as identity primary key,
  event_type      text not null check (event_type in ('api_call', 'mcp_tool')),
  endpoint        text,
  tool_name       text,
  component_name  text,
  duration_ms     integer,
  status_code     integer,
  is_error        boolean,
  source          text default 'design-portal',
  created_at      timestamptz not null default now()
);
create index on public.usage_events (created_at desc);
create index on public.usage_events (event_type, created_at desc);

create table public.fundi_issues (
  id                   bigint generated always as identity primary key,
  scope                text not null,
  severity             text not null check (severity in ('critical','high','medium','low')),
  symptom              text not null,
  context              jsonb,
  fingerprint          text,
  source               text default 'design-portal',
  status               text not null default 'open' check (status in ('open','in_progress','resolved','wontfix')),
  github_issue_number  integer,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create unique index fundi_issues_open_fingerprint
  on public.fundi_issues (fingerprint)
  where status in ('open', 'in_progress');

create table public.fundi_healing_log (
  id          bigint generated always as identity primary key,
  issue_id    bigint not null references public.fundi_issues(id) on delete cascade,
  action      text   not null,
  payload     jsonb,
  created_at  timestamptz not null default now()
);
create index on public.fundi_healing_log (issue_id, created_at desc);
```

The edge functions expect these exact column names.

## Secrets

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by the Supabase runtime. You only need to set secrets the functions consume directly.

### `fundi`

```bash
supabase secrets set GITHUB_TOKEN=ghp_xxx        # PAT with `repo:issues` on nyuchi/design-portal
supabase secrets set FUNDI_GITHUB_REPO=nyuchi/design-portal

# Optional: dedicated token for the /heal endpoint. If unset, /heal
# accepts the Supabase service-role key instead. Set this secret if
# you want to isolate the heal trigger from service-role access.
supabase secrets set FUNDI_HEAL_TOKEN=$(openssl rand -hex 32)
```

The PAT must be able to create issues and add labels on that repo.

**Auth model:**

- `POST /functions/v1/fundi` — **unauthenticated by design.** L8
  assurance callsites anywhere in the ecosystem can report. The L8
  client library, not this endpoint, decides whether to send. Validation
  here enforces a strict scope/severity/symptom shape and fingerprint
  dedup limits row growth.
- `POST /functions/v1/fundi/heal` — **requires a Bearer token** matching
  either `SUPABASE_SERVICE_ROLE_KEY` (auto-injected; what the documented
  pg_cron schedule uses) or `FUNDI_HEAL_TOKEN` if set. Returns 401
  otherwise. This prevents an unauthenticated caller from triggering
  GitHub-issue creation via the heal loop.

**Who reports to fundi (deployment matrix):**

| Environment                             | Fundi reporting |
| --------------------------------------- | --------------- |
| `*.nyuchi.com`, `nyuchi.africa`, …      | **On by default** |
| `*.mukoko.com`                          | **On by default** |
| Any bundu-repo `NODE_ENV=development`   | **On by default** |
| Allow-listed staging environments       | **On by default** (per-app config) |
| External customers consuming the registry | **Opt-in** (set `NEXT_PUBLIC_FUNDI_ENABLED=1`) |

The L8 client library on the consumer side reads its environment and
decides whether to POST. No data leaves an external customer's
infrastructure without an explicit opt-in. Every report carries a
`source` field so triage can filter by ecosystem.

### `analytics`

No additional secrets. Rate limiting is per-instance (see notes inside the file).

## Deploy

```bash
# From the repo root:
supabase functions deploy analytics --project-ref grjsboqkaywpwatvrzmy
supabase functions deploy fundi     --project-ref grjsboqkaywpwatvrzmy
```

Both functions are `--no-verify-jwt` compatible (they do their own auth via rate limiting + fingerprinting). The default deploy is fine.

## Scheduling the fundi heal pass

Run once in the Supabase SQL editor to schedule `fundi/heal` every 15 minutes via `pg_cron` + `pg_net`:

```sql
select cron.schedule(
  'fundi-heal',
  '*/15 * * * *',
  $$
    select net.http_post(
      url     := 'https://grjsboqkaywpwatvrzmy.supabase.co/functions/v1/fundi/heal',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type',  'application/json'
      ),
      body    := '{}'::jsonb
    );
  $$
);
```

To unschedule: `select cron.unschedule('fundi-heal');`

## Switching the portal to the analytics function

`lib/metrics.ts` currently writes to `usage_events` directly from Next.js via the service-role client. Once `analytics` is deployed and verified, swap the body of `trackApiCall` / `trackMcpTool` to:

```ts
void fetch(`${SUPABASE_URL}/functions/v1/analytics`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(event),
  // Don't let this block or throw — metrics must never affect the request path.
}).catch(() => {})
```

This pulls the service-role key out of the Next.js request path and centralises ingest (so mukoko-*, nhimbe, shamwari can hit the same endpoint without needing service-role access).

## Invoking by hand

```bash
# Analytics — single event
curl -sS -X POST 'https://grjsboqkaywpwatvrzmy.supabase.co/functions/v1/analytics' \
  -H 'Content-Type: application/json' \
  -d '{"event_type":"api_call","endpoint":"/api/v1/ui","duration_ms":42,"status_code":200}'

# Fundi — report an issue
curl -sS -X POST 'https://grjsboqkaywpwatvrzmy.supabase.co/functions/v1/fundi' \
  -H 'Content-Type: application/json' \
  -d '{"scope":"registry","severity":"medium","symptom":"registry.json drifted","context":{"expected":545,"actual":540}}'

# Fundi — manually trigger a heal pass (requires auth, see "Auth model" above)
curl -sS -X POST 'https://grjsboqkaywpwatvrzmy.supabase.co/functions/v1/fundi/heal' \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

## Local development

```bash
supabase start                                    # boot local stack (Docker)
supabase functions serve analytics --no-verify-jwt
# in another terminal
supabase functions serve fundi --no-verify-jwt
```

Functions hot-reload on save.

## Why edge instead of Next.js API routes?

- **Analytics** moves the metric write off the portal's request path — no more service-role key in the Next.js runtime, no fire-and-forget client in app code. Any ecosystem app can call the same URL.
- **Fundi** is a long-running / cron-driven loop with external HTTP (to the GitHub API). Running it outside Next.js keeps retries, rate limits, and timeouts out of the portal's serverless budget, and keeps `fundi_issues` row writes close to the DB.

## License

MIT — same as the rest of the repo (see `../../LICENSE`).
