# Mukoko Design System Skill

## Description
Reference and scaffold components for the Mukoko design system — the Five African Minerals palette, 70+ production-ready React UI components, and brand guidelines for the Mukoko ecosystem.

## Trigger
When the user asks about Mukoko design tokens, component patterns, brand colors, typography, or wants to create/scaffold a new component for any Mukoko app.

## Instructions

You are an expert on the Mukoko design system (Five African Minerals). When the user asks about the design system or needs to build components, follow these guidelines:

### Design Token Reference

**Five African Minerals Palette** (constant across light/dark):
| Mineral    | Hex       | CSS Variable         | Usage                          |
|------------|-----------|----------------------|--------------------------------|
| Cobalt     | #0047AB   | --color-cobalt       | Primary blue, links, CTAs      |
| Tanzanite  | #B388FF   | --color-tanzanite    | Purple accent, brand/logo      |
| Malachite  | #64FFDA   | --color-malachite    | Cyan accent, success states    |
| Gold       | #FFD740   | --color-gold         | Yellow accent, rewards         |
| Terracotta | #D4A574   | --color-terracotta   | Warm accent, community         |

**Semantic Colors** (theme-adaptive):
| Token            | Light     | Dark      |
|------------------|-----------|-----------|
| --background     | #FAF9F5   | #0A0A0A   |
| --foreground     | #141413   | #F5F5F4   |
| --card           | #FFFFFF   | #141414   |
| --muted          | #F3F2EE   | #1E1E1E   |
| --primary        | #141413   | #F5F5F4   |
| --destructive    | #B3261E   | #F2B8B5   |

**Typography:**
- Body: Noto Sans (--font-sans)
- Display/Headings: Noto Serif (--font-serif)
- Code: JetBrains Mono (--font-mono)

**Radius System:**
- --radius: 0.75rem (base)
- --radius-sm through --radius-4xl

### Component Pattern (CVA + Radix + cn)

Every Mukoko component follows this pattern:

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"  // only if polymorphic
import { cn } from "@/lib/utils"

const componentVariants = cva(
  "base-classes-here",
  {
    variants: {
      variant: { default: "...", outline: "...", ghost: "..." },
      size: { default: "h-9 px-3", sm: "h-8 px-3", lg: "h-10 px-4" },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

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

### Scaffolding a New Component

When the user wants to create a new component:

1. **Create the file** at `components/ui/<name>.tsx` following the CVA + Radix + cn() pattern
2. **Add to registry.json** with name, type, description, dependencies, and files
3. **Run** `pnpm registry:build` to regenerate static files
4. **Verify** via `curl http://localhost:3000/api/v1/ui/<name>`

### Key Rules
- NEVER use hardcoded hex colors — always use Tailwind classes backed by CSS custom properties
- Use `cn()` from `@/lib/utils` for ALL className composition
- Named exports only (no default exports)
- File naming: kebab-case for files, PascalCase for components
- Add `data-slot` attribute to root element
- Add `"use client"` only when hooks, event handlers, or browser APIs are used
- All brand wordmarks are lowercase: mukoko, nyuchi, shamwari, bundu, nhimbe

### Install Command
```bash
npx shadcn@latest add https://registry.mukoko.com/api/v1/ui/<component-name>
```

### Ecosystem Brands
| Brand    | Meaning    | Language | Role               | Mineral    |
|----------|------------|----------|--------------------|------------|
| bundu    | Wilderness | Shona    | Parent ecosystem   | Terracotta |
| nyuchi   | Bee        | Shona    | Action layer       | Gold       |
| mukoko   | Beehive    | Shona    | Structure layer    | Tanzanite  |
| shamwari | Friend     | Shona    | Intelligence layer | Cobalt     |
| nhimbe   | Gathering  | Shona    | Events layer       | Malachite  |
