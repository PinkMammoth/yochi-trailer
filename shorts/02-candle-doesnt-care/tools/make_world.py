#!/usr/bin/env python3
"""THE CANDLE DOESN'T CARE: the procedural world plates (our own layers, rung 3 of the house method ladder).

There are no environment paintings or raster textures in the kit, so the night is built here from ink wash:
  sky.png        sumi night, warm haze toward the horizon, faint ink-wash cloud, washi fibre
  moon.png       an enormous dusky blood moon: the down-candle crimson (#ff4d6d) mixed ~45% into sumi, mottled
                 like wet ink bloom, soft irregular wash edge, faint haze (no rays: not a rising sun)
  ridge-far/mid/near.png   three ink-wash mountain ranges, dry-brush crests, mist pooled at their feet
  mist.png       a tileable horizontal mist band (cream, low alpha)
  grain.png      tileable film grain
  paper.png      the paper end-card ground with washi fibre (SHARED-RULES: #f2ece0 + fibre)
Everything is seeded and deterministic. Writes into project/public/world/.

usage: python3 tools/make_world.py
"""
import os
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'project', 'public', 'world')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(20261115)


def hexc(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32)


def vnoise(w, h, cell, seed):
    """value noise: a random lattice upsampled bicubically (fast, smooth)."""
    r = np.random.default_rng(seed)
    gw, gh = max(2, int(np.ceil(w / cell)) + 3), max(2, int(np.ceil(h / cell)) + 3)
    g = r.random((gh, gw)).astype(np.float32)
    im = Image.fromarray((g * 255).astype(np.uint8), 'L').resize((gw * cell, gh * cell), Image.BICUBIC)
    a = np.asarray(im, np.float32)[cell:cell + h, cell:cell + w] / 255.0
    return a


def fbm(w, h, cell, oct, seed, gain=0.5):
    acc, amp, tot = np.zeros((h, w), np.float32), 1.0, 0.0
    for o in range(oct):
        c = max(2, int(cell / (2 ** o)))
        acc += vnoise(w, h, c, seed + o * 101) * amp
        tot += amp
        amp *= gain
    return acc / tot


def fibre(w, h, seed, strength=1.0):
    """washi fibre: long thin streaks (stretched noise) + fine speckle."""
    r = np.random.default_rng(seed)
    n = r.random((h // 6 + 2, w // 1 + 2)).astype(np.float32)
    im = Image.fromarray((n * 255).astype(np.uint8), 'L').resize((w + 2, (h // 6 + 2) * 6), Image.BILINEAR)
    streak = np.asarray(im, np.float32)[:h, :w] / 255.0
    speck = r.random((h, w)).astype(np.float32)
    return ((streak - 0.5) * 0.6 + (speck - 0.5) * 0.4) * strength


def save(arr, name, mode='RGBA'):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode).save(os.path.join(OUT, name), optimize=True)
    print('wrote', name, arr.shape)


# ---------------------------------------------------------------- sky
def sky():
    W, H = 1500, 2600
    y = np.linspace(0, 1, H)[:, None]
    top, mid, hor = hexc('#0a0808'), hexc('#110c0d'), hexc('#24171a')
    k = np.clip((y - 0.15) / 0.55, 0, 1) ** 1.6
    base = top * (1 - k[..., None]) + mid * k[..., None]
    k2 = np.clip((y - 0.45) / 0.3, 0, 1) ** 2
    base = base * (1 - k2[..., None] * 0.7) + hor * (k2[..., None] * 0.7)
    base = np.broadcast_to(base, (H, W, 3)).copy()
    cloud = fbm(W, H, 420, 5, 11)
    cloud = np.clip((cloud - 0.5) * 2.4, 0, 1) ** 1.5
    base += cloud[..., None] * hexc('#2a1d20') * 0.35
    base += fibre(W, H, 12, 9.0)[..., None]
    save(base, 'sky.png', 'RGB')


# ---------------------------------------------------------------- moon
def moon():
    R, pad = 640, 140
    S = 2 * (R + pad)
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    dx, dy = (xx - S / 2) / R, (yy - S / 2) / R
    d = np.sqrt(dx * dx + dy * dy)
    edge_n = fbm(S, S, 90, 4, 21) - 0.5
    rr = 1 + edge_n * 0.018
    core, hi, maria = hexc('#62202d'), hexc('#822d3c'), hexc('#3e1219')
    # limb: a little brighter toward upper-left, darker at the rim (the wash pooled at the edge)
    light = np.clip(0.5 - (dx * 0.35 + dy * 0.45), 0, 1)
    col = core * (1 - light[..., None]) + hi * light[..., None]
    m = fbm(S, S, 260, 5, 22)
    m = np.clip((m - 0.48) * 3.0, 0, 1)
    col = col * (1 - m[..., None] * 0.7) + maria * (m[..., None] * 0.7)
    bloom = fbm(S, S, 60, 3, 23)
    col *= (0.9 + bloom[..., None] * 0.2)
    ext = np.clip((dy + 0.2) / 1.2, 0, 1) ** 1.5
    col *= (1 - ext[..., None] * 0.35)
    rim = np.clip((d - 0.82) / 0.18, 0, 1) ** 2
    col = col * (1 - rim[..., None] * 0.35) + hexc('#4a1520') * rim[..., None] * 0.35
    col += fibre(S, S, 24, 10.0)[..., None]
    a_disc = np.clip((rr - d) / 0.006, 0, 1)
    halo = np.clip(0.16 * np.exp(-np.maximum(d - 1, 0) * 7.0), 0, 1) * (d >= rr * 0.995)
    halo_col = hexc('#3a141c')
    a = np.maximum(a_disc, halo)
    rgb = np.where(a_disc[..., None] > 0, col, halo_col)
    save(np.dstack([rgb, a * 255]), 'moon.png')


# ---------------------------------------------------------------- ridges
def ridge(name, W, H, base_y, amp, cell, seed, col, crest_col, mist_a):
    """a sumi-e range: ridged-noise peaks, a hazy crest, vertical brush texture (cun), the foot dissolving in mist."""
    x = np.arange(W)
    prof = np.zeros(W, np.float32)
    a, c, tot = 1.0, cell, 0.0
    for o in range(6):
        g = np.random.default_rng(seed + o).random(int(W / max(2, c)) + 4).astype(np.float32)
        xi = x / max(2, c)
        i0 = np.floor(xi).astype(int)
        f = xi - i0
        u = f * f * (3 - 2 * f)
        v = g[i0] * (1 - u) + g[i0 + 1] * u
        prof += (1 - np.abs(2 * v - 1)) * a if o < 3 else v * a
        tot += a
        a *= 0.48
        c /= 2.2
    prof /= tot
    prof = (prof - prof.min()) / (prof.max() - prof.min())
    prof = prof ** 1.45
    top = base_y - prof * amp
    yy = np.arange(H)[:, None].astype(np.float32)
    below = yy - top[None, :]
    n = fbm(W, H, 5, 2, seed + 50)
    alpha = np.clip(below / 5.0 + (n - 0.5) * 1.2, 0, 1)
    # vertical brush texture: noise stretched down the slope
    r = np.random.default_rng(seed + 80)
    v = r.random((H // 40 + 2, W // 3 + 2)).astype(np.float32)
    vt = np.asarray(Image.fromarray((v * 255).astype(np.uint8)).resize((W + 6, (H // 40 + 2) * 40), Image.BICUBIC), np.float32)[:H, :W] / 255.0
    depth = np.clip(below / 220.0, 0, 1)
    rgb = crest_col * (1 - depth[..., None]) + col * depth[..., None]
    wash = fbm(W, H, 160, 4, seed + 70)
    rgb = rgb * (0.82 + wash[..., None] * 0.3 + (vt[..., None] - 0.5) * 0.12 * (1 - depth[..., None] * 0.5))
    rgb += fibre(W, H, seed + 90, 6.0)[..., None]
    # the foot dissolves: alpha fades to the mist below the range
    foot = np.clip((yy - (top[None, :] + 140 + amp * 0.25)) / 260.0, 0, 1)
    alpha = alpha * (1 - foot * (1 - mist_a))
    save(np.dstack([rgb, alpha * 255]), name)


def wisps():
    """thin dark cloud streaks that drift across the moon."""
    W, H = 2400, 900
    n = fbm(W // 8, H, 60, 4, 91)
    n = np.asarray(Image.fromarray((n * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), np.float32) / 255.0
    y = np.linspace(0, 1, H)[:, None]
    bands = np.zeros_like(n)
    for cy, w, s_ in [(0.22, 0.035, 0.8), (0.48, 0.05, 1.0), (0.7, 0.03, 0.7)]:
        bands += np.exp(-((y - cy - (n - 0.5) * 0.12) / w) ** 2) * s_
    a = np.clip(bands * np.clip((n - 0.3) * 2.2, 0, 1), 0, 1) * 0.85
    rgb = np.broadcast_to(hexc('#0d0a0b'), a.shape + (3,))
    save(np.dstack([rgb, a * 255]), 'wisps.png')


# ---------------------------------------------------------------- mist band, grain, paper
def mist():
    W, H = 2400, 600
    n = fbm(W // 6, H, 70, 5, 31)
    n = np.asarray(Image.fromarray((n * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), np.float32) / 255.0
    # tileable horizontally: crossfade the ends
    k = np.linspace(0, 1, 400)[None, :]
    n[:, :400] = n[:, :400] * k + n[:, -400:] * (1 - k)
    n = n[:, :W - 400]
    y = np.linspace(-1, 1, H)[:, None]
    env = np.exp(-(y * 1.6) ** 2)
    a = np.clip((n - 0.38) * 1.8, 0, 1) * env * 0.42
    rgb = np.broadcast_to(hexc('#cbbfb2'), a.shape + (3,))
    save(np.dstack([rgb, a * 255]), 'mist.png')


def grain():
    S = 512
    g = rng.normal(0, 1, (S, S)).astype(np.float32)
    g = np.asarray(Image.fromarray(np.clip(g * 40 + 128, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)), np.float32)
    save(np.dstack([g, g, g]), 'grain.png', 'RGB')


def paper():
    W, H = 1300, 2200
    base = np.broadcast_to(hexc('#f2ece0'), (H, W, 3)).copy()
    base += fibre(W, H, 41, 7.0)[..., None]
    blot = fbm(W, H, 500, 4, 42)
    base *= (0.975 + blot[..., None] * 0.04)
    save(base, 'paper.png', 'RGB')


if __name__ == '__main__':
    import sys
    only = sys.argv[1:]
    if not only or 'sky' in only: sky()
    if not only or 'moon' in only: moon()
    if not only or 'ridge' in only:
        ridge('ridge-far.png', 2200, 760, 520, 360, 460, 61, hexc('#1f1618'), hexc('#3d2a2d'), 0.0)
        ridge('ridge-mid.png', 2200, 760, 540, 280, 380, 62, hexc('#140e10'), hexc('#2b1d20'), 0.0)
        ridge('ridge-near.png', 2200, 760, 560, 200, 300, 63, hexc('#0c090a'), hexc('#1d1416'), 0.0)
    if not only or 'wisps' in only: wisps()
    if not only or 'mist' in only: mist()
    if not only or 'grain' in only: grain()
    if not only or 'paper' in only: paper()
