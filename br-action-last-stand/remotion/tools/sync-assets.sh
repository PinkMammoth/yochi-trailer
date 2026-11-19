#!/usr/bin/env bash
# Fills public/ (not committed) read-only from the kit and the 2.5D package's prepared characters.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=../..
mkdir -p public/characters public/fonts public/cards public/audio
for id in cold-blooded duel-master; do
  b=$REPO/yochi-2p5d/characters/$id/build
  [ -f "$b/fig.png" ] || python3 $REPO/yochi-2p5d/prep/prepare_character.py "$id"
  mkdir -p public/characters/$id
  cp "$b"/{fig,bg,depth,meta}.* public/characters/$id/
  cp "$b"/flow.png public/characters/$id/ 2>/dev/null || true
done
cp ../assets/cards/*.webp public/cards/
cp $REPO/asset-pack/sumi/fonts/*.woff2 $REPO/asset-pack/sumi/fonts/YujiSyuku-Regular.ttf public/fonts/
cp ../audio/out/*.wav public/audio/ 2>/dev/null || true
echo "public/ synced"
