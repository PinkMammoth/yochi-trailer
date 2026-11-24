"""Derived layers for the Last Legend two-pose test (non-destructive: the painted RGB is never altered, only resampled
for registration and given alpha).
  pose-a-fig.png         Pose A, original pixels + refined alpha                (canvas = Pose A, 1199x1312)
  pose-b-fig-reg.png     Pose B registered onto Pose A's canvas (similarity, 0.76 px median) + its alpha, same warp
  floor-ink-{a,b}.png    the painted floor's ink (contact shadows) as alpha, for laying onto the arena stone
  change-mask.png        where the two paintings differ in structure (head, neck, upper chest, right shoulder cloth,
                         right forearm): the region the pose change is confined to, feathered inside the registered zone
  arena-back.png, arena-floor.png   the approved arena painting's DOWN side (backdrop) and its paved landing (floor)
"""
import json, os, cv2, numpy as np
from PIL import Image
H = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = f'{H}/assets/derived'; OUT = f'{D}/layers'; os.makedirs(OUT, exist_ok=True)
reg = json.load(open(f'{D}/registration.json')); S = np.array(reg['B_to_A_similarity'])
fa = np.array(Image.open(f'{D}/pose-a-collapse-fig.png')); fb = np.array(Image.open(f'{D}/pose-b-defiance-fig.png'))
h, w = fa.shape[:2]
fbr = cv2.warpAffine(fb, S, (w, h), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
# the cape runs off the painting's left edge (462 rows) and the floor cloth off its right edge: a ruler-straight cut
# once he stands in the arena. Alpha only: a ragged, torn-cloth falloff over the last ~45 px of the canvas, the same
# for both poses (they share the canvas). No pixel is painted.
rr = np.random.default_rng(11)
def ragged(n, amp, smooth):
    v = cv2.GaussianBlur(rr.standard_normal((n, 1)).astype(np.float32), (1, 0), smooth).ravel()
    v2 = cv2.GaussianBlur(rr.standard_normal((n, 1)).astype(np.float32), (1, 0), 2).ravel()
    return amp * (0.5 + 0.5 * np.tanh(2.2 * v / (v.std() + 1e-6))) + 6 * v2 / (v2.std() + 1e-6)
xs = np.arange(w)[None, :].astype(np.float32)
dl = ragged(h, 34, 9)[:, None] + 6; dr = ragged(h, 30, 9)[:, None] + 6
edge = np.clip((xs - dl) / 5, 0, 1) * np.clip(((w - 1 - xs) - dr) / 5, 0, 1)
for f in (fa, fbr): f[..., 3] = (f[..., 3].astype(np.float32) * edge).astype(np.uint8)
Image.fromarray(fa).save(f'{OUT}/pose-a-fig.png'); Image.fromarray(fbr).save(f'{OUT}/pose-b-fig-reg.png')
for k, n in (('a', 'pose-a-collapse'), ('b', 'pose-b-defiance')):
    ink = np.array(Image.open(f'{D}/{n}-floor-ink.png'))
    if k == 'b': ink = cv2.warpAffine(ink, S, (w, h), flags=cv2.INTER_LINEAR)
    ink = (ink.astype(np.float32) * np.clip(np.minimum(np.arange(w), w - 1 - np.arange(w))[None, :] / 90, 0, 1)).astype(np.uint8)
    rgba = np.dstack([np.full_like(ink, 22), np.full_like(ink, 19), np.full_like(ink, 15), ink])  # sumi ink, alpha = the painted ink
    Image.fromarray(rgba).save(f'{OUT}/floor-ink-{k}.png')

# change mask: the measured structural change (flow > 3 px or dE > 14), upper body only, plus the union of both
# silhouettes' differences up there, closed and filled, then feathered. The feather (sigma 18 px) must fall where
# the two paintings register, so the mask is grown 30 px before blurring and checked against the flow map.
flow = np.load(f'{D}/registration/flow.npy').astype(np.float32); mag = np.linalg.norm(flow, axis=2)
la = cv2.cvtColor(fa[..., :3], cv2.COLOR_RGB2LAB).astype(np.float32); lb = cv2.cvtColor(fbr[..., :3], cv2.COLOR_RGB2LAB).astype(np.float32)
de = np.linalg.norm(cv2.GaussianBlur(la, (0, 0), 3) - cv2.GaussianBlur(lb, (0, 0), 3), axis=2)
sil = np.abs(fa[..., 3].astype(np.float32) - fbr[..., 3].astype(np.float32)) > 100
chg = ((mag > 3.0) | (de > 22) | sil).astype(np.uint8)
chg[700:] = 0                                   # nothing below the belt changes structurally
chg = cv2.morphologyEx(chg, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(chg, 8)
big = np.zeros_like(chg)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] > 1500: big[lab == i] = 1
big = cv2.morphologyEx(big, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (61, 61)))
ff = np.pad(big.copy(), 1); cv2.floodFill(ff, np.zeros((h + 4, w + 4), np.uint8), (0, 0), 2); big = (ff[1:-1, 1:-1] != 2).astype(np.uint8)
big = cv2.dilate(big, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (61, 61)))
m = cv2.GaussianBlur(big.astype(np.float32), (0, 0), 18)
Image.fromarray((m * 255).astype(np.uint8)).save(f'{OUT}/change-mask.png')
ys, xs = np.where(m > 0.02)
area_fig = (fa[..., 3] > 128).sum(); area_m = ((m > 0.5) & ((fa[..., 3] > 128) | (fbr[..., 3] > 128))).sum()
edge = (m > 0.05) & (m < 0.95)
info = dict(mask_bbox=[int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())], figure_fraction_changed=round(float(area_m / area_fig), 3),
            flow_in_feather_p90=round(float(np.percentile(mag[edge], 90)), 2), flow_in_feather_med=round(float(np.median(mag[edge])), 2))
print(info); json.dump(info, open(f'{OUT}/change-mask.json', 'w'), indent=1)

# arena (approved painting, as received 2000x1125): backdrop = the DOWN side (right terraces, the banner platform,
# cliffs, mist); floor = the paved landing at the foot of the right stairs
ar = np.array(Image.open(f'{H}/../pullback-test/assets/source/arena-master-v2-as-received.webp').convert('RGB'))
Image.fromarray(ar[90:900, 860:2000]).save(f'{OUT}/arena-back.png')
Image.fromarray(ar[1030:1125, 1468:1842]).save(f'{OUT}/arena-floor.png')
vis = fa[..., :3].astype(np.float32) * 0.55; vis[..., 0] += m * 120; vis[..., 2] += (1 - m) * 0
cv2.imwrite(f'{D}/registration/change-mask-overlay.jpg', cv2.cvtColor(vis.clip(0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
