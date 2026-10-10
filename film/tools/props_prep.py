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
}
for name, (box, size) in JOBS.items():
    Image.open(os.path.join(SRC, name + '.webp')).convert('RGB').crop(box).resize(size, Image.LANCZOS).save(os.path.join(OUT, name + '.png'), optimize=True)
    print(name, size)
