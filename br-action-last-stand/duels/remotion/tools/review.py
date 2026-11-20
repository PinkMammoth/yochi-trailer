#!/usr/bin/env python3
"""Review tools for THE LAST STAND (ffmpeg, numpy, pillow).

  python3 tools/review.py qc <film.mp4>                       every frame: flags blank / near-solid frames and
                                                              single-frame dropouts that aren't authored
  python3 tools/review.py contact <film.mp4> <out.jpg> [step] timed contact sheet, a frame every `step` s (0.25),
                                                              each labelled with its time, frame and beat
  python3 tools/review.py audio <mix.wav> <out.png>           waveform + onset strength of the mix with every
                                                              timing-map event marked (sync check without listening)
"""
import json, os, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
T = json.load(open(os.path.join(HERE, '..', 'src', 'timing.json')))
FPS = T['fps']
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
font = lambda s: ImageFont.truetype(FONT, s) if os.path.exists(FONT) else ImageFont.load_default()
CALM = 8.55
SCENES = [('threat', T['threat']['start']), ('challenger', T['challenger']['start']), ('his pick', T['pickHim']['start']), ('her pick', T['pickHer']['start']),
          ('the candle', T['candle']['start']), ('his way', T['winning']['start']), ('reversal', T['reversal']['start']), ('last grin', T['lastGrin']['start']),
          ('DISBELIEF (silence)', T['disbelief']['start']), ('her eyes (silence)', CALM), ('lunge', T['strike']['start']), ('the strike', T['strike']['wide']),
          ('HIT', T['strike']['hit']), ('knockback', T['strike']['hit'] + T['impact']['hitStop']), ('finale', T['finale']['start'])]
EVENTS = [(T['challenger']['vs'], 'vs seal'), (T['pickHim']['lock'], 'UP lock'), (T['pickHer']['lock'], 'DOWN lock'), (T['candle']['start'], 'candle opens'),
          (T['reversal']['start'], 'reversal'), (T['reversal']['cross'], 'crosses strike'), (T['close'], 'CLOSE + silence'), (T['strike']['start'], 'silence ends'),
          (T['strike']['wide'], 'stroke launches'), (T['strike']['hit'], 'HIT'), (T['finale']['win'], 'final hit / win'), (T['finale']['brand'], 'seal'),
          (T['finale']['dryEnd'], 'ring-out')] + [(q, 'hit') for q in T['impact']['pulses']]
AUTHORED = {round(T['strike']['hit'] * FPS) + k for k in range(3)}  # paper flash + 2 ink-negative frames


def scene_at(t):
    name = SCENES[0][0]
    for n, s in SCENES:
        if t + 1e-6 >= s:
            name = n
    return name


def frames(path, w=192, h=108):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3).astype(np.float32)


def qc(path):
    F = frames(path)
    bad = []
    for i, fr in enumerate(F):
        sd = fr.std()
        d_prev = np.abs(fr - F[i - 1]).mean() if i else 0
        d_next = np.abs(fr - F[i + 1]).mean() if i + 1 < len(F) else 0
        d_skip = np.abs(F[i - 1] - F[i + 1]).mean() if 0 < i < len(F) - 1 else 99
        solid = sd < 6
        # a lone frame far from both neighbours that are close to each other (also catches a dropout inside a moving shot)
        dropout = d_prev > 25 and d_next > 25 and d_skip < max(8, 0.4 * min(d_prev, d_next))
        if (solid or dropout) and i not in AUTHORED:
            bad.append((i, round(i / FPS, 3), 'solid' if solid else 'dropout', round(float(sd), 1)))
    print(f'{len(F)} frames; authored flash/ink frames {sorted(AUTHORED)}; flagged: {bad if bad else "none"}')
    return bad


def contact(path, out, step=0.25):
    times = np.arange(0, T['dur'] - 1e-6, step)
    pr = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path], capture_output=True, text=True).stdout.strip().split(',')
    port = int(pr[1]) > int(pr[0])
    cols, tw, th = (8, 270, 480) if port else (4, 480, 270)
    rows = int(np.ceil(len(times) / cols))
    sheet = Image.new('RGB', (cols * tw, 70 + rows * (th + 34)), '#f2ece0')
    d = ImageDraw.Draw(sheet)
    d.text((16, 14), 'YOCHI DUELS · THE LAST STAND · %s · 60 fps · contact sheet, one frame every %.2f s (exact frames)' % (os.path.basename(path), step), fill='#16130f', font=font(22))
    d.text((16, 42), 'music: Victory Stamp_dark_dnb.mp3 from %.3f s, 2 silent beats inserted at %.3f, ends on %.3f + ring-out · HIT = drop 2 big hit at %.3f s' % (T['src']['in'], T['src']['insertAt'], T['src']['final'], T['strike']['hit']), fill='#5d5548', font=font(16))
    for k, t in enumerate(times):
        f = int(round(t * FPS))
        img = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-vf', f'select=eq(n\\,{f}),scale={tw}:{th}', '-vframes', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
        im = Image.frombytes('RGB', (tw, th), img)
        x, y = (k % cols) * tw, 70 + (k // cols) * (th + 34)
        sheet.paste(im, (x, y + 30))
        ev = [n for et, n in EVENTS if abs(et - t) < step / 2 and et <= t + step / 2]
        d.text((x + 6, y + 6), f'{t:5.2f}s  f{f:03d}  {scene_at(t)}' + (f'  · {ev[0]}' if ev else ''), fill='#16130f', font=font(16))
    sheet.save(out, quality=88)
    print(out)


def audio(wav, out):
    with wave.open(wav) as w:
        sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, 2).mean(1) / 32768
    W, H = 2400, 640
    im = Image.new('RGB', (W, H), '#0f0d0b'); d = ImageDraw.Draw(im)
    dur = len(x) / sr; px = lambda t: int(60 + (W - 120) * t / dur)
    hop = int(sr / 200); n = len(x) // hop
    env = np.array([np.abs(x[i * hop:(i + 1) * hop]).max() for i in range(n)])
    lo = np.array([np.sqrt(np.mean(np.diff(x[i * hop:(i + 1) * hop]) ** 2)) for i in range(n)])
    flux = np.maximum(0, np.diff(np.log(env + 1e-4), prepend=0))
    for i in range(n):
        t = i * hop / sr; X = px(t)
        a = env[i]; d.line([(X, 230 - a * 170), (X, 230 + a * 170)], fill='#a39a8a')
        d.line([(X, 560), (X, 560 - min(1, flux[i] / 2.5) * 140)], fill='#3ddc84')
    b = 0
    while T['beat'] * b < dur:
        d.line([(px(T['beat'] * b + (T['strike']['hit'] % T['beat'])), 410), (px(T['beat'] * b + (T['strike']['hit'] % T['beat'])), 420)], fill='#5d5548'); b += 1
    for et, name in EVENTS:
        X = px(et); d.line([(X, 40), (X, 600)], fill='#ff5436', width=2); d.text((X + 4, 44 + (EVENTS.index((et, name)) % 4) * 18), name, fill='#efe7d8', font=font(15))
    for s in range(int(dur) + 1):
        d.text((px(s) - 6, 612), f'{s}s', fill='#a39a8a', font=font(14))
    d.text((60, 400), 'waveform (grey) · onset flux (green) · timing-map events (vermilion) · beat grid ticks', fill='#a39a8a', font=font(15))
    im.save(out); print(out)


if __name__ == '__main__':
    cmd = sys.argv[1]
    {'qc': lambda: qc(sys.argv[2]), 'contact': lambda: contact(sys.argv[2], sys.argv[3], float(sys.argv[4]) if len(sys.argv) > 4 else 0.25),
     'audio': lambda: audio(sys.argv[2], sys.argv[3])}[cmd]()
