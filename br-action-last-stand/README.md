# THE LAST STAND: Battle Royale action experiment (proof of concept)

Can the existing painted cast carry a cinematic, action-led Battle Royale trailer? This is an 8-second test of that.
It's independent of Battle Royale V4 (`last-candle-standing/v4/`, untouched) and of the achievement-animation work.
**Status: draft for owner review. Not published.**

Read in this order:
1. `FEASIBILITY.md`: the character audit and the shot-by-shot feasibility, written before the build.
2. `deliverables/last-stand-poc-16x9.mp4`: the result.
3. This file: the assessment, assets, open decisions and the full-trailer estimate.
4. `MISSING_ASSETS.md`: the specifications for 2 essential and 1 optional new pose. Kept separate, and **nothing in it
   has been generated**.

## Deliverables (`deliverables/`)

| file | what |
|---|---|
| `last-stand-poc-16x9.mp4` | 1920×1080, 60 fps, 8.00 s, H.264 High + AAC 320k, with the mix |
| `last-stand-poc-16x9-contact.jpg` | timed contact sheet: exact frames every 0.25 s, each with time, frame number, scene and beat |
| `last-stand-poc-audio-sync.png` | the mix's waveform and onset flux with every timing-map event marked (the sync check) |
| `last-stand-poc-poster.jpg` | the hit-stop frame (5.70 s) |
| `audio/music.wav`, `audio/sfx.wav`, `audio/mix.wav`, `audio/sfx_cues.json` | separate stems at the mix's gain (music + sfx = mix) and the effects cue list |

## The sequence

| time (s) | beat | what you see | music |
|---|---|---|---|
| 0.00–1.54 | face-off | deano (Cold Blooded) and mira (Duel Master) in two live 2.5D panels split by one diagonal gutter; 対 stamps in the gutter; names and 命 lives slam in | groove; 対, deano and mira each land on a hat (0.52 / 0.86 / 1.20) |
| 1.54–2.90 | eyes | two letterbox eye strips slam in from opposite sides; deano LAST LIFE, mira two lives | hats at 1.54 and 1.88 |
| 2.90–3.41 | deano locks ▼ DOWN | chest-up punch-in, 決 stamps | the sub drops out (2.90) |
| 3.41–3.92 | mira locks ▲ UP | mirrored panel, 決 | build |
| 3.92–5.11 | last candle | three panels: deano, the live HYPE 1-minute candle against the strike line with a 3-second arcade timer, mira. The candle sits crimson (deano winning)... | build |
| 5.11–5.45 | it closes ▲ UP | ...then rips green at the close. deano's pick greys and strikes through, his last 命 cracks and falls, and the frame freezes into a vignette on him | the near-silence (5.28–5.45) |
| 5.45–5.62 | slam-in | mira, camera slam with a Dutch tilt, manga focus lines converging on her eyes, a gust in her hair | the sub re-enters (5.455) |
| **5.62** | **THE HIT** | 1 paper-white frame, 2 ink-negative frames, then the page: an enormous vermilion stroke across deano's chest, a black ink explosion, hit-stop 0.12 s, 20 px shake | **drop 2's big hit** |
| 5.74–7.32 | knockback | deano hurled back into depth (whole figure: translate, rotate, scale, smear), greying, breaking into ink; speed lines; a fresh burst on each musical hit | hits at 6.48 and 6.99 |
| 7.32–8.00 | result | a paper band slams across: 敗 deano OUT · mira TAKES THE POOL · **+95 USDC** · 100 USDC POOL · 5% FEE | the next big hit (7.325) |

**The match:** the final two of ten seats at 10 USDC each, so a 100 USDC pool, and the winner takes 95 after the 5% fee.
deano has one life and mira two, so losing a life here *is* deano's elimination, which is why he shatters rather
than just being knocked back. The players and the price path are fictional. Nothing claims or implies guaranteed
winnings: the film shows one player losing everything they staked.

## Technical assessment

**What works, and scales**
- **The impact grammar is the strongest result.** Slam-in → paper-white → ink-negative → hit-stop → an enormous loaded
  stroke on a paper page reads as a manga hit at normal speed. It's all procedural (the house slash and broad
  stroke, laid along one diagonal), so it costs no artwork and reuses on any pair.
- **The ground switch to paper on the hit** gives the climax its own world: black ink on white, as in a manga page.
  It's the strongest single choice in the piece.
- **The live panels** (`yochi-2p5d` `CharacterShot`s clipped inside ink gutters) keep the paintings at full quality and
  alive while the edit cuts every 0.34–0.68 s. That's the dynamism. It comes from cutting, not from moving bodies.
- **The prediction → outcome link reads with the sound off**: PICKS ▼ DOWN / ▲ UP, the same chips under each face in
  the candle panel, the candle closing on the strike line, the wrong pick greying and the 命 falling *before* the
  hit. You know why deano is hit before he's hit.
- **The ink dissolve on the real matte** looks like a painting breaking up, not a sprite. It only removes pixels
  (alpha); it never moves or repaints them. Tied to the music's hits, it keeps the knockback alive.
- **The cost of reuse is low.** The whole PoC is ~660 lines of scene code on the validated packages. A new pair
  needs a figure prep (`prepare_character.py`, ~5 s) and four numbers (head point, eye line, pivot, slash path).

**What doesn't fully work (the honest limits)**
- **The knockback body.** Cold Blooded's chin-up, proud pose flies backwards like a figure *thrown*, not a body *hit*.
  Speed, smear and the ink dissolve carry it at speed, but on a pause it's the weakest frame. This is the case for
  pose #2 in MISSING_ASSETS.
- **The strike is implied, not seen.** mira's painting holds a raised hilt, so the slam-in is a stare and the slash
  stands in for the cut. It works as manga grammar, but a draw pose (#1) would make the hit hers and not the
  film's.
- **Eye strips are soft** (~2.7× the card). They pass for 0.34 s under a push; they wouldn't hold longer.
- **8 seconds is dense.** Each lock gets 0.5 s. That's readable (one word, 124 px), but a full trailer should give the
  locks a beat more.
- **Face-off motion is camera-only**, pushes and opposing trucks. That's fine for 1.5 s, but it's the most "slideshow"
  stretch; in a longer cut it wants a card-deal entrance or a silhouette reveal (Cold Blooded supports one).
- **Two flagged mattes:** Cold Blooded has a slight paper fringe on the fur's right edge (invisible on the paper
  ground, visible on sumi at size), and Duel Master keeps red disc fragments in her hair (so no silhouette).

**Verdict:** yes, with qualification. The existing art carries everything *around* the fight: tension, prediction,
resolution, impact, the result. It can't show a body in action. The two essential poses address exactly the two
frames where that shows. Everything else in a 15–20 s trailer can be built from the existing cast with this
grammar.

## Music and sync (flag for owner review)

- Track: `Victory Stamp_dark_dnb.mp3` (the copy in `last-candle-standing/v4/music-source/`, read-only). **One continuous
  passage, 1:45.045 → 1:53.045. No splice, no stretch, no new music.** There's a 10 ms fade-in and a 60 ms fade-out
  at the end only. It's the run-up and drop 2 that V3/V4 also use, but here it's left whole.
- Grid: 176 BPM (beat 0.34095 s). The strong transients sit on the half-beat phase of the 94.135 grid, and every cut
  and slam above is placed on one of them (`remotion/src/timing.json`, measured with an onset detector: 5.619 has
  onset strength 16.6 against ~2.5 for the hats).
- **I couldn't listen to the result.** The sync was placed from waveform and onset analysis and checked on
  `last-stand-poc-audio-sync.png`. Please review the sync by ear, especially (a) whether the 0.17 s slam-in between the
  sub's return (5.455) and the hit (5.619) feels right, or wants the hit one frame earlier, and (b) whether the
  end at 8.0 s cuts too hard (a 60 ms fade into the next transient).
- Effects: V1's synthesised instruments (`last-candle-standing/audio/score.py`, loaded read-only) are cued from the
  timing map, and the near-silence is kept silent. The mix is -14.0 LUFS integrated, -2.1 dBTP, with 2-3 dB of ducking
  under the locks only. Stems are separate, so picture, music and effects can each be re-edited without the others.

## Assets used (all read-only; nothing in `asset-pack/` or other films was changed)

| asset | source | provenance |
|---|---|---|
| Duel Master card | `asset-pack/sumi/avatars/cards/duel-master.webp` → copied to `assets/cards/` | owner, Sumi kit (8a2fc71, 28 Oct). SHA-1 d2edb4bb… |
| Cold Blooded **v2** card | `asset-pack/sumi/avatars/cards/cold-blooded-v2.webp` → `assets/cards/` | owner's v2, canon per b43ee50 (15 Nov). SHA-1 58185320…. The retired v1 is not used |
| 2.5D layers (fig, bg, depth, flow) | `yochi-2p5d/characters/{duel-master,cold-blooded}/` rebuilt by `prep/prepare_character.py` (deterministic, not committed) | house BiRefNet raw mattes from `claude/yochi-first-ad-order-a` (see each `meta.json`) |
| 2.5D engine | `yochi-2p5d/remotion/src/lib` (CharacterShot, slash, Grade), imported in place | owner-adopted pipeline, 15 Nov |
| Film helpers | `last-candle-standing/v4/remotion/src/lib/{Candles,brush,motion,frame,InkField,Motes,brand}` copied into `remotion/src/lib/` | V4 (validated); copied, not modified at source |
| Fonts | `asset-pack/sumi/fonts/` (Dela Gothic One, JetBrains Mono, Yuji Syuku) | Sumi kit |
| Music | `last-candle-standing/v4/music-source/Victory Stamp_dark_dnb.mp3` | owner's track |
| Effects | `last-candle-standing/audio/score.py` instruments | synthesised (V1) |

**Not used:** any retired or September asset, the v1 paintings, Gunslinger, the pixel sprites. No new artwork, no
repainting, no recolouring other than the house loss grey.

**Kanji** (all on the allowed list): 対 versus, 0.52–1.54 · 命 life, 0.86–2.90 and 3.92–5.45 (deano's cracks at 5.20) ·
決 locked pick, 3.00 and 3.51 · 敗 defeat (grey), 7.33–8.00.

## Decisions and open questions (need your call)

1. **No YOU.** Neither player is labelled YOU, so this doesn't break "YOU = Perma-Bull". Vermilion appears only in the
   slash (the win), the timer's drain bar and nowhere else. If the full trailer is told from YOU's side, YOU would
   be the striker and Perma-Bull would need the same treatment (his raised fist suits a strike insert).
2. **The vermilion stroke crosses the loser's chest.** This follows the USDC v3 fight-impact exception (still pending
   sign-off). So do the 20 px shake, the paper flash and the 2 ink-negative frames.
3. **Diagonal panel gutters.** The kit allows one skewed element per scene. Here each scene has exactly one: the
   gutter in the face-off and locks, and the slash in the hit (the hit scene has no gutters). Please confirm that
   panel gutters count as acceptable skewed elements.
4. **The ink dissolve** removes a painting's pixels progressively (alpha only, never moving or repainting them), with
   a brief whole-figure squash of ≤4% for 6 frames at contact. It's a new effect on the cast. Is it acceptable for
   eliminations?
5. **The ground switch to paper on the hit.** It's on the beat and means something (the moment of truth lands on the
   page), but it's a new use of paper as a combat ground.
6. **The result band** shows the pool and fee explicitly (100 USDC POOL · 5% FEE) to make "after fees" visible. V4
   chose one number only. Which do you want for the trailer?
7. No end card: this PoC deliberately stops at the elimination. The full trailer would end on the house seal stamp,
   YOCHI and yochigg.xyz.

## Estimate for a full 15–20 s trailer

| section | length | built from | new artwork |
|---|---|---|---|
| Entry: ten players, the pool (10 × 10 = 100 USDC), lives | 2.5–3 s | existing cast: card deal into a 10-panel manga grid, silhouettes flipping to colour | none |
| The field: 3–4 rapid eliminations, one per beat | 4–5 s | this PoC's hit grammar, compressed to 0.6–1.0 s each: lock chip → candle tick → slash → grey + dissolve. Rampage's fist as an impact insert | none (optional: Rampage re-matte) |
| Final two (this PoC, given ~1 s more air on the locks) | 7–8 s | as here | **2 essential poses** (Duel Master draw, Cold Blooded hit) |
| Payout + end card | 3–4 s | +95 USDC rise, the seal stamp, YOCHI, yochigg.xyz | none |

- **Artwork:** 2 essential new poses, plus 1 optional (Cold Blooded down) and the optional prep tasks listed in
  MISSING_ASSETS. A different final pair would need its own 2 poses. The field eliminations need none: at 0.6–1.0 s,
  the existing paintings with grey + dissolve hold up.
- **Engine work:** about 1.5–2 days beyond this PoC. That's the 10-panel grid and deal, a compressed hit preset, a 9:16
  recompose (every position is in frame units already, except the panel polygons), the end card, and wiring the
  new poses in as alternate `CharacterShot`s (no code change: a new prepared character each).
- **Risk:** low for the structure, medium for the poses (they must match the painter's hand closely enough to cut
  against the canonical cards without a visible style jump).

## Rebuild

```bash
python3 ../yochi-2p5d/prep/prepare_character.py duel-master cold-blooded   # needs opencv-python-headless numpy pillow
python3 audio/build_audio.py                                              # music / sfx / mix stems
cd remotion && npm ci && tools/sync-assets.sh
node tools/stills.mjs out/stills 0.5 0 1.3 3.2 5.15 5.58 5.7 6.5 7.8      # review stills at 960x540
tools/render.sh ../deliverables/last-stand-poc-16x9.mp4                   # ~4 min on 4 cores (silent render + mux)
python3 tools/review.py qc ../deliverables/last-stand-poc-16x9.mp4        # blank / dropout check
python3 tools/review.py contact ../deliverables/last-stand-poc-16x9.mp4 ../deliverables/last-stand-poc-16x9-contact.jpg
python3 tools/review.py audio ../audio/out/mix.wav ../deliverables/last-stand-poc-audio-sync.png
```

Render QC (final): 480 frames, no blank or dropped frames flagged. The only solid frames are the authored paper
flash (f337) and the two ink-negative frames (f338-339).
