---
name: nyuchi-design-system
description: Use when working on any bundu-ecosystem app (mukoko, nyuchi, shamwari, nhimbe, design-portal, sister brands) or when the user asks about the Five African Minerals palette, the 3D frontend architecture, Ubuntu design doctrine, component patterns (CVA + Radix + cn), APCA accessibility targets, or shadcn-CLI registry install commands. Always pull live counts, versions, and registry lists from https://design.nyuchi.com — never hardcode them.
---

# Mukoko Design System

You are working with the **Nyuchi Design Portal** — the canonical registry, design system, and MCP server for the bundu ecosystem.

- **Live site:** <https://design.nyuchi.com>
- **Source of truth:** Supabase (`components`, `component_docs`, `component_versions`, `documentation_pages`, `changelog`, `ai_instructions`, `fundi_issues`, `brand_*`, `architecture_*`)
- **Install API:** `npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/<name>`
- **MCP endpoint:** `https://design.nyuchi.com/mcp` (Streamable HTTP, POST JSON-RPC)
- **OpenAPI 3.1:** <https://design.nyuchi.com/api/openapi>

## Rule: never hardcode metrics

Every count, version, and catalogue entry lives in Supabase and is served live. When you need one, call the API; do not copy numbers from memory, comments, or stale docs.

| Need                      | Call                                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Current version           | `GET /api/v1/changelog` → `[0].version`                                                                                                         |
| Total stable items        | `GET /api/v1/stats` → `stable`                                                                                                                  |
| Items per layer           | `GET /api/v1/stats` → `byLayer[]`                                                                                                               |
| Items per category        | `GET /api/v1/stats` → `byCategory[]`                                                                                                            |
| Full registry index       | `GET /api/v1/ui`                                                                                                                                |
| One component's source    | `GET /api/v1/ui/{name}`                                                                                                                         |
| A component's docs        | `GET /api/v1/ui/{name}/docs`                                                                                                                    |
| Component version history | `GET /api/v1/ui/{name}/versions`                                                                                                                |
| Documentation page        | `GET /api/v1/docs/{slug}` (or list via `/api/v1/docs`)                                                                                          |
| Brand system              | `GET /api/v1/brand`                                                                                                                             |
| Architecture topics       | `/api/v1/{ecosystem,data-layer,pipeline,sovereignty}`                                                                                           |
| Ubuntu doctrine           | MCP resource `mukoko://ubuntu` or tool `get_ubuntu_doctrine` (for philosophy) / `get_ubuntu_pillars` / `get_ubuntu_principles` (for table rows) |

## Architecture — the 3D frontend model

Ten layers across five axes. Each component in `components.architecture_layer` (1–10) and `components.layer` (sub-label) sits at exactly one position. Import rule: consume the layer below on the same axis; never sideways or upward.

| #   | `layer` sub-label | Axis          | Covenant                                                 |
| --- | ----------------- | ------------- | -------------------------------------------------------- |
| 1   | `tokens`          | Y-axis        | Design decisions are data, not code.                     |
| 2   | `primitive`       | X-axis        | A primitive does one thing well.                         |
| 3   | `brand`           | X-axis        | A brand component is a primitive with Ubuntu in it.      |
| 4   | `safety`          | Y-axis        | Nothing harmful reaches the user.                        |
| 5   | `resilience`      | Y-axis        | Failure in one part never breaks the whole.              |
| 6   | `pages`           | X-axis        | A page is a composition, not an implementation.          |
| 7   | `shell`           | X-axis        | The shell holds the product.                             |
| 8   | `assurance`       | Z-axis        | What breaks is seen before users feel it.                |
| 9   | `fundi`           | Outside       | Failure is a learning event, not a user-facing incident. |
| 10  | `documentation`   | Documentation | The system documents itself.                             |

**Axis semantics.** X = horizontal composition flow (primitives → brand → pages → shell, what the user sees). Y = vertical infrastructure (tokens / safety / resilience thread through every X-layer). Z = depth observation (assurance watches X and Y without being inside anything). Outside = actors beyond the build (fundi heals autonomously). Documentation = the system describing itself.

This is **distinct** from the 7-layer data architecture at `/architecture` (Pod → Relational → Document → Orchestration → Edge → Device → Open Data). Never conflate the two numberings.

## Installing registry items

```bash
npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/<name>
```

- To discover names: `GET /api/v1/ui` or MCP `list_components`.
- Install multiple at once: list several URLs on the same `add` command.
- Registry item types: `registry:ui`, `registry:hook`, `registry:lib`, `registry:block`.
- Only a small subset of primitives is committed into this repo's `components/ui/`; the rest live only in Supabase and are fetched on install.

## MCP server

Connect an MCP client to `https://design.nyuchi.com/mcp`.

**Tools** (22; always up-to-date via `list_tools`): `list_components`, `get_component`, `get_component_docs`, `get_component_links`, `get_component_versions`, `search_components`, `get_design_tokens`, `scaffold_component`, `get_install_command`, `get_brand_info`, `get_architecture_info`, `get_architecture_frontend`, `get_ubuntu_doctrine`, `get_ubuntu_pillars`, `get_ubuntu_principles`, `get_database_status`, `get_usage_stats`, `get_layer_summary`, `get_ai_instructions`, `get_changelog`, `get_documentation_page`.

**Resources** (5): `mukoko://registry`, `mukoko://brand`, `mukoko://design-tokens`, `mukoko://architecture`, `mukoko://ubuntu`.

**System prompt** loads at startup from `ai_instructions` (`name='nyuchi-mcp-system-prompt'`) with a 60s TTL cache. To change the prompt, edit the Supabase row; no code deploy needed.

## Five African Minerals

Constant across light and dark. Always consume via CSS custom properties — never paste hex values into TSX.

| Mineral    | Hex     | CSS variable       | Usage                     |
| ---------- | ------- | ------------------ | ------------------------- |
| Cobalt     | #0047AB | --color-cobalt     | Primary blue, links, CTAs |
| Tanzanite  | #B388FF | --color-tanzanite  | Purple accent, brand/logo |
| Malachite  | #64FFDA | --color-malachite  | Cyan accent, success      |
| Gold       | #FFD740 | --color-gold       | Yellow accent, rewards    |
| Terracotta | #D4A574 | --color-terracotta | Warm accent, community    |

### Semantic tokens (theme-adaptive)

| Token         | Light   | Dark    |
| ------------- | ------- | ------- |
| --background  | #FAF9F5 | #0A0A0A |
| --foreground  | #141413 | #F5F5F4 |
| --card        | #FFFFFF | #141414 |
| --muted       | #F3F2EE | #1E1E1E |
| --primary     | #141413 | #F5F5F4 |
| --destructive | #B3261E | #F2B8B5 |

### Chart tokens (mineral-mapped)

| Token     | Light   | Dark (mineral)       |
| --------- | ------- | -------------------- |
| --chart-1 | #4B0082 | #B388FF (Tanzanite)  |
| --chart-2 | #0047AB | #00B0FF (Cobalt)     |
| --chart-3 | #004D40 | #64FFDA (Malachite)  |
| --chart-4 | #5D4037 | #FFD740 (Gold)       |
| --chart-5 | #8B4513 | #D4A574 (Terracotta) |

### Typography

- Body: Noto Sans (`--font-sans`) — chosen for African language support (diacritics, broad script coverage)
- Display / headings: Noto Serif (`--font-serif`)
- Code: JetBrains Mono (`--font-mono`)

All brand wordmarks are **lowercase**: `mukoko`, `nyuchi`, `shamwari`, `bundu`, `nhimbe`.

### Radius system

Ecosystem numbers 7 / 12 / 14 / 17, derived from `--radius-unit: 7px`.

```
--radius-sm:   7px    checkboxes, small elements
--radius-md:  12px    cards, inputs, containers
--radius-lg:  14px    default, medium containers
--radius-xl:  17px    large cards, dialogs
--radius-full: 9999px buttons, badges, pills, avatars
```

**Buttons are always pill-shaped (`rounded-full`).** This is an executive brand decision, not a radius-scale value.

### Touch targets (non-negotiable)

- Default: 56px height
- Minimum: 48px height (for the African mobile market — outdoor use, shared devices, older Android)

## Component pattern — CVA + Radix + cn()

Every UI component follows this exact shape:

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui" // only when polymorphic
import { cn } from "@/lib/utils"

const componentVariants = cva("base-classes-here", {
  variants: {
    variant: { default: "...", outline: "...", ghost: "..." },
    size: { default: "h-14 px-4", sm: "h-12 px-3" }, // 56px / 48px
  },
  defaultVariants: { variant: "default", size: "default" },
})

function ComponentName({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof componentVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "div"
  return (
    <Comp
      data-slot="component-name"
      className={cn(componentVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { ComponentName, componentVariants }
```

**Authoring workflow** (components live in Supabase, not the filesystem):

1. Upsert the row into `components` (and `component_docs`) in Supabase: `source_code`, `architecture_layer`, `category`, `dependencies`, `registry_dependencies`, `status='stable'`.
2. In this repo: `pnpm registry:sync` regenerates `registry.json` and (if portal-imported) `components/ui/<name>.tsx`.
3. Verify: `curl http://localhost:11736/api/v1/ui/<name>` returns the source code.
4. Commit the updated `registry.json` — CI `pnpm registry:verify` fails on drift.

## Hard rules

- **No hardcoded colors** in TSX. Use Tailwind classes backed by CSS custom properties from `globals.css`.
- **No inline `style={{ ... }}`** except where unavoidable (Satori, Three.js, SVG fill/stroke).
- **`cn()` only** for className composition. No string concatenation.
- **Named exports only.** No default exports.
- **`kebab-case`** filenames, **`PascalCase`** component names.
- **`data-slot`** attribute on the root element of every component (for CSS targeting).
- **`"use client"`** only when you actually use hooks / event handlers / browser APIs.
- **Mineral strip is always vertical** — left-edge accent only, never horizontal.
- **Buttons always `rounded-full`.**
- **Touch targets ≥ 48px; default 56px.**

## Ubuntu — community-first design

**Umuntu ngumuntu ngabantu.** _A person is a person through other persons._

Ubuntu is the behavioural foundation of every design decision in the bundu ecosystem, not a branding veneer.

| Ubuntu principle          | Design implication                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Shared devices            | Design for families, not isolated individuals. Account switching, family profiles, shared history are first-class. |
| Outdoor readability       | APCA Lc 90+ body text, 56px touch targets, sun-readable contrast.                                                  |
| Intermittent connectivity | Offline-first. Queue locally, sync when able.                                                                      |
| Budget hardware           | 100KB JS budget, 3G-optimised, <3s TTI on mid-range Android (Tecno Spark is the reference device).                 |
| All ages                  | No age-gate assumptions. Icons supplement text. Voice is first-class.                                              |
| Community data ownership  | Data belongs to the individual and their community. No dark patterns. Data portability is non-negotiable.          |

**AI framing rule.** Never frame benefits as purely individual. "You and your community" beats "you personally". Shona, Ndebele, and English are all valid primary languages — never treat English as default.

**Ubuntu design checklist** (every new component):

1. Touch target ≥ 56px default, ≥ 48px minimum
1. APCA Lc 90+ body text on both `#FAF9F5` and `#0A0A0A`
1. Works on shared devices — no personal-only state assumptions
1. Performant on 3G — no gratuitous heavy deps
1. All strings externalisable for Shona / Ndebele / English
1. Community-first framing — benefits the group, not just the individual

Always call `get_ubuntu_doctrine` or read `mukoko://ubuntu` for the live philosophy before making doctrine-level claims; for the structured Five Pillars / Five Principles rows, call `get_ubuntu_pillars` / `get_ubuntu_principles`. For the 3D frontend model (5 axes × 10 layers), call `get_architecture_frontend`.

## Accessibility — APCA 3.0 AAA

The ecosystem follows **APCA** (Advanced Perceptual Contrast Algorithm) — the WCAG 3.0 AAA standard, not the outdated WCAG 2.x ratio method.

| Role                      | Min Lc | Tailwind / token                     |
| ------------------------- | ------ | ------------------------------------ |
| Body text                 | Lc 90  | `text-foreground` on `bg-background` |
| Large text (≥ 18pt)       | Lc 75  | headings, hero text                  |
| Display text              | Lc 60  | section labels, card titles          |
| UI text / labels          | Lc 60  | buttons, inputs, badges              |
| Non-text (icons, borders) | Lc 45  | icon strokes, dividers               |
| Inactive / disabled       | Lc 30  | placeholder text, disabled states    |
| Decorative                | Lc 15  | background patterns                  |

### Mineral Lc reference (light bg `#FAF9F5` / dark bg `#0A0A0A`)

| Mineral                  | Light Lc | Dark Lc | Body-text safe?          |
| ------------------------ | -------- | ------- | ------------------------ |
| Cobalt `#0047AB`         | ~78      | —       | Large text only in light |
| Cobalt dark `#00B0FF`    | —        | ~83     | ✓ large text in dark     |
| Tanzanite `#4B0082`      | ~92      | —       | ✓ body text in light     |
| Tanzanite dark `#B388FF` | —        | ~78     | Large text only in dark  |
| Malachite `#64FFDA`      | ~62      | —       | Display / UI in light    |
| Gold `#FFD740`           | ~61      | —       | Display / UI in light    |
| Terracotta `#D4A574`     | ~56      | —       | Non-text only in light   |

## Ecosystem brands

| Brand    | Meaning (Shona) | Role                                 | Mineral tag |
| -------- | --------------- | ------------------------------------ | ----------- |
| bundu    | Wilderness      | The complete ecosystem               | Terracotta  |
| nyuchi   | Bee             | Infrastructure & enterprise products | Gold        |
| mukoko   | Beehive         | Consumer super app                   | Tanzanite   |
| shamwari | Friend          | Sovereign AI companion               | Cobalt      |
| nhimbe   | Gathering       | Events & community gatherings        | Malachite   |

## Common mistakes to avoid

- Pasting hex values into TSX (`className="bg-[#0047AB]"`) — use `bg-cobalt` / `bg-primary` backed by CSS variables.
- Building a parallel component library — install from this registry instead.
- Hardcoding `"545 components"` or any registry count in copy — always fetch `/api/v1/stats`.
- Using the outdated WCAG 2.x contrast ratios — APCA Lc is the standard.
- Capitalising brand wordmarks — always lowercase.
- Giving a button `rounded-md` or `rounded-lg` — always `rounded-full`.
- Writing new MDX pages for content that belongs in the `documentation_pages` Supabase table.
- Treating L9 fundi as "docs" or L10 as "meta/templates" — those mappings were wrong in older docs. L9 = fundi (Outside axis), L10 = documentation (Documentation axis).
