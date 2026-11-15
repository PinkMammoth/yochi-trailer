"""Non-destructive segmentation of the Untouchable card painting into 2.5D plates.

Reads (never writes) asset-pack/sumi/avatars/cards/untouchable.webp and writes derived
plates into demo-2p5d/assets/. Nothing is repainted: the character plate is the original
pixels with an alpha matte, and the background plate is the original pixels with the area
behind the figure filled in (that fill is only ever seen through a few pixels of parallax).

Manual input is the hint geometry below (canvas coordinates), authored once against
a 50 px grid. Everything else is automatic (GrabCut + guided feathering + inpaint).

    python3 demo-2p5d/prep/segment.py
"""
import os
import numpy as np
import cv2
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "asset-pack/sumi/avatars/cards/untouchable.webp")
OUT = os.path.join(ROOT, "demo-2p5d/assets")

# Working canvas inside the card frame (source px). The 16:9 camera window sits inside it.
CANVAS = (98, 248, 1442, 1104)  # x0, y0, x1, y1 -> 1344 x 856

# ---- authored hints (canvas px) ------------------------------------------------------
FG_SURE = [
    [(720, 150), (885, 150), (905, 280), (870, 395), (780, 420), (700, 330)],      # face
    [(560, 540), (820, 540), (880, 700), (820, 856), (540, 856)],                    # shoulder / arm
    [(500, 160), (900, 170), (900, 250), (500, 260)],                                # blindfold
    [(330, 120), (620, 60), (640, 400), (420, 520), (330, 380)],                     # hair mass
    [(600, 430), (860, 430), (880, 520), (600, 520)],                                # collar
    [(0, 720), (300, 700), (500, 856), (0, 856)],                                    # cloth, lower left
]
BG_SURE = [
    [(965, 110), (1150, 90), (1235, 300), (1185, 480), (1020, 560), (955, 450), (945, 300)],  # moon
    [(1245, 0), (1344, 0), (1344, 856), (1245, 856)],                                # right paper / ring
    [(1030, 600), (1245, 600), (1245, 856), (1030, 856)],                            # trees
    [(940, 420), (1000, 420), (1000, 520), (940, 520)],                              # moon below the chin
    [(872, 440), (950, 430), (950, 660), (905, 650), (880, 560)],                    # moon behind the neck
]
STRAND_ZONE = [(770, 420), (880, 420), (900, 520), (870, 660), (800, 600)]
# Head/neck rotation pivot and the breathing region, used by the renderers.
RIGS = {
    "neck_pivot": (760, 470),
    "head_center": (800, 260),
    "chest_center": (720, 700),
    "hair_root": (520, 220),
}


def poly(mask, pts, val):
    cv2.fillPoly(mask, [np.array(pts, np.int32)], val)


def main():
    os.makedirs(OUT, exist_ok=True)
    card = np.array(Image.open(SRC).convert("RGB"))
    x0, y0, x1, y1 = CANVAS
    img = np.ascontiguousarray(card[y0:y1, x0:x1])
    h, w = img.shape[:2]
    bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

    # GrabCut seeds: left half of the canvas is probably figure (hair, ribbons, cloth),
    # the right third probably background.
    gc = np.full((h, w), cv2.GC_PR_FGD, np.uint8)
    gc[:, 1000:] = cv2.GC_PR_BGD
    for p in FG_SURE:
        poly(gc, p, cv2.GC_FGD)
    for p in BG_SURE:
        poly(gc, p, cv2.GC_BGD)
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, gc, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    hard = np.where((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    # Clean: drop specks, fill pinholes, keep the figure's connected body.
    hard = cv2.morphologyEx(hard, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(hard)
    keep = np.zeros_like(hard)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] > 1500:
            keep[lab == i] = 255
    inv = 255 - keep
    n, lab, stats, _ = cv2.connectedComponentsWithStats(inv)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < 400:
            keep[lab == i] = 255
    hard = keep

    # Behind the neck, thin hair strands cross the moon and GrabCut keeps the moon between
    # them. There, keep only the strands themselves (much darker than the moon's slate).
    strands = np.zeros((h, w), np.uint8)
    poly(strands, STRAND_ZONE, 255)
    lum = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    dark = (lum < 48).astype(np.uint8) * 255
    dark = cv2.dilate(dark, np.ones((2, 2), np.uint8))
    hard = np.where(strands > 0, np.minimum(hard, dark), hard).astype(np.uint8)

    # Soft matte: edge-aware feather (guided by the painting's own luminance).
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
    m = hard.astype(np.float32) / 255.0
    try:
        soft = cv2.ximgproc.guidedFilter(gray, m, 4, 1e-3)
    except AttributeError:
        soft = cv2.GaussianBlur(m, (0, 0), 1.2)
    soft = np.clip(soft, 0, 1)

    # Character plate: original pixels (unaltered) + matte.
    char = np.dstack([img, (soft * 255).astype(np.uint8)])
    Image.fromarray(char, "RGBA").save(os.path.join(OUT, "char.png"))

    # The card's frame pokes into the canvas corners: mask it out of both plates.
    r_, g_, b_ = [img[..., i].astype(int) for i in range(3)]
    framey = ((r_ > 110) & (g_ < 95) & (b_ < 85)) | ((r_ > 150) & (g_ > 110) & (b_ < 70))  # red, gold
    yy0, xx0 = np.mgrid[0:h, 0:w]
    corner = ((xx0 < 70) | (xx0 > w - 70)) & ((yy0 < 50) | (yy0 > h - 110))
    frame_m = cv2.dilate((framey & corner).astype(np.uint8) * 255, np.ones((7, 7), np.uint8))
    char[..., 3] = np.where(frame_m > 0, 0, char[..., 3])
    Image.fromarray(char, "RGBA").save(os.path.join(OUT, "char.png"))

    # Background plate: original pixels, the figure region (dilated) inpainted.
    hole = np.maximum(cv2.dilate(hard, np.ones((15, 15), np.uint8)), frame_m)
    small = cv2.resize(bgr, (w // 2, h // 2), interpolation=cv2.INTER_AREA)
    hs = cv2.resize(hole, (w // 2, h // 2), interpolation=cv2.INTER_NEAREST)
    fill = cv2.inpaint(small, hs, 9, cv2.INPAINT_TELEA)
    fill = cv2.resize(fill, (w, h), interpolation=cv2.INTER_CUBIC)
    # Bring back paper grain so the fill is not a smear: add the canvas' own high-pass.
    # Synthetic grain matched to the paper's own fine texture, so the fill isn't a smear
    # (borrowing real high-pass from elsewhere would ghost the figure's outlines in).
    patch = bgr[300:800, 1260:1340].astype(np.float32)
    sd = float((patch - cv2.GaussianBlur(patch, (0, 0), 2)).std())
    rng = np.random.default_rng(7)
    grain = cv2.GaussianBlur(rng.normal(0, 1, (h, w)).astype(np.float32), (0, 0), 0.8)
    grain *= sd / (grain.std() + 1e-6)
    fill = np.clip(fill.astype(np.float32) + grain[..., None], 0, 255).astype(np.uint8)
    hm = (cv2.GaussianBlur(hole, (0, 0), 3).astype(np.float32) / 255.0)[..., None]
    bgp = (bgr * (1 - hm) + fill * hm).astype(np.uint8)
    Image.fromarray(cv2.cvtColor(bgp, cv2.COLOR_BGR2RGB)).save(os.path.join(OUT, "bg.png"))

    # Depth map for the background (0 = far, 1 = near): paper/moon far, the misty trees
    # (lower right, by their ink density) a little nearer.
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    ink = 1.0 - gray
    trees = np.clip((yy - 560) / 200.0, 0, 1) * np.clip((xx - 960) / 120.0, 0, 1)
    depth = 0.15 + 0.45 * trees * np.clip(cv2.GaussianBlur(ink, (0, 0), 8) * 2.0, 0, 1)
    depth = cv2.GaussianBlur(depth, (0, 0), 6)
    Image.fromarray((np.clip(depth, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, "bg_depth.png"))

    # Motion weight maps for the character (R: hair/ribbon wind, G: head, B: breathing).
    hair = np.clip((640 - xx) / 420.0, 0, 1) ** 1.3          # stronger toward the free ends (left)
    hair *= np.clip((yy - 0) / 60.0, 0, 1)
    hair *= 1.0 - np.clip((yy - 640) / 160.0, 0, 1) * np.clip((xx - 200) / 300.0, 0, 1)
    hx, hy = RIGS["head_center"]
    head = np.exp(-(((xx - hx) / 190.0) ** 2 + ((yy - hy) / 230.0) ** 2))
    head = np.clip(head * 1.6, 0, 1) * np.clip((470 - yy) / 90.0 + 0.4, 0, 1)
    cx, cy = RIGS["chest_center"]
    chest = np.exp(-(((xx - cx) / 330.0) ** 2 + ((yy - cy) / 260.0) ** 2))
    wm = np.dstack([hair, head, chest])
    wm = cv2.GaussianBlur(wm, (0, 0), 10)
    Image.fromarray((np.clip(wm, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, "weights.png"))

    # Debug: matte over magenta, side by side with the hard mask.
    dbg = img.astype(np.float32) * soft[..., None] + np.array([255, 0, 255]) * (1 - soft[..., None])
    Image.fromarray(dbg.astype(np.uint8)).save(os.path.join(OUT, "_matte_check.jpg"))
    import json
    json.dump({"canvas": CANVAS, "size": [w, h], "window": [12, 14, 1320, 743], "rigs": RIGS},
              open(os.path.join(OUT, "plates.json"), "w"), indent=1)
    print("ok", w, h, "fg fraction", round(float(soft.mean()), 3))


if __name__ == "__main__":
    main()
