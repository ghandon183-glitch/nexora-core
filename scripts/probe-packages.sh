#!/usr/bin/env bash
# Reproducible package probe: extracts each shipped customer ZIP and runs the
# exact commands a customer runs (npm ci, npm run build, npm run lint) with no
# --legacy-peer-deps escape hatch. Writes one log per product.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
OUT=.deep-audit/probe
WORK=${WORK:-/tmp/nexora-probe}
rm -rf "$OUT" "$WORK"
mkdir -p "$OUT" "$WORK"

slug_dir() { basename "$1" .zip; }

probe_one() {
  local zip="$1" slug dir root
  slug=$(slug_dir "$zip")
  dir="$WORK/$slug"
  mkdir -p "$dir"
  python3 - "$zip" "$dir" <<'PY'
import sys, zipfile
from pathlib import Path
archive, dest = sys.argv[1], Path(sys.argv[2])
with zipfile.ZipFile(archive) as zf:
    for m in zf.infolist():
        p = Path(m.filename)
        if p.is_absolute() or ".." in p.parts:
            raise SystemExit(f"unsafe path {m.filename}")
        if ((m.external_attr >> 16) & 0o170000) == 0o120000:
            raise SystemExit(f"symlink {m.filename}")
    zf.extractall(dest)
PY
  root="$dir"
  if [ ! -f "$root/package.json" ]; then
    root=$(find "$dir" -name package.json -not -path '*/node_modules/*' | sort | head -1 | xargs -r dirname)
  fi
  local log="$OUT/$slug.log"
  : > "$log"
  echo "ROOT=$root" >> "$log"
  if [ -z "$root" ] || [ ! -f "$root/package.json" ]; then
    echo "INSTALL=N/A BUILD=N/A LINT=N/A (static package)" | tee -a "$log"
    echo "N/A" > "$OUT/$slug.result"
    return
  fi
  local install=FAIL build=N/A lint=N/A
  if [ -f "$root/package-lock.json" ]; then
    ( cd "$root" && npm ci --no-fund --no-audit ) >> "$log" 2>&1 && install=PASS
  else
    ( cd "$root" && npm install --no-fund --no-audit ) >> "$log" 2>&1 && install=PASS
  fi
  if [ "$install" = PASS ]; then
    if node -e "const p=require('$root/package.json');process.exit(p.scripts&&p.scripts.build?0:1)"; then
      ( cd "$root" && npm run build ) >> "$log" 2>&1 && build=PASS || build=FAIL
    fi
    if node -e "const p=require('$root/package.json');process.exit(p.scripts&&p.scripts.lint?0:1)"; then
      ( cd "$root" && npm run lint ) >> "$log" 2>&1 && lint=PASS || lint=FAIL
    fi
  fi
  echo "INSTALL=$install BUILD=$build LINT=$lint" | tee -a "$log"
  printf 'INSTALL=%s BUILD=%s LINT=%s\n' "$install" "$build" "$lint" > "$OUT/$slug.result"
}

export -f probe_one slug_dir
export OUT WORK

for zip in public/downloads/*.zip; do
  case "$(basename "$zip")" in
    Nexora-All-Templates*) continue ;;
  esac
  echo "$zip"
done | xargs -P "${JOBS:-4}" -I{} bash -c 'probe_one "$@"' _ {}

echo "=== SUMMARY ==="
for r in "$OUT"/*.result; do
  printf '%-46s %s\n' "$(basename "$r" .result)" "$(cat "$r")"
done
