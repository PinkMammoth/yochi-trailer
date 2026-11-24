# Cast performance tests: evaluation

Benchmark: the Last Legend two-pose test (`../last-legend-test/`). The question asked of each painting: can it be made
good enough to belong in the finished flagship?

## The blunt answer

| | verdict | as-is | what would make it production quality |
|---|---|---|---|
| **Untouchable** (win) | **The standout. Feature her most strongly.** | **Flagship-worthy now**, as a mythic reveal on her own paper | the painting delivered wider (the ribbons are cut off by the canvas edge) and with the ribbons on their own layer; optionally one registered "thumb on the guard" pose |
| **High Roller** (win) | **Strong, clean, short.** The pose does the work; the chip toss adds the fun | **Flagship-worthy now** as a 2–4 beat winning beat | nothing essential. A higher-res file would let the camera go tighter on the laugh |
| **Cold Blooded** (defeat) | **A pose, not yet a performance.** The new painting is the *end* of the gesture | **Usable, not yet memorable.** The cut from the v2 card reads as an edit, not as him raising the mask | **one registered painting: the mask lowered at his chest, same canvas, same body**. With it, this becomes one of the film's best beats |

Ranking for the flagship: **Untouchable > Last Legend (benchmark) > High Roller > Cold Blooded (until his second
painting exists).**

## Starting state

`claude/nice-cerf-yokee2` @ `eaebfc8` (the Last Legend test) was the newest commit containing flagship-v2 work,
with a clean tree. Everything here is new, in `flagship-v2/cast-performance-test/`, and nothing existing was modified.
This session can only push to that branch, so there's no separate feature branch. All three paintings arrived at
roughly 1100×1450 (1086×1448, 1024×1536, 1122×1402), so they were probably downscaled in transit, like the Last
Legend files.

---

## 1. Untouchable: the standout

**What the shot does** (`untouchable-cinematic.mp4`, 7.6 s; `untouchable-trailer.mp4`, 2.05 s / 6 beats):

1. Blank paper. The ink of her painting **blooms out of the paper from the moon outward** on a ragged wet edge: moon
   first, then her, then the ribbons last.
2. She **never moves**. No breath, no sway: she is pixel-still (measured below). Everything around her moves: the
   ribbons, hair tips and hem tatters ripple on the wind, and ink motes drift past.
3. The wind rises into the win beat, then **everything freezes for half a second**: ribbons, motes, and the sound
   (a true dropout of every stem). Only she is unchanged, because she was already still. The amount
   (`+52.63`) rises inside the silence, and one low hit releases it.
4. A slow push and tilt up to the blindfold and the moon.

This is the one test that reads as more than "a character winning". Stillness against moving ink makes her the only
fixed point in the frame, which is the "exists above the struggle" brief made literal. The painting earns it: the moon,
the blindfold, the stillness of the pose and the violence of the ink around it.

**The ribbons: can they be animated convincingly? Yes, within limits. Here's what was done and what it can't do.**

- **Method:** one WebGL pass per frame. A displacement field moves only the free ends: weight 0 on her body, head,
  arms, sword, moon and ground (an authored rigid core), and weight rising with distance from the core and limited to
  ink. Waves travel outward along each ribbon (the direction is the gradient of distance from the core), plus a slow
  wind drift. Amplitude ≤ 9 canvas px at the tips (≈ 6–10 screen px), 2.3× in the gust.
- **Proof** (`untouchable-motion-map.jpg`, locked camera, 31 frames over 1 s): face, torso, hands and blade sit at the
  grain's noise floor (temporal deviation 1.8, p99 2.7). The free ribbons measure 9.0 (p99 62) and the hem tatters
  6.5 (p99 55). The first pass also moved bare paper near the canvas edge (its fibre visibly swam). It was fixed by
  restricting motion to ink, and the map above is after the fix.
- **What it reads as:** ink ends breathing on a wind. Waves travel along the ribbons; there's no rubber-sheet
  wobble, because the body never warps.
- **What it can't do:** ribbons that cross her body (the sash and the robe panels) can't move. They're painted into
  the body, so the core holds them still. Nothing can flip, fold or separate from what's behind it, because a 2D warp
  only stretches pixels. Anything beyond ~15 px starts to smear, so the motion stays subtle.
- **House rule:** this is a local warp (the style guide's rung 5), confined to cloth/hair ends, never the figure or
  face. Owner decision #8 keeps rung 5 off for ambient motion. **This is a documented exception for your review.**
  `untouchable-rigid-ab.mp4` is the identical shot with the ribbons held rigid, so you can judge what the warp adds. In
  my view it's the difference between a beautiful card and a living one.

**Defects:**

1. **The canvas is too narrow.** The painting is 2:3; for 16:9 it's extended with its own paper (its low-frequency
   tone mirrored outward, plus grain matched to its two texture bands). Where her ribbons leave the painting's left
   edge, they fade into soft grey "smoke" instead of ending as brush strokes. It's visible in the wide shots (0–4 s),
   at the left edge of the figure.
2. The extension paper's fibre is slightly more uniform than the painting's at 1:1. It's invisible at the shot's
   scale (≤ 1.14× magnification).
3. The ink bloom passes through the painting's own paper too, so the paper texture changes slightly as the ink edge
   passes. It reads as wetting.

**Is the current painting enough?** For the flagship, **yes**. To make it premium:

- **Ask U1 (high value):** the same painting **outpainted/delivered at 16:9 or wider (≥ 3840 px wide)**, with the
  ribbons and hair completing their strokes inside the canvas. That removes defect 1 and the paper extension.
- **Ask U2 (high value):** the same painting as **layers**: (a) figure with costume and sword, (b) free ribbons and
  hair ends as RGBA over transparency, (c) the moon, (d) paper. With (b) separated, the ribbons can be moved properly:
  larger amplitude, real parallax against her, and none of the stretching limit.
- **Ask U3 (optional):** a second registered pose on the same canvas: **her thumb pushing the guard, an inch of blade
  showing**, nothing else changed. A masked cut (the Last Legend method) on the hands at the freeze gives one
  micro-action ("she could, and doesn't need to"). It isn't needed: her stillness is the performance.

---

## 2. High Roller: strong, clean, short

**What the shot does** (`high-roller-cinematic.mp4`, 5.2 s; `high-roller-trailer.mp4`, 1.36 s / 4 beats). She
stands on the UP side of the approved arena, on the same paved landing as Last Legend.

- **The chips:** the six chips she painted in the air are cut out as their own sprites (original pixels). They burst
  out of her open hand and decelerate into a **slow-motion hang exactly where she painted them** (the painting's frozen
  instant). Then the speed ramps back to real time and they drop out of frame, tumbling. The spin is a flip (scaleY by
  cosine) plus rotation: rigid moves of props, never the figure (`high-roller-chip-paths.jpg`).
- **Her body:** three whole-figure laugh accents (a 0.8% lift and settle about her heels) and a slow sway.
- **Camera:** low and wide, pushing in to ~1.55× on her face and the chips during the toss.
- **Type:** `HIGH_ROLL · 100 USDC ▲ UP`, `+131.56` in green with the film's one glow, lower right, clear of her.

**Verdict:** the pose already sells "a winner who wants to be seen winning", and the toss gives it a beat of
delight. It isn't subtle and doesn't need to be. **As a 2–4 beat win it's flagship-ready.** The 4-beat trailer
holds the toss, the hang and the amount. At the current X3a slot (2 beats) you'd get only the burst.

**Limits:**

1. The chips are small: ~50 painted px, ~50 screen px at the push's end. They read as chips in motion, not as a
   cascade. Making more chips would mean inventing art, so I kept to the six she painted.
2. The laugh accents are whole-figure. Her mouth can't move (no face animation), so the laugh comes from the painting
   plus the bounce.
3. The dry-brush tails of her robe (lower left) are partly translucent and come out ragged in the matte. That's fine
   at this scale.
4. A red banner in the arena backdrop sits near her head in the wide. It's busy, and the background crop could shift.

**Asks (optional):** the file at full resolution, which allows a tighter push on the laugh. A cascade of chips
painted on their own transparent layer would let the toss become a showpiece, if you want that.

---

## 3. Cold Blooded: a pose, not yet a performance

The new painting is the **end** of the gesture: mask already over the face, head bowed, eye closed. Showing the
mask *being raised* from this painting alone would mean moving his hand and warping his face, which the house rules
forbid and which would look wrong.

**Treatments tested:**

- **The cut on the gesture** (`cold-blooded-cinematic.mp4`, 6.4 s; `cold-blooded-trailer.mp4`, 2.05 s). Shot 1 is
  the approved **v2 kit card**: chin up, proud, the mask held at his chest. The loss reaches him: the DOWN side greys,
  then he does. A fast **whip-tilt upward**, the direction the mask travels, cuts on the action into shot 2, the new
  painting, framed closer, with the mask at his face. Over the following ~1.5 s he settles inward (rigid, 0.6%) and
  greys to ~60%. `cold-blooded-cut-frames.jpg` shows every frame: the card holds to f121, f122 smears upward, f123
  arrives on the new painting, and it's sharp by f125. The mask is at the same screen x before and after, low then
  high, so the gesture direction reads.
- **The new painting alone** (`cold-blooded-single-painting.mp4`, 5.4 s): start tight on the mask and hand, tilt down
  and pull out to the bowed head, the closed eye and the scar, with the grey arriving.

**Verdict:**

- **The cut works as an edit** (medium to close, cut on action). It's clean, with no ghosting, because it's a cut
  between two paintings and never a dissolve. **It doesn't read as one continuous movement.** The two paintings differ
  in angle (head up vs bowed), framing, lighting and canvas. You see a man, then the same man in a different shot
  with the mask up. The meaning lands ("he hides"), but not as a *gesture you witness*.
- **The single painting** is elegant and contained. As a still beat on a camera move it reads as composure and shame.
  It's the strongest of the two for "emotionally cold". But it's a held pose.
- Both are good enough to use. Neither is yet the "one of the most memorable emotional beats in the film" you asked
  for.

**What would make it land: one painting.**

- **Ask C1 (essential): "Cold Blooded, mask lowered".** The **same canvas, framing and body** as the new defeat
  painting, ideally an inpaint of it. Change only the right forearm, hand, mask and face: the hand lowered to chest
  height holding the mask face-out, the head bowed but the face visible, eyes open and looking down to frame-right, the
  jaw set. Everything below the collarbone and the fur collar stays pixel-identical. That gives the Last Legend method
  exactly: a registered masked cut on the forearm/mask/face region, the hand rising with a smear frame, and the mask
  arriving over the face in one continuous framing. That is the gesture.
- **Ask C2 (high value): "mask at the chin"**, the same again with the mask halfway up, covering the mouth and chin,
  eyes still open. With C1 it's a three-key gesture (lowered, chin, face) that reads as slow and deliberate, which is
  what his character needs.
- Ask for the full-resolution file too.

---

## 4. Shared findings

- **Arena integration** works for figures that matte cleanly (High Roller, Cold Blooded, Last Legend). **It doesn't
  work for ink-wash figures** like Untouchable: translucent wash on paper can't be cut out without losing the
  ribbons. She belongs on her own paper. The brand reserves paper for identity and reveals, which suits her.
- **Character camera language** that worked:
  - Untouchable: locked stillness with a slow push to the blindfold.
  - High Roller: low angle, pushing in on the laugh.
  - Cold Blooded: medium to close cut on the gesture, then a slow drift down to the closed eye.
- **The registered second painting** (Last Legend) remains the method that turns a pose into a performance. It's the
  asset to ask for wherever a gesture matters. The ask is always the same: **same canvas, same body, change only the
  region that moves.**
- Every test keeps a single painting per frame. There are no dissolves between paintings, so there is no ghosting.

## 5. Recommendation for the flagship

1. **Untouchable enters next, as the final, mythic win of the FFA close**, with the freeze and the silence. It's the
   strongest moment of the three and the clearest statement of the game's hardest-won reward. It works best given the
   last word: the six beats as rendered, or longer.
2. **High Roller** as a 2–4 beat win in X3, as she is. The pose and the toss need nothing more.
3. **Last Legend** (B-6) remains the loss beat in X2.
4. **Cold Blooded** waits for ask C1. Until then, use the single-painting treatment as a short held loss (2–3 beats)
   if you need him, or keep him to a greyed face in the wide.

**Timing note:** X2 + X3 are 4.09 s today (bars 137–138, 2-beat shots). Last Legend 6 beats, High Roller 2–4,
Lucky Fool 2 (the film's emotional peak, per the storyboard) and Untouchable 6 together need ~2 more bars. Options:
give the close one extra bar of the track's outro and let Untouchable's freeze replace X4's wide, or keep High Roller
to 2 beats. That's a music decision for you.

## 6. QC, candidly

- **How it was checked:** I can't play video at speed. I inspected contact sheets for every cut (0.05–0.2 s), every
  frame through the Cold Blooded cut, a locked-camera temporal-deviation map for the ribbons, a locked-camera chip-path
  composite, and 1:1 crops of mattes, seams and type.
- **Untouchable** (§1 defects): the ribbon "smoke" at the old canvas edge; the bloom slightly changing the paper
  texture as it passes.
- **High Roller:** chips small; ragged robe tails; a busy red banner near her head in the wide.
- **Cold Blooded:**
  - The v2 card's house matte is BiRefNet at card resolution, with slight stair-stepping on the fur at the
    card-painting edge. It sits off-frame in this framing.
  - The two paintings' colour and lighting differ across the cut. The grey grade evens this out.
  - The trailer's grey type needed a paper scrim to read over the greyed terraces.
- **Type:** inside title-safe, every key amount ≥ 48 px cap (the green amounts ~72 px, the grey loss amount ~50 px), never over a face. Kanji: 敗 only (allowed).
- **Sound:** a placeholder and unauditioned. Excerpts sit on the flagship's bar grid (137 loss, 138 win); SFX are
  synthesised.

## 7. Study frames (for `tools/sheets.py`)

```bash
cd remotion
# Untouchable, camera locked, frames 156-216 (every 2nd); High Roller, camera locked, frames 18-230 (every 4th)
COMP=Untouchable-Cinematic node tools/frames.mjs /tmp/study '[{"name":"un-fixed","props":{"cut":<UN_CINEMATIC with cams [{t:0,c:[960,540,1]}]>,"type":false}}]' $(seq 156 2 216)
COMP=HighRoller-Cinematic  node tools/frames.mjs /tmp/study '[{"name":"hr-fixed","props":{"cut":<HR_CINEMATIC with cams [{t:0,c:[860,420,1.25]}]>,"type":false}}]' $(seq 18 4 230)
cd .. && python3 tools/sheets.py /tmp/study
```
