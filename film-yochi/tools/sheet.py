# Contact sheet from a folder of stills (keeps their aspect).
# usage: python3 tools/sheet.py <dir> <out.jpg> [cols] [thumbW]
import sys, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 320
files = sorted(f for f in os.listdir(d) if f.endswith('.png'))
w0, h0 = Image.open(os.path.join(d, files[0])).size
th = tw * h0 // w0
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (tw + 6) - 6, rows * (th + 24)), (20, 19, 28))
dr = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(os.path.join(d, f)).convert('RGB').resize((tw, th), Image.LANCZOS)
    x, y = (i % cols) * (tw + 6), (i // cols) * (th + 24)
    sheet.paste(im, (x, y + 22))
    dr.text((x + 4, y + 5), f.replace('.png', '').lstrip('t0') or '0', fill=(200, 198, 220))
sheet.save(out, quality=90)
print(out, sheet.size)
