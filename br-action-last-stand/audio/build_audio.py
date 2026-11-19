#!/usr/bin/env python3
"""THE LAST STAND: the three audio stems, kept separate so picture and sound stay independently editable.

  out/music.wav  the owner's track, one continuous passage (timing.json src.in -> src.out): no splice, no
                 pitch shift, no time-stretch, no new music. A 10 ms fade-in and a short fade-out at the end only.
  out/sfx.wav    synthesised effects (V1's instruments in last-candle-standing/audio/score.py, loaded read-only),
                 cued from timing.json. They sit under the music; the near-silence before the drop stays silent.
  out/mix.wav    music + sfx, a few dB of ducking under the locks only, ~-14 LUFS, peaks under -1 dBTP.

usage: python3 audio/build_audio.py
"""
import json, os, subprocess, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)
T = json.load(open(os.path.join(HERE, '..', 'remotion', 'src', 'timing.json')))
SRC = os.path.join(ROOT, 'last-candle-standing', 'v4', 'music-source', T['src']['file'])
V1 = os.path.join(ROOT, 'last-candle-standing', 'audio', 'score.py')

src = open(V1).read().split('# ------------------------------------------------------------------ the cue sheet')[0]
src = src.replace("T = json.load(open(os.path.join(HERE, '..', 'remotion', 'src', 'timing.json')))", 'T = {"dur": 30, "bpm": 176}')
L = {'__file__': V1}
exec(compile(src, V1, 'exec'), L)
SR = L['SR']

# ---- music: the passage, sample-exact
a, b = T['src']['in'], T['src']['out']
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', f'{a:.4f}', '-t', f'{b - a:.4f}', '-i', SRC,
                      '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
music = np.frombuffer(raw, '<f4').reshape(-1, 2).T.astype(float).copy()
N = int(round(T['dur'] * SR))
music = np.pad(music, ((0, 0), (0, max(0, N - music.shape[1]))))[:, :N]
fi = int(0.010 * SR); music[:, :fi] *= np.linspace(0, 1, fi)
fo = int(T['src']['fadeOut'] * SR); music[:, N - fo:] *= np.linspace(1, 0, fo) ** 2

sfx = np.zeros((2, N))
cue = []


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


F, E, LL, LR, C, S, I, O = (T[k] for k in ['faceoff', 'eyes', 'lockL', 'lockR', 'candle', 'strike', 'impact', 'out'])
put(0.0, L['whoosh'](0.2, 0.5, 300, 5000, rev=True), 0.35, what='open: whoosh into the face-off')
put(F['vs'] - 0.07, L['stamp'](0.6), 0.5, what='対 stamps in the gutter')
put(F['nameL'], L['click'](0.5, 1900), 0.3, -0.5, 'name deano')
put(F['nameR'], L['click'](0.5, 2300), 0.3, 0.5, 'name mira')
put(E['a'] - 0.1, L['brush'](0.22, 0.5), 0.45, -0.3, 'eye strip deano: brush')
put(E['b'] - 0.1, L['brush'](0.22, 0.5), 0.45, 0.3, 'eye strip mira: brush')
put(E['livesA'], L['click'](0.5, 2600), 0.22, -0.4, '命 pips deano')
put(E['livesB'], L['click'](0.5, 2600), 0.22, 0.4, '命 pips mira')
put(LL['lock'] - 0.07, L['stamp'](0.6), 0.6, -0.2, 'deano ▼ DOWN: 決 stamp')
put(LL['lock'], L['confirm'](0.5), 0.3, -0.2)
put(LR['lock'] - 0.07, L['stamp'](0.6), 0.6, 0.2, 'mira ▲ UP: 決 stamp')
put(LR['lock'], L['confirm'](0.5), 0.3, 0.2)
for k in range(3):
    x = C['start'] + k * (C['close'] - C['start']) / 3
    put(x, L['tick'](0.6), 0.45, what='timer tick')
put(C['close'], L['up_zip'](0.5), 0.45, what='the candle closes UP')
put(C['close'] + 0.01, L['stamp'](0.6), 0.3)
put(C['crack'], L['life_lost'](0.6), 0.6, -0.3, "deano's last 命 cracks")
put(S['start'] - 0.02, L['whoosh'](0.17, 0.5, 500, 7000), 0.5, 0.3, 'slam-in on mira: whoosh')
put(S['hit'] + 0.004, L['mega_impact'](0.6), 0.42, what='THE HIT: impact under the drop')
put(S['hit'], L['brush'](0.3, 0.5), 0.6, 0.4)
put(S['hit'] + I['hitStop'], L['whoosh'](0.5, 0.5, 200, 3000), 0.5, -0.5, 'knockback: whoosh')
for k, (dt, p) in enumerate([(0.15, 0.8), (0.24, 1.1), (0.33, 0.7), (0.46, 0.95), (0.62, 0.75)]):
    put(S['hit'] + I['hitStop'] + dt, L['ink_drop'](0.5, p), 0.4, pan=-0.2 - 0.12 * k)
cue.append((round(S['hit'] + I['hitStop'] + 0.15, 3), 'ink dissolve: drops'))
put(O['stamp'] - 0.07, L['knockout'](0.6), 0.45, what='deano OUT: knock-out')
put(O['stamp'] - 0.06, L['stamp'](0.6), 0.55, what='敗 stamp (grey)')
for k in range(7):
    put(O['stamp'] + 0.22 + k * 0.04, L['click'](0.5, 3000 + 380 * k), 0.12, (k - 3) * 0.12)
cue.append((round(O['stamp'] + 0.22, 3), '+95 USDC: a light coin run'))

for ch in range(2):
    sfx[ch] = L['reverb'](sfx[ch], 1.0, 0.14, seed=7 + ch)
i, j = int(C['freeze'] * SR), int((S['start'] - 0.03) * SR)
sfx[:, i:j] *= 0.0  # the near-silence stays silent

duck = np.ones(N)
for t0, depth, d in [(LL['lock'], 0.78, 0.3), (LR['lock'], 0.78, 0.3)]:
    s0 = int(t0 * SR); n = int(d * SR); att = int(0.02 * SR)
    duck[s0 - att:s0] = np.minimum(duck[s0 - att:s0], np.linspace(1, depth, att))
    duck[s0:s0 + n] = np.minimum(duck[s0:s0 + n], depth + (1 - depth) * np.linspace(0, 1, n) ** 2)
g_sfx = 0.55
mix = music * duck + sfx * g_sfx


def write(name, x):
    y = (np.clip(x, -1, 1) * 32767).astype('<i2').T.copy()
    p = os.path.join(OUT, name)
    with wave.open(p, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())
    return p


def lufs(p):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(r.split('Integrated loudness:')[1].split('I:')[1].split('LUFS')[0]), float(r.split('True peak:')[1].split('Peak:')[1].split('dBFS')[0])


p = write('mix.wav', mix)
I0, P0 = lufs(p)
g = min(10 ** ((-14 - I0) / 20), 10 ** ((-1.0 - P0) / 20))
write('mix.wav', mix * g)
write('music.wav', music * g)          # stems at the mix's gain: music + sfx == mix (before clipping)
write('sfx.wav', sfx * g_sfx * g)
I1, P1 = lufs(p)
print(f'SR {SR}  mix {I0:.1f} LUFS/{P0:.1f} dBTP -> {20*np.log10(g):+.1f} dB -> {I1:.1f} LUFS/{P1:.1f} dBTP')
json.dump([{'t': t, 'what': w} for t, w in sorted(cue)], open(os.path.join(OUT, 'sfx_cues.json'), 'w'), ensure_ascii=False, indent=1)
