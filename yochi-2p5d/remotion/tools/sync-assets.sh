#!/usr/bin/env bash
# Copies prepared characters (../characters/<id>/build) and the brand glyph font into public/.
# Nothing in public/ is committed: the sources of truth are yochi-2p5d/characters and asset-pack/sumi/fonts.
# Blender passes, if any, are copied from ../blender/out/<shot> to public/passes/<shot>.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/characters public/fonts
for d in ../characters/*/build; do
  id=$(basename "$(dirname "$d")")
  mkdir -p "public/characters/$id"
  cp "$d"/{fig,bg,depth,meta}.* "public/characters/$id/" 2>/dev/null || true
  cp "$d"/flow.png "public/characters/$id/" 2>/dev/null || true
  cp "$d"/frame.png "public/characters/$id/" 2>/dev/null || true
done
cp ../../asset-pack/sumi/fonts/YujiSyuku-Regular.ttf public/fonts/
if [ -d ../blender/out ]; then
  for s in ../blender/out/*/; do
    [ -d "$s/back" ] || continue
    n=$(basename "$s"); rm -rf "public/passes/$n"; mkdir -p "public/passes/$n"; cp -r "$s/back" "$s/front" "public/passes/$n/"
  done
fi
echo "public/ synced: $(ls public/characters | tr '\n' ' ')"
# Films (src/films/*): brand fonts, marks, the Elysium crest, the kit cards used as objects, and the track.
# Read-only copies; asset-pack/ stays the source of truth.
mkdir -p public/fonts public/brand public/cards public/audio
cp ../../asset-pack/sumi/fonts/*.woff2 public/fonts/
cp ../../asset-pack/sumi/logo/yochi-{seal,mark}-{paper,sumi}.svg public/brand/
cp ../../asset-pack/Elysium/elysium-logomark-colorized.svg public/brand/
for c in took-the-pool insider-v2 hundred-trials duel-master ronin untouchable; do
  cp "../../asset-pack/sumi/avatars/cards/$c.webp" public/cards/
done
cp "../../asset-pack/audio/Victory Stamp.mp3" public/audio/victory-stamp.mp3
[ -d ../films-audio ] && cp ../films-audio/*.wav public/audio/ 2>/dev/null || true
echo "public/ film assets synced"
