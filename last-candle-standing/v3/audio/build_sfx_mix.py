#!/usr/bin/env python3
"""BATTLE ROYALE V3: the effects track and the final mix (V2's script, re-cued to V3; see the V3 notes below).

The effects reuse V1's synthesised instruments as they are (../../audio/score.py: ink drops, UI clicks, the lock,
life loss, knock-out, stamp, brush, the final impact), loaded from that file rather than copied, and re-cued to
V2's timing map. The owner-supplied music (audio/out/music.wav from build_music.py) is the lead: effects sit under
it, the music ducks a few dB only under the lock, the stamps and the payout, and it never ducks under its own slam.

Writes audio/out/sfx.wav and audio/out/mix.wav (48 kHz stereo, 16-bit), loudness-matched to about -14 LUFS
integrated with peaks under -1 dBFS.

usage: python3 audio/build_sfx_mix.py      (after build_music.py)
"""
import json, os, subprocess, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
T = json.load(open(os.path.join(HERE, '..', 'remotion', 'src', 'timing.json')))
V1 = os.path.join(HERE, '..', '..', 'audio', 'score.py')

# V1's instruments: everything above its cue sheet (definitions only, nothing is rendered)
src = open(V1).read().split('# ------------------------------------------------------------------ the cue sheet')[0]
src = src.replace("T = json.load(open(os.path.join(HERE, '..', 'remotion', 'src', 'timing.json')))", 'T = {"dur": 30, "bpm": 176}')
lib = {'__file__': V1}
exec(compile(src, V1, 'exec'), lib)
SR = lib['SR']

with wave.open(os.path.join(OUT, 'music.wav')) as w:
    music = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, 2).T.astype(float) / 32768
N = music.shape[1]
sfx = np.zeros((2, N))


def put(t0, x, g=1.0, pan=0.0):
    if x.ndim == 1:
        x = np.vstack([x * np.sqrt(1 - pan), x * np.sqrt(1 + pan)])
    i = int(round(t0 * SR))
    if i >= N or i + x.shape[1] <= 0:
        return
    a, b = max(0, i), min(N, i + x.shape[1])
    sfx[:, a:b] += x[:, a - i:b - i] * g


L = lib
OP, R1, M, C, Hh, E = T['open'], T['round1'], T['montage'], T['candle'], T['hero'], T['endcard']
B = T['beat']
cue = []  # (time, what) for the README

# --- open: the ink, the faces, the pool
for i, (t0, p) in enumerate([(0.0, 1.0), (0.1, 1.15), (0.18, 0.9), (0.3, 1.25), (0.36, 0.85), (0.46, 1.1)]):
    put(t0, L['ink_drop'](0.5, p), 0.55, pan=[-0.1, -0.5, 0.5, 0.45, -0.45, 0.1][i])
for i in range(10):
    put(OP['faces'][0] + i * 0.102, L['click'](0.5, 1800 + 90 * i), 0.16, pan=np.cos(i * 0.63) * 0.6)
put(OP['players'] - 0.1, L['whoosh'](0.12, 0.5, 600, 4000), 0.5)
put(OP['poolChip'], L['confirm'](0.5), 0.45); cue.append((OP['poolChip'], 'pool chip: the confirm'))
put(OP['lives'], L['click'](0.5, 1900), 0.3); put(OP['lives'] + 0.08, L['click'](0.5, 2400), 0.3)
# --- round 1: picks, lock, close, life loss
for i in range(10):
    put(R1['picks'][0] + i * 0.05, L['click'](0.5, 2000 + 120 * (i % 4)), 0.3, pan=np.cos(i * 0.63) * 0.7)
cue.append((R1['picks'][0], 'ten pick clicks'))
put(R1['lock'] - 0.07, L['stamp'](0.6), 0.55); put(R1['lock'], L['confirm'](0.5), 0.4); cue.append((R1['lock'], 'YOU lock: stamp + confirm'))
put(R1['close'], L['up_zip'](0.5), 0.35); cue.append((R1['close'], 'close: up zip'))
for j in range(4):
    put(R1['lose'] + j * 0.06, L['life_lost'](0.6), 0.45, pan=[-0.6, 0.6, -0.2, 0.3][j])
cue.append((R1['lose'], 'four life losses'))
# --- montage
starts = [M['start']]
for b in M['beats'][:-1]:
    starts.append(starts[-1] + b * B)
for k, n in enumerate(M['rounds']):
    t0 = starts[k]
    put(t0 - 0.04, L['whoosh'](0.1, 0.5, 800, 6000, rev=True), 0.3)
    put(t0 + M['grey'], L['knockout'](0.6), 0.5 if n != 4 else 0.62)
    put(t0 + M['grey'] + 0.03, L['stamp'](0.6), 0.35)
    put(t0 + M['grey'] + 0.02, L['life_lost'](0.6), 0.55 if n == 3 else 0.2)
    cue.append((t0 + M['grey'], f'R{n}: knock-out + 敗 stamp' + (' + YOU lose a life' if n == 3 else '')))
for cut in (M['start'], starts[2], T['reset']['start']):
    put(cut - 0.18, L['brush'](0.3, 0.5), 0.55, pan=-0.2)
    cue.append((cut - 0.18, 'brush wipe'))
# --- final two
put(T['versus']['start'] - 0.12, L['whoosh'](0.16, 0.5, 300, 5000), 0.45)
put(T['versus']['start'], L['stamp'](0.6), 0.45); cue.append((T['versus']['start'], 'versus band'))
put(T['cuYou']['lock'] - 0.07, L['stamp'](0.6), 0.7); put(T['cuYou']['lock'], L['confirm'](0.5), 0.45); cue.append((T['cuYou']['lock'], 'YOU ▲ UP: 決 stamp + confirm'))
put(T['cuRival']['lock'] - 0.05, L['stamp'](0.6), 0.5); cue.append((T['cuRival']['lock'], 'deano ▼ DOWN: stamp'))
for i in range(3):
    x = C['start'] + i * (C['close'] - C['start']) / 3
    put(x, L['tick'](0.6), 0.5)
    cue.append((x, 'timer tick'))
# the silence stays silent; the close rides the music's own slam
# V3: the impact sits lower, so the music's own slam transient leads
put(C['close'] + 0.01, L['mega_impact'](0.6), 0.38); put(C['close'], L['up_zip'](0.5), 0.22)
put(C['close'] + 0.04, L['life_lost'](0.6), 0.5); put(C['close'] + 0.16 + 0.07, L['stamp'](0.6), 0.55)
cue.append((C['close'], 'the close: impact under the music slam, last life, 敗 stamp'))
# --- victory and payout
put(Hh['seal'] - 0.07, L['stamp'](0.6), 0.75); cue.append((Hh['seal'], '勝 stamp'))
put(Hh['pool'], L['click'](0.5, 2600), 0.4); put(Hh['rake'], L['click'](0.5, 1500), 0.3)
# V3: +95 lands on drop 2: the drop is the event; a light coin run after its first big hit, no confirm chime
for i in range(9):
    put(Hh['hit'] + 0.08 + i * 0.04, L['click'](0.5, 3000 + 380 * i), 0.14, pan=(i - 4) * 0.12)
cue.append((Hh['hit'] + 0.08, '+95: a light coin run after drop 2\'s first hit'))
# the seal lands on the music's last hit; the stamp adds weight under it, then the music stops and rings out
put(E['seal'] + 0.07 - 0.01, L['stamp'](0.6), 0.5); cue.append((E['seal'] + 0.07, 'the seal, under the music\'s last hit'))

for ch in range(2):
    sfx[ch] = L['reverb'](sfx[ch], 1.0, 0.14, seed=7 + ch)
# hard silence for the effects inside the music's dramatic gap
i, j = int(C['silence'] * SR), int((C['close'] - 0.002) * SR)
sfx[:, i:j] = 0

# --- ducking: a few dB under the lock, the stamps and the payout; never under the music's own slam
duck = np.ones(N)
# V3: no ducking on drop 2 or on the last hit: those are the music's moments
for t0, depth, d in [(R1['lock'], 0.75, 0.3), (T['cuYou']['lock'], 0.72, 0.35), (Hh['seal'], 0.8, 0.35)]:
    a = int(t0 * SR); n = int(d * SR)
    seg = depth + (1 - depth) * np.linspace(0, 1, n) ** 2
    att = int(0.02 * SR)
    duck[a - att:a] = np.minimum(duck[a - att:a], np.linspace(1, depth, att))
    duck[a:a + n] = np.minimum(duck[a:a + n], seg)

sfx_gain = 0.55
mix = music * duck + sfx * sfx_gain
# V3: no saturation stage: the track's own dynamics are kept; only a static gain to the loudness target below



def write(name, x):
    y = (np.clip(x, -1, 1) * 32767).astype('<i2').T.copy()
    with wave.open(os.path.join(OUT, name), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())
    return os.path.join(OUT, name)


def lufs(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    I = float(r.split('Integrated loudness:')[1].split('I:')[1].split('LUFS')[0])
    P = float(r.split('True peak:')[1].split('Peak:')[1].split('dBFS')[0])
    return I, P


write('sfx.wav', sfx * sfx_gain)
p = write('mix.wav', mix)
I, P = lufs(p)
g = 10 ** ((-14 - I) / 20)
g = min(g, 10 ** ((-1.0 - P) / 20))  # never past -1 dBTP: if that binds, the mix stays a little under -14 LUFS
write('mix.wav', np.clip(mix * g, -1, 1))
I2, P2 = lufs(p)
print(f'mix: {I:.1f} LUFS / {P:.1f} dBTP -> gain {20*np.log10(g):+.1f} dB -> {I2:.1f} LUFS / {P2:.1f} dBTP')
mI, mP = lufs(os.path.join(OUT, 'music.wav'))
print(f'music stem: {mI:.1f} LUFS / {mP:.1f} dBTP')
json.dump([{'t': round(a, 3), 'what': b} for a, b in sorted(cue)], open(os.path.join(OUT, 'sfx_cues.json'), 'w'), ensure_ascii=False, indent=1)
