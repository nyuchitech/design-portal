"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Github, ExternalLink, Menu, X } from "lucide-react"

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-foreground">
            <span className="text-sm font-bold text-background">m</span>
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">mukoko</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">registry</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <a
            href="#components"
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Components
          </a>
          <a
            href="#catalog"
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Catalog
          </a>
          <a
            href="https://assets.nyuchi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Brand
            <ExternalLink className="size-3" />
          </a>
          <a
            href="/api/r"
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            API
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <a
              href="https://github.com/nyuchitech/mukoko-registry"
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              <Github className="size-4" />
              <span className="text-sm">GitHub</span>
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex md:hidden">
            <a
              href="https://github.com/nyuchitech/mukoko-registry"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
            >
              <Github className="size-4" />
            </a>
          </Button>
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
          <a
            href="#components"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Components
          </a>
          <a
            href="#catalog"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Catalog
          </a>
          <a
            href="https://assets.nyuchi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Brand
            <ExternalLink className="size-3" />
          </a>
          <a
            href="/api/r"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            API
          </a>
          <a
            href="https://github.com/nyuchitech/mukoko-registry"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Github className="size-4" />
            GitHub
          </a>
        </nav>
      )}
    </header>
  )
}
