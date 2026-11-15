#!/usr/bin/env bash
# A | B side by side (each 960x540), labelled, 5 s. Usage: prep/side_by_side.sh A.mp4 B.mp4 out.mp4
set -euo pipefail
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf
[ -f "$FONT" ] || FONT=$(fc-match -f '%{file}' monospace)
ffmpeg -v error -y -i "$1" -i "$2" -filter_complex "\
[0:v]scale=960:540,drawtext=fontfile=$FONT:text='A  PURE REMOTION':x=24:y=24:fontsize=22:fontcolor=0xefe7d8:box=1:boxcolor=0x0f0d0bcc:boxborderw=8[a];\
[1:v]scale=960:540,drawtext=fontfile=$FONT:text='B  BLENDER + REMOTION':x=24:y=24:fontsize=22:fontcolor=0xefe7d8:box=1:boxcolor=0x0f0d0bcc:boxborderw=8[b];\
[a][b]hstack=inputs=2,pad=1920:1080:0:270:color=0x0f0d0b[v]" -map "[v]" -c:v libx264 -crf 16 -pix_fmt yuv420p -r 30 "$3"
echo "wrote $3"
