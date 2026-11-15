#!/usr/bin/env python3
"""LAST CANDLE STANDING: the original score and sound design, synthesised from the film's timing map
(remotion/src/timing.json). Nothing is sampled; everything is deterministic.

Writes separable stems to audio/out/ (48 kHz stereo, 16-bit):
  music.wav   drums, bass, drone, plucks, chords (150 BPM, D minor)
  sfx.wav     ink drops, UI picks and locks, clock ticks, life losses, knock-outs, stamps, wipes, the final impact
  mix.wav     the two summed, with the music ducked under the big hits (the film's soundtrack)
There is no announcer: see the film README (a robotic TTS read would hurt the film more than help it).

usage: python3 audio/score.py
"""
import json, os, wave
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
T = json.load(open(os.path.join(HERE, '..', 'remotion', 'src', 'timing.json')))
OUT = os.path.join(HERE, 'out')
SR = 48000
DUR = T['dur']
N = int(SR * (DUR + 0.05))
BEAT = 60 / T['bpm']
rng = np.random.default_rng(11)

mus = np.zeros((2, N))
sfx = np.zeros((2, N))


def tt(d):
    return np.arange(int(SR * d)) / SR


def put(bus, t0, x, g=1.0, pan=0.0):
    """mono or stereo x into bus at t0 (s); pan -1..1"""
    if x.ndim == 1:
        x = np.vstack([x * np.sqrt(0.5 * (1 - pan)), x * np.sqrt(0.5 * (1 + pan))]) * np.sqrt(2)
    i = int(round(t0 * SR))
    if i >= N or i + x.shape[1] <= 0:
        return
    a, b = max(0, i), min(N, i + x.shape[1])
    bus[:, a:b] += x[:, a - i:b - i] * g


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (SR * tau))


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR / 2 - 100) / (SR / 2), 'low', output='sos'), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc / (SR / 2), 'high', output='sos'), x)


def bp(x, f0, f1, order=2):
    return sosfilt(butter(order, [f0 / (SR / 2), min(f1, SR / 2 - 100) / (SR / 2)], 'band', output='sos'), x)


def noise(d):
    return rng.uniform(-1, 1, int(SR * d))


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def fade(x, a=0.003, r=0.02):
    x = x.copy()
    na, nr = int(a * SR), int(r * SR)
    if na: x[:na] *= np.linspace(0, 1, na)
    if nr: x[-nr:] *= np.linspace(1, 0, nr)
    return x


def reverb(x, decay=1.4, mix=0.25, seed=3):
    r = np.random.default_rng(seed)
    n = int(SR * decay)
    ir = r.standard_normal(n) * np.exp(-np.arange(n) / (SR * decay / 6.9))
    ir = lp(ir, 6000)
    ir /= np.sqrt(np.sum(ir ** 2))
    y = fftconvolve(x, ir)[:len(x)]
    return x * (1 - mix) + y * mix * 0.8


# ------------------------------------------------------------------ instruments (music)
def taiko(g=1.0, f0=95, f1=48, d=0.9):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t * 18)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(len(t), 0.28)
    skin = bp(noise(d), 120, 900) * env_exp(len(t), 0.035) * 0.8
    slap = hp(noise(d), 2000) * env_exp(len(t), 0.006) * 0.35
    return fade((body + skin + slap) * g, 0.0005, 0.05)


def kick(g=1.0):
    t = tt(0.35)
    f = 45 + 110 * np.exp(-t * 35)
    return fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(len(t), 0.12) * g, 0.0005)


def rim(g=0.3):
    t = tt(0.08)
    x = bp(noise(0.08), 1800, 5200) * env_exp(len(t), 0.012) + np.sin(2 * np.pi * 1700 * t) * env_exp(len(t), 0.01) * 0.5
    return x * g


def hat(g=0.08):
    return hp(noise(0.06), 7000) * env_exp(int(SR * 0.06), 0.012) * g


def bass(m, d, g=0.3):
    t = tt(d)
    f = hz(m)
    x = np.sign(np.sin(2 * np.pi * f * t)) * 0.4 + np.sin(2 * np.pi * f * t)
    k = np.exp(-t * 9)  # the filter closes after the attack
    x = lp(x, 380) * (1 - k) + lp(x, 1300) * k
    return fade(x * g * (0.6 + 0.4 * env_exp(len(t), 0.25)), 0.004, 0.03)


def pluck(m, d=0.9, g=0.25, bright=0.5):
    """Karplus-Strong: a dry, bright plucked string (kept dark, not a koto pastiche)"""
    f = hz(m)
    p = int(SR / f)
    n = int(SR * d)
    buf = rng.uniform(-1, 1, p)
    buf = lp(buf, 2000 + 6000 * bright)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return fade(out * g, 0.001, 0.05)


def pad(ms, d, g=0.12, a=0.6, r=0.8, bright=1200):
    t = tt(d)
    x = np.zeros(len(t))
    for m in ms:
        for det in (-0.07, 0.0, 0.06):
            f = hz(m + det)
            x += 2 * ((t * f + rng.random()) % 1.0) - 1
    x = lp(x / (len(ms) * 3), bright)
    e = np.minimum(1, t / a) * np.minimum(1, (d - t) / r).clip(0, 1)
    return x * e * g


def drone(d, g=0.1):
    t = tt(d)
    x = sum(np.sin(2 * np.pi * hz(m) * t + ph) for m, ph in ((26, 0), (38, 1.3), (45, 2.1))) / 3
    x += 0.3 * lp(noise(d), 200)
    return x * g * (0.85 + 0.15 * np.sin(2 * np.pi * 0.4 * t))


# ------------------------------------------------------------------ effects
def whoosh(d=0.3, g=0.4, f0=300, f1=4000, rev=False):
    n = int(SR * d)
    x = noise(d)
    out = np.zeros(n)
    seg = 256
    for i in range(0, n, seg):
        u = i / n
        f = f0 * (f1 / f0) ** (u if not rev else 1 - u)
        out[i:i + seg] = bp(x[max(0, i - 2048):i + seg], f * 0.7, f * 1.4)[-len(x[i:i + seg]):]
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
    return out * e * g


def brush(d=0.28, g=0.35):
    """a loaded brush dragged across paper: filtered noise with bristle grain"""
    n = int(SR * d)
    x = bp(noise(d), 600, 5000)
    grain = (rng.random(n) < 0.02) * rng.uniform(-1, 1, n)
    grain = bp(grain, 2000, 9000)
    e = np.sin(np.pi * np.linspace(0, 1, n) ** 0.6)
    return (x * 0.7 + grain * 1.5) * e * g


def ink_drop(g=0.5, pitch=1.0):
    t = tt(0.6)
    blip = np.sin(2 * np.pi * np.cumsum(1100 * pitch * np.exp(-t * 14) + 260 * pitch) / SR) * env_exp(len(t), 0.05)
    thud = np.sin(2 * np.pi * np.cumsum(70 + 60 * np.exp(-t * 25)) / SR) * env_exp(len(t), 0.18)
    splash = bp(noise(0.6), 800, 4000) * env_exp(len(t), 0.03) * 0.3
    return (blip * 0.35 + thud * 0.9 + splash) * g


def click(g=0.2, f=2400):
    t = tt(0.03)
    return (np.sin(2 * np.pi * f * t) * env_exp(len(t), 0.006) + hp(noise(0.03), 4000) * env_exp(len(t), 0.003) * 0.4) * g


def confirm(g=0.3):
    t1 = tt(0.09); t2 = tt(0.22)
    a = np.sin(2 * np.pi * 880 * t1) * env_exp(len(t1), 0.04)
    b = (np.sin(2 * np.pi * 1320 * t2) + 0.3 * np.sin(2 * np.pi * 2640 * t2)) * env_exp(len(t2), 0.08)
    out = np.zeros(len(t1) + len(t2))
    out[:len(t1)] += a; out[int(0.06 * SR):int(0.06 * SR) + len(t2)] += b
    return fade(out * g)


def tick(g=0.35):
    t = tt(0.07)
    return (bp(noise(0.07), 1500, 4500) * env_exp(len(t), 0.008) + np.sin(2 * np.pi * 1050 * t) * env_exp(len(t), 0.02) * 0.6) * g


def life_lost(g=0.3):
    """a glassy tink falling a fourth, over a soft low knock"""
    t = tt(0.5)
    f = 1568 * (1 - 0.25 * np.minimum(1, t / 0.18))
    tink = (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(f * 2.76) / SR)) * env_exp(len(t), 0.12)
    knock = np.sin(2 * np.pi * np.cumsum(140 + 80 * np.exp(-t * 30)) / SR) * env_exp(len(t), 0.06)
    return (tink * 0.5 + knock * 0.7) * g


def stamp(g=0.7):
    """the hanko: a dense thud, a paper slap, a short wooden body"""
    t = tt(0.5)
    thud = np.sin(2 * np.pi * np.cumsum(60 + 90 * np.exp(-t * 40)) / SR) * env_exp(len(t), 0.09)
    slap = bp(noise(0.5), 300, 3500) * env_exp(len(t), 0.02)
    body = bp(noise(0.5), 180, 420) * env_exp(len(t), 0.06) * 0.6
    return (thud + slap * 0.8 + body) * g


def knockout(g=0.9):
    """an elimination: taiko, crunch, a grey ring"""
    t = tt(1.0)
    crunch = lp(np.clip(noise(1.0) * 3, -1, 1), 3500) * env_exp(len(t), 0.05)
    ring = (np.sin(2 * np.pi * 311 * t) + np.sin(2 * np.pi * 466.2 * t) * 0.6) * env_exp(len(t), 0.3) * 0.12
    return (taiko(1.0, 110, 46, 1.0) + crunch * 0.5 + ring) * g


def up_zip(g=0.3):
    t = tt(0.25)
    f = 500 * (4 ** (t / 0.25))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.25) * g


def riser(d, g=0.3):
    t = tt(d)
    n = len(t)
    x = np.zeros(n)
    nz = noise(d)
    seg = 512
    for i in range(0, n, seg):
        u = i / n
        f = 300 * (12 ** u)
        x[i:i + seg] = bp(nz[max(0, i - 2048):i + seg], f * 0.8, f * 1.25)[-len(nz[i:i + seg]):]
    tone = np.sin(2 * np.pi * np.cumsum(110 * (4 ** (t / d))) / SR) * 0.4
    return (x + tone) * (t / d) ** 2 * g


def heartbeat(g=0.5):
    return kick(g) + np.concatenate([np.zeros(int(0.16 * SR)), kick(g * 0.6)])[: len(kick())]


def mega_impact(g=1.0):
    t = tt(2.6)
    sub = np.sin(2 * np.pi * np.cumsum(32 + 80 * np.exp(-t * 6)) / SR) * env_exp(len(t), 0.9)
    crack = hp(np.clip(noise(2.6) * 4, -1, 1), 900) * env_exp(len(t), 0.03)
    tail = lp(noise(2.6), 1500) * env_exp(len(t), 0.5) * 0.25
    return (sub * 1.0 + crack * 0.6 + tail + np.pad(taiko(1.2, 120, 40, 1.4), (0, len(t) - int(1.4 * SR)))) * g


# ------------------------------------------------------------------ the cue sheet
O, R1, M, C = T['open'], T['round1'], T['montage'], T['candle']
ring_end = M['start']
D = 38  # D2 root (MIDI 38); the key is D minor

# --- open: the ink lands, the faces surface
for i, (t0, p) in enumerate([(0.0, 1.0), (0.1, 1.15), (0.18, 0.9), (0.3, 1.25), (0.36, 0.85), (0.46, 1.1)]):
    put(sfx, max(0, t0), ink_drop(0.45 if i else 0.6, p), pan=[-0.1, -0.5, 0.5, 0.45, -0.45, 0.1][i])
put(mus, 0.25, drone(ring_end + 0.4 - 0.25, 0.11))
face_notes = [62, 65, 67, 69, 72, 74, 72, 69, 67, 74]
for i in range(10):
    put(mus, O['faces'][0] + i * 0.075, pluck(face_notes[i], 0.7, 0.13, 0.4), pan=np.cos(-np.pi / 2 + i * 2 * np.pi / 10) * 0.6)
put(mus, O['headline'], taiko(1.0)); put(mus, O['headline'], bass(D, 0.8, 0.3))
put(sfx, O['headline'] - 0.12, whoosh(0.14, 0.25, 600, 4000))
put(sfx, O['lives'], click(0.22, 1900)); put(sfx, O['lives'] + 0.08, click(0.22, 2400))
# a light pulse into round 1
for b in range(int((R1['start'] - O['lives']) / (BEAT))):
    put(mus, O['lives'] + b * BEAT, kick(0.35))

# --- round 1: the groove, the picks, the clock, the close
def groove(t0, t1, intensity=1.0, bass_notes=(D, D, D + 3, D + 1)):
    nb = int(round((t1 - t0) / BEAT))
    for b in range(nb):
        tb = t0 + b * BEAT
        put(mus, tb, kick(0.75 * intensity))
        if b % 2 == 1: put(mus, tb, taiko(0.45 * intensity, 180, 90, 0.5), pan=0.2)
        for e in range(2): put(mus, tb + e * BEAT / 2, hat(0.07 * intensity), pan=0.35)
        put(mus, tb + BEAT * 0.75, rim(0.12 * intensity), pan=-0.3)
        put(mus, tb, bass(bass_notes[(b // 2) % len(bass_notes)], BEAT * 0.9, 0.24 * intensity))

groove(R1['start'], R1['ticks'][0], 1.0)
put(mus, R1['start'], pad([50, 53, 57], R1['ticks'][0] - R1['start'] + 0.3, 0.07))
put(mus, R1['callout'], taiko(1.0)); put(sfx, R1['callout'] - 0.1, whoosh(0.12, 0.3, 500, 5000))
for i in range(10):
    put(sfx, R1['picks'][0] + i * 0.045, click(0.16, 2000 + 120 * (i % 4)), pan=np.cos(-np.pi / 2 + i * 2 * np.pi / 10) * 0.7)
put(sfx, R1['lock'] - 0.07, stamp(0.35)); put(sfx, R1['lock'], confirm(0.22))
# the clock: the music thins to the drone and a held breath
for x in (R1['ticks'][0], R1['ticks'][0] + 0.267, R1['ticks'][0] + 0.533):
    put(sfx, x, tick(0.35))
    put(mus, x, kick(0.3))
put(mus, R1['ticks'][0], riser(R1['close'] - R1['ticks'][0], 0.12))
put(mus, R1['close'], taiko(1.1)); put(mus, R1['close'], bass(D + 7, 0.6, 0.3)); put(sfx, R1['close'], up_zip(0.22))
for j in range(4):
    put(sfx, R1['lose'] + j * 0.08, life_lost(0.26), pan=[-0.6, 0.6, -0.2, 0.3][j])
put(mus, R1['caption'], taiko(0.6, 140, 60, 0.6))
groove(R1['caption'], ring_end, 0.8)

# --- montage: rounds 2-6, two beats each
for k, n in enumerate(M['rounds']):
    t0 = M['start'] + k * M['round']
    groove(t0, t0 + M['round'], 1.1, bass_notes=(D + [0, 1, 3, 5, 7][k],))
    put(mus, t0, taiko(0.9))
    put(sfx, t0 + M['slam'], whoosh(0.1, 0.22, 800, 6000, rev=True))
    put(sfx, t0 + M['grey'], knockout(0.55 if n != 4 else 0.7))
    put(sfx, t0 + M['grey'] - 0.04 + 0.07, stamp(0.3))
    put(mus, t0, pad([50 + [0, 1, 3, 5, 7][k], 53 + [0, 1, 3, 5, 7][k], 57 + [0, 1, 3, 5, 7][k]], M['round'], 0.05, 0.05, 0.1, 1800))
    if n == 3:  # YOU lose a life: a dissonant stab in your colour
        put(sfx, t0 + M['grey'] + 0.04, life_lost(0.35))
        put(mus, t0 + M['grey'] + 0.04, pad([62, 63, 69], 0.4, 0.12, 0.005, 0.3, 4000))
    else:
        put(sfx, t0 + M['grey'] + 0.02, life_lost(0.16))
# the wipes
for cut in (M['start'], M['start'] + 2 * M['round'], M['start'] + 4 * M['round'], T['reset']['start']):
    put(sfx, cut - 0.18, brush(0.3, 0.42), pan=-0.2)

# --- reset: the floor drops away to a heartbeat
Rs = T['reset']
put(mus, Rs['start'], drone(1.0, 0.12)); put(mus, Rs['start'] + 0.08, taiko(0.8, 80, 40, 1.0))
for x in (Rs['start'] + 0.3, Rs['start'] + 0.7):
    put(mus, x, heartbeat(0.5))

# --- versus, the two picks
V, CY, CR = T['versus'], T['cuYou'], T['cuRival']
put(sfx, V['start'] - 0.12, whoosh(0.16, 0.35, 300, 5000))
put(mus, V['start'] + 0.05, taiko(1.2, 100, 40, 1.2)); put(mus, V['start'] + 0.05, bass(D - 12 + 12, 0.8, 0.32))
put(mus, V['start'], pad([50, 53, 57, 60], V['end'] - V['start'] + 0.8, 0.08, 0.1, 0.4))
put(mus, V['start'] + 0.45, heartbeat(0.45))
put(sfx, CY['start'], whoosh(0.1, 0.2, 2000, 6000, rev=True))
put(sfx, CY['lock'] - 0.07, stamp(0.55)); put(sfx, CY['lock'], confirm(0.25)); put(mus, CY['lock'], taiko(0.8))
put(sfx, CR['start'], whoosh(0.1, 0.2, 2000, 6000, rev=True))
put(mus, CR['lock'], taiko(0.9, 80, 38, 1.0)); put(mus, CR['lock'], bass(D + 1, 0.4, 0.3))

# --- the last candle: the clock, the climb, SILENCE, the close
put(mus, C['start'], drone(C['silence'] - C['start'], 0.13))
put(mus, C['start'], riser(C['silence'] - C['start'], 0.2))
for i in range(3):
    x = C['start'] + i * (C['close'] - C['start']) / 3
    put(sfx, x, tick(0.45)); put(mus, x, heartbeat(0.55))
for b in range(int((C['silence'] - C['start']) / (BEAT / 2))):
    put(mus, C['start'] + b * BEAT / 2, hat(0.05 + 0.05 * b / 6), pan=0.3)
# the silence: everything before it is hard-gated at C['silence'] below
put(sfx, C['close'], mega_impact(1.0))
put(sfx, C['close'], up_zip(0.25))
put(sfx, C['close'] + 0.16 + 0.07, stamp(0.45))
put(sfx, C['close'] + 0.04, life_lost(0.3))
put(mus, C['close'], bass(D, 1.2, 0.35))

# --- hero: the resolution (D major), the 勝 stamp, the coins of the pot rising
Hh, E = T['hero'], T['endcard']
put(mus, Hh['start'], pad([50, 54, 57, 62], Hh['end'] - Hh['start'] + 0.4, 0.13, 0.25, 0.4, 2400))
for i, m in enumerate([62, 66, 69, 74, 78, 74, 69, 66]):
    put(mus, Hh['start'] + 0.1 + i * BEAT / 2, pluck(m, 0.8, 0.12, 0.6), pan=(-0.4 if i % 2 else 0.4))
groove(Hh['start'] + 2 * BEAT, Hh['end'], 0.75, bass_notes=(D, D + 4, D + 7, D + 5))
put(mus, Hh['title'], taiko(0.9))
put(sfx, Hh['seal'] - 0.07, stamp(0.8)); put(mus, Hh['seal'], taiko(1.0))
for i in range(7):
    put(sfx, Hh['seal'] + 0.12 + i * 0.045, click(0.1, 3000 + 400 * i), pan=(i - 3) * 0.15)

# --- end card: paper; the seal lands like a win; the chord rings out
put(sfx, E['start'] - 0.1, whoosh(0.14, 0.25, 400, 3000))
put(mus, E['start'], taiko(0.9, 90, 42, 1.0))
put(sfx, E['seal'] + 0.07 - 0.02, stamp(0.95)); put(mus, E['seal'] + 0.07, taiko(1.2, 90, 38, 1.6))
put(mus, E['seal'] + 0.07, pad([38, 50, 54, 57, 62, 66], DUR - E['seal'] + 0.2, 0.15, 0.02, 1.6, 2000))
for i, m in enumerate([74, 69, 66, 62]):
    put(mus, E['seal'] + 0.3 + i * BEAT, pluck(m, 1.2, 0.1, 0.5))

# ------------------------------------------------------------------ bus processing
def gate(bus, a, b, ramp=0.012):
    """hard silence between a and b (s) with tiny ramps"""
    i, j, r = int(a * SR), int(b * SR), int(ramp * SR)
    bus[:, i:j] = 0
    bus[:, i - r:i] *= np.linspace(1, 0, r)


for ch in range(2):
    mus[ch] = reverb(mus[ch], 1.6, 0.22, seed=3 + ch)
    sfx[ch] = reverb(sfx[ch], 1.1, 0.16, seed=7 + ch)
# the dramatic silence before the last close: a true dropout
gate(mus, C['silence'], C['close'])
gate(sfx, C['silence'], C['close'] - 0.002)

# duck the music under the big hits
duck = np.ones(N)
for t0, depth, d in [(R1['close'], 0.5, 0.3), (C['close'], 0.25, 1.2), (Hh['seal'], 0.6, 0.3), (E['seal'] + 0.07, 0.6, 0.4)] + \
        [(M['start'] + k * M['round'] + M['grey'], 0.6, 0.25) for k in range(5)]:
    i = int(t0 * SR); n = int(d * SR)
    duck[i:i + n] = np.minimum(duck[i:i + n], depth + (1 - depth) * np.linspace(0, 1, n) ** 2)
mus *= duck

# end: fade out the last 0.4 s
fo = int(0.4 * SR)
for bus in (mus, sfx):
    bus[:, N - fo:] *= np.linspace(1, 0, fo)


def norm(x, peak):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


def soft(x):
    return np.tanh(x * 1.2) / np.tanh(1.2)


mus = norm(mus, 0.62)
sfx = norm(sfx, 0.8)
mix = soft(mus * 0.85 + sfx * 0.85)
mix = norm(mix, 0.93)


def write(name, x):
    os.makedirs(OUT, exist_ok=True)
    y = (np.clip(x, -1, 1) * 32767).astype('<i2').T.copy()
    with wave.open(os.path.join(OUT, name), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(y.tobytes())
    print(os.path.join(OUT, name))


write('music.wav', mus)
write('sfx.wav', sfx)
write('mix.wav', mix)
