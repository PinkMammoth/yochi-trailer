#!/usr/bin/env python3
"""Temporary sound for the Last Legend two-pose test. Separate stems per cut, so music and effects stay editable:
  out/<cut>-music.wav   the owner's dark DnB Victory Stamp (the flagship's and THE LAST STAND's track), untouched audio: the flagship's bar 137 (source 198.987 s, the downbeat
                        after the outro slam; flagship v2 64.96 s) placed on the reveal hit. Cinematic: the hit only, faded
                        out into near-silence (the house 'silence' move). Trailer: bars 137-138 as the flagship plays them (trailer6: the first 6 beats).
  out/<cut>-sfx.wav     synthesised placeholders (no recorded foley exists in the kit, OPEN_DECISIONS #12): the wave's
                        rush, a low impact, ink spatter, room air, the inhale, an armour/cloth shift on the head lift,
                        a low swell under the defiance, the exit rush (cinematic) or the 敗 seal's stamp (trailer)
  out/<cut>-mix.wav     the two summed, for the review render
Timings come from audio/timing.json (written from remotion/src/timing.ts by remotion/tools/timing.mts).
No new music is generated. Requires ffmpeg, numpy, scipy."""
import json, os, subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = f'{HERE}/out'; os.makedirs(OUT, exist_ok=True)
SR = 48000
TRACK = f'{HERE}/../../../last-candle-standing/v4/music-source/Victory Stamp_dark_dnb.mp3'  # the flagship's track (MUSIC_CUES.md)
SRC_BAR137 = 64.9585 + 134.028  # flagship time + the flagship edit's offset after its splice (MUSIC_CUES.md)
T = json.load(open(f'{HERE}/timing.json'))
rng = np.random.default_rng(7)


def music(src_t, dur):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{src_t:.4f}', '-t', f'{dur:.4f}', '-i', TRACK, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def band(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)


def env(n, a, d):  # attack, decay in seconds
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)


def place(buf, sig, t0, gain=1.0, pan=0.0):
    i = int(round(t0 * SR))
    if sig.ndim == 1: sig = np.stack([sig * (1 - max(0, pan)), sig * (1 + min(0, pan))], 1)
    j0, j1 = max(0, i), min(len(buf), i + len(sig))
    if j1 > j0: buf[j0:j1] += sig[j0 - i:j1 - i] * gain


def db(x): return 10 ** (x / 20)


def build(name, c, trailer):
    n = int(c['dur'] * SR) + SR // 4
    sfx = np.zeros((n, 2), np.float32); mus = np.zeros((n, 2), np.float32)
    hit = c['hit']
    # music: the bar 137 downbeat on the hit
    if trailer:
        m = music(SRC_BAR137 - hit, c['dur'] + 0.05); fade = np.ones(len(m)); fade[-int(0.03 * SR):] = np.linspace(1, 0, int(0.03 * SR))
        place(mus, m * fade[:, None], 0, db(-1))
    else:
        m = music(SRC_BAR137, 1.6); k = np.ones(len(m)); f0 = int(0.25 * SR); k[f0:] = np.exp(-np.arange(len(m) - f0) / (0.32 * SR))
        place(mus, m * k[:, None], hit, db(-1))
    # the wave's rush: band noise sweeping up into the hit, tail after
    L = int((hit + 0.6) * SR); x = rng.standard_normal(L)
    sweep = band(x, 180, 2600); e = np.concatenate([np.linspace(0.25, 1, int(hit * SR)) ** 2, np.exp(-np.arange(L - int(hit * SR)) / (0.18 * SR))])
    place(sfx, sweep * e, 0, db(-16), pan=-0.2)
    # impact: a pitch-dropping sub and a short body thump
    L = int(0.9 * SR); t = np.arange(L) / SR
    sub = np.sin(2 * np.pi * (62 * t - 18 * t * t)) * env(L, 0.004, 0.32)
    thump = lp(rng.standard_normal(L), 240) * env(L, 0.002, 0.07)
    place(sfx, sub * 0.9 + thump * 2.2, hit, db(-6))
    # ink spatter: sparse soft ticks, thinning out
    for i in range(36):
        tt = hit + 0.05 + (rng.random() ** 1.7) * (1.6 if not trailer else 0.7)
        L = int(0.03 * SR); s = band(rng.standard_normal(L), 1500, 6000) * env(L, 0.001, 0.006)
        place(sfx, s, tt, db(-30) * (1 - (tt - hit) / 2.2), pan=rng.uniform(-0.6, 0.6))
    # room air: low wind, ducking into the stillness
    x = lp(rng.standard_normal(n), 500) * 0.7; tt = np.arange(n) / SR
    duck = 1 - 0.55 * np.clip((tt - c['still'] + 0.6) / 0.6, 0, 1) + 0.35 * np.clip((tt - c['swap']) / 0.5, 0, 1)
    sfx[:, 0] += x * duck * db(-34); sfx[:, 1] += np.roll(x, 900) * duck * db(-34)
    # the inhale: a filtered breath of air rising to the head lift
    L = int((c['swap'] - c['rise0'] + 0.12) * SR)
    if L > 0:
        b = band(rng.standard_normal(L), 400, 1800) * np.linspace(0, 1, L) ** 1.6
        place(sfx, b, c['rise0'], db(-30))
    # the lift: cloth and a dull armour shift on the cut frame
    cutt = np.ceil(c['swap'] * T['FPS'] + c['swapFrames'] / 2 - 1e-6) / T['FPS']  # the first frame of Pose B (cutFrame in LastLegend.tsx)
    L = int(0.35 * SR); cl = band(rng.standard_normal(L), 300, 3000) * env(L, 0.01, 0.09)
    t = np.arange(L) / SR; arm = sum(np.sin(2 * np.pi * f * t) * a for f, a in ((1310, 1), (2270, 0.6), (3420, 0.35))) * env(L, 0.001, 0.05)
    place(sfx, cl * 1.4 + arm * 0.25, cutt - 0.02, db(-17), pan=0.15)
    # the defiance: a low swell under the face
    L = n - int(cutt * SR); t = np.arange(L) / SR
    sw = (np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 82.4 * t)) * np.clip(t / 0.9, 0, 1) ** 2
    place(sfx, sw, cutt, db(-24 if trailer else -20))
    if trailer:  # the grey 敗 seal: a dry stamp at contact (stampK contact ~0.07 s)
        L = int(0.3 * SR); st = lp(rng.standard_normal(L), 900) * env(L, 0.001, 0.035) + np.sin(2 * np.pi * 110 * np.arange(L) / SR) * env(L, 0.002, 0.08)
        place(sfx, st, c['seal'] + 0.07, db(-10))
    else:        # the exit: the next ink wave's rush
        L = int((c['dur'] - c['exit0'] + 0.2) * SR); x = band(rng.standard_normal(L), 200, 3200) * np.linspace(0, 1, L) ** 2
        place(sfx, x, c['exit0'], db(-18), pan=0.2)
    end = int(c['dur'] * SR)
    sfx, mus = sfx[:end], mus[:end]
    mix = sfx + mus
    pk = np.abs(mix).max(); g = min(1.0, db(-1) / pk)
    for k, v in (('music', mus), ('sfx', sfx), ('mix', mix)):
        wavfile.write(f'{OUT}/{name}-{k}.wav', SR, (v * g).astype(np.float32))
    print(name, f'{c["dur"]:.2f}s', 'peak', round(20 * np.log10(pk), 1), 'dBFS before trim')


build('cinematic', T['cinematic'], False)
build('trailer', T['trailer'], True)
build('trailer6', T['trailer6'], True)
