#!/usr/bin/env python3
"""Draws V2's music edit and V3's two candidates on one time axis (spectrogram + RMS), with the splices and the
key marks. usage: python3 audio/compare.py <out.png>"""
import json, os, sys, wave
import numpy as np
from PIL import Image, ImageDraw
import librosa

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
rows = [('V2  (splice to the outro at 17.73)', os.path.join(HERE, '..', '..', 'v2', 'audio', 'out', 'music.wav'), [10.91, 17.729], {'slam': 16.536, 'stab': 20.663}),
        ('A  continuous', os.path.join(HERE, 'out', 'candidate-A.wav'), None, None),
        ('B  victory release (recommended)', os.path.join(HERE, 'out', 'candidate-B.wav'), None, None)]
info = json.load(open(os.path.join(HERE, 'out', 'candidates.json')))
DUR = 25.5
W, H = 2400, 210
img = Image.new('RGB', (W, H * 3 + 50), '#111')
d = ImageDraw.Draw(img)
X = lambda t: int(t / DUR * W)
for r, (name, path, splices, marks) in enumerate(rows):
    w = wave.open(path)
    x = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, 2).mean(1) / 32768
    hop = 256
    S = np.abs(librosa.stft(x, n_fft=2048, hop_length=hop))
    f = librosa.fft_frequencies(sr=SR, n_fft=2048)
    idx = np.searchsorted(f, np.geomspace(40, 16000, H - 30))
    spec = np.clip((20 * np.log10(S[idx] + 1e-6) + 20) / 70, 0, 1)[::-1]
    cols = int(len(x) / SR / DUR * W)
    im = Image.fromarray((np.stack([spec ** 1.5, spec ** 0.8 * 0.9, spec ** 0.5 * 0.6], -1) * 255).astype('uint8')).resize((cols, H - 30))
    img.paste(im, (0, r * H + 30))
    d.text((6, r * H + 6), name, fill='white')
    key = name[0]
    if key in info:
        splices = [e['video_in'] for e in info[key]['edl'][1:]]
        marks = info[key]['marks']
    for s in splices:
        d.line([(X(s), r * H + 26), (X(s), r * H + H)], fill='#ff5436', width=3)
    for k, v in marks.items():
        vs = v if isinstance(v, list) else [v]
        for vv in vs:
            d.line([(X(vv), r * H + 26), (X(vv), r * H + 40)], fill='#3ddc84', width=2)
            d.text((X(vv) + 3, r * H + 16), k, fill='#3ddc84')
for s in range(int(DUR) + 1):
    d.line([(X(s), H * 3), (X(s), H * 3 + 8)], fill='white')
    d.text((X(s) + 2, H * 3 + 12), f'{s}s', fill='white')
d.text((6, H * 3 + 30), 'red: splices   green: marks (silence, slam, drop 2, hits, accent = the stop\'s hit, stop)', fill='#aaa')
img.save(sys.argv[1])
print(sys.argv[1])
