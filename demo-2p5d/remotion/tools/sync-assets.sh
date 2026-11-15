#!/usr/bin/env bash
# Copies the derived plates, the brand glyph font and (if rendered) Blender's passes into
# public/. Nothing here is committed: the sources of truth are demo-2p5d/assets,
# asset-pack/sumi/fonts and demo-2p5d/blender/out.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public
cp ../assets/{char,bg,bg_depth,weights}.png public/
cp ../../asset-pack/sumi/fonts/YujiSyuku-Regular.ttf public/
if [ -d ../blender/out/back ]; then
  rm -rf public/blender && mkdir -p public/blender
  cp -r ../blender/out/back ../blender/out/front public/blender/
fi
echo "public/ synced"
