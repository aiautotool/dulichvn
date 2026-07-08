#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ANDROID_TARGET="${ANDROID_DEVICE:-${EXPO_DEVICE:-}}"
device_args=(--device)
if [[ -n "$ANDROID_TARGET" ]]; then
  device_args=(--device "$ANDROID_TARGET")
fi

exec npx expo run:android "${device_args[@]}" "$@"
