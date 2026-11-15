#!/usr/bin/env bash
# Copies the rendered app assets (../deliverables/app) into the app repo (callit.win, call-it-final):
#   tools/export-to-app.sh /path/to/callit.win
# -> app/client/public/avatars/living/<card>-loop.mp4, <card>-unlock.mp4, <card>-unlock.webp
# The app lists the cards that have living assets in app/client/src/lib/living-cards.ts (LIVING): keep it in
# sync with src/app/rewards.ts when a reward is added.
set -euo pipefail
APP="${1:?usage: export-to-app.sh /path/to/callit.win}"
SRC="$(cd "$(dirname "$0")/../../deliverables/app" && pwd)"
DST="$APP/app/client/public/avatars/living"
mkdir -p "$DST"
cp "$SRC"/*-loop.mp4 "$SRC"/*-unlock.mp4 "$SRC"/*-unlock.webp "$DST/"
echo "copied $(ls "$SRC"/*-loop.mp4 | wc -l) loops, $(ls "$SRC"/*-unlock.mp4 | wc -l) unlock clips to $DST ($(du -sh "$DST" | cut -f1))"
