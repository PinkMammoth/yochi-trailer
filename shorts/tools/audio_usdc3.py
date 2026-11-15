#!/usr/bin/env python3
"""USDC HAS BEEN ELIMINATED v3: the soundtrack, synthesised from the timing map (src/films/usdc3/timing.json).

v3 keeps v1's synth voice (the helpers below are v1's, unchanged) and re-scores the knockout for comedy: rapid
wallet-prompt pings that get more insistent, the music cut dead on the push-in to Perma-Bull with one dramatic sting,
a nervous panic tremolo, a brush whoosh, ONE enormous impact, a launch whistle and paper scatter, the hanging card's
rubber squeak, the K.O., and the cut to paper. Everything is original and synthesised; nothing is sampled.

usage: python3 tools/audio_usdc3.py <out.wav> [--no-voice]

(v1 header follows)

A 150 BPM chiptune (pulse lead, triangle bass, noise drums), arcade SFX (select blips, the stamp, the punch, the
launch, the blast, typing) and a lo-fi announcer (espeak-ng, pitched down, saturated and bit-crushed like an old
sampled arcade voice). Everything is deterministic. Writes a 48 kHz stereo WAV.

usage: python3 tools/audio_usdc.py <out.wav> [--no-voice]
"""
import json, os, subprocess, sys, tempfile, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
T = json.load(open(os.path.join(HERE, '..', 'src', 'films', 'usdc3', 'timing.json')))
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



HS = T['hit'] + T['hitstop']
DROP = HS + T['hang']
CH = [[52, 55, 59, 64], [48, 52, 55, 60], [50, 54, 57, 62], [47, 51, 54, 59]]
# select + versus: the v1 arpeggio and groove
arp(0.0, T['round'], CH, g=0.12)
bassline(0.0, T['round'], [E2, C3 - 12, D3 - 12, B2 - 12])
t = 0.0
while t < T['round'] - 1e-6:
    kick(t, 0.55); hat(t + BEAT / 2)
    if int(round(t / BEAT)) % 2 == 1: snare(t, 0.25)
    t += BEAT
# ROUND 1 .. FIGHT: drone and snare roll
put(mus, T['round'], tri(note(E2), T['fight'] - T['round']) * np.linspace(0.2, 1, int(SR * (T['fight'] - T['round']))), 0.3)
roll = T['round'] + 0.15
while roll < T['fight'] - 0.01:
    snare(roll, 0.12 + 0.25 * (roll - T['round']) / (T['fight'] - T['round'])); roll += BEAT / 4
# FIGHT .. the push-in: the fight riff, double time
riff = [64, 64, 67, 64, 69, 64, 67, 71]
t = T['fight']; i = 0
while t < T['anticip'] - 1e-6:
    put(mus, t, pulse(note(riff[i % len(riff)]), BEAT / 2 * 0.85, 0.5) * adsr(int(SR * BEAT / 2 * 0.85), 0.002, 0.05, 0.5, 0.02), 0.1)
    if i % 2 == 0: kick(t, 0.6)
    else: snare(t, 0.22)
    hat(t + BEAT / 4)
    t += BEAT / 2; i += 1
bassline(T['fight'], T['anticip'], [E2], step=BEAT / 4, g=0.28)

# ============================================================================================ SFX
def blip(t0, f=1200, d=0.05, g=0.25, slide=None):
    put(sfx, t0, pulse(f, d, 0.5, slide) * adsr(int(SR * d), 0.001, 0.02, 0.5, 0.01), g)


def whoosh(t0, d=0.25, g=0.35, fc=1600):
    x = noise(d, 1); env = np.sin(np.linspace(0, np.pi, len(x))) ** 2
    put(sfx, t0, lp_fast(x, fc) * env, g)


def slam(t0, g=0.7):
    d = 0.45
    body = np.sin(2 * np.pi * np.cumsum(np.linspace(120, 38, int(SR * d))) / SR) * np.exp(-tt(d) * 9)
    crack = crush(noise(0.08, 2), 4, 3) * np.exp(-tt(0.08) * 40)
    put(sfx, t0, body, g); put(sfx, t0, crack, g * 0.5)


blip(0.05, 900); blip(T['p1Lock'] - 0.14, 900)
blip(T['p1Lock'], 1200, 0.06, 0.3); blip(T['p1Lock'] + 0.06, 1800, 0.12, 0.3)
blip(T['cpuLock'], 700, 0.05, 0.2); blip(T['cpuLock'] + 0.05, 500, 0.1, 0.2)
whoosh(T['vs'] - 0.08, 0.2, 0.3); slam(T['vs'] + 0.12, 0.55); blip(T['vs'] + 0.2, 300, 0.12, 0.2, slide=150)
slam(T['round'], 0.5); slam(T['fight'], 0.7)

# 1. bureaucracy: a wallet "ding" per prompt, each higher and more insistent; the last two get an error buzz
for k, t0 in enumerate(T['prompts']):
    for j, f in enumerate([1318.5, 1760.0]):
        fr = f * (2 ** (k / 12 * 1.5))
        put(sfx, t0 + j * 0.035, np.sin(2 * np.pi * fr * tt(0.11)) * np.exp(-tt(0.11) * 28), 0.16 + 0.02 * k)
    if k >= 4:
        put(sfx, t0 + 0.02, crush(pulse(110, 0.09, 0.5), 5, 2) * np.exp(-tt(0.09) * 12), 0.12)

# 2. anticipation: the music stops dead; one dramatic sting (low unison stab + a bright pulse over a falling sub), then
#    near silence with a thin rising tone under the grin
st = T['anticip']
d = 0.9
stab = (tri(note(28), d) + 0.6 * tri(note(40), d) + 0.35 * pulse(note(64), d, 0.25)) * np.exp(-tt(d) * 4.5)
put(sfx, st, stab, 0.42)
put(sfx, st, np.sin(2 * np.pi * np.cumsum(np.linspace(70, 32, int(SR * d))) / SR) * np.exp(-tt(d) * 3), 0.5)
d = T['strike'] - st
put(sfx, st + 0.1, np.sin(2 * np.pi * np.cumsum(np.linspace(2200, 3400, int(SR * (d - 0.1)))) / SR) * np.linspace(0, 1, int(SR * (d - 0.1))) ** 2, 0.035)
# Paper Hands panics: a nervous chattering tremolo
pt = T['panic']; d = T['strike'] - pt
x = pulse(520, d, 0.5) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 18 * tt(d)))) * np.linspace(0.6, 1, int(SR * d))
put(sfx, pt, x, 0.06)
blip(pt + 0.1, 1900, 0.05, 0.14)  # the last prompt slamming in on him

# 3. the attack: a brush whoosh into ONE enormous impact
whoosh(T['strike'] - 0.03, T['hit'] - T['strike'] + 0.05, 0.6, 2600)
hit = T['hit']
d = 1.5
boom = np.sin(2 * np.pi * np.cumsum(np.linspace(110, 24, int(SR * d))) / SR) * np.exp(-tt(d) * 2.6)
put(sfx, hit, boom, 1.0)
put(sfx, hit, crush(noise(0.35, 1), 3, 4) * np.exp(-tt(0.35) * 10), 0.9)
put(sfx, hit, crush(pulse(55, 0.4, 0.5) * np.exp(-tt(0.4) * 7), 4, 4), 0.55)
# a short metallic ring through the freeze
put(sfx, hit, (np.sin(2 * np.pi * 1870 * tt(0.5)) + 0.6 * np.sin(2 * np.pi * 2630 * tt(0.5))) * np.exp(-tt(0.5) * 7), 0.07)

# 4. the payoff: launch whistle, the prompts shattering, paper scatter, the hanging card's squeak, the drop
put(sfx, HS, pulse(2600, 0.32, 0.5, slide=500) * np.linspace(1, 0.2, int(SR * 0.32)), 0.15)
whoosh(HS, 0.25, 0.55, 3000)
for i in range(14):  # shatter: bright crushed ticks
    put(sfx, HS + rng.uniform(0, 0.18), crush(noise(0.03, 1), 4, 2) * np.exp(-tt(0.03) * 60), 0.18)
for i in range(18):  # paper flutter: soft filtered rustles
    put(sfx, HS + 0.05 + rng.uniform(0, 0.9), lp_fast(noise(0.05, 1), 3500) * np.exp(-tt(0.05) * 50), 0.1)
# the squeak: a rubber chirp up then down, twice
def squeak(t0, g=0.22):
    d = 0.11
    f = np.concatenate([np.linspace(900, 1700, int(SR * d * 0.55)), np.linspace(1700, 1250, int(SR * d * 0.45))])
    f = f * (1 + 0.03 * np.sin(2 * np.pi * 38 * np.arange(len(f)) / SR))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.linspace(0, np.pi, len(f))) ** 0.5
    put(sfx, t0, x, g)
squeak(DROP + 0.01); squeak(DROP + 0.14, 0.16)
put(sfx, DROP + 0.05, pulse(900, 0.35, 0.5, slide=180) * np.linspace(1, 0.1, int(SR * 0.35)), 0.06)  # falling slide

# K.O.: slam and the crowd-less victory sting; the elimination band
slam(T['ko'], 0.9)
fan = [(0.0, 64, 0.15), (0.15, 68, 0.15), (0.3, 71, 0.15), (0.45, 76, 0.5)]
for at, n, dd in fan:
    put(mus, T['ko'] + 0.35 + at, pulse(note(n), dd, 0.25) * adsr(int(SR * dd), 0.002, 0.08, 0.6, 0.06), 0.13)
    put(mus, T['ko'] + 0.35 + at, tri(note(n - 24), dd) * adsr(int(SR * dd)), 0.25)
whoosh(T['elim'] - 0.05, 0.22, 0.3); slam(T['elim'] + 0.24, 0.45)

# 5. the announcement: a whoosh to paper, typing, the stamp, the closing chord
whoosh(T['card'] - 0.12, 0.2, 0.35)
for i, (t0, s) in enumerate(zip(T['lines'], ['NO SWAPS', 'JUST HYPE'])):
    for j in range(len(s)):
        if s[j] != ' ':
            blip(t0 + j * 0.024, 1500 + (i * 200) + (j % 3) * 90, 0.018, 0.12)
st = T['stamp']
slam(st, 0.9)
put(sfx, st, crush(noise(0.12, 2), 4, 2) * np.exp(-tt(0.12) * 30), 0.4)
d = DUR - st
for n, g in [(52, 0.2), (59, 0.12), (64, 0.12), (68, 0.1), (71, 0.08)]:
    put(mus, st, (pulse(note(n), d, 0.25) * 0.5 + tri(note(n), d)) * np.exp(-tt(d) * 1.2), g)
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
gate[int(T['anticip'] * SR):int(T['ko'] * SR)] = 0   # silence from the push-in until the K.O.
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
