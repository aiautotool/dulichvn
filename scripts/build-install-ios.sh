#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

IOS_TARGET="${IOS_DEVICE:-${EXPO_DEVICE:-}}"
device_args=(--device)
if [[ -n "$IOS_TARGET" ]]; then
  device_args=(--device "$IOS_TARGET")
fi

exec npx expo run:ios "${device_args[@]}" "$@"
