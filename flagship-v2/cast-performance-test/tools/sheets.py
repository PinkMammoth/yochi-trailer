#!/usr/bin/env python3
"""Review sheets for the cast performance tests.
usage: python3 tools/sheets.py [study_dir]
  study_dir (optional): fixed-camera frame renders from remotion/tools/frames.mjs:
    un-fixed-fNNNN.png (Untouchable, camera locked) and hr-fixed-fNNNN.png (High Roller, camera locked)
Writes deliverables/:
  <cut>-contact.jpg                    every cut, timed contact sheet
  cold-blooded-cut-frames.jpg          every frame through the cut on the gesture (cinematic)
  untouchable-motion-map.jpg           what moves: per-pixel temporal deviation over 1 s at a locked camera, over the
                                       frame; plus the body/face/sword/moon statistics (they must be zero)
  untouchable-ribbon-strip.jpg         one ribbon region, consecutive frames at a locked camera
  high-roller-chip-paths.jpg           the six chips' paths (a min-composite of a locked-camera sequence)
  cast-source-vs-shot.jpg              each supplied painting beside its shot
"""
import glob, json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageDraw, ImageFont

H = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); DL = f'{H}/deliverables'
STUDY = sys.argv[1] if len(sys.argv) > 1 else None
INK, PAPER = (22, 19, 15), (242, 236, 224)
def font(s):
    try: return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', s)
    except OSError: return ImageFont.load_default()
def frames(mp4):
    d = tempfile.mkdtemp(); subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, f'{d}/%04d.png'], check=True); return d, len(os.listdir(d))
def fr(d, i): return Image.open(f'{d}/{i + 1:04d}.png').convert('RGB')
def grid(tiles, cols, tw, th, title, caps=None, pad=6, top=64, cap_h=24):
    rows = (len(tiles) + cols - 1) // cols
    S = Image.new('RGB', (cols * (tw + pad) + pad, top + rows * (th + cap_h + pad) + pad), PAPER); dr = ImageDraw.Draw(S)
    dr.text((pad + 4, 16), title, fill=INK, font=font(28))
    for i, im in enumerate(tiles):
        x = pad + (i % cols) * (tw + pad); y = top + (i // cols) * (th + cap_h + pad)
        S.paste(im.resize((tw, th), Image.LANCZOS), (x, y))
        if caps: dr.text((x + 2, y + th + 3), caps[i], fill=INK, font=font(16))
    return S
def label(im, text, s=24):
    im = im.copy(); dr = ImageDraw.Draw(im); dr.rectangle([0, 0, im.width, s + 12], fill=INK); dr.text((8, 5), text, fill=PAPER, font=font(s)); return im

CUTS = [('untouchable-cinematic', 'UNTOUCHABLE · cinematic', 0.1), ('untouchable-trailer', 'UNTOUCHABLE · trailer (6 beats)', 0.05),
        ('untouchable-rigid-ab', 'UNTOUCHABLE · A/B: ribbons held rigid', 0.2),
        ('high-roller-cinematic', 'HIGH ROLLER · cinematic', 0.1), ('high-roller-trailer', 'HIGH ROLLER · trailer (4 beats)', 0.05),
        ('cold-blooded-cinematic', 'COLD BLOODED · cinematic (cut on the gesture)', 0.1), ('cold-blooded-single-painting', 'COLD BLOODED · the new painting alone', 0.1),
        ('cold-blooded-trailer', 'COLD BLOODED · trailer (6 beats)', 0.05)]
cache = {}
for name, title, step in CUTS:
    mp4 = f'{DL}/{name}.mp4'
    if not os.path.exists(mp4): continue
    d, n = frames(mp4); cache[name] = (d, n)
    idx = list(range(0, n, max(1, round(step * 60))))
    grid([fr(d, i) for i in idx], 8, 300, 169, f'{title} ({n / 60:.2f} s) · every {step} s', [f'{i / 60:.2f}s f{i}' for i in idx]).save(f'{DL}/{name}-contact.jpg', quality=84)

if 'cold-blooded-cinematic' in cache:
    d, n = cache['cold-blooded-cinematic']; cutf = round(2.05 * 60)
    idx = list(range(cutf - 6, cutf + 12))
    grid([fr(d, i) for i in idx], 6, 400, 225, 'COLD BLOODED · every frame through the cut on the gesture (v2 card -> new painting)',
         [f'f{i} {"card" if i < cutf else "new"}' for i in idx]).save(f'{DL}/cold-blooded-cut-frames.jpg', quality=86)

# side by side: the paintings and their shots
src = [('untouchable-win.webp', 'untouchable-cinematic', 430), ('high-roller-win.webp', 'high-roller-cinematic', 200), ('cold-blooded-defeat.webp', 'cold-blooded-cinematic', 330)]
rows = []
for f, cut, fi in src:
    if cut not in cache: continue
    a = Image.open(f'{H}/assets/source/{f}').convert('RGB'); a = a.resize((round(a.width * 540 / a.height), 540))
    b = fr(*[cache[cut][0]], fi).resize((960, 540))
    r = Image.new('RGB', (a.width + 980, 540), PAPER); r.paste(label(a, 'as painted'), (0, 0)); r.paste(label(b, f'in shot, {fi / 60:.2f} s'), (a.width + 20, 0)); rows.append(r)
if rows:
    W = max(r.width for r in rows); S = Image.new('RGB', (W, sum(r.height + 16 for r in rows)), PAPER); y = 0
    for r in rows: S.paste(r, (0, y)); y += r.height + 16
    S.save(f'{DL}/cast-source-vs-shot.jpg', quality=86)

if STUDY:
    un = sorted(glob.glob(f'{STUDY}/un-fixed-f*.png'))
    if un:
        A = np.stack([np.asarray(Image.open(p).convert('L'), np.float32) for p in un])
        sd = A.std(axis=0)
        base = np.asarray(Image.open(un[0]).convert('RGB'), np.float32) * 0.45
        heat = np.clip(sd / 12, 0, 1)
        vis = base.copy(); vis[..., 0] += heat * 255; vis[..., 1] += heat * 60
        meta = json.load(open(f'{H}/assets/derived/layers/un.json'))
        im = label(Image.fromarray(vis.clip(0, 255).astype(np.uint8)), f'UNTOUCHABLE · what moves (locked camera, {len(un)} frames over 1 s): red = temporal deviation of luminance')
        # region statistics in screen px (locked camera: canvas -> screen = x 1080/1536, painting at painting_at)
        s = 1080 / meta['canvas'][1]; ox = meta['painting_at'][0] * s
        def box(x0, y0, x1, y1): return sd[int(y0 * s):int(y1 * s), int(ox + x0 * s):int(ox + x1 * s)]
        stats = {'face and blindfold': box(470, 90, 610, 230), 'torso': box(420, 260, 640, 520), 'hands on the sword': box(420, 430, 640, 560),
                 'sword (mid blade)': box(700, 760, 820, 900), 'moon': box(660, 60, 900, 300), 'free ribbons, left': box(0, 150, 260, 600), 'hem tatters, lower left': box(60, 900, 330, 1300)}
        dr = ImageDraw.Draw(im); y = 60
        for k, v in stats.items():
            dr.text((20, y), f'{k:28s} mean {v.mean():5.2f}  p99 {np.percentile(v, 99):5.2f}', fill=(255, 255, 255), font=font(22)); y += 28
        im.save(f'{DL}/untouchable-motion-map.jpg', quality=86)
        crop = (int(ox + 0 * s) - 60, int(120 * s), int(ox + 330 * s), int(640 * s))
        tiles = [Image.open(p).convert('RGB').crop(crop) for p in un[::2]]
        grid(tiles, len(tiles), 260, round(260 * (crop[3] - crop[1]) / (crop[2] - crop[0])), 'UNTOUCHABLE · the left ribbons, every 2nd frame (locked camera)',
             [os.path.basename(p)[-9:-4] for p in un[::2]]).save(f'{DL}/untouchable-ribbon-strip.jpg', quality=86)
    hr = sorted(glob.glob(f'{STUDY}/hr-fixed-f*.png'))
    if hr:
        A = np.stack([np.asarray(Image.open(p).convert('RGB'), np.float32) for p in hr])
        comp = A.min(axis=0)  # dark chips leave their path
        im = label(Image.fromarray(np.minimum(comp, A[-1]).astype(np.uint8)), f'HIGH ROLLER · the chips\' paths (locked camera, {len(hr)} frames, darkest-pixel composite)')
        im.save(f'{DL}/high-roller-chip-paths.jpg', quality=86)
print('sheets written')
