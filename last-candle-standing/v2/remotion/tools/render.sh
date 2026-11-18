#!/usr/bin/env bash
# Renders one format of the V2 film (silent, near-lossless) and muxes the mix. Usage:
#   tools/render.sh <16x9|9x16> <out.mp4> [status] [audio wav]     status: none | coming-soon | testnet | elysium
set -euo pipefail
cd "$(dirname "$0")/.."
F=$1; OUT=$2; STATUS=${3:-none}; WAV=${4:-../audio/out/mix.wav}
FMT=$([ "$F" = 16x9 ] && echo 16:9 || echo 9:16)
mkdir -p out "$(dirname "$OUT")"
BROWSER=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
npx remotion render src/index.ts BR-V2-$F out/silent-$F-$STATUS.mp4 --gl=swangle --concurrency=4 --crf=14 \
  --muted --props="{\"format\":\"$FMT\",\"status\":\"$STATUS\",\"music\":false,\"sfx\":false}" --browser-executable=$BROWSER --log=error
ffmpeg -y -loglevel error -i out/silent-$F-$STATUS.mp4 -i "$WAV" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$OUT"
echo "$OUT"
