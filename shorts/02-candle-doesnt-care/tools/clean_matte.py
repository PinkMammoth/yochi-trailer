#!/usr/bin/env python3
"""Film-local clean-up of Cold Blooded's cut-out for a dark night scene.

Reads yochi-2p5d/characters/cold-blooded/build/fig.png (the house BiRefNet matte over the kit card's pixels,
made by yochi-2p5d/prep/prepare_character.py) READ ONLY, and writes a copy with the stray card-paper fragments
along the matte edge removed. The painting's pixels are never changed: only alpha is reduced.

  1. paper-like pixels (close to the card's own paper ground, smooth) within EDGE px of the matte boundary go;
  2. explicit clean-up boxes for fragments the rule misses (top-left blob, the paper chip by the neck);
  3. small islands are dropped, the edge is choked 1 px and feathered.

usage: python3 tools/clean_matte.py <repo>/yochi-2p5d/characters/cold-blooded/build/fig.png <out.png>
"""
import sys
import numpy as np
import cv2
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
im = np.array(Image.open(src).convert('RGBA')).astype(np.float32)
rgb, a = im[..., :3], im[..., 3] / 255.0
H, W = a.shape

# card paper ground: the painting's own background, sampled where the matte is empty
bgmask = a < 0.02
paper = np.median(rgb[bgmask & (rgb.mean(-1) > 150)], axis=0)
dist = np.linalg.norm(rgb - paper, axis=-1)
grey = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32)
mu = cv2.blur(grey, (9, 9)); var = cv2.blur(grey * grey, (9, 9)) - mu * mu
smooth = np.sqrt(np.maximum(var, 0)) < 14
paperlike = (dist < 38) & smooth

solid = (a > 0.5).astype(np.uint8)
inside = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
EDGE = 70
kill = paperlike & (inside < EDGE)
# grow the kill region a little into the same paper
kill = cv2.dilate(kill.astype(np.uint8), np.ones((5, 5), np.uint8)) & (dist < 52)
# protected: the white mask, the hand and the face (cream paint that the paper rule would otherwise bite)
PROTECT = [(890, 660, 1345, 1320), (430, 180, 1000, 640)]
for x0, y0, x1, y1 in PROTECT:
    kill[y0:y1, x0:x1] = 0

# explicit boxes (plate px): fragments of the card ground the matte kept
BOXES = [
    (120, 20, 345, 85),     # paper blob above the hair pin
    (690, 90, 790, 140),    # chip above the bun
    (850, 625, 925, 760),   # paper chip right of the neck
]
for x0, y0, x1, y1 in BOXES:
    sub = (dist[y0:y1, x0:x1] < 60)
    kill[y0:y1, x0:x1] |= sub.astype(np.uint8)
# the left edge strip and the bottom/right margins: only paper, never ink
for (x0, y0, x1, y1) in [(0, 600, 75, 1828), (1300, 1150, 1392, 1828), (0, 1680, 1392, 1828)]:
    kill[y0:y1, x0:x1] |= (dist[y0:y1, x0:x1] < 60).astype(np.uint8)

a2 = a * (1 - kill)
# drop islands
m = (a2 > 0.5).astype(np.uint8)
n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
keep = np.zeros(n, bool); keep[0] = False
for i in range(1, n):
    keep[i] = stats[i, cv2.CC_STAT_AREA] > 3000
a2 = a2 * keep[lab]
# fill pinholes inside the figure
holes = cv2.morphologyEx((a2 > 0.5).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
a2 = np.maximum(a2, holes * (a > 0.5) * 1.0)
# choke 1 px and feather
a2 = cv2.erode(a2, np.ones((3, 3), np.uint8))
a2 = cv2.GaussianBlur(a2, (0, 0), 0.9)
im[..., 3] = np.clip(a2 * 255, 0, 255)
Image.fromarray(im.astype(np.uint8)).save(out, optimize=True)
print('paper ground', paper.round(), 'removed', int((a > 0.5).sum() - (a2 > 0.5).sum()), 'px')
