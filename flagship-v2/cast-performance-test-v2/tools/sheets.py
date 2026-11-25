#!/usr/bin/env python3
"""Review sheets for the v2 tests.  usage: python3 tools/sheets.py <study_dir>
study_dir: locked-camera Untouchable v2 frames (un2-fixed-fNNNN.png) from remotion/tools/frames.mjs.
Writes deliverables/:
  <cut>-contact.jpg                          timed contact sheets for every v2 cut
  cold-blooded-v2-pose-registration.jpg      A, B, B registered, onion, flow, the change region; the arm/mask path; numbers
  cold-blooded-v2-layers.jpg                 the layers each method uses
  cold-blooded-v2-transition-frames.jpg      every frame through the lift (concealed, chosen), full frame + face crop
  cold-blooded-v2-method-ab.jpg              method A (layered) vs B (concealed): the same moments side by side
  untouchable-v2-source-comparison.jpg       portrait vs landscape (registration, the hybrid seam, 1:1 face detail)
  untouchable-v2-layer-separation.jpg        the strands (coloured, roots), the three groups, s along each strand, plate, core
  untouchable-v2-motion-map.jpg              what moves (locked camera, 1 s), with region statistics
  untouchable-v1-vs-v2-ribbons.jpg           the same moments: v1 (single displacement field) vs v2 (separated strands)
"""
import glob, json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageDraw, ImageFont
H = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); DL = f'{H}/deliverables'; DR = f'{H}/assets/derived'
V1 = f'{H}/../cast-performance-test/deliverables'
STUDY = sys.argv[1] if len(sys.argv) > 1 else None
INK, PAPER = (22, 19, 15), (242, 236, 224)
def font(s):
    try: return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', s)
    except OSError: return ImageFont.load_default()
_cache = {}
def frames(mp4):
    if mp4 in _cache: return _cache[mp4]
    d = tempfile.mkdtemp(); subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, f'{d}/%04d.png'], check=True)
    _cache[mp4] = (d, len(os.listdir(d))); return _cache[mp4]
def fr(d, i): return Image.open(f'{d}/{i + 1:04d}.png').convert('RGB')
def label(im, text, s=22):
    im = im.copy(); dr = ImageDraw.Draw(im); dr.rectangle([0, 0, im.width, s + 12], fill=INK); dr.text((8, 5), text, fill=PAPER, font=font(s)); return im
def grid(tiles, cols, tw, th, title, caps=None, pad=6, top=60, cap_h=24):
    rows = (len(tiles) + cols - 1) // cols
    S = Image.new('RGB', (cols * (tw + pad) + pad, top + rows * (th + cap_h + pad) + pad), PAPER); dr = ImageDraw.Draw(S)
    dr.text((pad + 4, 14), title, fill=INK, font=font(26))
    for i, im in enumerate(tiles):
        x = pad + (i % cols) * (tw + pad); y = top + (i // cols) * (th + cap_h + pad)
        S.paste(im.resize((tw, th), Image.LANCZOS), (x, y))
        if caps: dr.text((x + 2, y + th + 3), caps[i], fill=INK, font=font(15))
    return S
def stack(*ims):
    W = max(i.width for i in ims); S = Image.new('RGB', (W, sum(i.height for i in ims)), PAPER); y = 0
    for i in ims: S.paste(i, (0, y)); y += i.height
    return S
def chk(p):
    a = np.array(Image.open(p)).astype(np.float32); al = a[..., 3:] / 255
    return Image.fromarray((a[..., :3] * al + np.array([255, 0, 255]) * (1 - al)).astype(np.uint8))

CUTS = [('untouchable-v2-cinematic', 'UNTOUCHABLE v2 · cinematic', 0.1), ('untouchable-v2-trailer', 'UNTOUCHABLE v2 · trailer (6 beats)', 0.05),
        ('untouchable-v2-rigid-ab', 'UNTOUCHABLE v2 · A/B: strands held still', 0.2),
        ('cold-blooded-v2-cinematic', 'COLD BLOODED v2 · cinematic (method B, concealed)', 0.1), ('cold-blooded-v2-trailer', 'COLD BLOODED v2 · trailer (7 beats)', 0.05),
        ('cold-blooded-v2-method-a-layered', 'COLD BLOODED v2 · method A (layered, registered cut)', 0.1)]
for name, title, step in CUTS:
    mp4 = f'{DL}/{name}.mp4'
    if not os.path.exists(mp4): continue
    d, n = frames(mp4); idx = list(range(0, n, max(1, round(step * 60))))
    grid([fr(d, i) for i in idx], 8, 300, 169, f'{title} ({n / 60:.2f} s) · every {step} s', [f'{i / 60:.2f}s f{i}' for i in idx]).save(f'{DL}/{name}-contact.jpg', quality=84)

# ---------------------------------------------------------------- Cold Blooded
reg = json.load(open(f'{DR}/cb-registration.json'))
A = Image.open(f'{H}/assets/source/cold-blooded-mask-lowered.webp').convert('RGB'); B = Image.open(f'{H}/assets/source/cold-blooded-mask-raised.webp').convert('RGB')
ch = Image.open(f'{DR}/reg/cb-change.jpg').convert('RGB'); path = A.copy(); dr = ImageDraw.Draw(path)
for k in range(0, 21):
    u = k / 20; x = 715 - 45 * u; y = 585 - 320 * u; dr.ellipse([x - 5, y - 5, x + 5, y + 5], fill=(255, 84, 54))
dr.text((730, 600), 'A mask centre', fill=(255, 84, 54), font=font(24)); dr.text((690, 240), 'B mask centre', fill=(255, 84, 54), font=font(24))
tiles = [label(A, 'A: mask lowered (new)'), label(B, 'B: mask raised (approved)'), label(Image.open(f'{DR}/reg/cb-B-registered.png').convert('RGB'), 'B registered onto A'),
         label(Image.open(f'{DR}/reg/cb-onion.jpg').convert('RGB'), 'onion: grey = the same drawing'), label(Image.open(f'{DR}/reg/cb-flow.jpg').convert('RGB'), 'flow A -> B'),
         label(ch, 'change region (red), 37% of the figure'), label(path, 'the gesture path: 320 px up, 45 px left')]
S = grid(tiles, 7, 360, 480, 'COLD BLOODED v2 · pose registration (B onto A: similarity, SIFT + RANSAC)', cap_h=0)
W = Image.new('RGB', (S.width, S.height + 330), PAPER); W.paste(S, (0, 0)); dr = ImageDraw.Draw(W); y = S.height + 8
dr.text((12, y), f"scale {reg['scale']:.4f} (B is 3% larger), rotation {reg['rot']:.2f} deg, {reg['inliers']} inliers, median residual {reg['median_res']:.2f} px", fill=INK, font=font(20)); y += 32
for k, v in reg['regions'].items():
    verdict = 'CHANGES' if v['flow_med'] > 8 else ('partly' if v['flow_p90'] > 15 else 'same drawing')
    dr.text((12, y), f"{k:24s} flow median {v['flow_med']:6.2f} px   p90 {v['flow_p90']:7.2f}   dE {v['dE_med']:6.2f}   {verdict}", fill=INK, font=font(18)); y += 24
W.save(f'{DL}/cold-blooded-v2-pose-registration.jpg', quality=86)
L = f'{DR}/layers'
grid([label(chk(f'{L}/{n}.png'), c) for n, c in (('cb-A', 'A'), ('cb-B', 'B registered'), ('cb-Ahand', "A's mask+hand (shot 1)"), ('cb-Bhand', "B's mask+hand+forearm (rises)"),
      ('cb-base1', 'base, shot 1'), ('cb-base2', 'base, shot 2 (A head, B chest)'))], 6, 360, 480, 'COLD BLOODED v2 · layers (magenta = transparent)', cap_h=0).save(f'{DL}/cold-blooded-v2-layers.jpg', quality=86)
cin = f'{DL}/cold-blooded-v2-cinematic.mp4'
if os.path.exists(cin):
    d, n = frames(cin)
    idx = list(range(118, 236, 3))
    full = grid([fr(d, i) for i in idx], 8, 240, 135, 'COLD BLOODED v2 · the lift, every 3rd frame (f118-235), full frame', [f'f{i} {i / 60:.2f}s' for i in idx])
    idx2 = list(range(150, 166)) + list(range(218, 226))
    face = grid([fr(d, i).crop((380, 0, 1340, 1080)) for i in idx2], 8, 240, 270, 'face crop, every frame through the hand swap (f150-165) and the settle (f218-225)', [f'f{i}' for i in idx2])
    stack(full, face).save(f'{DL}/cold-blooded-v2-transition-frames.jpg', quality=86)
la = f'{DL}/cold-blooded-v2-method-a-layered.mp4'
if os.path.exists(cin) and os.path.exists(la):
    dA, nA = frames(la); dB, nB = frames(cin)
    tA = [1.8, 2.3, 2.58, 2.6, 2.62, 2.64, 2.7, 3.2]; tB = [1.8, 2.3, 2.5, 2.6, 2.8, 3.1, 3.5, 3.9]
    rowA = [label(fr(dA, round(t * 60)).resize((480, 270)), f'A layered {t:.2f}s', 16) for t in tA]
    rowB = [label(fr(dB, round(t * 60)).resize((480, 270)), f'B concealed {t:.2f}s', 16) for t in tB]
    grid(rowA + rowB, 8, 480, 270, 'COLD BLOODED v2 · method A (top: layered, registered masked cut) vs method B (bottom: concealed, chosen)', cap_h=0).save(f'{DL}/cold-blooded-v2-method-ab.jpg', quality=86)

# ---------------------------------------------------------------- Untouchable
ur = json.load(open(f'{DR}/un-registration.json'))
P = Image.open(f'{H}/assets/source/untouchable-portrait.webp').convert('RGB'); Ls = Image.open(f'{H}/assets/source/untouchable-landscape.webp').convert('RGB')
hyb = Image.open(f'{L}/un-hybrid.png').convert('RGB'); Lup = Image.open(f'{DR}/reg/un-L-up.png').convert('RGB')
face = (980, 110, 1300, 400)
tiles = [label(P.resize((round(P.width * 540 / P.height), 540)), f'portrait {P.width}x{P.height}'), label(Ls.resize((960, 540)), f'landscape {Ls.width}x{Ls.height} (figure at {ur["scale"]:.3f}x)'),
         label(Image.open(f'{DR}/reg/un-onion.jpg').convert('RGB').resize((960, 540)), 'onion: portrait (red) on landscape (cyan)'),
         label(Image.open(f'{DR}/reg/un-seam.jpg').convert('RGB').resize((960, 540)), 'the hybrid: portrait (red), seam warp band (blue)'),
         label(Lup.crop(face).resize((480, 435)), 'face, landscape (upscaled to match)'), label(hyb.crop(face).resize((480, 435)), 'face, hybrid (portrait pixels)')]
S = Image.new('RGB', (P.resize((round(P.width * 540 / P.height), 540)).width + 3 * 970, 1000), PAPER); x = 0
for t_ in tiles[:4]: S.paste(t_, (x, 0)); x += t_.width + 10
S.paste(tiles[4], (0, 550)); S.paste(tiles[5], (490, 550))
dr = ImageDraw.Draw(S); y = 560
for k, v in ur['regions'].items():
    dr.text((1000, y), f"{k:20s} flow median {v[0]:6.2f} px  p90 {v[1]:6.2f}   {'registers' if v[0] < 7 else 'redrawn'}", fill=INK, font=font(19)); y += 26
dr.text((1000, y + 10), f"portrait -> landscape: scale {ur['scale']:.4f}, rotation {ur['rot']:.2f} deg, {ur['inliers']} inliers, median {ur['median_res']:.2f} px", fill=INK, font=font(19))
S.save(f'{DL}/untouchable-v2-source-comparison.jpg', quality=86)
grid([label(Image.open(f'{DR}/reg/un-strands.jpg').convert('RGB'), 'separated strands (colour), roots (white), body (grey)'),
      label(Image.open(f'{DR}/reg/un-groups.jpg').convert('RGB'), 'three interleaved groups (neighbours never share one)'),
      label(Image.open(f'{DR}/reg/un-s.jpg').convert('RGB'), 's along each strand (root red -> tip blue)'),
      label(Image.open(f'{L}/un-plate.png').convert('RGB'), 'plate: strands lifted off, paper continued'),
      label(chk(f'{L}/un-core.png'), 'body occluder (drawn last: nothing crosses her)'),
      label(Image.open(f'{L}/un-hybrid.png').convert('RGB'), 'the hybrid canvas at rest (= every frame with wind 0)')],
     3, 836, 470, 'UNTOUCHABLE v2 · layer separation', cap_h=0).save(f'{DL}/untouchable-v2-layer-separation.jpg', quality=86)
if STUDY:
    fs = sorted(glob.glob(f'{STUDY}/un2-fixed-f*.png'))
    if fs:
        Aa = np.stack([np.asarray(Image.open(p).convert('L'), np.float32) for p in fs]); sd = Aa.std(axis=0)
        base = np.asarray(Image.open(fs[0]).convert('RGB'), np.float32) * 0.45; hh = np.clip(sd / 12, 0, 1); base[..., 0] += hh * 255; base[..., 1] += hh * 60
        im = label(Image.fromarray(base.clip(0, 255).astype(np.uint8)), f'UNTOUCHABLE v2 · what moves (locked camera, {len(fs)} frames over 1 s): red = temporal deviation')
        s = 1080 / 1483; c = 1 / 0.6347
        def box(x0, y0, x1, y1): return sd[int(y0 * c * s):int(y1 * c * s), int(x0 * c * s):int(x1 * c * s)]
        st = {'face and blindfold': (760, 60, 830, 140), 'torso': (700, 190, 880, 330), 'hands on the hilt': (720, 320, 900, 420), 'moon': (840, 60, 1000, 250),
              'feet and ground': (690, 860, 860, 930), 'left ribbons': (60, 60, 560, 400), 'right ribbons': (1000, 380, 1560, 760)}
        dr = ImageDraw.Draw(im); y = 50
        for k, b in st.items():
            v = box(*b); dr.text((16, y), f'{k:22s} mean {v.mean():5.2f}  p99 {np.percentile(v, 99):5.2f}', fill=(255, 255, 255), font=font(21)); y += 27
        im.save(f'{DL}/untouchable-v2-motion-map.jpg', quality=86)
v1c, v2c = f'{V1}/untouchable-cinematic.mp4', f'{DL}/untouchable-v2-cinematic.mp4'
if os.path.exists(v1c) and os.path.exists(v2c):
    d1, _ = frames(v1c); d2, _ = frames(v2c)
    ts = [2.6, 3.6, 4.0, 6.0]
    r1 = [label(fr(d1, round(t * 60)).resize((640, 360)), f'v1 {t:.1f}s', 16) for t in ts]; r2 = [label(fr(d2, round(t * 60)).resize((640, 360)), f'v2 {t:.1f}s', 16) for t in ts]
    # and a 1:1 crop of ribbon tips, 6 consecutive frames apart by 4, each version
    c1 = [fr(d1, i).crop((40, 240, 520, 600)) for i in range(220, 244, 4)]; c2 = [fr(d2, i).crop((40, 240, 520, 600)) for i in range(220, 244, 4)]
    top = grid(r1 + r2, 4, 640, 360, 'UNTOUCHABLE · v1 (one displacement field on the portrait, paper-extended) vs v2 (approved landscape, separated strands)', cap_h=0)
    bot = grid([label(x, 'v1') for x in c1] + [label(x, 'v2') for x in c2], 6, 420, 315, 'left ribbons at 1:1, every 4th frame from f220 (v1 top, v2 bottom)', cap_h=0)
    stack(top, bot).save(f'{DL}/untouchable-v1-vs-v2-ribbons.jpg', quality=86)
print('sheets written')
