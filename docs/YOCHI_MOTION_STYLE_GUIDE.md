# Yochi motion style guide

The working reference for every Yochi film, short, card or trailer rendered from this repo. It sits on top of the
brand documents and doesn't replace them. Everything here is drawn from repository evidence (the 15 Nov 2026
asset audit in `docs/asset-audit/`).

**Order of authority** when sources disagree:

1. `asset-pack/sumi/SHARED-RULES.md` and `asset-pack/sumi/README.md` (the Sumi kit, 28–30 Oct).
2. Owner decisions recorded in approved films: the locked first ad, the approved flagship, the approved landscape
   card, and the owner's own asset commits (v2 paintings, Elysium marks, 4K captures, Victory Stamp).
3. This guide.
4. Anything older, but only where it doesn't conflict. `film/` and the September assets are the retired brand.

Open questions that would change this guide are in `docs/asset-audit/OPEN_DECISIONS.md`. Where a rule below depends
on one, it says so.

---

## 1. Canonical assets (use these by default)

| need | use | notes |
|---|---|---|
| Characters, full frame | `asset-pack/sumi/avatars/cards/<id>.webp` (1536×2048), ids as in the kit README's cast table | Perma-Bull and Cold Blooded are **v2** (`starter-perma-bull-v2.webp`, `cold-blooded-v2.webp`). The v1 files are retired |
| Characters, animated in 2.5D | `yochi-2p5d/` (`prep/prepare_character.py` + `remotion/src/lib`) | the default pipeline for bringing a painting to life; reads the kit card read-only and the cast's raw mattes below. See its README |
| Characters, layered for 2.5D | `claude/yochi-first-ad-order-a:film-flagship/assets/cast/<id>-{fig,plate,card}.webp` + `cast.json` | figure cut-out with alpha, its own ground plate, head point. Not merged to `master` yet, by decision. Its `starter-perma-bull` and `cold-blooded` entries are already cut from v2. Check the defects in `docs/asset-audit/ANIMATION_FEASIBILITY.md` |
| Characters, small slots / avatars | `asset-pack/sumi/avatars/portraits/<id>.webp` + the app's crop window (`film-flagship/assets/avatars/crops.json` / `reference/code/avatar-roster.ts`) | 512×683, too soft above ~300 px |
| Main logo | `asset-pack/sumi/logo/yochi-seal-paper.svg` / `yochi-seal-sumi.svg` | stamps down like a win, never redrawn, never cyan |
| Small lockup | `asset-pack/sumi/logo/yochi-mark-paper.svg` / `-sumi.svg` + YOCHI in Dela Gothic One | |
| Elysium | `asset-pack/Elysium/elysium-logomark-colorized.svg` (as in the approved card); wordmark variants beside it | drawn exactly as supplied, no recolouring |
| Fonts | `asset-pack/sumi/fonts/` | see section 3 |
| Game UI | rebuild from `asset-pack/sumi/reference/screens/` and the 4K stills in `asset-pack/4k clips + hq stills/stills/`; reuse `film-flagship/src/lib/ui.js` (versus band, chart, timer, pick buttons, ink flood) | never paste low-res screenshots |
| Real UI footage | `asset-pack/4k clips + hq stills/desktop/*.mp4` | fictional players: never present a clip as a real match or result |
| Music | `asset-pack/audio/Victory Stamp.mp3` (142.3 BPM, measured in `film-flagship/src/core/music.js`) | |
| Grounds and textures | procedural: paper with washi fibre and sumi, `lib/draw.js` (`paper`, `sumi`); the stamp texture, `lib/draw.js` seals / `reference/code/seal.tsx`; the bokashi wash, `card-elysium-landscape/src/card.js` | there are no raster textures in the repo |
| Brush and ink | `film-flagship/src/lib/brush.js` (loaded bristle brush, dry-brush, splatter), `lib/draw.js splatter` | never for candles |
| Style target | `claude/yochi-first-ad-order-a:film-flagship/deliverables/yochi-first-ad-final.mp4` and its contact sheet (copy at `docs/asset-audit/usdc-review/reference-first-ad-final-contact.jpg`) | |

Visual references: `docs/asset-audit/contact-sheets/01-cast-current.jpg` (the cast as it should be used today),
`02-cast-cutouts.jpg` (the 2.5D layers), `06-brand-system.png` (marks, type, tokens), and
`05-legacy-do-not-use.jpg` (what not to use).

**Never use:** anything in `asset-pack/characters/`, `asset-pack/avatars/`, `asset-pack/props/`,
`asset-pack/raw-clips/`, `stills/`, `film/assets/`, the 16:9 mode cards, `Yochi_logo.png`, `gunslinger.webp`,
the v1 `starter-perma-bull.webp` and `cold-blooded.webp`,
`fonts+colours.md`'s fonts and palette, or the shorts' pixel sprite kit for cast work. The full list is in
`docs/asset-audit/ASSET_INVENTORY.md`.

## 2. Brand rules that most affect motion

(Condensed from SHARED-RULES. If a point here is ever unclear, read that file.)

- **Two grounds.** Sumi `#0f0d0b` (surfaces `#1a1714` / `#221e1a`, ink `#efe7d8`) for play and tension; paper
  `#f2ece0` with fibre (ink `#16130f`) for identity, reveals and end cards. A ground switch is a strong cut: make it
  land on a beat and mean something (the first ad's ink drop floods paper into sumi as the match starts).
- **Vermilion is the only accent** and it means *you, your pick, your win*: the seal, the slash, the primary
  action, the 決 on your pick. Sumi `#ff5436`; paper `#d6402b` for shapes, `#b3301e` for small text. Never decoration,
  never someone else's loss, never an explosion.
- **Losses are grey** (`#8f8676` sumi / `#6e665a` paper), with the grey 敗 seal or a minus. The loser's painting goes
  grey through the `grey` / `greyPaper` variants in `lib/cast.js`.
- **Candles are standard OHLC**: green `#3ddc84` / crimson `#ff4d6d` (paper `#15804a` / `#c2304d`). No brush, pixel
  or stylised candles.
- **Gold `#e0b25a`** is for tier metal only.
- **Kanji:** only the allowed list (予知 対 決 勝 敗 命 連勝, plus 氷 for Cold Blooded and 師 for Duel Master).
  The native review is done and these are fine. Any other glyph needs review first. List every glyph and timecode
  in the film's README.
- **Copy:** UP / DOWN, never PUMP / DUMP. "Call" only in the tagline, CALLED IT and YOUR CALL. No em-dashes, no "X. Y."
  slogans, none of the banned words, a 5% rake, invented lowercase handles.
- **Money:** USDC everywhere, **except on Elysium, where the stake is HYPE** (owner, 15 Nov). Yochi × Elysium
  films may show HYPE as what players put in and take from the pot. Don't carry that into non-Elysium films.
- **Restraint:** drama from scale, timing and silence. Grain and paper are welcome; glow only on a fresh win amount.

## 3. Typography and layout constraints

| role | face | rules |
|---|---|---|
| Moments: VS, ROUND, UP / DOWN, names, results, the wordmark | Dela Gothic One 400 | the biggest thing on screen, one per moment |
| Every number, tracked caps labels, URLs | JetBrains Mono 400–800 | tracking about 0.2 em on labels |
| Sentences | Zen Kaku Gothic New 500–900 | rare, plain-English supers ("Whoever's right takes the pot.") |
| Kanji | Yuji Syuku | inside seals or brushed, never for English |
| **Retired** | Chakra Petch, VT323, any pixel font | never |

Measured limits (check with `docs/asset-audit/tools/text_audit.mjs`):

- **Title-safe: 5% at 1920×1080**, so 96 px left and right, 54 px top and bottom. Nothing readable rests outside it.
  Entrances may cross it for a frame or two.
- **Key text ≥ 48 px cap height** at 1080p: the line a muted phone viewer must read (the premise, the result, the
  caveat, the CTA). Labels can go smaller, but nothing the film depends on.
- **Never auto-shrink a line to fit** (`maxW` scaling). If it doesn't fit title-safe at its intended size, rewrite it
  or break it over two lines. A squeezed headline reads as a mistake.
- **No type across a face.** Callouts (ROUND 1, FIGHT!, K.O.) go over the board, the ground or the band, not across
  a painted face. The first ad draws ROUND 1 over the fighters' bodies at most.
- **No collisions.** Labels must not sit behind figures, candles or the slash. Check every still at 960×540.
- **One skewed element per scene:** the vermilion slash. No diagonal stripe grounds.
- **End card** (every film): the seal stamps, YOCHI, the URL, held ≥2.5 s, readable muted. Current lockups: the first
  ad's (seal, YOCHI, "Call it right. Take the pool.", yochigg.xyz, NEXT CANDLE · YOUR CALL) and the Elysium card's
  (seal × crest, YOCHI · ELYSIUM, testnet.yochigg.xyz).

## 4. Characters

- **Only the 28 painted characters** in the kit's cast table (Ronin included; v2 Perma-Bull and v2 Cold Blooded,
  a man; Gunslinger and both v1 paintings retired). Use their names exactly.
  **Never invent a character, repaint, recolour, redraw or restyle one** (pixel, 3D, vector, "inspired by").
- Allowed operations: crop, mask, layer, parallax, scale, move, grade to grey for a loss, ink silhouette for a
  locked reward, round face crop, card deal and flip.
- **They are players' faces.** In the approved films a painting is the face a player wears (YOU = Perma-Bull, the
  rival = Doomer, the earned face = Duel Master / Cold Blooded). Keep that grammar. Don't make a painting stand for a
  token, brand or company without a decision.
- Treat the women in the cast with the same framing as the men: chest-up or full card, never cropped to the body.
- Don't let a painting stand for a real person or a real brand's mascot.

## 5. Animation principles

Use the **method ladder** from `docs/asset-audit/ANIMATION_FEASIBILITY.md`, lowest rung first:

0. the card as an object (deal, flip, slam, stamp, grey) · 1. the camera on a flat painting (push, whip, punch,
cut) · 2. figure-over-plate parallax · 3. our own layers (grounds, ink, brush, seals, type, band) · 4. whole-figure
transforms (≤1.5% breathing scale, ≤2° tilt, slides, exits with motion blur). Rung 5 (local mesh warp) is
experimental and off by default. **Never** cut limbs, heads or weapons into separate layers, rig skeletons, or
animate faces.

**2.5D character shots: use `yochi-2p5d/`** (owner decision, 15 Nov 2026, after the A/B test in `demo-2p5d/`).
Pure Remotion is the default pipeline; Blender is kept for specific shots that genuinely need physical depth, light
or a real camera move. Its `CharacterShot` implements rungs 1–4 in 16:9 and 9:16:

- **Ambient** movement is subtle and rigid: breathing scale and sway about the figure's anchor. There's no local
  mesh warp and no rubber-sheet movement, and the original illustration is never altered.
- **Impact** moments may be exaggerated but stay brief (≤ ~0.6 s): shake, punch-in, hit-stop, ink-negative frames,
  shockwave, slash, seal, burst, and a short gust on the free hair/cloth ends only.
- **Choreography** is out of scope. Dynamic sequences use dramatic cuts, alternate artwork, the silhouette and grey
  variants, camera movement and impact effects.

The motion vocabulary, with the numbers the approved films use:

| move | spec | source |
|---|---|---|
| **Stamp** (the payoff, at least once per film) | `scale(2.8) rotate(-28°)` → overshoot 0.9 → `1.0 / -10°` over 0.5 s, `cubic-bezier(.2,.9,.3,1.2)`; contact on the beat | SHARED-RULES; `draw.js stampK / stampSeal` |
| **Impact shake** | ≤6 px, 0.38 s, on the stamped surface (the ground), not the painting | SHARED-RULES; `draw.js impactK` |
| **Slam** (cards, names, callouts) | from ×1.35 to ×1.0 in 0.16 s, first full frame on the hit | `draw.js slamK` |
| **Rise** (the green amount after a win) | 24 px up while fading in; glow only here | `draw.js riseK` |
| **Smash cut** | solid on its first frame, on a hit | THE CAST motion pass |
| **Ink flood** (paper into sumi) | a drop lands, the ragged wet edge spreads over ~12 frames | `ui.js inkFlood` |
| **Impact frame** (in place of choreography) | hard cut to a chest-up or fist crop, scale punch ~1.0 → 1.08 in 2 frames, hit-stop 0.10–0.15 s, at most 2 frames of paper-white, ink splatter | USDC rework plan |
| **Silence** | a real audio dropout before the payoff (the first ad's 0:01 hold) | `music.js` |
| **Parallax** | the plate drifts 0.5–1.5% of frame width against the figure; never so far that the plate's fill shows | `lib/cast.js drawPlate(dx, dy)` |

Architecture: every frame is a pure function of `t`, and all timings live in one timing-map module (`music.js` or
`timing.json`) measured from the track. Cut to the bar grid.

## 6. Acceptable and unacceptable

| acceptable (from approved work) | unacceptable |
|---|---|
| First ad 2–4 s: Doomer chest-up on paper, ▼ DOWN in Dela with 決, smash cut on the bass to Perma-Bull ▲ UP | new characters drawn in code: the USDC v1 pixel fighters |
| First ad 7–11 s: the standoff, then painted fighters breaking the edge of the versus band, 対, DUEL | full-body choreography or rigs (the September hooded rigs) |
| First ad 13–16 s: 0:01 held in silence, then the CALLED IT stamp, +19 USDC rising green, the loser grey | a vermilion blast on the loser; red for a loss |
| First ad 18–21 s: the achievement sheet, then Duel Master's painting held on paper with its unlock line | morphing one character into another |
| First ad 22–29 s: FFA faces split by the strike line; the BR verdict greying faces one per beat | a crowd of invented figures |
| First ad 30–40 s: the rebuilt landing page, the ink signature, the seal stamping on paper, the end card | the cyan Y, glow, bloom, LED faces, glass floors |
| Landscape Elysium card: still type, one moving hanko, the official crest as supplied | a substitute or lookalike partner logo |
| Real 4K UI clips cut on the beat (gameplay trailers) | presenting a capture as a real match, result or player |
| A headline rewritten to fit title-safe | a `maxW`-squeezed headline or a label hidden behind a figure |
| References to fighting-game *grammar* (select screen, versus band, ROUND, K.O.) | pastiche of a specific game (a headbanded karate fighter in a gi on a rooftop, a "99" stage HUD copied) |

### Fight-impact exceptions (USDC v3, pending sign-off)

One decisive hit may go past the defaults above, for that hit only. The USDC short v3 used, and documented in
`shorts/01-usdc-eliminated/v3/REPORT.md`:
- a shake of 18 px decaying over 0.65 s, with a 1-frame kick and a 0.5° roll;
- 1 paper-white frame, then 2 ink-negative frames of the whole frame;
- a vignette darkening on the anticipation close-up;
- the strike's ink crossing the target's chest;
- the knocked-out panel turning as it flies off.

Every other beat keeps the house values. The reusable pieces are `shorts/src/lib/slash.js` (the dry-brush strike
and the ink-negative frame, ported from `demo-2p5d/`) and the depth order that sandwiches the strike between the two
fighters.

## 7. Asset-selection process (every new film)

1. **Start from the kit and the style target.** Read SHARED-RULES, the kit README and this guide. Watch the locked
   first ad.
2. **Regenerate the inventory** so you see the current state, including anything added since 15 Nov:
   `python3 docs/asset-audit/tools/inventory.py`, then filter `inventory.csv` to `APPROVED / CURRENT` and
   `LIKELY CURRENT`.
3. **For any asset not in the inventory, or tiered UNCERTAIN,** check its Git provenance
   (`git log --format='%h %an %cs %s' -- <path>`) across branches. Owner-added beats Claude-made, Sumi era
   (after 28 Oct) beats earlier, and "used in an approved film" beats "exists". If it's still unclear, put it in the
   film's README under "Decisions and open questions" and don't use it.
4. **Cast by job, not by look.** Pick paintings by their documented description and unlock (kit README table), check
   the per-character method in `ANIMATION_FEASIBILITY.md`, and avoid flagged mattes at size.
5. **Copy, don't move.** Copy the chosen assets into your film's own folder (the repo convention), and leave
   `asset-pack/` and other films untouched.
6. **Review gate before the full render:**
   - stills of the first 2 s, the payoff and the end card at 960×540 and at phone size;
   - `node ../docs/asset-audit/tools/text_audit.mjs --film <name>` from the engine folder: no string outside
     title-safe at rest, every key line ≥48 px cap;
   - a contact sheet at one frame per second, compared side by side with the first ad's.
7. **Record** in the film's README: the assets used (with branch and path), the kanji and timecodes, and every
   decision.
8. **Ask before** inventing anything the kit doesn't have (a new character, an environment painting, a texture,
   a partner mark).

## 8. Reusing the engine

The flagship engine (`claude/yochi-first-ad-order-a:film-flagship/`) is the most complete. `card-elysium*/` and
`shorts/` share its `core/` and `lib/draw.js`, so its `lib/cast.js`, `lib/ui.js` and `lib/brush.js` drop into either.
The cast pipeline (`tools/cast_mask.py`, `cast_mask_fix.py`, `cast_prep.py`) re-makes the cut-outs if a painting
changes. A newer painting in `assets/cast/source/<id>.webp` overrides the kit's.
