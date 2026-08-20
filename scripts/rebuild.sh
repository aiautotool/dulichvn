#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PLATFORM="${1:-}"

command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js is required." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "ERROR: npm is required." >&2; exit 1; }

if [[ "${CLEAN:-1}" == "1" ]]; then
  echo "==> Cleaning dependencies and Expo caches..."
  rm -rf node_modules .expo
fi

if [[ -f package-lock.json ]]; then npm ci; else npm install; fi

if [[ -f package.json ]] && npm run | grep -q 'build:translations'; then
  npm run build:translations
fi

npm run typecheck

case "$PLATFORM" in
  android)
    npm run android
    ;;
  ios)
    npm run ios
    ;;
  web)
    npm run export:web
    ;;
  "")
    echo "Build validation complete. Choose a platform:"
    echo "  ./scripts/rebuild.sh android"
    echo "  ./scripts/rebuild.sh ios"
    echo "  ./scripts/rebuild.sh web"
    ;;
  *)
    echo "Usage: ./scripts/rebuild.sh [android|ios|web]" >&2
    exit 2
    ;;
esac
