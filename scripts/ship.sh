#!/usr/bin/env bash
# Produce the attendee copy: reference guard back to the skeleton, no finished catalog, no local state.
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"; DEST="${1:-/tmp/dealer-ask-starter-ship}"
rm -rf "$DEST"
python3 - "$SRC" "$DEST" <<'PY'
import shutil, sys
src, dest = sys.argv[1], sys.argv[2]
skip = {"node_modules", ".next", ".pglite", ".env.local", "NOTES.md", "NOTES.local.md", "e2e-shots", "next-env.d.ts", ".git"}
shutil.copytree(src, dest, ignore=lambda d, names: [n for n in names if n in skip or n.endswith(".tsbuildinfo")])
PY
cp "$SRC/scripts/templates/guard.skeleton.ts.txt" "$DEST/lib/ask/guard.ts"
rm -f "$DEST/catalog/store_day.yaml" "$DEST/catalog/service_ros.yaml" "$DEST/data/PROFILE.md"
echo "shipped to $DEST"
