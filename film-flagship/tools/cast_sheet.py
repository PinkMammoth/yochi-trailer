"""Review sheet: each figure on a flat green, its plate beside it, head point marked. python3 tools/cast_sheet.py out.jpg [ids]"""
import sys, json, os
from PIL import Image, ImageDraw
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'cast')
J = json.load(open(os.path.join(root, 'cast.json')))
ids = sys.argv[2:] or list(J)
tw, th = 232, 305
sheet = Image.new('RGB', (min(len(ids), 8) * tw * 2, ((len(ids) + 7) // 8) * (th + 18)), 'white')
d = ImageDraw.Draw(sheet)
for i, n in enumerate(ids):
    j = J[n]; W, H = j['paint']
    x, y = (i % 8) * tw * 2, (i // 8) * (th + 18)
    g = Image.new('RGBA', (W, H), (40, 150, 70, 255))
    f = Image.open(os.path.join(root, n + '-fig.webp')); g.alpha_composite(f, tuple(j['fig'][:2]))
    dd = ImageDraw.Draw(g); hx, hy = j['head']; dd.ellipse((hx - 20, hy - 20, hx + 20, hy + 20), outline='red', width=8)
    sheet.paste(g.convert('RGB').resize((tw, th)), (x, y + 18))
    sheet.paste(Image.open(os.path.join(root, n + '-plate.webp')).convert('RGB').resize((tw, th)), (x + tw, y + 18))
    d.text((x + 4, y + 3), n, fill='black')
    d.rectangle((x + tw - 30, y + 2, x + tw - 2, y + 16), fill=tuple(j['ink']))
sheet.save(sys.argv[1], quality=85); print(sheet.size)
