# Prepare the canonical contestant art (asset-pack/characters) for the film's compositor.
#
# usage: python3 tools/canon_prep.py            (from film/; writes assets/canon/)
#
# For each canonical bust / half-body pose this writes three layers and a metadata entry:
#   <name>-plate.png   the painting with its LED face and visor status bars taken out (inpainted to dark
#                      glass / bezel), so the film can light the visor with any expression in any state
#   <name>-trim.png    the emissive trim (drawstring tips, piping, the chest mark) as light: RGB is its
#                      colour, alpha its strength. The film adds it to the glow layer so the trim blooms
#                      with the scene's own art-directed bloom, not the painting's baked one.
#   <name>-status.png  the two status bars at the ends of the visor as white light (alpha = strength),
#                      re-lit at render time in the state colour (cyan default, green win, red loss)
#   canon.json         per asset: size, the visor frame (bar midpoint, axis angle, half-width between
#                      the bars) and the face layout inside it, all in asset pixels
#
# The visor frame is measured by hand from the art (the status bars sit at the ends of the glass on
# every character, so the line between them gives the visor's centre, scale and roll). Faces are then
# laid out in that frame with one canonical layout (taken from base-bust), so every character's LED
# display reads at the same dot pitch.
import json, os, sys
import numpy as np, cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(HERE, '../../asset-pack/characters'))
OUT = os.path.normpath(os.path.join(HERE, '../assets/canon'))

# status-bar centres (left, right) in asset pixels, measured from the art
BARS = {
    'base-bust': [(422.5, 441), (831, 441)],
    'bear-bust': [(500.6, 407), (854, 437)],
    'bull-bust': [(482.5, 391), (830.6, 425.6)],
    'rogue-bust': [(389, 451), (758, 335.6)],
    'base-pose': [(372, 299), (651, 325.5)],
    'bear-pose': [(435, 299), (738, 374)],
    'bull-pose': [(414, 363), (692, 436)],
    'rogue-pose': [(562, 291), (801, 416)],
}
# face mask (to clear the painted expression), in visor units (x along the bar axis, 1 = a bar)
FACE_C, FACE_R = (0.0, 0.12), (0.84, 0.62)
BAR_R = (0.16, 0.36)
# the canonical layout (base-bust): eye centres, eye row, mouth row, dot pitch (visor units)
LAYOUT = {'eyeX': 0.436, 'eyeY': -0.069, 'mouthY': 0.38, 'pitch': 0.059}
# the hood's extent in visor units (for placement and the glow occluder): measured on each bust/pose
HOOD = {
    'base-bust': 3.38, 'bear-bust': 3.3, 'bull-bust': 3.4, 'rogue-bust': 3.6,
    'base-pose': 3.3, 'bear-pose': 3.0, 'bull-pose': 3.4, 'rogue-pose': 3.4,
}


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def frame(name):
    (lx, ly), (rx, ry) = BARS[name]
    cx, cy = (lx + rx) / 2, (ly + ry) / 2
    hw = np.hypot(rx - lx, ry - ly) / 2
    ang = np.arctan2(ry - ly, rx - lx)
    return cx, cy, hw, ang


def visor_coords(name, h, w):
    cx, cy, hw, ang = frame(name)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dx, dy = xx - cx, yy - cy
    c, s = np.cos(ang), np.sin(ang)
    u = (dx * c + dy * s) / hw
    v = (-dx * s + dy * c) / hw
    return u, v


def emissive(a):
    # the trim's cyan: green and blue both high over red (the painted blue rim light has green well
    # under blue, so it stays in the plate)
    R, G, B, A = a[..., 0], a[..., 1], a[..., 2], a[..., 3] / 255
    cy = np.minimum(G, B) - R
    w = smoothstep(0.6, 0.78, G / (B + 1))
    # near-white cores of the LEDs (still a little cyan: white cloth and specular glints stay out)
    hot = smoothstep(200, 250, np.minimum(G, B)) * smoothstep(0.75, 0.95, G / (B + 1)) * smoothstep(18, 40, cy)
    return np.clip(np.maximum(np.clip((cy - 40) / 170, 0, 1) * w, hot), 0, 1) * A


def prep(name):
    im = Image.open(os.path.join(SRC, name + '.png')).convert('RGBA')
    a = np.array(im).astype(np.float32)
    h, w = a.shape[:2]
    u, v = visor_coords(name, h, w)
    E = emissive(a)
    fr = np.sqrt(((u - FACE_C[0]) / FACE_R[0]) ** 2 + ((v - FACE_C[1]) / FACE_R[1]) ** 2)
    face = fr < 1
    br = np.full(face.shape, 9.0, np.float32)
    for sx in (-1, 1):
        br = np.minimum(br, np.sqrt(((u - sx) / BAR_R[0]) ** 2 + (v / BAR_R[1]) ** 2))
    bars = br < 1
    k = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    _, _, hw, _ = frame(name)
    r = max(3, int(round(hw * 0.03)))
    face_led = cv2.dilate(((E > 0.05) & face).astype(np.uint8), k(r))
    L0 = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]) / 255
    bar_led = cv2.dilate((((E > 0.05) | (L0 > 0.4)) & bars).astype(np.uint8), k(r))
    # Neutral glass: the LEDs and their haze are cyan (red channel near zero), the glass under them is
    # near-black and its reflections are white, so the red channel is a good estimate of the glass on
    # its own. The LED cores (bright in red too) are inpainted from it.
    R = a[..., 0]
    neutral = np.dstack([R, R, np.clip(R * 1.12 + 1.5, 0, 255)]).astype(np.uint8)
    neutral = cv2.inpaint(neutral, ((face_led | bar_led) > 0).astype(np.uint8) * 255, max(5, r * 2), cv2.INPAINT_TELEA).astype(np.float32)
    # the face and the bars go back to glass / bezel, feathered into the painting
    f = np.maximum(1 - smoothstep(0.86, 1.0, fr), 1 - smoothstep(0.8, 1.15, br))
    rgb = a[..., :3] * (1 - f[..., None]) + neutral * f[..., None]
    # status layer: the bars' light over the bezel (what the neutral glass doesn't account for)
    lum = lambda x: (0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2]) / 255
    st = np.clip((lum(a) - lum(neutral)) * 1.2, 0, 1) * (1 - smoothstep(0.8, 1.15, br)) * (a[..., 3] / 255)
    st = cv2.GaussianBlur(st, (0, 0), 0.6)
    status = np.zeros((h, w, 4), np.uint8)
    status[..., :3] = 255
    status[..., 3] = (st * 255).astype(np.uint8)
    plate = np.dstack([np.clip(rgb, 0, 255), a[..., 3]]).astype(np.uint8)
    # trim light: what's emissive outside the face and the bars
    tE = E * (1 - f)
    col = a[..., :3] / np.maximum(1, a[..., :3].max(axis=2, keepdims=True)) * 255
    col = col * (tE[..., None] > 0.004)
    trim = np.dstack([col, tE * 255]).astype(np.uint8)
    os.makedirs(OUT, exist_ok=True)
    Image.fromarray(plate).save(os.path.join(OUT, name + '-plate.png'), optimize=True)
    Image.fromarray(trim).save(os.path.join(OUT, name + '-trim.png'), optimize=True)
    sy, sx = np.nonzero(status[..., 3] > 0)
    sbox = [int(sx.min()), int(sy.min()), int(sx.max()) + 1, int(sy.max()) + 1]
    Image.fromarray(status[sbox[1]:sbox[3], sbox[0]:sbox[2]]).save(os.path.join(OUT, name + '-status.png'), optimize=True)
    cx, cy, hw, ang = frame(name)
    ys, xs = np.nonzero(a[..., 3] > 16)
    return {'w': w, 'h': h, 'cx': round(float(cx), 1), 'cy': round(float(cy), 1), 'hw': round(float(hw), 2), 'ang': round(float(ang), 4),
            'hood': HOOD[name], 'sbox': sbox, 'bbox': [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]}


if __name__ == '__main__':
    names = sys.argv[1:] or list(BARS)
    meta = {}
    path = os.path.join(OUT, 'canon.json')
    if os.path.exists(path):
        meta = json.load(open(path)).get('assets', {})
    for n in names:
        meta[n] = prep(n)
        print(n, meta[n])
    json.dump({'layout': LAYOUT, 'face': {'c': FACE_C, 'r': FACE_R}, 'assets': meta}, open(path, 'w'), indent=1)
    print('wrote', path)
