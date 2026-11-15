# 2.5D animation feasibility: the painted cast

Audit of 15 Nov 2026. Evidence: `contact-sheets/02-cast-cutouts.jpg` (every figure and plate),
`contact-sheets/07-matte-problems.jpg` (close-ups of the weak mattes), and the shipped motion in the locked first ad
(`usdc-review/reference-first-ad-final-contact.jpg`).

## What exists already

The cast was already separated for 2.5D by THE CAST (`claude/gracious-bell-72as9d`), and the flagship / first ad
reused it. Nobody needs to re-run the model:

| layer | file (on `claude/yochi-first-ad-order-a`) | what it is |
|---|---|---|
| card | `film-flagship/assets/cast/<id>-card.webp` (768×1024) | the framed card, half size |
| figure | `film-flagship/assets/cast/<id>-fig.webp` (~1353×1807, alpha) | BiRefNet cut-out of the figure, cleaned (frame cleared, islands dropped) |
| plate | `film-flagship/assets/cast/<id>-plate.webp` (1044×1371) | the painting's own ink-disc ground, the figure filled by push-pull, feathered onto paper |
| metadata | `film-flagship/assets/cast/cast.json` | per id: painting size, figure rect, **head point**, ink colour, plate scale |
| raw mattes | `film-flagship/assets/cast/raw/<id>.png` | the model output, so `cast_prep.py` can be re-run without the model |
| app framing | `film-flagship/assets/avatars/crops.json` | the app's square crop window per portrait (from `avatar-roster.ts`) |
| code | `film-flagship/src/lib/cast.js` | `drawFig`, `drawPlate`, `drawCard`, `drawFace`, grey / greyPaper / silhouette variants |
| tools | `film-flagship/tools/cast_mask.py`, `cast_mask_fix.py`, `cast_prep.py`, `cast_sheet.py` | the pipeline |

**No painting has real layers.** The sources are flat 1536×2048 WEBP cards. The only alpha in the kit is the
transparent corners outside each card's frame (~8%). The portraits (512×683) are opaque and too soft for anything
larger than a small slot.

**Every painting is cropped by its frame** (waist-up or three-quarter length). There is no full-body figure and no
painted legs to choreograph, so full-body fighting is impossible without inventing anatomy.

## Method ladder (least destructive first)

Use the lowest rung that gets the shot. Each rung up adds risk to the painting.

| rung | method | touches the painting? | status |
|---|---|---|---|
| 0 | **Card as object**: deal, flip, slam, stamp, grey for a loss, ink silhouette for a locked reward | no | proven (THE CAST, first ad) |
| 1 | **Camera on a flat painting**: push-in, whip pan, punch-in on a hit, hard cut, impact shake ≤6 px | no | proven |
| 2 | **Two-layer parallax**: figure over its own plate, plate drifting 0.5–1.5% of frame width against the figure | the matte only | proven |
| 3 | **Our layers around the painting**: paper/sumi ground, ink flood, brush stroke, splatter, seals, type, the versus band in front and behind | no | proven |
| 4 | **Whole-figure transforms**: the figure layer scales (≤1.5% breathing, anchored at the frame edge), rotates ≤2°, slides, flies off frame with motion blur | the matte only | proven (standoff, the duel band) |
| 5 | **Localised mesh warp** around the head point (≤3 px at 1080p) for a nod or a breath | warps pixels | **not yet tested**: experiment per character, off by default |
| 6 | Cutting heads, arms or weapons into separate layers | needs inpainting of what's behind | **don't**: see below |
| 7 | Skeletal rig / limb animation / face animation | repaints the art | **forbidden** (kit README; THE CAST brief: "Do not try to animate faces or limbs") |

Why rung 6 is out: every painting has dense ink linework where arms cross the torso (Strategist's hand at her chin,
Degenerate's hand behind his neck, Perma-Bull's fist beside his face, Bagholder's arms round the sack). Lifting a
limb leaves a hole that would have to be painted, which is repainting, and any rotation shows the seam in the
linework. The September film's rigs (`asset-pack/characters/*-rig`, `film/assets/rig/`) prove the point: they're
the retired brand and they read as puppets.

**Lighting:** the brand's approved grade on a figure is the step to grey for a loss, and nothing else ("They are
never repainted or recoloured; the only grade is the step to grey for a loss", THE CAST README). Do lighting in the
world, not on the face: vignette, a shadow under the figure, the paper/sumi ground's value, ink floods, the
white-paper impact frame. Colour casts or rim light on the painted figure need your sign-off (see OPEN_DECISIONS).

## Resolution budget

The figure cut-outs are about 1807 px tall. On a 1080-high frame:

- Waist-up to full figure (the painting at ≤1.0× its pixels): sharp.
- Chest-up (~1.7×): acceptable, as used in the first ad's thumbnail and duel.
- Face ECU (~2.5–3×): soft. Use it only for a few frames under motion, push-in blur or grain (impact frames), or
  go back to the 1536×2048 card source, which is only slightly larger.

## Per character

Matte fill is the share of the figure layer that isn't transparent. 70–85% is a clean figure on a painted ground.
Above ~88% the matte usually took in the ground too, and the plate is left nearly flat.

| character | matte | parallax (rung 2) | head isolable? | arm / weapon / prop isolable? | subtle movement | recommended | best use |
|---|---|---|---|---|---|---|---|
| **Perma-Bull** (v2) | clean, 81% | yes | no: raised fist beside the head | no: the fist overlaps hair and face | breathing scale, warp test | 2 + 4; punch-in on the fist (1) | **YOU** in every approved film; the HYPE side |
| **Doomer** | clean, 80% | yes; the coffee steam sits in the plate and drifts nicely | almost: cup near the face | no | breathing | 2 + 4 | rival, opening / thumbnail |
| **Night Shift** | clean, 79% | yes | yes, clear of hands; warp only | can is foreground but painted into the figure | breathing | 2 | starter beats |
| **Lucky Fool** | clean, 77%; coins split between plate and figure | yes, and the split coins give free depth | no: hair ornaments | no | breathing | 2; add ink splatter, never painted coins | windfall / FFA win |
| **Strategist** | clean, 76% | yes | no: pen at the chin | no | breathing | 2 | the planner |
| **Degenerate** | clean, 81% | yes | no: hand behind the neck | no | breathing | 2 | max size |
| **Bagholder** | clean, 80% | yes | partly | no: arms round the sack | breathing | 2 | loss / hold |
| **FOMO** | clean, 75% | yes | partly | no | slide along her lunge diagonal | 2 + 4 | whip pans, chasing |
| **Paper Hands** | clean, 75% | yes | yes, clear of the hands | the slip is held at the chest, painted in | tremble ≤1 px (whole figure) | 2 + 4 | panic, the one who folds; candidate for **USDC** |
| **Contrarian** | **defect**: her DOWN sign was matted into the plate, so her hand is empty in the cut-out | **not until re-matted** | yes | the sign could become its own layer if re-matted | n/a | 0 / 1 (flat card) until fixed | DOWN pick, "everyone's wrong" |
| **Untouchable** | clean, 72% | yes, a strong misty-landscape plate | partly: the blindfold tails | no | robe flow by plate drift only | 2 | the first unlock |
| **Hundred Trials** | clean, 74% | yes | no | no | breathing | 2 | veteran |
| **Insider** | figure carries a purple ground halo, 93% | weak: the plate is near-flat | no | no | none | 1 | small slots, rewards grid |
| **Whale** | **matte took the whole painting**, 98% | no | no | no | none | 0 / 1 | rewards grid, card reveal |
| **High Roller** | clean, 78% | yes | no: the chip hand is by her face | no | breathing | 2 | |
| **Cold Blooded** (v2) | clean, 80% | yes | partly: mask in hand by the face | no | breathing | 2 | legendary unlock (first ad) |
| **Deadeye** | 62%; small crossbow fragments left in the plate | yes at distance; check at full size | yes | no | breathing | 2 (verify the crossbow edge first) | |
| **In the Green** | 86% | yes, mildly | no | no | breathing | 2 | |
| **Took the Pool** | 88%, some ground in the figure | weak | no | no | none | 1 / 2 | big win |
| **Rampage** | figure includes most of the ground, 91% | weak | no | no: the fist *is* the composition | none needed | **1: punch-in on the fist** | **impact frames**: the fist already comes at the camera |
| **Duel Master** | clean, 81%; red brush slashes stay in the plate | yes, strong | no | blade painted in | breathing | 2 + 4 | duels (first ad's reward) |
| **Ronin** | clean, 71% | yes | yes | sword in the figure | breathing | 2 | duels |
| **Grudge Settled** | red brush ground kept inside the figure, 87% | partly | no | no | none | 1 / 2. Note 遊 on her charms (kanji review) | nemesis |
| **Last Legend** | clean, 81% | yes | no | no | breathing | 2 | BR |
| **Final Three** | clean, 78% | yes | partly | no | breathing | 2 | BR survival |
| **Bloodsport** | clean, 71% | yes | no | no | breathing | 2 | BR |
| **Lab Rat** | **matte failed**, 27% | no | no | no | none | 0 only (grid slot, round face crop) | never at size |
| **Bug Hunter** | fixed by `cast_mask_fix.py`, 89% | yes | no | lantern painted in | breathing | 2 | |

## Recommended reusable approach

1. **Default rig = card + figure + plate + our own layers.** Rungs 0–4 only. This is exactly how the approved
   films were made, so it's proven at 1080p.
2. **Motion comes from the camera and the world**, not the body: push-ins, whip pans, punch-ins on contact,
   hit-stop, ink floods, slashes and stamps. A fighting-game feel comes from timing and impact frames, not
   choreography.
3. **Impact frames** replace full-body hits: hard-cut to a chest-up or fist-in-frame crop, scale punch
   (~1.0 → 1.08 over 2 frames), hit-stop 0.1–0.15 s, the impact shake (≤6 px, 0.38 s) on the ground, splatter in
   ink. The painting itself is never warped.
4. **Losers go grey** using the existing `grey` / `greyPaper` variants plus the grey 敗 seal. They never go red.
5. **Rung 5 (warp) is an experiment.** If you want it, build it as a WebGL displacement keyed on `cast.json`'s head
   point, test it on two clean mattes (Night Shift, Paper Hands), and review the stills before any film uses it.
6. **Fix before use:** re-matte Contrarian (the sign) and Lab Rat, and give Whale and Insider a proper figure matte,
   or keep those four as flat cards. Use `cast_mask_fix.py`'s two-model approach, cropped to the painting.
