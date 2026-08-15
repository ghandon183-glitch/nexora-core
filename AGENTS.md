# NEXORA — Repository Knowledge

## Project
NEXORA is a Next.js 16 premium template marketplace deployed on Cloudflare.
Templates are showcased via live demos (`public/demo/<slug>/`) built as Next.js
static exports, downloadable source ZIPs (`public/downloads/<slug>.zip`), and
marketplace metadata in `lib/data/templates.ts`.

## Critical Constraints
- **Wallet addresses in `lib/orders/pricing.ts` are production and MUST NOT be
  changed.** USDT: `TTs2YMrifwWhiEPWVxhqqHd7v5DZNu477R`, BTC:
  `bc1qky4uvdn0v9kyha9v9wns5893f62djd8ssa04u0`.
- Do NOT modify templates other than the one being worked on.

## Template Build/Deploy Workflow
Each template (e.g. `premium-portfolio`) lives as a standalone Next.js project.
The workflow to update one:
1. Develop in the template source dir (e.g. `/tmp/portfolio-src/premium-portfolio`).
2. Build static export with basePath:
   `NEXT_PUBLIC_BASE_PATH=/demo/<slug> npm run build` → `out/`.
3. Replace `public/demo/<slug>/` with the fresh `out/` contents.
4. Regenerate marketplace gallery images + thumbnail (2560×1440 JPEG) — a
   script at `<template>/scripts/gen-gallery.py` does this for premium-portfolio.
5. Rebuild the source ZIP: use Python `zipfile` (no `zip` binary available),
   preserving the `<slug>/` prefix, excluding `node_modules`, `.next`, `out`.
6. Update the `lib/data/templates.ts` entry (features, description, version,
   changelog) if the redesign changes scope.
7. Lint + typecheck the marketplace: `npm run lint && npx tsc --noEmit`.

## Testing Demos Locally
The demo HTML uses basePath `/demo/<slug>` (relative to the Next.js `public/`
root). To serve correctly with Python's http.server, serve FROM `public/`:
`python3 -m http.server 8765 --directory public` so `/demo/<slug>/` resolves to
`public/demo/<slug>/`. Serving from the repo root causes basePath 404s.

## Premium Portfolio (v2.0.0) — STUDIO NORTH redesign
- Interactive React Three Fiber depth-displaced hero (`components/hero-canvas.tsx`)
  with pointer parallax, faked bloom (additive emissive + CSS layers), scanlines.
- Static hero image always rendered as base layer (progressive enhancement) so
  the hero looks premium even without WebGL (headless browsers lack WebGL).
- R3F Canvas is dynamically imported with `ssr: false`; mutable animation state
  in refs for React Compiler compatibility.
- Sections: Hero → TechStrip (marquee) → About (studio) → Projects → Services
  (capabilities) → Contact → Footer.
- Removed old components: timeline, skills, testimonials, tech-stack.
- Fonts self-hosted via `@fontsource` (Space Grotesk + Inter), no external requests.
- `eslint.config.mjs` was a pre-existing bug (TS syntax in .mjs) — fixed with
  valid ESM `defineConfig`.

## Environment Notes
- No `zip` binary — use Python `zipfile` module.
- Headless browser (Chromium) lacks reliable WebGL; screenshots of WebGL
  canvases appear black. Verify via the static-image base layer instead.
- `next/image` with `images.unoptimized: true` + `fill` works in static export;
  below-fold images lazy-load — scroll to section + wait before screenshotting.
