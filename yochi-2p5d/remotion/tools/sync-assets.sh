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
done
cp ../../asset-pack/sumi/fonts/YujiSyuku-Regular.ttf public/fonts/
if [ -d ../blender/out ]; then
  for s in ../blender/out/*/; do
    [ -d "$s/back" ] || continue
    n=$(basename "$s"); rm -rf "public/passes/$n"; mkdir -p "public/passes/$n"; cp -r "$s/back" "$s/front" "public/passes/$n/"
  done
fi
echo "public/ synced: $(ls public/characters | tr '\n' ' ')"
