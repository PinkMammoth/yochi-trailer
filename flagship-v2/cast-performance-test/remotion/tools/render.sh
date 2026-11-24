#!/usr/bin/env bash
# tools/render.sh <Comp> <cut: cinematic|trailer> <out.mp4> [propsJSON]   silent render, then the mix muxed in
set -euo pipefail
cd "$(dirname "$0")/.."
COMP=$1; CUT=$2; OUT=$3; PROPS=${4:-'{}'}
BROWSER=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
mkdir -p out
npx remotion render src/index.ts "$COMP" out/silent-$CUT.mp4 --props="$PROPS" --gl=swangle --concurrency=${CONC:-4} --crf=12 --muted --browser-executable=$BROWSER --log=error
ffmpeg -y -loglevel error -i out/silent-$CUT.mp4 -i ../audio/out/$CUT-mix.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 15 -profile:v high -pix_fmt yuv420p \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$OUT"
echo "$OUT"
