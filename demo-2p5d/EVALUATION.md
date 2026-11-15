# A vs B: evaluation and recommended pipeline

Same painting (Untouchable card), same plates, same timeline (`remotion/src/shared/timeline.ts`), same overlays
(slash, burst, seal, grade). Only the 2.5D core differs. Measured on this cloud box: 4 CPU cores, no GPU, software
GL (SwiftShader for A, Mesa llvmpipe under Xvfb for B).

## Scorecard

| criterion | A. Pure Remotion 2.5D | B. Blender + Remotion | edge |
|---|---|---|---|
| **Fidelity: whole frame** (frame 0, clean, SSIM vs plain Lanczos upscale of the untouched painting) | 0.875 | 0.874 | tie |
| **Fidelity: face** (SSIM / PSNR) | 0.900 / 25.5 dB | **0.927 / 28.3 dB** | B: A's directional wash and rim light shift skin values more |
| **Fidelity: detail kept on the face** (Laplacian variance vs reference) | **102%** | 48% | **A**: Catmull-Rom sampling vs Blender's bilinear texture and Eevee's 1.5 px filter. B reads visibly softer |
| **Movement: breath, head** | inverse warp from weight maps, ≤3 px at the face | same weights through an armature, ≤3 px | tie: same numbers, same look |
| **Movement: hair, ribbons** | travelling waves in the shader | the same waves as Displace modifiers on a 72k-vertex mesh | tie |
| **Movement: parallax, push** | per-layer zoom by depth (art-directed, any ratio) | a real perspective dolly; trees displaced in depth | B is physically right; A can be tuned further than physics allows |
| **Light** | rim on edges facing the key (contrast-gated), directional wash, short contact shadow on the background, drifting light pool | a real sun on a bas-relief: soft directional shading that turns with the key | B looks more "lit"; A has the shadow that sells depth (B can't, see below) |
| **Atmosphere** | 2D motes, parallaxed to the camera | 3D motes in the scene, at true depth | B, slightly; at this size most viewers won't tell |
| **Impact** | shake, slash sandwiched between plates, **shockwave distortion**, paper-tinted ink-negative frame, flash, burst, hair burst | shake (lens shift), slash sandwich, CSS ink-negative frame (harsher, pure white), flash, burst, hair burst | **A**: the shockwave is a shader pass, which B's DOM composite doesn't have |
| **Render time, 150 frames 1080p** | **1 min 53 s** total (≈0.75 s/frame incl. bundling) | **29 min 28 s** (28:51 Blender Eevee at ~10.5 s/frame + 0:37 Remotion composite). Cycles CPU was 86 s/frame (~3.6 h) | **A, ~16×** |
| **Disk per shot** | none (renders straight to MP4) | 1.4 GB of RGBA PNG passes | A |
| **Implementation complexity** | 257-line shader component + shared code. One language, one tool | 429-line scene builder + 48-line compositor, a JSON timeline bridge, Blender + Xvfb + Mesa, two view layers, keyframe baking | A |
| **Iteration loop** | change a number, re-render a still in ~10 s | change a number, rebuild the scene (3 s), re-render (≥10 s/frame), re-composite | A |
| **Reusability for future videos** | high: any painting = plates + weights + a timeline; drops into the existing JS engines (every frame a pure function of `t`) | medium: the builder is generic, but every film inherits Blender, Xvfb and the slow render; the house engines are JS, not Blender | A |
| **Manual intervention** | same plates for both: ~11 hint polygons + 1 strand zone (~20 min), 4 rig points, the slash path, the seal spot | the same, plus the background depth and relief gains and the depth-to-parallax tuning; a headless GL setup the first time | A |

## What each one is actually better at

**A wins on what matters most for this brand:** it keeps the painting's linework at full crispness (102% of the
reference detail on the face vs 48% for B), renders 16× faster with no intermediate files, and puts every
effect, including the shockwave, the slash sandwich and the impact frame, into one deterministic pass the
existing JS engines can call. Its weaknesses are small: the directional wash and rim light tint the skin a little
(face PSNR 25.5 dB vs 28.3), and its parallax is art-directed rather than physical.

**B's real advantages** are physical depth and light: the dolly, the relief shading and the 3D motes are "free"
once the scene exists. In this shot they're subtle at 1080p, and they cost softness, half an hour of render, a
heavyweight toolchain and 1.4 GB of passes. The softness is fixable (pre-upscaled 2× textures, Eevee filter
0.7 px, or Cycles Closest + supersampling), but each fix adds render time. B also *can't* do the contact shadow:
with the moon ~18 units behind her, a true shadow lands off-frame. Faking it means bringing back the 2D trick A
already uses.

## Recommendation

**Use A, a pure Remotion/WebGL 2.5D compositor, as the production pipeline.** Package it as one reusable
module: `plates (char + clean bg + depth + weights) + timeline → shader`, and keep Blender out of the
per-film loop.

Make three changes before it goes into films:

1. **Matte source:** start from the existing BiRefNet cut-outs on `claude/yochi-first-ad-order-a`
   (`film-flagship/assets/cast/<id>-fig.webp`). Use this demo's hint-seeded GrabCut only to refine problem areas.
   For Untouchable specifically, GrabCut was *better* at this crop: BiRefNet matted a block of paper into the
   top-left hair and left a soft fringe there (`deliverables/matte-vs-existing-cutout.jpg`), but it was cleaner
   behind the neck.
2. **House-safe defaults** (see the compliance section below). Each is a single constant today: the shake
   amplitude in `camera()`, the head/breath amplitudes in `performance()`, and the rim and wash terms in the shader.
   Turn them into flags: shake ≤6 px, face warp off unless the owner adopts rung 5, rim and wash off unless signed off. Keep the depth parallax, push, wind on
   the free hair ends, slash sandwich, seal and impact frame on.
3. **Keep Blender as an occasional tool**, not a stage of the pipeline: for a one-off hero shot that needs a real
   camera move through deep space or physically lit relief, render its passes and composite them with the same
   `BlenderShot` component. The shared timeline already supports that.

## House-rules compliance (docs/YOCHI_MOTION_STYLE_GUIDE.md, ANIMATION_FEASIBILITY.md)

These documents landed on the branch while the demo was in progress. The brief explicitly asked for breathing,
head movement, cloth/hair motion and light, so the demo keeps them, but flags where they meet the house rules:

| element | house rule | in this demo |
|---|---|---|
| Breath / head movement | rung 5 (local mesh warp, ≤3 px at 1080p) is experimental, off by default; open decision #8 | **tuned to the budget**: forehead ≤3.05 px, nose ≤2.67 px, breath ≤2.67 px (measured from the timeline). This demo is effectively the rung-5 test that decision asks for |
| Hair and ribbons | "robe flow by plate drift only" for Untouchable | warped locally: ~6 px in the breeze, up to ~24 px during the 0.3 s impact burst, on the free ends only (weight falls to 0 at the head) |
| Skeletal rig | "never rig skeletons" | B drives the warp with an armature (root/head/chest) on one intact plate: nothing is cut or re-assembled. A uses no rig at all. Another reason to prefer A |
| Rim light / colour on the figure | needs owner sign-off | A adds a contrast-gated rim and a ±13% directional wash on the figure. B's sun adds ~18% diffuse. Each is one shader term or one light energy, easy to zero |
| Impact shake | ≤6 px, 0.38 s, on the ground | 22 px decaying, on the whole frame, because the brief asked for a dramatic camera shake. One constant in `camera()` |
| Stamp | brand `yo-stamp` curve, contact on the beat | yes, per-segment easing as CSS does it, contact on f96 |
| Vermilion | the seal and the slash only | yes. The slash is the scene's one skewed element |
| Kanji | allowed list only | 連勝 only, 3.0–5.0 s (native review done) |
| Canonical art | never altered | `asset-pack/` is read only. Plates are derived copies in `demo-2p5d/assets/` |

## Reproduce the numbers

```bash
python3 prep/fidelity.py remotion/out/stills/a_clean_0.png remotion/out/stills/b_clean_0.png   # SSIM / PSNR
cat blender/render.time                                                                       # B wall time
```

The detail figure is the Laplacian variance of the face region (1050–1400 × 250–650) against the same region of
the Lanczos reference.
