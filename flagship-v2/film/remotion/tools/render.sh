#!/usr/bin/env bash
# Renders one format silent (near-lossless), then muxes the audio mix. Audio stays three separate stems.
#   tools/render.sh <16x9|9x16> <out.mp4> [mix.wav]
set -euo pipefail
cd "$(dirname "$0")/.."
F=$1; OUT=$2; WAV=${3:-../audio/out/mix.wav}
mkdir -p out "$(dirname "$OUT")"
BROWSER=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
npx remotion render src/index.ts Duels-$F out/silent-$F.mp4 --gl=swangle --concurrency=${CONC:-4} --crf=12 --muted --browser-executable=$BROWSER --log=error
ffmpeg -y -loglevel error -i out/silent-$F.mp4 -i "$WAV" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 16 -profile:v high -pix_fmt yuv420p \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$OUT"
echo "$OUT"
