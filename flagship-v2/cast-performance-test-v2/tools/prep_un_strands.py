#!/usr/bin/env python3
"""Untouchable: separate the free ribbons, hair ends and hem tatters into independently moving strands.

Works at the landscape's native resolution (1672x941, which is all the detail the ribbons have), on the hybrid canvas
resampled to that size, so the strands match the hybrid exactly where they meet the body.

Model: ink on paper is multiplicative, so every layer is stored as TRANSMITTANCE T = pixel / paper (<= 1). At rest,
plate x T_0 x T_1 x T_2 reproduces the painting; moved, a strand's ink moves and the paper behind it is paper.
  layers/un-plate.png      the hybrid canvas (2634x1483) with every free strand removed: the paper field + matched grain
  layers/un-T{0,1,2}.png   three interleaved strand groups' transmittance (native res; neighbours never share a group)
  layers/un-F{0,1,2}.png   their motion fields: RG = local tangent (along the strand, root to tip), B = s (0 at the root,
                           1 at the tip, geodesic), A = strand id. Dilated 60 px around each strand (nearest strand) so
                           a moved strand keeps its own field. NEAREST-sampled in the shader
  layers/un-core.png       the body occluder (hybrid pixels + alpha): everything that must stay still and in front
  layers/un-strands.json   per-strand parameters (root, length, area, group, amplitude, frequency, phase, depth, delay)
  reg/un-strands.jpg       the separation, coloured per strand, roots marked; reg/un-s.jpg (s), reg/un-groups.jpg
"""
import json, os, cv2, numpy as np
from PIL import Image
from scipy import ndimage
from skimage.graph import MCP_Geometric

H = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); D = f'{H}/assets/derived'; OUT = f'{D}/layers'
hyb_full = cv2.cvtColor(cv2.imread(f'{OUT}/un-hybrid.png'), cv2.COLOR_BGR2RGB).astype(np.float32)
CH, CW = hyb_full.shape[:2]
L0 = np.array(Image.open(f'{H}/assets/source/untouchable-landscape.webp').convert('RGB'))
h, w = L0.shape[:2]; SC = w / CW                                  # native / canvas (0.6347)
hyb = cv2.resize(hyb_full, (w, h), interpolation=cv2.INTER_AREA)

# ---------------------------------------------------------------- paper field and ink
lab = cv2.cvtColor(hyb.clip(0, 255).astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
paper_med = np.median(lab[lab[..., 0] > np.percentile(lab[..., 0], 70)], axis=0)
d0 = np.linalg.norm(cv2.GaussianBlur(lab, (0, 0), 1.2) - paper_med, axis=2)
def paper_field(img, inkmask, scale):
    s = 4; small = cv2.resize(img, (img.shape[1] // s, img.shape[0] // s), interpolation=cv2.INTER_AREA)
    m = cv2.dilate(cv2.resize(inkmask.astype(np.uint8), (small.shape[1], small.shape[0])), np.ones((5, 5), np.uint8))
    f = cv2.inpaint(small.clip(0, 255).astype(np.uint8), m, 9, cv2.INPAINT_TELEA).astype(np.float32)
    return cv2.resize(cv2.GaussianBlur(f, (0, 0), 8 * scale), (img.shape[1], img.shape[0]), interpolation=cv2.INTER_CUBIC)
pf = paper_field(hyb, d0 > 9, 1.0)
lum = lambda x: x.mean(axis=2)
# ink: darker than the paper's darkest mottling (paper L* is 161-199, 5-95 %; ribbon ink is below ~130)
ink = np.clip((156 - cv2.GaussianBlur(lab[..., 0], (0, 0), 0.6)) / 40, 0, 1)

# ---------------------------------------------------------------- the body (static, in front), the moon and the ground
BODY = np.array([(700, 20), (770, 15), (830, 80), (850, 190), (880, 270), (960, 360), (978, 420), (948, 520), (912, 600), (905, 700),
                 (892, 870), (845, 928), (700, 928), (640, 872), (592, 760), (566, 640), (566, 520), (604, 420), (612, 300), (652, 250),
                 (672, 190), (664, 100)], np.int32)
body = np.zeros((h, w), np.uint8); cv2.fillPoly(body, [BODY], 1)
cv2.line(body, (832, 382), (1040, 672), 1, 24)                      # the sheathed sword
static = body.copy()
cv2.circle(static, (888, 158), 182, 1, -1)                          # the ink moon (sky, not cloth)
# the ground is NOT a hard static boundary (a hem tatter crossing it would tear): strands may run into it, and the
# shader fades every displacement to zero over the 60 px above the ground line (GROUND_Y)
static_d = cv2.dilate(static, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))

# ---------------------------------------------------------------- strands: ink components in the free region
free = (ink > 0.1) & (static_d == 0)
# pieces of one ribbon are joined by its cream stretches: a wide closing groups them into one strand
free = cv2.morphologyEx(free.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19)))
# the cream stripes inside a ribbon are paper-coloured but enclosed by its ink: fill holes up to 2500 px
holes = ndimage.binary_fill_holes(free) & ~free.astype(bool)
hl, hn = ndimage.label(holes); hs = ndimage.sum(holes, hl, range(1, hn + 1))
free = (free.astype(bool) | np.isin(hl, np.nonzero(hs <= 2500)[0] + 1)).astype(np.uint8) * (static_d == 0)
n, lab_c, st, cen = cv2.connectedComponentsWithStats(free, 8)
dist_body = ndimage.distance_transform_edt(1 - body)
strands = []; sid = np.zeros((h, w), np.int32); smap = np.zeros((h, w), np.float32)
for i in range(1, n):
    area = st[i, cv2.CC_STAT_AREA]
    if area < 60: continue
    comp = lab_c == i
    if float(ink[comp].mean()) < 0.32 and area < 4000: continue   # the paper's own dark flecks, not ink: they stay
    ys, xs = np.nonzero(comp)
    # root: the strand's pixel nearest the body (or, for floating pieces, the end nearest the body)
    j = np.argmin(dist_body[ys, xs]); ry, rx = ys[j], xs[j]
    attached = dist_body[ry, rx] < 14
    cost = np.where(comp, 1.0, np.inf)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    mcp = MCP_Geometric(cost[y0:y1, x0:x1]); g, _ = mcp.find_costs([(ry - y0, rx - x0)])
    g = np.where(np.isfinite(g), g, 0)
    Ls = float(g.max()) + 1
    k = len(strands) + 1
    sid[y0:y1, x0:x1][comp[y0:y1, x0:x1]] = k
    smap[y0:y1, x0:x1][comp[y0:y1, x0:x1]] = g[comp[y0:y1, x0:x1]] / Ls
    strands.append(dict(id=k, area=int(area), root=[int(rx), int(ry)], length=round(Ls, 1), attached=bool(attached), bbox=[int(x0), int(y0), int(x1), int(y1)],
                        cx=float(cen[i][0]), cy=float(cen[i][1])))
print('strands', len(strands), 'attached', sum(s['attached'] for s in strands), 'largest', sorted([s['area'] for s in strands])[-5:])
assert len(strands) < 250

# ---------------------------------------------------------------- tangents (root -> tip), smoothed inside each strand
gs = cv2.GaussianBlur(smap, (0, 0), 3); wgt = cv2.GaussianBlur((sid > 0).astype(np.float32), (0, 0), 3) + 1e-6
gs = gs / wgt
ty, tx = np.gradient(gs); tn = np.sqrt(tx ** 2 + ty ** 2) + 1e-9; tx, ty = tx / tn, ty / tn

# ---------------------------------------------------------------- groups: neighbours never share a group (greedy colouring)
adj = {s['id']: set() for s in strands}
grown = cv2.dilate(sid.astype(np.float32), np.ones((1, 1))).astype(np.int32)
_, near_idx = ndimage.distance_transform_edt(sid == 0, return_indices=True)
voro = sid[near_idx[0], near_idx[1]]
dist_strand = ndimage.distance_transform_edt(sid == 0)
zone = dist_strand < 70
for a, b in ((voro[:, :-1], voro[:, 1:]), (voro[:-1], voro[1:])):
    m = (a != b) & (a > 0) & (b > 0)
    za = zone[:, :-1] if a.shape[1] == w - 1 else zone[:-1]
    for p, q in set(zip(a[m & za].tolist(), b[m & za].tolist())): adj[p].add(q); adj[q].add(p)
group = {}
for s in sorted(strands, key=lambda s: -s['area']):
    used = {group[q] for q in adj[s['id']] if q in group}
    group[s['id']] = next((g for g in (0, 1, 2) if g not in used), min((0, 1, 2), key=lambda g: sum(1 for q in adj[s['id']] if group.get(q) == g)))
for s in strands: s['group'] = group[s['id']]

# ---------------------------------------------------------------- motion parameters (organic: no two strands alike)
rng = np.random.default_rng(17)
for s in strands:
    Ls = s['length']
    big = np.clip(Ls / 420, 0.25, 1.3)
    s['amp'] = round(float((7 + 15 * big) * (1.0 if s['attached'] else 0.8) * rng.uniform(0.8, 1.2)), 2)   # native px at the tip
    s['freq'] = round(float(rng.uniform(0.32, 0.55) / np.sqrt(big)), 3)                                       # Hz, long strands slower
    s['lam'] = round(float(rng.uniform(0.55, 0.95)), 3)                                                       # waves per strand length
    s['phase'] = round(float(rng.uniform(0, 6.283)), 3); s['phase2'] = round(float(rng.uniform(0, 6.283)), 3)
    s['depth'] = round(float(rng.uniform(-1, 1)), 2)                                                          # parallax sign/strength
    s['delay'] = round(float((s['cx'] - 200) / 1400 * 0.6 + rng.uniform(0, 0.12)), 3)                        # the gust travels left to right

# ---------------------------------------------------------------- per-group layers: transmittance and dilated fields
T_all = np.ones((h, w, 3), np.float32)
for gi in range(3):
    ids = np.array([s['id'] for s in strands if s['group'] == gi])
    gmask = np.isin(sid, ids)
    # the strand's ink, softly: its component, grown 2 px so the dry-brush fringe and the anti-aliased edge go with it
    soft = cv2.GaussianBlur(cv2.dilate(gmask.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32), (0, 0), 0.8) * (static_d == 0)
    # only significant deviations from the paper move: ink (darker by > ~5-11 %) and cream (lighter by > ~3-6 %); the
    # paper's own mottling stays in the plate, so no paper texture swims with a strand
    dev = np.clip(hyb / np.maximum(pf, 1), 0, 1.3) - 1
    keep = np.where(dev < 0, np.clip((-dev - 0.05) / 0.06, 0, 1), np.clip((dev - 0.03) / 0.03, 0, 1))
    Tg = 1 + dev * keep * soft[..., None]
    T_all *= Tg
    Image.fromarray((Tg / 1.3 * 255).round().clip(0, 255).astype(np.uint8)).save(f'{OUT}/un-T{gi}.png')   # stored as T / 1.3
    d_g, idx = ndimage.distance_transform_edt(~gmask, return_indices=True)
    near = (idx[0], idx[1])
    F = np.zeros((h, w, 4), np.float32)
    inside = d_g < 60
    F[..., 0] = tx[near] * 0.5 + 0.5; F[..., 1] = ty[near] * 0.5 + 0.5; F[..., 2] = smap[near]; F[..., 3] = sid[near] / 255.0
    F[~inside] = (0.5, 0.5, 0, 0)
    Image.fromarray((F * 255).round().clip(0, 255).astype(np.uint8), 'RGBA').save(f'{OUT}/un-F{gi}.png')

# ---------------------------------------------------------------- the plate: strands removed, paper + matched grain behind
removed = 1 - np.clip(T_all.mean(axis=2) * 0 + (T_all.min(axis=2) < 0.999), 0, 1)  # 0 where a strand was
mask_full = cv2.resize((np.abs(T_all - 1).max(axis=2) > 0.005).astype(np.float32), (CW, CH), interpolation=cv2.INTER_LINEAR)
mask_full = np.clip(cv2.GaussianBlur(mask_full, (0, 0), 1.0) * 1.5, 0, 1)
d_full = np.linalg.norm(cv2.GaussianBlur(cv2.cvtColor(hyb_full.clip(0, 255).astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32), (0, 0), 1.2) - paper_med, axis=2)
pf_full = paper_field(hyb_full, d_full > 9, 1.0 / SC)
# the paper's own texture, measured on clean paper, synthesised in two bands
g_ = hyb_full.mean(axis=2); clean = cv2.erode((d_full < 7).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
b1 = (g_ - cv2.GaussianBlur(g_, (0, 0), 2))[clean].std(); b2 = (cv2.GaussianBlur(g_, (0, 0), 2) - cv2.GaussianBlur(g_, (0, 0), 14))[clean].std()
rr = np.random.default_rng(5)
def band(s0, s1):
    x = rr.standard_normal((CH, CW)).astype(np.float32); y = cv2.GaussianBlur(x, (0, 0), s0) - (cv2.GaussianBlur(x, (0, 0), s1) if s1 else 0); return y / (y.std() + 1e-6)
grain = (band(0.8, 2) * b1 * 0.85 + band(3, 14) * b2)[..., None]
T_full = cv2.resize(T_all, (CW, CH), interpolation=cv2.INTER_LINEAR)
# the plate: original pixels wherever no strand ink was; where it was, the surrounding paper continued inwards
# (inpainted from the boundary, so its tone matches the mottled paper around it) plus the paper's measured fine grain
lift = (np.abs(T_full - 1).max(axis=2) > 0.02).astype(np.uint8)
lift = cv2.dilate(lift, np.ones((5, 5), np.uint8))
hs = 2; small = cv2.resize(hyb_full, (CW // hs, CH // hs), interpolation=cv2.INTER_AREA).clip(0, 255).astype(np.uint8)
ls = cv2.resize(lift, (CW // hs, CH // hs), interpolation=cv2.INTER_NEAREST)
fill = cv2.resize(cv2.inpaint(small, ls, 7, cv2.INPAINT_TELEA), (CW, CH), interpolation=cv2.INTER_CUBIC).astype(np.float32)
fill = cv2.GaussianBlur(fill, (0, 0), 2.0) + band(0.8, 2)[..., None] * b1 * 0.9 + band(3, 14)[..., None] * b2 * 0.5
lf = cv2.GaussianBlur(lift.astype(np.float32), (0, 0), 1.5)[..., None]
plate = hyb_full * (1 - lf) + fill * lf
Image.fromarray(plate.clip(0, 255).astype(np.uint8)).save(f'{OUT}/un-plate.png')
Image.fromarray((pf_full + grain).clip(0, 255).astype(np.uint8)).save(f'{OUT}/un-paper.png')   # blank paper, for the ink bloom
print('paper texture', round(float(b1), 2), round(float(b2), 2))

# ---------------------------------------------------------------- the body occluder (canvas res): hybrid pixels, alpha on the body only
bodyF = cv2.resize(body, (CW, CH), interpolation=cv2.INTER_NEAREST)
bodyF = cv2.dilate(bodyF, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
a_core = cv2.GaussianBlur(bodyF.astype(np.float32), (0, 0), 3)
inkF = np.clip(d_full / 22, 0, 1)
a_core = np.clip(a_core * np.maximum(inkF, cv2.erode(bodyF, np.ones((31, 31), np.uint8)).astype(np.float32)), 0, 1)
Image.fromarray(np.dstack([hyb_full.clip(0, 255).astype(np.uint8), (a_core * 255).astype(np.uint8)])).save(f'{OUT}/un-core.png')

json.dump(dict(ground_y=905, native=[w, h], canvas=[CW, CH], scale_native_per_canvas=SC, strands=strands, body=BODY.tolist()), open(f'{OUT}/un-strands.json', 'w'), indent=1)

# ---------------------------------------------------------------- visualisations
rc = np.random.default_rng(1).uniform(40, 255, (len(strands) + 1, 3)); rc[0] = 0
vis = (hyb * 0.35).copy(); col = rc[sid]; m = sid > 0
vis[m] = vis[m] * 0.3 + col[m] * 0.7
vis[body > 0] = vis[body > 0] * 0.5 + np.array([60, 60, 60])
vis = vis.clip(0, 255).astype(np.uint8)
for s in strands: cv2.circle(vis, tuple(s['root']), 4, (255, 255, 255), -1); cv2.circle(vis, tuple(s['root']), 4, (0, 0, 0), 1)
Image.fromarray(vis).save(f'{D}/reg/un-strands.jpg', quality=90)
Image.fromarray((np.dstack([smap * 255, (sid > 0) * 60, (1 - smap) * 255 * (sid > 0)])).clip(0, 255).astype(np.uint8)).save(f'{D}/reg/un-s.jpg', quality=90)
gc = np.array([[0, 0, 0], [230, 80, 60], [60, 200, 90], [70, 120, 240]], np.float32)
gidx = np.zeros((h, w), np.int32)
for s in strands: gidx[sid == s['id']] = s['group'] + 1
Image.fromarray((hyb * 0.4 + gc[gidx] * (gidx > 0)[..., None] * 0.6).clip(0, 255).astype(np.uint8)).save(f'{D}/reg/un-groups.jpg', quality=90)
print('done')
