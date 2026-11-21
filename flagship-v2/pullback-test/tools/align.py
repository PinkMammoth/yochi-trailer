"""Continuity analysis: where does the approved victory pose sit inside the new full-body illustration?
SIFT features + RANSAC similarity (scale, rotation, translation). Writes the transform and an overlay sheet."""
import json, sys, numpy as np, cv2
from PIL import Image
V = cv2.imread('../film/assets/poses/duel-master-victory.webp'); F = cv2.imread('assets/source/duel-master-full-body.webp')
Vm = np.array(Image.open('../film/assets/mattes/duel-master-victory.png'))[..., 3]
sift = cv2.SIFT_create(8000)
kv, dv = sift.detectAndCompute(cv2.cvtColor(V, cv2.COLOR_BGR2GRAY), (Vm > 128).astype(np.uint8) * 255)
kf, df = sift.detectAndCompute(cv2.cvtColor(F, cv2.COLOR_BGR2GRAY), None)
m = cv2.BFMatcher().knnMatch(dv, df, k=2)
good = [a for a, b in m if a.distance < 0.75 * b.distance]
src = np.float32([kv[g.queryIdx].pt for g in good]); dst = np.float32([kf[g.trainIdx].pt for g in good])
M, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=4.0, maxIters=20000)
inl = inl.ravel().astype(bool)
s = float(np.hypot(M[0, 0], M[1, 0])); rot = float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))
res = np.linalg.norm((src[inl] @ M[:, :2].T + M[:, 2]) - dst[inl], axis=1)
# where do inliers lie (which body parts match)?
print(json.dumps(dict(matches=len(good), inliers=int(inl.sum()), scale=s, rotation_deg=rot, tx=float(M[0, 2]), ty=float(M[1, 2]),
                      resid_median=float(np.median(res)), resid_p90=float(np.percentile(res, 90))), indent=1))
json.dump(dict(M=M.tolist(), scale=s, rot=rot, inliers=int(inl.sum()), resid_median=float(np.median(res))), open('assets/derived/victory_to_fullbody.json', 'w'), indent=1)
# overlay: victory warped into full-body space, blended
W = cv2.warpAffine(V, M, (F.shape[1], F.shape[0]), borderValue=(255, 255, 255))
Wm = cv2.warpAffine(Vm, M, (F.shape[1], F.shape[0]))
blend = F.copy(); a = (Wm[..., None] / 255.0) * 0.5
blend = (F * (1 - a) + W * a).astype(np.uint8)
diff = cv2.absdiff(cv2.cvtColor(F, cv2.COLOR_BGR2GRAY), cv2.cvtColor(W, cv2.COLOR_BGR2GRAY)); diff[Wm < 128] = 0
diffc = cv2.applyColorMap(cv2.convertScaleAbs(diff, alpha=2), cv2.COLORMAP_INFERNO)
for p in dst[inl]: cv2.circle(blend, (int(p[0]), int(p[1])), 3, (0, 200, 0), -1)
sheet = np.hstack([F, W, blend, diffc]); cv2.imwrite('assets/derived/continuity-overlay.jpg', cv2.resize(sheet, None, fx=0.5, fy=0.5))
