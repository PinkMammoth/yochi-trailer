"""Cut the official Elysium roundel out of its dark square (asset-pack/kinetiq-elysium.jpeg, 400x400 JPEG).

The mark's own dark arcs are the same colour as the ground, so no colour key: fit the white ring's outer edge
and cut an analytic, anti-aliased circle a hair inside it. Nothing inside the circle is touched.
Upsampled 4x (Lanczos) first so the cut edge is crisp at display size.
usage: python3 -I tools/elysium_cutout.py <in.jpeg> <out.png>
"""
import sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(np.float32)
lum = a.mean(axis=2)
h, w = lum.shape
white = lum > 200
ys, xs = np.nonzero(white)
# the ring's outer edge: per ray from the centre, the farthest white pixel; centre and radius by least squares
cx, cy = xs.mean(), ys.mean()
edge = []
for t in np.linspace(0, 2 * np.pi, 720, endpoint=False):
    dx, dy = np.cos(t), np.sin(t)
    last = None
    for r in np.arange(100, min(w, h) / 2 + 2, 0.25):
        x, y = int(round(cx + dx * r)), int(round(cy + dy * r))
        if 0 <= x < w and 0 <= y < h and white[y, x]:
            last = (cx + dx * r, cy + dy * r)
    if last: edge.append(last)
E = np.array(edge)
A = np.c_[2 * E[:, 0], 2 * E[:, 1], np.ones(len(E))]
bx, by, c = np.linalg.lstsq(A, (E ** 2).sum(1), rcond=None)[0]
R = np.sqrt(c + bx * bx + by * by)
print(f'ring centre ({bx:.2f}, {by:.2f}) radius {R:.2f} px (of {w}x{h})')
S = 4
big = im.resize((w * S, h * S), Image.LANCZOS)
yy, xx = np.mgrid[0:h * S, 0:w * S]
d = np.hypot((xx + 0.5) / S - bx - 0.5 / S * 0, (yy + 0.5) / S - by)
inset = 0.9  # source px inside the fitted edge: clear of the JPEG's dark fringe
alpha = np.clip((R - inset - d) * S + 0.5, 0, 1)
rgba = np.dstack([np.asarray(big), (alpha * 255).astype(np.uint8)])
# crop to the circle
r = (R + 1) * S
x0, y0 = int(max(0, bx * S - r)), int(max(0, by * S - r))
x1, y1 = int(min(w * S, bx * S + r)), int(min(h * S, by * S + r))
Image.fromarray(rgba[y0:y1, x0:x1], 'RGBA').save(out, optimize=True)
print('wrote', out, x1 - x0, 'x', y1 - y0)
