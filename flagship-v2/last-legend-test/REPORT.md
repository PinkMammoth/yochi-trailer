# Last Legend two-pose test: evaluation

## The short answer

| question | answer |
|---|---|
| Can the two paintings be registered? | **Yes, unusually well.** They share one canvas: a similarity fit of B onto A is scale 0.9986, rotation 0.00°, translation (1.2, 1.2) px, with a 0.76 px median residual over 927 SIFT inliers. Below the chest they are the **same drawing to under a pixel** (fist, kneeling leg, boot, belt, lower garments and the left cloth all have a flow median of 0.5–0.8 px). Only the fine paint is re-rendered (ΔE median ~5) |
| What actually changes? | **27% of the figure**: the head and neck (flow median 25 px), the upper chest the lowered head was covering, the red cloth on his right shoulder (11 px) and the right forearm and hand (3 px, up to 10 px). Nothing below the belt |
| Does a morph work? | **No, and a dissolve doesn't either.** Any dissolve, masked or not, shows two faces for 3–5 frames (`transition-methods.jpg`, frames 235–236). Adding a motion blur only softens the double face; it doesn't remove it |
| What works | **A masked hard cut, with one smear frame either side.** The cut happens only inside the change region, while the camera tilts up toward the face and the whole figure draws a rigid breath. The last frame of A and the first of B carry a short vertical motion blur, like a limited-animation head lift. No frame ever holds both faces, and the body never moves because it's the same drawing. After the cut, the rest of the figure crossfades from A's paint to B's over 1 s while the camera moves (the geometry is identical), so the hold is Pose B exactly |
| Recommendation for the flagship | **Version B-6 (2.05 s), replacing the three-loss montage in X2.** Rationale below |
| Is it production-ready? | **As a technique, yes. As pixels, almost.** The limits are the source resolution (the attachments arrived at 1199×1312) and one cut that can't be in-betweened without an extra painting. Both are below, with what would fix them |

## 1. Starting state (checked before work)

- `claude/nice-cerf-yokee2` @ `f3f8d44` is the newest committed flagship-v2. It has pullback pass 2 and the animatic
  with the pullback integrated, it's the only branch containing `flagship-v2/`, and its working tree was clean. The
  other 19 remote branches are older films (latest: `br-action-last-stand`, 21 Nov 00:39, before the flagship-v2
  commits). There are no other worktrees.
- **Branching:** this session may push only to `claude/nice-cerf-yokee2`, so I couldn't use a separate feature
  branch. Isolation is by directory: everything is in the new `flagship-v2/last-legend-test/`, and no existing file
  was edited (`git status` shows only that folder). The flagship's house libraries are imported read-only. The test
  has its own Remotion project, so the flagship's `Root.tsx` is untouched too.

## 2. Registration (`deliverables/last-legend-pose-registration.jpg`)

Measured with `tools/register.py` (SIFT + RANSAC similarity, then dense DIS optical flow of A against registered B,
and a blurred Lab ΔE):

| region | flow median / p90 (px) | verdict |
|---|---|---|
| head and neck | 25.0 / 38.2 | the pose change |
| right shoulder, red cloth | 10.6 / 23.9 | redrawn drape |
| upper chest | 1.8 / 16.5 | uncovered as the head lifts |
| right forearm and hand | 3.3 / 10.0 | the hand sits a little differently on the knee |
| left pauldron | 1.8 / 4.5 | essentially the same |
| left arm and bracer, planted fist, belt, kneeling leg and boot, lower garment, left cloth, floor cloth | 0.5–0.8 / 0.9–2.3 | **identical geometry**; paint re-rendered (knuckle shading, armour filigree) |

Silhouette, torso position, shoulder line, the kneeling leg, the lower garments and ground contact don't change at
all. **The smallest region that genuinely changes** is the measured change mask (`layers/change-mask.png`):
dilated, closed and feathered (σ 18 px). Its feather lies where the paintings register to a 1.4 px median flow
(2.4 px p90), so the mask's own edge can't ghost. It also takes in the left pauldron's top edge, because that edge's
silhouette differs by a few pixels.

## 3. The transition (`deliverables/last-legend-transition-methods.jpg`)

Five methods, rendered on the same frames of the same shot:

| method | result |
|---|---|
| full-image dissolve | double face mid-transition; the body's re-rendered texture shimmers |
| masked dissolve | the body is perfect; **the face still doubles** for ~4 frames (two beards, two sets of eyes) |
| masked dissolve + motion smear | the double face becomes a blurred double face. It reads as a focus pull, not a movement |
| masked hard cut | clean. Every frame is one painting; reads as key-to-key |
| **masked cut + 1 smear frame each side (chosen)** | clean, and the snap has a direction: the last A frame smears upward (3 px drift, 9 px vertical blur), the first B frame arrives from below (4 px, 11 px blur), and the next frame is nearly sharp |

Cover around the cut (all whole-figure or camera moves, rung 4):

- the camera tilts and pushes up toward where his face will be, through the cut;
- the whole figure takes a rigid 0.7% inhale about the ground point before the cut and lets 0.2% go after;
- the breathing has stopped (Beat B), so the cut lands out of stillness;
- the world's grey has settled (no colour change on the cut), and the vignette eases slightly as he looks up.

**Why not more frames:** a true head-lift in-between would need either a mesh warp of the face (rung 5, off by
owner decision #8) or a third painting. See §8.

## 4. The performance

| beat | cinematic (6.00 s) | trailer (2.73 s / 8 beats) | trailer-6 (2.05 s / 6 beats) |
|---|---|---|---|
| **A, impact and collapse**: the market's ink wave clears left to right off the losing side; Pose A revealed, the house 6 px shake on the hit, a rigid settle (1.006 → 1, 9 px down) as the weight lands, ink flecks streaming past | 0–1.6 s | 0–0.4 s | 0–0.36 s |
| **B, recognition**: push to the shoulders (z 1.0 → 1.36), breath fading to stillness, the ink air clears, the figure greys to 50–55% (the loss grade), the vignette closes a little | 1.6–3.45 s | 0.2–0.8 s | 0.12–0.5 s |
| **C, defiance**: the inhale, the cut at the top of the tilt, the face held while the body settles into B | cut at 3.93 s (f236), face held 1.5 s, ink wipe out from 5.62 s | cut at 1.05 s (f63, beat 3), 敗 stamps on beat 4, holds to a hard cut | cut at 0.70 s (f42, beat 2), 敗 on beat 3 |

Muted read: the shot is built to work without sound. The wave reveal, his stillness and the lifted head carry it, and
in the trailer cuts the grey 敗 and `−75 USDC` (Mono 800, ~50 px cap) make the loss explicit.

## 5. Environment and contact

- **Where:** the DOWN side of the approved arena painting (DOWN = the right terraces in the flagship). The backdrop
  is the banner platform, the stairs and the cliffs, out of focus (5 px blur, 0.32 parallax). The floor is the paved
  landing at the foot of the right-hand stairs. Mist sits between them. There's no card background and no new
  environment art.
- **Contact:** the painting's own floor ink (the contact shadows and smudges under fist, knee and boot) is extracted
  as alpha and laid on the stone, so the painted contact survives without the parchment. Under it there's a soft
  pooled shadow, and the authored ground line keeps the cloth spill on the floor (`mask-qc.jpg`).
- **Grading:** world grey 15% → 33%, figure grey to 50% (cinematic) / 55% (trailers). This is deliberately not the
  full grey loss variant, so the painting still reads. It's one constant (`greyMax`).

## 6. Exceptions to the style guide (documented, deliberate)

1. **Local movement inside the change region for two frames.** The smear frames shift the masked head/shoulder
   region by 3–4 px. That's a local move, which the guide's rung 4 doesn't cover. It exists only on the two frames
   that straddle the cut, under motion blur, never on a sharp frame. There's no persistent head layer, no rig, no warp
   and no face animation. `method: 'cut-masked'` removes it entirely if you'd rather keep the house rule strictly.
2. **Swapping between two paintings inside a mask.** This is "alternate artwork", which the guide allows. The mask
   only localises it.
3. **Ragged alpha at the canvas edges.** His cape runs off the painting's left edge (462 rows) and the floor cloth off
   its right. Over the arena that's a ruler-straight cut, so the last ~45 px get a torn-cloth alpha falloff. It's
   alpha only; no pixel is painted.
4. **Partial grey** instead of the full grey variant (§5). Your call.

## 7. Quality control, candidly

**How it was checked:** I can't play video at speed. I extracted every frame of all three renders, inspected every
frame through each head lift (full frame and a 1080p head crop: `transition-*.jpg`), and inspected contact sheets at
0.1 s / 0.05 s plus 1:1 crops of the mattes and contact. Automated metrics (registration residuals, flow inside the
mask feather) supported this, but didn't replace it.

**Checked clean:** no ghosting or double features on any frame (the chosen method never mixes the faces); costume
details below the chest never jump (same drawing); no neck or shoulder distortion (nothing is warped); ground contact
holds through the settle; no scale jumps; the type clears the figure and sits inside title-safe.

**Visible defects and limits:**

1. **Resolution.** The attachments reached this session at 1199×1312, very likely downscaled in transit (the
   pullback's environment files were). The face hold shows the painting at 1.22–1.27× upscale: still painterly, but
   visibly softer than the wide. A tighter face (eyes filling the frame) isn't possible at this size.
2. **The cut is a snap.** It reads as a sharp, proud lift of the head, which suits "he looks up". It can't read as a
   slow lift: the painting has no in-between (§8).
3. **Smear-frame side effects.** On the two smear frames, the left pauldron's medallion and the right forearm (both
   inside the mask) are softened too, although they barely move. It lasts 2 frames, and I'd expect it to read as part
   of the movement, but I couldn't confirm that at speed.
4. **What changes on the cut besides the head:** the red cloth on his right shoulder changes drape, and the right
   hand settles ~10 px. Both change in the same frame as the head, so they read as his body shifting as he rises. A
   careful frame-by-frame viewer will see the cloth redraw.
5. **The body crossfade** (A's paint to B's below the chest, 1 s, during the push) is geometry-identical, and I can't
   see it frame to frame. At speed it might show as a faint texture shimmer on the armour filigree. If it does, set
   `body0`/`body1` to never (keep A's body under B's head). The joint then sits in the 1.4 px feather.
6. **Floor resolution.** The paved landing is a 374×95 crop of the arena painting, shown at ~6×, so it's soft. The
   wide covers it with a 1.4 px blur (shallow focus) and the painted contact ink, which is sharp on top. It reads as
   stone, but the blocks are large for his scale.
7. **The opening ~9 frames are solid ink** (the wave still covering). In the flagship this continues X1's wave; as a
   standalone clip it starts on black.
8. **Sound is a placeholder and unauditioned.** The music stem is the flagship's own track at bar 137 (source
   198.99 s), placed on the reveal hit. The strongest transient in that window is at 198.61 s (probably a snare, but
   check by ear). The SFX are synthesised (no recorded foley exists in the kit).
9. **Text audit:** `docs/asset-audit/tools/text_audit.mjs` targets the other engine. I checked by hand instead: the
   type's left edge is at 140 px, the 敗 seal's top at 78 px, and `−75 USDC` is ~50 px cap.

## 8. What would improve it most (specific asks)

1. **The full-resolution originals, committed to the repo** (e.g. `flagship-v2/last-legend-test/assets/source/`). No
   code changes: re-run `register.py` → `layers.py` → render. This fixes defect 1.
2. **One in-between painting, "Pose A½".** Same canvas, same framing, everything below the collarbone pixel-identical
   to Pose A (ideally made by inpainting Pose A's change mask). Only the head is raised about halfway: chin level, eyes
   still lowered, the jaw set, the grimace softening into the bitter look. The shoulder cloth should be halfway between
   the two drapes. That gives a three-key lift (A → A½ → B, 3–4 frames each, still one painting per frame) that reads as
   a real, slower movement. It's the single biggest upgrade, and it would let the cinematic cut breathe.
3. Optional: a higher-resolution plate of the paved terrace (the floor), ≥2500 px wide.

## 9. Editorial recommendation for the flagship

**Use Version B-6 in X2 and restructure the losses around it.**

- X2 currently gives three losses 0.68 s each (Last Legend, Grudge Settled, Cold Blooded). At 0.68 s none of them can
  *perform*: you get a pose and a grey seal. Last Legend's performance needs a reveal, a beat of stillness and a lift,
  which takes ~2 s minimum.
- **Proposal:** X2 becomes Last Legend alone, B-6, 2.05 s, which is exactly the current X2 slot (65.31–67.35). Nothing
  else in the timeline or the music moves. Grudge Settled and Cold Blooded's losses become greyed faces inside X1's
  wide (the DOWN terraces greying), or one of them gets a single beat in X4. That also retires two image briefs (B22,
  B23) the flagship hasn't got yet.
- **Why one deep loss works:** X3 then answers one deep, dignified loss with three quick wins, and the contrast does
  the work. "Beaten, not diminished" is also the honest message of a prediction game: the loser comes back next round
  (X6).
- **Version B (8 beats)** reads better than B-6, with a beat more of stillness before the lift. But it needs X2
  extended by a bar, and that moves every later cue and the music edit. I wouldn't trade the end card's timing for it.
- **Version A (cinematic)** is for a character spotlight, a social cut or a Last Legend unlock moment, not for the
  flagship's pace.
- The flagship's B21 brief (sword planted, both hands on the hilt) is superseded by these two approved paintings
  (fist planted, no sword). The flagship's storyboard text for X2a should be updated when you integrate. I haven't
  touched it.

## 10. As a reusable technique for other characters

The pipeline is general (`register.py` → `matte_refine.py` → `layers.py` → `LastLegendShot`'s mix). It works when
the second pose is **painted on the same canvas with the body unchanged**, as here. Check the registration numbers
first:

- median residual ≲1 px, and the lower body's flow ≲1 px: this method (masked cut + smear);
- body flow of a few px: the masked cut still works, but the feather must grow and the body crossfade becomes visible;
- different framing or body: don't register. Use a camera-motivated cut (a punch-in or an ink wipe) between them.

When commissioning a second pose for this, ask for **"the same image, only the head changed"** (an inpaint of the
first painting's head and shoulders). That one instruction is what made this test possible.
