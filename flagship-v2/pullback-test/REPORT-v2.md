# Pullback, pass 2: with the platform plate and the enlarged environment

**Status: for owner review.** The pullback is fixed and integrated into the flagship animatic. Nothing merged or
published. The approved Duels opening is unchanged: it is THE LAST STAND's own scenes, and the pullback takes over
on bar 76 from exactly the frame and camera the approved victory shot is on.

## The short answer

| question | answer |
|---|---|
| Is the hand-over clean? | **Yes.** The lower-body loss is fixed at its cause (below). Her body is continuous in every frame (`handover-diagnostic.jpg`, every 0.2 s through the old failure window). The payout carries over and fades instead of popping. The frame-to-frame change across the cut point (2.2 / 2.8) is the same as the motes' normal drift |
| Did the new assets solve the resolution problem? | **Partly. The files reached this session much smaller than you sent them.** The environment arrived at **2000×1125**, not 5760×3240; the plate at **1672×941**. Chat attachments are downscaled in transit. With these copies the floor is no longer blocky, but it's still soft for about a second (3.1–4.3 s) |
| Is the 5760 upscale good enough? | **I can't judge it: I haven't seen it.** What I can say: the copy I have is geometrically identical to the first master (0.18 px median error over 6,430 features), so the upscale didn't move anything, and at 2000 px it shows no upscaler artifacts. Its own artifacts, if any, only show at full size |
| Further asset work? | **Yes: the full-resolution files committed to the repo**, so nothing is resized in transit. Possibly nothing else (see "What's still needed") |
| Ready for the flagship? | **Integrated, as the working version.** Structure, timing and the hand-over are final. The close-range floor quality waits on the full-res files |

## 1. The lower-body loss: what it was

**Symptom (v1):** from ~3.5 s to 4.1 s her legs vanished behind a band of blurred platform.

**Cause:** not the hand-over. The platform is drawn as a true ground plane with a CSS `matrix3d` projective
transform. Chrome composited that 3D layer **above** the figure, although the figure comes later in paint order.
Proved by elimination: hiding the foreground planes changed nothing, hiding the ground restored her.

**Fix:** the ground (and now the plate) render inside an `overflow: hidden` box. That flattens their 3D transforms,
so ordinary paint order applies. Verified at 0.2 s steps through the window. No timing or registration change was
needed.

## 2. The hand-over, polished

- **Stage A** is THE LAST STAND's own victory camera, motes and paper. In the flagship it *is* the approved shot;
  the pullback takes over on bar 76 at the identical camera state.
- The full-body drawing sits under the victory pose from the retreat's first frame, registered to 1.9 px. The
  victory's bottom and left edges are feathered so the legs continue below the old crop line. The upper body
  cross-dissolves to the full-body drawing while the camera moves.
- **The approved paper is carried**, not replaced: the victory painting's own paper (figure removed, edges
  feathered) rides with her plane and dissolves into the world. v1 swapped to a flat fill too early, and the
  ground shifted slightly pinker.
- **The approved payout** (mira +19 USDC, 勝) now fades out over 0.7 s as the retreat begins, laid out exactly as
  THE LAST STAND's Victory.tsx has it. Before, it vanished on the cut frame.
- **Contact:** feet on the red circle's centre (now located by ellipse fit), with a soft contact shadow on the
  ground plane.
- **Grade at the wide end:** while her scale falls from 2.2× to 1×: saturation −14%, a 7% parchment warmth,
  contrast −4%. Her reds stay red and the close-up is untouched. It sits her into the painting at the hold.

## 3. The new assets in the shot

**Environment (as received, 2000×1125).**
- Same painting as the first master, to the pixel (pure 1.196× scale, 0.18 px median error).
- All eight depth planes rebuilt from it (`docs/depth-layers-v2.jpg`). Layer design is in resolution-independent
  coordinates, so the 5760 file drops in by re-running `tools/layers.py <file>`.
- **The final frame is now downscaled (0.96×), not upscaled.**

**Platform plate (as received, 1672×941).**
- A new painting of the platform, not a crop: texture matching fails (6 inliers).
- Registered geometrically instead: the red ritual circle, ellipse-fitted in both images, centre to centre, axes to
  axes. The circle stays registered through the crossfade (`plate-registration.jpg`, and the crossfade frames:
  no double ring).
- Only its top surface is used, feathered; never its front face, lantern or posts.
- It carries the floor while the camera is close, then hands back to the master's floor between her scale 2.4×
  and 1.2× (4.8–6.0 s). By then the master's floor is under ~2 screen px per master px and holds up.
- It holds 1.42× (horizontal) to 2.0× (vertical) the master's detail at the circle. It's painted from a slightly
  higher camera; the affine fit squashes it to the master's perspective, exact at the circle, approximate at the
  platform's far edges (hidden by the feather).

## 4. What still isn't production quality, exactly

1. **The floor around her feet, 3.1–4.3 s (`frame-v2-C-platform.jpg`).**
   - When her feet enter the frame, her scale is ~4.5×. The floor there shows at ~3 screen px per plate px.
   - The plate needs to be **~3× larger, ≥5000 px wide**, to be 1:1 at that moment. Your 5760-wide master is the
     right order; the plate should match it.
   - There's a mild magnification-proportional softening on the floor in this window (≤ ~0.6 plate px), so it reads
     as shallow focus rather than blur. Cause: insufficient detail for the magnification. Not scaling, registration
     or separation.
2. **The cliffs in the first third.** Their magnification peaks ~1.4 screen px per environment px. They're under
   depth-of-field blur then, as a close-up's background would be, so this isn't visible. The full-res master
   removes it anyway.
3. **Reconstruction slivers.** Where a nearer plane moved off something it covered: behind the right cliff's inner
   edge and right of the lantern.
   - Visible as soft mist at ~3.7–4.3 s on the right platform edge (x ≈ 1800–1900, y ≈ 650–720) and at ~5–6 s on
     the far left.
   - Cause: **edge reconstruction** (inpainting); they read as mist at speed.
   - The fix is the layered master (pass-1 brief P3). Not a blocker.
4. **Pacing.** Including stage A, there are ~2.3 s before the retreat is clearly visible (the curve is slow out by
   design: the shot should read as a victory portrait first). If it feels long in context, shorten the hold or
   steepen the curve's start (`MOVE` in `Pullback.tsx`).

## 5. In the flagship (`deliverables/yochi-flagship-v2-animatic-pullback.mp4`)

| time | what |
|---|---|
| 0–11.07 | THE LAST STAND, approved (its own source) |
| 11.07–14.50 | its victory reveal and payout (lockup card off, as before) |
| **14.50–22.68** | **the pullback**: retreat on bar 76, the world opens on bar 80, lands on bar 81, held clean to bar 82 |
| 22.68–23.36 | FREE FOR ALL over the held wide (two beats) |
| 23.36 on | the FFA act as before, its first shot two beats later. **Its wide shots now use the approved arena painting** (UP = the left terraces, DOWN = the right; Duel Master still on her platform) instead of the procedural placeholder gorge |

**Not reworked (out of scope this pass):**
- The FFA shots that zoom 2.1–2.4× into the arena painting (G1, G2) are soft; they're placeholder compositions
  awaiting their own art.
- The terraces have no crowd until E04 exists.
- The storm is a wash over the sky.

## What's still needed

1. **The full-resolution files, committed to the repo.** Chat attachments get resized before they reach this
   session. Push them to this branch (for example `flagship-v2/pullback-test/assets/source/`) or anywhere in the
   repo, and I'll re-run `tools/layers.py`, the plate registration and the render. No code changes.
2. **If the plate's original isn't ≥5000 px wide:** the same plate re-rendered or upscaled in its original session
   to ~5760×3240 (same composition). That's the only asset this shot still needs.
3. **Optional, later:** the layered master (P3, pass 1) to replace the reconstruction slivers.

## Files (`deliverables/`)

| file | what |
|---|---|
| `yochi-pullback-test-v2.mp4` | the updated test, 10.9 s (same timing as v1) |
| `yochi-pullback-test-v2-contact.jpg` | timed contact sheet, every 0.5 s, stages labelled |
| `yochi-pullback-v2-handover-diagnostic.jpg` | every 0.2 s from 1.3 to 4.9 s: the old failure window |
| `frame-v2-{A..E}.jpg` | key frames, full size (C is the remaining soft-floor moment) |
| `yochi-pullback-v2-continuity.jpg` | face, waist and legs across the hand-over |
| `yochi-pullback-v2-plate-registration.jpg` | the master's platform, and the plate registered onto it |
| `yochi-pullback-v2-depth-layers.jpg` | the planes rebuilt from the new master, and what was reconstructed |
| `../../deliverables/yochi-flagship-v2-animatic-pullback.mp4` | the flagship animatic with the pullback integrated (the previous `yochi-flagship-v2-animatic.mp4` is kept) |

Still unheard: the music is the same untouched excerpt (bars 75–82); I can't audition it.
