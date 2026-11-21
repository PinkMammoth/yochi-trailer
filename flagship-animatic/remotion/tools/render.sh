#!/usr/bin/env bash
# Renders one composition silent, then muxes the audio mix. The three stems stay separate in ../audio/out.
#   tools/render.sh <Flagship-FFA|Flagship-BR|Pullback-Proto> <out.mp4> [mix.wav] [audio offset s]
set -euo pipefail
cd "$(dirname "$0")/.."
C=$1; OUT=$2; WAV=${3:-../audio/out/mix.wav}; OFF=${4:-0}
mkdir -p out "$(dirname "$OUT")"
BROWSER=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
npx remotion render src/index.ts $C out/silent-$C.mp4 --concurrency=${CONC:-4} --crf=16 --muted --browser-executable=$BROWSER --log=error
ffmpeg -y -loglevel error -i out/silent-$C.mp4 -ss $OFF -i "$WAV" -map 0:v -map 1:a -c:v libx264 -preset medium -crf 18 -profile:v high -pix_fmt yuv420p \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$OUT"
echo "$OUT"
