"""Pullback test audio: an untouched excerpt of the owner's track (no edits inside it) and a separate placeholder SFX
stem. Source bars 75-82 (src 114.43 -> 124.0): the camera starts retreating on bar 76, arrives on bar 80 (the second
half of drop 2, where the arrangement opens up in the flagship edit) and lands on bar 81; the hold runs to bar 82.
Not auditioned. Writes audio/out/{music,sfx,mix}.wav and edl.json."""
import json, os, subprocess, numpy as np
SR = 48000; B0, BEAT = 12.144, 0.34095; BAR = 4 * BEAT
bar = lambda n: B0 + n * BAR
SRC = '../../last-candle-standing/v4/music-source/Victory Stamp_dark_dnb.mp3'
IN, OUT_ = bar(75), bar(82)
DUR = 7 * BAR + 1.36
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', SRC, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout
x = np.frombuffer(raw, np.float32).reshape(-1, 2)
S = lambda s: int(round(s * SR))
m = x[S(IN):S(IN) + S(DUR)].copy()
m[:S(0.01)] *= np.linspace(0, 1, S(0.01))[:, None]
tail = S(OUT_ - IN); m[tail:] *= np.linspace(1, 0, len(m) - tail)[:, None] ** 2   # a 1.36 s fade after bar 82's downbeat
rng = np.random.default_rng(5)
def lp(n, c):
    w = rng.standard_normal(n); y = np.zeros(n); a = 0.0
    for i in range(n): a += c[i] * (w[i] - a); y[i] = a
    return y
n = len(m); t = np.arange(n) / SR
c = np.interp(t, [0, BAR, 6 * BAR, DUR], [0.01, 0.02, 0.12, 0.03])
air = lp(n, c) * np.interp(t, [0, BAR, 5.5 * BAR, 7 * BAR, DUR], [0, 0.15, 0.6, 0.35, 0.2])  # wind opening up with the space
sfx = np.repeat(air[:, None], 2, 1).astype(np.float32) * 0.5
mix = m * 0.85 + sfx; mix /= max(1, np.abs(mix).max() / 0.89)
os.makedirs('audio/out', exist_ok=True)
for name, a in (('music', m), ('sfx', sfx), ('mix', mix)):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s16le', f'audio/out/{name}.wav'], input=a.astype(np.float32).tobytes())
json.dump(dict(source=SRC, src_in=round(IN, 4), src_bar82=round(OUT_, 4), duration=round(DUR, 4), edits='none inside the excerpt; 10 ms fade-in; fade after bar 82',
               picture=dict(retreat_starts='bar 76 (1.364 s)', world_opens='bar 80 (6.819 s)', lands='bar 81 (8.183 s)', hold='to 9.54 s'),
               sfx='placeholder wind bed only', auditioned=False), open('audio/out/edl.json', 'w'), indent=1)
print('ok', DUR)
