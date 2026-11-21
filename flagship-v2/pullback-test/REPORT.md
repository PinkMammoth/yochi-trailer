# Pullback test: Duel Master's victory into the Grand Prediction Arena

**Status: proof of concept for owner review.** 10.9 s, 1920×1080, 60 fps, pure Remotion 2.5D. Not integrated into
the flagship, nothing merged or published. The approved Duels short, both earlier flagship animatics, the canonical
art and the two new illustrations are untouched (the new ones are copied read-only into `assets/source/`).

## Verdict

**The technique works; the artwork's resolution doesn't yet.** Pure Remotion produces a genuine dolly:
- a slow start that still reads as the victory portrait;
- an invisible hand-over to the full-body drawing;
- feet planted on the platform with a contact shadow;
- cliffs, valley and mountains separating by depth;
- the lantern and rope posts sweeping in past the lens;
- a landing on the approved painting, held for 2.7 s.

The final frame is the painting itself: every plane lands exactly where the painter put it.

What stops it being flagship-ready is the source pixels. The arena master supplied is **1672×941**, smaller than the
frame. To start on her close-up, the camera begins 11.9× closer than the final wide shot. So the platform near her
feet is magnified up to ~8× when her legs first appear (2.5–4.5 s), and it goes soft and blocky. That is the one
real failure in the test. It needs a **close-range platform plate** and a **higher-resolution master**, briefed
below.

**Recommendation:** don't integrate yet. Generate P1 and P2 (plus P3 if the generator can deliver layers), and I'll
re-run the same shot. The code needs no changes beyond swapping files and re-running the layer tool. If those land,
it can go straight into the flagship.

## Deliverables (`deliverables/`)

| file | what |
|---|---|
| `yochi-pullback-test.mp4` | the proof of concept, with the music excerpt and a placeholder wind bed |
| `yochi-pullback-test-contact.jpg` | timed contact sheet, every 0.5 s, with stages A–E labelled |
| `frame-{A-victory,B-handover,C-platform,D-world,E-final}.jpg` | the five key frames at full size |
| `yochi-pullback-depth-layers.jpg` | the depth-layer breakdown: 8 planes, their depths, and every reconstructed pixel (red) |
| `yochi-pullback-registration.jpg` | the victory pose registered onto the full-body drawing: full body / victory warped / blend with matched features / difference |
| `yochi-pullback-continuity.jpg` | the same screen regions (face; waist, blade, sword; the crop line and legs) across the hand-over |
| `yochi-pullback-ab-ground.jpg` | A/B: the platform as flat strips (gaps open) vs one ground plane under a true homography (used) |

Source: `film/remotion/src/pullback/Pullback.tsx` (composition `Pullback-Test`), `tools/layers.py`, `tools/align.py`,
`tools/sheets.py`, `audio/build.py`. Rebuild steps in `README.md`.

## How it's built

**1. The camera.** One dolly along one axis.
- Every plane has a depth L, measured from the final camera in units of the distance to her feet. With the camera
  F in front of its final position, a plane's screen scale is **s = L / (L − F)** about a single focus of expansion.
- F runs from 0.916 down to 0, along a bezier in log-scale (slow out, strong middle, long landing): image change per
  frame builds 0.7 → 6.4 → 0.06 (measured), with no jumps.
- At F = 0 every plane is exactly where the painting has it, so the canvas edges can't show (every s ≥ 1).
- A 0.53° roll that registers the two drawings unwinds over the move, so it's imperceptible.

**2. The planes** (`tools/layers.py`, `docs/depth-layers.jpg`).

| plane | depth L | how |
|---|---|---|
| sky | 40 | the master with every nearer plane removed and reconstructed |
| mountains | 16 | same, soft-banded by height |
| valley (temples, bridge, mist) | 6.5 | same |
| left cliff / right cliff | 2.9 / 3.1 | polygon → GrabCut edge snap; reconstruction behind the foreground |
| **platform** | ground plane, 1/L ∝ (y − horizon) | **one plane under a homography** (CSS `matrix3d`), clipped where it passes behind the lens |
| Duel Master | 1 | feet at the circle's centre (780, 765), 150 px tall in the master |
| lantern + rocks (left) | 0.78 | start behind the lens, sweep in at ~6 s |
| rope posts + stairs (right) | 0.82 | same |

- Masks are hand-placed polygons (the design), snapped to the painting's real edges with GrabCut.
- Where a nearer plane hides something, the planes behind it are reconstructed (multi-scale inpaint plus grain
  matched to the master's own paper), feathered so no fill has a straight edge.
- Most of the reconstructed area stays covered throughout. The visible reveals are slivers behind the cliffs' inner
  edges and the lantern's right side, and they read as mist.

**3. The figure** (`tools/align.py`).
- SIFT registration of the approved victory pose onto the full-body drawing: 404 inliers, **median error 1.9 px**,
  scale 0.786, rotation −0.53°. They are the same drawing; the full body is a faithful extension.
- **Stage A** (0–1.36 s): THE LAST STAND's own victory framing and camera, its motes, its paper. Untouched.
- **Stage B:** from the first frame of the retreat the full-body drawing sits under the victory pose, registered. The
  victory's bottom 110 px and left 40 px are feathered, so the legs simply continue below the old crop line. The
  upper body then cross-dissolves to the full-body drawing (0.86 → 0.60 of the start scale), when the full-body
  image is close to 1:1 on screen.
- The approved painting's own paper (figure removed, edges feathered) rides with her plane and dissolves into the
  world. No anatomical morph anywhere.
- The painted rock slab under her feet in the full-body drawing is removed; she stands on the arena's platform with
  a soft contact shadow.

**4. Music** (`audio/build.py`). An **untouched excerpt**, source bars 75–82 (src 114.43 → 124.0), no edits inside:
- the retreat starts on bar 76;
- the world opens on **bar 80**, the second half of drop 2, where the flagship edit's arrangement opens up;
- the camera lands on bar 81 and holds to bar 82, with a 1.36 s fade after it.

Music and SFX are separate stems (`audio/out/music.wav`, `sfx.wav`). **Not auditioned.** I can't hear audio; the
bar alignment is measured.

## Technical evaluation

| criterion | result |
|---|---|
| Identity across the hand-over | **pass.** 1.9 px median registration; the cross-dissolve happens while the camera moves; face, head position, shoulders, blade, ribbons and costume continuous (`continuity.jpg`). Residual differences are in a few ribbon tips at the far left and bottom-right, masked by the feather |
| Full figure appears naturally | **pass.** The legs flow on below the old crop line; no swap is visible at speed |
| Feet on the platform | **pass at wide and medium scale.** Soft contact shadow, feet on the circle's centre. **Fails at close range (2.5–4.5 s)** because the platform there is soft (see resolution) |
| Physical coherence | **pass.** One camera model for every plane; the platform foreshortens as a floor (the A/B shows flat strips gapping). Lantern and posts pass the lens instead of fading in |
| Depth and scale | **pass.** Strong parallax between cliffs (L 3), valley (6.5) and mountains (16); she ends ~170 px tall in a monumental frame |
| Approved painting preserved | **pass.** The final frame is the painting at native positions (28.2 dB PSNR against it, outside her; the difference is the house grain, vignette and resampling) |
| Cardboard layers | **mostly pass.** Cliffs, valley and mountains are flat planes, which suits distant scenery. The temples on the cliff terraces are part of their cliff's plane and don't parallax against their own rock: acceptable at these distances, and P3 would fix it |
| Empty canvas edges | **pass** by construction |
| Effects hiding problems | **one stop-gap, disclosed.** The platform gets a softening proportional to its magnification (≤ ~4 screen px at 8×), so its compression blocks don't shimmer. It mitigates the symptom, not the cause |
| **Resolution** | **fail.** The master (1672×941) is upscaled 1.15× even in the final frame. Cliffs reach ~1.6× early in the move. The platform near her feet reaches ~8×. The full-body drawing (1086×1448) is fine: it's shown at ≤1:1 after the hand-over |
| Atmosphere | partial. Depth of field (far planes soft while she's close) is physically motivated. There's no moving mist; the painting's mist is baked into the planes. P4 would add drifting mist between planes |
| Lighting | her vermilion is more saturated than the painting's restrained accents. Per OPEN_DECISIONS #7 I didn't tint the figure; a small desaturation at wide scale would sit her in the world better (your call) |

**Ruled out.**
- **Blender:** the depth here is planar (painted layers at depths); a 3D projection of a single painting would smear
  just as the inpaint does, and adds a toolchain.
- **ArtCraft:** not installed in this cloud container. Its generative fill could replace my inpainting for P3 on your
  machine, if you'd rather do that than generate layers.
- **A second technique A/B:** not run, because the baseline's only real limit is source resolution, which no camera
  technique fixes. The one A/B that mattered (ground as strips vs a true ground plane) is in deliverables.

## Additional assets (only what's needed)

**P0 · The full-resolution originals (do this first).** The files I received are 1672×941 (arena) and 1086×1448
(figure), probably chat-compressed. If larger originals exist, they may solve most of P2 at once.

**P1 · Close-range platform plate · ESSENTIAL.**
- **What:** the centre of the victory platform, painted at close range in the master's style and perspective: the
  weathered stone slabs, cracks, moss, the red ritual circle's arc, a few fallen maple leaves, empty (no figure).
- **Why:** between 2.5 s and 4.5 s her feet and the stone around them fill the frame, and the master has ~40 px of
  stone there per screen-width of detail.
- **Perspective:** the master's camera height and horizon (y ≈ 420 of 941), looking at the circle's centre, covering
  roughly x 450–1110, y 676–900 of the master.
- **Resolution and layers:** 5120×2880 or larger, one layer, transparent outside the platform edge.
- **Use:** blended into the ground plane while the camera is close, cross-fading to the master's platform by the time
  its magnification drops below ~1.5×.

**P2 · The master at higher resolution · ESSENTIAL for the flagship.**
- **What:** the same painting, unchanged in composition, re-rendered or upscaled in the original generator session
  (not a generic upscaler).
- **Resolution:** ≥3840×2160, ideally **5760×3240**.
- **Why:** the final frame would then be at or below 1:1, and the cliffs sharp in the first half of the move.

**P3 · The master as layers · HIGH IMPACT.**
- **What:** the same painting delivered as separate transparent layers: sky, far mountains, valley (temples,
  bridges, mist), left cliff complex, right cliff complex, the platform, the left foreground (lantern, rocks,
  maples), the right foreground (rope posts, stairs). Each layer painted **complete behind** the nearer ones.
- **Why:** it replaces every reconstructed pixel (the red areas in `depth-layers.jpg`) and lets the terrace temples
  separate from their rock.
- **Resolution:** as P2.

**P4 · Drifting mist plates · OPTIONAL.**
- **What:** 2–3 transparent sumi-ink mist layers, wider than frame, matched to the painting's mist.
- **Use:** to drift between the valley and the cliffs, and in front of the platform at the end, so the hold breathes.

**P5 · A near occluder for the first half · OPTIONAL.**
- **What:** an overhanging maple branch or a stone pillar edge very close to camera, in the master's style.
- **Use:** to pass the lens around 3–4 s. Right now the first natural occlusion (the lantern) arrives at ~6 s.
  This could also be separated from the master's own top-left maple if P3 provides it.

Not needed: a new full-body figure (the one supplied matches to 1.9 px), an intermediate transition composition (the
hand-over works), a gateway (this painting's foreground does that job).

## Notes and decisions

- **Her scale in the final frame** (150 master px, ~170 on screen) is a judgement. The lantern (≈2 m) is ~245 px at
  a similar depth, so a person reads at ~150–180 px. Smaller makes the world bigger but loses her: `fig_height_master` in
  `tools/layers.py` / `assets/derived/layers.json`.
- **Cultural content.** The approved painting includes torii, pagodas and banners. The kit's cliché list rules those
  out for invented scenery; I've treated your approval of this environment as overriding that for this painting.
  Please confirm.
- **The paper's grain moves with its plane.** Planes at different depths carry the painting's own texture, so the
  grain parallaxes slightly; the house grain overlay on top keeps the surface unified. Invisible at speed in the
  stills I checked, but worth a look in playback.
- **Fidelity at the end:** the house grade (grain and vignette) runs over the whole shot, as in every Yochi film. If
  you want the painting pure at the hold, it's one prop.
