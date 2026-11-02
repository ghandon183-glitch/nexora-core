#!/usr/bin/env python3
"""Harden the exact ZIPs sold by Nexora without bundling node_modules or secrets."""
import json, re, shutil, subprocess, tempfile, zipfile
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
TEXT_EXTS = {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".html", ".json", ".md", ".css"}

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
    if p.exists() and read_text(p).strip():
        return
    next_ver = ((pkg or {}).get("dependencies", {}).get("next") or (pkg or {}).get("devDependencies", {}).get("next"))
    scripts = (pkg or {}).get("scripts", {})
    sections = [f"# {title}", "", description, "", "## Included",
                "- Template source and assets contained in this archive.",
                "- ASSET-LICENSES.md, when present, lists known third-party asset attributions and license notes.", "",
                "## Requirements"]
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
        sections += ["", "## Customization",
                     "- Replace demo copy, placeholder content, links, and imagery with assets and claims you have permission to use.",
                     "- Connect forms, authentication, databases, analytics, checkout, or CMS integrations yourself; do not assume a backend service is included unless it is present in this package.",
                     "- Review SEO metadata, accessibility, reduced-motion behavior, and small-screen layouts before launch."]
    else:
        sections += ["- A modern web browser.", "- Python 3 (optional, for a local preview).", "",
                     "## Quick start", "1. Extract this ZIP.", "2. Open index.html in a browser, or run a local server:",
                     "   python -m http.server 4173", "3. Visit http://localhost:4173."]
    sections += ["", "## Updates",
                 "This ZIP does not install updates automatically. Check the Nexora product page or your purchase/download area for new releases. Back up customizations, compare changed files, merge your content into the new release, reinstall dependencies with npm ci when a lockfile is present, and run the production build.",
                 "", "## License and support",
                 "The commercial license and refund terms shown on Nexora at purchase govern this package. Read the current terms before deployment or redistribution:",
                 "- License: https://nexora-core.nxora.workers.dev/en/license",
                 "- Refunds: https://nexora-core.nxora.workers.dev/en/refunds",
                 "- Support: https://nexora-core.nxora.workers.dev/en/support",
                 "", "This template is a starting point, not a hosted backend or a guarantee that third-party integrations are configured. Review LICENSE.md and ASSET-LICENSES.md if present.", ""]
    p.write_text("\n".join(sections), encoding="utf-8")

def harden(archive):
    key = archive.stem
    title, description = PRODUCTS.get(key, (key.replace("-", " ").title(), "A Nexora template package."))
    with tempfile.TemporaryDirectory(prefix="nexora-package-") as tmp:
        extracted = Path(tmp) / "src"
        extracted.mkdir()
        with zipfile.ZipFile(archive) as zf:
            safe_extract(zf, extracted)
        root = choose_root(extracted)
        package_file = root / "package.json"
        pkg = None
        if package_file.exists():
            pkg = json.loads(read_text(package_file))
            deps = pkg.setdefault("dependencies", {})
            dev = pkg.setdefault("devDependencies", {})
            if "next" in deps: deps["next"] = STABLE_NEXT
            elif "next" in dev: dev["next"] = STABLE_NEXT
            if "eslint-config-next" in dev: dev["eslint-config-next"] = STABLE_NEXT
            elif "eslint-config-next" in deps: deps["eslint-config-next"] = STABLE_NEXT
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
        if not license_file.exists():
            license_file.write_text(
                "# License information\n\nThis file points to the applicable Nexora commercial license; it is not a replacement for the complete legal terms.\n\n"
                "Review the license and refund terms shown on Nexora at purchase before using this package:\n"
                "- Commercial license: https://nexora-core.nxora.workers.dev/en/license\n"
                "- Refund policy: https://nexora-core.nxora.workers.dev/en/refunds\n\n"
                "The official terms applicable to your purchase control if this summary and those terms differ. Third-party assets may have separate conditions; review ASSET-LICENSES.md where included.\n",
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
                if not p.is_file() or "node_modules" in p.parts or p.name == ".DS_Store":
                    continue
                out.write(p, p.relative_to(extracted).as_posix())
        shutil.copy2(temp_zip, archive)
        print(f"HARDENED {archive.name}: release docs added; Next.js={STABLE_NEXT if pkg and (pkg.get('dependencies',{}).get('next') or pkg.get('devDependencies',{}).get('next')) else 'static/no Next.js'}; lockfile={'generated' if pkg else 'not applicable for static package'}")

def main():
    if not ROOT.is_dir():
        raise SystemExit(f"Missing downloads directory: {ROOT}")
    archives = [p for p in sorted(ROOT.glob("*.zip")) if not p.name.startswith("Nexora-All-Templates")]
    if not archives: raise SystemExit("No template ZIPs found.")
    for archive in archives: harden(archive)

if __name__ == "__main__":
    main()
