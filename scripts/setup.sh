#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js is required." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "ERROR: npm is required." >&2; exit 1; }

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  echo "ERROR: Node.js 20+ is required. Current: $(node -v)" >&2
  exit 1
fi

echo "==> Node: $(node -v)"
echo "==> Installing dependencies..."
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

if [[ -f .env.example && ! -f .env ]]; then
  cp .env.example .env
  echo "==> Created .env from .env.example"
fi

if [[ -f package.json ]] && npm run | grep -q 'build:translations'; then
  npm run build:translations
fi

npm run typecheck

echo
 echo "Setup complete. Run: npm run start"
