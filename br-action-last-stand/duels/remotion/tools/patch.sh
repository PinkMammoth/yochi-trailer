#!/usr/bin/env bash
# Patches single blank frames (the yochi-2p5d parallel-render glitch) in a silent render: re-renders each flagged
# frame as a still, overlays it on exactly that frame, then re-muxes the mix.  tools/patch.sh <16x9|9x16> <out.mp4> <frame> [frame ...]
set -euo pipefail
cd "$(dirname "$0")/.."
F=$1; OUT=$2; shift 2
COMP=Duels-$F node tools/frames.mjs out/patch-$F "$@" >/dev/null
IN=(-i out/silent-$F.mp4); FC=""; prev="[0:v]"; k=1
for f in "$@"; do
  IN+=(-i "out/patch-$F/f$(printf %04d "$f").png")
  FC+="${prev}[$k:v]overlay=0:0:enable='eq(n\\,$f)'[v$k];"; prev="[v$k]"; k=$((k+1))
done
ffmpeg -y -loglevel error "${IN[@]}" -filter_complex "${FC%;}" -map "$prev" -c:v libx264 -preset slow -crf 12 -pix_fmt yuv420p out/silent-$F-patched.mp4
ffmpeg -y -loglevel error -i out/silent-$F-patched.mp4 -i ../audio/out/mix.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 16 -profile:v high -pix_fmt yuv420p \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$OUT"
echo "$OUT (patched frames: $*)"
