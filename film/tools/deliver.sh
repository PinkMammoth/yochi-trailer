#!/usr/bin/env bash
# Encode delivery files from a rendered master.
# usage: tools/deliver.sh <master.mkv> <audio.wav> <out_dir> <name> [duration]
#   <name>.mp4        1080p30, 2-pass ~5.8 Mbps (fits under 50 MB for 62 s): upload this to X
#   <name>-small.mp4  1080p30, 2-pass ~3.4 Mbps (under 30 MB): for chat/messaging previews
set -euo pipefail
MASTER="$1"; AUDIO="$2"; OUT="$3"; NAME="$4"; DUR="${5:-62}"
mkdir -p "$OUT"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
enc() { # $1 = video kbps, $2 = audio kbps, $3 = output
  ffmpeg -hide_banner -loglevel error -y -i "$MASTER" -c:v libx264 -preset slow -b:v "${1}k" -pass 1 -passlogfile "$TMP/p" \
    -pix_fmt yuv420p -profile:v high -r 30 -an -f mp4 /dev/null
  ffmpeg -hide_banner -loglevel error -y -i "$MASTER" -t "$DUR" -i "$AUDIO" -map 0:v -map 1:a \
    -c:v libx264 -preset slow -b:v "${1}k" -maxrate "$(( $1 * 2 ))k" -bufsize "$(( $1 * 4 ))k" -pass 2 -passlogfile "$TMP/p" \
    -pix_fmt yuv420p -profile:v high -r 30 -c:a aac -b:a "${2}k" -movflags +faststart -t "$DUR" "$3"
}
enc 5800 256 "$OUT/$NAME.mp4"
enc 3400 192 "$OUT/$NAME-small.mp4"
ls -la "$OUT/$NAME.mp4" "$OUT/$NAME-small.mp4"
