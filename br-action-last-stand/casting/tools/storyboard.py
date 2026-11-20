#!/usr/bin/env python3
"""THE LAST STAND v2: the storyboard sheet. One frame per shot, composed from the kit cards and the supplied Duel
Master attack pose (read-only). Shots that need NEW artwork show the canonical card greyed under a hatch with the
brief's id. They are placeholders, not generated art. Type, chips, candles and the stroke are rough mock-ups of
the procedural layers. Timings are from ../storyboard-timing.json.

usage: python3 casting/tools/storyboard.py <seal.png (rasterised kit seal)> <out.jpg>
"""
import json, os, sys, math
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..', '..')
KIT = os.path.join(ROOT, 'asset-pack', 'sumi')
T = json.load(open(os.path.join(HERE, '..', 'storyboard-timing.json')))
F = lambda n, s: ImageFont.truetype(os.path.join(KIT, 'fonts', n), s)
DELA = lambda s: F('dela-gothic-one-latin-400-normal.woff2', s)
MONO = lambda s: F('jetbrains-mono-latin-700-normal.woff2', s)
MONO5 = lambda s: F('jetbrains-mono-latin-500-normal.woff2', s)
YUJI = lambda s: F('YujiSyuku-Regular.ttf', s)
SUMI, SINK, SMUT, SOUT, SRED = '#0f0d0b', '#efe7d8', '#a39a8a', '#8f8676', '#ff5436'
PAPER, PINK, PMUT, POUT, PRED = '#f2ece0', '#16130f', '#5d5548', '#6e665a', '#d6402b'
UPC, DNC, UPP = '#3ddc84', '#ff4d6d', '#15804a'
PW, PH = 640, 360

card = lambda n: Image.open(os.path.join(KIT, 'avatars', 'cards', n + '.webp')).convert('RGB')
RAM, DM = card('rampage'), card('duel-master')
ATK = Image.open(os.path.join(HERE, '..', 'supplied', 'duel-master-attack-exp1.webp')).convert('RGB')
SEAL = Image.open(sys.argv[1]).convert('RGBA')


def view(im, cx, cy, w, out):
    """camera window of width w (source px) centred at (cx, cy), at the output aspect"""
    h = w * out[1] / out[0]
    return im.crop((int(cx - w / 2), int(cy - h / 2), int(cx + w / 2), int(cy + h / 2))).resize(out, Image.LANCZOS)


def newart(im, tag, label):
    g = ImageOps.grayscale(im).convert('RGB').point(lambda v: 150 + v * 0.35)
    d = ImageDraw.Draw(g)
    for k in range(-g.height, g.width, 26):
        d.line([(k, 0), (k + g.height, g.height)], fill='#b9b1a3', width=3)
    bw = d.textlength(tag, font=DELA(34)) + 40
    d.rectangle([14, 14, 14 + bw, 66], fill=PRED)
    d.text((34, 18), tag, font=DELA(34), fill='#fff8ef')
    d.text((16, 74), label, font=MONO(17), fill=PINK)
    return g


def dwidth(d, txt, font):
    return sum(font.size * 0.78 if ch in '▲▼' else d.textlength(ch, font=font) for ch in txt)


def dtext(d, xy, txt, font, fill, center=False):
    """text that may contain ▲ / ▼ (drawn as triangles: the brand faces have no arrow glyphs)"""
    x, y = xy
    if center:
        x -= dwidth(d, txt, font) / 2
    s = font.size
    for ch in txt:
        if ch in '▲▼':
            a, b, top, bot = x + s * 0.06, x + s * 0.66, y + s * 0.3, y + s * 0.95
            d.polygon([(a, bot), (b, bot), ((a + b) / 2, top)] if ch == '▲' else [(a, top), (b, top), ((a + b) / 2, bot)], fill=fill)
            x += s * 0.78
        else:
            d.text((x, y), ch, font=font, fill=fill); x += d.textlength(ch, font=font)


def chip(d, x, y, txt, col, bg, out=False, size=30):
    w = dwidth(d, txt, DELA(size)) + 26
    d.rounded_rectangle([x, y, x + w, y + size + 20], 8, fill=bg, outline=col, width=3)
    dtext(d, (x + 13, y + 7), txt, DELA(size), col)
    if out:
        d.line([(x + 8, y + (size + 20) / 2), (x + w - 8, y + (size + 20) / 2)], fill=col, width=4)
    return w


def pip(d, x, y, s, col, lost=False, ground=SUMI):
    d.rounded_rectangle([x, y, x + s, y + s], s * 0.14, outline=col, width=max(2, int(s * 0.08)))
    d.text((x + s * 0.17, y + s * 0.05), '命', font=YUJI(int(s * 0.66)), fill=col)
    if lost:
        d.line([(x + s * 0.62, y - 4), (x + s * 0.42, y + s * 0.45), (x + s * 0.6, y + s * 0.55), (x + s * 0.36, y + s + 4)], fill=ground, width=int(s * 0.14))


def seal(img, glyph, x, y, s, fill, ink, rot=-10):
    t = Image.new('RGBA', (s, s), (0, 0, 0, 0)); td = ImageDraw.Draw(t)
    td.rounded_rectangle([0, 0, s - 1, s - 1], s * 0.14, fill=fill, outline=ink, width=max(2, s // 22))
    fs = int(s * 0.62); td.text((s / 2, s / 2 - s * 0.04), glyph, font=YUJI(fs), fill=ink, anchor='mm')
    t = t.rotate(-rot, expand=True, resample=Image.BICUBIC)
    img.paste(t, (int(x - t.width / 2), int(y - t.height / 2)), t)


def candle(d, x, y, w, h, o, c, hi, lo, vmin, vmax, col, glow=None):
    Y = lambda v: y + h - (v - vmin) / (vmax - vmin) * h
    d.line([(x + w / 2, Y(hi)), (x + w / 2, Y(lo))], fill=col, width=5)
    d.rectangle([x, Y(max(o, c)), x + w, Y(min(o, c)) + 2], fill=col)


def stroke(img, p0, p1, w, col=(214, 64, 43)):
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0)); ld = ImageDraw.Draw(lay)
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]; L = math.hypot(dx, dy); nx, ny = -dy / L, dx / L
    pts = []
    for i in range(41):
        u = i / 40; hw = w * (0.35 + 0.65 * math.sin(math.pi * min(1, 0.12 + u * 1.3))) * (1 - 0.7 * u ** 1.8) / 2
        pts.append((p0[0] + dx * u + nx * hw, p0[1] + dy * u + ny * hw))
    for i in range(40, -1, -1):
        u = i / 40; hw = w * (0.35 + 0.65 * math.sin(math.pi * min(1, 0.12 + u * 1.3))) * (1 - 0.7 * u ** 1.8) / 2
        pts.append((p0[0] + dx * u - nx * hw, p0[1] + dy * u - ny * hw))
    ld.polygon(pts, fill=col + (235,))
    for k in range(60):
        o = (k / 60 - 0.5) * w * 1.25; u0 = (k * 37 % 13) / 40
        ld.line([(p0[0] + dx * u0 + nx * o, p0[1] + dy * u0 + ny * o), (p0[0] + dx * (0.55 + (k % 7) / 16) + nx * o * 0.6, p0[1] + dy * (0.55 + (k % 7) / 16) + ny * o * 0.6)], fill=col + (150,), width=2)
    img.paste(lay, (0, 0), lay)


def splat(d, cx, cy, R, n, seed, col=PINK):
    for i in range(n):
        a = (i * 2.399 + seed) % (2 * math.pi); r = R * (0.3 + ((i * 7919 + seed * 13) % 100) / 110)
        s = 2 + (i * 31 % 9)
        d.ellipse([cx + math.cos(a) * r - s, cy + math.sin(a) * r - s, cx + math.cos(a) * r + s, cy + math.sin(a) * r + s], fill=col)


def focus(d, c, n, inner, col):
    for i in range(n):
        a = i / n * 2 * math.pi + (i % 3) * 0.02; w = 0.006 + (i % 5) * 0.003
        r0 = inner * (1 + (i * 37 % 10) / 18); R = 900
        d.polygon([(c[0] + math.cos(a) * r0, c[1] + math.sin(a) * r0 * 0.75), (c[0] + math.cos(a - w) * R, c[1] + math.sin(a - w) * R), (c[0] + math.cos(a + w) * R, c[1] + math.sin(a + w) * R)], fill=col)


def hud(d, ground='sumi'):
    col = SINK if ground == 'sumi' else PINK
    d.text((20, 12), 'BATTLE ROYALE · FINAL 2 OF 10', font=MONO(13), fill=col)
    t = 'POOL 100 USDC'; d.text((PW - 20 - d.textlength(t, font=MONO(13)), 12), t, font=MONO(13), fill=col)


frames = {}
# S1 the threat: the fist at the camera, a slow push up to the grin. Camera only (whole-image).
im = view(RAM, 700, 1230, 1260, (PW, PH)); d = ImageDraw.Draw(im); hud(d)
d.text((22, 292), 'brick', font=DELA(44), fill=SINK); pip(d, 150, 304, 30, SINK); d.text((190, 311), 'LAST LIFE', font=MONO(14), fill=SINK)
frames['S1'] = im
# S2 the challenger: he fills 70% of the frame; she's a narrow panel; 対 in the gutter
im = Image.new('RGB', (PW, PH), SUMI)
L = view(RAM, 900, 720, 900, (470, PH)); im.paste(L, (0, 0))
R = view(DM, 900, 640, 560, (230, PH)); mask = Image.new('L', (PW, PH), 0); ImageDraw.Draw(mask).polygon([(470, 0), (PW, 0), (PW, PH), (420, PH)], fill=255)
lay = Image.new('RGB', (PW, PH)); lay.paste(R, (410, 0)); im.paste(lay, (0, 0), mask)
d = ImageDraw.Draw(im); d.line([(470, 0), (420, PH)], fill=SUMI, width=12); d.line([(476, 0), (426, PH)], fill=SINK, width=3)
seal(im, '対', 446, 175, 64, SINK, SUMI, -8); hud(d)
d.text((22, 290), 'brick', font=DELA(44), fill=SINK); d.text((PW - 20 - d.textlength('mira', font=DELA(36)), 296), 'mira', font=DELA(36), fill=SINK)
pip(d, 150, 304, 30, SINK); pip(d, PW - 152, 306, 26, SINK)
frames['S2'] = im
# S3a brick locks instantly: ▲ UP 決 on his own panel; mira still THINKING (the app hides others' picks)
im = Image.new('RGB', (PW, PH), SUMI); im.paste(view(RAM, 930, 560, 620, (400, PH)), (0, 0)); d = ImageDraw.Draw(im)
d.line([(400, 0), (400, PH)], fill=SINK, width=3); hud(d)
d.text((424, 92), 'brick PICKS', font=MONO(16), fill=SINK); dtext(d, (420, 120), '▲ UP', DELA(64), UPC); seal(im, '決', 520, 250, 70, SINK, SUMI)
d.text((424, 318), 'mira · THINKING', font=MONO(14), fill=SMUT)
frames['S3a'] = im
# S3b mira locks late, against him: her own panel shows ▼ DOWN 決
im = Image.new('RGB', (PW, PH), SUMI); im.paste(view(DM, 860, 560, 560, (400, PH)), (240, 0)); d = ImageDraw.Draw(im)
d.line([(240, 0), (240, PH)], fill=SINK, width=3); hud(d)
d.text((26, 92), 'mira PICKS', font=MONO(16), fill=SINK); dtext(d, (14, 120), '▼ DOWN', DELA(48), DNC); seal(im, '決', 110, 250, 70, SINK, SUMI, 8)
d.text((26, 318), 'brick · PICKED', font=MONO(14), fill=SMUT)
frames['S3b'] = im
# S4a the candle opens: three panels, the timer
def three(prog_c, wick_lo=None, col=UPC, timer='0:03'):
    im = Image.new('RGB', (PW, PH), SUMI)
    im.paste(view(RAM, 940, 640, 520, (190, PH)), (0, 0)); im.paste(view(DM, 870, 640, 520, (190, PH)), (450, 0))
    d = ImageDraw.Draw(im); d.line([(190, 0), (190, PH)], fill=SINK, width=3); d.line([(450, 0), (450, PH)], fill=SINK, width=3)
    d.text((320, 40), timer, font=DELA(40), fill=SINK, anchor='mt'); d.rectangle([250, 90, 390, 96], fill='#221e1a'); d.rectangle([250, 90, 250 + 140 * (int(timer[-1]) / 3), 96], fill=SRED)
    for k in range(0, 260, 16): d.line([(206 + k, 260), (214 + k, 260)], fill=SINK, width=2)
    candle(d, 225, 120, 36, 210, 0.2, 0.25, 0.4, 0.05, 0, 1, '#5a2630')
    lo = wick_lo if wick_lo is not None else min(0.5, prog_c)
    candle(d, 290, 120, 70, 210, 0.5, prog_c, max(0.5, prog_c, 0.95 if wick_lo is not None else prog_c), lo, 0, 1, col)
    d.text((14, 300), 'brick', font=DELA(26), fill=SINK); chip(d, 12, 330 - 4, '▲ UP', UPC, '#1a1714', size=14)
    d.text((PW - 14 - d.textlength('mira', font=DELA(26)), 300), 'mira', font=DELA(26), fill=SINK); chip(d, PW - 92, 326, '▼ DOWN', DNC, '#1a1714', size=14)
    return im, d
im, d = three(0.62); hud(d); frames['S4a'] = im
# S4b it runs his way: his grin, closer, with the green candle climbing in its panel; her last 命 pulses
im = Image.new('RGB', (PW, PH), SUMI); im.paste(view(RAM, 960, 520, 430, (440, PH)), (0, 0)); d = ImageDraw.Draw(im)
d.line([(440, 0), (440, PH)], fill=SINK, width=3)
candle(d, 500, 50, 80, 230, 0.35, 0.92, 0.97, 0.3, 0, 1, UPC); [d.line([(452 + k, 210), (460 + k, 210)], fill=SINK, width=2) for k in range(0, 180, 16)]
d.text((456, 300), 'mira', font=DELA(22), fill=SINK); pip(d, 540, 302, 26, SINK); d.text((456, 334), 'LAST LIFE · AT RISK', font=MONO(11), fill=SRED)
hud(d); frames['S4b'] = im
# S4c the turn: the last seconds, a long crimson wick knifes down through the strike; she hasn't moved
im, d = three(0.25, wick_lo=0.12, col=DNC, timer='0:01'); hud(d)
d.text((322, 342), 'the close tips under the strike', font=MONO(11), fill=SMUT, anchor='mb'); frames['S4c'] = im
# S5 the close and the disbelief: NEW N1 in the inserted silent beat; both picks revealed
im = newart(view(RAM, 960, 560, 640, (PW, PH)), 'NEW · N1', 'Rampage: disbelief (grin gone)'); d = ImageDraw.Draw(im)
d.rectangle([0, PH - 74, PW, PH], fill=SUMI)
chip(d, 18, PH - 60, '▲ UP', SOUT, '#1a1714', out=True, size=24); d.text((128, PH - 52), 'brick', font=DELA(24), fill=SOUT)
w = chip(d, 380, PH - 60, '▼ DOWN', DNC, '#1a1714', size=24); d.text((390 + w, PH - 52), 'mira', font=DELA(24), fill=SINK)
dtext(d, (PW / 2, 108), 'CLOSED ▼ DOWN', DELA(30), DNC, center=True); frames['S5'] = im
# S6 the strike: the supplied attack pose, a slam-in, focus lines converging on her eyes
im = view(ATK, 600, 560, 900, (PW, PH)); d = ImageDraw.Draw(im, 'RGBA'); focus(d, (440, 150), 110, 120, (22, 19, 15, 150))
frames['S6'] = im
# S7 IMPACT: paper, the enormous stroke across his chest (NEW N2), ink explosion; 1 paper-white + 2 ink-negative frames before
im = newart(view(RAM, 900, 820, 1100, (PW, PH)), 'NEW · N2', 'Rampage: the hit (recoil, from frame-right)'); d = ImageDraw.Draw(im)
splat(d, 300, 250, 220, 70, 3); stroke(im, (PW + 20, 90), (-20, 340), 150); frames['S7'] = im
# S8 knockback: N2 hurled back into depth, greying, breaking into ink; his last 命 shatters
im = Image.new('RGB', (PW, PH), PAPER); fig = newart(view(RAM, 900, 820, 1100, (300, 170)), 'N2', '').rotate(14, expand=True, fillcolor=PAPER)
im.paste(fig, (40, 70)); d = ImageDraw.Draw(im); stroke(im, (PW + 20, 90), (-20, 340), 120); splat(d, 200, 160, 260, 90, 7)
for k in range(14): d.line([(320 + k * 9, 30 + k * 23), (PW, 30 + k * 23)], fill=PINK, width=1)
pip(d, 500, 40, 44, POUT, lost=True, ground=PAPER); d.text((470, 96), 'LAST LIFE LOST', font=MONO(13), fill=POUT); frames['S8'] = im
# S9 eliminated: the grey 敗 and brick OUT on the band, on the big hit
im = Image.new('RGB', (PW, PH), PAPER); d = ImageDraw.Draw(im); stroke(im, (PW + 20, 60), (-20, 300), 100)
splat(d, 140, 140, 170, 50, 11, POUT); d.rectangle([0, 210, PW, 330], fill='#fbf8f2', outline=PINK, width=4)
seal(im, '敗', 80, 270, 84, POUT, '#fbf8f2', -12); d.text((140, 240), 'brick OUT', font=DELA(50), fill=POUT); frames['S9'] = im
# S10 last one standing: her canonical card, composed, on paper; +95 lands on the mid hit
im = Image.new('RGB', (PW, PH), PAPER); im.paste(view(DM, 860, 760, 760, (300, PH)), (0, 0)); d = ImageDraw.Draw(im)
d.line([(300, 0), (300, PH)], fill=PINK, width=4)
d.text((326, 100), 'LAST ONE STANDING', font=MONO(16), fill=PMUT); d.text((322, 124), 'mira', font=DELA(54), fill=PINK)
d.text((322, 196), '+95 USDC', font=DELA(50), fill=UPP); d.text((326, 262), '100 USDC POOL · 5% FEE', font=MONO(13), fill=PMUT)
seal(im, '勝', 590, 60, 66, PRED, '#fff8ef', -10); frames['S10'] = im
# S11 BATTLE ROYALE: the house seal stamps on the big hit; the music fades
im = Image.new('RGB', (PW, PH), PAPER); d = ImageDraw.Draw(im)
s = SEAL.resize((150, 150)); im.paste(s, (PW // 2 - 75, 50), s)
d.text((PW / 2, 222), 'BATTLE ROYALE', font=DELA(50), fill=PINK, anchor='mt'); d.text((PW / 2, 292), 'LAST ONE STANDING TAKES THE POOL', font=MONO(15), fill=PMUT, anchor='mt')
frames['S11'] = im

ART = {'S1': 'EXISTING Rampage card · camera only', 'S2': 'EXISTING Rampage + Duel Master (2.5D)', 'S3a': 'EXISTING Rampage crop', 'S3b': 'EXISTING Duel Master (2.5D)',
       'S4a': 'EXISTING both + procedural candle', 'S4b': 'EXISTING Rampage crop + candle', 'S4c': 'EXISTING both + candle', 'S5': 'NEW N1 · Rampage disbelief',
       'S6': 'SUPPLIED Duel Master attack (keep)', 'S7': 'NEW N2 · Rampage hit + procedural stroke', 'S8': 'NEW N2 (same asset) + dissolve',
       'S9': 'procedural only', 'S10': 'EXISTING Duel Master card (2.5D)', 'S11': 'kit seal + type'}
DESC = {'S1': 'He owns the frame. Fist at the lens, push up to the grin. No hit: the opener is camera, not impact',
        'S2': 'She arrives small, in a narrow panel. Both LAST LIFE. The versus seal stamps in the gutter',
        'S3a': 'He locks on the downbeat, no hesitation. Each panel is that player\'s own pick',
        'S3b': 'She waits most of a bar, then locks against him',
        'S4a': 'The minute runs. Three panels: him · the live candle · her',
        'S4b': 'It climbs his way. His grin, closer; her last life at risk',
        'S4c': 'The last second: a crimson wick knifes through the strike. She doesn\'t move',
        'S5': 'Closed DOWN. True silence (the inserted beat). Both picks revealed: his greys',
        'S6': 'The sub returns: she lunges. Slam-in, focus lines on her eyes',
        'S7': 'Drop 2: paper-white, 2 ink-negative frames, the stroke across his chest, hit-stop',
        'S8': 'Hurled back into depth, greying, breaking to ink on the drop\'s hits. His last life breaks',
        'S9': 'The next big hit: the grey defeat seal, brick OUT', 'S10': 'Composed, alive, on paper. The win seal. +95 rises on the mid hit',
        'S11': 'The seal stamps on the last big hit; the music fades'}

cols, gap = 3, 30
order = [s['id'] for s in T['shots']]
rows = math.ceil(len(order) / cols)
CH = 132
W = 60 * 2 + cols * PW + (cols - 1) * gap
sheet = Image.new('RGB', (W, 210 + rows * (PH + CH + 24)), PAPER); d = ImageDraw.Draw(sheet)
d.text((60, 44), 'THE LAST STAND v2 · STORYBOARD', font=DELA(56), fill=PINK)
d.text((60, 120), f"{T['dur']} s · 16:9 · music: Victory Stamp dark dnb, continuous from {T['src']['in']:.2f} s + one inserted silent beat · mock-up frames: hatched = new artwork placeholder, not generated",
       font=MONO5(18), fill=PMUT)
end = {s['id']: (T['shots'][i + 1]['t'] if i + 1 < len(T['shots']) else T['dur']) for i, s in enumerate(T['shots'])}
end['S9'] = 9.9
for i, sid in enumerate(order):
    s = next(x for x in T['shots'] if x['id'] == sid)
    x = 60 + (i % cols) * (PW + gap); y = 180 + (i // cols) * (PH + CH + 24)
    sheet.paste(frames[sid], (x, y))
    t0 = s['t'] if sid != 'S10' else 9.9
    d.text((x, y + PH + 8), f"{sid}  {t0:5.2f}-{end[sid]:5.2f}s  {s['name'].upper()}", font=MONO(19), fill=PINK)
    d.text((x, y + PH + 36), s['music'], font=MONO5(15), fill=PMUT)
    words, line, ly = DESC[sid].split(' '), '', y + PH + 60
    for w_ in words:
        if d.textlength(line + w_ + ' ', font=MONO5(16)) > PW:
            d.text((x, ly), line, font=MONO5(16), fill=PINK); ly += 22; line = ''
        line += w_ + ' '
    d.text((x, ly), line, font=MONO5(16), fill=PINK)
    a = ART[sid]; d.text((x, y + PH + CH - 8), a, font=MONO(15), fill=PRED if a.startswith('NEW') else (UPP if a.startswith('EXISTING') or a.startswith('SUPPLIED') else PMUT))
sheet.save(sys.argv[2], quality=86); print(sys.argv[2])
