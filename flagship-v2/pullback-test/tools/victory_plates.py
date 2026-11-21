"""The two plates derived from the approved victory pose (its pixels unchanged):
victory-feathered.png: the pose with its bottom 110 px and left 40 px feathered, so the full-body legs continue under it;
victory-paper.png: its paper with the figure removed (inpainted) and every edge feathered, to dissolve into the world."""
import numpy as np, cv2
from PIL import Image
v = np.array(Image.open('../film/assets/poses/duel-master-victory.webp').convert('RGB'))
a = np.array(Image.open('../film/assets/mattes/duel-master-victory.png'))[..., 3]
h, w = a.shape
ry = np.clip((h - 1 - np.arange(h)) / 110.0, 0, 1)[:, None]; rx = np.clip(np.arange(w) / 40.0, 0, 1)[None, :]
Image.fromarray(np.dstack([v, (a.astype(np.float32) * ry * rx).astype(np.uint8)]), 'RGBA').save('assets/derived/layers/victory-feathered.png', optimize=True)
hole = cv2.dilate((a > 10).astype(np.uint8) * 255, np.ones((15, 15), np.uint8))
small = cv2.resize(v, (w // 4, h // 4), interpolation=cv2.INTER_AREA); hs = cv2.resize(hole, (w // 4, h // 4), interpolation=cv2.INTER_NEAREST)
fill = cv2.resize(cv2.inpaint(small, (hs > 0).astype(np.uint8), 15, cv2.INPAINT_TELEA), (w, h), interpolation=cv2.INTER_CUBIC)
hb = (cv2.GaussianBlur(hole, (0, 0), 6) / 255.0)[..., None]
plate = (v * (1 - hb) + fill * hb).astype(np.uint8)
yy, xx = np.mgrid[0:h, 0:w]; e = np.minimum.reduce([xx, w - 1 - xx, yy, h - 1 - yy]).astype(np.float32)
Image.fromarray(np.dstack([plate, (np.clip(e / 140, 0, 1) ** 1.5 * 255).astype(np.uint8)]), 'RGBA').save('assets/derived/layers/victory-paper.png', optimize=True)
print('ok')
