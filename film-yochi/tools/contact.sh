#!/usr/bin/env bash
# One frame per second from a rendered film, as a labelled contact sheet.
# usage: tools/contact.sh <film.mp4> <out.jpg> [cols] [thumbW]
set -euo pipefail
IN="$1"; OUT="$2"; COLS="${3:-6}"; TW="${4:-320}"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
for ((s = 0; s < ${DUR%.*} + 1; s++)); do
  ffmpeg -hide_banner -loglevel error -ss "$s" -i "$IN" -frames:v 1 "$TMP/t$(printf '%07.3f' "$s").png" || true
done
python3 "$(dirname "$0")/sheet.py" "$TMP" "$OUT" "$COLS" "$TW"
