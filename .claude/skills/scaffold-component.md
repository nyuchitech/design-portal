# Scaffold Component Skill

## Description
Scaffold a new Mukoko UI component: generate the file, update registry.json, and verify the API serves it correctly.

## Trigger
When the user says "add a new component", "create a component", "scaffold [component name]", "I need a [X] component", or "build a new [X] for the registry".

## Instructions

You are scaffolding a new component for the Nyuchi Design Portal registry. Follow every step precisely — this registry is the canonical source for all bundu ecosystem apps.

### Step 1 — Generate the component scaffold

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

### Step 2 — Create the component file

Write the generated source to `components/ui/<name>.tsx`. Make sure to:
- Set 56px default touch target height (`h-14`) and 48px minimum (`h-12` for sm)
- Use CSS custom properties from `globals.css` — never hardcoded hex
- Add `data-slot="<name>"` to the root element
- Named exports only — `export { ComponentName, componentNameVariants }`

### Step 3 — Add to registry.json

Open `registry.json` and add the registry entry to the `items` array. Schema:

```json
{
  "name": "<name>",
  "type": "registry:ui",
  "description": "<description>",
  "dependencies": ["class-variance-authority"],
  "registryDependencies": [],
  "files": [
    { "path": "components/ui/<name>.tsx", "type": "registry:ui" }
  ]
}
```

Common `registryDependencies`: if your component uses `Button`, add `"button"`. If it uses `Badge`, add `"badge"`. These are the registry item names, not npm packages.

### Step 4 — Regenerate static files

```bash
pnpm registry:build
```

This writes `public/r/<name>.json` for CDN serving.

### Step 5 — Verify the API

```bash
curl http://localhost:3000/api/v1/ui/<name>
```

Expected: `200 OK` with `$schema`, `name`, `type`, `files[0].content` containing the source code.

### Component Rules (non-negotiable)

| Rule | Detail |
|------|--------|
| Touch targets | 56px default (`h-14`), 48px minimum (`h-12`) |
| Buttons | Always `rounded-full` — pill shape is the brand identity |
| Colors | Always Tailwind classes → CSS custom properties. Never `#hex` or `style={{}}` |
| Exports | Named only — `export { ComponentName, componentNameVariants }` |
| Slot | `data-slot="<name>"` on root element |
| client | `"use client"` only when hooks / event handlers / browser APIs used |
| Mineral strip | Always vertical — left-edge accent only |
| cn() | All className composition via `cn()` from `@/lib/utils` |

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
"use client"  // only if needed

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"  // only if polymorphic

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
        default: "h-14 px-4 text-sm",   // 56px — default touch target
        sm: "h-12 px-3 text-sm",         // 48px — minimum touch target
        lg: "h-16 px-6 text-base",       // 64px — prominent actions
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
