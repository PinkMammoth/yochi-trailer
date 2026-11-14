#!/usr/bin/env python3
"""USDC HAS BEEN ELIMINATED: the soundtrack, synthesised from the timing map (src/films/usdc/timing.json).

A 150 BPM chiptune (pulse lead, triangle bass, noise drums), arcade SFX (select blips, the stamp, the punch, the
launch, the blast, typing) and a lo-fi announcer (espeak-ng, pitched down, saturated and bit-crushed like an old
sampled arcade voice). Everything is deterministic. Writes a 48 kHz stereo WAV.

usage: python3 tools/audio_usdc.py <out.wav> [--no-voice]
"""
import json, os, subprocess, sys, tempfile, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
T = json.load(open(os.path.join(HERE, '..', 'src', 'films', 'usdc', 'timing.json')))
SR = 48000
DUR = T['dur']
N = int(SR * DUR)
BEAT = 60 / T['bpm']
rng = np.random.default_rng(7)
VOICE = '--no-voice' not in sys.argv

mus = np.zeros(N)   # music bus (ducked under the voice)
sfx = np.zeros(N)
vox = np.zeros(N)


def tt(d):
    return np.arange(int(SR * d)) / SR


def put(bus, t0, x, g=1.0):
    i = int(round(t0 * SR))
    if i >= N or i + len(x) <= 0:
        return
    a, b = max(0, i), min(N, i + len(x))
    bus[a:b] += x[a - i:b - i] * g


def adsr(n, a=0.004, d=0.06, s=0.6, r=0.04):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n); e[:na] = np.linspace(0, 1, na)
    nd = min(nd, n - na); e[na:na + nd] = np.linspace(1, s, nd)
    if nr < n: e[-nr:] *= np.linspace(1, 0, nr)
    return e


def pulse(f, d, duty=0.25, slide=None):
    t = tt(d)
    fr = f if slide is None else np.linspace(f, slide, len(t))
    ph = np.cumsum(np.ones_like(t) * fr / SR) if np.ndim(fr) else (t * f)
    return np.where((ph % 1.0) < duty, 1.0, -1.0)


def tri(f, d, slide=None):
    t = tt(d)
    fr = np.full(len(t), f) if slide is None else np.linspace(f, slide, len(t))
    ph = np.cumsum(fr / SR)
    # 4-bit stepped triangle, like the old sound chips
    x = 4 * np.abs((ph % 1.0) - 0.5) - 1
    return np.round(x * 7) / 7


def noise(d, period=1):
    n = int(SR * d)
    x = rng.uniform(-1, 1, n // period + 2)
    return np.repeat(x, period)[:n]


def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.zeros_like(x); acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc; y[i] = acc
    return y


def lp_fast(x, fc):
    # one-pole lowpass via cumulative trick on short buffers (vectorised IIR using scipy-free lfilter equivalent)
    a = np.exp(-2 * np.pi * fc / SR)
    out = np.empty_like(x); acc = 0.0
    for i in range(0, len(x)):
        acc = (1 - a) * x[i] + a * acc
        out[i] = acc
    return out


def crush(x, bits=6, hold=3):
    q = 2 ** (bits - 1)
    y = np.round(x * q) / q
    return np.repeat(y[::hold], hold)[:len(x)]


def note(n):  # MIDI to Hz
    return 440.0 * 2 ** ((n - 69) / 12)


# ============================================================================================ music
E2, A2, B2, C3, D3, G2 = 40, 45, 47, 48, 50, 43
# select + versus (0 .. round): a fast arpeggio over E minor / C / D / B
def arp(t0, t1, chords, step=BEAT / 4, g=0.18, duty=0.25):
    t = t0; i = 0
    while t < t1 - 1e-6:
        ch = chords[int((t - t0) / (BEAT * 2)) % len(chords)]
        n = ch[i % len(ch)] + 24
        x = pulse(note(n), step * 0.9, duty) * adsr(int(SR * step * 0.9), 0.002, 0.05, 0.4, 0.02)
        put(mus, t, x, g)
        t += step; i += 1


def bassline(t0, t1, roots, step=BEAT / 2, g=0.32):
    t = t0; i = 0
    while t < t1 - 1e-6:
        r = roots[int((t - t0) / (BEAT * 2)) % len(roots)]
        n = r + (12 if i % 2 else 0)
        x = tri(note(n), step * 0.92) * adsr(int(SR * step * 0.92), 0.002, 0.08, 0.8, 0.02)
        put(mus, t, x, g)
        t += step; i += 1


def kick(t0, g=0.8):
    d = 0.16
    x = np.sin(2 * np.pi * np.cumsum(np.linspace(160, 45, int(SR * d))) / SR) * np.exp(-tt(d) * 22)
    put(mus, t0, x, g)


def snare(t0, g=0.35):
    d = 0.14
    x = crush(noise(d, 2), 5, 2) * np.exp(-tt(d) * 26) + 0.4 * tri(220, d) * np.exp(-tt(d) * 40)
    put(mus, t0, x, g)


def hat(t0, g=0.08):
    d = 0.04
    x = noise(d, 1) * np.exp(-tt(d) * 90)
    put(mus, t0, x, g)


CH = [[52, 55, 59, 64], [48, 52, 55, 60], [50, 54, 57, 62], [47, 51, 54, 59]]
arp(0.0, T['round'], CH, g=0.12)
bassline(0.0, T['round'], [E2, C3 - 12, D3 - 12, B2 - 12])
t = 0.0
while t < T['round'] - 1e-6:
    kick(t, 0.55); hat(t + BEAT / 2)
    if int(round(t / BEAT)) % 2 == 1: snare(t, 0.25)
    t += BEAT
# ROUND 1 .. FIGHT: a held drone and a snare roll building into FIGHT
put(mus, T['round'], tri(note(E2), T['fight'] - T['round']) * np.linspace(0.2, 1, int(SR * (T['fight'] - T['round']))), 0.3)
roll = T['round'] + 0.2
while roll < T['fight'] - 0.01:
    snare(roll, 0.12 + 0.25 * (roll - T['round']) / (T['fight'] - T['round'])); roll += BEAT / 4
# FIGHT .. windup: the fight riff, double-time drums
riff = [64, 64, 67, 64, 69, 64, 67, 71]
t = T['fight']; i = 0
while t < T['windup'] - 1e-6:
    n = riff[i % len(riff)] + 0
    put(mus, t, pulse(note(n), BEAT / 2 * 0.85, 0.5) * adsr(int(SR * BEAT / 2 * 0.85), 0.002, 0.05, 0.5, 0.02), 0.1)
    if i % 2 == 0: kick(t, 0.6)
    else: snare(t, 0.22)
    hat(t + BEAT / 4)
    t += BEAT / 2; i += 1
bassline(T['fight'], T['windup'], [E2], step=BEAT / 4, g=0.28)

# ============================================================================================ SFX
def blip(t0, f=1200, d=0.05, g=0.25, slide=None):
    put(sfx, t0, pulse(f, d, 0.5, slide) * adsr(int(SR * d), 0.001, 0.02, 0.5, 0.01), g)


# select: cursor moves, the lock (a rising two-note confirm), the CPU lock
blip(0.05, 900); blip(T['p1Lock'] - 0.14, 900)
blip(T['p1Lock'], 1200, 0.06, 0.3); blip(T['p1Lock'] + 0.06, 1800, 0.12, 0.3)
blip(T['cpuLock'], 700, 0.05, 0.2); blip(T['cpuLock'] + 0.05, 500, 0.1, 0.2)


def whoosh(t0, d=0.25, g=0.35, f0=300, f1=3000):
    x = noise(d, 1)
    # a sweeping band: crude, a falling-rising filtered noise
    env = np.sin(np.linspace(0, np.pi, len(x))) ** 2
    y = lp_fast(x, (f0 + f1) / 2) * env
    put(sfx, t0, y, g)


def slam(t0, g=0.7):
    d = 0.45
    body = np.sin(2 * np.pi * np.cumsum(np.linspace(120, 38, int(SR * d))) / SR) * np.exp(-tt(d) * 9)
    crack = crush(noise(0.08, 2), 4, 3) * np.exp(-tt(0.08) * 40)
    put(sfx, t0, body, g); put(sfx, t0, crack, g * 0.5)


# versus: a whoosh and a slam as the band lands, the slash
whoosh(T['vs'] - 0.08, 0.2, 0.3)
slam(T['vs'] + 0.12, 0.55)
blip(T['vs'] + 0.2, 300, 0.12, 0.2, slide=150)
slam(T['round'], 0.5)
slam(T['fight'], 0.7)

# the wallet prompts: three polite chimes, each a little more desperate
for k, at in enumerate([0, 0.17, 0.34]):
    t0 = T['approve'] + at
    for j, f in enumerate([1318.5, 1760.0]):
        put(sfx, t0 + j * 0.05, np.sin(2 * np.pi * (f + k * 120) * tt(0.12)) * np.exp(-tt(0.12) * 25), 0.18)

# the windup: a rising charge
d = T['hit'] - T['windup']
x = pulse(200, d, 0.5, slide=900) * np.linspace(0.1, 1, int(SR * d)) * 0.5 + crush(noise(d, 4), 4, 2) * np.linspace(0, 0.4, int(SR * d))
put(sfx, T['windup'], x, 0.35)

# THE HIT: sub boom, a bit-crushed crack, ringing through the hit stop
hit = T['hit']
d = 1.1
boom = np.sin(2 * np.pi * np.cumsum(np.linspace(90, 28, int(SR * d))) / SR) * np.exp(-tt(d) * 3.5)
put(sfx, hit, boom, 1.0)
crack = crush(noise(0.25, 1), 3, 4) * np.exp(-tt(0.25) * 14)
put(sfx, hit, crack, 0.8)
put(sfx, hit, crush(pulse(70, 0.3, 0.5) * np.exp(-tt(0.3) * 10), 4, 4), 0.5)

# the launch: a descending whistle as he leaves the screen
hs = hit + T['hitstop']
d = T['exit'] - hs + 0.15
put(sfx, hs, pulse(2400, d, 0.5, slide=600) * np.linspace(1, 0.3, int(SR * d)), 0.16)
whoosh(hs, 0.22, 0.5)

# the blast: long crunchy noise, low rumble
ex = T['exit']
d = 1.4
bl = crush(noise(d, 3), 4, 3) * np.exp(-tt(d) * 3.2)
put(sfx, ex, lp_fast(bl, 2500), 0.9)
put(sfx, ex, np.sin(2 * np.pi * np.cumsum(np.linspace(70, 30, int(SR * d))) / SR) * np.exp(-tt(d) * 2.5), 0.7)
# debris ticks
for i in range(14):
    blip(ex + 0.1 + rng.uniform(0, 0.7), rng.uniform(600, 1800), 0.02, 0.06)
# the crowd: a noisy swell (filtered noise, slow envelope) under the K.O.
d = 2.2
cr = lp_fast(noise(d, 1), 1800) * np.sin(np.linspace(0, np.pi, int(SR * d))) ** 0.7
put(sfx, ex + 0.1, cr, 0.35)

# K.O.: a slam; the elimination band: whoosh and the grey seal
slam(T['ko'], 0.8)
whoosh(T['elim'] - 0.05, 0.22, 0.3)
slam(T['elim'] + 0.24, 0.45)

# victory jingle after the K.O. (under the voice): a bright fanfare in E major
fan = [(0.0, 64, 0.15), (0.15, 68, 0.15), (0.3, 71, 0.15), (0.45, 76, 0.5)]
for at, n, dd in fan:
    put(mus, T['ko'] + 0.35 + at, pulse(note(n), dd, 0.25) * adsr(int(SR * dd), 0.002, 0.08, 0.6, 0.06), 0.13)
    put(mus, T['ko'] + 0.35 + at, tri(note(n - 24), dd) * adsr(int(SR * dd)), 0.25)

# end card: a cut to paper; typing blips; the stamp; a closing chord that rings out
card = T['card']
for i, (t0, s) in enumerate(zip(T['lines'], ['NO SWAPS', 'NO APPROVALS', 'JUST HYPE'])):
    for j in range(len(s)):
        if s[j] != ' ':
            blip(t0 + j * 0.022, 1500 + (i * 200) + (j % 3) * 90, 0.018, 0.12)
st = T['stamp']
slam(st, 0.9)
put(sfx, st, crush(noise(0.12, 2), 4, 2) * np.exp(-tt(0.12) * 30), 0.4)
d = DUR - st
for n, g in [(52, 0.2), (59, 0.12), (64, 0.12), (68, 0.1), (71, 0.08)]:
    x = (pulse(note(n), d, 0.25) * 0.5 + tri(note(n), d)) * np.exp(-tt(d) * 1.2)
    put(mus, st, x, g)

# ============================================================================================ voice
def say(text, t0, g=1.0, speed=120, pitch=22, shift=0.86):
    with tempfile.TemporaryDirectory() as td:
        f = os.path.join(td, 'v.wav')
        subprocess.run(['espeak-ng', '-v', 'en-us+announcer', '-s', str(speed), '-p', str(pitch), '-a', '200', text, '-w', f], check=True)
        w = wave.open(f); sr = w.getframerate(); raw = w.readframes(w.getnframes()); w.close()
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768
    # trim silence
    nz = np.where(np.abs(x) > 0.02)[0]
    x = x[nz[0]:nz[-1] + 1] if len(nz) else x
    # pitch and formants down together (resample slower), up to 48k
    n_out = int(len(x) * SR / sr / shift)
    x = np.interp(np.linspace(0, len(x) - 1, n_out), np.arange(len(x)), x)
    # drive, then crush to an 8-bit 12 kHz sample
    x = np.tanh(x * 4.0) / np.tanh(4.0)
    x = crush(x, 7, 4)
    x = lp_fast(x, 5000)
    # slapback and a short room
    y = x.copy()
    for dly, gg in [(0.09, 0.35), (0.19, 0.2), (0.31, 0.1)]:
        k = int(dly * SR); y = np.concatenate([y, np.zeros(k)]); y[k:k + len(x)] += x * gg
    put(vox, t0, y / max(1e-6, np.abs(y).max()), g)
    return len(y) / SR


if VOICE:
    say('Round one', T['round'] + 0.02, 0.9)
    say('Fight!', T['fight'] + 0.02, 1.0, speed=150, pitch=30)
    say('K. O.', T['ko'] + 0.04, 1.0, speed=105, pitch=18, shift=0.8)
    say('Perfect', T['elim'] + 0.35, 0.75, speed=120, pitch=24)

# ============================================================================================ mix
# duck the music under the voice
env = np.abs(vox)
win = int(0.05 * SR)
env = np.convolve(env, np.ones(win) / win, mode='same')
duck = 1 - np.clip(env * 3, 0, 0.6)
# the hit stop: the music cuts dead at the hit and stays out until the K.O.
gate = np.ones(N)
gate[int(T['hit'] * SR):int(T['ko'] * SR)] = 0
mix = mus * duck * gate * 0.5 + sfx * 0.9 + vox * 0.9
# soft limiter and fade-out tail
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
mix *= 0.92 / max(1e-6, np.abs(mix).max())
fade = int(0.4 * SR); mix[-fade:] *= np.linspace(1, 0, fade)
# a touch of width: the music slightly delayed on the right
L = mix
R = mix.copy()
dly = int(0.008 * SR)
mw = mus * duck * gate * 0.25
R[dly:] += mw[:-dly] * 0.3; L += mw * 0.0
st2 = np.stack([L, R], 1)
st2 *= 0.95 / np.abs(st2).max()
out = (st2 * 32767).astype(np.int16)
w = wave.open(sys.argv[1], 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes()); w.close()
print('wrote', sys.argv[1], f'{DUR:.2f}s', 'voice' if VOICE else 'no voice')
