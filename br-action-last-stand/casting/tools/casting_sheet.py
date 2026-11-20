#!/usr/bin/env python3
"""THE LAST STAND casting contact sheet: Duel Master (canonical + the supplied attack pose), the current pairing
(Cold Blooded v2 + the three supplied variants), and the four ranked opponent candidates, each with a matchup frame
against Duel Master's attack pose (candidate on frame-left facing right, as her lunge requires).

Reads the kit cards and casting/supplied/ read-only. usage: python3 casting/tools/casting_sheet.py <out.jpg>
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..', '..')
KIT = os.path.join(ROOT, 'asset-pack', 'sumi')
SUP = os.path.join(HERE, '..', 'supplied')
F = lambda n, s: ImageFont.truetype(os.path.join(KIT, 'fonts', n), s)
DELA = lambda s: F('dela-gothic-one-latin-400-normal.woff2', s)
MONO = lambda s: F('jetbrains-mono-latin-700-normal.woff2', s)
MONO5 = lambda s: F('jetbrains-mono-latin-500-normal.woff2', s)
PAPER, INK, MUTED, RED, OUT, UPC = '#f2ece0', '#16130f', '#5d5548', '#d6402b', '#6e665a', '#15804a'

card = lambda n: Image.open(os.path.join(KIT, 'avatars', 'cards', n + '.webp')).convert('RGB')
sup = lambda n: Image.open(os.path.join(SUP, n)).convert('RGB')


def fit(im, w, h):
    return ImageOps.fit(im, (w, h), Image.LANCZOS)


def crop_c(im, cx, cy, w, h, out):
    x0, y0 = int(cx - w / 2), int(cy - h / 2)
    return im.crop((x0, y0, x0 + int(w), y0 + int(h))).resize(out, Image.LANCZOS)


W = 2400
sheet = Image.new('RGB', (W, 3020), PAPER)
d = ImageDraw.Draw(sheet)
d.text((60, 46), 'THE LAST STAND · CASTING', font=DELA(64), fill=INK)
d.text((60, 132), 'Duel Master and the opponent audition · kit cards (asset-pack/sumi, Sumi era) + supplied experimental variants (20 Nov) · not canonical replacements', font=MONO5(22), fill=MUTED)

# ---- row A: the protagonist + the current pairing
y = 200
d.text((60, y), 'THE PROTAGONIST', font=MONO(24), fill=INK)
d.text((1010, y), 'THE CURRENT OPPONENT · Cold Blooded (v2) + the three supplied variants', font=MONO(24), fill=INK)
y += 44
sheet.paste(fit(card('duel-master'), 420, 560), (60, y))
dm_att = sup('duel-master-attack-exp1.webp')
sheet.paste(fit(dm_att, 420, 560), (500, y))
d.text((60, y + 572), 'Duel Master · kit card', font=MONO(20), fill=INK)
d.text((500, y + 572), 'attack pose · supplied exp. · KEEP', font=MONO(20), fill=RED)
x = 1010
for im, lab in [(card('cold-blooded-v2'), 'kit card (v2)'), (sup('cold-blooded-hit-exp1.webp'), 'variant 1'), (sup('cold-blooded-open-exp2.webp'), 'variant 2'), (sup('cold-blooded-hit-exp3.webp'), 'variant 3')]:
    sheet.paste(fit(im, 320, 427), (x, y))
    d.text((x, y + 436), lab, font=MONO(18), fill=INK)
    x += 340
notes = ['- every variant keeps the mask poised in hand, the topknot and pin intact: the body pivots, it never loses balance',
         '- variant 2 is the card again with an open palm: an invitation, not a hit',
         '- no weapon, chin up, eyes off the opponent: he never threatens, so there is nothing to overturn',
         '- same type as Duel Master: slender, long black hair, black robes with cream accents. They merge in fast cuts']
for i, n in enumerate(notes):
    d.text((1010, y + 476 + i * 30), n, font=MONO5(19), fill=MUTED)

# ---- row B: the candidates
y = 880
d.text((60, y), 'THE CANDIDATES · ranked', font=MONO(24), fill=INK)
d.text((60, y + 34), 'matchup frame: the candidate as painted, on frame-left (no mirroring), against her attack pose on frame-right', font=MONO5(19), fill=MUTED)
y += 80
C = [
    ('1', 'RAMPAGE', 'rampage', (943, 486), 'PRIMARY',
     ['the most dangerous painting in the cast: the fist', 'already swings at the camera (a threat opener', 'with no new art)', '+ mass: biggest size contrast with her',
      '+ brawler vs blade; tan skin and rust vs black', '+ face built for extremes: easy disbelief, pain', '- weak matte (whole-image): camera only today',
      '- needs 2 new poses (disbelief, hit)']),
    ('2', 'LAST LEGEND', 'last-legend', (625, 532), 'BACKUP',
     ['the reigning champion look: armour, great', 'sword, a smug grin, looking frame-right', '+ clean matte: full 2.5D today', '+ armour plates give the hit physical debris',
      '+ gold ring and steel vs her red: clear contrast', '- calmer than Rampage: risk of the same', '  composure problem if the hit pose is soft',
      '- V4 already uses him as the final rival']),
    ('3', 'BLOODSPORT', 'bloodsport', (683, 467), '',
     ['the taunt: beckoning hand, wide grin, rust', 'armour, faces frame-right', '+ expressive, aggressive, clean matte', '- similar build and warm palette to her:',
      '  weaker size and colour contrast', '- reads as a rival, less as a threat', '', '']),
    ('4', 'RONIN', 'ronin', (689, 477), '',
     ['scarred grin, hand on the sword: a natural', 'duellist', '+ expressive face, rough silhouette', '- faces frame-LEFT: breaks the screen direction',
      '  of her lunge without new art (no mirroring)', '- brown on paper: low contrast', '- matte 64%, the sword in the figure', '']),
]
cw = 560
for i, (rank, name, cid, head, tag, lines) in enumerate(C):
    x = 60 + i * (cw + 20)
    d.text((x, y), rank, font=DELA(72), fill=RED if rank == '1' else INK)
    d.text((x + 70, y + 8), name, font=DELA(40), fill=INK)
    if tag:
        d.text((x + 72, y + 62), tag, font=MONO(20), fill=RED if tag == 'PRIMARY' else MUTED)
    im = card(cid)
    sheet.paste(fit(im, cw, 747), (x, y + 104))
    # face
    sheet.paste(crop_c(im, head[0], head[1] + 20, 760, 380, (cw, 280)), (x, y + 864))
    # matchup: candidate left half (head and shoulders), DM attack right half
    mw, mh = cw, 315
    left = crop_c(im, head[0] + 60, head[1] + 330, 900, 1012, (mw // 2, mh))
    right = crop_c(dm_att, 560, 520, 760, 855, (mw // 2, mh))
    m = Image.new('RGB', (mw, mh), INK)
    m.paste(left, (0, 0)); m.paste(right, (mw // 2, 0))
    md = ImageDraw.Draw(m)
    md.line([(mw // 2, 0), (mw // 2, mh)], fill=PAPER, width=6)
    sheet.paste(m, (x, y + 1160))
    for k, ln in enumerate(lines):
        col = UPC if ln.startswith('+') else (OUT if ln.startswith('-') else INK)
        d.text((x, y + 1494 + k * 30), ln, font=MONO5(19), fill=col)

# ---- footer: rejected
y = 2780
d.text((60, y), 'CONSIDERED AND LEFT OUT', font=MONO(22), fill=INK)
rej = ('Deadeye (composed, faces left; best colour contrast but the same stillness problem) · Untouchable (composure, profile) · Took the Pool, '
       'Lab Rat, Bug Hunter (comic) · Final Three (reads vulnerable) · Hundred Trials (seated elder) · Whale, Insider, High Roller, In the Green '
       '(no combat read) · Grudge Settled (an unreviewed glyph on her charms) · starters (everyday degens; Perma-Bull is YOU) · Quick Draw (app-only, not in the kit)')
words, line, ly = rej.split(' '), '', y + 36
for w_ in words:
    if d.textlength(line + w_ + ' ', font=MONO5(19)) > W - 120:
        d.text((60, ly), line, font=MONO5(19), fill=MUTED); ly += 28; line = ''
    line += w_ + ' '
d.text((60, ly), line, font=MONO5(19), fill=MUTED)
sheet.save(sys.argv[1], quality=88)
print(sys.argv[1])
