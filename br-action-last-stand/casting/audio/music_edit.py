#!/usr/bin/env python3
"""THE LAST STAND v2: the storyboard's music edit (audio only, for judging pacing by ear before any animation).

One continuous run of the owner's track from src.in, with ONE edit: a single beat of true silence inserted at
src.insertAt (just before drop 2), then the track carries on, so every later hit stays on the beat grid. It ends
with a fade of the track's own continuation. No pitch shift, no stretch, no new music. All numbers come from
../storyboard-timing.json.

Writes out/music-edit-preview.wav (48 kHz stereo) and out/music-edit-sheet.png (waveform with every shot marked).
usage: python3 casting/audio/music_edit.py
"""
import json, os, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..', '..')
T = json.load(open(os.path.join(HERE, '..', 'storyboard-timing.json')))
S = T['src']
SRC = os.path.join(ROOT, 'last-candle-standing', 'v4', 'music-source', S['file'])
OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
SR = 48000


def grab(a, b):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', f'{a:.4f}', '-t', f'{b - a:.4f}', '-i', SRC, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, '<f4').reshape(-1, 2).T.astype(float).copy()


A = grab(S['in'], S['insertAt'])
B = grab(S['insertAt'], S['out'])
g = int(0.012 * SR)
A[:, -g:] *= np.linspace(1, 0, g)          # a 12 ms close into the silence
B[:, :g] *= np.linspace(0, 1, g) ** 0.5     # and a 12 ms open out of it
sil = np.zeros((2, int(round(S['insertLen'] * SR))))
x = np.concatenate([A, sil, B], axis=1)
N = int(round(T['dur'] * SR))
x = np.pad(x, ((0, 0), (0, max(0, N - x.shape[1]))))[:, :N]
x[:, :int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))
f0 = int(round((S['fadeFrom'] - S['in'] + S['insertLen']) * SR)); fl = int(S['fadeLen'] * SR)
x[:, f0:f0 + fl] *= np.linspace(1, 0, fl)[None, :] ** 2
x[:, f0 + fl:] = 0
pk = np.abs(x).max(); x *= 10 ** (-1.0 / 20) / pk
y = (np.clip(x, -1, 1) * 32767).astype('<i2').T.copy()
p = os.path.join(OUT, 'music-edit-preview.wav')
with wave.open(p, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())
print(p, f'{x.shape[1] / SR:.3f} s')

# the sheet
m = x.mean(0); W, H = 2400, 520
im = Image.new('RGB', (W, H), '#0f0d0b'); d = ImageDraw.Draw(im)
fnt = ImageFont.truetype(os.path.join(ROOT, 'asset-pack', 'sumi', 'fonts', 'jetbrains-mono-latin-500-normal.woff2'), 15)
px = lambda t: int(50 + (W - 100) * t / T['dur'])
hop = SR // 200
for i in range(len(m) // hop):
    a = np.abs(m[i * hop:(i + 1) * hop]).max(); X = px(i * hop / SR)
    d.line([(X, 300 - a * 170), (X, 300 + a * 170)], fill='#a39a8a')
ins0 = S['insertAt'] - S['in']
d.rectangle([px(ins0), 120, px(ins0 + S['insertLen']), 480], outline='#3ddc84', width=2)
d.text((px(ins0) + 4, 484), 'inserted beat', fill='#3ddc84', font=fnt)
for k, s in enumerate(T['shots']):
    X = px(s['t']); d.line([(X, 30), (X, 480)], fill='#ff5436', width=2)
    d.text((X + 4, 30 + (k % 5) * 18), f"{s['id']} {s['name']}", fill='#efe7d8', font=fnt)
for s in range(int(T['dur']) + 1):
    d.text((px(s) - 6, 500), f'{s}s', fill='#a39a8a', font=fnt)
q = os.path.join(OUT, 'music-edit-sheet.png'); im.save(q); print(q)
