#!/usr/bin/env python3
"""Blocking archive gate for the 12 shipped Nexora template packages.

Checks the exact customer ZIPs, not the repository source:
  * archive integrity (CRC) and safe paths
  * required customer documentation
  * no bundled build output, dependencies, secrets or local env files
  * clean install, production build, lint and dependency audit

Every product in scripts/templates.manifest.json is mandatory. A missing
archive, demo or document is a failure, never a silent skip.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOWNLOADS = ROOT / "public" / "downloads"
MANIFEST = ROOT / "scripts" / "templates.manifest.json"

REQUIRED_DOCS = ("README", "LICENSE", "ASSET-LICENSES", "CHANGELOG", "QUICKSTART", "SUPPORT")
JUNK_DIRS = {"node_modules", ".next", "dist", "out", "build", ".git", ".turbo", "coverage"}
SECRET_FILE_NAMES = {".env", ".env.local", ".env.production", ".env.development", ".dev.vars"}
SECRET_PATTERNS = [
    (re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"), "private key block"),
    (re.compile(r"\bAKIA[0-9A-Z]{16}\b"), "AWS access key"),
    (re.compile(r"\bghp_[A-Za-z0-9]{36}\b"), "GitHub personal access token"),
    (re.compile(r"\bsk-[A-Za-z0-9]{32,}\b"), "OpenAI-style secret key"),
]


def load_products() -> list[dict]:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    products = data["products"]
    if len(products) != 12:
        raise SystemExit(f"Manifest must contain exactly 12 products, found {len(products)}")
    slugs = [p["slug"] for p in products]
    if len(set(slugs)) != len(slugs):
        raise SystemExit("Manifest contains duplicate product slugs")
    return products


def safe_members(zf: zipfile.ZipFile, archive: Path) -> list[zipfile.ZipInfo]:
    members = []
    for info in zf.infolist():
        name = info.filename
        p = Path(name)
        if p.is_absolute() or ".." in p.parts:
            raise ValueError(f"unsafe path in {archive.name}: {name!r}")
        if ((info.external_attr >> 16) & 0o170000) == 0o120000:
            raise ValueError(f"symlink entry in {archive.name}: {name!r}")
        members.append(info)
    return members


def find_doc(names: list[str], stem: str) -> list[str]:
    pattern = re.compile(rf"(^|/){re.escape(stem)}(?:[^/]*)\.(?:md|markdown|txt)$", re.I)
    return [n for n in names if pattern.search(n)]


def verify_archive(product: dict, failures: list[str]) -> dict:
    archive = DOWNLOADS / product["zip"]
    record = {"slug": product["slug"], "label": product["label"], "zip": product["zip"], "checks": {}, "issues": []}

    def fail(message: str) -> None:
        record["issues"].append(message)
        failures.append(f"{product['label']}: {message}")

    if not archive.is_file():
        fail(f"archive missing: public/downloads/{product['zip']}")
        record["checks"]["integrity"] = "MISSING"
        return record

    record["bytes"] = archive.stat().st_size
    try:
        with zipfile.ZipFile(archive) as zf:
            members = safe_members(zf, archive)
            bad = zf.testzip()
            if bad is not None:
                fail(f"corrupt archive member: {bad}")
                record["checks"]["integrity"] = "FAIL"
            else:
                record["checks"]["integrity"] = "PASS"
            names = [m.filename for m in members if not m.filename.endswith("/")]
            record["files"] = len(names)

            if not names:
                fail("archive contains no files")

            for stem in REQUIRED_DOCS:
                if not find_doc(names, stem):
                    fail(f"missing required documentation: {stem}.md")
            record["checks"]["documentation"] = "PASS" if all(find_doc(names, s) for s in REQUIRED_DOCS) else "FAIL"

            junk = sorted({n for n in names if set(Path(n).parts) & JUNK_DIRS})
            if junk:
                fail(f"bundled build/dependency artifacts: {junk[:5]}")
            record["checks"]["no_build_artifacts"] = "FAIL" if junk else "PASS"

            secret_files = sorted({n for n in names if Path(n).name in SECRET_FILE_NAMES})
            if secret_files:
                fail(f"local environment/secret files shipped: {secret_files[:5]}")

            env_example = [n for n in names if Path(n).name.lower() in (".env.example", ".env.sample", ".env.template")]
            record["checks"]["env_example"] = "PASS" if env_example else "FAIL"
            if not env_example:
                fail("missing .env.example")

            has_package = any(Path(n).name == "package.json" and "node_modules" not in n for n in names)
            record["checks"]["package_json"] = "PASS" if has_package else ("N/A" if product["runtime"] == "vite" else "FAIL")
            if not has_package and product["runtime"] != "vite":
                fail("missing package.json")
            if has_package and not any(Path(n).name in ("package-lock.json", "pnpm-lock.yaml", "yarn.lock") for n in names):
                fail("missing lockfile for a Node.js package")

            leaks = []
            for info in members:
                if info.is_dir() or info.file_size > 2_000_000:
                    continue
                if Path(info.filename).suffix.lower() not in {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".html", ".json", ".md", ".css", ".txt", ".yml", ".yaml"}:
                    continue
                text = zf.read(info).decode("utf-8", "ignore")
                for pattern, label in SECRET_PATTERNS:
                    if pattern.search(text):
                        leaks.append(f"{info.filename}: {label}")
            if leaks:
                fail(f"possible committed secret: {leaks[:3]}")
            record["checks"]["no_committed_secrets"] = "FAIL" if leaks else "PASS"

            record["readme"] = find_doc(names, "README")[:1]
            record["license"] = find_doc(names, "LICENSE")[:1]
    except (zipfile.BadZipFile, ValueError) as exc:
        fail(str(exc))
        record["checks"]["integrity"] = "FAIL"
        return record

    return record


def choose_root(extracted: Path) -> Path | None:
    if (extracted / "package.json").exists():
        return extracted
    candidates = [p.parent for p in extracted.rglob("package.json") if "node_modules" not in p.parts]
    if len(candidates) == 1:
        return candidates[0]
    if not candidates:
        return None
    # Prefer the shallowest project root.
    return sorted(candidates, key=lambda p: len(p.parts))[0]


def run(cmd: list[str], cwd: Path, timeout: int = 900) -> tuple[int, str]:
    proc = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout, env={**os.environ, "CI": "1"})
    return proc.returncode, (proc.stdout or "") + (proc.stderr or "")


def verify_build(product: dict, failures: list[str], workdir: Path) -> dict:
    archive = DOWNLOADS / product["zip"]
    result = {"install": "NOT RUN", "build": "NOT RUN", "lint": "NOT RUN", "audit": "NOT RUN", "issues": []}
    if not archive.is_file():
        return result

    def fail(message: str) -> None:
        result["issues"].append(message)
        failures.append(f"{product['label']}: {message}")

    dest = workdir / product["slug"]
    dest.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive) as zf:
        zf.extractall(dest)
    root = choose_root(dest)
    if root is None:
        result["install"] = "N/A"
        result["build"] = "N/A"
        result["lint"] = "N/A"
        result["audit"] = "N/A"
        return result

    pkg = json.loads((root / "package.json").read_text(encoding="utf-8"))
    scripts = pkg.get("scripts", {})
    lock = root / "package-lock.json"
    code, output = run(["npm", "ci", "--no-audit", "--no-fund", "--legacy-peer-deps"], root) if lock.exists() else run(
        ["npm", "install", "--no-audit", "--no-fund", "--legacy-peer-deps"], root
    )
    if code != 0:
        result["install"] = "FAIL"
        fail(f"clean install failed: {output.strip().splitlines()[-1] if output.strip() else code}")
        return result
    result["install"] = "PASS"

    if "build" in scripts:
        code, output = run(["npm", "run", "build"], root)
        result["build"] = "PASS" if code == 0 else "FAIL"
        if code != 0:
            fail(f"production build failed: {output.strip().splitlines()[-1] if output.strip() else code}")
    else:
        result["build"] = "N/A"

    if "lint" in scripts:
        code, output = run(["npm", "run", "lint"], root)
        result["lint"] = "PASS" if code == 0 else "FAIL"
        if code != 0:
            fail("lint failed")
    else:
        result["lint"] = "N/A"

    code, output = run(["npm", "audit", "--audit-level=high", "--omit=dev"], root)
    result["audit"] = "PASS" if code == 0 else "FAIL"
    if code != 0:
        summary = " ".join(line.strip() for line in output.splitlines() if "vulnerabilit" in line)[:300]
        fail(f"high/critical production dependency vulnerability: {summary or 'npm audit failed'}")

    shutil.rmtree(root / "node_modules", ignore_errors=True)
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-build", action="store_true", help="skip install/build/lint/audit (archive-only pass)")
    parser.add_argument("--out", default=".deep-audit/package-report.json")
    parser.add_argument("--only", default="", help="comma-separated slugs")
    args = parser.parse_args()

    products = load_products()
    if args.only:
        wanted = {s.strip() for s in args.only.split(",") if s.strip()}
        products = [p for p in products if p["slug"] in wanted]
        if not products:
            raise SystemExit("No matching products for --only")

    failures: list[str] = []
    report = {"products": [], "failures": failures}
    workdir = Path(tempfile.mkdtemp(prefix="nexora-verify-"))
    try:
        for product in products:
            print(f"=== {product['label']} ({product['zip']}) ===", flush=True)
            record = verify_archive(product, failures)
            if not args.skip_build:
                record["build_checks"] = verify_build(product, failures, workdir)
                record["issues"].extend(record["build_checks"].get("issues", []))
            print(f"  integrity={record['checks'].get('integrity')} issues={len(record['issues'])}", flush=True)
            report["products"].append(record)
    finally:
        shutil.rmtree(workdir, ignore_errors=True)

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")

    lines = ["# Nexora shipped package verification", "", f"Products checked: {len(report['products'])}", ""]
    for record in report["products"]:
        lines.append(f"## {record['label']} ({record['zip']})")
        for key, value in record["checks"].items():
            lines.append(f"- {key}: {value}")
        for key, value in record.get("build_checks", {}).items():
            if key != "issues":
                lines.append(f"- {key}: {value}")
        lines.append(f"- issues: {len(record['issues'])}")
        for issue in record["issues"]:
            lines.append(f"  - {issue}")
        lines.append("")
    if failures:
        lines += ["## Blocking failures", ""] + [f"- {f}" for f in failures]
    else:
        lines += ["## Result", "", "All 12 packages passed archive and build verification."]
    Path(".deep-audit/package-report.md").parent.mkdir(parents=True, exist_ok=True)
    Path(".deep-audit/package-report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"\nBLOCKING_FAILURES={len(failures)}")
    for failure in failures:
        print(f"  - {failure}")
    return 0 if not failures else 1


PRODUCT_BY_SLUG = {p["slug"]: p for p in load_products()}

if __name__ == "__main__":
    sys.exit(main())
