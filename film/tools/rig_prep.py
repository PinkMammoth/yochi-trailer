# Prepare a canonical character's cut-out rig (asset-pack/characters/<who>-rig) for the film.
#
# usage: python3 tools/rig_prep.py              (from film/; writes assets/rig/base/)
#        needs numpy, Pillow and opencv-python-headless
#
# The parts come from several generated sheets at different scales. Each part is cut out, given a
# scale k (rig units per image pixel; rig units are the parts-sheet's pixels) chosen so the joins
# match in width, and its joints (in image pixels). For each part this writes:
#   <part>.png       the colour plate (the torso's chest mark is taken out: the film draws the
#                    traced Yochi mark there as light, so it matches the busts exactly)
#   <part>-trim.png  its emissive trim as light (RGB colour, alpha strength), for the glow layer
# and rig.json: per part its file, k and joints; the skeleton (neck, shoulders, hips, the head's
# placement) in rig units with the neck at the origin, y down.
import json, os
import numpy as np, cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(HERE, '../../asset-pack/characters/base-rig'))
OUT = os.path.normpath(os.path.join(HERE, '../assets/rig/base'))


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def emissive(a):
    # the trim's cyan (as tools/canon_prep.py): green and blue both well over red
    R, G, B, A = a[..., 0], a[..., 1], a[..., 2], a[..., 3] / 255
    cy = np.minimum(G, B) - R
    w = smoothstep(0.6, 0.78, G / (B + 1))
    hot = smoothstep(200, 250, np.minimum(G, B)) * smoothstep(0.75, 0.95, G / (B + 1)) * smoothstep(18, 40, cy)
    return np.clip(np.maximum(np.clip((cy - 40) / 170, 0, 1) * w, hot), 0, 1) * A


def component(file, x0, y0):
    """The connected part whose bounding box starts at (x0, y0), cropped with a margin."""
    im = np.array(Image.open(os.path.join(SRC, file)).convert('RGBA'))
    n, lab, st, _ = cv2.connectedComponentsWithStats((im[..., 3] > 20).astype(np.uint8), 8)
    i = min(range(1, n), key=lambda j: abs(st[j][0] - x0) + abs(st[j][1] - y0))
    x, y, w, h = st[i][:4]
    m = 12
    X0, Y0 = max(0, x - m), max(0, y - m)
    crop = im[Y0:y + h + m, X0:x + w + m].copy()
    keep = (lab[Y0:y + h + m, X0:x + w + m] == i)
    keep = cv2.dilate(keep.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0   # keep the soft edge
    crop[..., 3] = np.where(keep, crop[..., 3], 0)
    crop[..., 3] = np.where(crop[..., 3] < 6, 0, crop[..., 3])               # stray alpha noise
    return crop, (X0, Y0)


def axis(crop):
    """Principal axis of a limb: (centre, unit direction pointing down the image, half-length, width)."""
    ys, xs = np.nonzero(crop[..., 3] > 60)
    P = np.stack([xs, ys], 1).astype(np.float64)
    c = P.mean(0)
    _, _, vt = np.linalg.svd(P - c, full_matrices=False)
    d = vt[0] if vt[0][1] > 0 else -vt[0]
    t = (P - c) @ d
    s = (P - c) @ np.array([-d[1], d[0]])
    return c, d, t.min(), t.max(), s.max() - s.min()


def limb(crop, prox_in, dist_in, length=None):
    """Joints of a limb on its axis: the proximal joint prox_in widths in from the top end, the distal
    one dist_in widths in from the bottom (or `length` px below the proximal one)."""
    c, d, t0, t1, w = axis(crop)
    p0 = c + d * (t0 + prox_in * w)
    p1 = c + d * (t1 - dist_in * w) if length is None else p0 + d * length
    return p0, p1, w, (c, d, t0, t1)


def round_off(crop, geo, t_cut, r):
    """Trim a limb at t_cut along its axis with a rounded end of radius r (soft edge)."""
    c, d, _, _ = geo
    h, w = crop.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float64)
    t = (xx - c[0]) * d[0] + (yy - c[1]) * d[1]
    s = -(xx - c[0]) * d[1] + (yy - c[1]) * d[0]
    end = t_cut - r
    inside = np.where(t <= end, 1.0, np.clip(1 - (np.sqrt(((t - end) / r) ** 2 + (s / (r * 1.25)) ** 2) - 1) * r / 3, 0, 1))
    crop[..., 3] = (crop[..., 3] * inside).astype(np.uint8)
    return crop


def save(name, crop, remove=None):
    a = crop.astype(np.float32)
    E = emissive(a)
    if remove is not None:
        # take a mark out of the cloth: inpaint it from the fabric round it
        mask = cv2.dilate(remove.astype(np.uint8), np.ones((9, 9), np.uint8))
        bgr = cv2.cvtColor(crop[..., :3], cv2.COLOR_RGB2BGR)
        crop = crop.copy()
        crop[..., :3] = cv2.cvtColor(cv2.inpaint(bgr, mask * 255, 9, cv2.INPAINT_TELEA), cv2.COLOR_BGR2RGB)
        E = E * (1 - mask)
    col = a[..., :3] / np.maximum(1, a[..., :3].max(axis=2, keepdims=True)) * 255
    col = col * (E[..., None] > 0.004)
    os.makedirs(OUT, exist_ok=True)
    Image.fromarray(crop).save(os.path.join(OUT, name + '.png'), optimize=True)
    Image.fromarray(np.dstack([col, E * 255]).astype(np.uint8)).save(os.path.join(OUT, name + '-trim.png'), optimize=True)
    return {'file': name, 'w': int(crop.shape[1]), 'h': int(crop.shape[0])}


P = lambda p, o: [round(float(p[0] - o[0]), 1), round(float(p[1] - o[1]), 1)]   # sheet px -> crop px
rig = {'parts': {}}
parts = rig['parts']

# ---- the torso: shoulders (the arm sockets inside the cap sleeves), the neck, the hem ------------------
K_T = 0.426                       # its shoulders 722 px apart -> 308 rig units, as the reference figure
crop, o = component('torso.webp', 196, 91)
a = crop.astype(np.float32)
ycut = emissive(a) > 0.05
yy, xx = np.mgrid[0:crop.shape[0], 0:crop.shape[1]]
ymark = ycut & (np.abs(yy + o[1] - 485) < 90) & (np.abs(xx + o[0] - 661) < 110)
parts['torso'] = {**save('torso', crop, remove=ymark), 'k': K_T, 'neck': P((661, 300), o), 'shL': P((300, 385), o), 'shR': P((1022, 385), o),
                  'hem': P((661, 1100), o), 'mark': P((661, 485), o), 'markW': 132}

# ---- the waist (waistband and crotch, under the hem) ----------------------------------------------------
K_W = 0.333
crop, o = component('waist.webp', 70, 322)
parts['waist'] = {**save('waist', crop), 'k': K_W, 'top': P((628, 330), o), 'hipL': P((370, 640), o), 'hipR': P((890, 640), o)}

# ---- the hood (with the drawstrings), the visor frame -----------------------------------------------------
crop, o = component('parts-sheet.webp', 360, 23)
parts['hood'] = {**save('hood', crop), 'k': 1.0, 'visor': P((505, 188), o), 'hw': 72, 'neck': P((505, 330), o)}

# ---- arms: upper arms from their own sheet, forearms and hands from the parts sheet -------------------
K_U = 0.377                       # 305 px wide -> 115 rig units, a touch wider than the forearm it feeds
for side, (x0, y0) in (('L', (148, 201)), ('R', (795, 200))):
    crop, o = component('upper-arms.webp', x0, y0)
    p0, _, w, geo = limb(crop, 0.42, 0)
    UA = 172 / K_U                # shoulder to elbow, rig units -> px
    p1 = p0 + geo[1] * UA
    t_cut = (p1 - geo[0]) @ geo[1] + 0.5 * w
    if t_cut < geo[3]:
        crop = round_off(crop, geo, t_cut, 0.5 * w)
    parts['ua' + side] = {**save('ua' + side, crop), 'k': K_U, 'p0': [round(float(v), 1) for v in p0], 'p1': [round(float(v), 1) for v in p1]}
for side, (x0, y0) in (('L', (265, 279)), ('R', (1080, 275))):
    crop, o = component('parts-sheet.webp', x0, y0)
    p0, p1, w, _ = limb(crop, 0.3, 0.12)
    parts['fa' + side] = {**save('fa' + side, crop), 'k': 1.0, 'p0': [round(float(v), 1) for v in p0], 'p1': [round(float(v), 1) for v in p1]}
# hands hang from the wrist (the glove's cuff at the top tucks into the sleeve's): screen-left set
for name, (x0, y0) in (('relaxed', (58, 502)), ('fist', (194, 511)), ('point', (350, 506)), ('open', (493, 500))):
    crop, o = component('parts-sheet.webp', x0, y0)
    ys, xs = np.nonzero(crop[..., 3] > 60)
    top = ys.min()
    cuff = xs[ys < top + 25].mean()
    parts['hand_' + name] = {**save('hand_' + name, crop), 'k': 1.0, 'p0': [round(float(cuff), 1), round(float(top + 0.14 * (ys.max() - top)), 1)],
                             'p1': [round(float(cuff), 1), round(float(ys.max()), 1)]}

# ---- legs: the thigh (screen-left; mirrored for the right), the lower leg with its shoe (screen-right) ----
crop, o = component('parts-sheet.webp', 219, 662)
p0, p1, w, _ = limb(crop, 0.42, 0.34)
parts['thigh'] = {**save('thigh', crop), 'k': 1.0, 'p0': [round(float(v), 1) for v in p0], 'p1': [round(float(v), 1) for v in p1]}
crop, o = component('parts-sheet.webp', 491, 677)
ys, xs = np.nonzero(crop[..., 3] > 60)
parts['shin'] = {**save('shin', crop), 'k': 1.0, 'p0': P((532, 718), o), 'p1': P((543, 950), o), 'sole': round(float(ys.max()), 1)}

# ---- the chest mark: the canonical one, lifted from base-bust (the generated torso's differs) ----------
bust = np.array(Image.open(os.path.join(SRC, '..', 'base-bust.png')).convert('RGBA'))
crop = bust[870:1002, 556:696].copy()
E = emissive(crop.astype(np.float32))
crop[..., 3] = (np.clip(E * 1.3, 0, 1) * 255).astype(np.uint8)
parts['mark'] = {**save('mark', crop), 'k': round(parts['torso']['markW'] * K_T / 86, 4), 'c': [626 - 556, 936 - 870]}

# ---- the skeleton (rig units, the neck at the origin, y down) ------------------------------------------
T = parts['torso']
sh = lambda p: [round((p[0] - T['neck'][0]) * K_T, 1), round((p[1] - T['neck'][1]) * K_T, 1)]
L = lambda q, k=1.0: float(np.hypot(q['p1'][0] - q['p0'][0], q['p1'][1] - q['p0'][1]) * k)
rig['skel'] = {
    'shL': sh(T['shL']), 'shR': sh(T['shR']), 'hem': sh(T['hem']),
    'visor': [0, round(sh(T['shL'])[1] - 178, 1)],          # the visor 178 units above the shoulders (reference)
    'waistTop': [0, round(sh(T['hem'])[1] - 60, 1)],        # the waistband tucks 60 units up under the hem
    'UA': round(L(parts['uaL'], K_U), 1), 'FA': round(L(parts['faL']), 1),
    'TH': round(L(parts['thigh']), 1), 'SHIN': round(L(parts['shin']), 1),
    'ANKLE': round(parts['shin']['sole'] - parts['shin']['p1'][1], 1),
}
W = parts['waist']
wt = rig['skel']['waistTop']
rig['skel']['hipL'] = [round((W['hipL'][0] - W['top'][0]) * K_W, 1), round(wt[1] + (W['hipL'][1] - W['top'][1]) * K_W, 1)]
rig['skel']['hipR'] = [round((W['hipR'][0] - W['top'][0]) * K_W, 1), round(wt[1] + (W['hipR'][1] - W['top'][1]) * K_W, 1)]
json.dump(rig, open(os.path.join(OUT, 'rig.json'), 'w'), indent=1)
print(json.dumps(rig['skel'], indent=1))
