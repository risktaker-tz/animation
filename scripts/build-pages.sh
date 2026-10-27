#!/usr/bin/env bash
# Build the fully client-side static export for GitHub Pages.
# The dev-only /api/tts route handler (POST) is incompatible with
# `output: export`, so it is moved aside for the build and restored after.
set -euo pipefail
cd "$(dirname "$0")/.."

API_DIR="src/app/api"
BACKUP_DIR=".api-backup-pages"

# recover from a previously interrupted run
if [ -d "$BACKUP_DIR" ] && [ ! -d "$API_DIR" ]; then
  mv "$BACKUP_DIR" "$API_DIR"
fi

if [ -d "$API_DIR" ]; then
  rm -rf "$BACKUP_DIR"
  mv "$API_DIR" "$BACKUP_DIR"
fi
restore() {
  if [ -d "$BACKUP_DIR" ] && [ ! -d "$API_DIR" ]; then
    mv "$BACKUP_DIR" "$API_DIR"
  fi
}
trap restore EXIT

rm -rf out .next
BUILD_TARGET=pages bun x next build

restore
trap - EXIT
echo "static export ready: out/"
