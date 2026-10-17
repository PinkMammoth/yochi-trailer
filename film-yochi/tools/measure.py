# Measure a music track into the numbers src/core/music.js needs: BPM, first downbeat, hits,
# silences and loud sections. Prints a report; move the times into music.js by hand (the scenes only
# read music.js, so nothing else changes).
#   python3 tools/measure.py ../asset-pack/audio/yochi.wav
import sys, wave
import numpy as np

path = sys.argv[1]
with wave.open(path, 'rb') as w:
    sr, n, ch, sw = w.getframerate(), w.getnframes(), w.getnchannels(), w.getsampwidth()
    raw = w.readframes(n)
dt = {1: np.int8, 2: np.int16, 4: np.int32}[sw] if sw != 3 else None
if sw == 3:
    b = np.frombuffer(raw, np.uint8).reshape(-1, 3)
    x = (b[:, 0].astype(np.int32) | (b[:, 1].astype(np.int32) << 8) | (b[:, 2].astype(np.int32) << 16))
    x = np.where(x >= 1 << 23, x - (1 << 24), x).astype(np.float64) / (1 << 23)
else:
    x = np.frombuffer(raw, dt).astype(np.float64) / np.iinfo(dt).max
x = x.reshape(-1, ch).mean(axis=1)
dur = len(x) / sr
print(f'{path}: {dur:.3f} s, {sr} Hz, {ch} ch')

hop, win = 512, 2048
frames = 1 + (len(x) - win) // hop
idx = np.arange(win)[None, :] + hop * np.arange(frames)[:, None]
spec = np.abs(np.fft.rfft(x[idx] * np.hanning(win), axis=1))
ft = (np.arange(frames) * hop + win / 2) / sr
freqs = np.fft.rfftfreq(win, 1 / sr)
logs = np.log1p(spec * 10)
flux = np.maximum(0, np.diff(logs, axis=0, prepend=logs[:1])).sum(axis=1)
low = np.maximum(0, np.diff(logs[:, freqs < 150], axis=0, prepend=logs[:1, freqs < 150])).sum(axis=1)
rms = np.sqrt((x[idx] ** 2).mean(axis=1))
db = 20 * np.log10(rms + 1e-9)

# tempo from the autocorrelation of the onset envelope (60..180 BPM)
env = flux - np.convolve(flux, np.ones(16) / 16, 'same')
env = np.maximum(env, 0)
ac = np.correlate(env, env, 'full')[len(env) - 1:]
fps = sr / hop
lags = np.arange(len(ac)) / fps
ok = (lags > 60 / 180) & (lags < 60 / 60)
best = lags[ok][np.argmax(ac[ok])]
bpm = 60 / best
beat = best
# phase: the offset that puts the most onset energy on the beat grid
phases = np.linspace(0, beat, 200, endpoint=False)
score = [env[np.clip(((np.arange(0, dur, beat) + p) * fps).astype(int), 0, len(env) - 1)].sum() for p in phases]
t0 = phases[int(np.argmax(score))]
print(f'BPM ~ {bpm:.2f}  (beat {beat:.4f} s, bar {beat * 4:.4f} s), first beat ~ {t0:.3f} s')

# hits: strong onset peaks
thr = np.percentile(flux, 97)
peaks = [i for i in range(1, frames - 1) if flux[i] > thr and flux[i] >= flux[i - 1] and flux[i] >= flux[i + 1]]
print('\nhits (time, strength, low-end share):')
last = -1
for i in peaks:
    if ft[i] - last < 0.08: continue
    last = ft[i]
    print(f'  {ft[i]:7.3f}  {flux[i] / thr:5.2f}  {low[i] / (flux[i] + 1e-9):4.2f}')

# silences: stretches more than 30 dB under the loudest second
ref = np.percentile(db, 95)
quiet = db < ref - 30
print('\nsilences (>= 0.25 s):')
i = 0
while i < frames:
    if quiet[i]:
        j = i
        while j < frames and quiet[j]: j += 1
        if ft[j - 1] - ft[i] >= 0.25: print(f'  {ft[i]:7.3f} .. {ft[j - 1]:7.3f}')
        i = j
    else: i += 1

# loudness per bar, to find drops
print('\nloudness by bar (dB rel. peak):')
bar = beat * 4
b = t0
while b < dur:
    m = (ft >= b) & (ft < b + bar)
    if m.any(): print(f'  bar at {b:7.3f}: {db[m].mean() - ref:6.1f}')
    b += bar
