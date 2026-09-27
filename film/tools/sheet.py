# contact sheet: python3 tools/sheet.py <dir> <out.jpg> [cols] [thumbW]
import sys, os
from PIL import Image, ImageDraw, ImageFont
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 480
files = sorted(f for f in os.listdir(d) if f.endswith('.png'))
th = tw * 9 // 16
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (tw + 6), rows * (th + 26)), (255, 255, 255))
dr = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(os.path.join(d, f)).convert('RGB').resize((tw, th), Image.LANCZOS)
    x, y = (i % cols) * (tw + 6), (i // cols) * (th + 26)
    sheet.paste(im, (x, y + 22))
    dr.text((x + 4, y + 4), f.replace('.png', ''), fill=(0, 0, 0))
sheet.save(out, quality=90)
print(out, sheet.size)
