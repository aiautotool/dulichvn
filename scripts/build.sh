#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PLATFORM="${1:-web}"

case "$PLATFORM" in
  android)
    npx expo run:android
    ;;
  ios)
    npx expo run:ios
    ;;
  web)
    npx expo export --platform web
    ;;
  start)
    npx expo start
    ;;
  *)
    echo "Usage: ./scripts/build.sh [android|ios|web|start]" >&2
    exit 2
    ;;
esac
