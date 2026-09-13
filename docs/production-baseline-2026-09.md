# NEXORA Production Baseline — September 2026

## Purpose

This document records the current production baseline after the image optimization, Aether CI compatibility fix, and controlled CSS-only Reveal experiment.

## Repository

- Repository: `ghandon183-glitch/nexora-core`
- Branch: `main`
- Baseline commit: `cce4973d68ad24ab0a2d48e75df9613591860207`
- Commit: `perf(experiment): CSS-only Reveal for Templates/Pricing/Testimonials/Trusted-by`

## Current baseline metrics

Latest reported production Lighthouse Mobile results:

- Performance: **81**
- First Contentful Paint: **1.0 s**
- Largest Contentful Paint: **2.3 s**
- Total Blocking Time: **40 ms**
- Cumulative Layout Shift: **0.341**
- Speed Index: **3.4 s**

These values are a reference snapshot, not a permanent guarantee; Lighthouse results can vary between runs.

## Confirmed work

- Cloudflare Images `IMAGES` binding enabled and verified according to the deployment report.
- Aether CI dependency compatibility fixed and deployment reported healthy.
- CSS-only shared-observer Reveal experiment retained because of the substantial reported reduction in main-thread blocking.
- Hero implementation remains protected and was not changed by the Reveal experiment.

## Known follow-up items

- CLS remains above target.
- Reported CLS sources:
  - `.nx-hero-ghost` — pre-existing Hero-related source; do not modify Hero without an explicit, isolated task.
  - `a.nx-card > img` — reported image-card layout shift; investigate reserved image dimensions/aspect ratio in a separate task.
- Dependency audit remains open and intentionally outside this scope. Do not run `npm audit fix --force` without a controlled compatibility plan.

## Change-control rules

Future work must be performed in a separate branch and validated before merging to `main`:

- Preserve Hero behavior, geometry, responsive behavior, reduced-motion behavior, and animation logic.
- Preserve the current Reveal implementation unless an isolated experiment explicitly targets it.
- Do not change products, prices, slugs, routes, links, buttons, checkout, payment, download, or SEO without an explicitly scoped task.
- Run typecheck, lint, production build, Cloudflare build, CI, and production smoke tests for relevant changes.
- Compare Lighthouse metrics before and after any performance change.
