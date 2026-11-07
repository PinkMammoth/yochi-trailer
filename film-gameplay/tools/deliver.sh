#!/usr/bin/env bash
# Delivery encodes from the lossless render and the built soundtrack.
#   <name>-master.mov  H.264 High 4:2:0, CRF 14 (under GitHub's 100 MB file limit), BT.709, + 48 kHz 24-bit PCM: the archive / re-edit master
#   <name>.mp4         X-ready: 2-pass ~8 Mbps H.264 High, yuv420p, BT.709, AAC 256 kbps, faststart
# usage: tools/deliver.sh out/A_lossless.mkv out/A.wav deliverables yochi-elysium-testnet
set -euo pipefail
in=$1; wav=$2; dir=$3; name=$4
mkdir -p "$dir"
VF="scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p"
TAGS=(-colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv)
ffmpeg -hide_banner -loglevel error -y -i "$in" -i "$wav" -map 0:v -map 1:a -vf "$VF" -c:v libx264 -preset slow -crf 14 -profile:v high \
  "${TAGS[@]}" -c:a pcm_s24le -shortest "$dir/$name-master.mov"
cd "$(mktemp -d)"
X264=(-c:v libx264 -preset slow -b:v 8000k -maxrate 16000k -bufsize 32000k -profile:v high -level 4.1 -g 60 "${TAGS[@]}")
ffmpeg -hide_banner -loglevel error -y -i "$OLDPWD/$in" -vf "$VF" "${X264[@]}" -pass 1 -an -f mp4 /dev/null
ffmpeg -hide_banner -loglevel error -y -i "$OLDPWD/$in" -i "$OLDPWD/$wav" -map 0:v -map 1:a -vf "$VF" "${X264[@]}" -pass 2 \
  -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$OLDPWD/$dir/$name.mp4"
cd "$OLDPWD"
ls -la "$dir/$name-master.mov" "$dir/$name.mp4"
