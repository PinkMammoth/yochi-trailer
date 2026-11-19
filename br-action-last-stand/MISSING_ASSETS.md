# THE LAST STAND: missing-asset specifications (not generated)

Kept apart from the proof of concept on purpose. **Nothing here has been made.** These are the targeted pose
variants that would lift the two beats the existing art can't carry (see `FEASIBILITY.md` section 3, beats 7 and 9).
Review them against the PoC first: the point is to find out whether two or three poses make a material
difference, not to commission art on speculation.

All variants must be **the same character, costume and painting style** as the canonical card (same painter's
hand, same ink-and-wash texture, same palette, same ink-disc ground language), commissioned or produced under the
owner's control and approved before use. They're new *poses* of existing characters, not new characters, and they
don't replace the canonical cards.

**Common delivery spec (all variants)**

- Canvas 3072×4096 (2× the kit card), or at least 1536×2048, so chest-up and face crops stay sharp at 1080p.
  Unframed: no card border, no corner crests.
- Layers as separate transparent PNGs (straight alpha, 16-bit if possible), registered to the same canvas:
  1. `fig`: the character with clean anti-aliased edges and no ground halo. Hair and cloth ends painted to the edge,
     not cut by the frame.
  2. `ground`: the ink-disc ground painted **complete behind the figure** (no hole to fill), extended 10% beyond
     the canvas on every side for parallax and shake.
  3. `flow`: a greyscale mask of the free ends (hair tips, ribbons, tassels, cloak hem) that may take a brief gust.
  4. any separate prop named below, painted whole (including the part the hand hides) so it can leave the hand.
- A head point and an anchor point (where the body leaves the frame), as for `yochi-2p5d/characters/<id>/character.json`.
- No text, no kanji, no logos in the painting.

---

## 1. Duel Master: the draw (ESSENTIAL)

**Replaces:** beat 7 (5.45–5.62 s), the anticipation slam, and supplies the strike itself.

- **Pose:** the follow-through of a one-stroke draw (iai). The katana is fully out, swept from her left hip up
  across her body to high on the right of frame. The blade is a long diagonal from lower left to upper right,
  edge leading. Her right arm is extended along the blade and her left hand is still at the scabbard mouth. The
  torso has twisted three-quarters toward frame-left, the shoulders follow the cut, and the weight is forward.
- **Framing:** waist-up, low camera (the card's own worm's-eye angle), the blade breaking the top-right corner.
  The face sits in the upper third, left of centre, so the strike reads right-to-left across a 16:9 frame.
- **Expression:** fierce focus. Eyes narrowed and locked frame-left past the camera, brows down, lips pressed or
  bared slightly at one corner. Not a scream.
- **Costume and weapon (must match the card):** black high-collared sleeveless top; red-lined black jacket slipping
  off the shoulders, with the white diamond-and-dot crest on the sleeve; white bandage wraps on the upper arm and
  forearm; white chest wrap; black belt with its buckle; red ribbon in the long black ponytail; red tassels and
  cords; white tag earrings; the red mark under her eye; the katana's black-and-red cord-wrapped hilt and round guard;
  the white tag hanging at the hip.
- **Motion cues painted in:** the ponytail, ribbons and jacket hem trail opposite to the cut (toward lower left).
  **No** painted speed lines or slash on the art: the vermilion slash is ours and is drawn in code.
- **Layers:** `fig` (with the blade), `ground` (her red brush-slash disc, complete), `flow` (ponytail, ribbons,
  tassels, jacket hem), and optionally `blade` as a separate layer so a gleam can travel along it.

## 2. Cold Blooded (v2): the hit (ESSENTIAL)

**Replaces:** beat 9 (5.75–7.32 s), the knockback. It's the single biggest gain: the current card is a proud,
still pose, so thrown back it reads as a cut-out, not a body taking a blow.

- **Pose:** the instant after a blow from frame-right. The head snaps back and to his right (frame-left), chin up
  and away. The upper body arches backwards and twists away from the hit. The right arm is flung out and back and
  the hand has opened: **the white mask is leaving his fingers**. The left arm comes up across the body too late.
- **Framing:** chest-up, camera slightly low and to frame-right (from the striker's side), with room on frame-left
  for him to travel into.
- **Expression:** shock and pain, eyes squeezed or one wide, teeth gritted. The cheek scar stays visible.
- **Costume (must match the v2 card):** long dark hair in a topknot with the silver hairpin and teal tassel,
  strands flung forward by the recoil; the white fur collar flaring; the black cloak with the teal-and-white bamboo
  and wave pattern billowing; the teal knotted cord with the snowflake medallion and teal tassels swinging; the
  silver ring.
- **Layers:** `fig` (without the mask), **`mask` as its own object** (the white mask with its teal markings, painted
  whole, front and a three-quarter turn if possible, so it can tumble away as a whole object), `ground`
  (his pale teal moon disc, complete), `flow` (hair, tassels, fur tips, cloak hem).

## 3. Cold Blooded (v2): down (OPTIONAL)

**Improves:** beat 10 (7.32–8.00 s), the 敗 hold, and every elimination in a full trailer.

- **Pose:** on one knee, head bowed so the hair hides most of the face, one hand on the ground, the mask face-down
  on the ground beside him (separate layer).
- **Framing:** three-quarter length, high camera looking down (the inverse of the card's low angle).
- **Expression:** mostly hidden; a sliver of the jaw, mouth set.
- **Layers:** `fig`, `mask`, `ground`. It will mostly be seen in the house grey grade, so the value structure must
  hold up in greyscale.

## Optional improvements (no new poses)

| item | why | effort |
|---|---|---|
| 2× resolution renders of the two existing cards (same paintings, more pixels) | the eye-strip ECUs in beat 2 are soft at ~2.7× | low, if the source files exist at a higher resolution |
| Rampage re-matte (figure separated from the ground) | lets his fist insert get parallax instead of camera-only | prep task on `yochi-2p5d` |
| Flow mask for Cold Blooded v2 (hair, tassels, fur tips) | a gust on the free ends at the hit, as Duel Master already has | prep task on `yochi-2p5d` |
| Clean ground plates with no inpainting (extend each disc past the frame) | allows bigger parallax and shake without showing filled areas | medium |

## What is not needed

Full-body figures, rigs, turnarounds, mouth or eye shapes, a fighting arena, environment paintings or invented
characters. The brand grammar (cuts, panels, ink, seals) carries the trailer. The poses only have to supply the
two moments where a body has to be seen in action.
