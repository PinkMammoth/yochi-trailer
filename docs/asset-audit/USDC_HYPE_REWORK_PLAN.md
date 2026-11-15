# 01 · USDC HAS BEEN ELIMINATED: review and rework plan

Reviewed 15 Nov 2026 against `docs/YOCHI_MOTION_STYLE_GUIDE.md`. Nothing in `shorts/` was changed. The v1 files
(`shorts/01-usdc-eliminated/deliverables/*`, commit `499f252`) stay as they are.

Evidence:
- `usdc-review/usdc-v1-stills.jpg`: v1 at 0.5, 1.3, 2.0, 2.6, 3.3, 3.62, 4.2, 5.0, 5.8 and 8.5 s.
- `usdc-review/reference-first-ad-final-contact.jpg`: the locked first ad, the style target.
- The typography figures below come from `tools/text_audit.mjs` (every frame at 30 fps, real canvas transforms).

## Verdict

The structure, timing and copy logic of v1 are good, and the end card is on brand. The **world and the fighters are
not.** v1 builds a pixel-art rooftop and two new pixel characters (a headband brawler in a gi and sash, and an office
clerk), which:

1. **Breaks a hard kit rule.** `asset-pack/sumi/README.md`: "Use the names exactly. Don't repaint, recolour faces, or
   **invent new characters**." The v1 README says so itself ("new pixel characters drawn in code … not members of the
   painted cast").
2. **Leaves the Sumi look.** No ink, no washi, no painted cast. The only Sumi in it is the type, the band and the end
   card. Next to the first ad it reads as a different product.
3. **Leans on one game's iconography.** A red-headbanded karate fighter in a white gi on a rooftop stage with a
   "99" timer is the archetype of one famous fighting game. It's original pixel art, but that's the brief's
   "Street Fighter-like" problem, and SHARED-RULES wants the register of a game UI, not a pastiche.
4. **Uses vermilion on someone else's loss.** The blast where USDC leaves the screen is a vermilion cloud. The rule
   is that vermilion means *you*, and losses go grey.
5. **Adds a fifth typeface.** The 3×5 pixel font (`src/lib/pixfont.js`) on the candle board is off-system and
   unreadable at 1080p (HYPE 1M renders as a smear under the headband).

## Typography, margins and collisions

Title-safe here is 5% (96 px left/right, 54 px top/bottom). "Key text" means the brand's ~48 px cap-height floor
for words that must read muted on a phone.

| t (s) | element | finding | severity |
|---|---|---|---|
| 0.0–0.77 | select plates **HYPE / USDC** (Dela 110) and **NATIVE · UNHINGED / STABLE · NEEDS APPROVAL** (mono 34) | sit 72–74 px from the left and right edges, outside title-safe for the whole shot | medium |
| 0.0–0.77 | **ELYSIUM** under the title (mono 28) | 21 px cap: unreadable on a phone, and it's half of the Elysium caveat | medium |
| 0.8–1.77 | **STAGE · ELYSIUM** (mono 28, 21 px cap) | drawn behind USDC's body and the slash, mostly hidden | high (collision) |
| 1.8–6.37 | board label **ELYSIUM** (pixel font) | cut through by the ripping green candle from 4.2 s ("ELY▮IUM") | medium (collision) |
| 1.8–6.37 | board label **HYPE 1M** (pixel font) | illegible, and HYPE's headband covers it | medium |
| 1.8–2.37 | **ROUND 1** (Dela 190) | drawn across HYPE's face and torso | low (genre-typical, but busy) |
| 2.43 | **FIGHT!** (Dela 280) | 1 frame past the left edge on entry (x −26) | low |
| 2.8–3.7 | wallet prompts: titles Dela 52 (37–47 px cap), subs mono 24 (17–22 px cap) | the subs ("spending cap request", "slippage 0.5%") can't be read at phone size; the stack runs off the right edge as it shatters (expected) | medium |
| 3.62 | the hit | a near-full-frame white flash. One frame is fine; keep it to ≤2 frames and don't repeat it in a short | note |
| 4.83 | **K.O.** (Dela 360) | 2 frames past the top edge on entry | low |
| 5.2–6.37 | **USDC HAS BEEN ELIMINATED** (Dela 88, `maxW 1440`) | **overflows its box**: `maxW` shrinks it to ~54 px cap, and its right edge (~1836 px) still sits outside title-safe for 31 frames at rest | **high** |
| 5.2–6.37 | **ON ELYSIUM** (mono 40, 30 px cap) | it's the legal-ish caveat, and it's under the 48 px key-text floor | medium |
| 7.6–10 | **testnet.yochigg.xyz** (mono 34, 25 px cap) | under the floor. It matches the approved landscape card's treatment, so this is a rule-vs-precedent question, not a v1 bug (see OPEN_DECISIONS) | decision |

What's consistent and should be kept: Dela for moments, JetBrains Mono for labels, the versus band and slash, the
grey 敗 seal, the paper end card, the seal stamp motion, the lockup with the official colourised Elysium mark,
and the vermilion URL in `#b3301e`.

## The rework

### Principle

Keep v1's **beats, timing map (`timing.json`, 150 BPM) and soundtrack**, so the cut and the audio stay valid.
Replace the world and the fighters with the painted cast, animated only with rungs 0–4 of the method ladder in
`ANIMATION_FEASIBILITY.md`. No new character art.

### Casting (confirmed 15 Nov)

**Perma-Bull (v2) as YOU, picking HYPE, against Paper Hands as USDC.** The cast stay players, not tokens, which
matches every approved film, where a painting is a player's face. The premise is confirmed too: on Elysium the
stake is HYPE, not USDC (SHARED-RULES now carries the Elysium exception), so "CHOOSE YOUR COLLATERAL … USDC HAS BEEN
ELIMINATED … JUST HYPE" stands. The kanji used (決 対 敗) are reviewed and fine.

The options considered:

| side | painting | why | how it's named on screen |
|---|---|---|---|
| HYPE (1P, your pick) · **chosen** | **Perma-Bull** (v2) | He's **YOU** in THE CAST, the flagship and the locked first ad. His raised fist is a built-in punch | **YOU** with ▲ HYPE as the pick, or keep **HYPE** as the plate name |
| USDC (CPU) · **chosen** | **Paper Hands** | Glasses, a paper slip clutched like an approval form, terrified: "needs approval" in one image. Clean matte, head clear | **USDC** as the plate, or an invented lowercase handle |
| impact-frame alternative (not chosen; the hit stays on Perma-Bull's fist) | **Rampage** | His fist already comes at the lens; a punch-in on a single layer is the strongest impact frame in the set | only if you're happy for the hit to cut to a second character |

Alternatives for USDC: Strategist (clipboard of plans) or Doomer (the first ad's rival). The trade-off is that
Paper Hands' "i'm out" take is the funniest fit for being eliminated, while Doomer keeps continuity with the first
ad. Either way, no painting is recoloured. Tying USDC's blue to a character would mean recolouring, so it goes.

### Shot plan (same timings)

| t (s) | v1 | rework |
|---|---|---|
| 0.0–0.8 | pixel select screen, striped ground | **Character select on sumi**: a 3×2 grid of real portrait tiles using the app's crop windows (`crops.json`). Perma-Bull and Paper Hands are lit, the other four are dimmed starters, so it's honest that there's a roster. Big busts left and right from `-fig` over `-plate`, with slow parallax (rung 2). The 1P cursor flicks and locks with the 決 seal (vermilion = you); the CPU locks USDC. CHOOSE YOUR COLLATERAL in Dela, ELYSIUM as a ≥48 px cap mono line. Plates move inside title-safe (≥96 px). Drop the diagonal stripes: the slash is the only skewed element |
| 0.8–1.8 | pixel versus band | **The approved versus band** (`ui.js versusBand`) with both figures breaking its edges, as in the first ad's standoff collapse. HYPE 対 USDC. **STAGE · ELYSIUM moves above the band**, clear of both figures |
| 1.8–2.8 | rooftop, ROUND 1, FIGHT! | **Sumi ground, the duel board**: the real-looking HYPE 1-minute OHLC chart (`ui.js chart`, standard green/crimson candles), the arcade timer (Dela, with the vermilion drain; the "99 that never moves" joke can stay as the timer frozen), health bars in ink/grey. The two figures face off chest-up in a two-shot with a slow push. ROUND 1 and FIGHT! in Dela, sized to sit in title-safe and placed over the board, not across a face |
| 2.8–3.3 | wallet prompts stack | **Paper Hands** (rung 4, a ≤1 px tremble on the whole figure) while Sumi UI cards (surface-1, hairline, Dela title ≥48 px cap) stack over him: APPROVE USDC, CONFIRM SWAP, SIGN MESSAGE. Drop or enlarge the mono subs (≥32 px) |
| 3.3–3.6 | HYPE coils, dashes | **Push-in on Perma-Bull's fist** (rung 1), an ink stroke gathers behind it (`brush.js`) |
| **3.6** | white frame, hit stop | **Impact frame**: hard cut to the fist at chest-up crop (or Rampage, if chosen), a 2-frame paper-white flash at most, a scale punch 1.0 → 1.08, 0.14 s hit-stop, the music cut as v1. The painting is never warped |
| 3.74–4.8 | USDC launched off, briefcase, blast | **Paper Hands' whole figure** flies off right (rung 4: translate, a small rotation, motion blur), the UI cards shatter into paper shards, **an ink splatter (not vermilion)** where he left the frame. His health bar drains to grey; the candle rips green; no crowd (the cast isn't a crowd) |
| 4.8–5.2 | K.O. | **K.O. as a stamp**: the seal motion from SHARED-RULES (scale 2.8 → overshoot → 1.0 at −10°, 0.38 s ≤6 px impact shake). It's your win, so vermilion is correct here |
| 5.2–6.4 | paper band, grey 敗 | **The same paper band**, now with Paper Hands' **grey round face crop** (`drawFace` grey) beside the grey 敗 seal. Fix the overflow: ON ELYSIUM at ≥48 px cap on its own line; USDC HAS BEEN ELIMINATED at a size that fits 1728 px (title-safe) without `maxW` scaling, about Dela 80, or broken over two lines |
| 6.4–7.45 | NO SWAPS / NO APPROVALS / JUST HYPE | keep as is (it's clean and on brand) |
| 7.45–10 | the seal stamps, lockup | keep the end card. Only the URL size is open (OPEN_DECISIONS #6) |

### Implementation steps (when approved)

1. Branch the short as `shorts/02-…` or a v2 folder, so v1 stays reproducible. Don't overwrite v1's deliverables.
2. Copy from `claude/yochi-first-ad-order-a:film-flagship/` (not merged to `master`, by decision) into `shorts/`: `src/lib/cast.js`, `src/lib/ui.js`,
   `src/lib/brush.js`, and only the assets the short needs (`assets/cast/{starter-perma-bull,starter-paper-hands}-{fig,plate,card}.webp`,
   `assets/cast/cast.json`, `assets/avatars/crops.json` and the six tile portraits). The shorts engine already shares
   `core/` and `lib/draw.js` with the flagship, so these drop in.
3. Retire `src/films/usdc/cast.js` (the pixel sprites), `lib/pixel.js` and `lib/pixfont.js` from the new film.
   Leave the files for v1.
4. Build the shots above in a new `film.js`, reading the unchanged `timing.json`.
5. Gate: `text_audit.mjs` must report **no string outside title-safe at rest** and no key line under 48 px cap.
   Stills at 0, 1.3, 2.0, 3.3, 3.6, 4.2, 5.8 and 8.5 s, reviewed at 960×540 and at phone size.
6. Re-render with the same soundtrack (`usdc-eliminated.wav`). If the hit moves even one frame, rebuild the audio
   from `timing.json` with `tools/audio_usdc.py`.
7. Update the short's README "Decisions" (casting, kanji 決 対 敗, what changed from v1).

Effort: about one session. Most of it is layout, since every component exists.
