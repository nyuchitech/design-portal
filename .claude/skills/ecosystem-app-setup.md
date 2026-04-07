# Ecosystem App Setup Skill

## Description

Bootstrap a new bundu ecosystem app using the Nyuchi Design Portal registry — installs components, sets up the correct theme tokens, typography, and theming from the canonical design system.

## Trigger

When the user says "create a new bundu app", "add a new ecosystem app", "bootstrap a mukoko app", "set up a new nyuchi product", or "start a new app in the ecosystem".

## Instructions

You are setting up a new bundu ecosystem app that consumes the Nyuchi Design Portal registry. Follow every step — consistency across the ecosystem is non-negotiable.

### Step 1 — Create the Next.js project

```bash
pnpm create next-app@latest <app-name> --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd <app-name>
```

### Step 2 — Install shadcn CLI and init

```bash
pnpm dlx shadcn@latest init
```

When prompted, choose:

- Style: **New York**
- Base color: **Neutral**
- CSS variables: **Yes**

This creates `components.json`. Update it:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### Step 3 — Copy the canonical theme tokens

Replace `app/globals.css` with the Five African Minerals theme. The canonical source is `app/globals.css` in the design-portal repo. The critical blocks are:

**Required CSS custom properties:**

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* Five African Minerals */
  --color-cobalt: #0047ab;
  --color-tanzanite: #b388ff;
  --color-malachite: #64ffda;
  --color-gold: #ffd740;
  --color-terracotta: #d4a574;

  /* Radius system — ecosystem numbers: 7, 12, 14, 17 */
  --radius-sm: 7px;
  --radius-md: 12px;
  --radius-lg: 14px;
  --radius-xl: 17px;
  --radius-full: 9999px;

  /* Fonts */
  --font-sans: var(--font-noto-sans);
  --font-serif: var(--font-noto-serif);
  --font-mono: var(--font-jetbrains-mono);
}

:root {
  --background: #faf9f5;
  --foreground: #141413;
  /* ... full token set from design-portal/app/globals.css */
}

.dark {
  --background: #0a0a0a;
  --foreground: #f5f5f4;
  /* ... */
}
```

Copy the complete `:root` and `.dark` blocks verbatim from the design-portal source.

### Step 4 — Set up typography

```bash
pnpm add @next/font
```

In `app/layout.tsx`:

```tsx
import { Noto_Sans, Noto_Serif, JetBrains_Mono } from "next/font/google"

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  display: "swap",
})

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-noto-serif",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${notoSans.variable} ${notoSerif.variable} ${jetbrainsMono.variable} font-sans`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Step 5 — Set up next-themes

```bash
pnpm add next-themes
```

Create `components/theme-provider.tsx`:

```tsx
"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### Step 6 — Install core components from the registry

```bash
# Utilities (always install first)
npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/utils

# Core UI
npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/button
npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/card
npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/input
npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/badge
npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/separator

# Resilience (recommended for all production apps)
npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/observability
npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/circuit-breaker
npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/retry
```

Install additional components as needed from the 294-item registry.

### Step 7 — Configure PostCSS for Tailwind CSS 4

Ensure `postcss.config.mjs`:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
```

And `package.json` dependencies include `tailwindcss@^4` and `@tailwindcss/postcss`.

### Step 8 — Set up the layered architecture

```
app/
├── layout.tsx              # Root layout (fonts, ThemeProvider)
├── page.tsx                # Landing page orchestrator
├── globals.css             # Theme tokens (copied from design-portal)
components/
├── ui/                     # Installed from registry
├── [feature]/              # Domain-specific composites
├── theme-provider.tsx
lib/
├── utils.ts                # cn() helper (from registry)
hooks/
```

**Layered rule:** primitives → composites → orchestrators → error boundaries → server pages. Never import upward.

### Key Rules for All Ecosystem Apps

| Rule                  | Detail                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| Install from registry | Never copy-paste component code — always `npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/<name>` |
| Colors                | Always CSS custom properties — never hardcoded hex                                                          |
| Buttons               | Always `rounded-full` — pill shape is brand identity                                                        |
| Touch targets         | 56px default, 48px minimum                                                                                  |
| Typography            | Noto Sans (body), Noto Serif (display), JetBrains Mono (code)                                               |
| Wordmarks             | Always lowercase: `mukoko`, `nyuchi`, `shamwari`, `bundu`, `nhimbe`                                         |
| Theme                 | `next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`                             |

### Ubuntu Layer — Community-First from Day One

Every bundu ecosystem app must embed Ubuntu principles from setup, not as an afterthought:

**Step 9 — Install the accessibility and AI safety libraries**

```bash
npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/accessibility
npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/ai-safety
```

`lib/accessibility.ts` provides:

- `apcaContrast(text, bg)` — compute APCA Lc contrast value
- `MINERAL_CONTRAST_TABLE` — pre-computed Lc values for all minerals
- `TOUCH_TARGETS` — `{ default: 56, minimum: 48, css: { default: "h-14", minimum: "h-12" } }`
- `COMPONENT_CHECKLIST` — 15-point Ubuntu/APCA checklist

`lib/ai-safety.ts` provides:

- `fullSafetyCheck(input)` — combined injection + security + cultural scan
- `validateCulturalContext(text)` — Ubuntu alignment, Western-centric assumption detection
- `AICircuitBreaker` — circuit breaker for AI calls
- `withAISafety(fn, fallback, timeoutMs)` — safe AI call wrapper
- `UBUNTU` — Ubuntu philosophy constants for AI system prompts

**Ubuntu runtime rules:**

- Use `UBUNTU.aiFraming` in every Claude/AI system prompt
- Run `validateCulturalContext()` on AI output before rendering
- Use `withAISafety()` wrapper on every AI API call
- Set `lang="sn"` / `lang="nd"` on multilingual content blocks
- Never gate content behind English-only — internationalise from day one

### Brand Assignment

Every app has an assigned mineral accent. Use it for the app's primary brand colour:

| App type                  | Brand    | Mineral              | CSS Variable         |
| ------------------------- | -------- | -------------------- | -------------------- |
| Consumer/super app        | mukoko   | Tanzanite `#B388FF`  | `--color-tanzanite`  |
| Enterprise/infrastructure | nyuchi   | Gold `#FFD740`       | `--color-gold`       |
| AI companion              | shamwari | Cobalt `#0047AB`     | `--color-cobalt`     |
| Events/gatherings         | nhimbe   | Malachite `#64FFDA`  | `--color-malachite`  |
| Ecosystem-level           | bundu    | Terracotta `#D4A574` | `--color-terracotta` |
