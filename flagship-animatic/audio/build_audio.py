"""Preliminary music edit + placeholder SFX for the flagship animatic. No new music: one continuous source run,
the approved 3-beat silence from THE LAST STAND v2, and ONE splice (bar 96 -> bar 136, phrase start to phrase start).
Writes audio/out/{music,sfx,mix}.wav, audio/out/edl.json and remotion/src/timing.json. Picture timings derive from
source times here, so re-timing the music re-times the picture.
Measured (audio/analyse.py): 176 BPM, beat 0.34095 s, bar n at 12.144 + n*1.3638 s; 8-bar phrases from bar 0."""
import json, os, subprocess, numpy as np
SR = 48000
SRC = '../last-candle-standing/v4/music-source/Victory Stamp_dark_dnb.mp3'
B0, BEAT = 12.144, 0.34095
BAR = 4 * BEAT
bar = lambda n: B0 + n * BAR
os.makedirs('audio/out', exist_ok=True)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', SRC, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout
x = np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
S = lambda s: int(round(s * SR))
SIL_AT = 110.399          # same insert point as THE LAST STAND v2 (end of the riser, just before drop 2's hit)
SIL_LEN = 3 * BEAT
SPLICE_OUT = bar(96)      # 143.07: where the source would re-enter after the lighter section
SPLICE_IN = bar(136)      # 197.62: the outro slam (loudest section of the track) -> natural ending
END_SRC = 212.0           # the track's own decay; below about -30 dB after 211.3, faded over the last 0.8 s
segs = [dict(what='run 1: setup groove, bars 64-71 + riser', src_in=bar(64), src_out=SIL_AT),
        dict(what='inserted silence (3 beats, as approved in THE LAST STAND v2)', silence=SIL_LEN),
        dict(what='run 2: drop 2 (bars 72-87) + lighter section (bars 88-95)', src_in=SIL_AT, src_out=SPLICE_OUT),
        dict(what='run 3: outro slam bar 136 to the track end (final slam bar 144, last stab, decay)', src_in=SPLICE_IN, src_out=END_SRC)]
out, v = [], 0.0
def fade(a, i, o):
    n = len(a); a = a.copy()
    if i: k = min(S(i), n); a[:k] *= np.linspace(0, 1, k)[:, None]
    if o: k = min(S(o), n); a[-k:] *= np.linspace(1, 0, k)[:, None]
    return a
for s in segs:
    s['video_in'] = round(v, 4)
    if 'silence' in s:
        a = np.zeros((S(s['silence']), 2), np.float32)
    else:
        a = fade(x[S(s['src_in']):S(s['src_out'])], 0.010, 0.8 if s['src_out'] == END_SRC else 0.012)
    out.append(a); v += len(a) / SR; s['video_out'] = round(v, 4)
# splice 2 -> 3: 12 ms equal-power crossfade at the bar line instead of the plain fades
music = np.concatenate(out)
DUR = len(music) / SR + 0.6
music = np.vstack([music, np.zeros((S(0.6), 2), np.float32)])
def src2v(t):
    for s in segs:
        if 'src_in' in s and s['src_in'] <= t <= s['src_out']: return round(s['video_in'] + t - s['src_in'], 4)
    raise ValueError(t)
# ---------------- timing map (video s) ----------------
V = lambda n: src2v(bar(n))
T = dict(fps=30, beat=BEAT, dur=round(DUR, 3))
T['bars'] = {str(n): V(n) for n in list(range(64, 96)) + list(range(136, 146)) if bar(n) < END_SRC}
silence_in, silence_out = segs[1]['video_in'], segs[1]['video_out']
T['duel'] = dict(threat=V(64), challenger=V(65), stakes=V(66), pickHim=V(67), pickHer=V(68), candle=V(69), winning=V(70),
                 riser=V(71), close=silence_in, calm=round(silence_in + 2 * BEAT, 4), strike=silence_out,
                 hit=src2v(110.667), pulses=[src2v(112.048), src2v(112.374)])
T['victory'] = dict(reveal=src2v(112.374), payout=src2v(114.776), pullStart=V(76), bridge=V(78), world=V(80))
T['act2'] = dict(start=V(80), entries=[V(80) + i * 2 * BEAT for i in range(16)], lock=V(86), candleOpen=V(87),
                 tension=V(88), accent=V(92), lastBar=V(95))
T['payoff'] = dict(close=V(136), hits=[src2v(t) for t in (199.332, 200.017, 200.69, 201.375, 202.06, 202.745, 203.43, 204.115)],
                   breath=src2v(204.44), finalSlam=src2v(bar(144)), stab=src2v(209.177))
T['segments'] = segs
json.dump(T, open('remotion/src/timing.json', 'w'), indent=1)
# ---------------- placeholder SFX (synthesised; every cue listed, all replaceable) ----------------
rng = np.random.default_rng(7)
sfx = np.zeros_like(music)
def put(t, a, g=1.0):
    i = S(t); a = a[:len(sfx) - i]; sfx[i:i + len(a)] += g * (a if a.ndim == 2 else np.repeat(a[:, None], 2, 1))
def env(n, att, dec): e = np.exp(-np.arange(n) / (dec * SR)); k = max(1, S(att)); e[:k] *= np.linspace(0, 1, k); return e
def thump(f0=55, dec=0.35):
    n = S(dec * 3); t = np.arange(n) / SR; f = f0 * (1 + 2.5 * np.exp(-t * 30))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, dec)
def noise(dec, lp=0.2):
    n = S(dec * 3); w = rng.standard_normal(n); y = np.zeros(n); a = 0
    for i in range(n): a += lp * (w[i] - a); y[i] = a
    return y * env(n, 0.003, dec) * 2
def whoosh(len_s, up=True):
    n = S(len_s); w = rng.standard_normal(n); c = np.linspace(0.02, 0.35, n) if up else np.linspace(0.35, 0.02, n)
    y = np.zeros(n); a = 0
    for i in range(n): a += c[i] * (w[i] - a); y[i] = a
    e = np.sin(np.linspace(0, np.pi, n)) ** 2; return y * e * 1.5
cues = []
def mixa(*xs):
    n = max(len(q) for q in xs); o = np.zeros(n)
    for q in xs: o[:len(q)] += q
    return o
def cue(name, t, a, g):
    put(t, a, g); cues.append(dict(cue=name, t=round(t, 3)))
d, vi, a2, p = T['duel'], T['victory'], T['act2'], T['payoff']
cue('lock UP (stamp)', d['pickHim'] + 0.02, mixa(thump(70, 0.12), noise(0.05, 0.5)), 0.5)
cue('lock DOWN (quiet stamp)', d['pickHer'] + 0.52, thump(80, 0.1), 0.3)
cue('strike whoosh', d['strike'] - 0.05, whoosh(0.3), 0.5)
cue('HIT', d['hit'], mixa(thump(45, 0.5), noise(0.25, 0.3)), 0.9)
cue('pullback air (rising)', vi['pullStart'], whoosh(vi['world'] - vi['pullStart'] + 0.3), 0.35)
for i, t in enumerate(a2['entries'][:12]): cue(f'entry chip {i+1}', t, mixa(noise(0.03, 0.8), thump(200, 0.04)), 0.18)
cue('picks lock (field 決)', a2['lock'], mixa(thump(60, 0.3), noise(0.1, 0.4)), 0.6)
cue('CLOSE (the clash)', p['close'], mixa(thump(40, 0.7), noise(0.4, 0.25)), 0.9)
cue('CALLED IT stamp', p['hits'][1], mixa(thump(65, 0.18), noise(0.06, 0.5)), 0.6)
cue('seal stamp (end card)', p['stab'], mixa(thump(60, 0.25), noise(0.08, 0.5)), 0.6)
sfx = np.clip(sfx, -1, 1).astype(np.float32)
def wav(name, a):
    p_ = f'audio/out/{name}.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s16le', p_], input=a.astype(np.float32).tobytes())
mix = music * 0.85 + sfx * 0.6
mix /= max(1.0, np.abs(mix).max() / 0.89)
wav('music', music); wav('sfx', sfx); wav('mix', mix)
json.dump(dict(source=SRC, bpm=176, beat_s=BEAT, sample_rate=SR, video_duration_s=round(DUR, 3), segments=segs,
               sfx_cues=cues, note='Preliminary edit built from objective analysis only; not auditioned by ear.'),
          open('audio/out/edl.json', 'w'), indent=1)
print('dur', DUR); print(json.dumps({k: T[k] for k in ('duel', 'victory', 'payoff')}, indent=0))
