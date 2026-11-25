"""Untouchable hybrid canvas (non-destructive): the approved landscape (L) scaled to the portrait's figure scale, with the
approved portrait (P) composited where the two paintings agree (low flow), and L locally warped onto P's geometry in a
band around the seam so strokes continue across it.
Writes layers/un-hybrid.png (canvas = L x 1/0.6347 = 2634x1483), layers/un-w.png (the portrait weight), reg/un-seam.jpg."""
import json, os, cv2, numpy as np
H = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); D = f'{H}/assets/derived'; OUT = f'{D}/layers'; os.makedirs(OUT, exist_ok=True)
reg = json.load(open(f'{D}/un-registration.json'))
Lup = cv2.imread(f'{D}/reg/un-L-up.png').astype(np.float32); Pw = cv2.imread(f'{D}/reg/un-P-on-L.png').astype(np.float32)
CH, CW = Lup.shape[:2]
flow = np.load(f'{D}/reg/un-flow.npy').astype(np.float32)   # Pw(x) ~ Lup(x + f(x))
T = np.array(reg['P_to_Lup'], np.float32)
P = cv2.imread(f'{H}/assets/source/untouchable-portrait.webp')
valid = cv2.warpAffine(np.full(P.shape[:2], 255, np.uint8), T, (CW, CH))
inner = cv2.erode(valid, np.ones((61, 61), np.uint8)).astype(np.float32) / 255        # stay 30 px inside the portrait's canvas
mag = cv2.GaussianBlur(np.linalg.norm(flow, axis=2), (0, 0), 10)
# P's own figure (ink): only figure pixels come from P (never P's paper or P's moon, which disagree with L)
lab = cv2.cvtColor(Pw.clip(0, 255).astype(np.uint8), cv2.COLOR_BGR2LAB).astype(np.float32)
pap = np.median(lab[(valid > 0) & (cv2.GaussianBlur(lab[..., 0], (0, 0), 3) > 175)], axis=0)
pd = cv2.GaussianBlur(np.linalg.norm(lab - pap, axis=2), (0, 0), 2)
# the body: P's figure footprint, the authored core polygon (portrait px -> canvas)
CORE = np.float32([(400, 30), (530, 20), (640, 120), (655, 260), (705, 340), (785, 420), (805, 560), (765, 740), (725, 800), (700, 880),
                   (700, 1200), (420, 1200), (380, 1000), (345, 900), (360, 700), (300, 560), (300, 450), (400, 400), (410, 260), (380, 120)])
poly = (CORE @ T[:, :2].T + T[:, 2]).astype(np.int32)
body = np.zeros((CH, CW), np.uint8); cv2.fillPoly(body, [poly], 1)
cv2.line(body, tuple((np.float32([470, 470]) @ T[:, :2].T + T[:, 2]).astype(int)), tuple((np.float32([915, 1060]) @ T[:, :2].T + T[:, 2]).astype(int)), 1, 40)
bodyf = cv2.GaussianBlur(cv2.dilate(body, np.ones((25, 25), np.uint8)).astype(np.float32), (0, 0), 12)
agree = np.clip((11 - mag) / 6, 0, 1)
w = agree * bodyf * inner
w = cv2.GaussianBlur(w, (0, 0), 6)
w = np.clip(w * 1.15, 0, 1)
# seam warp: L pulled onto P's geometry where P is used or nearly used (k), fading out over ~80 px
k = np.clip(cv2.GaussianBlur((w > 0.02).astype(np.float32), (0, 0), 30) * 2.2, 0, 1)
fc = np.clip(flow, -28, 28) * k[..., None]
gx, gy = np.meshgrid(np.arange(CW, dtype=np.float32), np.arange(CH, dtype=np.float32))
Lw = cv2.remap(Lup, gx + fc[..., 0], gy + fc[..., 1], cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
hyb = Pw * w[..., None] + Lw * (1 - w[..., None])
cv2.imwrite(f'{OUT}/un-hybrid.png', hyb.clip(0, 255).astype(np.uint8))
cv2.imwrite(f'{OUT}/un-w.png', (w * 255).astype(np.uint8))
cv2.imwrite(f'{OUT}/un-body.png', (cv2.dilate(body, np.ones((9, 9), np.uint8)) * 255))
vis = hyb.copy() * 0.6; vis[..., 2] += w * 100; vis[..., 0] += k * (1 - w) * 80
cv2.imwrite(f'{D}/reg/un-seam.jpg', cv2.resize(vis.clip(0, 255).astype(np.uint8), (CW // 2, CH // 2)))
print('hybrid', CW, CH, 'portrait share of body', round(float((w > 0.5).sum() / body.sum()), 3))
