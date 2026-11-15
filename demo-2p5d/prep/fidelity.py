"""Fidelity check: compares frame 0 of each render (before any motion or FX) with a plain
Lanczos upscale of the same window of the untouched painting. Reports SSIM (luma) and PSNR,
on the whole frame and on the face. Frame 0 still carries each pipeline's lighting/grade,
so this measures how far the 2.5D rebuild drifts from the painting.

    python3 prep/fidelity.py remotion/out/A-pure-remotion.mp4 remotion/out/B-blender-composite.mp4
"""
import subprocess, sys, os, tempfile
import numpy as np, cv2
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
card = Image.open(os.path.join(ROOT, "asset-pack/sumi/avatars/cards/untouchable.webp")).convert("RGB")
# canvas origin (98,248) + window offset (12,14), 1320 x 742.5
ref = card.crop((110, 262, 1430, 1004.5)).resize((1920, 1080), Image.LANCZOS)
ref = np.array(ref).astype(np.float64)

def ssim(a, b):
    a = cv2.cvtColor(a.astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float64)
    b = cv2.cvtColor(b.astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float64)
    C1, C2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    g = lambda x: cv2.GaussianBlur(x, (11, 11), 1.5)
    ma, mb = g(a), g(b)
    va, vb, cov = g(a * a) - ma * ma, g(b * b) - mb * mb, g(a * b) - ma * mb
    return float((((2 * ma * mb + C1) * (2 * cov + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2))).mean())

def psnr(a, b):
    return float(10 * np.log10(255 ** 2 / ((a - b) ** 2).mean()))

FACE = (slice(250, 650), slice(1050, 1400))
for src in sys.argv[1:]:
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, "f.png")
        if src.endswith(".png"):
            p = src
        else:
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-frames:v", "1", p], check=True)
        im = np.array(Image.open(p).convert("RGB")).astype(np.float64)
    # register sub-pixel framing differences first (they are not fidelity)
    g = lambda x: cv2.cvtColor(x.astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32)
    (dx, dy), _ = cv2.phaseCorrelate(g(ref), g(im))
    M = np.float32([[1, 0, dx], [0, 1, dy]])
    r = cv2.warpAffine(ref.astype(np.float32), M, (1920, 1080), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT).astype(np.float64)
    im, r = im[20:-20, 20:-20], r[20:-20, 20:-20]
    print(f"{os.path.basename(src):32s} shift ({dx:+.2f},{dy:+.2f}) px")
    ref_ = r
    print(f"{'':32s} SSIM {ssim(im, ref_):.3f}  PSNR {psnr(im, ref_):.1f} dB   "
          f"face SSIM {ssim(im[FACE], ref_[FACE]):.3f}  face PSNR {psnr(im[FACE], ref_[FACE]):.1f} dB")
