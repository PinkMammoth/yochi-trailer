#!/usr/bin/env python3
"""Soundtracks for the 9:16 films in src/films, built from each film's timing.json (the one timing map).

Music: asset-pack/audio/Victory Stamp.mp3 (the house track), cut in code so it's reproducible: start at the source
time in timing.json `music.srcStart`, mute `music.dropout` (6 ms fades), fade out over `music.fadeOut`.
SFX: synthesised here (the kit has no recorded foley, OPEN_DECISIONS #12). Deterministic. 48 kHz stereo WAV.

usage: python3 tools/film-audio.py new-challenger|swap-tax [out.wav]
       (default out: public/audio/<film>.wav, which the compositions play)
"""
import json, os, subprocess, sys
import numpy as np
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
SR = 48000
rng = np.random.default_rng(11)


def load_track(start, dur):
    src = os.path.join(ROOT, 'asset-pack', 'audio', 'Victory Stamp.mp3')
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{start}', '-t', f'{dur + 0.1}', '-i', src, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         check=True, capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
    n = int(SR * dur)
    out = np.zeros((n, 2))
    out[:min(n, len(x))] = x[:n]
    return out


def ramp(n, k):
    """gain envelope: 1 except fades handled by caller"""
    return np.ones(n)


def tt(d):
    return np.arange(int(SR * d)) / SR


def lp(x, hz):
    return sosfilt(butter(2, hz, 'low', fs=SR, output='sos'), x)


def hp(x, hz):
    return sosfilt(butter(2, hz, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)


def noise(d):
    return rng.standard_normal(int(SR * d))


class Mix:
    def __init__(self, dur):
        self.n = int(SR * dur)
        self.bus = np.zeros((self.n, 2))

    def put(self, t0, x, g=1.0, pan=0.0):
        i = int(t0 * SR)
        if i >= self.n:
            return
        x = x[: self.n - i]
        if x.ndim == 1:
            l, r = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
            x = np.stack([x * l, x * r], 1) * np.sqrt(2)
        self.bus[i:i + len(x)] += x * g


# ---------------------------------------------------------------- the sound palette
def thud(d=0.35, f0=120, f1=42):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t * 18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9)


def slam():
    t = tt(0.3)
    crack = hp(noise(0.3), 1500) * np.exp(-t * 45) * 0.5
    return thud(0.4) * 0.9 + np.pad(crack, (0, int(SR * 0.4) - len(crack)))


def card_slap():
    t = tt(0.22)
    slap = bp(noise(0.22), 900, 5000) * np.exp(-t * 30)
    return slap * 0.6 + thud(0.22, 160, 60) * 0.5


def blip(f=880, d=0.06):
    t = tt(d)
    return np.sign(np.sin(2 * np.pi * f * t)) * np.exp(-t * 40) * 0.25


def whoosh(d=0.35, lo=300, hi=3000, rise=True):
    t = tt(d)
    x = noise(d)
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    a = bp(x, lo, hi)
    b = bp(x, hi * 0.8, min(hi * 3, 16000))
    k = t / d if rise else 1 - t / d
    return (a * (1 - k) + b * k) * env * 0.6


def paper(d=0.6, density=60, g=0.5):
    t = tt(d)
    x = bp(noise(d), 1800, 7000)
    crackle = np.zeros_like(t)
    for _ in range(int(density * d)):
        i = rng.integers(0, len(t))
        L = rng.integers(200, 1600)
        crackle[i:i + L] += np.exp(-np.arange(min(L, len(t) - i)) / (L / 4)) * rng.uniform(0.3, 1)
    return x * (0.15 + crackle) * g


def stamp():
    t = tt(0.5)
    knock = np.sin(2 * np.pi * 680 * t) * np.exp(-t * 38) * 0.4
    return thud(0.5, 150, 48) * 1.0 + knock + np.pad(paper(0.12, 200, 0.4), (0, len(t) - int(SR * 0.12)))


def alarm(d, f1=98, f2=73.4, step=0.21):
    """low electronic alarm: two square tones alternating, low-passed, with a slow throb"""
    t = tt(d)
    f = np.where((t // step) % 2 == 0, f1, f2)
    ph = 2 * np.pi * np.cumsum(f) / SR
    sq = np.sign(np.sin(ph)) + 0.5 * np.sign(np.sin(ph * 2.01))
    x = lp(sq, 900) * (0.75 + 0.25 * np.sin(2 * np.pi * 2.4 * t))
    env = np.clip(t / 0.03, 0, 1) * np.clip((d - t) / 0.15, 0, 1)
    return x * env * 0.32


def buzz(d):
    t = tt(d)
    x = np.sign(np.sin(2 * np.pi * 60 * t)) * 0.5 + hp(noise(d), 3000) * 0.3
    gate = (np.floor(t * 60) % 3 != 1).astype(float)
    return lp(x, 2500) * gate * 0.25


def wind(d, swell=True):
    t = tt(d)
    x = lp(noise(d), 700) + 0.4 * bp(noise(d), 900, 2400)
    wob = 0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t + 1.0)
    env = (t / d) ** 1.4 if swell else np.ones_like(t)
    return x * wob * env * 0.35


def gust(d=0.8):
    t = tt(d)
    return bp(noise(d), 300, 2600) * np.exp(-((t - 0.18) ** 2) / 0.03) * 0.8


def drone(d, f=55):
    t = tt(d)
    x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.498 * t) + 0.3 * np.sin(2 * np.pi * f * 2.003 * t)
    return x * np.clip(t / 0.5, 0, 1) * np.clip((d - t) / 0.3, 0, 1) * 0.12


def shing(d=1.4):
    t = tt(d)
    x = sum(np.sin(2 * np.pi * f * t + p) * np.exp(-t * k) * a for f, k, a, p in
            [(2093, 3.2, 0.5, 0), (3311, 4.1, 0.35, 1), (4721, 5.0, 0.25, 2), (6229, 6.3, 0.18, 3), (8150, 8.0, 0.1, 4)])
    scrape = bp(noise(d), 3000, 9000) * np.exp(-t * 7) * np.clip(t / 0.06, 0, 1) * 0.5
    return (x + scrape) * 0.5


def boom(d=1.6):
    t = tt(d)
    sub = np.sin(2 * np.pi * np.cumsum(38 + 70 * np.exp(-t * 10)) / SR) * np.exp(-t * 2.6)
    crack = hp(noise(d), 1200) * np.exp(-t * 25)
    body = lp(noise(d), 400) * np.exp(-t * 5)
    x = sub * 1.2 + crack * 0.9 + body * 0.8
    return np.tanh(x * 1.6) * 0.9


def slide(d=0.45):
    t = tt(d)
    return lp(noise(d), 500) * np.sin(np.pi * t / d) * 0.6 + bp(noise(d), 1500, 4000) * np.sin(np.pi * t / d) * 0.08


# ---------------------------------------------------------------- films
def music(T):
    M = T['music']
    x = load_track(M['srcStart'], T['dur'])
    t = np.arange(len(x)) / SR
    src = M['srcStart'] + t
    g = np.ones(len(x))
    a, b = M['dropout']
    fd = 0.006
    g *= np.clip(np.maximum((a - src) / fd, (src - b) / fd), 0, 1)
    f0, f1 = M['fadeOut']
    g *= np.clip((f1 - t) / (f1 - f0), 0, 1)
    return x * g[:, None]


def new_challenger(T):
    mx = Mix(T['dur'])
    mx.bus += music(T) * 0.8
    S, A, R, X = T['select'], T['alarm'], T['reveal'], T['two']
    for k in range(int(S['lock'] / (1 / 6))):
        mx.put(k / 6, blip(1320 if k % 2 else 990, 0.04), 0.5)
    mx.put(S['lock'], stamp(), 0.8)
    mx.put(S['slot2'], blip(440, 0.12), 0.6)
    mx.put(S['slot2'] + 0.12, blip(330, 0.12), 0.6)
    mx.put(A['flicker'], buzz(A['dark'] + 0.12 - A['flicker']), 0.9)
    mx.put(A['flicker'], alarm(A['black'] - A['flicker'] + 0.05), 1.0)
    for s in A['slams']:
        mx.put(s, slam(), 0.85)
    mx.put(R['start'], drone(R['hit'] - R['start'] + 0.9, 41.2), 1.0)
    mx.put(R['start'], wind(R['hit'] - R['start'] + 0.2), 0.9)
    mx.put(R['hit'] - 0.1, gust(), 0.9)
    mx.put(R['hit'], thud(0.6, 90, 38), 0.8)
    mx.put(R['hit'] + 0.2, wind(1.0, swell=False) * np.linspace(1, 0, int(SR * 1.0)), 0.6)
    mx.put(X['start'] - 0.25, whoosh(0.3, 400, 4000), 0.6)
    for s in X['tag']:
        mx.put(s, slam(), 0.6)
    mx.put(X['seal'], stamp(), 1.0)
    mx.put(X['caption'], card_slap(), 0.4)
    return mx


def swap_tax(T):
    mx = Mix(T['dur'])
    mx.bus += music(T) * 0.75
    mx.put(0.0, slide(0.7) * 0.4, 0.5)  # footsteps of air: her arrival
    for g in (T['g1'], T['g2'], T['g3']):
        mx.put(g - 0.08, whoosh(0.12, 600, 5000), 0.5)
        mx.put(g, card_slap(), 1.0)
        mx.put(g, thud(0.3, 110, 50), 0.6)
    C = T['comply']
    for k in range(10):
        mx.put(C['bar'][0] + k * (C['bar'][1] - C['bar'][0]) / 10, blip(1600 + 80 * k, 0.03), 0.35)
    mx.put(C['done'], blip(660, 0.09), 0.6)
    mx.put(C['fee'], blip(330, 0.18), 0.55)  # the tax: a sad low blip
    s0, s1 = T['scroll']
    mx.put(s0, paper(s1 - s0 + 0.3, 90, 0.9), 0.9)
    mx.put(s1, thud(0.4, 80, 40), 0.6)  # the roll lands
    F = T['freeze']
    mx.put(F['start'], drone(T['silence'][0] - F['start'] + 0.05, 36.7), 1.0)  # a low hold under the push
    D = T['draw']
    mx.put(D['whip'][0] - 0.05, shing(), 0.9)
    mx.put(T['strike']['hit'] - 0.09, whoosh(0.12, 800, 9000), 0.9)
    mx.put(T['strike']['hit'], boom(), 0.6)
    rel = T['strike']['hit'] + T['strike']['hitStop']
    mx.put(rel, paper(1.6, 160, 1.0) * np.linspace(1, 0.2, int(SR * 1.6)), 1.0)
    d0, d1 = T['doors']
    mx.put(d0, slide(0.5), 0.8)
    mx.put(d1 - 0.3, whoosh(0.35, 300, 6000), 0.5)
    for s in T['lines']:
        mx.put(s, slam(), 0.55)
    mx.put(T['seal'], stamp(), 1.0)
    mx.put(T['caption'], card_slap(), 0.35)
    return mx


def main():
    film = sys.argv[1]
    T = json.load(open(os.path.join(HERE, '..', 'src', 'films', film, 'timing.json')))
    mx = {'new-challenger': new_challenger, 'swap-tax': swap_tax}[film](T)
    x = mx.bus
    peak = np.percentile(np.abs(x), 99.95)  # level to the loud body, let the soft limiter take the spikes
    x = np.tanh(x / max(peak, 1e-9) * 0.95) * 0.95
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, '..', 'public', 'audio', f'{film}.wav')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    import wave
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print(out, f'{len(x) / SR:.2f}s, peak in {peak:.2f}')


if __name__ == '__main__':
    main()
