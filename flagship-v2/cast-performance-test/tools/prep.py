#!/usr/bin/env python3
"""Derived layers for the cast performance tests (High Roller, Untouchable, Cold Blooded). Non-destructive: the painted
RGB is never altered; layers are the original pixels plus alpha, or the original painting on an extended paper canvas.

  layers/hr-fig.png            High Roller: refined matte (holes in the paper-coloured kimono filled) + a soft ink fringe
                               for the dry-brush robe tails; the six flying chips are NOT in it
  layers/hr-chip-<i>.png       the six painted flying chips, each its own sprite (original pixels + alpha), chips.json
  layers/cb-fig.png            Cold Blooded defeat painting, refined matte + ink fringe (fur, hair strands)
  layers/cb-card-fig.png       Cold Blooded v2 kit card, the house matte (yochi-2p5d build, read-only), painting rect
  layers/un-canvas.png         Untouchable on an extended paper canvas (16:9 at the painting's height, painting at the
                               right; the ribbons that leave the canvas's left edge are feathered into the paper)
  layers/un-flow.png           the ribbon motion map: RG = outward direction from her rigid core, B = weight (0 on the
                               body, sword, moon and ground; 1 on the free ribbon/hair/hem ends), A = distance
  layers/arena-up.png, arena-down.png, arena-floor.png   crops of the approved arena painting
"""
import json, os, cv2, numpy as np
from PIL import Image

H = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = f'{H}/assets/source'; OUT = f'{H}/assets/derived/layers'; os.makedirs(OUT, exist_ok=True)
REPO = os.path.abspath(f'{H}/../..')


def load(p): return np.array(Image.open(p).convert('RGB'))


def paper_distance(rgb):
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
    b = 12
    border = np.concatenate([lab[:b].reshape(-1, 3), lab[:, :b].reshape(-1, 3), lab[:, -b:].reshape(-1, 3)])
    paper = np.median(border, axis=0)
    d0 = np.linalg.norm(lab - paper, axis=2)
    bg = (d0 < 14).astype(np.float32)
    blur = cv2.GaussianBlur(lab * bg[..., None], (0, 0), 60); wts = cv2.GaussianBlur(bg, (0, 0), 60)[..., None]
    local = np.where(wts > 0.02, blur / np.maximum(wts, 1e-3), paper)
    return np.linalg.norm(lab - local, axis=2)


def refine(rgb, raw_alpha, fringe=60, keep_min=6000, exclude=None, gaps=()):
    """Solid silhouette (closed, enclosed holes filled, small islands dropped) + a soft ink fringe within `fringe` px:
    alpha = smoothstep(paper distance 12..40) there, so dry-brush strokes and strands keep their translucency."""
    h, w = raw_alpha.shape
    m = (raw_alpha > 0.5).astype(np.uint8)
    if exclude is not None: m[exclude > 0] = 0
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
    ff = np.pad(m.copy(), 1); cv2.floodFill(ff, np.zeros((h + 4, w + 4), np.uint8), (0, 0), 2); solid = (ff[1:-1, 1:-1] != 2).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(solid, 8)
    keep = np.zeros_like(solid)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] > keep_min: keep[lab == i] = 1
    d = paper_distance(rgb)
    # background paper seen through the figure (between the legs, between hair strands): the paper-coloured regions
    # inside the silhouette that contain an authored hint seed. Seeds, not a colour rule, because the costumes use
    # paper-coloured paint (High Roller's cream kimono, Cold Blooded's beige stripes and fur) that must stay
    gapmask = np.zeros((h, w), np.uint8)
    if gaps:
        pp = ((cv2.GaussianBlur(d, (0, 0), 2) < 12) & (keep > 0)).astype(np.uint8)
        pp = cv2.morphologyEx(pp, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
        n2, l2 = cv2.connectedComponents(pp, connectivity=4)
        for gx, gy in gaps:
            if l2[gy, gx] > 0: gapmask |= (l2 == l2[gy, gx]).astype(np.uint8)
            else: print('  gap seed not on paper:', gx, gy)
        gapmask = cv2.dilate(gapmask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
        keep[gapmask > 0] = 0
    ink = np.clip((d - 12) / 28, 0, 1); ink = ink * ink * (3 - 2 * ink)
    near = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * fringe + 1, 2 * fringe + 1)))
    if exclude is not None: near[exclude > 0] = 0
    near[cv2.erode(gapmask, np.ones((9, 9), np.uint8)) > 0] = 0
    inner = cv2.erode(keep, np.ones((5, 5), np.uint8)).astype(np.float32)
    a = np.maximum(cv2.GaussianBlur(inner, (0, 0), 1.0), ink * near)
    a = np.maximum(a, keep * np.clip(raw_alpha, 0, 1))
    return np.clip(a, 0, 1)


def save_rgba(p, rgb, a): Image.fromarray(np.dstack([rgb, (a * 255).astype(np.uint8)])).save(p)


def check(p, rgb, a, bgc=(255, 0, 255)):
    c = rgb * a[..., None] + np.array(bgc) * (1 - a[..., None]); Image.fromarray(c.astype(np.uint8)).save(p, quality=86)


def raw(name): return np.array(Image.open(f'{H}/assets/derived/{name}-matte.png'))[..., 3].astype(np.float32) / 255

# ---------------------------------------------------------------- High Roller
hr = load(f'{SRC}/high-roller-win.webp'); h, w = hr.shape[:2]
d = paper_distance(hr)
fig_raw = raw('high-roller-win')
# the flying chips: non-paper blobs up and left of her raised hand, outside the figure matte, chip-shaped
chips = []
cand = ((d > 30) & (fig_raw < 0.5)).astype(np.uint8); cand[400:] = 0; cand[:, 400:] = 0
cand = cv2.morphologyEx(cand, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
cand = cv2.morphologyEx(cand, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))  # strips the thin painted speed-streaks off the chips
n, lab, st, cen = cv2.connectedComponentsWithStats(cand, 8)
chipmask = np.zeros((h, w), np.uint8)
for i in range(1, n):
    x, y, bw, bh, area = st[i]
    if area < 600: continue
    comp = (lab == i).astype(np.uint8)
    cnt, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    hull = cv2.convexHull(cnt[0]); solidity = area / max(cv2.contourArea(hull), 1)
    if solidity < 0.75: continue
    filled = np.zeros_like(comp); cv2.drawContours(filled, [hull], -1, 1, -1)
    chipmask |= filled
    pad = 4; x0, y0, x1, y1 = max(0, x - pad), max(0, y - pad), min(w, x + bw + pad), min(h, y + bh + pad)
    a = cv2.GaussianBlur(filled.astype(np.float32), (0, 0), 0.9)[y0:y1, x0:x1]
    k = len(chips)
    save_rgba(f'{OUT}/hr-chip-{k}.png', hr[y0:y1, x0:x1], a)
    chips.append(dict(i=k, x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0), cx=float(cen[i][0]), cy=float(cen[i][1]), area=int(area), solidity=round(float(solidity), 2)))
json.dump(dict(canvas=[w, h], chips=chips), open(f'{OUT}/hr-chips.json', 'w'), indent=1)
print('High Roller chips:', [(c['cx'], c['cy']) for c in chips])
a = refine(hr, fig_raw, fringe=50, exclude=cv2.dilate(chipmask, np.ones((9, 9), np.uint8)), gaps=[(632, 1217), (96, 883)])
# the painted speed-streaks behind the chips stay out (the chips now really move); only strokes near the body keep
save_rgba(f'{OUT}/hr-fig.png', hr, a); check(f'{H}/assets/derived/hr-check.jpg', hr, a)

# ---------------------------------------------------------------- Cold Blooded (defeat painting)
cb = load(f'{SRC}/cold-blooded-defeat.webp')
a = refine(cb, raw('cold-blooded-defeat'), fringe=40, gaps=[(338, 309), (271, 314), (737, 512), (182, 1254)])
save_rgba(f'{OUT}/cb-fig.png', cb, a); check(f'{H}/assets/derived/cb-check.jpg', cb, a)

# ---------------------------------------------------------------- Cold Blooded (the v2 kit card, house matte)
cf = np.array(Image.open(f'{REPO}/yochi-2p5d/characters/cold-blooded/build/fig.png'))
x0, y0, x1, y1 = 72, 150, 1464, 1978  # the house painting rect inside the card frame
cfr = cf[y0:y1, x0:x1] if cf.shape[0] >= 2048 else cf
Image.fromarray(cfr).save(f'{OUT}/cb-card-fig.png')
check(f'{H}/assets/derived/cb-card-check.jpg', cfr[..., :3].astype(np.float32), cfr[..., 3].astype(np.float32) / 255)
print('card fig', cf.shape, '->', cfr.shape)

# ---------------------------------------------------------------- Untouchable: extended paper canvas + ribbon flow
un = load(f'{SRC}/untouchable-win.webp'); uh, uw = un.shape[:2]
CW = round(uh * 16 / 9); OX = (CW - uw) // 2 + 260  # canvas 2731 x 1536; the painting sits right of centre, ribbons to the left
# paper for the extension: the painting's OWN paper, continued. Its low-frequency tone (ink inpainted out at low res,
# blurred) is mirrored outward from each edge so the tone is continuous at the seam; the fine grain is synthesised to
# the painting paper's measured strength. The same field is the reveal's "blank paper" (un-paper.png).
d = paper_distance(un)
pap = np.median(un[d < 8].reshape(-1, 3), axis=0)
sm = 4
small = cv2.resize(un, (uw // sm, uh // sm), interpolation=cv2.INTER_AREA)
inkm = cv2.dilate((cv2.resize(d, (uw // sm, uh // sm)) > 10).astype(np.uint8), np.ones((5, 5), np.uint8))
lf = cv2.inpaint(small, inkm, 9, cv2.INPAINT_TELEA).astype(np.float32)
lf = cv2.GaussianBlur(lf, (0, 0), 10)
lf = cv2.resize(lf, (uw, uh), interpolation=cv2.INTER_CUBIC)
cx = np.arange(CW) - OX
mx = np.abs(cx); mx = np.where(mx >= uw, 2 * (uw - 1) - mx, mx); mx = np.clip(np.where(cx >= uw, 2 * (uw - 1) - cx, mx), 0, uw - 1).astype(int)
paperfield = lf[:, mx]
# the paper's texture, measured on clean paper in two bands (fine fibre, mid mottling) and synthesised to match
u32 = un.astype(np.float32).mean(axis=2); clean = cv2.erode((d < 8).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
b1 = (u32 - cv2.GaussianBlur(u32, (0, 0), 2))[clean].std(); b2 = (cv2.GaussianBlur(u32, (0, 0), 2) - cv2.GaussianBlur(u32, (0, 0), 14))[clean].std()
rng = np.random.default_rng(3)
def band(s0, s1):
    n_ = rng.standard_normal((uh, CW)).astype(np.float32)
    x_ = cv2.GaussianBlur(n_, (0, 0), s0) - (cv2.GaussianBlur(n_, (0, 0), s1) if s1 else 0)
    return x_ / (x_.std() + 1e-6)
grain = band(0.8, 2) * b1 * 0.8 + band(3, 14) * b2
print('paper texture bands', round(float(b1), 2), round(float(b2), 2))
canvas = paperfield + grain[..., None]
Image.fromarray(canvas.clip(0, 255).astype(np.uint8)).save(f'{OUT}/un-paper.png')  # blank paper (field + grain) for the reveal
# the painting, with its left/right edges feathered into the extension (ragged, so ribbon ends read as dissolving ink)
xs = np.arange(uw)[None, :].astype(np.float32)
nl = cv2.GaussianBlur(rng.standard_normal((uh, 1)).astype(np.float32), (1, 0), 14)[:, 0]; nl = 40 + 30 * nl / (nl.std() + 1e-6)
fe = np.clip((xs - nl[:, None]) / 60, 0, 1) * np.clip(((uw - 1 - xs) - 20) / 40, 0, 1)
fe = fe * np.clip(np.arange(uh)[:, None] / 30, 0, 1)
canvas[:, OX:OX + uw] = canvas[:, OX:OX + uw] * (1 - fe[..., None]) + un.astype(np.float32) * fe[..., None]
Image.fromarray(canvas.clip(0, 255).astype(np.uint8)).save(f'{OUT}/un-canvas.png')
# the rigid core: body, head and bun, arms, the sword, the skirt's central column, the feet (painting px)
core = np.zeros((uh, uw), np.uint8)
CORE = [(400, 30), (530, 20), (640, 120), (655, 260), (705, 340), (785, 420), (805, 560), (765, 740), (725, 800), (700, 880),
        (700, 1300), (640, 1530), (420, 1530), (380, 1300), (345, 1000), (360, 700), (300, 560), (300, 450), (400, 400), (410, 260), (380, 120)]
cv2.fillPoly(core, [np.array(CORE, np.int32)], 1)
cv2.line(core, (470, 470), (915, 1060), 1, 46)                  # the sheathed sword, rigid
cv2.circle(core, (760, 215), 225, 1, -1)                        # the ink moon stays still (it's the sky, not cloth)
core[1455:] = 1                                                  # the ground
dist = cv2.distanceTransform((1 - core).astype(np.uint8), cv2.DIST_L2, 5)
W = np.clip((dist - 18) / 240, 0, 1); W = W * W * (3 - 2 * W)
# only ink moves: bare paper far from any stroke stays put (its fibre would visibly swim). The ink mask is dilated
# (so a ribbon carries a margin of paper with it) and softened
inkm = cv2.morphologyEx((d > 30).astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
inkm = cv2.dilate(inkm, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))).astype(np.float32)
W = W * cv2.GaussianBlur(inkm, (0, 0), 6)
gy, gx = np.gradient(cv2.GaussianBlur(dist, (0, 0), 12))
gn = np.sqrt(gx ** 2 + gy ** 2) + 1e-6; gx, gy = gx / gn, gy / gn
flow = np.zeros((uh, CW, 4), np.float32); flow[..., 0] = 0.5; flow[..., 1] = 0.5
flow[:, OX:OX + uw, 0] = gx * 0.5 + 0.5; flow[:, OX:OX + uw, 1] = gy * 0.5 + 0.5
flow[:, OX:OX + uw, 2] = W * fe;      flow[:, OX:OX + uw, 3] = np.clip(dist / 600, 0, 1)
Image.fromarray((flow * 255).astype(np.uint8), 'RGBA').save(f'{OUT}/un-flow.png')
vis = canvas.copy(); vis[:, OX:OX + uw, 0] += W * 120; vis[:, OX:OX + uw][core > 0] *= [0.6, 1.0, 0.6]
Image.fromarray(vis.clip(0, 255).astype(np.uint8)).resize((CW // 2, uh // 2)).save(f'{H}/assets/derived/un-flow-check.jpg', quality=86)
json.dump(dict(paper=[float(v) for v in pap], canvas=[CW, uh], painting_at=[OX, 0], painting=[uw, uh], core=CORE, sword=[[470, 470], [915, 1060]], moon=[760, 215, 225]),
          open(f'{OUT}/un.json', 'w'), indent=1)

# ---------------------------------------------------------------- arena (approved painting as received)
ar = load(f'{REPO}/flagship-v2/pullback-test/assets/source/arena-master-v2-as-received.webp')
Image.fromarray(ar[90:900, 0:1140]).save(f'{OUT}/arena-up.png')      # the UP side: left terraces
Image.fromarray(ar[90:900, 860:2000]).save(f'{OUT}/arena-down.png')  # the DOWN side: right terraces
Image.fromarray(ar[1030:1125, 1468:1842][:, ::-1]).save(f'{OUT}/arena-floor.png')  # the paved landing (mirrored for the UP side)
print('done')
