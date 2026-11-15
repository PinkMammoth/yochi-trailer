# 2.5D character animation: technical demo

A 5-second shot of **Untouchable** (the blindfolded swordswoman, reward for 5 wins in a row), made from the
existing card painting and brought subtly to life. The same shot is built two ways so the pipelines can be compared:

- **A. Pure Remotion 2.5D**: one WebGL2 shader inside a Remotion composition.
- **B. Blender-assisted 2.5D**: Blender renders the 3D passes and Remotion composites them.

See [EVALUATION.md](EVALUATION.md) for the comparison and the recommendation.

## Deliverables (`deliverables/`)

| file | what |
|---|---|
| `A-pure-remotion.mp4` | Implementation A: 1920×1080, 30 fps, 5.0 s, H.264 |
| `B-blender-composite.mp4` | Implementation B: same spec, same timeline |
| `A-vs-B-side-by-side.mp4` | Both, side by side and labelled |
| `A-contact.jpg`, `B-contact.jpg` | Key frames: establish, anticipation, impact, settle |
| `segmentation-matte.jpg` | The figure matte over magenta, to show what was separated |

## Why this asset

The brand rules (`asset-pack/sumi/SHARED-RULES.md`) retire the hooded `asset-pack/characters/` cast. The canonical
cast is now the 28 Sumi paintings in `asset-pack/sumi/avatars/`, which may be "cropped, masked, layered, parallaxed
and graded" but never repainted. Untouchable is the strongest fit for 2.5D:

- a clean **profile** against a big dark ink moon, so the silhouette separates well and a small head turn reads;
- long **streaming hair and blindfold ribbons** running off the left edge, which wind can move without touching the face;
- **depth already in the painting**: moon disc, misty pines and pagoda, paper ground;
- the high-resolution source is the **card** (`cards/untouchable.webp`, 1536×2048). The unframed `portraits/` file
  is a different, lower-resolution crop (512×683). The shot crops inside the card's frame, below its top ornament.

The shot is a medium close-up (head to chest), 1320×742 source px, shown at 1.45× and pushed to about 1.6×.

## The shot (shared by A and B: `remotion/src/shared/timeline.ts`)

| time | what happens |
|---|---|
| 0.0–2.2 s | Slow push in, slight truck left (parallax). She breathes on a ~3.4 s cycle. A steady breeze moves the hair and ribbons, the key light climbs, dust and ink motes drift on the wind. |
| 2.2–3.2 s | Anticipation: the wind gusts, she lifts her chin ~1.4° and rises 2.5 px, the camera leans in, the vermilion 連勝 seal starts falling. |
| 3.2 s (f96) | **Impact**: a vermilion dry-brush slash cuts across the moon *behind* her, the seal lands, two manga "ink negative" frames, the camera shakes (22 px decaying, 0.6° roll), a shockwave (A only), an ink burst, a hair burst and a light flash. |
| 3.2–5.0 s | Shake decays, the slash ink soaks in, breathing resumes, the chin eases half back, hold. |

Kanji used: 連勝 (win streak), on the seal, 3.0–5.0 s. It's on the allowed list and is the glyph the app shows for this unlock.

## Segmentation (non-destructive)

`prep/segment.py` reads the card and **never writes to `asset-pack/`**. It writes derived plates to `assets/`:

| plate | how |
|---|---|
| `char.png` | The **original pixels, unaltered**, plus an alpha matte from OpenCV GrabCut seeded by 6 foreground and 5 background hint polygons, authored once on a 50 px grid. Behind the neck, where thin strands cross the moon, only the dark strands are kept. The card frame's red/gold corners are matted out. |
| `bg.png` | Original pixels with the figure region (dilated 15 px) inpainted (Telea) plus synthetic grain matched to the paper. It's only ever seen through a few pixels of parallax at the figure's edges. |
| `bg_depth.png` | Background depth: paper and moon far, misty trees nearer (by ink density, lower right). |
| `weights.png` | Motion weights: R hair/ribbons (rising toward the free ends), G head (falls off at the neck), B ribcage. |
| `relief.png` | (B only, `prep/relief.py`) a soft inflation of the matte so the figure becomes a shallow bas-relief. |

Nothing is cut into separate limbs. The painting is flattened, so the head, breath and hair move by **smooth
weighted deformation of one intact plate** (the "whole-image" approach), never by cutting parts out and
re-assembling them. At frame 0 both pipelines show the painting exactly as it is.

## Render

```bash
cd demo-2p5d
python3 prep/segment.py && python3 prep/relief.py         # needs opencv-python-headless, scipy, pillow
cd remotion && npm install && tools/sync-assets.sh
```

**A** (needs Chromium; the cloud image's Playwright build works):

```bash
npx remotion render src/index.ts PureRemotion out/A-pure-remotion.mp4 --gl=swangle --concurrency=4 --crf=16 --jpeg-quality=95 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
```

**B** (needs Blender 4.x; Eevee needs a GL context, so on a headless box run it under `xvfb-run`):

```bash
node --experimental-strip-types tools/export-timeline.mts           # timeline.ts -> blender/timeline.json
blender -b -P ../blender/build_scene.py -- --eevee --samples 16     # builds blender/scene.blend
xvfb-run -a -s "-screen 0 1920x1080x24" blender -b ../blender/scene.blend -s 0 -e 149 -a
tools/sync-assets.sh
npx remotion render src/index.ts BlenderComposite out/B-blender-composite.mp4 --concurrency=4 --crf=16 --jpeg-quality=95 --browser-executable=...
```

Review: `python3 prep/contact.py <video> out.jpg 0 45 80 92 96 97 99 104 149`, `prep/side_by_side.sh A.mp4 B.mp4 out.mp4`,
`python3 prep/fidelity.py <frame0.png|video>` (SSIM/PSNR against a plain Lanczos upscale of the untouched painting).
`--props='{"clean":true}'` renders a composition without particles, seal and grade, for fidelity checks.

## Code map

| path | what |
|---|---|
| `prep/segment.py` | plates, matte, inpaint, depth, motion weights (hint geometry at the top of the file) |
| `prep/relief.py` | bas-relief height for B |
| `remotion/src/shared/timeline.ts` | **single source of truth**: camera (push, truck, shake), performance (breath, head, wind), key light, impact envelope |
| `remotion/src/A/WarpShot.tsx` | A: the WebGL2 compositor (Catmull-Rom sampling, depth parallax, inverse warps, rim light, cast shadow, slash sandwich, shockwave, impact frame) |
| `remotion/src/B/BlenderShot.tsx` | B: stacks Blender's back/front passes around the slash; impact frame and flash in CSS |
| `remotion/src/shared/slash.ts` | procedural vermilion dry-brush slash (bristles, dry tail, paper grain, splatter) |
| `remotion/src/shared/Particles.tsx` | dust and ink motes (A), the impact ink burst (A and B) |
| `remotion/src/shared/Seal.tsx` | 連勝 seal with the brand `yo-stamp` motion and stamp texture |
| `remotion/src/shared/Grade.tsx` | vignette and grain, identical for A and B |
| `blender/build_scene.py` | B: bas-relief figure mesh, armature (root/head/chest) from the weight maps, three travelling-wave Displace modifiers for wind, depth-displaced background, physical dolly camera with DOF, keyed sun, 3D motes, back/front view layers |

## Not done / limits

- The source is 1536×2048, so the medium close-up is upscaled 1.45–1.6×. It holds under grain, but a 2× source
  (or a 4:5 vertical framing, which needs no upscale) would be sharper.
- B has no cast shadow on the background: in true 3D the moon is ~18 units behind her, so a physical shadow lands
  off-frame. A fakes a short contact shadow. B also has no shockwave distortion (A's is a shader pass).
- No sound: this is a motion test.
