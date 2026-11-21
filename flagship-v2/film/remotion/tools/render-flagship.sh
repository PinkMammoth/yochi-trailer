#!/usr/bin/env bash
# Renders the flagship v2 animatic silent, then muxes the flagship mix (stems stay separate in ../audio/out-flagship).
#   tools/render-flagship.sh <out.mp4>
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=$1; WAV=${2:-../audio/out-flagship/mix.wav}
mkdir -p out "$(dirname "$OUT")"
BROWSER=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
npx remotion render src/index.ts Flagship-v2 out/silent-Flagship-v2.mp4 --gl=swangle --concurrency=${CONC:-4} --crf=16 --muted --browser-executable=$BROWSER --log=error
ffmpeg -y -loglevel error -i out/silent-Flagship-v2.mp4 -i "$WAV" -map 0:v -map 1:a -c:v libx264 -preset medium -crf 19 -profile:v high -pix_fmt yuv420p \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$OUT"
echo "$OUT"
