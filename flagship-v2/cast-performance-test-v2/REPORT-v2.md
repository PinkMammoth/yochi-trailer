# Cast performance tests v2: Cold Blooded's mask, Untouchable's ribbons

**Status: for owner review.** This is a new folder beside v1 (`../cast-performance-test/`, untouched). Nothing is
integrated into the flagship and nothing is merged or published. This session can only push to
`claude/nice-cerf-yokee2`; I checked it was current and clean before starting.

## The short answer

| | verdict |
|---|---|
| **Cold Blooded** | **The gesture now works.** The mask rises from his chest and covers his face in one continuous movement, with no double face, duplicated mask or floating hand. The method that achieves it is the *concealed* one (B). The registered masked cut (A) is clean but snaps. **No third painting is needed for the close-up gesture.** One is needed only if you want the lift seen in a full-figure wide (§1.5) |
| **Untouchable** | **Substantially better than v1.** She's built from the sharp portrait figure on the approved landscape. The 17 major ribbons, hair ends and hem tatters are separated layers that each move on their own wind, behind a body that stays still. The v1 grey edge smudges are gone. **Flagship-worthy.** What still separates this from "impossible grace" is listed in §2.6 |

---

## 1. Cold Blooded

### 1.1 The two paintings (`cold-blooded-v2-pose-registration.jpg`)

B (mask raised) registers onto A (mask lowered) with a similarity transform: B is drawn **3% larger** (scale
0.969), rotated −0.47°, with 430 SIFT inliers and a 1.30 px median residual. After registration:

| region | flow median / p90 (px) | |
|---|---|---|
| fur collar, chest cords and medallion, sash, lower robe, left hand and sleeve | 1.6–3.1 / 4–15 | **the same drawing**, re-rendered texture |
| face and head | 5.7 / 60 | the head is **bowed further** in B (chin lower, toward the chest) |
| hair, bun, pin | 10.5 / 18 | the hair is redrawn around the bow |
| mask, hand, forearm | 22–61 / 110–140 | **the gesture**: the mask centre travels 320 px up and 45 px left; the forearm translates almost rigidly |
| right sleeve | 40 / 98 | B's sleeve falls back to the elbow and hangs from a raised arm; A's hangs from a lowered forearm |

The change region is **37% of the figure** (Last Legend's was 27%). Costume continuity is good: the cords,
medallion, sash pattern, fur and bamboo prints match. The face is the same man, with the same scar, but not the same
head angle.

### 1.2 What I tried, and what you'd see at speed (`cold-blooded-v2-method-ab.jpg`)

**Method A: registered layered transition (`cold-blooded-v2-method-a-layered.mp4`).** The whole figure. A's own
mask, hand and wrist rise 110 px as one rigid piece. Then the change region cuts to B on smear frames.
- *Result:* clean, with no ghosting and no double mask, because one painting is visible per frame inside the region.
- *But* the last 210 px of the travel happens in one frame. At speed it reads as **a snap**: the mask jumps to the
  face. It's exactly the limitation predicted for two keys, now demonstrated.
- Pushing the rigid rise further isn't possible. A's forearm ends inside its sleeve, so lifting it more than ~110 px
  uncovers a forearm that was never painted (the "floating hand").

**Method B: concealed (chosen; `cold-blooded-v2-cinematic.mp4`, `cold-blooded-v2-trailer.mp4`).**
1. Medium on his face and the lowered mask. The loss reaches the world, then him (grey), and he is still.
2. The camera tilts up to his face as **his own hand starts to rise**: A's mask, hand and wrist as one rigid piece.
   Its wrist end is below the frame.
3. **Mid-rise the rising hand becomes B's** (mask, hand and forearm as one piece, cut from B), at exactly the same
   mask centre. Both carry motion blur proportional to their speed, so the swap frame looks like every other frame.
   At that moment A's chest below the collar gives way to B's (consistent with a raised arm). It's at the bottom
   edge of the frame, and the two chests are the same drawing to ~2–3 px.
4. B's mask keeps rising, decelerating, **over A's face**. His expression disappears behind it: first the eye, then
   the cheek. This is the emotional centre, and it's real motion of the painted mask over the painted face.
5. **The head settles into the mask**: a cut to all-B under a 0.6% rigid sink and a single light smear frame. Because
   B's head is bowed a little lower, this reads as him lowering his face into the mask, not as an edit.
6. The camera eases back to the whole painting while the loss grey deepens.

Timing (cinematic, 6.2 s):

| time | beat |
|---|---|
| 0–2.05 s | pause, outcome registers |
| 2.05–3.5 s | the rise (1.45 s, deliberate, slow in and slow out) |
| 3.5–3.7 s | the completed gesture held |
| 3.7 s | the settle |
| 3.7–6.2 s | the wash, pulling back to the whole painting |

The trailer is 7 beats (2.39 s): the rise takes 0.9 s, the grey 敗 stamps on beat 5, and `−80 USDC` is marked
`PROVISIONAL`.

**Why B is better at normal speed:** the mask is never still in a way that exposes the swap. It travels one
continuous path, at one speed profile, from chest to face. A snaps.

### 1.3 Quality control (`cold-blooded-v2-transition-frames.jpg`: every 3rd frame of the lift, every frame of the swap and the settle)

- **No double face.** An earlier pass carried a sliver of B's chin under the moving mask (f156–158). I tightened the
  layer to the mask's lower edge; it's gone in the final render.
- **No duplicated mask.** A's mask and hand are removed from every base that's visible while B's mask moves.
- **No floating hand.** The rising forearm always runs into the sleeve or off the bottom of the frame. Both moving
  layers fade into identical pixels in the base, so there is no cut edge.
- **No sleeve distortion.** Nothing is warped. Every move is a rigid translation plus at most 5° of rotation of the
  mask/hand piece.
- **What a careful viewer could notice:**
  1. The mask turns slightly (5°) as it rises. This covers the angle difference between the two paintings' masks.
  2. Through the swap (f154–160) the mask is motion-blurred. It's consistent with its speed, but softer than the
     sharp hold either side.
  3. In the close-up the paintings are shown at ~1.7× upscale (they arrived at 1086×1448), so the face hold is soft
     compared with the wide.
  4. The base below the collar changes from A's chest to B's chest at the swap. The two drawings agree to ~2–3 px
     there, but the fold texture is re-rendered.

### 1.4 Recommendation

Use **method B**, cinematic or trailer. **It makes a small gesture enormous**, because the camera is close enough
that the mask covering his face *is* the shot.

### 1.5 Is a third illustration necessary?

**Not for this shot.** The concealed method gives a continuous rise without it, and I've demonstrated that rather
than assumed it.

A third painting is needed **only for a wide shot where the whole arm is seen rising**. Method A shows why: two keys
in a wide either snap (210 px in one frame) or expose an unpainted forearm. If you want that wide, the brief is:
- **"mask at the chin"**: the same canvas and body as both paintings;
- the forearm raised halfway, hand at the collar, the mask covering the mouth and chin;
- eyes still visible, looking down; the sleeve sliding toward the elbow.

The full-resolution files would also sharpen the close-up.

---

## 2. Untouchable

### 2.1 The new landscape vs the approved portrait (`untouchable-v2-source-comparison.jpg`)

The landscape is **not** an extension of the portrait. It's a regeneration:
- **Scale:** the figure is drawn at **0.635×** the portrait's scale (rotation −0.67°, 347 SIFT inliers, 1.37 px
  median).
- **Where they agree** (registered at portrait scale): face and blindfold 2.6 px median, torso 2.6, hands and hilt
  2.3, sword 4.5. **The pose, costume and face are the same character.**
- **Where they differ:**
  - the skirt from the knees down (6.5 px, rising);
  - the feet (44 px);
  - the moon (30 px, it's larger and shifted);
  - **every ribbon and hair end** (46–93 px): completely redrawn, and longer, completed and fully inside the canvas.
- **Resolution:** the landscape arrived at 1672×941. Its face is ~90 px wide. At 1080p in a 1.5× push that's a
  **1.8× upscale: visibly soft**. The portrait's face is 1.6× more detailed.

### 2.2 The choice: a hybrid, non-destructive

I didn't sacrifice the face for the canvas, so the shot uses both paintings:
- **The portrait** wherever the two agree: head to knees, sword and hands. That's 81% of the body, chosen per pixel
  by measured agreement (low flow), never its paper or its moon.
- **The landscape** for everything else: the ribbons, the legs and feet, the moon, and all the paper.
- **The seam:** in an ~80 px band around the portrait region, the landscape is warped onto the portrait's geometry
  (by the measured flow, ≤28 px). Strokes continue across it, and the 1:1 checks show no doubled strokes.
- Both originals are untouched in `assets/source/`. The working canvas is the landscape at portrait scale
  (2634×1483).

### 2.3 Ribbon separation (`untouchable-v2-layer-separation.jpg`)

- **17 strands**, each its own layer: the long ribbons left and right, the hair ends, the hem tatters, and small
  ribbon fragments.
- **How they were found:** connected ink, grouped by a wide closing so that a ribbon's cream stretches keep its
  pieces together. The paper's own dark mottling is excluded, so it doesn't drift.
- **Ink as transmittance.** Each layer stores ink as transmittance, so at rest the composite is the painting and
  moved ink multiplies like ink.
- **The paper behind** is the original wherever the ink was faint, and is inpainted from the surrounding paper where
  real ink lifted off. Nothing pale or smudged shows when a ribbon moves.
- **Roots and tips.** Each strand has a root (where it meets her body), a geodesic distance along itself (0 at the
  root, 1 at the tip), and a local tangent.
- **Groups.** The strands are split into three interleaved groups, so neighbours never share a motion field and
  never clip each other.
- **No ribbon passes through her.** Her body is a separate occluder drawn last, so no strand can cross the torso.
  Strands that emerge from behind her stay behind her.

### 2.4 The motion (`untouchable-v2-motion-map.jpg`, `untouchable-v1-vs-v2-ribbons.jpg`)

Every strand bends with a wave travelling from root to tip, plus a slower second harmonic and a slow swing:
- **Perpendicular to its own local direction**, so curved ribbons ripple along their curve.
- **Growing as s^1.6:** still at the root, largest at the free end.
- **Its own frequency, wavelength and phases** (long ribbons slower). A gust crosses the frame left to right, so
  strands react in sequence, never in sync.
- **A little parallax** against the camera, per strand depth.
- **Amplitudes** 10–27 landscape px at the tips (≈12–30 screen px). The world's clock stops at the win.

Measured on a locked camera over 1 s (temporal deviation; the paper grain alone is ≈2):

| region | mean | p99 |
|---|---|---|
| face and blindfold | 1.99 | 2.9 |
| torso | 1.97 | 3.0 |
| hands on the hilt | 1.96 | 4.3 |
| moon | 2.41 | 3.5 |
| feet and ground | 1.91 | 3.0 |
| left ribbons | 15.9 | 65 |
| right ribbons | 7.3 | 52 |

**She is pixel-still; only the strands move.**

**v1 vs v2:**
- v1 moved one displacement field over the portrait, with the ribbons ending in grey smoke where the portrait's
  canvas stopped.
- v2's ribbons are complete strokes from the landscape, move independently and travel further.

### 2.5 The performance (`untouchable-v2-cinematic.mp4` 6.8 s, `untouchable-v2-trailer.mp4` 2.05 s)

Kept from v1:
- the ink bloom from the moon outward;
- her absolute stillness;
- the wind rising into a **freeze at the win** (0.55 s, a true dropout of every stem), with the amount rising in the
  silence;
- the slow push to the blindfold.

New in v2:
- a slow warm light sweep across the paper as the bloom completes;
- a second, smaller gust earlier, so the big one has something to grow from;
- per-strand parallax.

**The payout is a prop** (`payout: { show, handle, amount, provisional }`). It is shown with a
`PROVISIONAL · FIGURES TO BE VERIFIED` line and is not a final figure.

`untouchable-v2-rigid-ab.mp4` is the same shot with the strands held still, for judging what the motion adds.

### 2.6 Remaining limitations, candidly

1. **Strands, not cloth simulation.** Each strand bends as a whole: perpendicular waves and swing, no folding, no
   twist, no change of silhouette. It reads as ink breathing on a wind. A ribbon flipping over itself would need
   painted layers per strand: a front and a back.
2. **Ribbons painted across her body don't move**: the sash, the robe panels and the hem in front of her legs. They're
   part of the static figure. So are the hair strands that overlap her head.
3. **Large hem tatters are single strands.** Where the painting merges several tatters into one ink mass, they move
   as one piece.
4. **The ground fade.** Within 60 px of the ground, motion fades to zero. This stops the hem tearing where it meets
   the ground, which an earlier pass did.
5. **Seam band.** The portrait-to-landscape seam band is invisible at 1:1 in the checks. Over the knees, the
   landscape's softer strokes meet the portrait's sharper ones; at 1080p the sharpness difference shows only on
   close inspection.
6. **Resolution.** Everything outside the portrait core is the landscape at 1.57× its pixel size: soft ribbons in
   the close-up. The full-resolution landscape would fix this.
7. **Dependencies.** No new ones: one WebGL pass with 9 textures, and an offline prep (OpenCV, scikit-image).

**Asks that would take it further:**
- the landscape at full resolution (≥3840 px wide);
- optionally, **the free ribbons delivered as separate transparent layers** from the generator. That would give
  clean edges where ribbons overlap each other, which my separation has to treat as one strand.

---

## 3. Deliverables (`deliverables/`)

| file | what |
|---|---|
| `cold-blooded-v2-cinematic.mp4` / `-trailer.mp4` | method B, chosen (6.2 s / 2.39 s) |
| `cold-blooded-v2-method-a-layered.mp4` | method A, for the A/B |
| `cold-blooded-v2-method-ab.jpg` | A vs B at the same moments |
| `cold-blooded-v2-pose-registration.jpg` | registration, change region, the gesture path, numbers |
| `cold-blooded-v2-transition-frames.jpg` | every 3rd frame of the lift, every frame of the swap and the settle |
| `cold-blooded-v2-layers.jpg` | the layers |
| `untouchable-v2-cinematic.mp4` / `-trailer.mp4` | 6.8 s / 2.05 s |
| `untouchable-v2-rigid-ab.mp4` | strands held still |
| `untouchable-v1-vs-v2-ribbons.jpg` | v1 vs v2 at the same moments, and the left ribbons at 1:1 |
| `untouchable-v2-layer-separation.jpg`, `untouchable-v2-motion-map.jpg`, `untouchable-v2-source-comparison.jpg` | separation, motion proof, portrait vs landscape |
| `*-contact.jpg` | timed contact sheets for every cut |

Audio: separate `music`, `sfx` and `mix` stems per cut in `audio/out/`. The music is the flagship's track, untouched
excerpts on its bar grid; the SFX are synthesised placeholders. **Unauditioned.**

QC method: I can't play video at normal speed. I inspected:
- dense frame sheets of the encoded renders;
- every frame through Cold Blooded's swap and settle;
- 1:1 crops of the ribbon roots, tips and seams;
- a locked-camera temporal-deviation map.

I fixed three defects this way (B's chin sliver under the mask, a paper gap under the sleeve, the hem tearing at the
ground) before the final renders.

## 4. Rebuild

```bash
cd flagship-v2/cast-performance-test-v2
python3 tools/register_cb.py && python3 tools/register_un.py
python3 ../film/tools/matte.py assets/source/cold-blooded-mask-lowered.webp assets/derived/cb-A-matte.png --fill-holes
python3 tools/prep_cb.py
python3 tools/prep_un_hybrid.py && python3 tools/prep_un_strands.py
cd remotion && npm ci && tools/sync-assets.sh && node --experimental-strip-types tools/timing.mts && python3 ../audio/build.py
tools/render.sh ColdBlooded2-Concealed cb2-concealed ../deliverables/cold-blooded-v2-cinematic.mp4
#  ColdBlooded2-Trailer cb2-concealed-trailer · ColdBlooded2-Layered cb2-layered · Untouchable2-Cinematic un2-cinematic
#  Untouchable2-Trailer un2-trailer · Untouchable2-Rigid un2-rigid
cd .. && python3 tools/sheets.py <locked-camera Untouchable frames>
```
