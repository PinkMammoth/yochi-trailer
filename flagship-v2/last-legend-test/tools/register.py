"""Pose registration: Pose A (collapse) vs Pose B (defiance).
Global: SIFT + RANSAC (similarity and homography). Local: dense DIS flow of B onto A after the global fit,
and per-region displacement / colour difference statistics. Writes assets/derived/registration.json and
diagnostic images in assets/derived/registration/."""
import json, os, sys
import cv2, numpy as np

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = cv2.imread(f'{HERE}/assets/source/last-legend-pose-a-collapse.webp')
B = cv2.imread(f'{HERE}/assets/source/last-legend-pose-b-defiance.webp')
OUT = f'{HERE}/assets/derived/registration'; os.makedirs(OUT, exist_ok=True)
h, w = A.shape[:2]
ga, gb = cv2.cvtColor(A, cv2.COLOR_BGR2GRAY), cv2.cvtColor(B, cv2.COLOR_BGR2GRAY)

sift = cv2.SIFT_create(8000)
ka, da = sift.detectAndCompute(ga, None); kb, db = sift.detectAndCompute(gb, None)
m = cv2.BFMatcher().knnMatch(db, da, k=2)
good = [x for x, y in m if x.distance < 0.75 * y.distance]
pb = np.float32([kb[g.queryIdx].pt for g in good]); pa = np.float32([ka[g.trainIdx].pt for g in good])
S, inl = cv2.estimateAffinePartial2D(pb, pa, method=cv2.RANSAC, ransacReprojThreshold=2.0, maxIters=20000)
inl = inl.ravel().astype(bool)
res = np.linalg.norm((pb[inl] @ S[:, :2].T + S[:, 2]) - pa[inl], axis=1)
scale = float(np.hypot(S[0, 0], S[1, 0])); rot = float(np.degrees(np.arctan2(S[1, 0], S[0, 0])))
print(f'matches {len(good)}  similarity inliers {inl.sum()}  scale {scale:.4f} rot {rot:.3f} deg  t {S[:,2]}  median res {np.median(res):.2f}px')
Bw = cv2.warpAffine(B, S, (w, h), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)

# dense flow A -> B-registered (where each A pixel went)
dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_ULTRAFAST)
dis.setFinestScale(0); dis.setPatchSize(12); dis.setPatchStride(4); dis.setGradientDescentIterations(25)
flow = dis.calc(ga, cv2.cvtColor(Bw, cv2.COLOR_BGR2GRAY), None)
mag = np.linalg.norm(flow, axis=2)
lab_a = cv2.cvtColor(A, cv2.COLOR_BGR2LAB).astype(np.float32); lab_b = cv2.cvtColor(Bw, cv2.COLOR_BGR2LAB).astype(np.float32)
de = np.linalg.norm(cv2.GaussianBlur(lab_a, (0, 0), 3) - cv2.GaussianBlur(lab_b, (0, 0), 3), axis=2)

# regions (source px, both images share the canvas); boxes drawn by eye on the paintings, then checked on the heatmaps
R = {
  'head_neck':        (560, 60, 830, 380),
  'left_pauldron':    (90, 40, 560, 420),
  'right_shoulder_cloth': (760, 120, 1130, 420),
  'torso_chest':      (440, 300, 800, 560),
  'right_forearm_hand': (760, 380, 1120, 640),
  'left_arm_bracer':  (190, 380, 450, 1030),
  'planted_fist':     (210, 1020, 450, 1240),
  'belt_sash':        (380, 560, 820, 760),
  'kneeling_leg_boot':(800, 640, 1130, 1210),
  'lower_garment':    (380, 760, 820, 1180),
  'red_cloth_left':   (0, 380, 260, 1120),
  'floor_cloth':      (380, 1100, 1050, 1290),
}
stats = {}
for k, (x0, y0, x1, y1) in R.items():
    mm = mag[y0:y1, x0:x1]; dd = de[y0:y1, x0:x1]
    stats[k] = dict(box=[x0, y0, x1, y1], flow_med=round(float(np.median(mm)), 2), flow_p90=round(float(np.percentile(mm, 90)), 2),
                    dE_med=round(float(np.median(dd)), 2), dE_p90=round(float(np.percentile(dd, 90)), 2))
    print(f'{k:22s} flow med {stats[k]["flow_med"]:6.2f} p90 {stats[k]["flow_p90"]:6.2f}   dE med {stats[k]["dE_med"]:6.2f} p90 {stats[k]["dE_p90"]:6.2f}')

# change mask: where the painting differs after the global fit (structure moved or colour changed)
chg = ((mag > 3.0) | (de > 14)).astype(np.uint8) * 255
chg = cv2.morphologyEx(chg, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
chg = cv2.morphologyEx(chg, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
cv2.imwrite(f'{OUT}/change-mask-raw.png', chg)
heat = cv2.applyColorMap(np.clip(mag * 12, 0, 255).astype(np.uint8), cv2.COLORMAP_INFERNO)
cv2.imwrite(f'{OUT}/flow-magnitude.jpg', cv2.addWeighted(A, 0.35, heat, 0.65, 0))
dheat = cv2.applyColorMap(np.clip(de * 5, 0, 255).astype(np.uint8), cv2.COLORMAP_INFERNO)
cv2.imwrite(f'{OUT}/colour-difference.jpg', cv2.addWeighted(A, 0.35, dheat, 0.65, 0))
cv2.imwrite(f'{OUT}/pose-b-registered.png', Bw)
ov = A.copy().astype(np.float32); ov[..., 2] = cv2.cvtColor(A, cv2.COLOR_BGR2GRAY); ov[..., 1] = cv2.cvtColor(Bw, cv2.COLOR_BGR2GRAY); ov[..., 0] = ov[..., 1]
cv2.imwrite(f'{OUT}/onion-red-A-cyan-B.jpg', ov.astype(np.uint8))
np.save(f'{OUT}/flow.npy', flow.astype(np.float16))
json.dump(dict(B_to_A_similarity=S.tolist(), scale=scale, rot_deg=rot, inliers=int(inl.sum()), matches=len(good),
               median_residual_px=float(np.median(res)), regions=stats), open(f'{HERE}/assets/derived/registration.json', 'w'), indent=1)
