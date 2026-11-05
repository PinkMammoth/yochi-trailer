"""Raw figure mattes for the cast: BiRefNet (rembg, 'birefnet-general') on each 1536x2048 card.
usage: python3 tools/cast_mask.py <card-id>   -> assets/cast/raw/<card-id>.png (8-bit alpha matte)
Run one card per process (the model leaks memory across calls):
  for f in ../asset-pack/sumi/avatars/cards/*.webp; do python3 tools/cast_mask.py $(basename $f .webp); done
cast_prep.py then crops, cleans and packs them. ~1 min per card on CPU."""
import os, sys
from rembg import remove, new_session
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
n = sys.argv[1]
src = os.path.join(here, '..', '..', 'asset-pack', 'sumi', 'avatars', 'cards', n + '.webp')
# a newer painting in assets/cast/source/ (same 1536x2048 card format) replaces the kit's
_new = os.path.join(here, '..', 'assets', 'cast', 'source', n + '.webp')
if os.path.exists(_new): src = _new
out = os.path.join(here, '..', 'assets', 'cast', 'raw')
os.makedirs(out, exist_ok=True)
dst = os.path.join(out, n + '.png')
if not os.path.exists(dst):
    im = Image.open(src).convert('RGB')
    remove(im, session=new_session('birefnet-general'), only_mask=True).save(dst)
print(n, flush=True)
