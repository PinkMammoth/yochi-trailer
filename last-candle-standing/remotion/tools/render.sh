#!/usr/bin/env bash
# Renders the film (silent, near-lossless) and muxes the score's mix. Usage:
#   tools/render.sh <out.mp4> [status] [audio wav]     status: none | coming-soon | testnet | elysium
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=${1:-out/last-candle-standing.mp4}; STATUS=${2:-none}; WAV=${3:-../audio/out/mix.wav}
mkdir -p out "$(dirname "$OUT")"
BROWSER=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
npx remotion render src/index.ts LastCandleStanding out/silent-$STATUS.mp4 --gl=swangle --concurrency=4 --crf=14 \
  --muted --props="{\"status\":\"$STATUS\",\"music\":false,\"sfx\":false,\"voice\":false}" --browser-executable=$BROWSER --log=error
# H.264 High, yuv420p, AAC 320k, faststart (X / mobile friendly)
ffmpeg -y -loglevel error -i out/silent-$STATUS.mp4 -i "$WAV" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$OUT"
echo "$OUT"
