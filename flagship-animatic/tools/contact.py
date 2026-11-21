"""Contact sheet from an encoded MP4: one frame per `step` seconds, labelled with time and the shot slate's act.
usage: python3 tools/contact.py <in.mp4> <out.jpg> [step=1.0] [cols=6]"""
import subprocess, sys, json, os, tempfile
from PIL import Image, ImageDraw, ImageFont
src, out = sys.argv[1], sys.argv[2]
step = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 6
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout)
T = json.load(open(os.path.join(os.path.dirname(__file__), '../remotion/src/timing.json')))
def act(t):
    if t < T['victory']['pullStart']: return 'I DUEL'
    if t < T['victory']['world']: return 'II PULLBACK'
    if t < T['payoff']['close']: return 'III FIELD'
    return 'IV CLOSE / END'
W, H = 480, 270
ts = [round(i * step + step / 2, 3) for i in range(int(dur / step))]
rows = (len(ts) + cols - 1) // cols
sheet = Image.new('RGB', (cols * W, rows * (H + 26) + 40), (15, 13, 11)); d = ImageDraw.Draw(sheet)
f = ImageFont.load_default(18)
d.text((8, 10), f'{os.path.basename(src)}  {dur:.2f} s  one frame every {step:g} s', fill=(239, 231, 216), font=f)
with tempfile.TemporaryDirectory() as tmp:
    for i, t in enumerate(ts):
        p = f'{tmp}/{i}.jpg'
        subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', src, '-frames:v', '1', '-vf', f'scale={W}:{H}', '-y', p])
        x, y = (i % cols) * W, 40 + (i // cols) * (H + 26)
        sheet.paste(Image.open(p), (x, y)); d.text((x + 4, y + H + 3), f'{t:6.2f}s  {act(t)}', fill=(255, 209, 0), font=f)
sheet.save(out, quality=86); print(out)
