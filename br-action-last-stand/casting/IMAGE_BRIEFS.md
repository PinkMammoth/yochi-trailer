# THE LAST STAND v2: image-generation briefs

Two new poses (N1, N2) and one delivery request (D1). **Nothing here has been generated.** Each is the minimum the
storyboard needs (`README.md` section 6 says why each can't be done by editing). Generate them from the original
character sessions, approve them, and they drop into the pipeline with no code change.

## Common requirements (all three)

- **Reference:** the canonical kit card named in each brief, attached as the style and identity reference. Same
  painter's hand: ink linework with dry-brush texture, washed colour, warm paper grain, the same line weight and
  value structure as the card. Plus the supplied Duel Master attack pose for N1 and N2, so the pair match each other.
- **Canvas:** portrait 3:4, **2304×3072 or larger** (1.5× the kit card; 1536×2048 is the minimum). That keeps a
  chest-up crop sharp at 1080p.
- **Background:** flat, uniform warm paper (close to `#efe7d8`), light grain only. **No ink disc, no splatter, no
  speed lines, no slash, no card frame, no corner crests, no text, no kanji, no logo.** The ground, ink and stroke
  are added in animation; a flat ground gives a clean matte. A transparent PNG is better still, if the generator can
  give one.
- **Edges:** the figure is fully separated from the background with clean, unblurred edges. Only the body may leave the
  canvas, at the bottom edge. Hair, fingers and loose cloth ends stay inside, with ≥4% margin.
- **Consistency:** the face must be the card's face (proportions, scars, hair, eye shape), so the cut from the card
  to the new pose doesn't jump. Don't add blood, wounds or damage beyond what the card already shows.
- **Deliver** the image and, if possible, 2–3 seeds of the same prompt, so we can pick the best match side by side
  with the card.

---

## N1 · Rampage: disbelief (S5, the close)

- **Canonical source:** `asset-pack/sumi/avatars/cards/rampage.webp`.
- **Intended use:** S5, held for one silent beat (0.34 s) at the moment the candle closes against him, straight after
  the shot of his canonical grin. In the full trailer it's also his reaction to any lost round.
- **Pose and action:** the instant the confidence drops. Keep **the same body and camera as the card** (the bandaged
  right fist still forward and low toward frame-left, shoulders squared), so the cut reads as the same moment with the
  grin wiped off. The punch has stalled: the forearm has dropped a few degrees, the fist slightly loosened. The chin
  pulls back and in. The upper body has moved back an inch, a recoil of surprise, not a fall.
- **Facial expression:** disbelief, not fear. Eyes wide open and out of the card's shadow, so the whites show and the
  pupils are small. Brows raised and pinched together. Mouth open, jaw dropped, lips off the teeth: **the grin is gone**.
  The same blood smears and nicks as the card. No sweat drops or cartoon marks.
- **Direction:** he looks toward frame-right (toward her and the candle). No movement direction: a frozen moment.
- **Camera and framing:** low angle, matching the card. Chest-up, head in the upper third and left of centre, shoulders
  filling the lower frame.
- **Essential details (must match the card):** short spiky dark hair; heavy brow ridge; broad jaw and thick neck; the
  open, ragged charcoal-black jacket hanging off a bare, heavily muscled chest; white bandage wraps on both forearms
  with the bare, bloodied knuckles; the rust-orange sash at the waist with its trailing ends; tan skin.
- **Negative space:** keep the right 35% of the canvas clear of the face and hands. The revealed picks sit there, and
  type must not cross a face.
- **Layers:** the figure (one layer). No props.

## N2 · Rampage: the hit (S7–S8, the impact and knockback)

- **Canonical source:** `asset-pack/sumi/avatars/cards/rampage.webp`. Match the supplied Duel Master attack pose for
  scale and energy.
- **Intended use:** S7, the hit-stop frame (0.12 s, full frame, with our vermilion stroke across his chest), then S8,
  the same image hurled back into depth, greying and breaking into ink over ~1.6 s. It's the single most important new
  image: the pose has to read as *taking a blow* at a glance and at phone size.
- **Pose and action:** the instant after a diagonal cut lands across his chest from frame-right (upper right toward
  lower left). His whole body is thrown backward and toward frame-left, off balance:
  - the head snaps back and turns away toward frame-left, chin up;
  - the spine arches back and the chest opens to the blow;
  - the right (punching) arm is flung back and out to frame-left, and the bandaged fist has burst open, fingers splayed;
  - the left arm comes up across the body a fraction too late, elbow high;
  - the weight is gone from the front foot (legs not shown);
  - the sash ends and jacket tails whip toward frame-right (they lag behind the body).
- **Facial expression:** pain and shock, raw, not composed. Eyes squeezed shut or one wide; teeth bared and clenched, or
  the mouth open in a roar; the brow crushed down. He's a brawler: let the face be ugly.
- **Direction of movement:** toward frame-left and away from camera (being knocked back into depth).
- **Camera and framing:** waist-up. The camera is low and slightly to frame-right (the striker's viewpoint). The figure
  sits centre-left, tilted about 10–15° counter-clockwise by the blow, with clear space above the head.
- **Essential details:** as in N1 (hair, brow, jaw, the torn charcoal jacket over the bare chest, the bandaged forearms,
  the bloodied knuckles, the rust-orange sash). **Do not paint the cut, a wound, fresh blood or any slash mark**: the
  stroke is ours, and the hit stays graphic, not gory.
- **Negative space:** 25% clear on frame-left (where he travels) and the upper-right quadrant clear of hands (the
  stroke enters there).
- **Layers:** the figure (one layer). If the generator can, also a version with the sash and jacket-tail ends on a
  separate layer (it improves the gust); otherwise we paint a flow mask.

## D1 · Duel Master attack pose: delivery request (S6, the strike)

- **Source:** the supplied image (`supplied/duel-master-attack-exp1.webp`, 1086×1448), approved as is. **Same pose, same
  composition. Don't change anything about her.**
- **Request:**
  - (a) the same image at **≥2304×3072** (re-rendered or upscaled in the original session, not a generic upscaler);
  - (b) the background as flat uniform paper, as above. It nearly is already;
  - (c) if possible, the ponytail, red ribbons and cloak tails on a separate layer (for the gust), and the short blade
    on its own layer (for a glint travelling along it).
- **Intended use:** S6 (0.27 s): a whole-figure slide toward frame-left with a camera slam and focus lines; her face
  stays in frame in every crop.

---

## If Last Legend replaces Rampage (backup)

The same two shots, adapted. Canonical source: `asset-pack/sumi/avatars/cards/last-legend.webp`.

- **N1-LL, disbelief:** keep the card's body (the hand resting on the planted great sword). The grin collapses, the
  eyes open wide toward frame-right, and the grip on the hilt tightens. The battered black-and-gold armour,
  dark-crimson robe, grey hair and beard and the scars all stay as painted.
- **N2-LL, the hit:** thrown backward to frame-left, head snapped back. The great sword is wrenched out of his grip,
  painted whole so it can tumble as a separate object (deliver it as its own layer). One shoulder plate flying (also its
  own layer). Teeth bared in pain.
