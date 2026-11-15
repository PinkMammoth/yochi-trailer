#!/usr/bin/env python3
"""Review sheets for the rendered film (needs ffmpeg, numpy, pillow).

  python3 tools/review.py contact <film.mp4> <out.jpg> [step_s]   timed contact sheet: a frame every step_s (0.25),
                                                                  labelled with time and the beat it belongs to
  python3 tools/review.py audio <mix.wav> <out.png>              waveform + spectrogram with every beat of the
                                                                  timing map marked (the sound can't be heard here,
                                                                  so this is how its placement is checked)
"""
import json, os, subprocess, sys, tempfile, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
T = json.load(open(os.path.join(HERE, '..', 'src', 'timing.json')))


def beats():
    """(time, label) for every authored beat"""
    out = []
    for k, v in T.items():
        if not isinstance(v, dict):
            continue
        for kk, vv in v.items():
            if isinstance(vv, (int, float)) and kk not in ('round', 'verdict', 'slam', 'grey') and not (k == 'montage' and kk == 'end'):
                out.append((vv if kk != 'start' else vv, f'{k}.{kk}'))
            elif isinstance(vv, list) and vv and isinstance(vv[0], (int, float)) and kk != 'rounds':
                out.append((vv[0], f'{k}.{kk}'))
    m = T['montage']
    for i, n in enumerate(m['rounds']):
        t0 = m['start'] + i * m['round']
        out += [(t0, f'R{n}'), (t0 + m['grey'], f'R{n} out')]
    return sorted(set(out))


SCENES = [('open', 0, T['open']['end']), ('round 1', T['round1']['start'], T['round1']['end']),
          ('montage', T['montage']['start'], T['montage']['end']), ('2 left', T['reset']['start'], T['reset']['end']),
          ('versus', T['versus']['start'], T['versus']['end']), ('YOU', T['cuYou']['start'], T['cuYou']['end']),
          ('deano', T['cuRival']['start'], T['cuRival']['end']), ('last candle', T['candle']['start'], T['candle']['end']),
          ('last one standing', T['hero']['start'], T['hero']['end']), ('end card', T['endcard']['start'], T['dur'])]


def scene_at(t):
    for name, a, b in SCENES:
        if a <= t < b:
            if name == 'montage':
                k = int((t - a) / T['montage']['round'])
                return f"montage R{T['montage']['rounds'][min(k, 4)]}"
            return name
    return ''


def font(sz):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', '/usr/share/fonts/dejavu/DejaVuSansMono.ttf']:
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()


def contact(mp4, out, step=0.25):
    tmp = tempfile.mkdtemp()
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', mp4, '-vf', f'fps=1/{step},scale=216:384', os.path.join(tmp, 'f%04d.png')], check=True)
    fs = sorted(os.listdir(tmp))
    cols = 12
    w, h = 216, 384
    rows = (len(fs) + cols - 1) // cols
    S = Image.new('RGB', (cols * w, rows * (h + 34)), '#222')
    d = ImageDraw.Draw(S)
    f = font(14)
    for i, fn in enumerate(fs):
        t = i * step
        x, y = (i % cols) * w, (i // cols) * (h + 34)
        S.paste(Image.open(os.path.join(tmp, fn)).convert('RGB'), (x, y + 34))
        d.text((x + 4, y + 2), f'{t:5.2f}s', fill='white', font=f)
        d.text((x + 4, y + 17), scene_at(t + 1e-3), fill='#ffb199', font=f)
    S.save(out, quality=85)
    print(out)


def audio(wav, out):
    w = wave.open(wav)
    sr = w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, w.getnchannels()).mean(1) / 32768
    dur = len(x) / sr
    W, Hw, Hs = 2400, 260, 300
    img = Image.new('RGB', (W, Hw + Hs + 140), '#111')
    d = ImageDraw.Draw(img)
    # waveform (peak per column) + RMS in dB
    per = len(x) // W
    for c in range(W):
        seg = x[c * per:(c + 1) * per]
        if not len(seg):
            continue
        pk = np.abs(seg).max()
        r = np.sqrt(np.mean(seg ** 2))
        d.line([(c, Hw / 2 - pk * Hw / 2), (c, Hw / 2 + pk * Hw / 2)], fill='#5a6b8c')
        d.line([(c, Hw / 2 - r * Hw / 2), (c, Hw / 2 + r * Hw / 2)], fill='#9fc3ff')
    # spectrogram (log frequency, 40 Hz - 16 kHz)
    n = 2048
    hop = max(1, (len(x) - n) // W)
    win = np.hanning(n)
    fr = np.fft.rfftfreq(n, 1 / sr)
    ys = np.geomspace(40, 16000, Hs)
    idx = np.searchsorted(fr, ys)
    spec = np.zeros((Hs, W))
    for c in range(W):
        seg = x[c * hop:c * hop + n]
        if len(seg) < n:
            break
        mag = np.abs(np.fft.rfft(seg * win))
        spec[:, c] = 20 * np.log10(mag[idx] + 1e-6)
    spec = np.clip((spec + 30) / 70, 0, 1)[::-1]
    sp = Image.fromarray((np.stack([spec ** 1.5, spec ** 0.8 * 0.9, spec ** 0.5 * 0.6], -1) * 255).astype('uint8'))
    img.paste(sp, (0, Hw))
    f = font(13)
    for t, lab in beats():
        px = int(t / dur * W)
        d.line([(px, 0), (px, Hw + Hs)], fill='#ff5436' if 'close' in lab or 'out' in lab or 'seal' in lab else '#777', width=1)
    lanes = [0, 0, 0, 0, 0]
    for t, lab in beats():
        px = int(t / dur * W)
        lane = min(range(5), key=lambda i: lanes[i])
        if lanes[lane] > px:
            lane = min(range(5), key=lambda i: lanes[i])
        d.text((px + 2, Hw + Hs + 4 + lane * 26), lab, fill='#ddd', font=f)
        lanes[lane] = px + 8 * len(lab) + 10
    for s in range(int(dur) + 1):
        px = int(s / dur * W)
        d.text((px + 2, 2), f'{s}s', fill='white', font=f)
    img.save(out)
    print(out)


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'contact':
        contact(sys.argv[2], sys.argv[3], float(sys.argv[4]) if len(sys.argv) > 4 else 0.25)
    else:
        audio(sys.argv[2], sys.argv[3])
