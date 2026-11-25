"""Cold Blooded: register the mask-raised painting (B) onto the mask-lowered painting (A); dense flow; per-region stats."""
import json, os, cv2, numpy as np
H = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); R = f'{H}/assets/derived/reg'
A = cv2.imread(f'{H}/assets/source/cold-blooded-mask-lowered.webp'); B = cv2.imread(f'{H}/assets/source/cold-blooded-mask-raised.webp')
h, w = A.shape[:2]; ga, gb = [cv2.cvtColor(x, cv2.COLOR_BGR2GRAY) for x in (A, B)]
sift = cv2.SIFT_create(10000); ka, da = sift.detectAndCompute(ga, None); kb, db = sift.detectAndCompute(gb, None)
good = [m for m, n in cv2.BFMatcher().knnMatch(db, da, k=2) if m.distance < 0.75 * n.distance]
pb = np.float32([kb[g.queryIdx].pt for g in good]); pa = np.float32([ka[g.trainIdx].pt for g in good])
S, inl = cv2.estimateAffinePartial2D(pb, pa, method=cv2.RANSAC, ransacReprojThreshold=2.0, maxIters=20000); inl = inl.ravel() > 0
res = np.linalg.norm(pb[inl] @ S[:, :2].T + S[:, 2] - pa[inl], axis=1)
sc = float(np.hypot(*S[:, 0])); rot = float(np.degrees(np.arctan2(S[1, 0], S[0, 0])))
print(f'matches {len(good)} inliers {inl.sum()} scale {sc:.4f} rot {rot:.3f} t {S[:,2].round(2)} median res {np.median(res):.2f}')
# where are the inliers? (a body-only fit if the head region dominates)
Bw = cv2.warpAffine(B, S, (w, h), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_ULTRAFAST); dis.setFinestScale(0); dis.setPatchSize(12); dis.setPatchStride(4); dis.setGradientDescentIterations(25)
flow = dis.calc(ga, cv2.cvtColor(Bw, cv2.COLOR_BGR2GRAY), None); mag = np.linalg.norm(flow, axis=2)
la, lb = [cv2.GaussianBlur(cv2.cvtColor(x, cv2.COLOR_BGR2LAB).astype(np.float32), (0, 0), 3) for x in (A, Bw)]
de = np.linalg.norm(la - lb, axis=2)
REG = {'head_face': (380, 220, 720, 470), 'mask_A_region': (620, 390, 860, 720), 'mask_B_region': (600, 200, 880, 460), 'raised_forearm_sleeve': (700, 420, 940, 1000),
       'fur_collar': (60, 280, 600, 1000), 'chest_cords_medallion': (480, 560, 760, 1000), 'sash_belt': (440, 820, 840, 1080), 'lower_robe': (100, 1080, 1086, 1448),
       'left_hand_sleeve': (240, 1020, 460, 1448), 'hair_pin_bun': (200, 0, 620, 300), 'right_robe_edge': (880, 600, 1086, 1300)}
st = {}
for k, (x0, y0, x1, y1) in REG.items():
    m, d = mag[y0:y1, x0:x1], de[y0:y1, x0:x1]
    st[k] = dict(box=[x0, y0, x1, y1], flow_med=round(float(np.median(m)), 2), flow_p90=round(float(np.percentile(m, 90)), 2), dE_med=round(float(np.median(d)), 2))
    print(f'{k:22s} flow {st[k]["flow_med"]:6.2f} / {st[k]["flow_p90"]:6.2f}   dE {st[k]["dE_med"]:6.2f}')
cv2.imwrite(f'{R}/cb-B-registered.png', Bw)
heat = cv2.applyColorMap(np.clip(mag * 10, 0, 255).astype(np.uint8), cv2.COLORMAP_INFERNO); cv2.imwrite(f'{R}/cb-flow.jpg', cv2.addWeighted(A, .35, heat, .65, 0))
ov = np.dstack([cv2.cvtColor(Bw, cv2.COLOR_BGR2GRAY)] * 2 + [ga]); cv2.imwrite(f'{R}/cb-onion.jpg', ov)
np.save(f'{R}/cb-flow.npy', flow.astype(np.float16))
json.dump(dict(B_to_A=S.tolist(), scale=sc, rot=rot, inliers=int(inl.sum()), median_res=float(np.median(res)), regions=st), open(f'{H}/assets/derived/cb-registration.json', 'w'), indent=1)
