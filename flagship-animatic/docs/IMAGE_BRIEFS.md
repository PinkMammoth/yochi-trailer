# Flagship: image-generation briefs

**Nothing here has been generated.** These are the new illustrations the film needs, in priority order, written to
the standard of THE LAST STAND's approved N1/N2 briefs (`claude/br-action-last-stand:br-action-last-stand/casting/IMAGE_BRIEFS.md`).
Generate them from the original character sessions, approve them, and they drop into `assets/` with no code change.

Every brief here is also an **"ask before inventing"** item under the style guide (section 7.8): B01 and B02 are the
first environment paintings in the Sumi kit, so they need your go-ahead as a category, not only as images.

| id | what | for | priority |
|---|---|---|---|
| **B01** | Duel Master, full-figure wide plate (the bridge) | both options, S14 | **NEW — ESSENTIAL** |
| **B02** | The world: layered environment plates | both options, S13–S14 | **NEW — ESSENTIAL** |
| **B04** | The two-sided crowd plate | FFA, S15–S22 | NEW — HIGH IMPACT |
| B05 | Duel Master, the look back (the final breath) | FFA, S22 | OPTIONAL |
| D1 | Rampage card re-matte (a prep task, not art) | both, S15/S19d | HIGH IMPACT (prep) |
| B06a/b | Last Legend hit, Cold Blooded hit | BR only, S16–S18 | NEW — ESSENTIAL (BR) |
| B07 | Bloodsport defeat | BR only, S20b | NEW — ESSENTIAL (BR) |
| B09 | Bloodsport, final-two stance facing frame-left | BR only, S19 | NEW — HIGH IMPACT (BR) |
| B08 | Duel Master, BR win pose | BR only, S21b | OPTIONAL |

The recommended film (FFA) needs **two essential images and one high-impact image**. The BR alternative needs those
two plus four or five more.

## Common requirements (all briefs)

- **Reference:** the canonical kit card named in each brief, as the style and identity reference, plus the approved
  pose it must match (named per brief). Same painter's hand: ink linework with dry-brush texture, washed colour,
  warm paper grain, the same line weight and value structure as the card.
- **No invention:** the costume, face, hair, proportions, weapon and palette are the card's. Don't add armour, wounds,
  blood, jewellery or props the card doesn't show. Don't change colours.
- **No text, kanji, logo, card frame, corner crest, seal, slash, speed lines or splatter** in any image. All type,
  seals, strokes and ink effects are added in animation (they carry brand meaning: vermilion means *your win*).
- **Vermilion restraint:** only where the character's costume already has red (Duel Master's ribbons, collar and
  cloak). Environments carry **no vermilion at all**.
- **Edges:** figures fully separated from the ground, clean and unblurred. Hair, fingers and loose cloth ends stay
  inside the canvas with ≥4% margin unless the brief says otherwise.
- **Deliver** 2–3 seeds of the same prompt and, where asked, layers as separate transparent PNGs.

---

## B01 · Duel Master: full-figure wide plate (the bridge) · NEW — ESSENTIAL

- **Canonical sources:** `asset-pack/sumi/avatars/cards/duel-master.webp` (identity) and the **approved victory pose**,
  `claude/br-action-last-stand:br-action-last-stand/duels/assets/poses/duel-master-victory.webp` (this film's copy:
  `assets/poses/duel-master-victory.webp`). Attach both.
- **Why it can't be done with existing art:** the victory pose is cropped mid-thigh at the bottom edge and through
  the cloak and ribbons at the left edge. The pullback prototype hides both crop lines with tracked ink mist down to
  ~0.5× scale. Past that, a retreating camera has to show her legs, her feet and the ground she stands on, and no
  amount of mist makes a figure without feet read as standing in a world. See `FEASIBILITY.md` §2.
- **Intended use:** S14 (20.1–22.8 s). Under a paper-mist sweep at bar 78, the shot hands over from the matted
  victory pose (at 0.49× scale) to this plate, at exactly the same screen position and size, and the camera keeps
  retreating until she is ~10% of frame height, standing on her ledge in the wider world (B02).
- **Pose and action:** **exactly the victory pose**, continued downward. Same head angle, same eyeline (down and to
  frame-right, composed), same lowered short blade in her right hand (point down, toward frame-left), same left hand
  resting by the sheathed sword at her hip, same wind-blown ponytail, ribbons and cloak tails streaming to frame-left.
  Now completed: both legs, the thigh-high black wraps and the white bandages as on the card, the boots, the feet
  planted shoulder-width on rock, weight slightly on the back foot. Still, centred, unhurried. **Nothing about her
  upper body may differ from the victory pose**, because the match at 0.49× must be invisible.
- **Facial expression:** as the victory pose: utterly composed, lids slightly lowered, mouth closed, no smile.
- **Direction:** a static figure; wind from frame-right to frame-left (the same as the victory pose).
- **Camera and framing:** the same slightly low camera as the victory pose, but further back. **Landscape 16:9.**
  The figure stands centred horizontally, head at about 30% from the top, feet at about 82%, so her full height is
  ~52% of frame. Below her feet: the top of a weathered stone ledge, its front edge crossing the frame at ~88%, falling
  away into mist. Above and around her: open paper mist (empty, for B02 to sit behind).
- **Canvas:** **5120×2880 or larger.** At the hand-over she occupies the same pixels as the victory pose at 0.49×, so
  her upper body must hold at least the victory pose's detail at that size.
- **Essential details (match the card):** long black ponytail with the red ribbons tied high; the black high-collared
  top with the red inner collar; the white chest wrap; bare shoulders; the black-and-red cloak with the white diamond
  mon on the sleeve; the red-corded belt with the hanging diamond tag; the katana in its black scabbard at her left hip;
  fingerless gloves; bandaged thighs; thigh-high black wraps. The red face markings under the eyes.
- **Layers:** (1) the figure, with alpha; (2) the ledge and the rock under her feet; (3) the mist behind (optional).
  Delivered as one composed image plus the layers.
- **Negative space:** keep frame-right of the figure clear between 20% and 60% height (the world reveal and, later,
  type may sit there).

## B02 · The world: layered environment plates · NEW — ESSENTIAL

- **References:** the paper and ink grammar of the kit cards (their washed ink discs and paper grain), and the first
  ad's paper ground. **Style:** a sumi-e landscape painted in the cast's hand: ink washes on warm paper, dry-brush
  ridge lines, value only (warm black to paper), **no colour except the paper's warmth**. Not photographic, not 3D,
  not a fantasy matte painting.
- **Why it's needed:** the reveal is the discovery of a physical world. The prototype's procedural ridges prove the
  depth logic, but they read as diagrams. A painted world is what makes it a film.
- **Intended use:** S13–S14. The camera retreats through these planes (every plane moves at its own rate: that is the
  parallax). The world is where the duel happened: a high place, with other confrontations visible below and beyond,
  and a vast plain at the bottom where the field gathers (it becomes the FFA field, or the BR table, after the ink flood).
- **The world, described:** dawn over a range of steep ink mountains, layered into mist. Her ledge is a promontory
  near the top. Below and beyond it: smaller outcrops and plateaus, on several of which **pairs of tiny figures face
  each other** (ink silhouettes, no faces, no costume detail, just two postures squaring up), so the viewer realises
  the duel was one of many. Furthest and lowest: a broad plain receding into mist, dotted with hundreds of tiny ink
  figures in two loose masses facing each other across an empty strip.
- **Layers (each its own transparent PNG, 7680×3240 or larger, i.e. wider and taller than the frame so it can scale
  down without its edges showing):**
  1. **Sky / paper**: warm paper, a soft ink gradient at the top. No figures.
  2. **Far range** (depth ~30): faint mountain silhouettes, 10–15% ink.
  3. **The plain** (depth ~10–14): the receding plain with the two masses of tiny figures; an empty strip between them.
  4. **Mid plateaus** (depth ~6): 3–5 outcrops, each with a pair of facing silhouettes, 30% ink.
  5. **Near ridge** (depth ~2.3): darker ridge flanks either side of frame, where 3–4 larger silhouettes of
     competitors stand watching (postures only; we composite our own cast silhouettes if you prefer).
  6. **Foreground mist** (depth ~0.5): drifting ink-wash mist, mostly transparent, denser at the bottom.
- **Composition rule:** the plates must stack with her ledge (B01) at the horizontal centre; the plain's empty strip
  should line up with frame centre (it becomes the strike line in FFA).
- **No** torii, temples, castles, cherry blossom, gongs, rising sun, banners, flags, crowds of invented costumed
  characters, or anything legible (SHARED-RULES cliché list). No vermilion.

## B04 · The two-sided crowd plate (FFA) · NEW — HIGH IMPACT

- **References:** the kit cards for the painter's hand; B02's plain for the setting.
- **Why:** the field is currently built from ink silhouettes of the house cut-outs. It works and reads, but it shows
  rectangular matte edges on some figures and repeats the same 20 silhouettes. A painted crowd makes "hundreds of
  players" believable without inventing any character.
- **Intended use:** S15–S22, behind the named entrants: the UP mass on frame-left, the DOWN mass on frame-right, an
  empty strip down the centre where the candle stands.
- **Content:** two loose masses of players seen from slightly above, **as ink silhouettes only** (no faces, no
  costumes, no colour), in three receding rows each side, facing the centre. Varied postures (arms folded, leaning,
  pointing, crouched). Nobody recognisable as a particular cast member and nobody invented in detail: the silhouettes
  are anonymous players.
- **Canvas and layers:** 3840×2160; each side's three rows as separate transparent PNGs (6 layers), so rows can be
  lit or greyed independently (the winning side lifts, the losing side greys).

## B05 · Duel Master: the look back · OPTIONAL

- **Canonical sources:** the kit card and the approved victory pose.
- **Intended use:** S22, the breath before the end card: the one close-up after the FFA close, of the hero in the
  winning field, so the film ends on her and not on the UI.
- **Pose:** from behind and slightly to her right, three-quarter back view, waist-up: she glances back over her right
  shoulder toward camera, the short blade now sheathed, ponytail and ribbons lifting on the same frame-right-to-left
  wind. **Expression:** the faintest acknowledgement, the corner of the mouth, no grin.
- **Framing:** landscape 16:9, figure on the left third; frame-right open (the field's light, type). 3840×2160+.

## D1 · Rampage: re-matte of the kit card (a prep task)

- **What:** a clean figure matte of `asset-pack/sumi/avatars/cards/rampage.webp`. The house matte failed (it took his
  ground, see `docs/asset-audit/ANIMATION_FEASIBILITY.md`), so his cut-out carries a rectangle of painted ground.
- **Where it shows:** S15 (his FFA entry slam) and the crowd silhouettes. Not new art; the original painting stays
  untouched.

---

## Battle Royale option only

### B06a / B06b · Last Legend hit, Cold Blooded hit · NEW — ESSENTIAL (BR)

- **Canonical sources:** `asset-pack/sumi/avatars/cards/last-legend.webp`; `asset-pack/sumi/avatars/cards/cold-blooded-v2.webp`
  (the v2 man, not the retired v1). Match the energy and scale of the approved `rampage-hit.webp`.
- **Intended use:** the BR knock-outs (rounds 2 and 3): a 0.3–0.5 s impact frame each, as THE LAST STAND's hit, then
  the grey tile. **Only on the round that takes their last life**, never on a life lost.
- **Last Legend:** thrown backward to frame-left, head snapped back, the great sword wrenched from his grip and painted
  whole so it can tumble as a separate layer; one shoulder plate flying (own layer). Teeth bared. Same battered
  black-and-gold armour, dark crimson robe, grey hair and beard, scars.
- **Cold Blooded:** a colder fall: knocked half-turned toward frame-left, the white mask flung from his hand (own
  layer), the fur collar whipped up, eyes closed, mouth tight, no scream. Same long dark hair, fur-collared cloak,
  sword.
- **Framing:** portrait 3:4, 2304×3072+, flat paper ground, waist-up, 25% clear on frame-left. No cut, wound or slash
  painted.

### B07 · Bloodsport defeat · NEW — ESSENTIAL (BR)

- **Canonical source:** `asset-pack/sumi/avatars/cards/bloodsport.webp`.
- **Intended use:** S20b, the final close: the last opponent knocked out.
- **Pose:** the beckoning hand from the card now flung back; the grin broken into a snarl of disbelief; her body
  thrown backward toward frame-right (she stands on the right of the final two). Same short red hair, studded leather
  harness and pauldron, wraps. No wounds. Portrait 3:4, 2304×3072+, flat paper ground, 25% clear on frame-right.

### B09 · Bloodsport: final-two stance, facing frame-left · NEW — HIGH IMPACT (BR)

- **Why:** her card faces and reaches toward frame-right. On the right of a face-off she'd be turned away from her
  opponent, and mirroring a painting isn't an allowed operation (it changes the costume's asymmetry).
- **Pose:** the card's beckoning gesture, toward frame-left, weight forward, the grin. Portrait 3:4, 2304×3072+.

### B08 · Duel Master: BR win pose · OPTIONAL (BR)

- The BR ending currently reuses the duel's victory pose. A different image (seated on the edge of the table, the
  blade across her knees, looking down at the camera) would stop the two wins reading as the same shot.
