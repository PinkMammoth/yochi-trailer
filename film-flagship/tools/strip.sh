#!/usr/bin/env bash
# Motion review: every frame (30 fps) from t0 for n frames, tiled. usage: tools/strip.sh <out.jpg> <t0> <n> [cols] [step frames]
set -e
D=$(mktemp -d); T=$(python3 -c "print(' '.join(f'{$2+i*${5:-1}/30:.4f}' for i in range($3)))")
node tools/still.mjs $D $T --w 640 --h 360 > /dev/null
python3 tools/sheet.py $D "$1" ${4:-6} 320 > /dev/null; rm -rf $D; echo "$1"
