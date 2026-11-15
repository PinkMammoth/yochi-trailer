"""Prepares one painted character for 2.5D shots, without touching the canonical art.

    python3 yochi-2p5d/prep/prepare_character.py untouchable [duel-master ...]

Reads  yochi-2p5d/characters/<id>/character.json  (authored: matte source and hints, anchor, head, framings,
       optional background depth regions and impact-gust region) and the card it names (read only).
Writes yochi-2p5d/characters/<id>/build/:
  fig.png     the ORIGINAL painting pixels, unaltered, with an alpha matte (frame ornaments matted out)
  bg.png      the original painting with the figure (and frame ornaments) filled in: only ever seen through
              a few pixels of parallax at the figure's edge
  depth.png   background depth (0 far .. 1 near), for parallax inside the background plate
  flow.png    optional: where a brief impact gust may move pixels (free hair/cloth ends), 0..1
  relief.png  Blender path only: a shallow bas-relief height for the figure (16-bit)
  meta.json   plate geometry, safe rect, anchor, head, framings, provenance, matte stats
  check.jpg   the matte over magenta and the clean plate, side by side, for review

Plate geometry follows the house cast pipeline (film-flagship/tools/cast_prep.py on claude/yochi-first-ad-order-a):
every card is 1536x2048 and its painting rect is (72,150)-(1464,1978). All coordinates in character.json are
card pixels.

Matte sources:
  "grabcut"  OpenCV GrabCut seeded by authored fg/bg polygons (no model needed).
  "cast"     a raw matte from the house cast pipeline (BiRefNet), copied into the character folder, optionally
             corrected with the same fg/bg polygons.
"""
import json, os, sys, hashlib
import numpy as np
import cv2
from PIL import Image

PKG = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ROOT = os.path.abspath(os.path.join(PKG, ".."))
RECT = (72, 150, 1464, 1978)                       # painting rect, card px (house cast pipeline)
SAFE = (100, 252, 1436, 1902)                      # camera windows stay inside this (clear of frame and crests)
ORNAMENTS = [                                       # card px; matted out of fig, filled in bg
    (72, 150, 212, 285), (1324, 150, 1464, 285), (72, 1843, 212, 1978), (1324, 1843, 1464, 1978),  # corners
    (668, 150, 868, 250), (668, 1930, 868, 1978),                                                 # crests
    (72, 975, 112, 1085), (1424, 975, 1464, 1085),                                                # side diamonds
]
BAND = 30                                           # the frame's inner edge inside the rect


def poly(mask, pts, val, off):
    cv2.fillPoly(mask, [np.array([(x - off[0], y - off[1]) for x, y in pts], np.int32)], val)


def frame_mask(h, w, img=None):
    m = np.zeros((h, w), np.uint8)
    if img is not None:
        # frame-coloured pixels (red lacquer, gold) within 70 px of the rect edge
        r, g, b = [img[..., i].astype(int) for i in range(3)]
        framey = ((r > 110) & (g < 95) & (b < 85)) | ((r > 150) & (g > 110) & (b < 70))
        edge = np.zeros((h, w), bool)
        edge[:70, :] = edge[-70:, :] = edge[:, :70] = edge[:, -70:] = True
        m[cv2.dilate((framey & edge).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0] = 255
    m[:BAND, :] = m[-BAND:, :] = 255
    m[:, :BAND] = m[:, -BAND:] = 255
    for x0, y0, x1, y1 in ORNAMENTS:
        m[y0 - RECT[1]:y1 - RECT[1], x0 - RECT[0]:x1 - RECT[0]] = 255
    return m


def pushpull(img, known):
    """Fill unknown pixels from known ones (mask-weighted pyramid), as the house cast pipeline does."""
    levels = []
    w = known.astype(np.float32)
    c = img.astype(np.float32) * w[..., None]
    while min(w.shape) > 4:
        levels.append((c, w))
        c = cv2.resize(cv2.GaussianBlur(c, (5, 5), 0), (max(1, c.shape[1] // 2), max(1, c.shape[0] // 2)), interpolation=cv2.INTER_AREA)
        w = cv2.resize(cv2.GaussianBlur(w, (5, 5), 0), (c.shape[1], c.shape[0]), interpolation=cv2.INTER_AREA)
    est = c / np.maximum(w, 1e-6)[..., None]
    for c, w in reversed(levels):
        up = cv2.GaussianBlur(cv2.resize(est, (c.shape[1], c.shape[0]), interpolation=cv2.INTER_LINEAR), (9, 9), 0)
        a = np.clip(w * 1.6, 0, 1)[..., None]
        est = (c / np.maximum(w, 1e-6)[..., None]) * a + up * (1 - a)
    return est


def matte(cfg, img, cdir):
    h, w = img.shape[:2]
    off = RECT[:2]
    m = cfg["matte"]
    if m["source"] == "grabcut":
        gc = np.full((h, w), cv2.GC_PR_FGD, np.uint8)
        for p in m.get("probableBg", []):
            poly(gc, p, cv2.GC_PR_BGD, off)
        for p in m.get("fg", []):
            poly(gc, p, cv2.GC_FGD, off)
        for p in m.get("bg", []):
            poly(gc, p, cv2.GC_BGD, off)
        bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        bgd, fgd = np.zeros((1, 65)), np.zeros((1, 65))
        cv2.grabCut(bgr, gc, None, bgd, fgd, m.get("iterations", 6), cv2.GC_INIT_WITH_MASK)
        hard = np.where((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    elif m["source"] == "cast":
        raw = np.array(Image.open(os.path.join(cdir, m["file"])).convert("L"))
        raw = raw[RECT[1]:RECT[3], RECT[0]:RECT[2]]
        hard = np.where(raw > 127, 255, 0).astype(np.uint8)
        for p in m.get("fg", []):
            poly(hard, p, 255, off)
        for p in m.get("bg", []):
            poly(hard, p, 0, off)
    else:
        raise SystemExit("unknown matte source " + m["source"])
    # thin dark strands over a similar-toned ground: keep only the strands inside these zones
    lum = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    for z in m.get("strandZones", []):
        zone = np.zeros((h, w), np.uint8)
        poly(zone, z["polygon"], 255, off)
        dark = cv2.dilate(((lum < z.get("threshold", 48)) * 255).astype(np.uint8), np.ones((2, 2), np.uint8))
        hard = np.where(zone > 0, np.minimum(hard, dark), hard).astype(np.uint8)
    # clean: drop specks and small islands, fill pinholes
    hard = cv2.morphologyEx(hard, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(hard)
    keep = np.zeros_like(hard)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] > m.get("minIsland", 1500):
            keep[lab == i] = 255
    n, lab, st, _ = cv2.connectedComponentsWithStats(255 - keep)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < m.get("maxHole", 400):
            keep[lab == i] = 255
    return keep


def main(cid):
    cdir = os.path.join(PKG, "characters", cid)
    cfg = json.load(open(os.path.join(cdir, "character.json")))
    out = os.path.join(cdir, "build")
    os.makedirs(out, exist_ok=True)
    card_path = os.path.join(ROOT, cfg["card"])
    card_bytes = open(card_path, "rb").read()
    card = np.array(Image.open(card_path).convert("RGB"))
    assert card.shape[:2] == (2048, 1536), "expected a 1536x2048 card"
    img = np.ascontiguousarray(card[RECT[1]:RECT[3], RECT[0]:RECT[2]])
    h, w = img.shape[:2]
    off = RECT[:2]

    hard = matte(cfg, img, cdir)
    fm = frame_mask(h, w, img)
    hard[fm > 0] = 0
    soft = cv2.GaussianBlur(hard.astype(np.float32) / 255, (0, 0), 1.2)
    soft[fm > 0] = 0
    Image.fromarray(np.dstack([img, (soft * 255).astype(np.uint8)]), "RGBA").save(os.path.join(out, "fig.png"))

    # clean plate: figure (dilated) and frame ornaments filled from the surrounding painting
    hole = np.maximum(cv2.dilate(hard, np.ones((15, 15), np.uint8)), fm)
    fill = pushpull(img, hole == 0)
    # synthetic grain matched to the painting's own fine texture, so the fill isn't a smear
    hp = img.astype(np.float32) - cv2.GaussianBlur(img, (0, 0), 2).astype(np.float32)
    sd = float(hp[hole == 0].std()) * 0.6
    rng = np.random.default_rng(7)
    grain = cv2.GaussianBlur(rng.normal(0, 1, (h, w)).astype(np.float32), (0, 0), 0.8)
    grain *= sd / (grain.std() + 1e-6)
    fill = np.clip(fill + grain[..., None], 0, 255)
    a = (cv2.GaussianBlur(hole, (0, 0), 3).astype(np.float32) / 255)[..., None]
    bg = (img * (1 - a) + fill * a).astype(np.uint8)
    Image.fromarray(bg).save(os.path.join(out, "bg.png"))

    # background depth: far by default, authored regions nearer (optionally modulated by ink density)
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    ink = np.clip(cv2.GaussianBlur(1 - gray, (0, 0), 8) * 2, 0, 1)
    depth = np.full((h, w), 0.15, np.float32)
    for r in cfg.get("depth", []):
        z = np.zeros((h, w), np.uint8)
        poly(z, r["polygon"], 255, off)
        zf = cv2.GaussianBlur(z.astype(np.float32) / 255, (0, 0), r.get("feather", 60))
        val = r["depth"] * (ink if r.get("ink") else 1)
        depth = np.maximum(depth, 0.15 + (val - 0.15) * zf)
    depth = cv2.GaussianBlur(depth, (0, 0), 6)
    Image.fromarray((np.clip(depth, 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, "depth.png"))

    # impact gust region: 0 at the root (attached to the head/body), 1 at the free ends
    has_flow = "flow" in cfg
    if has_flow:
        f = cfg["flow"]
        z = np.zeros((h, w), np.uint8)
        poly(z, f["polygon"], 255, off)
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        rx, ry = f["root"][0] - off[0], f["root"][1] - off[1]
        fx, fy = f["free"][0] - off[0], f["free"][1] - off[1]
        vx, vy = fx - rx, fy - ry
        t = np.clip(((xx - rx) * vx + (yy - ry) * vy) / (vx * vx + vy * vy), 0, 1) ** 1.3
        flow = cv2.GaussianBlur(z.astype(np.float32) / 255, (0, 0), 25) * t
        Image.fromarray((np.clip(flow, 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, "flow.png"))

    # relief (Blender path only): a soft inflation of the figure, so a physical camera sees a shallow bas-relief
    d = cv2.distanceTransform((hard > 0).astype(np.uint8), cv2.DIST_L2, 5)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    hx, hy = cfg["head"][0] - off[0], cfg["head"][1] - off[1]
    rel = 0.6 * (1 - np.exp(-d / 60.0)) + 0.4 * np.exp(-(((xx - hx) / 190) ** 2 + ((yy - hy) / 230) ** 2))
    rel = cv2.GaussianBlur(rel * soft, (0, 0), 6)
    cv2.imwrite(os.path.join(out, "relief.png"), (np.clip(rel / max(rel.max(), 1e-6), 0, 1) * 65535).astype(np.uint16))

    ys, xs = np.where(hard > 0)
    meta = {
        "id": cid,
        "name": cfg["name"],
        "card": cfg["card"],
        "cardSha1": hashlib.sha1(card_bytes).hexdigest(),
        "plate": {"x": RECT[0], "y": RECT[1], "w": w, "h": h},
        "safe": dict(zip(("x0", "y0", "x1", "y1"), SAFE)),
        "anchor": cfg["anchor"],
        "head": cfg["head"],
        "figBounds": [int(xs.min()) + off[0], int(ys.min()) + off[1], int(xs.max()) + off[0], int(ys.max()) + off[1]],
        "matte": {"source": cfg["matte"]["source"], "fill": round(float((hard > 0).mean()), 3),
                  "provenance": cfg["matte"].get("provenance", "")},
        "flow": has_flow,
        "framings": cfg["framings"],
        "ground": cfg.get("ground", "paper"),
    }
    json.dump(meta, open(os.path.join(out, "meta.json"), "w"), indent=1)

    # review sheet
    chk = img.astype(np.float32) * soft[..., None] + np.array([255, 0, 255]) * (1 - soft[..., None])
    sheet = np.concatenate([chk.astype(np.uint8), bg], 1)
    Image.fromarray(sheet).resize((sheet.shape[1] // 3, sheet.shape[0] // 3), Image.LANCZOS).save(os.path.join(out, "check.jpg"), quality=88)
    print(f"{cid}: matte {meta['matte']['source']} fill {meta['matte']['fill']}, flow {has_flow} -> {out}")


if __name__ == "__main__":
    for c in sys.argv[1:] or ["untouchable"]:
        main(c)
