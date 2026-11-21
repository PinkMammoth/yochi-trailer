"""docs/music-map.png: the track's measured structure (top) and the edit with the film's beats (bottom)."""
import json, numpy as np
from PIL import Image, ImageDraw, ImageFont
a = json.load(open('audio/analysis.json')); T = json.load(open('remotion/src/timing.json'))
F = lambda s: ImageFont.truetype('../asset-pack/sumi/fonts/../fonts/YujiSyuku-Regular.ttf', s) if False else ImageFont.load_default(s)
W, H = 2400, 1180; im = Image.new('RGB', (W, H), (15, 13, 11)); d = ImageDraw.Draw(im)
dur = a['duration']; X = lambda s: 60 + (W - 120) * s / dur
bars = a['bars']; rms = np.array([b['rms'] for b in bars]); lo, hi = rms.min(), rms.max()
d.text((60, 14), 'SOURCE: Victory Stamp_dark_dnb.mp3 (213.4 s). Bar loudness (RMS) and sub energy per bar; 8-bar phrase lines. 176 BPM, bar = 1.364 s.', fill=(239, 231, 216), font=F(22))
for b in bars:
    h = 220 * (b['rms'] - lo) / (hi - lo); x0, x1 = X(b['t']), X(b['t'] + 1.3638) - 1
    d.rectangle([x0, 300 - h, x1, 300], fill=(239, 231, 216))
    s = max(0, (b['sub'] + 15) / 60) * 90; d.rectangle([x0, 400 - s, x1, 400], fill=(255, 84, 54))
d.text((8, 230), 'rms', fill=(163, 154, 138), font=F(18)); d.text((8, 360), 'sub', fill=(163, 154, 138), font=F(18))
SECT = [(0, 12.1, 'intro'), (12.1, 44.9, 'builds (4 phrases)'), (44.9, 66.7, 'DROP 1'), (66.7, 88.5, 'drop 1 cont.'), (88.5, 94.0, 'brk'),
        (94.0, 99.4, 'return'), (99.4, 110.3, 'groove + riser'), (110.3, 132.2, 'DROP 2'), (132.2, 143.1, 'lighter'), (143.1, 175.8, 'drop 2b'),
        (175.8, 186.7, 'DROP 3'), (186.7, 197.6, 'build'), (197.6, 208.5, 'OUTRO SLAM'), (208.5, 213.4, 'end')]
for i, (s0, s1, n) in enumerate(SECT):
    d.rectangle([X(s0), 420, X(s1) - 2, 460], fill=(34, 30, 26), outline=(80, 72, 64)); d.text((X(s0) + 4, 430), n, fill=(239, 231, 216), font=F(16))
for n in range(0, 145, 8):
    x = X(12.144 + n * 1.3638); d.line([x, 60, x, 462], fill=(60, 54, 48)); d.text((x + 2, 64), f'b{n}', fill=(120, 112, 100), font=F(14))
# used ranges
used = [(s['src_in'], s['src_out']) for s in T['segments'] if 'src_in' in s]
for s0, s1 in used: d.rectangle([X(s0), 468, X(s1), 480], fill=(61, 220, 132))
d.text((60, 484), 'green = source used by the edit (run 1 + run 2 continuous; run 3 after one splice)', fill=(61, 220, 132), font=F(18))
# ---- the edit
Y0 = 600; vd = T['dur']; VX = lambda s: 60 + (W - 120) * s / vd
d.text((60, Y0 - 50), f'THE EDIT: {vd:.2f} s. Run 1 src 99.43-110.40 | 3 silent beats | run 2 src 110.40-143.07 | SPLICE bar 96 -> bar 136 | run 3 src 197.62-212.0', fill=(239, 231, 216), font=F(22))
cols = [(120, 160, 255), (40, 40, 40), (255, 84, 54), (224, 178, 90)]
for i, s in enumerate(T['segments']):
    d.rectangle([VX(s['video_in']), Y0, VX(s['video_out']), Y0 + 60], fill=cols[i]); d.text((VX(s['video_in']) + 6, Y0 + 20), s['what'][:60], fill=(15, 13, 11) if i != 1 else (239, 231, 216), font=F(15))
ACTS = [(0, T['victory']['pullStart'], 'ACT I  THE DUEL'), (T['victory']['pullStart'], T['victory']['world'], 'ACT II  PULLBACK'),
        (T['victory']['world'], T['payoff']['close'], 'ACT III  FREE FOR ALL'), (T['payoff']['close'], vd, 'ACT IV  PAYOFF + END')]
for s0, s1, n in ACTS:
    d.rectangle([VX(s0), Y0 + 80, VX(s1) - 2, Y0 + 130], fill=(34, 30, 26), outline=(239, 231, 216)); d.text((VX(s0) + 6, Y0 + 95), n, fill=(239, 231, 216), font=F(20))
D, Vv, A2, P = T['duel'], T['victory'], T['act2'], T['payoff']
EV = [(D['pickHim'], 'UP'), (D['pickHer'], 'DOWN'), (D['candle'], 'candle'), (D['riser'], 'reversal'), (D['close'], 'SILENCE'), (D['hit'], 'HIT (drop 2)'),
      (Vv['reveal'], 'victory'), (Vv['payout'], '+19'), (Vv['pullStart'], 'pull'), (Vv['bridge'], 'bridge'), (Vv['world'], 'WORLD / flood'),
      (A2['entries'][10], 'mira in'), (A2['lock'], 'lock'), (A2['candleOpen'], '5m open'), (A2['tension'], 'lighter'), (A2['accent'], 'dip'),
      (A2['lastBar'], '0:01'), (P['close'], 'CLOSE (outro slam)'), (P['hits'][1], 'CALLED IT'), (P['hits'][6], 'splits the pool'), (P['breath'], 'breath'),
      (P['finalSlam'], 'final slam'), (P['stab'], 'SEAL')]
for i, (t, n) in enumerate(EV):
    x = VX(t); y = Y0 + 150 + (i % 4) * 34; d.line([x, Y0, x, y], fill=(255, 84, 54) if n.isupper() else (163, 154, 138)); d.text((x + 3, y), f'{t:.2f} {n}', fill=(239, 231, 216), font=F(16))
for s in range(0, int(vd) + 1, 5): d.text((VX(s) - 6, Y0 + 300), f'{s}s', fill=(163, 154, 138), font=F(16))
im.save('docs/music-map.png'); print('ok')
