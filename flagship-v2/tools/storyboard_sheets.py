"""Visual storyboard: one annotated frame per shot from the rendered animatic, on pages of 3x3, plus a 1 fps contact sheet.
usage: python3 tools/storyboard_sheets.py <animatic.mp4> <outdir>"""
import json, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
T = json.load(open(os.path.join(os.path.dirname(__file__), '../film/remotion/src/flagship/timing.json')))
b = lambda n, k=0: T['bars'][str(n)] + k * T['beat']
X = T['close']
# (id, time to sample, title, camera / emotion / gameplay line, assets line)
SHOTS = [
    ('I-a', 0.6, 'THE LAST STAND · the threat', 'approved: fist at the lens, the climb to his grin', 'READY (approved film)'),
    ('I-b', 2.2, 'THE LAST STAND · the picks', 'approved: he picks UP at once, she picks DOWN late', 'READY'),
    ('I-c', 7.0, 'THE LAST STAND · the reversal', 'approved: the candle climbs for him, then collapses', 'READY'),
    ('I-d', 8.5, 'THE LAST STAND · disbelief', 'approved: three silent beats', 'READY'),
    ('I-e', 9.45, 'THE LAST STAND · the hit', 'approved: drop 2\'s big hit, the ink strike', 'READY'),
    ('V1', 13.3, 'Her victory', 'approved reveal; 勝 mira +19 USDC; no lockup card now', 'READY'),
    ('R1', 16.4, 'The pullback begins', 'dolly back, the paper becomes mist; parallax planes appear', 'ADAPTABLE + E01-E04'),
    ('R2', 18.9, 'Out over the gorge', 'the camera rises and retreats through the gateway', 'NEW B01 + E01-E06'),
    ('R3', 21.4, 'THE GORGE · FREE FOR ALL', 'establishing: two terraced cliffs facing; she is a speck', 'NEW E01-E06'),
    ('G1', b(83, 2.5), 'High Roller arrives', 'low angle in the crowd; laughs, flips the chip · UP 100', 'ADAPTABLE / NEW B10'),
    ('G2', b(84, 2), 'Across the gorge', 'OTS from her shoulder: Cold Blooded alone on the DOWN edge', 'NEW B11'),
    ('G3', b(85, 3.5), 'Cold Blooded picks', 'close-up; against the crowd, without looking · DOWN 80', 'READY'),
    ('G4', b(87, 2.5), 'The ensemble', 'four panels on four hits: Untouchable, Last Legend, Grudge Settled, Bloodsport', 'READY'),
    ('L1', b(88, 2), 'Lucky Fool', 'small at the back of the UP crowd; then hesitation', 'READY / NEW B13'),
    ('L2', b(91, 2), 'The pool, said once', 'her 5 on the stone (B14); the whole gorge; POOL 12,480', 'NEW B14, E04'),
    ('L3', b(93, 3.5), 'Picks close', 'four faces, four locks on four beats', 'READY'),
    ('L4', b(94, 4), 'The held breath', 'super-wide, still; Duel Master watching from her spire', 'NEW E01-E06'),
    ('C1', b(120, 3), 'Drop 3: the candle opens', 'ink floods the sky; the candle dives; the gorge shakes', 'NEW E07'),
    ('C2', b(123, 2), 'DOWN is winning', 'Cold Blooded\'s faintest smile; Grudge Settled laughs; Last Legend nods', 'NEW B15'),
    ('C3', b(125, 2), 'UP is shaken', 'High Roller\'s laugh freezes; Lucky Fool can\'t look · −5.00', 'NEW B16, B17'),
    ('C4', b(127), 'The still point', 'Untouchable, blindfolded, never looks', 'READY'),
    ('C5', b(129, 2), 'The turn', 'the wick stops; Lucky Fool opens one eye', 'NEW B17b'),
    ('C6', b(131, 2), 'The climb', 'the UP side lifts; Cold Blooded\'s smile is gone', 'READY / E04'),
    ('C7', b(133, 3), 'The edge', 'four eye-lines; the candle rides the strike', 'READY'),
    ('C8', b(135), 'The last bar', 'super-wide, storm; 0:01', 'NEW E01-E07'),
    ('X1', X['t'] + 0.6, 'CLOSED UP', 'the outro slam; the ink wave breaks over the DOWN side', 'NEW FX1'),
    ('X2a', X['hits'][0] + 0.4, 'Last Legend loses', 'on one knee, sword planted · −75', 'NEW B21'),
    ('X2c', X['hits'][2] + 0.4, 'Cold Blooded loses', 'lifts the mask over his face as he greys · −80', 'NEW B23'),
    ('X3a', X['hits'][3] + 0.45, 'High Roller wins', 'the cackle, chips flung · +131.56', 'NEW B24'),
    ('X3b', X['hits'][4] + 0.45, 'LUCKY FOOL WINS', 'her own card: coins raining · +6.58: the emotional peak', 'READY'),
    ('X3c', X['hits'][5] + 0.45, 'Untouchable wins', 'sheathes her blade, never turns · +52.63', 'NEW B25'),
    ('X4', X['hits'][6] + 0.6, 'The pool resolves', '"The side that\'s right splits the pool."', 'NEW E04 lit / grey'),
    ('X5', X['breath'] + 1.0, 'The witness', 'Duel Master turns and steps down: she\'s next', 'NEW B26'),
    ('X6', X['breath'] + 3.0, 'Next candle', '(optional) Rampage, formidable, steps up', 'NEW B27 (optional)'),
    ('E1', X['stab'] + 2.0, 'End card', 'the seal stamps on the last stab; held on the decay', 'READY'),
]
F = lambda s: ImageFont.load_default(s)
W, H = 640, 360
def grab(t, p):
    subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', src, '-frames:v', '1', '-vf', f'scale={W}:{H}', '-y', p])
    return Image.open(p).convert('RGB')
with tempfile.TemporaryDirectory() as tmp:
    frames = [grab(t, f'{tmp}/{i}.jpg') for i, (_, t, *_r) in enumerate(SHOTS)]
per, cols = 9, 3
pages = (len(SHOTS) + per - 1) // per
for pg in range(pages):
    rows = 3
    sheet = Image.new('RGB', (cols * (W + 20) + 20, rows * (H + 110) + 90), (242, 236, 224)); d = ImageDraw.Draw(sheet)
    d.text((20, 22), f'YOCHI FLAGSHIP v2 · visual storyboard · page {pg + 1}/{pages} · frames from the rough animatic (placeholders in cyan)', fill=(22, 19, 15), font=F(26))
    for j, i in enumerate(range(pg * per, min(len(SHOTS), (pg + 1) * per))):
        sid, t, title, line, assets = SHOTS[i]
        x, y = 20 + (j % cols) * (W + 20), 80 + (j // cols) * (H + 110)
        sheet.paste(frames[i], (x, y))
        d.rectangle([x, y, x + W - 1, y + H - 1], outline=(22, 19, 15), width=3)
        d.text((x, y + H + 8), f'{sid}  {t:5.2f}s  {title}', fill=(22, 19, 15), font=F(22))
        d.text((x, y + H + 40), line[:78], fill=(93, 85, 72), font=F(17))
        d.text((x, y + H + 66), assets, fill=(179, 48, 30) if 'NEW' in assets else (21, 128, 74), font=F(17))
    sheet.save(f'{out}/storyboard-{pg + 1}.jpg', quality=88)
print(pages, 'pages')
