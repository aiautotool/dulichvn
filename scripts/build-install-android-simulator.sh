#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

find_android_tool() {
  local tool="$1"
  local sdk_dir="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"

  if command -v "$tool" >/dev/null 2>&1; then
    command -v "$tool"
    return 0
  fi

  for candidate in \
    "$sdk_dir/platform-tools/$tool" \
    "$sdk_dir/emulator/$tool"; do
    if [[ -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

ADB="$(find_android_tool adb)" || {
  echo "Missing adb. Install Android Studio, or set ANDROID_HOME/ANDROID_SDK_ROOT." >&2
  exit 1
}

running_emulator() {
  "$ADB" devices | awk '$1 ~ /^emulator-/ && $2 == "device" { print $1; exit }'
}

boot_completed() {
  "$ADB" -s "$1" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r'
}

wait_for_emulator() {
  local serial=""

  for _ in {1..120}; do
    serial="$(running_emulator || true)"
    if [[ -n "$serial" && "$(boot_completed "$serial")" == "1" ]]; then
      printf '%s\n' "$serial"
      return 0
    fi
    sleep 2
  done

  return 1
}

ANDROID_TARGET="${ANDROID_EMULATOR_SERIAL:-}"
if [[ -z "$ANDROID_TARGET" ]]; then
  ANDROID_TARGET="$(running_emulator || true)"
fi

if [[ -z "$ANDROID_TARGET" ]]; then
  EMULATOR="$(find_android_tool emulator)" || {
    echo "Missing emulator. Install Android Studio emulator tools." >&2
    exit 1
  }

  AVD_NAME="${ANDROID_AVD_NAME:-$("$EMULATOR" -list-avds | sed -n '1p')}"
  if [[ -z "$AVD_NAME" ]]; then
    echo "No Android emulator found. Create an AVD in Android Studio Device Manager." >&2
    exit 1
  fi

  echo "Starting Android emulator: $AVD_NAME"
  nohup "$EMULATOR" -avd "$AVD_NAME" >/tmp/vinago-android-emulator.log 2>&1 &
  ANDROID_TARGET="$(wait_for_emulator)" || {
    echo "Android emulator did not finish booting. See /tmp/vinago-android-emulator.log." >&2
    exit 1
  }
elif [[ "$(boot_completed "$ANDROID_TARGET")" != "1" ]]; then
  echo "Waiting Android emulator: $ANDROID_TARGET"
  ANDROID_TARGET="$(wait_for_emulator)" || {
    echo "Android emulator did not finish booting." >&2
    exit 1
  }
fi

exec npx expo run:android --device "$ANDROID_TARGET" "$@"
