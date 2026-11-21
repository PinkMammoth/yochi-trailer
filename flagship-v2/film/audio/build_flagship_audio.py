"""Flagship v2 music edit, stems and timing map. No new music.

The approved Duels edit is kept exactly for its first 14.5 s: one continuous run from src 102.318 with THE LAST
STAND v2's three silent beats inserted at src 110.399. The track then simply carries on (THE LAST STAND stopped at
115.44) through the rest of drop 2 and the lighter section, and ONE splice joins the lighter section's last bar to
drop 3: bar 96 -> bar 120 (src 143.070 -> 175.802), phrase start to phrase start, sparse bar into the biggest drop.
From there it runs untouched to the track's own ending (outro slam bar 136, final slam bar 144, the last stab).

Measured: 176 BPM, beat 0.34095 s, bar n at 12.144 + n*1.3638 s; 8-bar phrases from bar 0 (see
flagship-animatic/audio/analyse.py). NOT AUDITIONED: built from measurement only.

Writes audio/out-flagship/{music,sfx,mix}.wav, edl.json and remotion/src/flagship/timing.json.
SFX: the approved Duels sfx stem up to 13.70 s (its seal stamp at 13.74 belonged to the Duels lockup, which the
flagship drops), then placeholder synthesis, every cue listed."""
import json, os, subprocess, numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
SRC = os.path.join(ROOT, 'last-candle-standing', 'v4', 'music-source', 'Victory Stamp_dark_dnb.mp3')
OUT = os.path.join(HERE, 'out-flagship')
TIMING = os.path.join(HERE, '..', 'remotion', 'src', 'flagship', 'timing.json')
SR = 48000
B0, BEAT = 12.144, 0.34095
BAR = 4 * BEAT
bar = lambda n: B0 + n * BAR
S = lambda s: int(round(s * SR))

def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()

x = load(SRC)
IN = 102.3178                      # THE LAST STAND v2's in-point (kept: the approved opening is locked)
SIL_AT, SIL_LEN = 110.399, 3 * BEAT
SPLICE_OUT, SPLICE_IN = bar(96), bar(120)
END = 212.0
segs = [dict(what='run 1 (approved Duels opening): src 102.318 to the insert', src_in=IN, src_out=SIL_AT),
        dict(what='3 silent beats (approved, THE LAST STAND v2)', silence=SIL_LEN),
        dict(what='run 2: drop 2 (bars 72-87) and the lighter section (bars 88-95), continuous', src_in=SIL_AT, src_out=SPLICE_OUT),
        dict(what='SPLICE bar 96 -> bar 120; run 3: drop 3, build, outro slam, final slam, last stab, decay', src_in=SPLICE_IN, src_out=END)]

def fade(a, i, o):
    a = a.copy()
    if i: k = min(S(i), len(a)); a[:k] *= np.linspace(0, 1, k)[:, None]
    if o: k = min(S(o), len(a)); a[-k:] *= np.linspace(1, 0, k)[:, None]
    return a

parts, v = [], 0.0
for s in segs:
    s['video_in'] = round(v, 4)
    a = np.zeros((S(s['silence']), 2), np.float32) if 'silence' in s else fade(x[S(s['src_in']):S(s['src_out'])], 0.010, 0.8 if s['src_out'] == END else 0.012)
    parts.append(a); v += len(a) / SR; s['video_out'] = round(v, 4)
TAIL = 1.2
music = np.vstack(parts + [np.zeros((S(TAIL), 2), np.float32)])
DUR = round(len(music) / SR, 3)

def v_of(src):
    for s in segs:
        if 'src_in' in s and s['src_in'] - 1e-6 <= src <= s['src_out'] + 1e-6:
            return round(s['video_in'] + src - s['src_in'], 4)
    raise ValueError(src)
VB = lambda n: v_of(bar(n))

# ---------------------------------------------------------------- the timing map (video seconds)
T = dict(fps=60, beat=BEAT, bar=BAR, dur=DUR,
         bars={str(n): VB(n) for n in list(range(72, 96)) + list(range(120, 146)) if bar(n) <= END})
T['victory'] = dict(start=11.073, amount=12.954, hold=v_of(115.097), pullStart=VB(76))  # Duels values, re-used
T['pull'] = dict(start=VB(76), handover=VB(78), world=VB(80))
T['gather'] = dict(establish=VB(80), highRoller=VB(82), across=VB(84), ensemble=VB(86), ensembleHits=[VB(86) + i * 2 * BEAT for i in range(4)])
T['picks'] = dict(lucky=VB(88), luckyPick=VB(90), close=VB(92), held=VB(94), open=VB(120))
T['candle'] = dict(open=VB(120), dive=VB(122), deep=VB(124), still=VB(126), turn=VB(128), climb=VB(130), edge=VB(132), last=VB(134), close=VB(136))
H = [199.332, 200.017, 200.69, 201.375, 202.06, 202.745, 203.43, 204.115]
T['close'] = dict(t=VB(136), hits=[v_of(h) for h in H], pool=VB(140), breath=v_of(204.44), finalSlam=VB(144), stab=v_of(209.177))
T['segments'] = segs
os.makedirs(os.path.dirname(TIMING), exist_ok=True)
json.dump(T, open(TIMING, 'w'), indent=1)

# ---------------------------------------------------------------- sfx: approved Duels stem, then placeholders
rng = np.random.default_rng(11)
sfx = np.zeros_like(music)
duels_sfx = load(os.path.join(HERE, 'out', 'sfx.wav'))
cut = S(13.70)
sfx[:cut] += fade(duels_sfx[:cut], 0, 0.03)
cues = [dict(t=0.0, cue='THE LAST STAND v2 sfx stem, 0-13.70 s (its lockup seal stamp at 13.74 dropped)')]
def env(n, dec): e = np.exp(-np.arange(n) / (dec * SR)); e[:96] *= np.linspace(0, 1, 96); return e
def thump(f0, dec):
    n = S(dec * 3); t = np.arange(n) / SR; f = f0 * (1 + 2.5 * np.exp(-t * 30))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, dec)
def lp_noise(n, c):
    w = rng.standard_normal(n); y = np.zeros(n); a = 0.0
    c = np.broadcast_to(c, (n,))
    for i in range(n): a += c[i] * (w[i] - a); y[i] = a
    return y
def noise(dec, c=0.3): n = S(dec * 3); return lp_noise(n, c) * env(n, dec) * 2
def whoosh(L, up=True):
    n = S(L); c = np.linspace(0.02, 0.35, n) if up else np.linspace(0.35, 0.02, n)
    return lp_noise(n, c) * np.sin(np.linspace(0, np.pi, n)) ** 2 * 1.5
def mixa(*xs):
    n = max(len(q) for q in xs); o = np.zeros(n)
    for q in xs: o[:len(q)] += q
    return o
def cue(name, t, a, g):
    i = S(t); a = a[:len(sfx) - i]; sfx[i:i + len(a)] += g * np.repeat(a[:, None], 2, 1); cues.append(dict(t=round(t, 3), cue=name))
P, G, K, C, X = T['pull'], T['gather'], T['picks'], T['candle'], T['close']
cue('pullback: air, rising', P['start'], whoosh(P['world'] - P['start'] + 0.4), 0.3)
cue('foreground arch passes the lens', P['handover'] + 1.2, whoosh(0.6, False), 0.4)
cue('FREE FOR ALL slam', G['establish'], mixa(thump(55, 0.3), noise(0.1)), 0.6)
cue('High Roller: chip flip', G['highRoller'] + 0.9, mixa(noise(0.02, 0.8), thump(900, 0.03)), 0.25)
for i, t in enumerate(G['ensembleHits']): cue(f'ensemble panel {i + 1}', t, mixa(thump(70, 0.12), noise(0.04, 0.5)), 0.35)
cue('Lucky Fool: ticket down', K['luckyPick'] + 0.7, noise(0.03, 0.7), 0.2)
cue('PICKS CLOSE: four 決', K['close'], mixa(thump(65, 0.25), noise(0.08, 0.4)), 0.55)
cue('the candle opens (drop 3)', C['open'], mixa(thump(40, 0.6), noise(0.3, 0.25)), 0.8)
cue('the turn', C['turn'], whoosh(1.2), 0.35)
cue('THE CLOSE: the ink wave', X['t'], mixa(thump(35, 0.8), noise(0.6, 0.2)), 0.95)
for i, t in enumerate(X['hits'][:6]): cue(f'reaction hit {i + 1}', t, mixa(thump(60, 0.15), noise(0.05, 0.45)), 0.45)
cue('the Yochi seal stamps', X['stab'], mixa(thump(60, 0.25), noise(0.08, 0.5)), 0.6)
sfx = np.clip(sfx, -1, 1).astype(np.float32)

os.makedirs(OUT, exist_ok=True)
def wav(name, a):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s16le', os.path.join(OUT, name + '.wav')], input=a.astype(np.float32).tobytes())
mix = music * 0.85 + sfx * 0.65
mix /= max(1.0, np.abs(mix).max() / 0.89)
wav('music', music); wav('sfx', sfx); wav('mix', mix)
json.dump(dict(source=os.path.relpath(SRC, ROOT), bpm=176, beat_s=BEAT, sample_rate=SR, video_duration_s=DUR, segments=segs, sfx_cues=cues,
               note='Built from objective measurement; not auditioned.'), open(os.path.join(OUT, 'edl.json'), 'w'), indent=1)
print('dur', DUR); print(json.dumps({k: T[k] for k in ('pull', 'gather', 'picks', 'candle', 'close')}))
