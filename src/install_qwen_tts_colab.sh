#!/usr/bin/env bash
set -Eeuo pipefail

# OmniVoice installer + Gradio WebApp for Google Colab
#
# Colab:
#   !wget -O /content/install_omnivoice_colab.sh \
#     https://aiautotool.com/script/install_omnivoice_colab.sh
#   !chmod +x /content/install_omnivoice_colab.sh
#   !/content/install_omnivoice_colab.sh
#
# Optional:
#   NO_ASR=1 /content/install_omnivoice_colab.sh
#   PORT=7860 MODEL=k2-fsa/OmniVoice /content/install_omnivoice_colab.sh

MODEL="${MODEL:-k2-fsa/OmniVoice}"
PORT="${PORT:-7860}"
NO_ASR="${NO_ASR:-0}"
WORKDIR="${WORKDIR:-/content/OmniVoice}"

TORCH_VERSION="${TORCH_VERSION:-2.8.0}"
TORCHVISION_VERSION="${TORCHVISION_VERSION:-0.23.0}"
TORCHAUDIO_VERSION="${TORCHAUDIO_VERSION:-2.8.0}"
TORCHCODEC_VERSION="${TORCHCODEC_VERSION:-0.7.0}"
PYTORCH_INDEX="${PYTORCH_INDEX:-https://download.pytorch.org/whl/cu128}"

log() {
  echo
  echo "[$1/7] $2"
}

fail() {
  echo
  echo "ERROR: $*" >&2
  exit 1
}

echo "============================================================"
echo " OmniVoice Colab installer + Gradio WebApp"
echo " Model      : ${MODEL}"
echo " Port       : ${PORT}"
echo " Workdir    : ${WORKDIR}"
echo " PyTorch    : ${TORCH_VERSION} cu128"
echo " TorchCodec : ${TORCHCODEC_VERSION}"
echo "============================================================"

command -v python >/dev/null 2>&1 || fail "Không tìm thấy Python."
command -v nvidia-smi >/dev/null 2>&1 || {
  fail "Không tìm thấy NVIDIA GPU. Chọn Runtime > Change runtime type > T4 GPU."
}

log 1 "GPU information"
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader

log 2 "System packages and FFmpeg shared libraries"

# The r2u warning shown by Colab is harmless. It does not stop installation.
apt-get update -qq || true

DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  git \
  git-lfs \
  ffmpeg \
  libsndfile1 \
  libavcodec-dev \
  libavformat-dev \
  libavutil-dev \
  libswresample-dev \
  libavfilter-dev \
  libavdevice-dev \
  pkg-config \
  > /dev/null

git lfs install --skip-repo >/dev/null 2>&1 || true
ldconfig

echo "FFmpeg: $(ffmpeg -version | head -n 1)"
if ! ldconfig -p | grep -q "libavutil.so"; then
  fail "FFmpeg đã cài nhưng không tìm thấy libavutil shared library."
fi
ldconfig -p | grep -E "libav(util|codec|format|filter|device|swresample)\.so" | head -n 20 || true

log 3 "Python tooling"

# Colab's current torch build requires setuptools < 82.
python -m pip install -q --upgrade \
  "pip<26" \
  "setuptools<82" \
  wheel \
  "jedi>=0.16"

log 4 "Installing matching PyTorch packages"

python -m pip uninstall -y -q \
  torch \
  torchaudio \
  torchvision \
  torchcodec \
  2>/dev/null || true

python -m pip install -q --no-cache-dir \
  "torch==${TORCH_VERSION}+cu128" \
  "torchaudio==${TORCHAUDIO_VERSION}+cu128" \
  "torchvision==${TORCHVISION_VERSION}+cu128" \
  --extra-index-url "${PYTORCH_INDEX}"

log 5 "Installing latest OmniVoice source"

if [ -d "${WORKDIR}/.git" ]; then
  git -C "${WORKDIR}" fetch --all --prune
  git -C "${WORKDIR}" reset --hard origin/master
  git -C "${WORKDIR}" clean -fd
else
  rm -rf "${WORKDIR}"
  git clone --depth 1 https://github.com/k2-fsa/OmniVoice.git "${WORKDIR}"
fi

cd "${WORKDIR}"

# Install OmniVoice first. pip may otherwise choose a newer torchcodec indirectly.
python -m pip install -q -e .

# Re-assert the exact PyTorch set after OmniVoice dependencies are resolved.
python -m pip install -q --no-cache-dir --force-reinstall --no-deps \
  "torch==${TORCH_VERSION}+cu128" \
  "torchaudio==${TORCHAUDIO_VERSION}+cu128" \
  "torchvision==${TORCHVISION_VERSION}+cu128" \
  --extra-index-url "${PYTORCH_INDEX}"

# TorchCodec 0.7.x is the matching line for PyTorch 2.8.
# --no-deps prevents it from replacing the pinned PyTorch installation.
python -m pip uninstall -y -q torchcodec 2>/dev/null || true
python -m pip install -q --no-cache-dir --no-deps \
  "torchcodec==${TORCHCODEC_VERSION}"

python -m pip install -q --upgrade \
  "gradio>=5,<7" \
  huggingface_hub \
  hf_xet \
  soundfile

ldconfig

log 6 "Verification"

python - <<'PY'
import shutil
import subprocess
import torch
import torchaudio
import torchvision
import torchcodec
import omnivoice

print("Torch       :", torch.__version__)
print("Torchaudio  :", torchaudio.__version__)
print("Torchvision :", torchvision.__version__)
print("TorchCodec  :", torchcodec.__version__)
print("CUDA        :", torch.cuda.is_available())

if not torch.cuda.is_available():
    raise SystemExit("CUDA is not available.")

print("GPU         :", torch.cuda.get_device_name(0))
print("OmniVoice   : import OK")

ffmpeg = shutil.which("ffmpeg")
if not ffmpeg:
    raise SystemExit("ffmpeg command not found.")

print("FFmpeg      :", subprocess.check_output(
    [ffmpeg, "-version"], text=True
).splitlines()[0])
PY

command -v omnivoice-demo >/dev/null 2>&1 || {
  fail "Không tìm thấy command omnivoice-demo sau khi cài."
}

log 7 "Launching OmniVoice WebApp"

echo "The first launch downloads the model files."
echo "Open the public https://*.gradio.live URL printed below."
echo "Stop using the Colab cell stop button."
echo

ARGS=(
  --model "${MODEL}"
  --device "cuda:0"
  --ip "0.0.0.0"
  --port "${PORT}"
  --share
)

if [ "${NO_ASR}" = "1" ]; then
  ARGS+=(--no-asr)
  echo "Whisper ASR disabled."
  echo "Enter the reference transcript manually when cloning a voice."
  echo
fi

export PYTORCH_CUDA_ALLOC_CONF="expandable_segments:True"
export HF_HUB_ENABLE_HF_TRANSFER=0
export TOKENIZERS_PARALLELISM=false
export LD_LIBRARY_PATH="/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"

exec omnivoice-demo "${ARGS[@]}"
