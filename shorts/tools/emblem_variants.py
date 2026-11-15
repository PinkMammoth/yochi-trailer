#!/usr/bin/env python3
"""Token-emblem experiment for USDC HAS BEEN ELIMINATED v3 (read-only on the canonical art).

Bakes a small HYPE insignia onto Perma-Bull's forearm wrap and a small USDC pin onto Paper Hands' backpack strap,
in two treatments, and writes the results as SEPARATE files. The kit paintings and the film's cut-outs are never
modified.

  colour : the official marks in their own colours (HYPE mint #97FCE4, USDC blue #2775ca + white)
  tonal  : the same shapes in the painting's own thread/ink tones (cream thread on the dark wrap; an ink-and-cream
           enamel pin), so no new accent colour enters the Sumi palette

Marks: shorts/assets/tokens/hype.svg and usdc.svg, fetched unmodified from Hyperliquid's app
(app.hyperliquid.xyz/coins/HYPE.svg, /coins/USDC.svg), the venue's own coin icons. The USDC file is the standard
Circle coin mark (blue disc #2775ca with the white $ and arcs).

The emblem is shaded by the painting underneath (its own light and grain show through), given an ink keyline like
the painting's linework, foreshortened along the cloth, and its edge roughened slightly.

usage: python3 tools/emblem_variants.py      (from shorts/; needs Pillow, numpy, Node + Playwright for SVG rasterising)
writes: assets/cast-variants/<id>-fig-emblem-<treatment>.webp and the comparison sheets in 01-usdc-eliminated/v3/
"""
import io, json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = lambda *p: os.path.join(ROOT, *p)
OUT_VAR = A('assets', 'cast-variants')
OUT_DOC = A('01-usdc-eliminated', 'v3')
FONT = A('assets', 'fonts', 'jetbrains-mono-latin-700-normal.woff2')
DELA = A('assets', 'fonts', 'dela-gothic-one-latin-400-normal.woff2')

# placements in PAINTING px (the card's inner 1392x1828; figure layer is offset by (20, 21))
SPOTS = {
    'starter-perma-bull': dict(token='hype', c=(190, 890), size=92, rot=-14, squash=0.82, where='forearm wrap'),
    'starter-paper-hands': dict(token='usdc', c=(482, 878), size=58, rot=-20, squash=0.9, where='backpack strap'),
}


def raster_svg(path, px):
    """Rasterise an SVG with Chromium (transparent background) and return an RGBA image px x px."""
    svg = open(path).read()
    html = f"<html><body style='margin:0;background:transparent'><img id=i src='data:image/svg+xml;base64,{__import__('base64').b64encode(svg.encode()).decode()}' style='width:{px}px;height:{px}px;display:block'></body></html>"
    js = f"""const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();const p=await b.newPage({{viewport:{{width:{px},height:{px}}}}});
await p.setContent({json.dumps(html)});await p.waitForTimeout(100);
process.stdout.write((await p.locator('#i').screenshot({{omitBackground:true}})).toString('base64'));await b.close();}})();"""
    b64 = subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True).stdout
    return Image.open(io.BytesIO(__import__('base64').b64decode(b64))).convert('RGBA')


def full(cid, fig=None):
    fig = fig or Image.open(A('assets', 'cast', f'{cid}-fig.webp')).convert('RGBA')
    pl = Image.open(A('assets', 'cast', f'{cid}-plate.webp')).convert('RGBA').resize((1392, 1828), Image.LANCZOS)
    pl.alpha_composite(fig, (20, 21))
    return pl


def emblem_layer(cid, treatment):
    """The emblem as an RGBA layer in figure-layer coordinates (same size as the -fig.webp)."""
    s = SPOTS[cid]
    fig = Image.open(A('assets', 'cast', f'{cid}-fig.webp')).convert('RGBA')
    W, H = fig.size
    n = s['size'] * 4
    mark = raster_svg(A('assets', 'tokens', f"{s['token']}.svg"), n)
    m = np.asarray(mark).astype(np.float32) / 255
    a = m[..., 3]
    if treatment == 'tonal':
        if s['token'] == 'hype':
            # cream thread on the dark wrap (the painting's own highlight tone)
            rgb = np.zeros_like(m[..., :3]); rgb[:] = (233 / 255, 214 / 255, 182 / 255)
        else:
            # an enamel pin in ink and cream: the blue disc becomes ink, the white stays cream
            lum = m[..., :3].mean(-1, keepdims=True)
            rgb = np.where(lum > 0.6, np.array([236, 224, 204]) / 255, np.array([28, 24, 20]) / 255)
    else:
        rgb = m[..., :3]
    if s['token'] == 'usdc':
        # a pin has a rim: draw a thin ink ring just outside the disc
        ring = Image.new('L', (n, n), 0); ImageDraw.Draw(ring).ellipse([1, 1, n - 2, n - 2], outline=255, width=max(2, n // 40))
        r = np.asarray(ring).astype(np.float32) / 255
        rgb = rgb * (1 - r[..., None]) + np.array([22, 19, 15]) / 255 * r[..., None]
        a = np.maximum(a, r)
    em = Image.fromarray((np.dstack([rgb, a]) * 255).clip(0, 255).astype(np.uint8), 'RGBA')
    # foreshorten along the cloth and turn with it, then down to size (supersampled)
    em = em.resize((n, int(n * s['squash'])), Image.LANCZOS).rotate(s['rot'], resample=Image.BICUBIC, expand=True)
    k = s['size'] / n
    em = em.resize((max(1, int(em.width * k)), max(1, int(em.height * k))), Image.LANCZOS)
    # ink keyline like the painting's linework: the alpha grown by ~2 px, in ink, under the emblem
    al = em.getchannel('A')
    key = al.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(0.6))
    keyl = Image.new('RGBA', em.size, (22, 19, 15, 0)); keyl.putalpha(key.point(lambda v: int(v * 0.8)))
    keyl.alpha_composite(em); em = keyl
    # place it, in figure-layer coordinates
    cx, cy = s['c'][0] - 20, s['c'][1] - 21
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.alpha_composite(em, (int(cx - em.width / 2), int(cy - em.height / 2)))
    # shade by the painting underneath: its light, folds and grain come through
    L = np.asarray(fig.convert('L')).astype(np.float32) / 255
    box = (int(cx - em.width / 2), int(cy - em.height / 2), int(cx + em.width / 2), int(cy + em.height / 2))
    mean = L[box[1]:box[3], box[0]:box[2]].mean() + 1e-3
    shade = np.clip(0.72 + 0.42 * (L / mean - 1) + 0.28, 0.55, 1.25)
    la = np.asarray(layer).astype(np.float32)
    la[..., :3] = np.clip(la[..., :3] * shade[..., None], 0, 255)
    # a slightly broken edge, like ink/thread on cloth, and a touch less than fully opaque
    rng = np.random.default_rng(5)
    la[..., 3] *= np.clip(0.9 + rng.normal(0, 0.06, la.shape[:2]), 0.7, 1.0)
    return Image.fromarray(la.clip(0, 255).astype(np.uint8), 'RGBA')


def variant_fig(cid, treatment):
    fig = Image.open(A('assets', 'cast', f'{cid}-fig.webp')).convert('RGBA')
    out = fig.copy(); out.alpha_composite(emblem_layer(cid, treatment))
    # keep the original figure's alpha exactly (the emblem only ever lands inside the figure)
    out.putalpha(fig.getchannel('A'))
    return out


def label(img, text, xy, size=22, fill=(22, 19, 15), font=FONT):
    ImageDraw.Draw(img).text(xy, text, font=ImageFont.truetype(font, size), fill=fill)


def comparison():
    os.makedirs(OUT_VAR, exist_ok=True); os.makedirs(OUT_DOC, exist_ok=True)
    cols = [('A · EXISTING (UNMODIFIED)', None), ('B1 · OFFICIAL COLOURS', 'colour'), ('B2 · TONAL (THREAD / INK)', 'tonal')]
    figs = {}
    for cid in SPOTS:
        for _, tr in cols[1:]:
            v = variant_fig(cid, tr)
            v.save(os.path.join(OUT_VAR, f'{cid}-fig-emblem-{tr}.webp'), quality=92, method=6)
            figs[(cid, tr)] = v
    # one sheet: per character, three rows: in-film panel size, half-figure, 1:1 detail
    cw = 520; pad = 30
    sheet = Image.new('RGB', (pad + 3 * (cw + pad), 140 + 2 * 1320), (242, 236, 224))
    label(sheet, 'TOKEN EMBLEMS · A / B COMPARISON', (pad, 34), 40, font=DELA)
    label(sheet, 'Marks: Hyperliquid app coin icons (HYPE, USDC). Originals untouched; variants in shorts/assets/cast-variants/.', (pad, 92), 18, (93, 85, 72))
    y0 = 140
    for cid, s in SPOTS.items():
        label(sheet, f"{'PERMA-BULL · HYPE on the ' if 'bull' in cid else 'PAPER HANDS · USDC pin on the '}{s['where']}".upper(), (pad, y0), 22)
        for j, (title, tr) in enumerate(cols):
            x = pad + j * (cw + pad)
            img = full(cid, figs.get((cid, tr)))
            label(sheet, title, (x, y0 + 34), 17, (179, 48, 30) if tr else (22, 19, 15))
            # (1) the film's stage panel: 520 x 640 at painting scale 0.6
            fx, fy = (560, 470) if 'bull' in cid else (900, 580)
            sc = 0.6; pw, ph = 520, 640
            ox, oy = pw * 0.5 - fx * sc, ph * 0.42 - fy * sc
            pan = img.resize((int(1392 * sc), int(1828 * sc)), Image.LANCZOS)
            panel = Image.new('RGB', (pw, ph), (242, 236, 224)); panel.paste(pan, (int(ox), int(oy)), pan)
            panel = panel.resize((cw, int(ph * cw / pw)))
            sheet.paste(panel, (x, y0 + 64)); label(sheet, 'in-film panel size (1:1 with the 1080p stage)', (x, y0 + 64 + 640 + 6), 14, (93, 85, 72))
            # (2) 1:1 detail around the emblem
            d = 230
            cx = min(max(s['c'][0], d), 1392 - d); cy = min(max(s['c'][1], d), 1828 - d)  # stay inside the painting
            det = img.crop((cx - d, cy - d, cx + d, cy + d)).resize((cw, cw), Image.LANCZOS).convert('RGB')
            sheet.paste(det, (x, y0 + 64 + 670)); label(sheet, 'detail (2.3x)', (x, y0 + 64 + 670 + cw + 4), 14, (93, 85, 72))
        y0 += 1320
    sheet.save(os.path.join(OUT_DOC, 'emblem-comparison.jpg'), quality=88)
    # fidelity: how much of each painting changes
    rep = {}
    for (cid, tr), v in figs.items():
        o = np.asarray(Image.open(A('assets', 'cast', f'{cid}-fig.webp')).convert('RGBA')).astype(np.int16)
        nv = np.asarray(v).astype(np.int16)
        ch = (np.abs(o - nv).max(-1) > 2)
        rep[f'{cid}/{tr}'] = dict(changed_px=int(ch.sum()), changed_pct=round(100 * ch.mean(), 3))
    json.dump(rep, open(os.path.join(OUT_DOC, 'emblem-fidelity.json'), 'w'), indent=1)
    print(json.dumps(rep, indent=1))


if __name__ == '__main__':
    comparison()
