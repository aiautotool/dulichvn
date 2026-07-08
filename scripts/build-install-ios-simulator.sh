#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

IOS_SIMULATOR_TARGET="${IOS_SIMULATOR:-}"
device_args=()
if [[ -n "$IOS_SIMULATOR_TARGET" ]]; then
  device_args=(--device "$IOS_SIMULATOR_TARGET")
fi

exec npx expo run:ios "${device_args[@]}" "$@"
