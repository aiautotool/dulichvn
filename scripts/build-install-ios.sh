#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

IOS_TARGET="${IOS_DEVICE:-${EXPO_DEVICE:-}}"

discover_single_connected_iphone() {
  local devices_json
  devices_json="$(mktemp)"
  if ! xcrun devicectl list devices --json-output "$devices_json" >/dev/null 2>&1; then
    rm -f "$devices_json"
    return
  fi

  local count
  count="$(jq '[.result.devices[] | select(.hardwareProperties.platform == "iOS" and .hardwareProperties.reality == "physical" and .connectionProperties.tunnelState == "connected")] | length' "$devices_json")"
  if [[ "$count" == "1" ]]; then
    jq -r '.result.devices[] | select(.hardwareProperties.platform == "iOS" and .hardwareProperties.reality == "physical" and .connectionProperties.tunnelState == "connected") | .hardwareProperties.udid' "$devices_json"
  fi
  rm -f "$devices_json"
}

wait_until_device_is_unlocked() {
  local device="$1"
  local timeout_seconds="${WAIT_FOR_DEVICE_UNLOCK_SECONDS:-180}"
  local started_at
  started_at="$(date +%s)"
  local lock_json
  lock_json="$(mktemp)"

  while true; do
    if xcrun devicectl device info lockState --device "$device" --json-output "$lock_json" >/dev/null 2>&1; then
      if [[ "$(jq -r 'if .result.passcodeRequired == false then "false" else "true" end' "$lock_json")" == "false" ]]; then
        break
      fi
    fi

    if (( $(date +%s) - started_at >= timeout_seconds )); then
      echo "Không thể tiếp tục: iPhone vẫn đang khóa sau ${timeout_seconds} giây." >&2
      echo "Hãy mở khóa bằng mật mã, giữ màn hình sáng và chạy lại script." >&2
      rm -f "$lock_json"
      exit 70
    fi

    echo "Đang chờ mở khóa iPhone… Hãy nhập mật mã và giữ màn hình sáng."
    sleep 2
  done
  rm -f "$lock_json"

  echo "iPhone đã mở khóa. Đang chuẩn bị Developer Disk Image…"
  if ! xcrun devicectl device info details --device "$device" >/dev/null 2>&1; then
    echo "Không thể chuẩn bị Developer Disk Image. Hãy rút/cắm lại cáp và xác nhận Trust This Computer." >&2
    exit 70
  fi
}

if [[ -z "$IOS_TARGET" ]]; then
  IOS_TARGET="$(discover_single_connected_iphone)"
fi

if [[ -n "$IOS_TARGET" ]]; then
  wait_until_device_is_unlocked "$IOS_TARGET"
fi

device_args=(--device)
if [[ -n "$IOS_TARGET" ]]; then
  device_args=(--device "$IOS_TARGET")
fi

if [[ -n "$IOS_TARGET" ]]; then
  echo "Đang cập nhật Provisioning Profile tự động cho thiết bị iOS..."
  xcodebuild -workspace ios/Vinago.xcworkspace -scheme Vinago -configuration Release -destination "generic/platform=iOS" -allowProvisioningUpdates || true
fi

exec npx expo run:ios \
  --configuration Release \
  --no-bundler \
  "${device_args[@]}" \
  "$@"
