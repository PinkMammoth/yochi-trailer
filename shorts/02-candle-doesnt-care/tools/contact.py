#!/usr/bin/env python3
"""Timed storyboard / contact sheet from the encoded MP4: one frame every STEP seconds, labelled with the time,
the beat (from timing.ts) and the audio level at that moment (from the mix), so pacing can be judged without
playback.

usage: python3 tools/contact.py <film.mp4> <mix.wav> <out.jpg> [step=0.25] [cols=8]
"""
import os, re, subprocess, sys, tempfile, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

mp4, wav, out = sys.argv[1:4]
step = float(sys.argv[4]) if len(sys.argv) > 4 else 0.25
cols = int(sys.argv[5]) if len(sys.argv) > 5 else 8
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = open(os.path.join(HERE, '..', 'project', 'src', 'timing.ts')).read()
dur = float(re.search(r'dur: ([\d.]+)', SRC).group(1))

BEATS = [(0.0, 'WIDE · blood moon'), (0.3, '"studied the markets"'), (2.5, 'MEDIUM · push to hand'),
         (2.7, '"mastered TA"'), (5.0, 'EYES'), (5.2, '"I cannot lose."'), (6.4, 'SILENCE'),
         (7.12, 'shadow falls'), (7.46, 'candle enters'), (7.7, 'IMPACT'), (7.74, 'ink negative'),
         (7.8, 'sandals fly'), (8.3, 'aftermath'), (8.9, 'one returns'), (9.18, 'squeak'),
         (9.66, 'pause'), (10.0, 'TITLE'), (11.6, 'END CARD'), (11.75, 'stamp')]


def beat(t):
    b = BEATS[0][1]
    for t0, n in BEATS:
        if t + 1e-6 >= t0:
            b = n
    return b


with wave.open(wav) as wf:
    sr = wf.getframerate()
    raw = np.frombuffer(wf.readframes(wf.getnframes()), np.uint8).reshape(-1, 2, 3).astype(np.int32)
    x = (raw[..., 0] | (raw[..., 1] << 8) | (raw[..., 2] << 16))
    x = np.where(x >= 2 ** 23, x - 2 ** 24, x) / 2 ** 23
    mono = x.mean(1)


def level(t):
    a, b = int(max(0, t - 0.05) * sr), int((t + 0.05) * sr)
    r = np.sqrt((mono[a:b] ** 2).mean() + 1e-12)
    return 20 * np.log10(r)


times = list(np.arange(0, dur - 1e-6, step))
tmp = tempfile.mkdtemp()
subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', f'fps=1/{step},scale=216:384', os.path.join(tmp, 'f%04d.png')], check=True)
files = sorted(os.listdir(tmp))
tw, th, lab = 216, 384, 46
rows = (len(times) + cols - 1) // cols
S = Image.new('RGB', (cols * tw, rows * (th + lab) + 50), (18, 16, 14))
d = ImageDraw.Draw(S)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
    big = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
except OSError:
    font = big = ImageFont.load_default()
d.text((10, 14), f"THE CANDLE DOESN'T CARE · timed storyboard · one frame every {step}s · {dur}s · level = mix RMS (dB) at that moment", fill=(239, 231, 216), font=big)
for i, t in enumerate(times):
    if i >= len(files):
        break
    x, y = (i % cols) * tw, 50 + (i // cols) * (th + lab)
    S.paste(Image.open(os.path.join(tmp, files[i])).convert('RGB'), (x, y + lab))
    lv = level(t)
    d.text((x + 5, y + 4), f'{t:5.2f}s  {beat(t)}', fill=(239, 231, 216), font=font)
    d.text((x + 5, y + 22), 'silence' if lv < -90 else f'{lv:5.1f} dB', fill=(255, 84, 54) if lv < -90 else (163, 154, 138), font=font)
S.save(out, quality=86)
print('wrote', out, len(times), 'frames')
