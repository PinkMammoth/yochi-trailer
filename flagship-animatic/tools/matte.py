#!/usr/bin/env python3
"""Alpha mattes for the approved pose variants (painted on flat paper), so they can move as whole figures.

The pixels are never changed: the output is the original RGB plus an alpha channel. Method: the paper colour is
estimated from the border; distance-to-paper seeds OpenCV GrabCut (sure/probable fg/bg); the result is cleaned
(small islands dropped, holes inside the figure filled only where they're not paper-coloured) and feathered by
~1 px. A review sheet (figure over magenta) is written beside it.

usage: python3 duels/tools/matte.py <in.webp> <out.png> [--keep-flecks] [--fill-holes]
"""
import sys
import numpy as np, cv2
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
keep_flecks = '--keep-flecks' in sys.argv
fill_all = '--fill-holes' in sys.argv  # paper-coloured costume (bandages): fill every enclosed hole
rgb = np.array(Image.open(src).convert('RGB'))
h, w, _ = rgb.shape
lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
b = 12
border = np.concatenate([lab[:b].reshape(-1, 3), lab[-b:].reshape(-1, 3), lab[:, :b].reshape(-1, 3), lab[:, -b:].reshape(-1, 3)])
paper = np.median(border, axis=0)
# paper varies (grain, vignette): use a smooth local paper estimate from a heavily blurred, figure-excluded image
d0 = np.linalg.norm(lab - paper, axis=2)
bgish = (d0 < 14).astype(np.uint8)
blur = cv2.GaussianBlur(lab * bgish[..., None], (0, 0), 60)
wts = cv2.GaussianBlur(bgish.astype(np.float32), (0, 0), 60)[..., None]
local = np.where(wts > 0.02, blur / np.maximum(wts, 1e-3), paper)
d = np.linalg.norm(lab - local, axis=2)

gc = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
gc[d > 16] = cv2.GC_PR_FGD
gc[d > 34] = cv2.GC_FGD
gc[d < 7] = cv2.GC_BGD
gc[:4], gc[-4:], gc[:, :4], gc[:, -4:] = cv2.GC_BGD, cv2.GC_BGD, cv2.GC_BGD, cv2.GC_BGD
# a figure that leaves the canvas at the bottom: keep its bottom edge pixels
bot = d[-4:] > 16
gc[-4:][bot] = cv2.GC_FGD
bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
scale = 0.5
small = cv2.resize(rgb, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
gcs = cv2.resize(gc, (small.shape[1], small.shape[0]), interpolation=cv2.INTER_NEAREST)
cv2.grabCut(cv2.cvtColor(small, cv2.COLOR_RGB2BGR), gcs, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
m = np.isin(gcs, (cv2.GC_FGD, cv2.GC_PR_FGD)).astype(np.uint8)
m = cv2.resize(m, (w, h), interpolation=cv2.INTER_LINEAR)
# full-res edge refinement: inside a band around the GrabCut edge, trust the paper distance
band = cv2.dilate(m, np.ones((9, 9), np.uint8)) - cv2.erode(m, np.ones((9, 9), np.uint8))
soft = np.clip((d - 9) / 14, 0, 1)
a = m.astype(np.float32)
a[band > 0] = soft[band > 0]
# islands: keep the main body and anything big; flecks (painted ink flicks) only with --keep-flecks
n, lbl, st, _ = cv2.connectedComponentsWithStats((a > 0.5).astype(np.uint8), 8)
keep = np.zeros(n, bool)
if n > 1:
    big = np.argmax(st[1:, cv2.CC_STAT_AREA]) + 1
    keep[big] = True
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] > (60 if keep_flecks else 4000):
            keep[i] = True
a[~keep[lbl] & (a > 0)] *= 0.0 if not keep_flecks else 1.0
# holes enclosed by the figure that aren't paper: fill
inv = (a < 0.5).astype(np.uint8)
n2, l2, s2, _ = cv2.connectedComponentsWithStats(inv, 4)
for i in range(1, n2):
    x, y, ww, hh, area = s2[i]
    touches = x == 0 or y == 0 or x + ww >= w or y + hh >= h
    if not touches and (area < 6000 or fill_all):
        hole = l2 == i
        if fill_all or np.median(d[hole]) > 12:
            a[hole] = 1
a = cv2.GaussianBlur(a, (0, 0), 0.8)
alpha = (np.clip(a, 0, 1) * 255).astype(np.uint8)
Image.fromarray(np.dstack([rgb, alpha]), 'RGBA').save(out)
mag = np.zeros_like(rgb); mag[:] = (255, 0, 255)
comp = (rgb * (alpha[..., None] / 255) + mag * (1 - alpha[..., None] / 255)).astype(np.uint8)
Image.fromarray(np.concatenate([comp, rgb], axis=1)).resize((w, h // 2) if False else (w, int(h / 2)), Image.LANCZOS).save(out.replace('.png', '-check.jpg'), quality=82)
print(out, f'fill {np.mean(alpha > 127):.3f}')
