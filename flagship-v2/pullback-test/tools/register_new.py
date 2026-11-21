"""How do the new assets relate to the first master? SIFT + RANSAC.
(1) new environment -> old master: similarity (is it the same painting, just bigger?) and per-region residuals.
(2) platform plate -> new environment: a homography for the platform's top surface (a plane), from matched texture."""
import json, numpy as np, cv2
from PIL import Image
L = lambda p: cv2.cvtColor(np.array(Image.open(p).convert('RGB')), cv2.COLOR_RGB2BGR)
old, new, plate = L('assets/source/arena-master.webp'), L('assets/source/arena-master-v2-as-received.webp'), L('assets/source/platform-plate-as-received.webp')
sift = cv2.SIFT_create(20000)
def match(a, b, ma=None, mb=None, ratio=0.75):
    ka, da = sift.detectAndCompute(cv2.cvtColor(a, cv2.COLOR_BGR2GRAY), ma); kb, db = sift.detectAndCompute(cv2.cvtColor(b, cv2.COLOR_BGR2GRAY), mb)
    m = cv2.BFMatcher().knnMatch(da, db, k=2); g = [x for x, y in m if x.distance < ratio * y.distance]
    return np.float32([ka[x.queryIdx].pt for x in g]), np.float32([kb[x.trainIdx].pt for x in g])
out = {}
# (1)
a, b = match(new, old)
M, inl = cv2.estimateAffinePartial2D(a, b, method=cv2.RANSAC, ransacReprojThreshold=3.0, maxIters=20000); inl = inl.ravel().astype(bool)
res = np.linalg.norm(a[inl] @ M[:, :2].T + M[:, 2] - b[inl], axis=1)
out['new_to_old'] = dict(M=M.tolist(), scale=float(np.hypot(M[0, 0], M[1, 0])), rot_deg=float(np.degrees(np.arctan2(M[1, 0], M[0, 0]))), matches=len(a), inliers=int(inl.sum()), resid_median=float(np.median(res)), resid_p90=float(np.percentile(res, 90)))
# residual by region (3x3 grid of the new image)
H, W = new.shape[:2]; grid = {}
pts = a[inl]
for gy in range(3):
    for gx in range(3):
        sel = (pts[:, 0] // (W / 3) == gx) & (pts[:, 1] // (H / 3) == gy)
        grid[f'{gy}{gx}'] = (int(sel.sum()), round(float(np.median(res[sel])), 2) if sel.sum() else None)
out['new_to_old']['grid_inliers_resid'] = grid
# (2) plate -> new, restricted to platform regions
mp = np.zeros(plate.shape[:2], np.uint8); cv2.fillPoly(mp, [np.int32([[180, 230], [1500, 230], [1650, 640], [1300, 640], [1250, 520], [300, 560], [180, 520]])], 255)
s = W / 1672.0
mn = np.zeros(new.shape[:2], np.uint8); cv2.fillPoly(mn, [np.int32(np.array([[330, 690], [1262, 700], [1290, 830], [300, 830]]) * s)], 255)
a2, b2 = match(plate, new, mp, mn, 0.8)
Hm, inl2 = cv2.findHomography(a2, b2, cv2.RANSAC, 4.0, maxIters=20000); inl2 = inl2.ravel().astype(bool)
p = cv2.perspectiveTransform(a2[inl2][None], Hm)[0]; r2 = np.linalg.norm(p - b2[inl2], axis=1)
out['plate_to_new'] = dict(H=Hm.tolist(), matches=len(a2), inliers=int(inl2.sum()), resid_median=float(np.median(r2)) if len(r2) else None)
json.dump(out, open('assets/derived/register_new.json', 'w'), indent=1)
print(json.dumps(out, indent=1))
# overlay of the plate warped into the new environment
warp = cv2.warpPerspective(plate, Hm, (W, H))
mw = cv2.warpPerspective(mp, Hm, (W, H))
bl = new.copy(); bl[mw > 0] = (0.5 * new[mw > 0] + 0.5 * warp[mw > 0]).astype(np.uint8)
cv2.imwrite('assets/derived/plate-on-new.jpg', np.hstack([cv2.resize(new, (1000, 562)), cv2.resize(bl, (1000, 562))]))
