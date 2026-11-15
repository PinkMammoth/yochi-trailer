#!/usr/bin/env python3
"""sheet.py out.jpg cols scale img1 img2 ... : quick labelled grid of stills"""
import sys, os
from PIL import Image, ImageDraw
out, cols, sc, *ims = sys.argv[1:]
cols, sc = int(cols), float(sc)
tiles = [Image.open(p).convert('RGB') for p in ims]
w, h = int(tiles[0].width * sc), int(tiles[0].height * sc)
rows = (len(tiles) + cols - 1) // cols
S = Image.new('RGB', (cols * w, rows * (h + 28)), (20, 18, 16))
d = ImageDraw.Draw(S)
for i, (p, t) in enumerate(zip(ims, tiles)):
    x, y = (i % cols) * w, (i // cols) * (h + 28)
    S.paste(t.resize((w, h)), (x, y + 28))
    d.text((x + 6, y + 6), os.path.basename(p), fill=(240, 230, 210))
S.save(out, quality=88)
