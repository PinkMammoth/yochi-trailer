#!/usr/bin/env python3
"""THE CANDLE DOESN'T CARE: the soundtrack, synthesised from the film's timing map (project/src/timing.ts).

Everything is original and generated here; nothing is sampled, so there's nothing to license.
Three separable stems plus the mix (48 kHz, 24-bit, stereo):
  candle-music.wav   the score: a low drone and wind, sparse plucked-string phrases (Karplus-Strong) in a D
                     hirajoshi mode, two soft drum hits on the cuts, a rising string tone and heartbeat on the
                     eyes, then a HARD cut to digital silence at 6.40 s. One deadpan low pluck under the title;
                     the phrase resolves on the end card.
  candle-sfx.wav     the whoosh, the impact (sub drop, crunch, wet ink splash, debris), the ringing, the two
                     sandals leaving, the falling whistle, the squeaks, the hanko stamp.
  candle-vo.wav      silence: the voice-over slot (cue sheet in ../VO_SCRIPT.md). No synthetic narrator.
  candle-mix.wav     music + sfx (+ vo if present), peak-normalised to -1 dBFS.

usage: python3 tools/make_audio.py [outdir]   (default: project/public/audio)
       VO=path/to/recorded.wav python3 tools/make_audio.py   mixes a recorded voice-over in, ducking the music
"""
import os, re, sys, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = open(os.path.join(HERE, '..', 'project', 'src', 'timing.ts')).read()
T = {k: float(v) for k, v in re.findall(r'^\s+(\w+): ([\d.]+),', SRC, re.M)}
T.update({k: (float(a), float(b)) for k, a, b in re.findall(r'^\s+(\w+): \[([\d.]+), ([\d.]+)\]', SRC, re.M)})
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'project', 'public', 'audio')
os.makedirs(OUT, exist_ok=True)

SR = 48000
DUR = T['dur']
N = int(SR * DUR)
rng = np.random.default_rng(1115)
music = np.zeros((N, 2))
sfx = np.zeros((N, 2))


def tt(d):
    return np.arange(int(SR * d)) / SR


def put(bus, t0, x, g=1.0, pan=0.0):
    if x.ndim == 1:
        l, r = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
        x = np.stack([x * l, x * r], 1) * np.sqrt(2)
    i = int(round(t0 * SR))
    a, b = max(0, i), min(N, i + len(x))
    if a < b:
        bus[a:b] += x[a - i:b - i] * g


def lp(x, fc):
    """one-pole low-pass (vectorised via an IIR loop on a coarse block approach is overkill: use FFT)."""
    X = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    H = 1 / np.sqrt(1 + (f / fc) ** 4)
    return np.fft.irfft(X * (H[:, None] if x.ndim == 2 else H), n=len(x), axis=0)


def bp(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    H = (1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)) * (1 / np.sqrt(1 + (f / hi) ** 4))
    return np.fft.irfft(X * H, n=len(x))


def reverb(x, secs=2.2, mix=0.35, seed=3):
    r = np.random.default_rng(seed)
    n = int(SR * secs)
    env = np.exp(-np.arange(n) / SR * (6.9 / secs))
    out = np.zeros_like(x)
    for c in range(2):
        ir = r.normal(0, 1, n) * env
        ir = lp(ir, 5200)
        ir /= np.sqrt((ir ** 2).sum())
        L = len(x) + n
        y = np.fft.irfft(np.fft.rfft(x[:, c], L) * np.fft.rfft(ir, L), L)[:len(x)]
        out[:, c] = y
    return x * (1 - mix) + out * mix * 1.6


# ---------------------------------------------------------------- instruments
def pluck(freq, d=3.0, bright=0.6, decay=0.996):
    """Karplus-Strong, computed a period at a time (vectorised)."""
    P = int(SR / freq)
    n = int(SR * d)
    y = np.zeros(n + P + 1)
    burst = rng.uniform(-1, 1, P)
    burst = burst * bright + np.convolve(burst, np.ones(4) / 4, 'same') * (1 - bright)
    y[:P] = burst
    for s in range(P, n, P):
        e = min(n, s + P)
        seg = y[s - P:e - P + 1]
        y[s:e] = 0.5 * (seg[:-1] + seg[1:])[:e - s] * decay
    out = y[:n]
    # the body: a short resonant attack and a gentle fade
    out *= np.exp(-np.arange(n) / SR * 0.9)
    out[:int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    return out * 0.6


def drone(d, notes, swell=1.5):
    t = tt(d)
    x = np.zeros(len(t))
    for f, g in notes:
        for det in (-0.9, 0, 1.1):
            ph = rng.uniform(0, 6.28)
            x += g * (np.sin(2 * np.pi * (f + det * 0.15) * t + ph) + 0.3 * np.sin(2 * np.pi * 2 * (f + det * 0.2) * t + ph))
    x *= np.minimum(1, t / swell)
    return x / 6


def wind(d, g=1.0):
    n = rng.normal(0, 1, int(SR * d))
    n = bp(n, 250, 1400)
    t = tt(d)
    lfo = 0.55 + 0.45 * np.sin(2 * np.pi * 0.23 * t + 1) * np.sin(2 * np.pi * 0.11 * t)
    return n * lfo * g * 0.08


def taiko(g=1.0):
    t = tt(1.4)
    f = 62 * np.exp(-t * 3) + 48
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5)
    skin = bp(rng.normal(0, 1, len(t)), 120, 900) * np.exp(-t * 30) * 0.4
    return (body + skin) * g


def heartbeat(g=1.0):
    t = tt(0.5)
    def thump(d):
        return np.sin(2 * np.pi * 52 * t) * np.exp(-t * 18) * (t >= 0)
    x = thump(0)
    s = int(0.17 * SR)
    x[s:] += thump(0)[:len(x) - s] * 0.7
    return lp(x, 160) * g


def string_tone(f, d, g=1.0):
    t = tt(d)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 0.6)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    x = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.18 * np.sin(3 * ph) + 0.08 * np.sin(5 * ph)
    env = np.minimum(1, t / d) ** 1.6
    return lp(x * env, 2400) * g


# ---------------------------------------------------------------- the score (act one, played straight)
D2, A2, D3, E3, F3, A3, Bb3, D4, E4, F4, A4, D5 = 73.42, 110.0, 146.83, 164.81, 174.61, 220.0, 233.08, 293.66, 329.63, 349.23, 440.0, 587.33
put(music, 0.0, drone(T['silence'], [(D2, 1.0), (A2, 0.55), (D3, 0.3)], swell=1.2), 0.55)
put(music, 0.0, np.stack([wind(T['silence']), wind(T['silence'])], 1), 1.0)
phrase = [(0.30, D4, 0.0), (0.95, A3, -0.3), (1.55, F4, 0.3), (2.05, E4, 0.15),
          (3.05, D4, -0.2), (3.55, Bb3, 0.25), (4.15, A3, -0.1), (4.55, F3, 0.1)]
for t0, f, pan in phrase:
    put(music, t0, pluck(f, 2.6), 0.5, pan)
put(music, T['s2'][0], taiko(), 0.55)
put(music, T['s2'][0], pluck(D3, 3.0, 0.4), 0.45)
put(music, T['s3'][0], taiko(), 0.7)
put(music, T['s3'][0], pluck(D2 * 2, 3.0, 0.35), 0.5)
put(music, T['s3'][0], string_tone(D5, T['silence'] - T['s3'][0]), 0.16, 0.1)
put(music, T['s3'][0], string_tone(A4, T['silence'] - T['s3'][0]), 0.10, -0.1)
for hb in (5.18, 5.78, 6.22):
    put(music, hb, heartbeat(), 0.9)

# act two: TRUE silence from the cut back to the wide (5 ms fade so it doesn't click)
music = reverb(music, 2.4, 0.38)
cut = int(T['silence'] * SR)
f5 = int(0.005 * SR)
music[cut - f5:cut] *= np.linspace(1, 0, f5)[:, None]
music[cut:] = 0

# title: one deadpan low pluck; end card: the phrase resolves under the stamp
late = np.zeros((N, 2))
put(late, T['title'] + 0.05, pluck(D3, 3.0, 0.3), 0.5)
put(late, T['stamp'], pluck(D4, 2.6), 0.42, -0.2)
put(late, T['stamp'] + 0.42, pluck(A3, 2.4), 0.36, 0.2)
put(late, T['stamp'] + 0.84, pluck(D3, 2.6, 0.4), 0.42)
put(late, T['stamp'], drone(DUR - T['stamp'], [(D2, 1.0), (A2, 0.5)], swell=0.8), 0.35)
late = reverb(late, 2.4, 0.38)
late[:int((T['title']) * SR)] = 0
fade = int(1.2 * SR)
late[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
music += late

# ---------------------------------------------------------------- effects
I = T['impact']
# the drop: a short air rush into contact
d = 0.16
w = rng.normal(0, 1, int(SR * d))
w = bp(w, 600, 5000) * np.linspace(0, 1, len(w)) ** 2.5
put(sfx, I - d, w, 0.5)
# impact: sub drop, crunch, crack
t = tt(1.8)
sub = np.sin(2 * np.pi * np.cumsum(28 + 70 * np.exp(-t * 5)) / SR) * np.exp(-t * 2.4)
put(sfx, I, sub, 1.0)
t = tt(0.35)
crunch = np.tanh(rng.normal(0, 1, len(t)) * 4) * np.exp(-t * 14)
put(sfx, I, lp(crunch, 3000), 0.75)
put(sfx, I, bp(rng.normal(0, 1, int(0.03 * SR)), 1500, 9000) * np.exp(-tt(0.03) * 120), 0.9)
# the wet ink splash: filtered noise with granular splats
t = tt(0.9)
splash = bp(rng.normal(0, 1, len(t)), 700, 5200) * np.exp(-t * 5)
for k in range(46):
    ts = abs(rng.normal(0.12, 0.18))
    if ts < 0.85:
        g = rng.uniform(0.2, 1.0) * np.exp(-ts * 2.5)
        put(sfx, I + ts, bp(rng.normal(0, 1, int(0.02 * SR)), 900, 6000) * np.exp(-tt(0.02) * 220) * g, 0.5, rng.uniform(-0.7, 0.7))
put(sfx, I + 0.01, splash, 0.55)
# debris pattering down
for k in range(30):
    ts = 0.25 + rng.uniform(0, 0.9)
    put(sfx, I + ts, bp(rng.normal(0, 1, int(0.012 * SR)), 2000, 8000) * np.exp(-tt(0.012) * 300), 0.18 * np.exp(-(ts - 0.25) * 1.5), rng.uniform(-0.8, 0.8))
# the ringing: what's left of the world for a second
t = tt(1.5)
ring = np.sin(2 * np.pi * 3150 * t) * np.minimum(1, t / 0.05) * np.exp(-t * 2.2)
put(sfx, I + 0.1, ring, 0.03)
# the sandals leave: two thin rising whistles
for k, (ts, pan) in enumerate([(0.07, -0.4), (0.12, 0.4)]):
    t = tt(0.32)
    f = 500 + 1300 * (t / 0.32) ** 1.4
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.32) ** 2
    put(sfx, I + ts, x, 0.06, pan)
# one comes back: a small falling whistle, then the squeaks
d = T['land1'] - T['returnStart']
t = tt(d)
f = 1500 - 800 * (t / d) ** 1.2
x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.05) * 0.6
put(sfx, T['returnStart'], x, 0.05, 0.3)


def squeak(d, f0, f1, f2, g):
    t = tt(d)
    k = t / d
    f = np.where(k < 0.4, f0 + (f1 - f0) * (k / 0.4), f1 + (f2 - f1) * ((k - 0.4) / 0.6))
    f = f * (1 + 0.03 * np.sin(2 * np.pi * 38 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)
    env = np.sin(np.pi * k) ** 0.6
    return x * env * g


put(sfx, T['land1'], squeak(0.15, 820, 1450, 1150, 1.0), 0.28, 0.3)
put(sfx, T['land1'], bp(rng.normal(0, 1, int(0.03 * SR)), 300, 2500) * np.exp(-tt(0.03) * 120), 0.12, 0.3)
put(sfx, T['land2'], squeak(0.09, 1000, 1600, 1350, 1.0), 0.14, 0.3)
# the hanko: a soft thump and a paper slap on contact
t = tt(0.4)
put(sfx, T['stamp'], np.sin(2 * np.pi * 58 * t) * np.exp(-t * 14), 0.65)
put(sfx, T['stamp'], bp(rng.normal(0, 1, int(0.06 * SR)), 500, 6000) * np.exp(-tt(0.06) * 60), 0.4)

sfx = reverb(sfx, 1.4, 0.18, seed=9)
# keep the silence silent: nothing in either bus between the cut and the whoosh
music[cut:int((T['title']) * SR)] = 0
sfx[cut:int((I - 0.16) * SR)] = 0

# ---------------------------------------------------------------- voice-over slot
vo = np.zeros((N, 2))
vo_path = os.environ.get('VO')
if vo_path:
    with wave.open(vo_path) as wf:
        assert wf.getframerate() == SR, 'VO must be 48 kHz'
        raw = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16 if wf.getsampwidth() == 2 else np.int32)
        x = raw.reshape(-1, wf.getnchannels()).astype(np.float64) / (32768 if wf.getsampwidth() == 2 else 2 ** 31)
        if x.shape[1] == 1:
            x = np.repeat(x, 2, 1)
        vo[:min(N, len(x))] = x[:N]
    # duck the music under the voice
    env = lp(np.abs(vo).mean(1), 8)
    music *= (1 - 0.5 * np.clip(env / (env.max() + 1e-9) * 3, 0, 1))[:, None]


def write(name, x, peak=None):
    if peak:
        x = x / (np.abs(x).max() + 1e-9) * peak
    x = np.clip(x, -1, 1)
    y = (x * (2 ** 23 - 1)).astype(np.int32)
    b = np.zeros((len(y), 2, 3), np.uint8)
    for k in range(3):
        b[..., k] = (y >> (8 * k)) & 255
    with wave.open(os.path.join(OUT, name), 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(3)
        wf.setframerate(SR)
        wf.writeframes(b.tobytes())
    print('wrote', name)


mix = music + sfx + vo
g = 10 ** (-1 / 20) / (np.abs(mix).max() + 1e-9)
write('candle-music.wav', music * g)
write('candle-sfx.wav', sfx * g)
write('candle-vo.wav', vo * g)
write('candle-mix.wav', mix * g)

# a level map per beat, for the README (the environment has no speakers: this is how the mix was checked)
def db(a, b):
    seg = mix[int(a * SR):int(b * SR)] * g
    r = np.sqrt((seg ** 2).mean() + 1e-12)
    return 20 * np.log10(r), 20 * np.log10(np.abs(seg).max() + 1e-12)
for name, a, b in [('act one (wide)', 0.0, 2.5), ('medium', 2.5, 5.0), ('eyes', 5.0, 6.4), ('SILENCE', 6.41, I - 0.17),
                   ('whoosh', I - 0.16, I), ('impact', I, I + 0.4), ('aftermath', I + 0.4, T['returnStart']),
                   ('falling sandal', T['returnStart'], T['land1']), ('squeak', T['land1'], T['land1'] + 0.15),
                   ('pause', T['settle'], T['title']), ('title', T['title'], T['end']), ('end card', T['end'], DUR)]:
    rms, pk = db(a, b)
    print(f'{name:16s} {a:5.2f}-{b:5.2f}s  rms {rms:7.1f} dB  peak {pk:6.1f} dB')
