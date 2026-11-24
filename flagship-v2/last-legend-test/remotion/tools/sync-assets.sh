#!/usr/bin/env bash
# Fills public/ (not committed), read-only, from the derived layers and the kit.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=../../..
mkdir -p public/ll public/fonts
cp ../assets/derived/layers/*.png public/ll/
cp $REPO/asset-pack/sumi/fonts/*.woff2 $REPO/asset-pack/sumi/fonts/YujiSyuku-Regular.ttf public/fonts/
echo "public/ synced"
