#!/usr/bin/env bash
# tools/render-pullback.sh <out.mp4> [propsJSON]   renders the pullback test silent, then muxes its mix
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=$1; PROPS=${2:-'{}'}
BROWSER=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
mkdir -p out
npx remotion render src/index.ts Pullback-Test out/silent-pullback.mp4 --props="$PROPS" --gl=swangle --concurrency=${CONC:-4} --crf=14 --muted --browser-executable=$BROWSER --log=error
ffmpeg -y -loglevel error -i out/silent-pullback.mp4 -i ../../pullback-test/audio/out/mix.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 15 -profile:v high -pix_fmt yuv420p \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$OUT"
echo "$OUT"
