"""Review sheets from the rendered test: timed contact sheet; character continuity strip."""
import subprocess, sys, tempfile, numpy as np
from PIL import Image, ImageDraw, ImageFont
V = 'deliverables/yochi-pullback-test.mp4'
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
sh.save('deliverables/yochi-pullback-test-contact.jpg', quality=88)
# ---- key frames, full size
for t, n in ((0.6, 'A-victory'), (2.4, 'B-handover'), (4.4, 'C-platform'), (6.0, 'D-world'), (10.0, 'E-final')):
    grab(t).save(f'deliverables/frame-{n}.jpg', quality=92)
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
strip.save('deliverables/yochi-pullback-continuity.jpg', quality=90)
print('ok')
