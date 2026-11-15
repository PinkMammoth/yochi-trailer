#!/usr/bin/env python3
"""Contact sheets for the Yochi asset audit (read-only; writes only to docs/asset-audit/contact-sheets/).

    python3 docs/asset-audit/tools/contact_sheets.py

Sheets:
  01-cast-current.jpg      the 28 painted characters as they should be used today (v2 Perma-Bull and Cold Blooded)
  02-cast-cutouts.jpg      every figure cut-out (on a checkerboard) beside its background plate: the 2.5D layers
  03-cast-revisions.jpg    kit paintings that were superseded or retired, beside their replacements
  04-ui-reference.jpg      approved mocks, real app captures and the 30 Oct 4K stills
  05-legacy-do-not-use.jpg pre-rebrand art, for recognition only
  06-brand-system.png      logos, seals, Elysium marks, fonts, colour tokens (rendered in Chromium)
  07-matte-problems.jpg    the cut-outs that need fixing or care before layered (2.5D) use

Branch-only assets are read straight from Git (`git show <branch>:<path>`), so nothing has to be checked out.
"""
import io, json, os, re, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip()
OUT = os.path.join(ROOT, 'docs/asset-audit/contact-sheets')
FLAG = 'origin/claude/yochi-first-ad-order-a'   # the locked first ad: cut-outs, plates, v2 paintings
KIT = 'asset-pack/sumi'
FONT = os.path.join(ROOT, KIT, 'fonts/jetbrains-mono-latin-700-normal.woff2')
FONT_R = os.path.join(ROOT, KIT, 'fonts/jetbrains-mono-latin-400-normal.woff2')
DELA = os.path.join(ROOT, KIT, 'fonts/dela-gothic-one-latin-400-normal.woff2')
PAPER, INK, MUTED, RED, OUTC = (242, 236, 224), (22, 19, 15), (93, 85, 72), (214, 64, 43), (110, 102, 90)


def f(path, size): return ImageFont.truetype(path, size)


def blob(ref, path):
    return Image.open(io.BytesIO(subprocess.run(['git', '-C', ROOT, 'show', f'{ref}:{path}'],
                                                capture_output=True, check=True).stdout))


def local(path): return Image.open(os.path.join(ROOT, path))


def fit(im, w, h, bg=None):
    im = im.convert('RGBA')
    s = min(w / im.width, h / im.height)
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    cell = Image.new('RGBA', (w, h), bg or (0, 0, 0, 0))
    cell.alpha_composite(im, ((w - im.width) // 2, (h - im.height) // 2))
    return cell


def checker(w, h, n=16):
    c = Image.new('RGBA', (w, h), (255, 255, 255, 255)); d = ImageDraw.Draw(c)
    for y in range(0, h, n):
        for x in range(0, w, n):
            if (x // n + y // n) % 2: d.rectangle([x, y, x + n - 1, y + n - 1], fill=(214, 210, 202, 255))
    return c


def header(W, title, sub, h=120, warn=False):
    im = Image.new('RGB', (W, h), (15, 13, 11) if warn else PAPER); d = ImageDraw.Draw(im)
    d.text((40, 26), title, font=f(DELA, 40), fill=(239, 231, 216) if warn else INK)
    d.text((42, 80), sub, font=f(FONT_R, 17), fill=(163, 154, 138) if warn else MUTED)
    return im


def stack(parts):
    W = max(p.width for p in parts); H = sum(p.height for p in parts)
    out = Image.new('RGB', (W, H), PAPER); y = 0
    for p in parts: out.paste(p, (0, y)); y += p.height
    return out


def kit_roster():
    rows = []
    for line in open(os.path.join(ROOT, KIT, 'README.md'), encoding='utf8'):
        m = re.match(r'\| ([^|]+) \| (starter|reward) \| `cards/([^`]+)\.webp` \| `portraits/[^`]+` \| ([^|]+) \|', line)
        if m: rows.append(dict(name=m.group(1).strip(), fam=m.group(2), id=m.group(3), unlock=m.group(4).strip()))
    return rows


V2 = {'starter-perma-bull': 'film-flagship/assets/cast/source/starter-perma-bull.webp',
      'cold-blooded': 'film-flagship/assets/cast/source/cold-blooded.webp'}


def card_for(cid):
    return blob(FLAG, V2[cid]) if cid in V2 else local(f'{KIT}/avatars/cards/{cid}.webp')


def sheet_cast(roster):
    cw, ch, lh, cols, pad = 300, 400, 64, 7, 18
    rows = (len(roster) + cols - 1) // cols
    W = cols * (cw + pad) + pad
    grid = Image.new('RGB', (W, rows * (ch + lh + pad) + pad), PAPER); d = ImageDraw.Draw(grid)
    for i, r in enumerate(roster):
        x, y = pad + (i % cols) * (cw + pad), pad + (i // cols) * (ch + lh + pad)
        grid.paste(fit(card_for(r['id']), cw, ch, PAPER + (255,)).convert('RGB'), (x, y))
        tag = ' (v2, 5 Nov)' if r['id'] in V2 else ''
        d.text((x, y + ch + 6), r['name'].upper() + tag, font=f(FONT, 15), fill=RED if tag else INK)
        d.text((x, y + ch + 28), f"{r['fam']} · {r['unlock']}"[:40], font=f(FONT_R, 12), fill=MUTED)
        d.text((x, y + ch + 44), r['id'] + '.webp', font=f(FONT_R, 11), fill=OUTC)
    h = header(W, 'THE CAST · CURRENT (28)', 'asset-pack/sumi/avatars/cards/*.webp 1536x2048 · red label = owner v2 painting, '
               f'only on {FLAG.split("/", 1)[1]}:film-flagship/assets/cast/source/')
    stack([h, grid]).save(os.path.join(OUT, '01-cast-current.jpg'), quality=86)


def sheet_cutouts(roster):
    J = json.loads(subprocess.run(['git', '-C', ROOT, 'show', f'{FLAG}:film-flagship/assets/cast/cast.json'],
                                  capture_output=True).stdout)
    cw, ch, lh, cols, pad = 210, 276, 40, 7, 16
    pair = cw * 2 + 6
    rows = (len(roster) + cols - 1) // cols
    W = cols * (pair + pad) + pad
    grid = Image.new('RGB', (W, rows * (ch + lh + pad) + pad), PAPER); d = ImageDraw.Draw(grid)
    for i, r in enumerate(roster):
        x, y = pad + (i % cols) * (pair + pad), pad + (i // cols) * (ch + lh + pad)
        fig = blob(FLAG, f'film-flagship/assets/cast/{r["id"]}-fig.webp')
        plate = blob(FLAG, f'film-flagship/assets/cast/{r["id"]}-plate.webp')
        cb = checker(cw, ch); cb.alpha_composite(fit(fig, cw, ch)); grid.paste(cb.convert('RGB'), (x, y))
        grid.paste(fit(plate, cw, ch, PAPER + (255,)).convert('RGB'), (x + cw + 6, y))
        j = J[r['id']]
        a = fig.convert('RGBA').getchannel('A'); hist = a.histogram(); n = fig.width * fig.height
        cover = 1 - sum(hist[:8]) / n
        cut = 'FULL' if j['fig'][1] + j['fig'][3] < j['paint'][1] - 20 else 'CROPPED AT FRAME'
        d.text((x, y + ch + 4), r['name'].upper(), font=f(FONT, 13), fill=INK)
        d.text((x, y + ch + 22), f"fig {fig.width}x{fig.height} · fill {cover:.0%} · {cut}", font=f(FONT_R, 11), fill=MUTED)
    h = header(W, '2.5D LAYERS · FIGURE + PLATE', f'{FLAG.split("/", 1)[1]}:film-flagship/assets/cast/<id>-fig.webp '
               '(BiRefNet cut-out, alpha) and <id>-plate.webp (figure filled, for parallax)')
    stack([h, grid]).save(os.path.join(OUT, '02-cast-cutouts.jpg'), quality=86)


def sheet_revisions():
    pairs = [('PERMA-BULL · KIT (superseded?)', local(f'{KIT}/avatars/cards/starter-perma-bull.webp'), OUTC),
             ('PERMA-BULL · V2 (owner, 5 Nov)', blob(FLAG, V2['starter-perma-bull']), RED),
             ('COLD BLOODED · KIT (superseded?)', local(f'{KIT}/avatars/cards/cold-blooded.webp'), OUTC),
             ('COLD BLOODED · V2 (owner, 5 Nov)', blob(FLAG, V2['cold-blooded']), RED),
             ('GUNSLINGER · RETIRED 30 OCT', local(f'{KIT}/avatars/cards/gunslinger.webp'), OUTC),
             ('RONIN · REPLACEMENT', local(f'{KIT}/avatars/cards/ronin.webp'), INK)]
    cw, ch, pad, lh = 360, 480, 20, 40
    W = len(pairs) * (cw + pad) + pad
    g = Image.new('RGB', (W, ch + lh + 2 * pad), PAPER); d = ImageDraw.Draw(g)
    for i, (t, im, col) in enumerate(pairs):
        x = pad + i * (cw + pad)
        g.paste(fit(im, cw, ch, PAPER + (255,)).convert('RGB'), (x, pad))
        d.text((x, pad + ch + 8), t, font=f(FONT, 14), fill=col)
    h = header(W, 'REVISIONS · WHICH PAINTING IS CANON', 'Kit text still describes the old Cold Blooded '
               '("silver-haired swordswoman"); the v2 painting is a man. Decision needed: promote v2 into asset-pack/sumi?')
    stack([h, g]).save(os.path.join(OUT, '03-cast-revisions.jpg'), quality=86)


def grid_sheet(items, title, sub, name, cw=420, ch=262, cols=5, warn=False):
    pad, lh = 16, 34
    rows = (len(items) + cols - 1) // cols
    W = cols * (cw + pad) + pad
    bg = (15, 13, 11) if warn else PAPER
    g = Image.new('RGB', (W, rows * (ch + lh + pad) + pad), bg); d = ImageDraw.Draw(g)
    for i, (label, im) in enumerate(items):
        x, y = pad + (i % cols) * (cw + pad), pad + (i // cols) * (ch + lh + pad)
        g.paste(fit(im, cw, ch, bg + (255,)).convert('RGB'), (x, y))
        d.text((x, y + ch + 6), label[:52], font=f(FONT_R, 12), fill=(163, 154, 138) if warn else MUTED)
    stack([header(W, title, sub, warn=warn), g]).save(os.path.join(OUT, name), quality=84)


def sheet_ui():
    items = []
    for p in sorted(os.listdir(os.path.join(ROOT, KIT, 'reference/screens'))):
        items.append(('sumi/reference/screens/' + p, local(f'{KIT}/reference/screens/{p}')))
    base = 'asset-pack/4k clips + hq stills/stills/desktop'
    for p in sorted(os.listdir(os.path.join(ROOT, base))):
        items.append(('4k stills/desktop/' + p, local(f'{base}/{p}')))
    grid_sheet(items, 'UI REFERENCE · CURRENT', 'Approved mocks, built-app captures (Oct) and the 30 Oct 4K capture stills. '
               'Rebuild in the renderer; never present as a real match.', '04-ui-reference.jpg')


def sheet_legacy():
    picks = ['asset-pack/Yochi_logo.png', 'asset-pack/1.png', 'asset-pack/ffa-victory-full.png',
             'asset-pack/yochi-card-16x9-duels.png', 'stills/Screenshot 2026-09-28 182428.png']
    for d0 in ['asset-pack/characters', 'asset-pack/characters/base-rig', 'asset-pack/avatars', 'asset-pack/props']:
        fs = sorted(x for x in os.listdir(os.path.join(ROOT, d0)) if x.endswith(('.png', '.webp', '.jpg')))
        picks += [f'{d0}/{x}' for x in fs[:3]]
    items = [(p.replace('asset-pack/', ''), local(p)) for p in picks]
    fr = os.path.join(ROOT, 'docs/asset-audit/contact-sheets/.frames'); os.makedirs(fr, exist_ok=True)
    for clip in ['br-wipeout', 'nemesis-alerts']:
        o = os.path.join(fr, clip + '.jpg')
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', '3', '-i',
                        os.path.join(ROOT, f'asset-pack/raw-clips/{clip}.mp4'), '-frames:v', '1', o])
        items.append((f'raw-clips/{clip}.mp4 @3s', Image.open(o)))
    grid_sheet(items, 'LEGACY · DO NOT USE', 'September cyan brand: hooded LED-visor contestants, pepes, glass props, '
               'cyan Y, Chakra Petch, PUMP/DUMP. Kept for history only.', '05-legacy-do-not-use.jpg',
               cw=300, ch=240, cols=7, warn=True)
    for x in os.listdir(fr): os.remove(os.path.join(fr, x))
    os.rmdir(fr)


def sheet_mattes():
    """Card | figure on magenta | plate, for the cut-outs that need care before 2.5D use."""
    ids = [('starter-contrarian', 'CONTRARIAN · DOWN sign left in the plate'), ('deadeye', 'DEADEYE · crossbow fragments in plate'),
           ('whale', 'WHALE · matte took the whole painting'), ('insider-v2', 'INSIDER · ground halo in figure'),
           ('lab-rat', 'LAB RAT · matte failed'), ('starter-lucky-fool', 'LUCKY FOOL · coins split across layers (good)'),
           ('rampage', 'RAMPAGE · figure includes ground'), ('grudge-settled', 'GRUDGE SETTLED · red ground kept in figure')]
    cw, ch, pad, lh = 230, 306, 14, 30
    trip = cw * 3 + 8
    W = 4 * (trip + pad) + pad
    g = Image.new('RGB', (W, 2 * (ch + lh + pad) + pad), PAPER); d = ImageDraw.Draw(g)
    for i, (cid, note) in enumerate(ids):
        x, y = pad + (i % 4) * (trip + pad), pad + (i // 4) * (ch + lh + pad)
        for k, kind in enumerate(['card', 'fig', 'plate']):
            im = blob(FLAG, f'film-flagship/assets/cast/{cid}-{kind}.webp')
            bg = (255, 0, 255, 255) if kind == 'fig' else PAPER + (255,)
            g.paste(fit(im, cw, ch, bg).convert('RGB'), (x + k * (cw + 4), y))
        d.text((x, y + ch + 6), note, font=f(FONT, 13), fill=INK)
    h = header(W, 'MATTES THAT NEED CARE', 'card | figure on magenta | plate. Fix or avoid these before layered use '
               '(see docs/asset-audit/ANIMATION_FEASIBILITY.md)')
    stack([h, g]).save(os.path.join(OUT, '07-matte-problems.jpg'), quality=84)


BRAND_HTML = r'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Dela;src:url(KIT/fonts/dela-gothic-one-latin-400-normal.woff2)}
@font-face{font-family:Mono;font-weight:400;src:url(KIT/fonts/jetbrains-mono-latin-400-normal.woff2)}
@font-face{font-family:Mono;font-weight:700;src:url(KIT/fonts/jetbrains-mono-latin-700-normal.woff2)}
@font-face{font-family:Zen;font-weight:700;src:url(KIT/fonts/zen-kaku-gothic-new-latin-700-normal.woff2)}
@font-face{font-family:Yuji;src:url(KIT/fonts/YujiSyuku-Regular.ttf)}
body{margin:0;width:1800px;background:#f2ece0;color:#16130f;font-family:Mono}
h1{font-family:Dela;font-weight:400;font-size:40px;margin:0 0 4px}
.sub{color:#5d5548;font-size:16px;margin-bottom:24px}
.wrap{padding:36px 40px}
.row{display:flex;gap:20px;margin-bottom:26px;flex-wrap:wrap}
.tile{border:1px solid rgba(22,19,15,.12);padding:16px;background:#fbf8f2;display:flex;flex-direction:column;gap:10px;align-items:flex-start}
.tile.dark{background:#0f0d0b;color:#efe7d8;border-color:#221e1a}
.tile img{height:120px}
.lab{font-size:12px;color:#5d5548}.dark .lab{color:#a39a8a}
.sw{width:150px}.chip{height:70px;width:150px;border:1px solid rgba(0,0,0,.15)}
.dela{font-family:Dela;font-size:56px}.zen{font-family:Zen;font-size:30px;font-weight:700}
.yuji{font-family:Yuji;font-size:64px}.mono{font-family:Mono;font-weight:700;font-size:30px;letter-spacing:.08em}
</style></head><body><div class="wrap">
<h1>BRAND SYSTEM · SUMI</h1><div class="sub">asset-pack/sumi/README.md and SHARED-RULES.md · Elysium marks from asset-pack/Elysium/ (owner-supplied 7 Nov)</div>
<div class="row">
<div class="tile"><img src="KIT/logo/yochi-seal-paper.svg"><div class="lab">yochi-seal-paper.svg · MAIN MARK</div></div>
<div class="tile dark"><img src="KIT/logo/yochi-seal-sumi.svg"><div class="lab">yochi-seal-sumi.svg</div></div>
<div class="tile"><img src="KIT/logo/yochi-mark-paper.svg"><div class="lab">yochi-mark-paper.svg · small lockups</div></div>
<div class="tile dark"><img src="KIT/logo/yochi-mark-sumi.svg"><div class="lab">yochi-mark-sumi.svg</div></div>
<div class="tile"><div style="display:flex;align-items:center;gap:14px"><img style="height:70px" src="KIT/logo/yochi-seal-paper.svg"><span class="dela">YOCHI</span></div><div class="lab">lockup: seal + Dela wordmark</div></div>
</div>
<div class="row">
<div class="tile"><img src="EL/elysium-logomark-colorized.svg"><div class="lab">elysium-logomark-colorized.svg · used in approved card</div></div>
<div class="tile"><img src="EL/elysium-logomark-dark.svg"><div class="lab">elysium-logomark-dark.svg</div></div>
<div class="tile dark"><img src="EL/elysium-logomark-light.svg"><div class="lab">elysium-logomark-light.svg</div></div>
<div class="tile"><img style="height:60px" src="EL/elysium-wordmark-dark.svg"><div class="lab">elysium-wordmark-dark.svg</div></div>
<div class="tile"><img style="height:70px" src="EL/elysium-logomark-wordmark-dark.svg"><div class="lab">elysium-logomark-wordmark-dark.svg</div></div>
</div>
<div class="row">
<div class="tile"><span class="dela">ROUND 1 · 対</span><div class="lab">Dela Gothic One · moments, names, results</div></div>
<div class="tile"><span class="mono">+19.00 USDC · 0:01</span><div class="lab">JetBrains Mono · every number, tracked caps</div></div>
<div class="tile"><span class="zen">Whoever's right takes the pot.</span><div class="lab">Zen Kaku Gothic New · sentences</div></div>
<div class="tile"><span class="yuji">決 勝 敗 命</span><div class="lab">Yuji Syuku · kanji only (pending native review)</div></div>
</div>
<div class="row">SWATCHES</div>
</div></body></html>'''

TOKENS = [('#0f0d0b', 'sumi bg'), ('#1a1714', 'sumi surface-1'), ('#221e1a', 'sumi surface-2'), ('#efe7d8', 'ink on sumi / band'),
          ('#f2ece0', 'paper bg'), ('#16130f', 'ink on paper'), ('#ff5436', 'vermilion (sumi)'), ('#d6402b', 'vermilion (paper)'),
          ('#b3301e', 'vermilion small text'), ('#8f8676', 'out / loss (sumi)'), ('#3ddc84', 'up candle'), ('#ff4d6d', 'down candle'),
          ('#e0b25a', 'gold: tier metal only')]


def sheet_brand():
    sw = ''.join(f'<div class="tile sw"><div class="chip" style="background:{c}"></div><div class="lab">{c}<br>{n}</div></div>'
                 for c, n in TOKENS)
    html = BRAND_HTML.replace('KIT/', f'file://{ROOT}/{KIT}/').replace('EL/', f'file://{ROOT}/asset-pack/Elysium/') \
        .replace('SWATCHES', sw)
    p = os.path.join(OUT, '.brand.html'); open(p, 'w').write(html)
    js = f'''const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();const pg=await b.newPage({{viewport:{{width:1800,height:900}},deviceScaleFactor:1}});
await pg.goto('file://{p}');await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(300);
await pg.screenshot({{path:'{os.path.join(OUT, "06-brand-system.png")}',fullPage:true}});await b.close();}})();'''
    subprocess.run(['node', '-e', js], check=True)
    os.remove(p)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    roster = kit_roster()
    assert len(roster) == 28, len(roster)
    for fn in (lambda: sheet_cast(roster), lambda: sheet_cutouts(roster), sheet_revisions, sheet_ui, sheet_legacy, sheet_brand, sheet_mattes):
        fn()
    print('\n'.join(sorted(os.listdir(OUT))))
