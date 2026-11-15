"""Contact sheet from a video at given frames: python3 contact.py in.mp4 out.jpg 0 30 60 ..."""
import subprocess, sys, os, tempfile
from PIL import Image, ImageDraw
src, out, frames = sys.argv[1], sys.argv[2], [int(f) for f in sys.argv[3:]]
tiles = []
with tempfile.TemporaryDirectory() as d:
    for f in frames:
        p = os.path.join(d, f"{f}.png")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", f"select=eq(n\\,{f}),scale=-2:360", "-frames:v", "1", p], check=True)
        im = Image.open(p).convert("RGB"); ImageDraw.Draw(im).text((8, 8), f"f{f}  {f/30:.2f}s", fill=(255, 60, 40))
        tiles.append(im)
tw = tiles[0].width
cols = 3 if tw > 360 else 6
sheet = Image.new("RGB", (tw * cols, 360 * ((len(tiles) + cols - 1) // cols)))
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % cols) * tw, (i // cols) * 360))
sheet.save(out, quality=88)
