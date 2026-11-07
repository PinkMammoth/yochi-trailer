#!/usr/bin/env bash
# Contact sheet: one frame every second (from 0.5 s), 5 across, timecoded. usage: tools/sheet.sh in.mp4 out.jpg
set -euo pipefail
ffmpeg -hide_banner -loglevel error -y -ss 0.5 -i "$1" -vf "fps=1,scale=384:-1,drawtext=text='%{eif\:t+0.5\:d}.5 s':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=4,pad=392:224:4:4:black,tile=5x5:color=black" -frames:v 1 -q:v 2 "$2"
echo "wrote $2"
