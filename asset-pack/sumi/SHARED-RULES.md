# Shared rules for the Sumi trailer films

Every concept film made in the Sumi brand follows this file. Where it disagrees with anything under `film/` (the 62s
cyan trailer from September), this file wins: that film is the retired brand.

## What Yochi is

Yochi (予知, "foresight", literally "knowing before") is a multiplayer prediction game on Hyperliquid. Players stake
USDC on whether the next HYPE candle closes UP or DOWN, against each other, not against a house:

- **Free For All:** everyone in the round puts in, the side that reads it right splits the pool. Five-minute candles.
- **Duels:** 1v1, one-minute candles. Sudden Death, best of 3 or best of 5.
- **Battle Royale:** 3 to 10 players, one-minute candles, lives; the last one standing takes the pot.

Yochi takes 5%. Settled on-chain by the HyperCore oracle. Site: **yochigg.xyz**. The landing page has a free practice
round on the live price ("TRY ONE · NO WALLET · NO MONEY"), which is the lowest-friction first step for a new viewer.

## The one goal

Get people to play. The film has to stop a scroll on X in the first second with the sound off, hold to the end, and
make visiting yochigg.xyz feel like the obvious next step. Judge every decision against that. It is not an explainer
and not a feature tour.

## Working conditions (read this first)

- You are working **unattended**: Matt is on a flight and cannot answer questions. Do not stop to ask. Make the call,
  write it down in your TREATMENT.md under "Decisions and open questions", and keep going.
- Three other sessions are building other films in this repo at the same time. Work only inside your own top-level
  directory (named in your prompt) on your own branch. **Never edit `film/`, `asset-pack/` or another film's
  directory.** Copy what you need.
- Commit and push your branch after every meaningful milestone (treatment, first stills, first full render, final
  render), so nothing is lost if the session ends early.
- Priority order if time runs short: TREATMENT.md, then the 16:9 film, then the poster, then the contact sheet, then
  the 4:5 vertical. A finished 16:9 draft beats four half-finished deliverables.

## Repo and engine

- Read `film/README.md`, `film/TREATMENT.md` and `film/src/core/*` for the engine only. Copy what you need from
  `film/src/core` (post-processing pipeline, math, music timing approach) and `film/tools` (render, still, contact
  sheet) into your own directory. Keep the "every frame is a pure function of time" architecture so the film renders
  in parallel and any moment can be inspected.
- Do NOT reuse the September film's world or assets: no hooded characters, no crowd, no visor/LED faces, no glass
  floor, no ring/eye arena, no rigs, no pepes, nothing from `asset-pack/characters/`, `asset-pack/avatars/` (the old
  pepe stickers) or the 16:9 mode cards. Those are the old brand.
- Rendering needs ffmpeg and Playwright's Chromium. Install them if the environment lacks them.

## Brand: Sumi (read `asset-pack/sumi/README.md` for the full kit)

- **Two grounds.** Sumi (warm black `#0f0d0b`, surfaces `#1a1714` / `#221e1a`, ink text `#efe7d8`) for play and
  tension. Paper (warm off-white `#f2ece0` with fibre texture, ink `#16130f`) for identity, reveals and end cards.
  A film may use both; switching ground is a strong cut, so make it mean something.
- **Vermilion is the only accent.** Sumi `#ff5436`, paper `#d6402b` (large shapes) / `#b3301e` (small text). It means
  *you, your pick, your win*: the seal, the slash, the primary action. Never decoration, never someone else's loss.
- **Losses are grey, not red.** Eliminated, missed, losing side: fade to `#8f8676` (sumi) / `#6e665a` (paper) with a
  minus sign or the grey 敗 seal. Visible, not screaming.
- **Candles stay candles.** Green `#3ddc84` up, crimson `#ff4d6d` down, standard OHLC. On paper `#15804a` / `#c2304d`.
  No brush-stroke candles, ever, even in the most painterly film. Won money is green; lost money is grey.
- **Type.** Dela Gothic One for moments (VS, ROUND, UP / DOWN, names, results). JetBrains Mono for every number and
  tracked caps label. Zen Kaku Gothic New for the odd sentence. Yuji Syuku for kanji only. Chakra Petch and VT323 are
  retired: do not use them.
- **Signature shapes:** the stamped **seal** (rounded square, vermilion, slight rotation, light stamp texture), the
  **versus band** (paper-coloured band, two sides, one vermilion diagonal slash in the centre), and the **arcade
  timer** (Dela, huge, with a vermilion drain bar). The slash is the only skewed element: once per scene.
- **The stamp is the payoff.** The win moment is a seal slamming down: from `scale(2.8) rotate(-28deg)` to an overshoot
  at 0.9 to settle at `1.0 / -10deg` over 0.5s (`cubic-bezier(.2,.9,.3,1.2)`), a 0.38s impact shake of ≤6px on the
  stamped surface, a little ink splatter, then the green amount rises. Every film should land on a stamp at least once.
- **Logo:** the double-line Y, in two forms (`asset-pack/sumi/logo/`). The **seal** (`yochi-seal-paper.svg` /
  `yochi-seal-sumi.svg`: the Y cut out of a vermilion hanko) is the main mark: use it on end cards, where it should
  stamp down with the same motion as CALLED IT, so the brand lands like a win. The **plain mark** (`yochi-mark-paper.svg`
  ink / `yochi-mark-sumi.svg` cream, one colour, no vermilion) is for small lockups next to the YOCHI wordmark. Wordmark
  in Dela Gothic One. Add the stamp texture from `reference/code/seal.tsx` to the seal if you like; never redraw the Y,
  and never show it in cyan (the one exception is named in the 予知 prompt).
- **Real UI is allowed now.** The product looks like the films, so a 2-3 second cut into the real screens just before
  the end card is encouraged: it makes the click feel like stepping into what the viewer just watched. Rebuild those
  moments from `asset-pack/sumi/reference/screens/` (mocks and real captures) and `reference/code/` in your own
  renderer at full resolution, rather than pasting low-res screenshots. Leave out the fixture bars, chat panels and
  sticker emotes you see in some captures.

## Kanji (hard rules)

- Allowed glyphs only: 予知 (foresight, the name), 対 (versus), 決 (decided, a locked pick), 勝 (win), 敗 (defeat,
  grey), 命 (life), 連勝 (win streak). Nothing else, no invented "decorative" Japanese.
- All of them are pending native-speaker review in November. Keep each film to the few it needs, and list every
  glyph used, with its meaning and timecode, in TREATMENT.md.
- If you animate a glyph being written, use correct stroke order.
- No clichés: no gongs, cherry blossom, torii, geisha, rising sun, "oriental" fonts or fake brush lettering of English.
  The Japanese register is a game UI (Persona, fighting-game versus screens, Sekiro's ink), not a souvenir shop.

## Copy rules (hard)

- Directions are UP / DOWN on screen. Never PUMP / DUMP.
- The word "call" is retired as the product verb. The only allowed lines containing it are "Call it right. Take the
  pool." (the tagline), the **CALLED IT** stamp, and "YOUR CALL".
- No em-dashes anywhere. No staccato two-line slogans in the "X. Y." pattern other than the tagline above.
- Banned words: "PvP", "arena", "platform", "house edge", "friendo", "Saw it coming", and any military language
  (operative, call sign, mission, deploy). The rake is 5%, never 10%.
- Money is USDC. HYPE is the asset, never what you win.
- Keep the maths plausible and consistent: a pot pays out minus 5%. Examples: Battle Royale 10 seats × 10 USDC = 100,
  winner takes 95; Duel 2 × 10 = 20, winner takes 19; FFA wins of +10 to +60 USDC on modest stakes.
- Invented players only: short, lowercase, believable handles (`mira`, `deano`, `exit_liquidity`, `0x4f…a1`). No real
  people, real accounts or X's interface.
- Write for crypto natives: never explain wallets, candles or Hyperliquid.

## Craft

- **Muted-first:** the film must make sense with the sound off, and every word must read at phone size (key text at
  least ~48px cap height at 1080p).
- **First frame = thumbnail.** Bright, legible and strange enough to stop a thumb.
- **Restraint:** drama from scale, hierarchy, timing and silence. Grain and paper texture are welcome; glow only on a
  fresh win amount. No rainbow gradients, no bloom soup.
- **End card** (all films): the Yochi seal stamping down + YOCHI + yochigg.xyz, on paper or sumi, held at least 2.5s, readable muted. A short
  invitation line is allowed if your prompt gives one.

## Music

- If your prompt names a track and it exists in `asset-pack/audio/`, measure it (BPM, bar grid, hits, silences, drops)
  into a single timing-map module, the way `film/src/core/music.js` does.
- If it doesn't exist, build to the placeholder timing map your prompt describes and render a click track so the cut
  can be judged. Keep every timing in that one module so a real track drops in by remeasuring, not by re-editing
  scenes.
- AI-generated tracks won't hit every beat where the sheet wants it. You may trim, loop a bar, and cut hard silences or
  tape-stops into the audio. Pick the strongest section rather than starting at 0:00. Do the edits in code or ffmpeg
  so they're reproducible, and keep them in the timing-map module.

## Process

- Before building, write `<your-dir>/TREATMENT.md`: the idea in one line, world rules, a beat sheet with timings against
  the music, the end card copy, the kanji list, and "Decisions and open questions".
- Review as you go with stills and contact sheets at 960×540. Check the first 2 seconds, the silence or stamp beat and
  the end card at phone size before the full render. Look at your own stills critically and fix what's weak.

## Deliverables (`<your-dir>/deliverables/`)

- `<name>.mp4`: 1920×1080, 30fps, H.264 + AAC, the full film.
- `<name>-poster.jpg`: the thumbnail frame.
- `<name>-contact.jpg`: a contact sheet, one frame per second.
- `<name>-vertical.mp4`: 1080×1350 (4:5) recomposed, not just cropped (last priority).
- `README.md`: render commands, the track used and how it was edited, and anything unfinished.
