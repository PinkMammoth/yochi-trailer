#!/usr/bin/env bash
# Fills public/ (not committed): this film's own copies of the art (../assets), the kit fonts and seal, the audio.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=../..
rm -rf public && mkdir -p public/fonts public/logo public/audio
cp -r ../assets/cast ../assets/cards ../assets/poses ../assets/mattes public/
cp $REPO/asset-pack/sumi/fonts/*.woff2 $REPO/asset-pack/sumi/fonts/YujiSyuku-Regular.ttf public/fonts/
cp $REPO/asset-pack/sumi/logo/yochi-seal-paper.svg $REPO/asset-pack/sumi/logo/yochi-seal-sumi.svg public/logo/
cp ../audio/out/*.wav public/audio/
echo "public/ synced"
