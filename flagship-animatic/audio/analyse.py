"""Objective structural analysis of the owner's track (no listening involved).
Writes audio/analysis.json and docs/music-map.png. Beat grid from the earlier BR V2 measurement:
176 BPM, beat 0.34095 s, beat n at 12.144 + n*0.34095 (re-verified here by onset autocorrelation)."""
import json, sys, numpy as np, librosa
from PIL import Image, ImageDraw, ImageFont
SRC = '../last-candle-standing/v4/music-source/Victory Stamp_dark_dnb.mp3'
y, sr = librosa.load(SRC, sr=22050, mono=True)
dur = len(y) / sr
hop = 256
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
t = librosa.frames_to_time(np.arange(S.shape[1]), sr=sr, hop_length=hop)
def band(lo, hi): return (S[(freqs >= lo) & (freqs < hi)] ** 2).sum(0)
sub, low, mid, high = band(20, 90), band(90, 300), band(300, 3000), band(3000, 11000)
rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=hop)[0]
onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
# beat grid check: phase of onsets against the grid
B0, BEAT = 12.144, 0.34095
on_t = librosa.onset.onset_detect(onset_envelope=onset, sr=sr, hop_length=hop, units='time')
ph = ((on_t[(on_t > 12) & (on_t < 200)] - B0) / BEAT) % 1
hist = np.histogram(ph, bins=8, range=(0, 1))[0].tolist()
tempo = librosa.feature.tempo(onset_envelope=onset[int(15*sr/hop):int(200*sr/hop)], sr=sr, hop_length=hop)[0]
BAR = 4 * BEAT
nb = int((dur - B0) // BAR)
def db(x): return float(10 * np.log10(x + 1e-12))
bars = []
for i in range(-int(B0 // BAR), nb):
    a, b = B0 + i * BAR, B0 + (i + 1) * BAR
    m = (t >= a) & (t < b)
    if m.sum() == 0: continue
    bars.append(dict(bar=i, t=round(a, 3), rms=db((rms[m] ** 2).mean()), sub=db(sub[m].mean()), low=db(low[m].mean()),
                     mid=db(mid[m].mean()), high=db(high[m].mean()), flux=float(onset[m].mean()), peak=float(onset[m].max())))
# novelty: bar-to-bar change of the band profile
P = np.array([[b['sub'], b['low'], b['mid'], b['high'], b['rms']] for b in bars])
nov = np.r_[0, np.linalg.norm(np.diff(P, axis=0), axis=1)]
for b, n in zip(bars, nov): b['novelty'] = float(n)
# silences (rms below -45 dB for >= 60 ms)
r_db = 20 * np.log10(rms + 1e-9)
quiet = r_db < r_db.max() - 40
sil, s0 = [], None
for k, q in enumerate(quiet):
    if q and s0 is None: s0 = k
    if not q and s0 is not None:
        if (k - s0) * hop / sr >= 0.06: sil.append([round(t[s0], 3), round(t[k], 3)])
        s0 = None
# strongest single hits (onset peaks) per 8-bar phrase
peaks = librosa.util.peak_pick(onset, pre_max=20, post_max=20, pre_avg=40, post_avg=40, delta=onset.std() * 1.5, wait=40)
hits = sorted([(float(onset[p]), round(float(t[p]), 3)) for p in peaks], reverse=True)[:40]
out = dict(source=SRC, duration=round(dur, 3), tempo_estimate=float(tempo), grid=dict(b0=B0, beat=BEAT, bar=BAR),
           onset_phase_hist=hist, silences=sil, top_hits=[h[1] for h in sorted(hits, key=lambda h: h[1])], bars=bars)
json.dump(out, open('audio/analysis.json', 'w'), indent=1)
# ---- picture: energy per bar, bands, novelty
W, H = 2400, 900
im = Image.new('RGB', (W, H), (15, 13, 11)); d = ImageDraw.Draw(im)
x = lambda s: 60 + (W - 120) * s / dur
def lane(key, y0, h, col, lo=None, hi=None):
    v = np.array([b[key] for b in bars]); lo = v.min() if lo is None else lo; hi = v.max() if hi is None else hi
    for b, vv in zip(bars, v):
        hh = h * (vv - lo) / (hi - lo + 1e-9)
        d.rectangle([x(b['t']), y0 + h - hh, x(b['t'] + BAR) - 1, y0 + h], fill=col)
    d.text((8, y0), key, fill=(239, 231, 216))
lane('rms', 40, 150, (239, 231, 216)); lane('sub', 210, 120, (255, 84, 54)); lane('low', 350, 100, (224, 178, 90))
lane('mid', 470, 100, (61, 220, 132)); lane('high', 590, 100, (120, 160, 255)); lane('novelty', 710, 100, (163, 154, 138))
for s in range(0, int(dur), 10):
    d.line([x(s), 820, x(s), 835], fill=(239, 231, 216)); d.text((x(s) - 8, 840), f'{s}', fill=(239, 231, 216))
for i in range(0, nb, 8):
    d.line([x(B0 + i * BAR), 30, x(B0 + i * BAR), 815], fill=(80, 72, 64))
for a, b in sil: d.rectangle([x(a), 30, x(b) + 1, 815], outline=(255, 77, 109))
im.save('docs/music-map-raw.png')
print(json.dumps(dict(dur=dur, tempo=float(tempo), phase=hist, silences=sil, hits=out['top_hits']), indent=0))
