"""Refine the house GrabCut matte (../film/tools/matte.py --fill-holes) for Last Legend.
His costume uses paper-coloured paint (the cream mottling on the red cloth, the grey hair, skin highlights), so the
raw matte has holes. Here: the solid silhouette (raw matte closed by a small kernel, every enclosed hole filled),
with the raw matte's soft edge kept on the outer boundary. Only alpha is produced: the RGB stays the painting's.
Also writes the painted floor's ink (contact shadows, smudges) as a separate alpha, so his contact with the ground
can be laid onto the arena's stone without the parchment.
usage: python3 tools/matte_refine.py <pose.webp> <raw_matte.png> <out_prefix>"""
import sys, cv2, numpy as np
from PIL import Image
src, raw, out = sys.argv[1:4]
rgb = np.array(Image.open(src).convert('RGB')); h, w = rgb.shape[:2]
a = np.array(Image.open(raw))[..., 3].astype(np.float32) / 255
m = (a > 0.5).astype(np.uint8)
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
# fill every enclosed hole (paper-coloured costume): flood the background from the border
ff = m.copy(); ff = np.pad(ff, 1); mask = np.zeros((h + 4, w + 4), np.uint8)
cv2.floodFill(ff, mask, (0, 0), 2); ff = ff[1:-1, 1:-1]
solid = (ff != 2).astype(np.uint8)
# large enclosed holes that are paper (the gap under his thigh, between the cloth and the boot) stay background;
# small ones are the costume's paper-coloured paint and are filled
holes = (solid > 0) & (m == 0)
nh, hl, hs, _ = cv2.connectedComponentsWithStats(holes.astype(np.uint8), 8)
for i in range(1, nh):
    if hs[i, cv2.CC_STAT_AREA] > 2500 and hs[i, cv2.CC_STAT_TOP] > 0.6 * h: solid[hl == i] = 0
# the ground line, authored once on the painting (both poses share it: the lower body registers to < 1 px).
# Below it is the painted floor, which comes back as floor ink, not as figure.
GROUND = np.array([(0, 1196), (120, 1196), (200, 1197), (232, 1206), (300, 1214), (400, 1210), (432, 1203), (480, 1216),
                   (560, 1242), (640, 1248), (700, 1243), (780, 1243), (900, 1252), (965, 1248), (1000, 1222), (1030, 1192),
                   (1110, 1186), (1199, 1182), (1199, 1312), (0, 1312)], np.int32)
# paper seen through the figure low down (the gap under the thigh): a large connected paper-coloured region
labc = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
border = np.concatenate([labc[:12].reshape(-1, 3), labc[:, :12].reshape(-1, 3), labc[:, -12:].reshape(-1, 3)])
pd = np.linalg.norm(cv2.GaussianBlur(labc, (0, 0), 2) - np.median(border, axis=0), axis=2)
paperish = ((pd < 20) & (solid > 0)).astype(np.uint8)
paperish = cv2.morphologyEx(paperish, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
np_, pl, ps, _ = cv2.connectedComponentsWithStats(paperish, 8)
for i in range(1, np_):
    if ps[i, cv2.CC_STAT_AREA] > 3000 and ps[i, cv2.CC_STAT_TOP] > 0.55 * h:
        solid[cv2.dilate((pl == i).astype(np.uint8), np.ones((11, 11), np.uint8)) > 0] = 0
        print('paper gap removed', ps[i, :4].tolist(), ps[i, cv2.CC_STAT_AREA])
# then grow the background into shadowed paper that touches it (lower figure only, where paper shows between the
# boot, the cloth and the thigh); the costume's paper-coloured paint is never connected to the background up there
lowpaper = ((pd < 28) | (solid == 0)).astype(np.uint8); lowpaper[: int(0.6 * h)] = (solid[: int(0.6 * h)] == 0)
nn, ll = cv2.connectedComponents(lowpaper, connectivity=4)
bgl = np.unique(ll[(solid == 0) & (lowpaper > 0)])
grown = np.isin(ll, bgl[bgl > 0]) & (solid > 0)
grown = cv2.morphologyEx(grown.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
solid[grown] = 0
print('shadowed paper removed px', int(grown.sum()))
below = np.zeros((h, w), np.uint8); cv2.fillPoly(below, [GROUND], 1)
solid[below > 0] = 0
# drop small islands (floor specks are handled by the floor-ink layer)
n, lab, st, _ = cv2.connectedComponentsWithStats(solid, 8)
keep = np.zeros_like(solid)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] > 4000: keep[lab == i] = 1
# floor line: below this the matte is floor-ink, not figure, except the boot soles / fist / cloth that rest on it
FLOOR = int(0.905 * h)
inner = cv2.erode(keep, np.ones((5, 5), np.uint8))
edge = keep.astype(np.float32) - inner
alpha = np.where(inner > 0, 1.0, np.where(edge > 0, np.maximum(a, 0.5), 0.0))
alpha = cv2.GaussianBlur(alpha, (0, 0), 0.8)
alpha[keep == 0] = np.minimum(alpha[keep == 0], 0)  # nothing outside the silhouette
Image.fromarray(np.dstack([rgb, (alpha * 255).astype(np.uint8)])).save(f'{out}-fig.png')
# floor ink: darkness relative to the local paper, in the floor band, outside the figure
lab_ = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
L = lab_[..., 0]
paperL = cv2.GaussianBlur(np.where(keep == 0, L, 0), (0, 0), 40) / np.maximum(cv2.GaussianBlur((keep == 0).astype(np.float32), (0, 0), 40), 1e-3)
ink = np.clip((paperL - L) / 110, 0, 1)
band = np.clip((np.arange(h)[:, None] - 1080) / 90, 0, 1) * np.ones((1, w))
ink = ink * band * (1 - alpha)
Image.fromarray((np.clip(ink * 1.6, 0, 1) * 255).astype(np.uint8)).save(f'{out}-floor-ink.png')
chk = rgb.astype(np.float32) * alpha[..., None] + np.array([255, 0, 255]) * (1 - alpha[..., None])
chk = chk * (1 - ink[..., None] * 0.9) + np.array([20, 18, 15]) * ink[..., None] * 0.9 * (alpha[..., None] < 0.5)
Image.fromarray(chk.clip(0, 255).astype(np.uint8)).save(f'{out}-check.jpg', quality=88)
print(out, 'alpha cover', round(float(alpha.mean()), 3))
