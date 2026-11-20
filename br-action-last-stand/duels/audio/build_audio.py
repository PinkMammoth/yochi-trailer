#!/usr/bin/env python3
"""YOCHI DUELS: THE LAST STAND. The music edit, the effects and the mix, as three separate stems, and the
film's timing map (remotion/src/timing.json), all from the measured track.

Music: Victory Stamp_dark_dnb.mp3 (owner's track), one continuous run from bar 102.318, with two edits only:
  1. TWO BEATS of true silence inserted at 110.399 (just before drop 2): the disbelief beat;
  2. the end: the dry track is kept to the end of the final big hit's beat (112.374 + 1 beat), closed with a
     40 ms fade, and that last beat rings out through a generated room (low-passed, decorrelated): a controlled
     decay of the track's own sound under the end card (the approach V4 used), not new music.
No pitch shift, no time-stretch. Effects: V1's synthesised instruments (last-candle-standing/audio/score.py,
loaded read-only), cued from the timing map. The silence stays silent.

usage: python3 duels/audio/build_audio.py   -> audio/out/{music,sfx,mix}.wav, sfx_cues.json; remotion/src/timing.json
"""
import json, os, subprocess, wave
import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..', '..')
OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
SRC = os.path.join(ROOT, 'last-candle-standing', 'v4', 'music-source', 'Victory Stamp_dark_dnb.mp3')
V1 = os.path.join(ROOT, 'last-candle-standing', 'audio', 'score.py')
P = 0.34095; BAR = 4 * P
IN = 94.135 + 6 * BAR            # 102.318, a structural bar line (the 94.135 return-slam grid)
INSERT_AT, INSERT = 110.399, 2 * P
FINAL = 112.374                  # drop 2's second big hit (onset 8.5): the film's last hit
DRY_END = FINAL + P
TAIL = 3.2
DUR = 14.2
src = lambda s: s - IN + (INSERT if s > INSERT_AT else 0.0)   # source time -> video time

# ---------------------------------------------------------------- the timing map (video seconds)
T = {
    '_': 'YOCHI DUELS: THE LAST STAND. The one timing map, video seconds, written by audio/build_audio.py from the measured track '
         '(176 BPM, beat 0.34095 s). Music: continuous from src 102.318; two inserted silent beats at src 110.399; ends on src 112.374 '
         'with a ring-out. Strong hits sit on the half-beat phase of the 94.135 grid.',
    'fps': 60, 'beat': P, 'dur': DUR,
    'src': {'in': round(IN, 4), 'insertAt': INSERT_AT, 'insertLen': round(INSERT, 5), 'final': FINAL, 'dryEnd': round(DRY_END, 4), 'tail': TAIL},
    'threat': {'start': 0.0, 'end': round(src(IN + BAR), 4)},
    'challenger': {'start': round(src(IN + BAR), 4), 'vs': round(src(IN + BAR), 4), 'end': round(src(IN + 2 * BAR), 4)},
    'pickHim': {'start': round(src(IN + 2 * BAR), 4), 'lock': round(src(IN + 2 * BAR) + 0.017, 4), 'end': round(src(IN + 3 * BAR), 4)},
    'pickHer': {'start': round(src(IN + 3 * BAR), 4), 'lock': round(src(106.926), 4), 'end': round(src(IN + 4 * BAR), 4)},
    'candle': {'start': round(src(IN + 4 * BAR), 4), 'subOut': round(src(107.95), 4), 'end': round(src(IN + 5 * BAR), 4)},
    'winning': {'start': round(src(IN + 5 * BAR), 4), 'end': 7.36},
    'reversal': {'start': 7.36, 'cross': 7.62, 'end': 7.78},
    'lastGrin': {'start': 7.78, 'end': round(src(INSERT_AT), 4)},
    'close': round(src(INSERT_AT), 4),
    'disbelief': {'start': round(src(INSERT_AT), 4), 'end': round(src(INSERT_AT) + INSERT, 4)},
    'strike': {'start': round(src(INSERT_AT) + INSERT, 4), 'subIn': round(src(110.5006), 4), 'wide': 8.93, 'hit': round(src(110.667), 4)},
    'impact': {'hitStop': 0.15, 'pulses': [round(src(111.523), 4), round(src(111.863), 4), round(src(112.037), 4)], 'end': round(src(FINAL), 4)},
    'finale': {'start': round(src(FINAL), 4), 'win': round(src(FINAL), 4), 'amount': round(src(FINAL) + 0.3, 4), 'brand': round(src(FINAL) + 0.62, 4),
               'sub': round(src(FINAL) + 0.86, 4), 'url': round(src(FINAL) + 1.15, 4), 'dryEnd': round(src(DRY_END), 4), 'end': DUR},
}
json.dump(T, open(os.path.join(HERE, '..', 'remotion', 'src', 'timing.json'), 'w'), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- music
SR = 48000


def grab(a, b):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', f'{a:.4f}', '-t', f'{b - a:.4f}', '-i', SRC, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, '<f4').reshape(-1, 2).T.astype(float).copy()


A, B = grab(IN, INSERT_AT), grab(INSERT_AT, DRY_END)
g = int(0.012 * SR)
A[:, -g:] *= np.linspace(1, 0, g); B[:, :g] *= np.linspace(0, 1, g) ** 0.5
f40 = int(0.04 * SR); B[:, -f40:] *= np.linspace(1, 0, f40)
dry = np.concatenate([A, np.zeros((2, int(round(INSERT * SR)))), B], axis=1)
N = int(round(DUR * SR))
music = np.zeros((2, N)); music[:, :min(N, dry.shape[1])] = dry[:, :N]
music[:, :int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))
# the ring-out: the final beat through a generated room
last = grab(FINAL, DRY_END)
for ch in range(2):
    r = np.random.default_rng(11 + ch); n = int(SR * TAIL)
    ir = r.standard_normal(n) * np.exp(-np.arange(n) / (SR * TAIL / 6.9))
    ir = sosfilt(butter(2, 4200 / (SR / 2), 'low', output='sos'), ir); ir[:int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = fftconvolve(last[ch], ir)
    i0 = int(round(src(FINAL) * SR))
    seg = wet[:max(0, N - i0)] * 0.55
    music[ch, i0:i0 + len(seg)] += seg
fo = int(0.25 * SR); music[:, N - fo:] *= np.linspace(1, 0, fo) ** 2

# ---------------------------------------------------------------- effects
srcpy = open(V1).read().split('# ------------------------------------------------------------------ the cue sheet')[0]
srcpy = srcpy.replace("T = json.load(open(os.path.join(HERE, '..', 'remotion', 'src', 'timing.json')))", 'T = {"dur": 30, "bpm": 176}')
L = {'__file__': V1}; exec(compile(srcpy, V1, 'exec'), L)
assert L['SR'] == SR
sfx = np.zeros((2, N)); cue = []


def put(t0, x, g=1.0, pan=0.0, what=None):
    if x.ndim == 1:
        x = np.vstack([x * np.sqrt(1 - pan), x * np.sqrt(1 + pan)])
    i = int(round(t0 * SR))
    if i >= N or i + x.shape[1] <= 0:
        return
    lo, hi = max(0, i), min(N, i + x.shape[1])
    sfx[:, lo:hi] += x[:, lo - i:hi - i] * g
    if what:
        cue.append((round(t0, 3), what))


put(T['challenger']['vs'] - 0.07, L['stamp'](0.6), 0.5, what='対 stamps in the gutter')
put(T['challenger']['vs'] - 0.1, L['whoosh'](0.14, 0.5, 400, 5000), 0.35, 0.3, 'mira cuts in: whoosh')
put(T['pickHim']['lock'] - 0.07, L['stamp'](0.6), 0.75, -0.3, 'brick ▲ UP: a hard 決 stamp')
put(T['pickHim']['lock'], L['confirm'](0.5), 0.35, -0.3)
put(T['pickHer']['lock'] - 0.06, L['stamp'](0.6), 0.4, 0.3, 'mira ▼ DOWN: a quiet 決')
for k in range(3):
    x = T['candle']['start'] + k * 0.9
    put(x, L['tick'](0.6), 0.4, what='timer tick')
put(T['reversal']['start'], L['whoosh'](0.4, 0.5, 4000, 250), 0.45, 0, 'the reversal: a falling whoosh')
put(T['reversal']['cross'], L['life_lost'](0.6), 0.35, what='price crosses the strike')
put(T['strike']['start'] - 0.05, L['whoosh'](0.2, 0.5, 600, 8000), 0.6, 0.4, 'her lunge: whoosh out of the silence')
put(T['strike']['wide'], L['brush'](0.12, 0.5), 0.7, -0.2, 'the stroke launches from her blade')
put(T['strike']['hit'] + 0.004, L['mega_impact'](0.6), 0.45, what='THE HIT: impact under drop 2')
put(T['strike']['hit'] + T['impact']['hitStop'], L['whoosh'](0.5, 0.5, 220, 2600), 0.5, -0.5, 'knockback whoosh')
for k, q in enumerate(T['impact']['pulses']):
    put(q, L['ink_drop'](0.5, 0.8 + 0.15 * k), 0.45, -0.3 - 0.15 * k, 'ink burst on the drop hit' if k == 0 else None)
put(T['finale']['win'] - 0.06, L['stamp'](0.6), 0.6, what='勝 stamps on the final hit')
for k in range(7):
    put(T['finale']['amount'] + 0.05 + k * 0.04, L['click'](0.5, 3000 + 380 * k), 0.1, (k - 3) * 0.12)
cue.append((round(T['finale']['amount'], 3), '+19 USDC: a light coin run'))
put(T['finale']['brand'] - 0.06, L['stamp'](0.6), 0.55, what='the Yochi seal stamps')
for ch in range(2):
    sfx[ch] = L['reverb'](sfx[ch], 1.0, 0.14, seed=7 + ch)
i, j = int(T['disbelief']['start'] * SR), int((T['strike']['start'] - 0.06) * SR)
sfx[:, i:j] = 0.0   # the silence stays silent

duck = np.ones(N)
for t0, depth, dd in [(T['pickHim']['lock'], 0.75, 0.3), (T['finale']['brand'], 0.85, 0.4)]:
    s0 = int(t0 * SR); n = int(dd * SR); att = int(0.02 * SR)
    duck[s0 - att:s0] = np.minimum(duck[s0 - att:s0], np.linspace(1, depth, att))
    duck[s0:s0 + n] = np.minimum(duck[s0:s0 + n], depth + (1 - depth) * np.linspace(0, 1, n) ** 2)
GS = 0.55
mix = music * duck + sfx * GS


def write(name, x):
    y = (np.clip(x, -1, 1) * 32767).astype('<i2').T.copy(); p = os.path.join(OUT, name)
    with wave.open(p, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())
    return p


def lufs(p):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(r.split('Integrated loudness:')[1].split('I:')[1].split('LUFS')[0]), float(r.split('True peak:')[1].split('Peak:')[1].split('dBFS')[0])


p = write('mix.wav', mix); I0, P0 = lufs(p)
gain = min(10 ** ((-14 - I0) / 20), 10 ** ((-1.0 - P0) / 20))
write('mix.wav', mix * gain); write('music.wav', music * duck * gain); write('sfx.wav', sfx * GS * gain)
I1, P1 = lufs(p)
print(f'mix {I0:.1f} LUFS/{P0:.1f} dBTP -> {20*np.log10(gain):+.1f} dB -> {I1:.1f} LUFS/{P1:.1f} dBTP')
json.dump([{'t': t, 'what': w} for t, w in sorted(cue)], open(os.path.join(OUT, 'sfx_cues.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in T.items() if k != '_'}, ensure_ascii=False)[:1500])
