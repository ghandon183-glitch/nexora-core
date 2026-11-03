#!/usr/bin/env python3
"""Harden the exact ZIPs sold by Nexora without bundling node_modules or secrets."""
import json, os, re, shutil, subprocess, tempfile, zipfile
from pathlib import Path

ROOT = Path("public/downloads")
STABLE_NEXT = "16.4.3"
PRODUCTS = {
    "aether": ("AETHER — Creative Studio", "An immersive creative-studio experience built around a cinematic WebGL hero, 3D presentation, project showcase, motion, and responsive editorial composition."),
    "aurelia-store": ("Aurelia Store", "A boutique storefront presentation for jewelry, ceramics, home objects, and visually led commerce."),
    "admin-dashboard": ("Admin Dashboard", "A responsive admin UI foundation with analytics, navigation, tables, settings, and role-management screens."),
    "creative-agency": ("Creative Agency", "A portfolio and case-study presentation system for creative agencies and independent studios."),
    "kiln-estates": ("Kiln Estates", "A restrained property presentation for boutique real-estate brands and high-end listings."),
    "modern-saas": ("Modern SaaS", "A SaaS marketing foundation with pricing, feature, FAQ, and conversion sections."),
    "nexi-ai": ("Nexi AI", "An AI-product marketing foundation with product storytelling, bento features, pricing, and FAQ sections."),
    "premium-blog": ("Premium Blog", "An editorial blog foundation for long-form content and responsive reading."),
    "premium-portfolio": ("Studio North", "A cinematic portfolio foundation with motion, project presentation, and responsive layouts."),
    "premium-restaurant": ("Premium Restaurant", "A restaurant presentation foundation for menus, venue details, and customer enquiries."),
    "solace-studio": ("Solace Studio", "A wellness-studio presentation for classes, trainers, schedules, pricing, and galleries."),
    "Nexora-Template-12-Vesper-v1.0.0": ("Vesper", "A responsive static template package. No Node.js build is required unless the package includes a package.json."),
}
TEXT_EXTS = {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".html", ".json", ".md", ".css", ".txt"}

def safe_extract(zf, dest):
    base = dest.resolve()
    for info in zf.infolist():
        p = Path(info.filename)
        if p.is_absolute() or ".." in p.parts or ((info.external_attr >> 16) & 0o170000) == 0o120000:
            raise RuntimeError(f"Unsafe ZIP entry: {info.filename}")
        target = (dest / p).resolve()
        if target != base and base not in target.parents:
            raise RuntimeError(f"ZIP entry escapes package root: {info.filename}")
    zf.extractall(dest)

def choose_root(dest):
    if (dest / "package.json").exists() or (dest / "index.html").exists():
        return dest
    top = [p for p in dest.iterdir() if p.name != "__MACOSX"]
    if len(top) == 1 and top[0].is_dir():
        return top[0]
    candidates = list(dest.rglob("package.json"))
    if len(candidates) == 1:
        return candidates[0].parent
    htmls = list(dest.rglob("index.html"))
    if len(htmls) == 1:
        return htmls[0].parent
    return dest

def read_text(p):
    try:
        return p.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return ""

def find_env_names(root):
    found = set()
    pattern = re.compile(r"""(?:process\.env\.([A-Z][A-Z0-9_]*)|import\.meta\.env\.([A-Z][A-Z0-9_]*)|process\.env\[['"]([A-Z][A-Z0-9_]*)['"]\])""")
    for p in root.rglob("*"):
        if not p.is_file() or p.suffix.lower() not in TEXT_EXTS or "node_modules" in p.parts or p.stat().st_size > 2_000_000:
            continue
        for match in pattern.finditer(read_text(p)):
            name = next((g for g in match.groups() if g), "")
            if name and name not in {"NODE_ENV", "NEXT_RUNTIME", "TURBOPACK"}:
                found.add(name)
    return sorted(found)

def write_readme(root, key, title, description, pkg):
    p = root / "README.md"
    if p.exists() and read_text(p).strip() and "This template is a starting point" not in read_text(p):
        return
    next_ver = ((pkg or {}).get("dependencies", {}).get("next") or (pkg or {}).get("devDependencies", {}).get("next"))
    scripts = (pkg or {}).get("scripts", {})
    sections = [f"# {title}", "", description, "", "## Included",
                "- Template source and assets contained in this archive.",
                "- ASSET-LICENSES.md, when present, lists known third-party asset attributions and license notes.", "",
                "## Requirements"]
    if pkg:
        sections += ["", "## Package details", f"- Package: {pkg.get('name', key)}", f"- Package manifest version: {pkg.get('version', 'not specified')}"]
        if next_ver: sections += [f"- Next.js: {next_ver}"]
        tailwind = pkg.get("dependencies", {}).get("tailwindcss", pkg.get("devDependencies", {}).get("tailwindcss"))
        if tailwind: sections += [f"- Tailwind CSS: {tailwind}"]
        top_entries = []
        for item in sorted(root.iterdir(), key=lambda x: x.name.lower()):
            if item.name in {"node_modules", ".next", ".git", ".env", ".env.local", ".env.production", ".env.development"}: continue
            top_entries.append(item.name + ("/" if item.is_dir() else ""))
        if top_entries: sections += ["", "## Project structure"] + [f"- {name}" for name in top_entries[:35]]
    if pkg:
        sections += ["- Node.js 22 LTS is recommended.", "- npm (included with Node.js)."]
        if next_ver:
            sections += [f"- Framework: Next.js {next_ver}; see package.json for the dependency list."]
        sections += ["", "## Quick start", "1. Extract this ZIP into a new project folder.",
                     "2. Install the required Node.js version, then run: npm ci",
                     "3. Copy .env.example to .env.local if the project uses environment variables; fill in only values required by integrations you enable."]
        if "dev" in scripts:
            sections += ["4. Start the development server: npm run dev", "5. Open the local URL printed by Next.js (normally http://localhost:3000)."]
        else:
            sections += ["4. Use the scripts listed in package.json."]
        if "build" in scripts:
            sections += ["", "## Production verification", "Run: npm run build"]
            if "start" in scripts:
                sections += ["To test the production build locally, run: npm run start."]
        if scripts:
            sections += ["", "## Available npm scripts"] + [f"- {name}: {command}" for name, command in sorted(scripts.items())]
        sections += ["", "## Customization",
                     "- Replace demo copy, placeholder content, links, and imagery with assets and claims you have permission to use.",
                     "- Connect forms, authentication, databases, analytics, checkout, or CMS integrations yourself; do not assume a backend service is included unless it is present in this package.",
                     "- Review SEO metadata, accessibility, reduced-motion behavior, and small-screen layouts before launch."]
        if key == "aether": sections += ["- The included UI components are in the source; the optional shadcn generator CLI is not bundled."]
    else:
        sections += ["- A modern web browser.", "- Python 3 (optional, for a local preview).", "",
                     "## Quick start", "1. Extract this ZIP.", "2. Open index.html in a browser, or run a local server:",
                     "   python -m http.server 4173", "3. Visit http://localhost:4173."]
    sections += ["", "## Updates",
                 "This ZIP does not install updates automatically. Check the Nexora product page or your purchase/download area for new releases. Back up customizations, compare changed files, merge your content into the new release, reinstall dependencies with npm ci when a lockfile is present, and run the production build.",
                 "", "## License and support",
                 "LICENSE.md in this archive contains the controlling package-level license. The website license page is a plain-language summary; review the included license before deployment or redistribution:",
                 "- License: https://nexora-core.nxora.workers.dev/en/license",
                 "- Refunds: https://nexora-core.nxora.workers.dev/en/refunds",
                 "- Support: https://nexora-core.nxora.workers.dev/en/support",
                 "", "This template is a starting point, not a hosted backend or a guarantee that third-party integrations are configured. Review LICENSE.md and ASSET-LICENSES.md if present.", ""]
    p.write_text("\n".join(sections), encoding="utf-8")


def replace_source(root, relative, old, new):
    path = root / relative
    current = read_text(path)
    if not current:
        raise RuntimeError(f"Expected AETHER source file is missing or unreadable: {relative}")
    if new and new in current:
        return
    if old not in current:
        if not new:
            return
        raise RuntimeError(f"Expected AETHER source snippet was not found in {relative}; refusing a silent partial patch.")
    path.write_text(current.replace(old, new, 1), encoding="utf-8")

def patch_aether_source(root):
    replace_source(root, "components/motion/cursor.tsx",
        "    setEnabled(true)\n    document.documentElement.classList.add('has-cursor')",
        "    const enableFrame = window.requestAnimationFrame(() => setEnabled(true))\n    document.documentElement.classList.add('has-cursor')")
    replace_source(root, "components/motion/cursor.tsx",
        "      cancelAnimationFrame(raf)\n      window.removeEventListener('pointermove', onMove)",
        "      cancelAnimationFrame(raf)\n      cancelAnimationFrame(enableFrame)\n      window.removeEventListener('pointermove', onMove)")
    replace_source(root, "components/motion/reveal.tsx",
        "import type { ReactNode } from 'react'",
        "import { createElement, type ReactNode } from 'react'")
    replace_source(root, "components/motion/reveal.tsx",
        "    const Comp = Tag as any\n    return <Comp className={className}>{text}</Comp>",
        "    return createElement(Tag, { className }, text)")
    replace_source(root, "components/motion/reveal.tsx",
        "  const MotionTag = motion[Tag] as any",
        "  const MotionTag = {\n    span: motion.span,\n    h1: motion.h1,\n    h2: motion.h2,\n    h3: motion.h3,\n    p: motion.p,\n  }[Tag]")
    replace_source(root, "components/webgl/hero-scene.tsx",
        "import { useEffect, useMemo, useRef, useState } from 'react'",
        "import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'")
    replace_source(root, "components/webgl/hero-scene.tsx",
        "function Core({ reducedMotion }: { reducedMotion: boolean }) {",
        "function randomUnit(seed: number) {\n  const value = Math.sin(seed * 12.9898) * 43758.5453\n  return value - Math.floor(value)\n}\n\nfunction Core({ reducedMotion, pointerRef, scrollRef }: {\n  reducedMotion: boolean\n  pointerRef: MutableRefObject<THREE.Vector2>\n  scrollRef: MutableRefObject<number>\n}) {")
    replace_source(root, "components/webgl/hero-scene.tsx",
        "  const pointer = useRef(new THREE.Vector2(0, 0))",
        "  const pointer = pointerRef")
    replace_source(root, "components/webgl/hero-scene.tsx",
        "    let scroll = 0\n    const onScroll = () => {\n      scroll = Math.min(window.scrollY / (window.innerHeight || 1), 1)\n    }",
        "    const onScroll = () => {\n      scrollRef.current = Math.min(window.scrollY / (window.innerHeight || 1), 1)\n    }\n    onScroll()")
    replace_source(root, "components/webgl/hero-scene.tsx",
        "    ;(Core as any)._pointer = () => pointer.current\n    ;(Core as any)._scroll = () => scroll\n",
        "")
    replace_source(root, "components/webgl/hero-scene.tsx",
        "    u.uScroll.value = (Core as any)._scroll ? (Core as any)._scroll() : 0",
        "    u.uScroll.value = scrollRef.current")
    replace_source(root, "components/webgl/hero-scene.tsx",
        "function Atmosphere({ reducedMotion }: { reducedMotion: boolean }) {",
        "function Atmosphere({ reducedMotion, pointerRef }: {\n  reducedMotion: boolean\n  pointerRef: MutableRefObject<THREE.Vector2>\n}) {")
    replace_source(root, "components/webgl/hero-scene.tsx",
        "    const p = (Core as any)._pointer ? (Core as any)._pointer() : { x: 0, y: 0 }",
        "    const p = pointerRef.current")
    replace_source(root, "components/webgl/hero-scene.tsx",
        "      const r = 2.2 + Math.random() * 3.4\n      const theta = Math.random() * Math.PI * 2\n      const phi = Math.acos(2 * Math.random() - 1)",
        "      const r = 2.2 + randomUnit(i * 4 + 1) * 3.4\n      const theta = randomUnit(i * 4 + 2) * Math.PI * 2\n      const phi = Math.acos(2 * randomUnit(i * 4 + 3) - 1)")
    replace_source(root, "components/webgl/hero-scene.tsx",
        "      scales[i] = Math.random()",
        "      scales[i] = randomUnit(i * 4 + 4)")
    replace_source(root, "components/webgl/hero-scene.tsx",
        "function Scene({ reducedMotion }: { reducedMotion: boolean }) {\n  return (\n    <>\n      <Core reducedMotion={reducedMotion} />\n      <Atmosphere reducedMotion={reducedMotion} />\n    </>\n  )\n}",
        "function Scene({ reducedMotion }: { reducedMotion: boolean }) {\n  const pointerRef = useRef(new THREE.Vector2(0, 0))\n  const scrollRef = useRef(0)\n  return (\n    <>\n      <Core reducedMotion={reducedMotion} pointerRef={pointerRef} scrollRef={scrollRef} />\n      <Atmosphere reducedMotion={reducedMotion} pointerRef={pointerRef} />\n    </>\n  )\n}")
    replace_source(root, "app/layout.tsx",
        "import { Analytics } from '@vercel/analytics/next'\n",
        "")
    replace_source(root, "app/layout.tsx",
        "        {process.env.NODE_ENV === 'production' && <Analytics />}\n",
        "")

    # The shadcn CLI is intentionally removed from the shipped dependencies.
    # Remove its stale CSS entrypoint, which is not a published runtime stylesheet,
    # while preserving Tailwind and the template's own CSS.
    css_file = root / "app" / "globals.css"
    css_text = read_text(css_file)
    if css_text:
        cleaned_css = re.sub(
            r"""(?m)^\s*@import\s+['"]shadcn/tailwind\.css['"]\s*;[ \t]*(?:\r?\n|$)""",
            "",
            css_text,
        )
        if cleaned_css != css_text:
            css_file.write_text(cleaned_css, encoding="utf-8")
        if re.search(r"shadcn/tailwind\.css", read_text(css_file), re.I):
            raise RuntimeError("AETHER still imports removed shadcn/tailwind.css; refusing to ship a broken ZIP.")


A11Y_TEXT_REPLACEMENTS = {
    "kiln-estates": [
        (r"--clay\s*:\s*#b5562d\s*;", "--clay:#8f4021;"),
        ("text-forest/60", "text-forest/85"),
        ("text-forest/50", "text-forest/80"),
    ],
    "modern-saas": [
        (r"--moss-bright\s*:\s*#5c8768\s*;", "--moss-bright:#7cae87;"),
        ("text-text-muted/30", "text-text-muted"),
    ],
    "nexi-ai": [
        ("text-slate-500", "text-slate-300"),
        ("text-slate-400", "text-slate-300"),
    ],
    "premium-blog": [
        (r"--color-accent\s*:\s*#c2410c\s*;", "--color-accent:#9a3412;"),
        ("text-ink-mute", "text-ink-soft"),
    ],
    "premium-restaurant": [
        ("text-ink-mute", "text-ink-soft"),
    ],
    "solace-studio": [
        (r"--color-clay\s*:\s*#c4623c\s*;", "--color-clay:#8f4021;"),
        ("text-cream/45", "text-cream/80"),
        ("text-cream/40", "text-cream/80"),
    ],
    "admin-dashboard": [
        (r"--teal-bright\s*:\s*#17767d\s*;", "--teal-bright:#4cc9d0;"),
        (r"--danger\s*:\s*#e0563f\s*;", "--danger:#ff8b78;"),
    ],
    "aurelia-store": [
        (r"--coral\s*:\s*#e17a57\s*;", "--coral:#9f4328;"),
        (r"--coral-deep\s*:\s*#c85f3d\s*;", "--coral-deep:#87391f;"),
    ],
    "creative-agency": [
        (r"--violet\s*:\s*#8b5cf6\s*;", "--violet:#6d28d9;"),
        ("text-text-muted/50", "text-text-muted"),
    ],
    "premium-portfolio": [
        (r"--color-ink-mute\s*:\s*#6b6b75\s*;", "--color-ink-mute:#9a9aa3;"),
    ],
    "vesper": [],
}



def replace_all_source(root, relative, old, new):
    path = root / relative
    current = read_text(path)
    if new in current and old not in current:
        return
    if old not in current:
        raise RuntimeError(f"Expected source snippet was not found in {relative}; refusing a silent partial patch.")
    path.write_text(current.replace(old, new), encoding="utf-8")

def patch_nexi_ai_source(root):
    # Nexi AI is a front-end landing-page template, not a hosted AI product.
    replace_source(root, "components/hero.tsx",
        """const STATS = [
  { value: "2.4M+", label: "Conversations handled" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "<200ms", label: "Avg response time" },
];""",
        """const STATS = [
  { value: "Your data", label: "Connect approved knowledge sources" },
  { value: "Your rules", label: "Configure verified safeguards" },
  { value: "Your team", label: "Keep escalation under your control" },
];""")
    replace_source(root, "components/hero.tsx", "Live AI Agent Platform", "AI support landing page template")
    replace_source(root, "components/hero.tsx",
        "Ship a production-ready AI support agent in a weekend — trained on your docs,\n            wired to your tools, and live on your site by tonight. No ML team required.",
        "A polished starting point for an AI support product website. Customize the copy,\n            connect your real services, and publish only capabilities you have verified.")
    replace_source(root, "components/agent-chat-card.tsx", "Nexi Assistant", "Example assistant")
    replace_source(root, "components/agent-chat-card.tsx", "Online — replies instantly", "Illustrative sample")
    replace_source(root, "components/agent-chat-card.tsx", "Live", "DEMO")
    replace_source(root, "components/agent-chat-card.tsx",
        "Hi! Can I get a refund on order #4821? It arrived damaged.",
        "I need help with an order that arrived damaged.")
    replace_source(root, "components/agent-chat-card.tsx",
        "So sorry about that! I&apos;ve checked order #4821 — I can issue a full refund\n            right now, or send a free replacement. Which works better?",
        "This example shows how a support agent might explain next steps. A real product\n            must verify the order and follow its configured refund policy.")
    replace_source(root, "components/agent-chat-card.tsx", "Resolved in 12s", "Example workflow")
    replace_source(root, "components/agent-chat-card.tsx", "No human handoff needed", "Illustrative content only")
    replace_source(root, "components/agent-chat-card.tsx", "Type a message...", "Demo input — not connected")
    replace_source(root, "components/features.tsx", "Trained on your docs", "Knowledge sources")
    replace_source(root, "components/features.tsx",
        "Point it at your help center, PDFs, or a Notion workspace. It learns your product in minutes, not weeks.",
        "Describe the sources your implementation can actually ingest and the setup steps required.")
    replace_source(root, "components/features.tsx", "20+ integrations", "Your integrations")
    replace_source(root, "components/features.tsx",
        "Slack, Zendesk, Stripe, and your own API — connect in a few clicks.",
        "List only integrations your product really supports and that you have tested.")
    replace_source(root, "components/features.tsx", "Sub-200ms replies", "Measured response times")
    replace_source(root, "components/features.tsx",
        "Edge-deployed inference keeps conversations feeling instant.",
        "Add response-time benchmarks only after measuring them in your own deployment.")
    replace_source(root, "components/features.tsx", "Guardrails built in", "Configurable controls")
    replace_source(root, "components/features.tsx",
        "Set boundaries on tone, topics, and actions the agent can take — with a human handoff for anything outside them.",
        "Explain the controls, permissions, and human-escalation paths your implementation really provides.")
    replace_source(root, "components/features.tsx", "Live analytics", "Operational analytics")
    replace_source(root, "components/features.tsx",
        "Resolution rate, sentiment, and drop-off, updated in real time.",
        "Show only metrics your deployed product actually measures and can substantiate.")
    replace_source(root, "components/features.tsx", "40+ languages", "Language support")
    replace_source(root, "components/features.tsx",
        "Detects and replies in the customer's language automatically.",
        "List supported languages only after validating answer quality in each language.")
    replace_source(root, "components/features.tsx",
        "Not a chatbot that reads from a script — an agent that checks real data before it answers.",
        "Use this section to describe verified product capabilities, integrations, and safeguards.")
    replace_source(root, "components/how-it-works.tsx", "Live in an afternoon, not a quarter", "A clear path from setup to launch")
    replace_source(root, "components/how-it-works.tsx",
        "Link your docs, help center, and APIs. Nexi indexes everything automatically.",
        "Connect the knowledge sources supported by your implementation and verify the sync.")
    replace_source(root, "components/how-it-works.tsx",
        "Define what the agent can do, say, and escalate — in plain language, no code.",
        "Configure the instructions, permissions, and escalation rules your product supports.")
    replace_source(root, "components/how-it-works.tsx",
        "Drop a single snippet into your site. The agent is live and learning immediately.",
        "Integrate the approved widget or API and test it in a staging environment before launch.")
    replace_source(root, "components/how-it-works.tsx", "Watch it resolve tickets", "Monitor and improve")
    replace_source(root, "components/how-it-works.tsx",
        "Track every conversation, reasoning step, and outcome from the live dashboard.",
        "Use your real analytics and support workflows to measure quality after deployment.")
    replace_source(root, "components/logo-strip.tsx",
        'const STACK = ["Next.js", "OpenAI", "Anthropic", "Slack", "Zendesk", "Stripe"];',
        'const STACK = ["Help center", "CRM", "Support inbox", "Analytics", "Billing", "Your API"];')
    replace_source(root, "components/logo-strip.tsx", "Connects with", "Example categories")
    replace_source(root, "components/pricing.tsx",
        '<div className="mt-16 grid gap-6 lg:grid-cols-3">',
        '<p className="mt-5 text-center text-sm text-slate-300">Sample plans and prices — replace these with your actual offer and terms before publishing.</p>\n        <div className="mt-10 grid gap-6 lg:grid-cols-3">')
    replace_all_source(root, "components/pricing.tsx", 'href="#"', 'href="#contact"')
    replace_source(root, "components/cta.tsx",
        '<section className="relative overflow-hidden py-24 lg:py-32">',
        '<section id="contact" className="relative overflow-hidden py-24 lg:py-32">')
    replace_source(root, "components/cta.tsx", "Your first agent is free to build.", "Ready to make this template yours?")
    replace_source(root, "components/cta.tsx",
        "Connect a data source and have it answering real questions in the next ten minutes.",
        "Connect your real signup, contact, or demo destination here before publishing.")
    replace_source(root, "components/cta.tsx", "Start Building Free", "Explore sample pricing")
    replace_source(root, "components/nav.tsx",
        'href="#" className="text-sm font-medium text-slate-300 hover:text-white"',
        'href="#contact" className="text-sm font-medium text-slate-300 hover:text-white"')
    replace_all_source(root, "components/footer.tsx",
        '<h4 className="text-sm font-semibold text-white">',
        '<h3 className="text-sm font-semibold text-white">')
    replace_all_source(root, "components/footer.tsx", "</h4>", "</h3>")
    replace_all_source(root, "components/footer.tsx", 'href="#"', 'href="#contact"')

    testimonials = root / "components" / "testimonials.tsx"
    if testimonials.exists():
        testimonials.write_text("""const ITEMS = [
  {
    title: "Verified outcomes",
    body: "Publish measurable results only when you can substantiate them.",
    note: "Add an approved metric and its source",
  },
  {
    title: "Real customer voices",
    body: "Use customer quotes only with permission and accurate attribution.",
    note: "Add the customer's approved name and role",
  },
  {
    title: "Transparent workflows",
    body: "Show how your product handles data, safeguards, and human escalation.",
    note: "Link to your real product documentation",
  },
];

export default function Testimonials() {
  return (
    <section className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-4 py-2 text-sm font-semibold text-fuchsia-300">
            Evidence customers can verify
          </span>
          <h2 className="mt-6 font-display text-4xl font-extrabold text-white sm:text-5xl">
            Build trust with proof, not placeholder claims
          </h2>
        </div>
        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {ITEMS.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
              <p className="text-[15px] leading-relaxed text-slate-300">{item.body}</p>
              <div className="mt-5 border-t border-white/5 pt-5">
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="text-xs text-slate-300">{item.note}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
""", encoding="utf-8")

    faq = root / "components" / "faq.tsx"
    if faq.exists():
        faq.write_text('''"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Does this ZIP include a working AI agent backend?",
    a: "No. This package contains a front-end landing-page template and sample UI. Connect your own AI service, data sources, authentication, and support workflows.",
  },
  {
    q: "Can I publish the included metrics and testimonials?",
    a: "They are illustrative placeholders. Replace them with verified performance data and customer quotes you have permission to publish.",
  },
  {
    q: "Are the listed integrations and capabilities included?",
    a: "The page is a marketing template; it does not connect the services shown. Update the copy to match your real integrations and tested capabilities.",
  },
  {
    q: "Can I customize pricing and calls to action?",
    a: "Yes. Edit the sample plans and replace every placeholder link with your own signup, booking, or contact destination before publishing.",
  },
  {
    q: "What does one purchase cover?",
    a: "One purchase covers one end product under LICENSE.md. Review the included license before using the template for client work or multiple products.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-3xl px-6 lg:px-10">
        <div className="text-center">
          <h2 className="font-display text-4xl font-extrabold text-white sm:text-5xl">
            Questions, answered
          </h2>
        </div>
        <div className="mt-12 flex flex-col gap-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-display text-base font-semibold text-white">{item.q}</span>
                  <ChevronDown size={18} className={isOpen ? "shrink-0 text-slate-300 transition-transform rotate-180" : "shrink-0 text-slate-300 transition-transform"} />
                </button>
                {isOpen && <p className="px-6 pb-5 text-sm leading-relaxed text-slate-300">{item.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
''', encoding="utf-8")

    readme = root / "README.md"
    current = read_text(readme)
    current = current.replace(
        "A production-ready landing page template for AI agent, chatbot, and automation products.",
        "A customizable front-end landing page template for AI agent, chatbot, and automation products. It does not include a hosted AI agent or backend service.")
    current = current.replace(
        "Commercial license included with purchase — use in unlimited personal or client\nprojects. Redistribution or resale of the template itself is not permitted.",
        "Commercial license included with purchase — one end product per purchase. Client work is allowed within the included single-end-product license. Redistribution or resale of the template source is not permitted.")
    if "## Before publishing" not in current:
        current += """

## Before publishing

This ZIP is a front-end template, not a hosted AI agent, model, backend, or integration service. Replace all sample metrics, testimonials, customer names, pricing, integration labels, and links with accurate information for your own product. Publish performance claims and customer proof only when you can substantiate them and have permission to use them. Connect and test your own backend, authentication, data sources, and support workflows.
"""
    readme.write_text(current, encoding="utf-8")


def normalize_template_key(key):
    return "vesper" if key.lower().startswith("nexora-template-12-vesper") else key.lower()

def patch_accessibility_text(root, key):
    slug = normalize_template_key(key)
    replacements = A11Y_TEXT_REPLACEMENTS.get(slug, [])
    touched = 0
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_EXTS:
            continue
        if any(part in {"node_modules", ".next", ".git", ".turbo", "coverage"} for part in path.parts):
            continue
        try:
            if path.stat().st_size > 2_000_000:
                continue
        except OSError:
            continue
        original = read_text(path)
        if not original:
            continue
        updated = original
        for pattern, replacement in replacements:
            if "\\" in pattern:
                updated = re.sub(pattern, replacement, updated, flags=re.I)
            else:
                updated = updated.replace(pattern, replacement)
        if path.suffix.lower() not in {".tsx", ".jsx", ".html", ".txt"}:
            if path.suffix.lower() == ".css":
                if slug == "modern-saas":
                    if "[data-theme=dark]{--moss-bright:" not in updated:
                        updated = re.sub(r"(\[data-theme=dark\]\{)", r"\1--moss-bright:#7cae87;", updated)
                    if "[data-theme=light]{--moss-bright:" not in updated:
                        updated = re.sub(r"(\[data-theme=light\]\{)", r"\1--moss-bright:#31563b;", updated)
                if slug == "admin-dashboard":
                    if "[data-theme=dark]{--teal-bright:" not in updated:
                        updated = re.sub(r"(\[data-theme=dark\]\{)", r"\1--teal-bright:#4cc9d0;--danger:#ff8b78;", updated)
                    if "[data-theme=light]{--teal-bright:" not in updated:
                        updated = re.sub(r"(\[data-theme=light\]\{)", r"\1--teal-bright:#0f5257;--danger:#b91c1c;", updated)
                if slug == "creative-agency" and "[data-theme=dark] .text-violet{color:#a683ff}" not in updated:
                    updated += "\n[data-theme=dark] .text-violet{color:#a683ff}"
            if updated != original:
                path.write_text(updated, encoding="utf-8")
                touched += 1
            continue
        if slug == "kiln-estates":
            updated = re.sub(r"<h4(\b[^>]*)>Explore</h4>", r"<h3\1>Explore</h3>", updated)
        if slug == "nexi-ai":
            updated = re.sub(r"<h4(\b[^>]*)>Product</h4>", r"<h3\1>Product</h3>", updated)
        if slug == "premium-blog":
            def label_article(match):
                opening = match.group(0)
                if re.search(r"\baria-label\s*=", opening, re.I):
                    return opening
                href = re.search(r"""href=(["'])(/articles/[^"']+)\1""", opening, re.I)
                if not href:
                    return opening
                title = href.group(2).rstrip("/").split("/")[-1].replace("-", " ").title()
                return opening[:-1] + ' aria-label="Read article: ' + title + '">'
            updated = re.sub(r"""<(?:a|Link)\b[^>]*href=(["'])/articles/[^"']+\1[^>]*>""", label_article, updated, flags=re.I)
            updated = re.sub(
                r"""(<(?:Link|a)\b(?=[^>]*class(?:Name)?=["'][^"']*overflow-hidden rounded-lg)[^>]*)(>)""",
                lambda m: m.group(1) + (' aria-label="Open article"' if not re.search(r"\baria-label\s*=", m.group(1), re.I) else "") + m.group(2),
                updated,
                flags=re.I,
            )
        if slug == "premium-restaurant":
            updated = re.sub(
                r"""(<(?:a|Link)\b[^>]*href=(["'])/reserve\2[^>]*)(>)""",
                lambda m: m.group(1) + (' aria-label="Make a reservation"' if not re.search(r"\baria-label\s*=", m.group(1), re.I) else "") + m.group(3),
                updated,
                flags=re.I,
            )
        if slug == "solace-studio" and 'role="img" aria-label="5 out of 5 stars"' not in updated:
            updated = updated.replace('aria-label="5 out of 5 stars"', 'role="img" aria-label="5 out of 5 stars"')
        if slug == "vesper":
            def demote_complementary(match):
                attrs, inner = match.group(1), match.group(2)
                return "<div" + attrs + ">" + inner + "</div>"
            updated = re.sub(
                r"""<aside(\b[^>]*class(?:Name)?=["'][^"']*rounded-2xl[^"']*bg-white/\[0\.025\][^"']*p-3[^"']*["'][^>]*)>(.*?)</aside>""",
                demote_complementary,
                updated,
                flags=re.I | re.S,
            )
        # Put unlabelled page sections inside the main landmark when the exported
        # document has a header/footer shell but no existing main element.
        if slug == "kiln-estates":
            def wrap_main(match):
                header, middle, footer = match.group(1), match.group(2), match.group(3)
                if re.search(r"<main\b", middle, re.I):
                    return match.group(0)
                return header + '<main id="main-content">' + middle + "</main>" + footer
            updated = re.sub(r"(</header>)(.*?)(<footer\b)", wrap_main, updated, flags=re.I | re.S)
        if updated != original:
            try:
                path.write_text(updated, encoding="utf-8")
                touched += 1
            except OSError as exc:
                raise RuntimeError(f"Unable to write accessibility fix to {path}: {exc}") from exc
    if touched:
        print(f"A11Y {slug}: patched {touched} source/export text files")

def patch_demo_exports():
    demo_root = Path("public/demo")
    if not demo_root.is_dir():
        return
    for slug in A11Y_TEXT_REPLACEMENTS:
        root = demo_root / slug
        if root.is_dir():
            patch_accessibility_text(root, slug)


def harden(archive):
    key = archive.stem
    title, description = PRODUCTS.get(key, (key.replace("-", " ").title(), "A Nexora template package."))
    with tempfile.TemporaryDirectory(prefix="nexora-package-") as tmp:
        extracted = Path(tmp) / "src"
        extracted.mkdir()
        with zipfile.ZipFile(archive) as zf:
            safe_extract(zf, extracted)
        root = choose_root(extracted)
        if key == "aether":
            patch_aether_source(root)
        if key == "nexi-ai":
            patch_nexi_ai_source(root)
        patch_accessibility_text(root, key)
        package_file = root / "package.json"
        pkg = None
        if package_file.exists():
            pkg = json.loads(read_text(package_file))
            deps = pkg.setdefault("dependencies", {})
            dev = pkg.setdefault("devDependencies", {})
            if key == "aether":
                for section in (deps, dev):
                    section.pop("@vercel/analytics", None)
                    section.pop("shadcn", None)
            if "next" in deps: deps["next"] = STABLE_NEXT
            elif "next" in dev: dev["next"] = STABLE_NEXT
            if "eslint-config-next" in dev: dev["eslint-config-next"] = STABLE_NEXT
            elif "eslint-config-next" in deps: deps["eslint-config-next"] = STABLE_NEXT
            if "next" in deps or "next" in dev:
                overrides = pkg.setdefault("overrides", {})
                overrides["minimatch"] = "^11.0.1"
            package_file.write_text(json.dumps(pkg, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

        env_names = find_env_names(root)
        env_file = root / ".env.example"
        if not env_file.exists():
            if env_names:
                body = "# Copy to .env.local and fill only values required by features you enable.\n"
                body += "".join(f"# Confirm purpose before use.\n{name}=\n" for name in env_names)
            else:
                body = "# No environment variables are required for the basic template preview.\n# Add placeholders here only when you configure an integration.\n"
            env_file.write_text(body, encoding="utf-8")

        write_readme(root, key, title, description, pkg)
        license_file = root / "LICENSE.md"
        current_license = read_text(license_file) if license_file.exists() else ""
        license_lower = current_license.lower()
        license_is_complete = (
            "single end product commercial license" in license_lower
            and "one end product" in license_lower
            and "may not" in license_lower
            and "redistribute" in license_lower
            and "third-party" in license_lower
        )
        if not license_is_complete:
            license_file.write_text(
                "# Single End Product Commercial License\n\n"
                "This package is licensed for building and launching one personal, commercial, or client-facing end product. Keep the reusable template source protected from redistribution.\n\n"
                "## You may\n\n"
                "- Use the purchased source in one personal, commercial, or client-facing end product.\n"
                "- Modify, extend, restyle, refactor, and combine it with your own code.\n"
                "- Deploy the finished product publicly, including hosted and SaaS applications.\n\n"
                "## Client work\n\n"
                "You may build a finished website or application for a client. The client receives the finished end product, not the reusable template source as a separate product.\n\n"
                "## You may not\n\n"
                "- Resell, redistribute, sublicense, publish, or share the source package itself.\n"
                "- Offer the source as a template, UI kit, boilerplate, starter kit, or competing marketplace product.\n\n"
                "## Multiple end products\n\n"
                "One purchase covers one end product. Independent products, separate client deliverables, or separate brands require additional licenses unless a written agreement says otherwise.\n\n"
                "## Third-party assets\n\n"
                "Fonts, photographs, icons, illustrations, logos, and other third-party materials remain subject to their own licenses. Review ASSET-LICENSES.md and replace demo assets when necessary.\n\n"
                "## Updates and support\n\n"
                "Future updates are included while the purchased template is maintained. Support covers installation and documented template behavior; custom development, hosting, third-party configuration, and bespoke integrations are outside standard support.\n\n"
                "## Warranty and liability\n\n"
                "The package is provided as source code for development use. To the maximum extent permitted by law, Nexora Core disclaims warranties for uninterrupted operation, third-party services, framework changes, and fitness for a particular purpose. Nothing in this license limits rights that cannot lawfully be excluded in your jurisdiction.\n\n"
                "Read the current purchase policy and support information: https://nexora-core.nxora.workers.dev/en/license, https://nexora-core.nxora.workers.dev/en/refunds, and https://nexora-core.nxora.workers.dev/en/support. This document is not legal advice.\n",
                encoding="utf-8")
        updating = root / "UPDATING.md"
        if not updating.exists():
            updating.write_text(
                f"# Updating {title}\n\nThere is no automatic updater in this ZIP. Check the Nexora product/download page for a newer release and review its changelog when available.\n\n"
                "1. Back up your customized project and commit it to version control.\n"
                "2. Download and extract the new release into a separate directory.\n"
                "3. Compare files and merge changes rather than overwriting custom work blindly.\n"
                "4. Keep package-lock.json in sync with package.json; use npm ci for a clean install.\n"
                "5. Run npm run build where a build script exists, then test routes, forms, images, accessibility, and mobile layouts before deploying.\n",
                encoding="utf-8")

        if pkg:
            subprocess.run(["npm", "install", "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund", "--legacy-peer-deps"], cwd=root, check=True, timeout=900)
            subprocess.run(["npm", "ci", "--ignore-scripts", "--no-audit", "--no-fund", "--legacy-peer-deps"], cwd=root, check=True, timeout=900)
            shutil.rmtree(root / "node_modules", ignore_errors=True)

        temp_zip = Path(tmp) / "rebuilt.zip"
        with zipfile.ZipFile(temp_zip, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=8) as out:
            for p in sorted(extracted.rglob("*")):
                if (not p.is_file() or "node_modules" in p.parts or p.name == ".DS_Store" or (p.name.lower().startswith(".env") and p.name.lower() not in {".env.example", ".env.sample", ".env.template"} and not p.name.lower().endswith(".example"))):
                    continue
                out.write(p, p.relative_to(extracted).as_posix())
        shutil.copy2(temp_zip, archive)
        print(f"HARDENED {archive.name}: release docs added; Next.js={STABLE_NEXT if pkg and (pkg.get('dependencies',{}).get('next') or pkg.get('devDependencies',{}).get('next')) else 'static/no Next.js'}; lockfile={'generated' if pkg else 'not applicable for static package'}")

def main():
    if not ROOT.is_dir():
        raise SystemExit(f"Missing downloads directory: {ROOT}")
    archives = [p for p in sorted(ROOT.glob("*.zip")) if not p.name.startswith("Nexora-All-Templates")]
    target = os.environ.get("NEXORA_PACKAGE_TARGET", "").strip()
    if target:
        archives = [p for p in archives if p.name.lower() == target.lower()]
        if not archives:
            raise SystemExit(f"Requested package archive was not found: {target}")
    if not archives: raise SystemExit("No template ZIPs found.")
    for archive in archives: harden(archive)
    patch_demo_exports()

if __name__ == "__main__":
    main()
