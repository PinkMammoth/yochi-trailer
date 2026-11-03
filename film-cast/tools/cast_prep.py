"""Packs the painted cast for the renderer.

For every card in asset-pack/sumi/avatars/cards (except the retired gunslinger), with its raw matte from
tools/cast_mask.py:
  assets/cast/<id>-fig.webp    the figure, cut out (RGBA), cropped to its bounds, inside the card frame
  assets/cast/<id>-plate.webp  the painting's own ground with the figure filled in (RGB), the far depth layer
  assets/cast/<id>-card.webp   the framed card at 768x1024, for grids and the card deal
  assets/cast/cast.json        per id: painting rect, figure rect (in painting px), head point, ink-disc colour
The painting rect is the card's inner area (frame, crest and corner ornaments removed). Overrides for the head
point and matte fixes live in tools/cast_overrides.json.
usage: python3 tools/cast_prep.py [id ...]
"""
import os, sys, json, glob
import numpy as np
import cv2
from PIL import Image

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.join(here, '..')
src = os.path.join(root, '..', 'asset-pack', 'sumi', 'avatars', 'cards')
raw = os.path.join(root, 'assets', 'cast', 'raw')
out = os.path.join(root, 'assets', 'cast')
ov_path = os.path.join(here, 'cast_overrides.json')
OV = json.load(open(ov_path)) if os.path.exists(ov_path) else {}

# Card inner area (all cards share the 1536x2048 layout; the frame sits at x 24-1511, y 100-2023).
X0, Y0, X1, Y1 = 72, 150, 1464, 1978
CORNER = 120          # ornament squares cleared at each inner corner
CREST = (668, 868)    # x range of the top and bottom centre crests

def pushpull(img, w):
    """Fill where w==0 from the known pixels: mask-weighted pyramid down, then composite back up."""
    levels = []
    c, ww = img * w[..., None], w.copy()
    while min(ww.shape) > 4:
        levels.append((c, ww))
        c = cv2.resize(cv2.GaussianBlur(c, (5, 5), 0), (max(1, c.shape[1] // 2), max(1, c.shape[0] // 2)), interpolation=cv2.INTER_AREA)
        ww = cv2.resize(cv2.GaussianBlur(ww, (5, 5), 0), (c.shape[1], c.shape[0]), interpolation=cv2.INTER_AREA)
    est = c / np.maximum(ww, 1e-6)[..., None]
    for c, ww in reversed(levels):
        up = cv2.resize(est, (c.shape[1], c.shape[0]), interpolation=cv2.INTER_LINEAR)
        up = cv2.GaussianBlur(up, (9, 9), 0)
        known = c / np.maximum(ww, 1e-6)[..., None]
        a = np.clip(ww * 1.6, 0, 1)[..., None]
        est = known * a + up * (1 - a)
    return est

def prep(n):
    card = np.array(Image.open(os.path.join(src, n + '.webp')).convert('RGB'))
    m = np.array(Image.open(os.path.join(raw, n + '.png')).convert('L')).astype(np.float32) / 255
    o = OV.get(n, {})
    keep = np.zeros_like(m)
    keep[Y0:Y1, X0:X1] = 1
    for (cx, cy) in [(X0, Y0), (X1 - CORNER, Y0), (X0, Y1 - CORNER), (X1 - CORNER, Y1 - CORNER)]:
        keep[cy:cy + CORNER, cx:cx + CORNER] = 0
    keep[Y0:Y0 + 60, CREST[0]:CREST[1]] = 0
    m = m * keep
    # clean: drop small islands, gently close holes
    hard = (m > 0.5).astype(np.uint8)
    k, lab, stats, _ = cv2.connectedComponentsWithStats(hard, 8)
    if k > 1:
        big = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        minA = stats[big, cv2.CC_STAT_AREA] * o.get('islands', 0.02)
        for i in range(1, k):
            if stats[i, cv2.CC_STAT_AREA] < minA:
                m[lab == i] = 0
    m = np.clip(m, 0, 1)
    # painting-space arrays
    P = card[Y0:Y1, X0:X1]
    A = m[Y0:Y1, X0:X1]
    H, W = A.shape
    ys, xs = np.where(A > 0.04)
    fx0, fx1, fy0, fy1 = int(xs.min()), int(xs.max()) + 1, int(ys.min()), int(ys.max()) + 1
    fig = np.dstack([P, (A * 255).astype(np.uint8)])[fy0:fy1, fx0:fx1]
    Image.fromarray(fig, 'RGBA').save(os.path.join(out, n + '-fig.webp'), quality=90, method=5)
    # plate: fill the figure (dilated), the frame's corner ornaments and the crests with a mask-weighted
    # push-pull fill (soft colour, no streaks), the far layer for parallax
    hole = (A > 0.03).astype(np.uint8)
    hole = cv2.dilate(hole, np.ones((25, 25), np.uint8))
    for (cx, cy) in [(0, 0), (W - CORNER, 0), (0, H - CORNER), (W - CORNER, H - CORNER)]:
        hole[cy:cy + CORNER, cx:cx + CORNER] = 1
    hole[:70, CREST[0] - X0:CREST[1] - X0] = 1; hole[H - 70:, CREST[0] - X0:CREST[1] - X0] = 1
    plate = pushpull(P.astype(np.float32), 1 - hole.astype(np.float32))
    plate = cv2.resize(plate, (int(W * 0.75), int(H * 0.75)), interpolation=cv2.INTER_AREA)
    Image.fromarray(np.clip(plate, 0, 255).astype(np.uint8)).save(os.path.join(out, n + '-plate.webp'), quality=84, method=5)
    # the framed card, half size, for grids and the deal
    Image.open(os.path.join(src, n + '.webp')).convert('RGBA').resize((768, 1024), Image.LANCZOS).save(
        os.path.join(out, n + '-card.webp'), quality=88, method=5)
    # head: centroid of the top band of the figure (overridable)
    band = A[fy0:fy0 + int((fy1 - fy0) * 0.2), fx0:fx1]
    by, bx = np.where(band > 0.5)
    head = [float(fx0 + bx.mean()), float(fy0 + by.mean() + (fy1 - fy0) * 0.05)]
    if 'head' in o: head = o['head']
    # ink-disc colour: the most saturated common colour of the background
    bg = P[A < 0.02].reshape(-1, 3).astype(np.float32)
    hsv = cv2.cvtColor(bg.reshape(-1, 1, 3).astype(np.uint8), cv2.COLOR_RGB2HSV).reshape(-1, 3)
    sat = bg[(hsv[:, 1] > 60) & (hsv[:, 2] > 40)]
    ink = (np.median(sat, 0) if len(sat) > 500 else np.median(bg, 0)).tolist()
    if 'ink' in o: ink = o['ink']
    return {
        'paint': [W, H], 'fig': [fx0, fy0, fx1 - fx0, fy1 - fy0],
        'head': [round(head[0], 1), round(head[1], 1)], 'ink': [int(c) for c in ink],
        'plateScale': 0.75,
    }

if __name__ == '__main__':
    ids = sys.argv[1:] or sorted(os.path.splitext(os.path.basename(f))[0] for f in glob.glob(os.path.join(raw, '*.png')))
    ids = [i for i in ids if i != 'gunslinger']
    jp = os.path.join(out, 'cast.json')
    data = json.load(open(jp)) if os.path.exists(jp) else {}
    for n in ids:
        data[n] = prep(n)
        print(n, data[n])
    json.dump(dict(sorted(data.items())), open(jp, 'w'), indent=1)
