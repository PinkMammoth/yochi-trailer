#!/usr/bin/env python3
"""Cold Blooded v2 layers (non-destructive: original pixels + alpha, B resampled only to register it onto A's canvas).
A = mask lowered (new), B = mask raised (approved defeat painting), B registered onto A (similarity, tools/register_cb.py).
  cb-A.png, cb-B.png          the two figures (refined mattes), on A's canvas (1086x1448)
  cb-Ahand.png                A's mask + hand + wrist (the lift starts with his own hand)
  cb-Bhand.png                B's mask + hand + forearm + sleeve opening (the piece that rises over his face)
  cb-base1.png                A with B's chest behind A's hand (what the first 40 px of the lift uncovers)
  cb-base2.png                the shot-2 base: A's head above, B's chest and sleeve (hanging from a raised arm) below
  cb-change.png               the measured change region (method A's masked cut)
"""
import json, os, cv2, numpy as np
from PIL import Image
H = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); D = f'{H}/assets/derived'; OUT = f'{D}/layers'; os.makedirs(OUT, exist_ok=True)
reg = json.load(open(f'{D}/cb-registration.json')); S = np.array(reg['B_to_A'], np.float32)
A = np.array(Image.open(f'{H}/assets/source/cold-blooded-mask-lowered.webp').convert('RGB'))
B = np.array(Image.open(f'{H}/assets/source/cold-blooded-mask-raised.webp').convert('RGB'))
h, w = A.shape[:2]

# ---- mattes: the house GrabCut (../film/tools/matte.py) refined as in the v1 test (paper gaps by seed, ink fringe)
v1 = open(f'{H}/../cast-performance-test/tools/prep.py').read()
exec(v1[v1.index('def paper_distance'):v1.index('def save_rgba')])
def raw(p): return np.array(Image.open(p))[..., 3].astype(np.float32) / 255
aA = refine(A, raw(f'{D}/cb-A-matte.png'), fringe=40, gaps=[])
aB = np.array(Image.open(f'{H}/../cast-performance-test/assets/derived/layers/cb-fig.png'))[..., 3].astype(np.float32) / 255   # v1's refined matte of B
Bw = cv2.warpAffine(np.dstack([B, (aB * 255).astype(np.uint8)]), S, (w, h), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
Afig = np.dstack([A, (aA * 255).astype(np.uint8)])
Image.fromarray(Afig).save(f'{OUT}/cb-A.png'); Image.fromarray(Bw).save(f'{OUT}/cb-B.png')

def poly_mask(P, feather=2.0):
    m = np.zeros((h, w), np.uint8); cv2.fillPoly(m, [np.array(P, np.int32)], 1)
    return cv2.GaussianBlur(m.astype(np.float32), (0, 0), feather)
def rgba(img, a): return np.dstack([img[..., :3], (np.clip(a, 0, 1) * 255).astype(np.uint8)])

PA = [(612, 520), (625, 470), (690, 418), (735, 395), (770, 430), (786, 520), (830, 554), (872, 580), (902, 630), (910, 700), (914, 768), (830, 778), (800, 726), (760, 714), (700, 712), (640, 690), (612, 600)]
PB = [(606, 150), (640, 104), (690, 108), (730, 188), (760, 258), (800, 272), (836, 308), (852, 378), (858, 468), (884, 500), (908, 540), (908, 578), (735, 578), (745, 500), (740, 416), (700, 400), (650, 403), (606, 392), (600, 330)]
mA = poly_mask(PA); mB = poly_mask(PB)
ys = np.arange(h)[:, None].astype(np.float32)
feA = np.clip((775 - ys) / 45, 0, 1); feB = np.clip((578 - ys) / 50, 0, 1)
Image.fromarray(rgba(A, mA * aA * feA)).save(f'{OUT}/cb-Ahand.png')
Image.fromarray(rgba(Bw, mB * Bw[..., 3] / 255 * feB)).save(f'{OUT}/cb-Bhand.png')

# ---- base1: A, with B's chest behind A's hand (B's own arm is up at the face there, so its chest is clear)
fp = cv2.GaussianBlur(cv2.dilate((mA > 0.5).astype(np.uint8), np.ones((15, 15), np.uint8)).astype(np.float32), (0, 0), 4)
fp *= (np.arange(h)[:, None] > 460)                     # only below B's arm
c1 = A * (1 - fp[..., None]) + Bw[..., :3] * fp[..., None]
a1 = aA * (1 - fp) + Bw[..., 3] / 255 * fp


# ---- base2: A's head above; B's chest and sleeve below (consistent with a raised arm); never B's arm at its final place
R = np.zeros((h, w), np.float32)
R[440:, 556:] = 1
R = cv2.GaussianBlur(R, (0, 0), 7) * (1 - np.clip(mB * 1.5, 0, 1) * feB)   # where the moving layer fades out, the base is B, so at rest they sum to B
c2 = A * (1 - R[..., None]) + Bw[..., :3] * R[..., None]
aA_noHand = aA * (1 - np.clip(cv2.GaussianBlur(cv2.dilate((mA > 0.5).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(np.float32), (0, 0), 2), 0, 1))
a2 = aA_noHand * (1 - R) + Bw[..., 3] / 255 * R      # where A is kept, A's own mask and hand are gone (they're the moving layer)
Image.fromarray(rgba(c2.astype(np.uint8), a2)).save(f'{OUT}/cb-base2.png')
Image.fromarray(rgba(c1.astype(np.uint8), a1)).save(f'{OUT}/cb-base1.png')   # shot 1: exactly A, with B's chest only where A's hand uncovers it

# ---- method A's change region: where the two paintings differ in structure (flow > 3 px or dE > 22), closed and filled
flow = np.load(f'{D}/reg/cb-flow.npy').astype(np.float32); mag = np.linalg.norm(flow, axis=2)
la = cv2.cvtColor(A, cv2.COLOR_RGB2LAB).astype(np.float32); lb = cv2.cvtColor(Bw[..., :3], cv2.COLOR_RGB2LAB).astype(np.float32)
de = np.linalg.norm(cv2.GaussianBlur(la, (0, 0), 3) - cv2.GaussianBlur(lb, (0, 0), 3), axis=2)
sil = np.abs(aA - Bw[..., 3] / 255) > 0.4
chg = ((mag > 4) | (de > 24) | sil).astype(np.uint8); chg[:, :430] = 0
chg = cv2.morphologyEx(chg, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(chg, 8)
big = np.zeros_like(chg)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] > 2000: big[lab == i] = 1
big = cv2.morphologyEx(big, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (61, 61)))
ff = np.pad(big.copy(), 1); cv2.floodFill(ff, np.zeros((h + 4, w + 4), np.uint8), (0, 0), 2); big = (ff[1:-1, 1:-1] != 2).astype(np.uint8)
big = cv2.dilate(big, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
M = cv2.GaussianBlur(big.astype(np.float32), (0, 0), 14)
Image.fromarray((M * 255).astype(np.uint8)).save(f'{OUT}/cb-change.png')
print('change region: fraction of figure', round(float(((M > 0.5) & (aA > 0.5)).sum() / (aA > 0.5).sum()), 3))
# checks
chk = lambda rgba_: (rgba_[..., :3].astype(np.float32) * (rgba_[..., 3:4] / 255) + np.array([255, 0, 255]) * (1 - rgba_[..., 3:4] / 255)).astype(np.uint8)
row = np.hstack([chk(np.array(Image.open(f'{OUT}/{n}.png'))) for n in ('cb-A', 'cb-B', 'cb-Ahand', 'cb-Bhand', 'cb-base1', 'cb-base2')])
Image.fromarray(row).resize((row.shape[1] // 3, row.shape[0] // 3)).save(f'{D}/reg/cb-layers.jpg', quality=86)
vis = A.astype(np.float32) * 0.5; vis[..., 0] += M * 120
Image.fromarray(vis.clip(0, 255).astype(np.uint8)).save(f'{D}/reg/cb-change.jpg', quality=86)
