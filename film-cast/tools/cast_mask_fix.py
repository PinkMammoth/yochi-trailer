"""Matte fixes for the three cards BiRefNet reads as all-figure on the full card (busy grounds):
re-run both models on the painting alone (frame cropped off) and combine, then write the result back into
assets/cast/raw/<id>.png at card size. Model outputs are cached in assets/cast/raw/alt/.
  bughunter       BiRefNet on the crop is clean
  grudge-settled  BiRefNet ∩ boosted ISNet: drops most of the ground; her own red brush ground stays behind her
  lab-rat         boosted ISNet only (shape for the silhouette; the full painting is never shown cut out)
usage: python3 tools/cast_mask_fix.py"""
import os
import numpy as np
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
raw = os.path.join(here, '..', 'assets', 'cast', 'raw')
src = os.path.join(here, '..', '..', 'asset-pack', 'sumi', 'avatars', 'cards')
X0, Y0, X1, Y1 = 72, 150, 1464, 1978

def model(n, m):
    p = os.path.join(raw, 'alt', f'{n}-{m}.png')
    if not os.path.exists(p):
        from rembg import remove, new_session
        im = Image.open(os.path.join(src, n + '.webp')).convert('RGB').crop((X0, Y0, X1, Y1))
        remove(im, session=new_session({'birefnet': 'birefnet-general', 'isnet': 'isnet-general-use'}[m]), only_mask=True).save(p)
    return np.array(Image.open(p).convert('L'), np.float32)

for n, how in [('bughunter', 'bi'), ('grudge-settled', 'both'), ('lab-rat', 'isnet')]:
    if how == 'bi': m = model(n, 'birefnet')
    elif how == 'both': m = np.minimum(model(n, 'birefnet'), np.clip(model(n, 'isnet') * 1.6, 0, 255))
    else: m = np.clip((model(n, 'isnet') - 20) * 3.5, 0, 255)
    full = np.zeros((2048, 1536), np.uint8); full[Y0:Y1, X0:X1] = m.astype(np.uint8)
    Image.fromarray(full).save(os.path.join(raw, n + '.png'))
    print(n, how)
