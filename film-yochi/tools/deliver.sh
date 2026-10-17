#!/usr/bin/env bash
# Delivery encode from a kept master (render with --keep 1): 2-pass H.264 at a feed-friendly bitrate + AAC.
# usage: tools/deliver.sh <master.mkv> <audio.wav> <out.mp4> [video kbps]
set -euo pipefail
MASTER="$1"; AUDIO="$2"; OUT="$3"; KB="${4:-8000}"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
ffmpeg -hide_banner -loglevel error -y -i "$MASTER" -c:v libx264 -preset slow -b:v "${KB}k" -pass 1 -passlogfile "$TMP/p" \
  -pix_fmt yuv420p -profile:v high -r 30 -an -f mp4 /dev/null
ffmpeg -hide_banner -loglevel error -y -i "$MASTER" -i "$AUDIO" -map 0:v -map 1:a -c:v libx264 -preset slow -b:v "${KB}k" \
  -maxrate "$((KB * 2))k" -bufsize "$((KB * 4))k" -pass 2 -passlogfile "$TMP/p" -pix_fmt yuv420p -profile:v high -r 30 \
  -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$OUT"
ls -la "$OUT"
