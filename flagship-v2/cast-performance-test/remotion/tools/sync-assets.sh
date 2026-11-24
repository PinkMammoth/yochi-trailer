#!/usr/bin/env bash
# Fills public/ (not committed), read-only, from the derived layers and the kit fonts.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=../../..
mkdir -p public/cp public/fonts
cp ../assets/derived/layers/* public/cp/
cp $REPO/asset-pack/sumi/fonts/*.woff2 $REPO/asset-pack/sumi/fonts/YujiSyuku-Regular.ttf public/fonts/
echo "public/ synced"
