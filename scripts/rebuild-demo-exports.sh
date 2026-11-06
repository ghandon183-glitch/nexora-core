#!/usr/bin/env bash
# Rebuild the published demo export for one or more products from the shipped
# ZIP, so public/demo/<slug>/ is exactly the source customers download.
#
# Usage: scripts/rebuild-demo-exports.sh kiln-estates nexi-ai ...
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="${REBUILD_WORKDIR:-/tmp/nexora-demo-rebuild}"

if [ "$#" -eq 0 ]; then
  echo "usage: $0 <slug> [slug...]" >&2
  exit 2
fi

for slug in "$@"; do
  archive="$ROOT/public/downloads/$slug.zip"
  if [ ! -f "$archive" ]; then
    echo "missing archive: $archive" >&2
    exit 1
  fi
  dest="$WORK/$slug"
  rm -rf "$dest"
  mkdir -p "$dest"
  python3 - "$archive" "$dest" <<'PY'
import sys, zipfile
zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])
PY
  src="$(python3 - "$dest" <<'PY'
import json, pathlib, sys
root = pathlib.Path(sys.argv[1])
found = sorted(root.rglob("package.json"))
if not found:
    raise SystemExit("no package.json in archive")
print(found[0].parent)
PY
)"
  echo "== building $slug from $src"
  ( cd "$src" && npm ci --ignore-scripts --no-audit --no-fund )
  # The customer ZIP is a normal app; the marketplace demo needs a static
  # export under /demo/<slug>/. This config exists only in the build workspace.
  cat > "$src/next.config.ts" <<'TS'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
TS
  ( cd "$src" && NEXT_PUBLIC_BASE_PATH="/demo/$slug" npm run build )
  if [ ! -d "$src/out" ]; then
    echo "build produced no out/ directory for $slug" >&2
    exit 1
  fi
  # next/image does not prefix plain /images/ sources with basePath here, so the
  # exported pages would request /images/... from the marketplace root.
  python3 - "$src/out" "$slug" <<'PY'
import pathlib, sys
target = pathlib.Path(sys.argv[1])
base = f"/demo/{sys.argv[2]}"
changed = 0
for path in target.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in {".html", ".js", ".css", ".txt", ".json"}:
        continue
    text = path.read_text(encoding="utf-8", errors="ignore")
    if "/images/" not in text:
        continue
    updated = text.replace(f"{base}/images/", "/images/").replace("/images/", f"{base}/images/")
    if updated != text:
        path.write_text(updated, encoding="utf-8")
        changed += 1
print(f"  rewrote image paths in {changed} file(s)")
PY
  rm -rf "${ROOT:?}/public/demo/$slug"
  mkdir -p "$ROOT/public/demo/$slug"
  cp -a "$src/out/." "$ROOT/public/demo/$slug/"
  echo "== published public/demo/$slug"
done
