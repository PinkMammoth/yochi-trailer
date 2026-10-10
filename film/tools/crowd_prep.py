# Prepare the crowd art (asset-pack/characters/crowd: front, high and back sheets, seven hood types each)
# for the film's crowd renderer (src/elements/crowd.js).
#
# usage: python3 tools/crowd_prep.py            (from film/; writes assets/crowd/)
#        needs numpy, Pillow and opencv-python-headless
#
# For every type in every view this writes <view>-<type>.png (the plate, at most 256 px tall, its near-black
# cloth as painted) and <view>-<type>-trim.png (the cyan trim as light), and crowd.json with, per sprite:
#   w, h; cx, cy (the visor's centre, or for the back view the point the visor would be under); hw (half
#   the hood's width at that height, which the film maps to its head unit); vw, vh (the visor's size).
import json, os
import numpy as np, cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(HERE, '../../asset-pack/characters/crowd'))
OUT = os.path.normpath(os.path.join(HERE, '../assets/crowd'))
ORDER = {   # the sheets' layout, row by row
    'front': [['dome', 'cat', 'bear'], ['horns', 'frog', 'fin', 'antenna']],
    'high': [['dome', 'cat', 'bear'], ['horns', 'frog', 'fin', 'antenna']],
    'back': [['dome', 'cat', 'bear', 'horns'], ['frog', 'fin', 'antenna']],
}
MAXH = 256


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def emissive(a):
    R, G, B, A = a[..., 0], a[..., 1], a[..., 2], a[..., 3] / 255
    cy = np.minimum(G, B) - R
    w = smoothstep(0.6, 0.78, G / (B + 1))
    return np.clip((cy - 40) / 150, 0, 1) * w * A


meta = {}
os.makedirs(OUT, exist_ok=True)
for view, rows in ORDER.items():
    im = np.array(Image.open(os.path.join(SRC, view + '.webp')).convert('RGBA'))
    n, lab, st, _ = cv2.connectedComponentsWithStats((im[..., 3] > 30).astype(np.uint8), 8)
    comps = [i for i in range(1, n) if st[i][4] > 3000]
    mid = im.shape[0] * 0.5
    found = [sorted([i for i in comps if (st[i][1] + st[i][3] / 2 < mid) == (r == 0)], key=lambda i: st[i][0]) for r in range(2)]
    for r, names in enumerate(rows):
        assert len(found[r]) == len(names), (view, r, len(found[r]))
        for name, i in zip(names, found[r]):
            x, y, w, h = st[i][:4]
            # the part plus anything attached by a thin line (antenna stalks): keep the component, dilated
            keep = cv2.dilate((lab == i).astype(np.uint8), np.ones((7, 7), np.uint8))[y:y + h, x:x + w] > 0
            crop = im[y:y + h, x:x + w].copy()
            crop[..., 3] = np.where(keep, crop[..., 3], 0)
            crop[..., 3] = np.where(crop[..., 3] < 8, 0, crop[..., 3])
            a = crop.astype(np.float32)
            L = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])
            if view != 'back':
                # the visor: the big near-black glass in the middle of the hood
                dark = ((L < 26) & (a[..., 3] > 200)).astype(np.uint8)
                dark[: int(h * 0.12)] = 0
                dark[int(h * 0.75):] = 0
                dark = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
                m, vl, vs, vc = cv2.connectedComponentsWithStats(dark, 8)
                j = max(range(1, m), key=lambda k: vs[k][4] - abs(vc[k][0] - w / 2) * 20)
                vx, vy, vw, vh = vs[j][:4]
                cx, cy = vx + vw / 2, vy + vh / 2
            else:
                # behind: the visor would sit at the same height as in the front view, relative to the hood
                ys = np.nonzero(crop[..., 3].max(axis=1) > 100)[0]
                cx, cy, vw, vh = w / 2, ys.min() + h * 0.33, 0, 0
            row = crop[int(cy), :, 3] > 100
            xs = np.nonzero(row)[0]
            hw = (xs.max() - xs.min()) / 2
            if view == 'back':
                # the hood's widest point above the shoulders (ears and horns excluded: their rows are narrow)
                ys = np.nonzero(crop[..., 3].max(axis=1) > 100)[0]
                best = (0, 0, 0)
                for yy in range(int(ys.min() + h * 0.1), int(ys.min() + h * 0.4)):
                    q = np.nonzero(crop[yy, :, 3] > 100)[0]
                    if len(q) and q.max() - q.min() > best[0]: best = (q.max() - q.min(), (q.max() + q.min()) / 2, yy)
                hw, cx, cy = best[0] / 2, best[1], best[2]
            # the busts end mid-chest: fade their last stretch out, so a front row settles into the dark
            # instead of ending on a hard, flat edge
            ys = np.nonzero(crop[..., 3].max(axis=1) > 100)[0]
            yb = ys.max(); fade = (yb - np.arange(h)) / (0.2 * (yb - ys.min()))
            crop[..., 3] = (crop[..., 3] * np.clip(fade, 0, 1)[:, None] ** 1.5).astype(np.uint8)
            a = crop.astype(np.float32)
            E = emissive(a)
            col = a[..., :3] / np.maximum(1, a[..., :3].max(axis=2, keepdims=True)) * 255 * (E[..., None] > 0.004)
            trim = np.dstack([col, E * 255]).astype(np.uint8)
            k = min(1.0, MAXH / h)
            size = (max(1, round(w * k)), max(1, round(h * k)))
            key = f'{view}-{name}'
            Image.fromarray(crop).resize(size, Image.LANCZOS).save(os.path.join(OUT, key + '.png'), optimize=True)
            Image.fromarray(trim).resize(size, Image.LANCZOS).save(os.path.join(OUT, key + '-trim.png'), optimize=True)
            meta[key] = {'w': size[0], 'h': size[1], 'cx': round(float(cx) * k, 1), 'cy': round(float(cy) * k, 1), 'hw': round(float(hw) * k, 1),
                         'vw': round(float(vw) * k, 1), 'vh': round(float(vh) * k, 1)}
            print(key, meta[key])
json.dump(meta, open(os.path.join(OUT, 'crowd.json'), 'w'), indent=1)
