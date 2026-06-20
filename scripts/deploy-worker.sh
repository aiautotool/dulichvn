#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-.env.cloudflare.local}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${CLOUDFLARE_EMAIL:-}" ]]; then
  export CLOUDFLARE_EMAIL="${EMAIL_CLOUDFLARE:-${EMAIL_CLOUDFALRE:-}}"
fi

if [[ -z "${CLOUDFLARE_API_KEY:-}" ]]; then
  export CLOUDFLARE_API_KEY="${GLOBAL_TOKEN_CLOUDFLARE:-${GLOBAL_TOKEN_CLOUDFALRE:-}}"
fi

if [[ -z "${CLOUDFLARE_EMAIL:-}" || -z "${CLOUDFLARE_API_KEY:-}" ]]; then
  cat >&2 <<'EOF'
Missing Cloudflare credentials.

Use environment variables:
  export CLOUDFLARE_EMAIL="info@aiautotool.com"
  export CLOUDFLARE_API_KEY="your-global-api-key"
  ./scripts/deploy-worker.sh

Aliases are also accepted:
  EMAIL_CLOUDFLARE / EMAIL_CLOUDFALRE
  GLOBAL_TOKEN_CLOUDFLARE / GLOBAL_TOKEN_CLOUDFALRE

You can also put them in .env.cloudflare.local, which is ignored by git.
EOF
  exit 1
fi

exec ./scripts/deploy-cloudflare-global.sh
