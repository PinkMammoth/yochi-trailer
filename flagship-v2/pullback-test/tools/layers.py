"""Separates the approved arena master into depth planes, non-destructively (the source file is never written).

Each plane is the master's own pixels plus an alpha matte. Masks start as hand-placed polygons (the design) and are
snapped to the painting's real edges with OpenCV GrabCut in a band around each polygon. Regions a nearer plane hides
are reconstructed (multi-scale inpaint + the paper's own grain) in the planes behind it, because a camera retreat
uncovers what was behind nearer objects. Every reconstructed pixel is flagged in a mask so the review can see it.

Also: the full-body figure split into figure (boots kept, the painted rock slab removed) and the slab.

Outputs assets/derived/layers/*.png, layers.json (depths), and docs/depth-layers.jpg (the breakdown sheet).
"""
import json, os, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

SRC = 'assets/source/arena-master.webp'
OUT = 'assets/derived/layers'
os.makedirs(OUT, exist_ok=True)
img = np.array(Image.open(SRC).convert('RGB'))
H, W = img.shape[:2]

# ---------------------------------------------------------------- the design: planes, polygons, depths
# depth L = distance from the FINAL camera, in units of the distance to Duel Master's feet (L = 1).
# Ground rule for the platform: L(y) = (765 - HZ) / (y - HZ), horizon HZ ~ 420 (from the platform's ellipse).
HZ = 420.0
P = {
    'fgL': dict(L=0.78, poly=[(0, 585), (60, 600), (138, 610), (140, 540), (172, 528), (205, 530), (240, 545), (276, 600), (262, 650), (330, 690), (338, 760), (300, 941), (0, 941)]),
    'fgR': dict(L=0.82, poly=[(1222, 941), (1262, 800), (1352, 700), (1420, 650), (1470, 640), (1580, 575), (1600, 565), (1650, 568), (1672, 560), (1672, 941)]),
    'platform': dict(L=None, poly=[(330, 712), (350, 690), (612, 676), (888, 676), (1065, 697), (1262, 716), (1290, 800), (1262, 941), (300, 941), (338, 760)]),
    'cliffL': dict(L=2.9, poly=[(0, 0), (560, 0), (470, 190), (600, 330), (640, 380), (622, 520), (560, 560), (610, 640), (600, 690), (350, 690), (330, 690), (262, 650), (276, 600), (138, 610), (0, 585)]),
    'cliffR': dict(L=3.1, poly=[(1672, 0), (1672, 560), (1600, 565), (1470, 640), (1352, 700), (1262, 716), (1190, 668), (1186, 580), (1105, 455), (1088, 330), (1225, 240), (1430, 130), (1545, 60), (1600, 0)]),
}
DEPTH = dict(sky=40.0, mountains=16.0, valley=6.5)

def polymask(poly, dil=0):
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon(poly, fill=255)
    m = np.array(m)
    if dil > 0: m = cv2.dilate(m, np.ones((dil, dil), np.uint8))
    if dil < 0: m = cv2.erode(m, np.ones((-dil, -dil), np.uint8))
    return m

def snap(poly, band=18, iters=6):
    """GrabCut in a band around the polygon: sure fg inside, sure bg outside, probable in the band."""
    gc = np.full((H, W), cv2.GC_BGD, np.uint8)
    gc[polymask(poly, 2 * band) > 0] = cv2.GC_PR_BGD
    gc[polymask(poly) > 0] = cv2.GC_PR_FGD
    gc[polymask(poly, -2 * band) > 0] = cv2.GC_FGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(cv2.cvtColor(img, cv2.COLOR_RGB2BGR), gc, None, bgd, fgd, iters, cv2.GC_INIT_WITH_MASK)
    m = np.where((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    # keep it within the band, remove specks, feather 1.5 px
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    keep = np.zeros_like(m)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] > 400: keep[lab == i] = 255
    return cv2.GaussianBlur(keep, (0, 0), 1.2)

masks = {k: snap(v['poly']) for k, v in P.items()}
# the platform owns its polygon outright where it meets the near planes (no double ownership)
for near in ('fgL', 'fgR'):
    for far in ('platform', 'cliffL', 'cliffR'):
        masks[far] = np.minimum(masks[far], 255 - masks[near])
for far in ('cliffL', 'cliffR'):
    masks[far] = np.minimum(masks[far], 255 - masks['platform'])

# ---------------------------------------------------------------- reconstruction behind nearer planes
rng = np.random.default_rng(3)
def grain_like(region_rgb):
    """paper grain: high-pass of the master's own empty paper (the top-centre sky), tiled"""
    # matched to the master's own fine-grain amplitude (measured on its flat paper), not tiled: no repeat pattern
    sky = img[20:70, 700:760].astype(np.float32)
    amp = float((sky - cv2.GaussianBlur(sky, (0, 0), 1.5)).std())
    n = cv2.GaussianBlur(rng.standard_normal((H, W)).astype(np.float32), (0, 0), 0.7)
    return (n / n.std() * amp)[..., None].repeat(3, 2)
GR = grain_like(None)
def fill(base_rgb, hole):
    """multi-scale inpaint: coarse structure from a 1/4 inpaint, refined at full res, plus the paper's grain"""
    small = cv2.resize(base_rgb, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    hs = cv2.resize(hole, (W // 4, H // 4), interpolation=cv2.INTER_NEAREST)
    s_in = cv2.inpaint(small, (hs > 0).astype(np.uint8), 9, cv2.INPAINT_TELEA)
    up = cv2.resize(s_in, (W, H), interpolation=cv2.INTER_CUBIC)
    out = base_rgb.copy().astype(np.float32)
    h = (cv2.GaussianBlur(hole, (0, 0), 3) / 255.0)[..., None]
    out = out * (1 - h) + (up.astype(np.float32) + GR) * h
    return np.clip(out, 0, 255).astype(np.uint8)

def save(name, rgb, alpha):
    Image.fromarray(np.dstack([rgb, alpha]).astype(np.uint8), 'RGBA').save(f'{OUT}/{name}.png', optimize=True)

near_all = np.maximum.reduce([masks[k] for k in ('fgL', 'fgR', 'platform', 'cliffL', 'cliffR')])
hole_bg = cv2.dilate((near_all > 40).astype(np.uint8) * 255, np.ones((9, 9), np.uint8))
backdrop = fill(img, hole_bg)                       # valley + mountains + sky with every nearer plane removed
# split the backdrop by height: sky / mountains / valley (soft bands; the mist does the rest)
yy = np.arange(H)[:, None].repeat(W, 1).astype(np.float32)
a_valley = np.clip((yy - 250) / 70, 0, 1)
a_mount = np.clip((yy - 70) / 50, 0, 1)
save('sky', backdrop, np.full((H, W), 255, np.uint8))
save('mountains', backdrop, (a_mount * 255).astype(np.uint8))
save('valley', backdrop, (a_valley * 255).astype(np.uint8))
# cliffs: own pixels, with the platform and the near planes reconstructed behind them where they overlap
near_cl = np.maximum.reduce([masks[k] for k in ('fgL', 'fgR', 'platform')])
hole_cl = cv2.dilate((near_cl > 40).astype(np.uint8) * 255, np.ones((9, 9), np.uint8))
cl_rgb = fill(img, hole_cl)
for k, ext in (('cliffL', 'fgL'), ('cliffR', 'fgR')):
    # each cliff also extends behind its side's near plane (the steps and terraces continue behind the lantern / posts)
    ext_a = (cv2.dilate(masks[ext], np.ones((5, 5), np.uint8)) * (polymask(P[k]['poly'], 140) > 0)).astype(np.float32)
    ext_a = cv2.GaussianBlur(ext_a, (0, 0), 28)  # no straight reconstruction edges: the fill fades into the backdrop
    alpha = np.maximum(masks[k], np.minimum(ext_a * 1.6, 255).astype(np.uint8))
    save(k, cl_rgb, alpha)
# platform: its own pixels; behind the near planes reconstructed (its stone continues under the lantern / stairs)
near_pl = np.maximum(masks['fgL'], masks['fgR'])
pl_rgb = fill(img, cv2.dilate((near_pl > 40).astype(np.uint8) * 255, np.ones((9, 9), np.uint8)))
pl_ext = cv2.GaussianBlur((cv2.dilate(near_pl, np.ones((5, 5), np.uint8)) * (polymask(P['platform']['poly'], 60) > 0)).astype(np.float32), (0, 0), 14)
pl_alpha = np.maximum(masks['platform'], np.minimum(pl_ext * 1.6, 255).astype(np.uint8))
save('platform', pl_rgb, pl_alpha)
for k in ('fgL', 'fgR'): save(k, img, masks[k])
# reconstructed-pixel map (for review)
recon = np.maximum.reduce([hole_bg, hole_cl])
Image.fromarray(recon).save(f'{OUT}/_reconstructed.png')

# ---------------------------------------------------------------- the figure: boots kept, painted slab removed
fb = np.array(Image.open('assets/derived/duel-master-full-body-matte.png'))
a = fb[..., 3].copy()
boots = np.zeros_like(a); boots[1180:1361, 255:440] = 255; boots[1200:1366, 660:860] = 255
slab = a.copy(); slab[:1290] = 0
fig_a = a.copy(); fig_a[1290:] = np.minimum(a[1290:], boots[1290:])
Image.fromarray(np.dstack([fb[..., :3], fig_a]), 'RGBA').save(f'{OUT}/figure.png', optimize=True)
Image.fromarray(np.dstack([fb[..., :3], np.minimum(slab, 255 - boots)]), 'RGBA').save(f'{OUT}/figure-slab.png', optimize=True)
ys = np.where(fig_a.max(1) > 128)[0]
feet_y = int(ys.max())
xs = np.where(fig_a[feet_y - 6] > 128)[0]

meta = dict(size=[W, H], horizon=HZ, depths={**{k: v['L'] for k, v in P.items() if v['L']}, **DEPTH},
            platform_rule='L(y) = (765 - 420) / (y - 420)', feet_master=[780, 765], fig_height_master=150,
            figure=dict(size=[fb.shape[1], fb.shape[0]], feet=[int((xs.min() + xs.max()) / 2), feet_y], top=int(ys.min())))
json.dump(meta, open('assets/derived/layers.json', 'w'), indent=1)
print(json.dumps(meta['figure']))

# ---------------------------------------------------------------- the breakdown sheet
order = ['sky', 'mountains', 'valley', 'cliffL', 'cliffR', 'platform', 'fgL', 'fgR']
tiles = []
for k in order:
    im = Image.open(f'{OUT}/{k}.png'); bg = Image.new('RGB', im.size, (255, 0, 200)); bg.paste(im, (0, 0), im)
    d = ImageDraw.Draw(bg); L = meta['depths'].get(k, 'ground strips L(y)')
    d.rectangle([0, 0, 520, 46], fill=(0, 0, 0)); d.text((10, 8), f'{k}   depth L = {L}', fill=(255, 255, 255), font=ImageFont.load_default(30))
    tiles.append(bg.resize((836, 470)))
rc = Image.open(f'{OUT}/_reconstructed.png').convert('L').resize((836, 470))
recon_tile = Image.blend(Image.fromarray(img).resize((836, 470)), Image.merge('RGB', [rc, Image.new('L', rc.size, 0), Image.new('L', rc.size, 0)]), 0.45)
ImageDraw.Draw(recon_tile).text((10, 8), 'red = reconstructed (inpainted) pixels', fill=(255, 255, 255), font=ImageFont.load_default(30))
tiles.append(recon_tile)
sheet = Image.new('RGB', (836 * 3, 470 * 3), (0, 0, 0))
for i, t in enumerate(tiles): sheet.paste(t, ((i % 3) * 836, (i // 3) * 470))
os.makedirs('docs', exist_ok=True); sheet.save('docs/depth-layers.jpg', quality=85)
