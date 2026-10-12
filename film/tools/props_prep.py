# Prepare the prop textures (asset-pack/props) for the film: the glass tower blocks and the hex podiums.
# usage: python3 tools/props_prep.py      (from film/; writes assets/props/)
# glass-face-{a,b}: one face of a glass block as light on black (added to the scene as light, tinted per
# tower); podium-side: one face of the plinth, its chamfer band, the empty LED recess, the satin panel;
# podium-top: the hexagonal top, its inset pad. Each is cropped to its content and sized for the film.
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(HERE, '../../asset-pack/props'))
OUT = os.path.normpath(os.path.join(HERE, '../assets/props'))
os.makedirs(OUT, exist_ok=True)
JOBS = {
    'glass-face-a': ((44, 46, 1211, 1213), (512, 512)),
    'glass-face-b': ((44, 46, 1211, 1213), (512, 512)),
    # chamfer band 88-195, LED recess 195-247, panel to 1682 (source px); kept at half size
    'podium-side': ((70, 88, 818, 1682), (374, 797)),
    # the hex: centre (625, 612), circumradius 578 (flat top and bottom)
    'podium-top': ((47, 34, 1203, 1190), (578, 578)),
    # the candle: one LED segment of the body (a full 149 px period, its shelf at the bottom), the body's
    # end caps, the wick rod with its halo, the round lens seen from above
    'candle-seg': ('candle-body', (170, 548, 497, 697), (328, 150)),
    'candle-cap': ('candle-body', (170, 76, 497, 250), (328, 174)),
    'candle-wick': ('candle-wick', (200, 100, 300, 1893), (50, 896)),
    'candle-top': ('candle-top', (190, 184, 1065, 1059), (440, 440)),
}
for name, job in JOBS.items():
    src, box, size = job if len(job) == 3 else (name, *job)
    Image.open(os.path.join(SRC, src + '.webp')).convert('RGB').crop(box).resize(size, Image.LANCZOS).save(os.path.join(OUT, name + '.png'), optimize=True)
    print(name, size)

# the arena tile (the world of arenas): centred on its plaza, the flame at its centre taken out (the film
# lights its own LED candle there), sized for the distant-arena sprites
import numpy as np, cv2
a = np.array(Image.open(os.path.join(SRC, 'arena-tile.webp')).convert('RGB'))
cx, cy, R = 626, 604, 372
mask = np.zeros(a.shape[:2], np.uint8); cv2.circle(mask, (cx, cy), 46, 255, -1)
a = cv2.inpaint(a, mask, 12, cv2.INPAINT_TELEA)
Image.fromarray(a).crop((cx - R, cy - R, cx + R, cy + R)).resize((256, 256), Image.LANCZOS).save(os.path.join(OUT, 'arena-tile.png'), optimize=True)
print('arena-tile', (256, 256))

