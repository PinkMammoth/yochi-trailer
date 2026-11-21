#!/usr/bin/env bash
# Fills public/ (not committed) read-only: the two kit cards' 2.5D builds from yochi-2p5d, this film's approved pose
# images and their mattes, the kit fonts and seal, and the audio stems.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=../../..
mkdir -p public/characters public/fonts public/poses public/mattes public/logo public/audio
for id in rampage duel-master; do
  b=$REPO/yochi-2p5d/characters/$id/build
  [ -f "$b/fig.png" ] || python3 $REPO/yochi-2p5d/prep/prepare_character.py "$id"
  mkdir -p public/characters/$id
  cp "$b"/{fig,bg,depth,meta}.* public/characters/$id/
  cp "$b"/flow.png public/characters/$id/ 2>/dev/null || true
  # card format overlays the card's frame: we always frame inside the painting, so a transparent frame stands in
  python3 -c "from PIL import Image; Image.new('RGBA',(1392,1828),(0,0,0,0)).save('public/characters/$id/frame.png')"
done
cp ../assets/poses/*.webp public/poses/
cp ../assets/mattes/*.png public/mattes/
mkdir -p public/pullback && cp ../../pullback-test/assets/derived/layers/*.png public/pullback/ 2>/dev/null || true
mkdir -p public/cast public/audio-flagship && cp ../assets/cast/*.webp public/cast/ && cp ../audio/out-flagship/*.wav public/audio-flagship/ 2>/dev/null || true
cp $REPO/asset-pack/sumi/fonts/*.woff2 $REPO/asset-pack/sumi/fonts/YujiSyuku-Regular.ttf public/fonts/
cp $REPO/asset-pack/sumi/logo/yochi-seal-paper.svg $REPO/asset-pack/sumi/logo/yochi-seal-sumi.svg public/logo/
cp ../audio/out/*.wav public/audio/ 2>/dev/null || true
echo "public/ synced"
