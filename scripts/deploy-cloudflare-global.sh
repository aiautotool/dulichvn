#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

API_BASE="https://api.cloudflare.com/client/v4"
ROOT_DOMAIN="${ROOT_DOMAIN:-aiautotool.com}"
SUBDOMAIN="${SUBDOMAIN:-vinago.aiautotool.com}"
DNS_NAME="${DNS_NAME:-vinago}"
WRANGLER_VERSION="${WRANGLER_VERSION:-4.103.0}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1" >&2
    exit 1
  fi
}

require_command curl
require_command jq
require_command npm

if [[ -z "${CLOUDFLARE_EMAIL:-}" ]]; then
  read -r -p "Cloudflare email: " CLOUDFLARE_EMAIL
fi

if [[ -z "${CLOUDFLARE_API_KEY:-}" ]]; then
  printf "Cloudflare Global API Key: "
  stty -echo
  IFS= read -r CLOUDFLARE_API_KEY
  stty echo
  printf "\n"
fi

export CLOUDFLARE_EMAIL
export CLOUDFLARE_API_KEY
unset CLOUDFLARE_API_TOKEN

auth_headers=(
  -H "X-Auth-Email: ${CLOUDFLARE_EMAIL}"
  -H "X-Auth-Key: ${CLOUDFLARE_API_KEY}"
)

echo "Checking Cloudflare account..."
accounts_json="$(curl -fsS "${API_BASE}/accounts" "${auth_headers[@]}")"
if [[ "$(jq -r '.success' <<<"$accounts_json")" != "true" ]]; then
  echo "$accounts_json" | jq
  exit 1
fi

export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-$(jq -r '.result[0].id' <<<"$accounts_json")}"
if [[ -z "$CLOUDFLARE_ACCOUNT_ID" || "$CLOUDFLARE_ACCOUNT_ID" == "null" ]]; then
  echo "Could not resolve CLOUDFLARE_ACCOUNT_ID." >&2
  echo "$accounts_json" | jq
  exit 1
fi
echo "Account ID: ${CLOUDFLARE_ACCOUNT_ID}"

echo "Checking Cloudflare zone ${ROOT_DOMAIN}..."
zones_json="$(curl -fsS "${API_BASE}/zones?name=${ROOT_DOMAIN}" "${auth_headers[@]}")"
ZONE_ID="$(jq -r '.result[0].id' <<<"$zones_json")"
if [[ -z "$ZONE_ID" || "$ZONE_ID" == "null" ]]; then
  echo "Could not resolve zone for ${ROOT_DOMAIN}." >&2
  echo "$zones_json" | jq
  exit 1
fi
echo "Zone ID: ${ZONE_ID}"

echo "Ensuring proxied DNS record ${SUBDOMAIN}..."
record_json="$(curl -fsS "${API_BASE}/zones/${ZONE_ID}/dns_records?type=AAAA&name=${SUBDOMAIN}" "${auth_headers[@]}")"
record_id="$(jq -r '.result[0].id // empty' <<<"$record_json")"

if [[ -z "$record_id" ]]; then
  curl -fsS -X POST "${API_BASE}/zones/${ZONE_ID}/dns_records" \
    "${auth_headers[@]}" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"AAAA\",\"name\":\"${DNS_NAME}\",\"content\":\"100::\",\"ttl\":1,\"proxied\":true}" \
    | jq
else
  curl -fsS -X PATCH "${API_BASE}/zones/${ZONE_ID}/dns_records/${record_id}" \
    "${auth_headers[@]}" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"AAAA\",\"name\":\"${DNS_NAME}\",\"content\":\"100::\",\"ttl\":1,\"proxied\":true}" \
    | jq
fi

echo "Exporting Expo web build..."
npm run export:web

echo "Deploying Worker static assets with Wrangler ${WRANGLER_VERSION}..."
CI=1 \
WRANGLER_SEND_METRICS=false \
CLOUDFLARE_EMAIL="$CLOUDFLARE_EMAIL" \
CLOUDFLARE_API_KEY="$CLOUDFLARE_API_KEY" \
CLOUDFLARE_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID" \
npx --yes "wrangler@${WRANGLER_VERSION}" deploy --config wrangler.jsonc

echo "Testing ${SUBDOMAIN}..."
curl -I "https://${SUBDOMAIN}" || true
echo "Done: https://${SUBDOMAIN}"
