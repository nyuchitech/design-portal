---
name: scaffold-component
description: Use when adding a new UI component to the Nyuchi Design Portal registry — the canonical design-system source for the bundu ecosystem. Component source lives in Supabase (`components` table), not on disk. The workflow is: MCP `scaffold_component` → upsert Supabase row → `pnpm registry:sync` → verify via `/api/v1/ui/{name}`. Also use when the user says "add a new component", "scaffold [X]", or "I need a [X] component in the registry".
---

# Scaffold a Registry Component

You are adding a new component to the Nyuchi Design Portal registry. The source of truth is Supabase — the repo just holds a generated `registry.json` snapshot and a handful of primitives the portal itself imports. Follow every step.

## Step 1 — Generate the component scaffold

Use the MCP `scaffold_component` tool to generate the boilerplate:

```
scaffold_component({
  name: "<kebab-case-name>",
  description: "<one-line description>",
  variants: ["default", ...],   // visual variants
  sizes: ["default", "sm", "lg"],
  hasRadix: true/false,          // true if needs focus/keyboard/screen reader behaviour
  isClient: true/false           // true if uses hooks or event handlers
})
```

This returns the full TSX source and the registry JSON entry.

## Step 2 — Create the component file

Write the generated source to `components/ui/<name>.tsx`. Make sure to:

- Set 56px default touch target height (`h-14`) and 48px minimum (`h-12` for sm)
- Use CSS custom properties from `globals.css` — never hardcoded hex
- Add `data-slot="<name>"` to the root element
- Named exports only — `export { ComponentName, componentNameVariants }`

## Step 3 — Upsert the row into Supabase

The `components` table is the source of truth. Insert (or update by `name`) a row with:

| Column                  | Value                                                                      |
| ----------------------- | -------------------------------------------------------------------------- |
| `name`                  | kebab-case slug                                                            |
| `type`                  | `registry:ui` / `registry:hook` / `registry:lib` / `registry:block`        |
| `description`           | one-line description                                                       |
| `source_code`           | full TSX from Step 2                                                       |
| `architecture_layer`    | 1–10 (see the 10-layer table in the `nyuchi-design-system` skill)          |
| `category`              | e.g. `action`, `forms-input`, `layout`, `feedback`, `ai-chatbot`, `charts` |
| `dependencies`          | JSON array of npm package names                                            |
| `registry_dependencies` | JSON array of other registry item names (e.g. `["button", "badge"]`)       |
| `status`                | `stable` (or `alpha` / `deprecated`)                                       |

If the component has structured docs (use cases, variants, a11y notes, examples), also insert a matching row into `component_docs`. Add a `component_versions` row so the `/api/v1/ui/{name}/versions` history starts from v1.

Do not hand-edit `registry.json` — it is generated from Supabase in the next step.

## Step 4 — Sync the registry snapshot

```bash
pnpm registry:sync
```

This regenerates `registry.json` (and any committed `components/ui/*` primitive the portal itself imports) from Supabase. The dynamic API at `/api/v1/ui/<name>` reads straight from Supabase — no static CDN build required. CI runs `pnpm registry:verify` to fail if the committed snapshot drifts from the database.

## Step 5 — Verify the API

```bash
# Start the portal dev server first: pnpm dev (defaults to port 11736)
curl http://localhost:11736/api/v1/ui/<name>
```

Expected: `200 OK` with `$schema`, `name`, `type`, `files[0].content` containing the source code.

### Component Rules (non-negotiable)

| Rule          | Detail                                                                        |
| ------------- | ----------------------------------------------------------------------------- |
| Touch targets | 56px default (`h-14`), 48px minimum (`h-12`)                                  |
| Buttons       | Always `rounded-full` — pill shape is the brand identity                      |
| Colors        | Always Tailwind classes → CSS custom properties. Never `#hex` or `style={{}}` |
| Exports       | Named only — `export { ComponentName, componentNameVariants }`                |
| Slot          | `data-slot="<name>"` on root element                                          |
| client        | `"use client"` only when hooks / event handlers / browser APIs used           |
| Mineral strip | Always vertical — left-edge accent only                                       |
| cn()          | All className composition via `cn()` from `@/lib/utils`                       |

### Ubuntu Design Checklist

Every component must pass before it's registry-ready:

- [ ] **Touch target** ≥ 56px (`h-14`) default, ≥ 48px (`h-12`) minimum — outdoor use, all ages
- [ ] **APCA contrast** Lc 90+ for body text on both `#FAF9F5` (light) and `#0A0A0A` (dark)
- [ ] **Shared device safe** — no assumptions that one person owns the device
- [ ] **3G performant** — no unnecessary heavy imports, lazy-load where possible
- [ ] **Localisable** — all visible strings can be passed as props (no hardcoded English)
- [ ] **Community framing** — state and context designed for group use, not just personal

**APCA quick reference:**

- Body text → Lc 90+ (`text-foreground` on `bg-background` = Lc ~100 ✓)
- Large text / headings → Lc 75+
- UI labels / buttons → Lc 60+
- Non-text (icons, borders) → Lc 45+
- `--color-cobalt` on light bg = Lc ~78 → large text only
- `--color-tanzanite` (`#4B0082`) on light bg = Lc ~92 → body text safe ✓

### Pattern Reference

```tsx
"use client" // only if needed

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui" // only if polymorphic

import { cn } from "@/lib/utils"

const exampleVariants = cva(
  // base — always include touch target height
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-border bg-transparent hover:bg-muted",
        ghost: "hover:bg-muted hover:text-foreground",
      },
      size: {
        default: "h-14 px-4 text-sm", // 56px — default touch target
        sm: "h-12 px-3 text-sm", // 48px — minimum touch target
        lg: "h-16 px-6 text-base", // 64px — prominent actions
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Example({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof exampleVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="example"
      className={cn(exampleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Example, exampleVariants }
```
