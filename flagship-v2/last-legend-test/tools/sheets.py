#!/usr/bin/env python3
"""Review sheets for the Last Legend two-pose test, from the renders and the derived layers.
usage: python3 tools/sheets.py <method_frames_dir>
  (method frames: remotion/tools/frames.mjs output, names <method>-fNNNN.png for frames 232-239 of the cinematic cut,
   and mask-f0200.png rendered with showMask)
Writes deliverables/:
  last-legend-pose-registration.jpg      originals, onion overlay, flow and colour-difference maps, the change mask, numbers
  last-legend-transition-methods.jpg     the five transition methods on identical frames (head crop, 1:1 px)
  last-legend-transition-{cinematic,trailer}.jpg   every frame through the head lift, full frame and head crop
  last-legend-two-pose-{cinematic,trailer,trailer-6beat}-contact.jpg   timed contact sheets (0.1 s / 0.05 s)
  last-legend-comparison.jpg             the two paintings beside the shot's Beat A and Beat C holds
  last-legend-mask-qc.jpg                1:1 crops of matte edges and ground contact from the 1080p render
"""
import json, os, subprocess, sys, tempfile
import cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont

H = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DL = f'{H}/deliverables'; DR = f'{H}/assets/derived'
METH = sys.argv[1] if len(sys.argv) > 1 else None
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def font(s):
    try: return ImageFont.truetype(FONT, s)
    except OSError: return ImageFont.load_default()
INK, PAPER = (22, 19, 15), (242, 236, 224)


def frames(mp4):
    d = tempfile.mkdtemp()
    subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, f'{d}/%04d.png'], check=True)
    return d, len(os.listdir(d))


def fr(d, i): return Image.open(f'{d}/{i + 1:04d}.png').convert('RGB')


def grid(tiles, cols, tw, th, title, caps=None, pad=6, top=70, cap_h=26):
    rows = (len(tiles) + cols - 1) // cols
    S = Image.new('RGB', (cols * (tw + pad) + pad, top + rows * (th + cap_h + pad) + pad), PAPER)
    dr = ImageDraw.Draw(S); dr.text((pad + 4, 18), title, fill=INK, font=font(30))
    for i, im in enumerate(tiles):
        x = pad + (i % cols) * (tw + pad); y = top + (i // cols) * (th + cap_h + pad)
        S.paste(im.resize((tw, th), Image.LANCZOS), (x, y))
        if caps: dr.text((x + 2, y + th + 3), caps[i], fill=INK, font=font(17))
    return S


def contact(mp4, step_s, out, title, cols=8):
    d, n = frames(mp4)
    idx = list(range(0, n, max(1, round(step_s * 60))))
    grid([fr(d, i) for i in idx], cols, 320, 180, title, [f'{i / 60:.2f}s  f{i}' for i in idx]).save(out, quality=86)


def transition(mp4, f0, f1, crop, out, title):
    d, n = frames(mp4)
    idx = list(range(f0, min(f1, n)))
    full = [fr(d, i) for i in idx]
    heads = [im.crop(crop) for im in full]
    cw = 300; ch = round(cw * (crop[3] - crop[1]) / (crop[2] - crop[0]))
    a = grid(full, 6, 300, 169, title + '  (full frame)', [f'f{i}  {i / 60:.3f}s' for i in idx])
    b = grid(heads, 6, cw, ch, 'head crop, 1080p pixels', [f'f{i}' for i in idx])
    S = Image.new('RGB', (max(a.width, b.width), a.height + b.height), PAPER); S.paste(a, (0, 0)); S.paste(b, (0, a.height)); S.save(out, quality=88)


def label(im, text, s=26):
    im = im.copy(); dr = ImageDraw.Draw(im); f = font(s)
    dr.rectangle([0, 0, im.width, s + 14], fill=INK); dr.text((8, 6), text, fill=PAPER, font=f); return im


def registration():
    A = Image.open(f'{H}/assets/source/last-legend-pose-a-collapse.webp').convert('RGB')
    B = Image.open(f'{H}/assets/source/last-legend-pose-b-defiance.webp').convert('RGB')
    R = f'{DR}/registration'
    tiles = [label(A, 'Pose A, the collapse (as received)'), label(B, 'Pose B, the defiance (as received)'),
             label(Image.open(f'{R}/onion-red-A-cyan-B.jpg'), 'onion: A red, B (registered) cyan; grey = identical'),
             label(Image.open(f'{R}/flow-magnitude.jpg'), 'structural motion A to B (dense flow)'),
             label(Image.open(f'{R}/colour-difference.jpg'), 'colour difference (dE, blurred 3 px)'),
             label(Image.open(f'{R}/change-mask-overlay.jpg'), 'the change region (red): 27% of the figure')]
    tw, th = 600, 657
    S = grid(tiles, 3, tw, th, 'LAST LEGEND · pose registration (Pose B onto Pose A: similarity fit, SIFT + RANSAC)', top=60, cap_h=0)
    reg = json.load(open(f'{DR}/registration.json'))
    W = Image.new('RGB', (S.width, S.height + 430), PAPER); W.paste(S, (0, 0)); dr = ImageDraw.Draw(W)
    y = S.height + 10; f = font(20)
    dr.text((12, y), f"global fit: scale {reg['scale']:.4f}, rotation {reg['rot_deg']:.3f} deg, translation "
            f"({reg['B_to_A_similarity'][0][2]:.2f}, {reg['B_to_A_similarity'][1][2]:.2f}) px, {reg['inliers']}/{reg['matches']} inliers, "
            f"median residual {reg['median_residual_px']:.2f} px. The two paintings share one canvas; the body was not redrawn.", fill=INK, font=f)
    y += 36
    dr.text((12, y), f"{'region':26s}{'flow median px':>18s}{'flow p90 px':>14s}{'dE median':>12s}{'dE p90':>10s}   verdict", fill=INK, font=font(19)); y += 28
    for k, v in reg['regions'].items():
        verdict = 'CHANGES (pose)' if v['flow_med'] > 3 else ('partly changes' if v['flow_p90'] > 8 else 'same geometry, re-rendered texture')
        dr.text((12, y), f"{k:26s}{v['flow_med']:>18.2f}{v['flow_p90']:>14.2f}{v['dE_med']:>12.2f}{v['dE_p90']:>10.2f}   {verdict}", fill=INK, font=font(19)); y += 26
    W.save(f'{DL}/last-legend-pose-registration.jpg', quality=88)


def methods():
    if not METH: return
    M = [('dissolve-full', 'full-image dissolve (baseline)'), ('dissolve-masked', 'masked dissolve'), ('smear', 'masked dissolve + motion smear'),
         ('cut-masked', 'masked hard cut'), ('cut-smear', 'CHOSEN: masked cut + 1 smear frame each side')]
    F = list(range(232, 240)); crop = (760, 40, 1420, 640); tw, th = 330, 300; lw = 300
    S = Image.new('RGB', (lw + len(F) * (tw + 4), 60 + len(M) * (th + 4) + 30), PAPER); dr = ImageDraw.Draw(S)
    dr.text((8, 14), 'LAST LEGEND · the head lift, five methods on identical frames (cinematic cut, frames 232-239, 60 fps, head crop at 1080p px)', fill=INK, font=font(26))
    for c, f in enumerate(F): dr.text((lw + c * (tw + 4) + 4, 60 + len(M) * (th + 4) + 4), f'f{f}  {f / 60:.3f}s', fill=INK, font=font(18))
    for r, (m, name) in enumerate(M):
        y = 60 + r * (th + 4); dr.text((8, y + th // 2 - 12), name, fill=INK, font=font(19))
        for c, f in enumerate(F):
            S.paste(Image.open(f'{METH}/{m}-f{f:04d}.png').convert('RGB').crop(crop).resize((tw, th), Image.LANCZOS), (lw + c * (tw + 4), y))
    S.save(f'{DL}/last-legend-transition-methods.jpg', quality=88)
    if os.path.exists(f'{METH}/mask-f0200.png'):
        label(Image.open(f'{METH}/mask-f0200.png').convert('RGB'), 'the change mask in shot (white veil): the only region the pose change touches').save(f'{DL}/last-legend-change-mask-in-shot.jpg', quality=86)


def comparison(cin):
    d, n = frames(cin)
    A = Image.open(f'{H}/assets/source/last-legend-pose-a-collapse.webp').convert('RGB')
    B = Image.open(f'{H}/assets/source/last-legend-pose-b-defiance.webp').convert('RGB')
    th = 620
    t = [label(A.resize((round(A.width * th / A.height), th)), 'Pose A, as painted'), label(fr(d, 90).resize((round(1920 * th / 1080), th)), 'in shot: Beat A, 1.50 s'),
         label(B.resize((round(B.width * th / B.height), th)), 'Pose B, as painted'), label(fr(d, 320).resize((round(1920 * th / 1080), th)), 'in shot: Beat C hold, 5.33 s')]
    W = sum(i.width for i in t[:2]) + 18
    S = Image.new('RGB', (W, 2 * th + 18), PAPER)
    S.paste(t[0], (0, 0)); S.paste(t[1], (t[0].width + 18, 0)); S.paste(t[2], (0, th + 18)); S.paste(t[3], (t[2].width + 18, th + 18))
    S.save(f'{DL}/last-legend-comparison.jpg', quality=88)


def mask_qc(cin):
    d, n = frames(cin)
    a, c = fr(d, 70), fr(d, 300)
    crops = [(a, (560, 120, 1060, 470), 'hair and pauldron edge over the arena (1.17 s)'), (a, (520, 380, 820, 1000), 'the cape at the canvas edge: ragged alpha falloff'),
             (a, (520, 790, 1560, 1080), 'ground contact: fist, cloth, boot, painted floor ink'), (a, (1200, 560, 1700, 1000), 'the gap under the thigh, the boot, cloth tatters'),
             (c, (700, 0, 1500, 560), 'Beat C hold (5.00 s): face, hair, beard against the backdrop'), (c, (1250, 300, 1900, 900), 'right shoulder cloth and forearm (registered B)')]
    tiles = [label(im.crop(b), cap, 20) for im, b, cap in crops]
    S = Image.new('RGB', (2 * 1060, 3 * 600 + 60), PAPER); dr = ImageDraw.Draw(S)
    dr.text((8, 14), 'LAST LEGEND · matte and contact QC at 1080p (1:1 px where it fits; larger crops scaled down)', fill=INK, font=font(26))
    for i, t in enumerate(tiles):
        t.thumbnail((1050, 590)); S.paste(t, ((i % 2) * 1060, 60 + (i // 2) * 600))
    S.save(f'{DL}/last-legend-mask-qc.jpg', quality=88)


if __name__ == '__main__':
    cin, tr = f'{DL}/last-legend-two-pose-cinematic.mp4', f'{DL}/last-legend-two-pose-trailer.mp4'
    registration(); methods(); comparison(cin); mask_qc(cin)
    contact(cin, 0.1, f'{DL}/last-legend-two-pose-cinematic-contact.jpg', 'LAST LEGEND · Version A, cinematic (6.00 s) · every 0.1 s')
    contact(tr, 0.05, f'{DL}/last-legend-two-pose-trailer-contact.jpg', 'LAST LEGEND · Version B, trailer-paced (2.73 s, 8 beats) · every 0.05 s')
    transition(cin, 222, 252, (760, 40, 1420, 640), f'{DL}/last-legend-transition-cinematic.jpg', 'LAST LEGEND · Version A, every frame through the head lift (f222-251)')
    transition(tr, 48, 72, (760, 60, 1400, 620), f'{DL}/last-legend-transition-trailer.jpg', 'LAST LEGEND · Version B, every frame through the head lift (f48-71)')
    t6 = f'{DL}/last-legend-two-pose-trailer-6beat.mp4'
    contact(t6, 0.05, f'{DL}/last-legend-two-pose-trailer-6beat-contact.jpg', 'LAST LEGEND · Version B-6, the X2 slot (2.05 s, 6 beats) · every 0.05 s')
    print('sheets written')
