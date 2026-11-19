#!/usr/bin/env bash
# Fills public/ (not committed) from the film's own copies (../assets) and the 2.5D package's prepared characters.
# The prepared plates are deterministic: rebuild with `python3 ../../../yochi-2p5d/prep/prepare_character.py <id>`.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/characters public/fonts public/portraits public/cards public/logo public/audio
for id in starter-perma-bull last-legend high-roller bloodsport final-three; do
  b=../../../yochi-2p5d/characters/$id/build
  [ -f "$b/fig.png" ] || python3 ../../../yochi-2p5d/prep/prepare_character.py "$id"
  mkdir -p public/characters/$id
  cp "$b"/{fig,bg,depth,meta}.* public/characters/$id/ 2>/dev/null || true
  cp "$b"/flow.png public/characters/$id/ 2>/dev/null || true
done
cp ../../assets/portraits/* public/portraits/
cp ../../assets/cards/* public/cards/
cp ../../assets/logo/* public/logo/
cp ../../assets/fonts/* public/fonts/
cp ../audio/out/*.wav public/audio/ 2>/dev/null || true
echo "public/ synced"
