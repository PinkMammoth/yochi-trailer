#!/usr/bin/env python3
"""Temporary sound for the cast performance tests, v2. Separate stems per cut: out/<cut>-{music,sfx,mix}.wav.
Music: the flagship's track (last-candle-standing/v4/music-source/Victory Stamp_dark_dnb.mp3), untouched excerpts on
the flagship's bar grid: the loss bar (137, src 198.987 s) for Cold Blooded, the win bar (138, src 200.351 s) for High
Roller and Untouchable. SFX are synthesised placeholders (no recorded foley in the kit). Untouchable's freeze is a true
dropout of every stem (the house 'silence' move). No new music is generated. Unauditioned: I can't listen."""
import json, os, subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = f'{HERE}/out'; os.makedirs(OUT, exist_ok=True)
SR = 48000
TRACK = f'{HERE}/../../../last-candle-standing/v4/music-source/Victory Stamp_dark_dnb.mp3'
OFF = 134.028                       # flagship time -> source time after the flagship's splice (MUSIC_CUES.md)
BAR137, BAR138 = 64.9585 + OFF, 66.3223 + OFF
T = json.load(open(f'{HERE}/timing.json')); FPS = T['FPS']
rng = np.random.default_rng(21)


def music(src, dur):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{src:.4f}', '-t', f'{dur:.4f}', '-i', TRACK, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, btype='low', fs=SR, output='sos'), x)
def env(n, a, d): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)
def db(x): return 10 ** (x / 20)
def place(buf, sig, t0, g=1.0, pan=0.0):
    i = int(round(t0 * SR))
    if sig.ndim == 1: sig = np.stack([sig * (1 - max(0, pan)), sig * (1 + min(0, pan))], 1)
    j0, j1 = max(0, i), min(len(buf), i + len(sig))
    if j1 > j0: buf[j0:j1] += sig[j0 - i:j1 - i] * g
def noise(sec): return rng.standard_normal(int(sec * SR))
def clink(f0=2600):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * t) * a for f, a in ((f0, 1), (f0 * 1.51, 0.6), (f0 * 2.27, 0.35))) * env(n, 0.0005, 0.025)
def whoosh(sec, lo=200, hi=3000, up=True):
    x = bp(noise(sec), lo, hi); e = np.linspace(0, 1, len(x)) if up else np.linspace(1, 0, len(x)); return x * e ** 2
def thump(f=55, d=0.3):
    n = int(1.0 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (f * t - 10 * t * t)) * env(n, 0.003, d) + lp(noise(1.0), 260) * env(n, 0.002, 0.05) * 2
def air(n, level, cut=500): x = lp(rng.standard_normal(n), cut); return np.stack([x, np.roll(x, 700)], 1) * db(level)


def finish(name, dur, mus, sfx, mute=None):
    end = int(dur * SR); mus, sfx = mus[:end], sfx[:end]
    if mute:  # a true dropout (with 8 ms ramps) on every stem
        a, b = int(mute[0] * SR), int(mute[1] * SR); g = np.ones(end); g[a:b] = 0
        r = int(0.008 * SR); g[a - r:a] = np.linspace(1, 0, r); g[b:b + r] = np.linspace(0, 1, r); mus *= g[:, None]; sfx *= g[:, None]
    mix = mus + sfx; pk = np.abs(mix).max(); gn = min(1.0, db(-1) / pk)
    for k, v in (('music', mus), ('sfx', sfx), ('mix', mix)): wavfile.write(f'{OUT}/{name}-{k}.wav', SR, (v * gn).astype(np.float32))
    print(name, f'{dur:.2f}s')



def untouchable(name, c, trailer):
    n = int((c['dur'] + 0.3) * SR); mus = np.zeros((n, 2), np.float32); sfx = np.zeros((n, 2), np.float32)
    f_end = c['freeze'] + c['freezeFor']
    if trailer: place(mus, music(BAR138 - c['freeze'], c['dur'] + 0.1), 0, db(-3))
    else:
        m = music(BAR138, 2.6); k = np.ones(len(m)); f0 = int(0.4 * SR); k[f0:] = np.exp(-np.arange(len(m) - f0) / (0.9 * SR))
        place(mus, m * k[:, None], f_end, db(-3))                     # the music enters on the release of the freeze
    place(sfx, whoosh(c['reveal1'] - c['reveal0'] + 0.2, 120, 1600) * 0.8, c['reveal0'], db(-22))   # the ink bloom
    t = np.arange(n) / SR
    tw = np.where(t < c['freeze'], t, np.where(t < f_end, c['freeze'], t - c['freezeFor']))
    windk = c['breeze'] * np.clip((tw - c['reveal0'] - 0.2) / 1.4, 0, 1)
    for g in c['gusts']: windk = windk + g['k'] * np.exp(-((tw - g['t']) / g['w']) ** 2)
    w = bp(rng.standard_normal(n), 250, 2200) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.7 * t + np.sin(2 * np.pi * 0.31 * t) * 3))
    sfx[:, 0] += w * windk * db(-31); sfx[:, 1] += np.roll(w, 900) * windk * db(-31)
    # the cloth: soft flutters riding the gusts
    for g in c['gusts']:
        for i in range(5):
            L = int(0.18 * SR); place(sfx, bp(noise(0.18), 500, 3500) * env(L, 0.02, 0.05), g['t'] - 0.25 + 0.1 * i + rng.random() * 0.05, db(-30) * g['k'], rng.uniform(-0.6, 0.6))
    place(sfx, thump(41, 0.5), f_end, db(-8))                          # the release: one low hit, the amount rising
    finish(name, c['dur'], mus, sfx, mute=(c['freeze'], f_end))


def cold_blooded(name, c):
    n = int((c['dur'] + 0.3) * SR); mus = np.zeros((n, 2), np.float32); sfx = np.zeros((n, 2), np.float32)
    m = music(BAR137, 1.4); k = np.ones(len(m)); f0 = int(0.2 * SR); k[f0:] = np.exp(-np.arange(len(m) - f0) / (0.3 * SR))
    place(mus, m * k[:, None], 0, db(-7))                              # the loss bar, decaying into stillness
    place(sfx, air(n, -36, 420), 0)
    place(sfx, whoosh(c['greyFull'] - c['greyIn'], 150, 900) * 0.6, c['greyIn'], db(-27))
    # the lift: fabric (the sleeve sliding), a slow rising breath of air; the mask meeting his face; the settle
    L = int((c['lift1'] - c['lift0']) * SR)
    place(sfx, bp(noise(L / SR), 300, 2600) * np.sin(np.linspace(0, np.pi, L)) ** 1.5, c['lift0'], db(-25), 0.15)
    place(sfx, whoosh(L / SR, 200, 1200) * 0.5, c['lift0'], db(-30))
    n2 = int(0.07 * SR); place(sfx, lp(noise(0.07), 1600) * env(n2, 0.001, 0.012), c['lift1'] - 0.02, db(-19))
    L = n - int(c['settle'] * SR); t = np.arange(L) / SR
    place(sfx, (np.sin(2 * np.pi * 49 * t) + 0.4 * np.sin(2 * np.pi * 73.4 * t)) * np.clip(t / 1.2, 0, 1) ** 2, c['settle'], db(-24))
    if c.get('seal') is not None:
        L = int(0.3 * SR); place(sfx, lp(noise(0.3), 900) * env(L, 0.001, 0.035) + np.sin(2 * np.pi * 110 * np.arange(L) / SR) * env(L, 0.002, 0.08), c['seal'] + 0.07, db(-10))
    finish(name, c['dur'], mus, sfx)


untouchable('un2-cinematic', T['UN_CINEMATIC'], False); untouchable('un2-trailer', T['UN_TRAILER'], True)
untouchable('un2-rigid', {**T['UN_CINEMATIC'], 'ribbons': 0}, False)
cold_blooded('cb2-concealed', T['CB_CONCEALED']); cold_blooded('cb2-concealed-trailer', T['CB_CONCEALED_TRAILER']); cold_blooded('cb2-layered', T['CB_LAYERED'])
