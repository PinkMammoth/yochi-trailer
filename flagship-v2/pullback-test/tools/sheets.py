"""Review sheets from the rendered test: timed contact sheet; character continuity strip."""
import subprocess, sys, tempfile, numpy as np
from PIL import Image, ImageDraw, ImageFont
import sys
V = sys.argv[1] if len(sys.argv) > 1 else 'deliverables/yochi-pullback-test.mp4'
TAG = sys.argv[2] if len(sys.argv) > 2 else ''
F = lambda s: ImageFont.load_default(s)
BAR = 4 * 0.34095
def grab(t, w=1920, h=1080):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.4f}', '-i', V, '-frames:v', '1', '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    return Image.frombytes('RGB', (w, h), raw)
def stage(t):
    return 'A intimate victory' if t < BAR else 'B full figure' if t < 3.4 else 'C physical space' if t < 5.0 else 'D the world opens' if t < 6 * BAR else 'E grand reveal (hold)'
# ---- timed contact sheet, every 0.5 s
ts = [round(0.25 + 0.5 * i, 2) for i in range(22)]
W, H = 480, 270
sh = Image.new('RGB', (4 * W, 30 + ((len(ts) + 3) // 4) * (H + 24)), (15, 13, 11)); d = ImageDraw.Draw(sh)
d.text((8, 6), 'YOCHI pullback test · timed contact sheet (every 0.5 s) · 1920x1080 60 fps · bars: retreat 1.36 / world 6.82 / land 8.18', fill=(239, 231, 216), font=F(18))
for i, t in enumerate(ts):
    x, y = (i % 4) * W, 30 + (i // 4) * (H + 24)
    sh.paste(grab(t).resize((W, H)), (x, y)); d.text((x + 4, y + H + 3), f'{t:5.2f}s  {stage(t)}', fill=(255, 209, 0), font=F(17))
sh.save(f'deliverables/yochi-pullback-test{TAG}-contact.jpg', quality=88)
# ---- key frames, full size
for t, n in ((0.6, 'A-victory'), (2.4, 'B-handover'), (4.4, 'C-platform'), (6.0, 'D-world'), (10.0, 'E-final')):
    grab(t).save(f'deliverables/frame{TAG}-{n}.jpg', quality=92)
# ---- continuity: the same region of the frame across the hand-over (face; waist and blade; legs)
crops = [((760, 40, 1240, 420), 'face'), ((640, 380, 1280, 820), 'waist, blade, sword'), ((520, 700, 1400, 1080), 'the crop line / legs')]
times = [(1.30, 'approved victory (last frame of stage A)'), (2.0, 'victory over full body (legs revealed)'), (2.6, 'mid dissolve'), (3.2, 'full-body illustration')]
cw = 360
strip = Image.new('RGB', (len(times) * (cw + 10) + 200, len(crops) * (cw * 3 // 4 + 40) + 50), (242, 236, 224)); d = ImageDraw.Draw(strip)
d.text((10, 10), 'Character continuity across the hand-over (same screen region at each time; the camera is moving)', fill=(22, 19, 15), font=F(20))
for j, (t, lab) in enumerate(times):
    fr = grab(t)
    d.text((200 + j * (cw + 10), 36), f'{t:.1f}s {lab}'[:44], fill=(22, 19, 15), font=F(14))
    for i, (box, name) in enumerate(crops):
        # follow her: the crop scales with the camera so it's the same part of her
        c = fr.crop(box).resize((cw, cw * 3 // 4))
        strip.paste(c, (200 + j * (cw + 10), 60 + i * (cw * 3 // 4 + 40)))
for i, (box, name) in enumerate(crops): d.text((10, 60 + i * (cw * 3 // 4 + 40) + 100), name, fill=(22, 19, 15), font=F(18))
strip.save(f'deliverables/yochi-pullback{TAG}-continuity.jpg', quality=90)
print('ok')

# ---- hand-over diagnostic: every 0.2 s from 1.3 to 4.9 (the window where v1 lost her lower body), full frame
ts2 = [round(1.3 + 0.2 * i, 2) for i in range(19)]
W2, H2 = 640, 360
sh2 = Image.new('RGB', (3 * W2, 30 + 7 * (H2 + 24)), (15, 13, 11)); d2 = ImageDraw.Draw(sh2)
d2.text((8, 6), 'Hand-over window, every 0.2 s: her body must stay continuous (v1 lost it from ~3.5 to 4.1 s)', fill=(239, 231, 216), font=F(18))
for i, t in enumerate(ts2):
    x, y = (i % 3) * W2, 30 + (i // 3) * (H2 + 24)
    sh2.paste(grab(t).resize((W2, H2)), (x, y)); d2.text((x + 4, y + H2 + 3), f'{t:4.2f}s', fill=(255, 209, 0), font=F(17))
sh2.save(f'deliverables/yochi-pullback{TAG}-handover-diagnostic.jpg', quality=86)
