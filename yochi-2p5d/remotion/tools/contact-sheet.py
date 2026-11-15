#!/usr/bin/env python3
"""Timed contact sheet for a 9:16 film: one frame every --step seconds, labelled with its time and beat.

usage: python3 tools/contact-sheet.py new-challenger|swap-tax <film.mp4> <out.jpg> [--step 0.25] [--title "..."]
Beat names come from BEATS below (keyed to each film's timing.json), so the sheet reads like the cut list.
"""
import json, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, '..', '..', '..', 'asset-pack', 'sumi', 'fonts')


def beats(film):
    T = json.load(open(os.path.join(HERE, '..', 'src', 'films', film, 'timing.json')))
    if film == 'new-challenger':
        return [(0, 'select: HYPEREVM'), (T['select']['lock'], '1P locks (kettei seal)'), (T['alarm']['flicker'], 'flicker, alarm'),
                (T['alarm']['slams'][0], 'NEW CHALLENGER APPROACHING'), (T['alarm']['black'], 'dark'),
                (T['reveal']['start'], 'emerges: beam'), (T['reveal']['lift'][0], 'the dark recedes'),
                (T['reveal']['hit'], 'ELYSIUM, gust'), (T['two']['start'], 'drop: two-shot'), (T['two']['seal'], 'seal, caption')]
    return [(0, 'arrival'), (T['g1'], 'G1 SWAP TO USDC.'), (T['comply']['start'], 'complies, the fee'), (T['g2'], 'G2 APPROVE SPENDING.'),
            (T['g3'], 'G3 the scroll'), (T['freeze']['start'], 'freeze, push to eyes'), (T['silence'][0], 'silence'),
            (T['draw']['start'], 'the hilt'), (T['draw']['whip'][0], 'the blade'), (T['strike']['hit'], 'SLASH'),
            (T['strike']['hit'] + T['strike']['hitStop'], 'swept away'), (T['doors'][0], 'doors open'),
            (T['lines'][0], 'SKIP THE SWAP.'), (T['lines'][1], 'SKIP THE APPROVAL.'), (T['lines'][2], 'JUST HYPE.'), (T['seal'], 'seal, caption')]


def main():
    film, mp4, out = sys.argv[1:4]
    step = float(sys.argv[sys.argv.index('--step') + 1]) if '--step' in sys.argv else 0.25
    title = sys.argv[sys.argv.index('--title') + 1] if '--title' in sys.argv else film
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4], capture_output=True, text=True).stdout)
    B = beats(film)
    times = [round(i * step, 3) for i in range(int(dur / step + 1e-6))]
    tw, th = 216, 384
    cols = 8
    rows = (len(times) + cols - 1) // cols
    pad, lab, top = 10, 34, 70
    sheet = Image.new('RGB', (cols * (tw + pad) + pad, top + rows * (th + lab + pad) + pad), (15, 13, 11))
    d = ImageDraw.Draw(sheet)
    try:
        fT = ImageFont.truetype(os.path.join(HERE, 'fonts', 'DelaGothicOne-Regular.ttf'), 34)
    except OSError:
        fT = ImageFont.load_default(size=30)
    fL = ImageFont.load_default(size=15)
    d.text((pad, 18), f'{title}  ·  one frame every {step:g} s  ·  1080x1920 60 fps', fill=(239, 231, 216), font=fT)
    with tempfile.TemporaryDirectory() as tmp:
        for i, t in enumerate(times):
            p = os.path.join(tmp, f'{i}.png')
            subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t + 1 / 120:.4f}', '-i', mp4, '-frames:v', '1', '-vf', f'scale={tw}:{th}', p], check=True)
            im = Image.open(p).convert('RGB')
            x = pad + (i % cols) * (tw + pad)
            y = top + (i // cols) * (th + lab + pad)
            name = [n for (bt, n) in B if bt <= t + 1e-6][-1][:24]
            d.text((x, y + 2), f'{t:5.2f}s  {name}', fill=(163, 154, 138), font=fL)
            sheet.paste(im, (x, y + lab - 12))
    sheet.save(out, quality=88)
    print(out, sheet.size)


if __name__ == '__main__':
    main()
