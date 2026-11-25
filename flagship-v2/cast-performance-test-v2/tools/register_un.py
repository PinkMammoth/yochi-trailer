"""Untouchable: register the approved portrait (P, 1024x1536) onto the new landscape (L, 1672x941). Similarity + per-region flow."""
import json, os, cv2, numpy as np
H = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); R = f'{H}/assets/derived/reg'
P = cv2.imread(f'{H}/assets/source/untouchable-portrait.webp'); L = cv2.imread(f'{H}/assets/source/untouchable-landscape.webp')
gp, gl = [cv2.cvtColor(x, cv2.COLOR_BGR2GRAY) for x in (P, L)]
sift = cv2.SIFT_create(12000); kp, dp = sift.detectAndCompute(gp, None); kl, dl = sift.detectAndCompute(gl, None)
good = [m for m, n in cv2.BFMatcher().knnMatch(dp, dl, k=2) if m.distance < 0.75 * n.distance]
pp = np.float32([kp[g.queryIdx].pt for g in good]); pl = np.float32([kl[g.trainIdx].pt for g in good])
S, inl = cv2.estimateAffinePartial2D(pp, pl, method=cv2.RANSAC, ransacReprojThreshold=2.5, maxIters=30000); inl = inl.ravel() > 0
res = np.linalg.norm(pp[inl] @ S[:, :2].T + S[:, 2] - pl[inl], axis=1)
sc = float(np.hypot(*S[:, 0])); rot = float(np.degrees(np.arctan2(S[1, 0], S[0, 0])))
print(f'P->L: matches {len(good)} inliers {inl.sum()} scale {sc:.4f} rot {rot:.3f} t {S[:,2].round(1)} median res {np.median(res):.2f}')
ip = pp[inl]; print('inlier extent in portrait px: x', ip[:, 0].min().round(), ip[:, 0].max().round(), ' y', ip[:, 1].min().round(), ip[:, 1].max().round())
# work at portrait scale: L scaled up by 1/sc so the figure matches the portrait 1:1
Si = cv2.invertAffineTransform(S)
CW, CH = int(round(L.shape[1] / sc)), int(round(L.shape[0] / sc))
Lup = cv2.resize(L, (CW, CH), interpolation=cv2.INTER_LANCZOS4)
off = Si[:, 2] * 1  # portrait origin in Lup coords = S's translation / sc
T = np.float32([[1, 0, S[0, 2] / sc], [0, 1, S[1, 2] / sc]]) @ np.vstack([np.float32([[np.cos(np.radians(rot)), -np.sin(np.radians(rot)), 0], [np.sin(np.radians(rot)), np.cos(np.radians(rot)), 0]]), [0, 0, 1]])
Pw = cv2.warpAffine(P, T[:2], (CW, CH), flags=cv2.INTER_LANCZOS4, borderValue=(0, 0, 0))
valid = cv2.warpAffine(np.full(gp.shape, 255, np.uint8), T[:2], (CW, CH)) > 0
dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_ULTRAFAST); dis.setFinestScale(0); dis.setPatchSize(12); dis.setPatchStride(4); dis.setGradientDescentIterations(25)
flow = dis.calc(cv2.cvtColor(Pw, cv2.COLOR_BGR2GRAY), cv2.cvtColor(Lup, cv2.COLOR_BGR2GRAY), None); mag = np.linalg.norm(flow, axis=2); mag[~valid] = 0
def at(x0, y0, x1, y1):  # boxes in PORTRAIT px
    a = np.float32([[x0, y0], [x1, y1]]) @ T[:2, :2].T + T[:2, 2]
    m = mag[int(a[0, 1]):int(a[1, 1]), int(a[0, 0]):int(a[1, 0])]; return round(float(np.median(m)), 2), round(float(np.percentile(m, 90)), 2)
REG = {'face_blindfold': (470, 90, 610, 230), 'bun_hair_top': (330, 20, 560, 120), 'torso': (420, 260, 640, 520), 'hands_hilt': (420, 420, 660, 560),
       'sword_blade': (640, 600, 920, 1060), 'moon': (640, 20, 900, 330), 'skirt_centre': (420, 700, 700, 1300), 'feet': (400, 1350, 640, 1530),
       'left_ribbons_hair': (0, 150, 330, 650), 'hem_lower_left': (60, 900, 380, 1350)}
st = {k: at(*v) for k, v in REG.items()}
for k, v in st.items(): print(f'{k:18s} flow med {v[0]:7.2f}  p90 {v[1]:7.2f}')
cv2.imwrite(f'{R}/un-L-up.png', Lup); cv2.imwrite(f'{R}/un-P-on-L.png', Pw)
ov = np.dstack([cv2.cvtColor(Lup, cv2.COLOR_BGR2GRAY)] * 2 + [cv2.cvtColor(Pw, cv2.COLOR_BGR2GRAY)]); ov[~valid] = np.dstack([cv2.cvtColor(Lup, cv2.COLOR_BGR2GRAY)] * 3)[~valid]
cv2.imwrite(f'{R}/un-onion.jpg', ov)
heat = cv2.applyColorMap(np.clip(mag * 8, 0, 255).astype(np.uint8), cv2.COLORMAP_INFERNO); cv2.imwrite(f'{R}/un-flow.jpg', cv2.addWeighted(Lup, .35, heat, .65, 0))
np.save(f'{R}/un-flow.npy', flow.astype(np.float16))
json.dump(dict(P_to_L=S.tolist(), scale=sc, rot=rot, inliers=int(inl.sum()), matches=len(good), median_res=float(np.median(res)), canvas_up=[CW, CH], P_to_Lup=T[:2].tolist(), regions=st),
          open(f'{H}/assets/derived/un-registration.json', 'w'), indent=1)
