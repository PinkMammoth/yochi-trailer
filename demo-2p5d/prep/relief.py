"""Relief (height) map for implementation B: a soft 'inflation' of the figure's matte, so
the character plate becomes a shallow bas-relief that catches real light and parallax in
Blender. Derived from assets/char.png only; writes assets/relief.png (16-bit)."""
import os, json
import numpy as np, cv2
A = os.path.join(os.path.dirname(__file__), "..", "assets")
ch = cv2.imread(os.path.join(A, "char.png"), cv2.IMREAD_UNCHANGED)
a = ch[..., 3].astype(np.float32) / 255
h, w = a.shape
# distance from the silhouette edge, eased: interior bulges, edges stay at 0
d = cv2.distanceTransform((a > 0.5).astype(np.uint8), cv2.DIST_L2, 5)
inflate = 1 - np.exp(-d / 60.0)
yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
rig = json.load(open(os.path.join(A, "plates.json")))["rigs"]
hx, hy = rig["head_center"]
head = np.exp(-(((xx - hx) / 170) ** 2 + ((yy - hy) / 200) ** 2))
cx, cy = rig["chest_center"]
chest = np.exp(-(((xx - cx) / 260) ** 2 + ((yy - cy) / 220) ** 2))
r = 0.55 * inflate + 0.3 * head + 0.25 * chest
r = cv2.GaussianBlur(r * a, (0, 0), 6)
r = np.clip(r / r.max(), 0, 1)
cv2.imwrite(os.path.join(A, "relief.png"), (r * 65535).astype(np.uint16))
print("relief ok", r.mean())
