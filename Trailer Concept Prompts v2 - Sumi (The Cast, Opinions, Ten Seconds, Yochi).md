# Yochi trailer concept prompts, v2 (Sumi rebrand)

28 Oct 2026. Replaces the 17 Oct prompts (`Trailer Concept Prompts - Opinions, Ten Seconds, Last Light, Yochi.md`),
which were written for the retired cyan brand. Four films, one prompt each, for four cloud Claude sessions on the
`yochi-trailer` repo running in parallel.

| Film | Directory | Job | Changed from v1 |
|---|---|---|---|
| **THE CAST** | `film-cast/` | Acquisition: the painted cast as a fighting-game roster, starter to reward | New |
| **OPINIONS** | `film-opinions/` | Acquisition: the viewer's own takes, given somewhere to count | Re-skinned to ink on paper; losers grey; stamp payoff |
| **TEN SECONDS** | `film-ten-seconds/` | Acquisition and bumper: a close finish, stretched | Re-skinned to sumi; picks as seals; stamp payoff; adds a bumper |
| **予知** | `film-yochi/` | Rebrand reveal: "Yochi has a new face" | Retargeted from acquisition to reveal; paper; ends on the real UI |

LAST LIGHT is shelved: its Battle Royale story now lives inside THE CAST.

---

## Before you fly (do these in order)

1. **Push the Sumi asset pack.** It's staged on the `sumi-asset-pack` branch in `~/yochi-trailer` (fonts, logo SVGs,
   all 28 painted avatars, reference screens, brand tokens, and `SHARED-RULES.md`). Cloud sessions can only see what's
   on GitHub, so this has to land on `master`:

   ```bash
   cd ~/yochi-trailer
   git commit -m "Sumi brand kit for trailers: fonts, Y mark, painted cast, reference screens, shared rules"
   git push -u origin sumi-asset-pack
   # then merge it into master (PR on GitHub, or):
   git switch master && git pull && git merge --ff-only sumi-asset-pack && git push
   ```

2. **Music (optional).** THE CAST uses the existing `asset-pack/audio/trailer.wav` unless `the-cast.wav` is there. The
   others build to a placeholder click track unless you drop `opinions.wav`, `ten-seconds.wav` or `yochi.wav` into
   `asset-pack/audio/` and push before starting. The Suno prompts doc in this folder still applies (ignore its colour
   notes).

3. **Start four cloud sessions** on `yochi-trailer`, base branch `master`, and paste one prompt into each. The prompts
   tell the sessions they're unattended: they won't wait for answers, they log decisions in their TREATMENT.md, and
   they push after each milestone.

4. **When you land:** each film's branch has `film-<name>/deliverables/` (16:9 film, poster, contact sheet, and the
   4:5 vertical if time allowed) and a TREATMENT.md listing every decision and kanji used. Kanji still need the
   November native review before anything is posted.

---

## SHARED RULES

This block is also committed as `asset-pack/sumi/SHARED-RULES.md`, and every prompt tells the session to read that
file. It's reproduced here so you can review it. If you edit it, edit the repo copy before starting the sessions.

````markdown
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
````

---

## Prompt 1: THE CAST

```text
Make a new trailer for Yochi, rendered entirely in code, in this repo. Working title: THE CAST. Directory: film-cast/.
Deliverable name: the-cast.

SETUP
First read asset-pack/sumi/SHARED-RULES.md and follow it exactly; it covers what Yochi is, the goal, the brand, the
copy rules, the engine, the process and the deliverables. Then read asset-pack/sumi/README.md (the brand kit, including
the cast table). If asset-pack/sumi/ is missing, run `git fetch origin sumi-asset-pack` and check out that branch's
asset-pack/sumi/ before anything else. You are unattended: never stop to ask, log decisions in TREATMENT.md.

THE CONCEPT
Everyone in crypto is a type. Yochi has painted all of them, and they fight.

The film is a fighting-game roster made of the 28 painted characters in asset-pack/sumi/avatars/. It runs on two
hooks, and both must land:
- Identity: the 10 free starters (Perma-Bull, Doomer, Night Shift, Lucky Fool, Strategist, Degenerate, Bagholder,
  FOMO, Paper Hands, Contrarian) are everyday degens. The viewer should recognise themselves, or their group chat,
  inside two seconds.
- Aspiration: the 18 rewards (swordswomen, a ronin, a whale, a fox-masked card sharp, a thief with the pool) are
  the most striking paintings in the set and are earned by playing. The viewer should leave wanting one.
The story is a starter fighting their way up: you start as one of these, you play, and you earn one of those.

World:
- Paper ground for the roster and the end card; sumi ground for the fights. The switch from paper to sumi is the
  moment a match starts.
- The paintings are stills. Bring them to life with 2.5D: mask the figure from its ink-disc background, split into a
  few depth layers where it works, then parallax, push-ins, whip pans, hard cuts, slashes and stamps. Do not try to
  animate faces or limbs. Don't repaint or recolour the characters.
- Each starter has a name plate (Dela Gothic One) and one take in their own voice. Drafts, which you may sharpen
  within the copy rules:
  Perma-Bull "never selling" · Doomer "it's over" · Night Shift "one more candle" · Lucky Fool "i don't know what i
  did" · Strategist "i have a plan" · Degenerate "max size" · Bagholder "it'll come back" · FOMO "wait for me" ·
  Paper Hands "i'm out" · Contrarian "everyone's wrong".
- Fights use the real game language: the versus band with the vermilion slash and 対, ROUND 1, the arcade timer, a
  real-looking HYPE candle chart (green/crimson OHLC, dashed strike line), UP / DOWN pick buttons with the 決 seal on a
  locked pick, the CALLED IT stamp on the winner, the loser fading to grey with 敗. See reference/screens/mock-duel.png,
  real-duel-picking.png, real-br-picking.png and real-br-win.png.

Beats (cut to the music):
1. 0-2s: Doomer, huge, filling the frame on paper, with "it's over" in Dela big enough to read on a muted phone. This
   frame is the thumbnail. Smash cut on the next hit to Perma-Bull: "never selling".
2. The roster: the other eight starters slam in one per beat, each with its take, until the character-select grid
   of ten sits on paper. Beside it, a second grid of 18 locked slots shows the rewards as dark ink silhouettes, so the
   viewer clocks straight away that there's more. A selection cursor moves across the starters. Caption: "Pick your
   degen."
3. The cursor locks Perma-Bull: a vermilion 決 seal stamps on the card (vermilion = you). The opponent locks on
   Doomer.
4. Ground flips to sumi. The versus band slams in: PERMA-BULL 対 DOOMER, ROUND 1, with the arcade timer draining. Both
   picks lock: UP vs DOWN. The candle runs. At 0:01, hard silence and stillness.
5. It closes UP. CALLED IT stamps down on Perma-Bull's side with the impact shake; "+19 USDC" rises in green. Doomer
   fades to grey, 敗.
6. Climbing, fast, two or three seconds each, showing the other modes without explaining them. The opponents get
   tougher, and they're wearing reward faces, because veterans do:
   - a Free For All where a crowd of faces splits UP vs DOWN either side of the strike line and one side lights;
   - a Battle Royale lobby of ten (a few starters, mostly rewards: Bloodsport, Last Legend, Ronin, Whale...)
     losing 命 lives and going grey one by one until the underdog starter is the last one standing and gets stamped
     ("Last one standing", +95 USDC).
7. The unlock, the film's second payoff: a streak counter ticks to 5 (連勝), an achievement banner lands in mono
   ("UNTOUCHABLE · WIN 5 IN A ROW"), and a new card deals into frame and flips: the Untouchable painting, full size,
   in glory. This is earned, not a transformation: Perma-Bull gains a new face, not a costume change. Show the
   unlock rule exactly as written; don't invent new unlock conditions.
8. The ladder: the reward grid lights up one painting per beat, the most striking ones held longest (Cold Blooded,
   Duel Master, Grudge Settled, Took the Pool, Whale, Ronin), each with its unlock as a small mono caption
   (e.g. "WIN 10 IN A ROW", "WIN 10 DUELS", "BEAT YOUR NEMESIS IN A DUEL", "WIN 250 USDC IN A SINGLE ROUND"). Unlock
   rules are in the README's cast table; copy them, don't paraphrase the numbers. A one-line caption about starting
   with ten and earning eighteen: write it yourself, and avoid the banned "X. Y." staccato shape.
9. A 2-3s cut into the real product (rebuilt from the reference screens): the paper landing with ENTER YOCHI, or the
   win stamp screen.
10. End card on paper: the grid of ten starters small and faded behind, the Yochi seal stamping down, YOCHI, "Which one are you?", and
   yochigg.xyz. Under the URL in small mono: "TRY A ROUND · NO WALLET NEEDED".

Thumbnail: make two posters and keep both in deliverables: the-cast-poster.jpg (Doomer, "it's over") and
the-cast-poster-reward.jpg (the strongest reward painting, e.g. Cold Blooded, with its unlock line). Note in the README
which you'd pick and why.

Why this should work: it's about the viewer and their friends, not the product, and it invites replies ("which one
are you?"), which is what X rewards. It shows all three modes in a few seconds through a language every gamer already
reads (character select, versus screen, K.O.). The rewards are the best art Yochi has, and showing them as something
you earn gives a reason to start and a reason to keep playing; picking a free face is a natural reason to connect a
wallet.

Care:
- Keep it funny. The takes are affectionate, not mean.
- Treat the female characters with the same respect as the male ones: no lingering, no fan-service framing.
- The Doomer opening must not read as a downer: the cut to Perma-Bull is the joke, so time it tight.

Music: use asset-pack/audio/the-cast.wav if it exists, otherwise asset-pack/audio/trailer.wav (Matt's own high-energy
electronic track with female vocals; see asset-pack/audio/music-structure.md, but measure it yourself). Character
slams land on hits; the 0:01 silence in the fight wants a real dropout; the stamp lands on a downbeat.

Length: 45-55s (the unlock beat needs room).

Extra deliverable if time allows after everything else: a 6-second short per starter (the-cast-<name>.mp4, 1080×1350):
portrait push-in, name plate, take, a quick stamp, "Which one are you?" and yochigg.xyz. These become a daily series.
```

---

## Prompt 2: OPINIONS

```text
Make a new trailer for Yochi, rendered entirely in code, in this repo. Working title: OPINIONS. Directory:
film-opinions/. Deliverable name: opinions.

SETUP
First read asset-pack/sumi/SHARED-RULES.md and follow it exactly; it covers what Yochi is, the goal, the brand, the
copy rules, the engine, the process and the deliverables. Then read asset-pack/sumi/README.md (the brand kit). If
asset-pack/sumi/ is missing, run `git fetch origin sumi-asset-pack` and check out that branch's asset-pack/sumi/
before anything else. You are unattended: never stop to ask, log decisions in TREATMENT.md.

THE CONCEPT
The internet's free opinions on HYPE, given somewhere to count.

Everyone on crypto Twitter posts market takes all day, for nothing. This film is made of those takes. Kinetic
typography is the whole set: no characters, no painted avatars (another film uses those; this one must stay
type-only), no crowd.

World:
- Paper ground with its fibre texture. The takes are set as ink: Dela Gothic One for the loud ones, Zen Kaku Gothic New
  for the quieter ones, JetBrains Mono for any numbers. Ink weight and size vary like voices in a room.
- One strike line across the middle: a single dry-brush ink stroke with a small vermilion node, as on the landing
  page.
- Text that reads like posts and takes, without imitating X's interface or any real account. Invented, anonymous,
  short, funny, true to how degens actually write: "HYPE breaks 50 this week", "top is in", "send it", "this is the
  dip", "bears r fuk", "never selling", "it's over", "we're so back", "chart looks heavy", "free money".
- The takes pile into two physical walls of text: one leaning up above the strike line (UP takes) and one sinking
  below (DOWN takes). The type has weight and collides.

Beats (length 30-40s, cut to the music):
1. 0-2s: one line, alone and huge, ink on paper, readable at phone size on a muted autoplay: "HYPE breaks 50 this
   week." This frame is the thumbnail, so make it arresting.
2. The second take answers it. Then a third. Then the flood, building with the music, until the paper is dense with
   opinion.
3. The text sorts itself: UP takes rise and stack above the strike line, DOWN takes sink and stack below.
4. The walls fight. Words tear loose and stream across the line. Peak density, peak noise.
5. The candle opens. Hard cut from paper to the sumi ground, silence and stillness: everything freezes mid-air in
   cream ink on warm black, with one real candle (green/crimson OHLC) forming at the strike line. Hold it long enough
   to hurt. The switch from paper to sumi means "now it's real".
6. Resolution: the losing wall goes grey and crumbles into ink dust. One take from the winning wall is pulled forward,
   CALLED IT stamps onto it in vermilion with the impact shake, and the letters compress into a single green payout,
   e.g. "+18.40 USDC" (plausible dramatisation).
7. A 2-3s cut into the real product (rebuilt from reference/screens/mock-win-stamp.png or real-landing.png).
8. End card on paper: "You already have an opinion on the next candle." Then the Yochi seal stamps down beside YOCHI and yochigg.xyz, and in
   small mono "TRY A ROUND · NO WALLET NEEDED". The first line is approved; use it exactly.

Why this should work: it's about the viewer, not the product. The viewer recognises themselves in the first two
seconds, and the ending reframes something they already do for free.

Kanji: none are needed. If you use one, it is 決 or 勝 on the stamp, nothing else.

Music: use asset-pack/audio/opinions.wav if it exists. Otherwise build to a placeholder timing map at about 140 BPM
(half-time feel) with a clearly marked drop and a hard silence for the candle-open beat.
```

---

## Prompt 3: TEN SECONDS

```text
Make a new trailer for Yochi, rendered entirely in code, in this repo. Working title: TEN SECONDS. Directory:
film-ten-seconds/. Deliverable name: ten-seconds.

SETUP
First read asset-pack/sumi/SHARED-RULES.md and follow it exactly; it covers what Yochi is, the goal, the brand, the
copy rules, the engine, the process and the deliverables. Then read asset-pack/sumi/README.md (the brand kit). If
asset-pack/sumi/ is missing, run `git fetch origin sumi-asset-pack` and check out that branch's asset-pack/sumi/
before anything else. You are unattended: never stop to ask, log decisions in TREATMENT.md.

THE CONCEPT
The last ten seconds of one Free For All candle, stretched across a minute.

Bullet-time, macro, almost abstract. The film is the feeling of a close finish: price hovering at the strike line with
your money on it. No characters, no painted avatars, no crowd.

World:
- Sumi ground (warm black), shot like a dark studio. Faint paper-fibre grain in the shadows.
- The strike line is a physical object: a dashed cream-ink line with a small vermilion node, lit like an object in a
  lab.
- The price is a single point of light, drifting just above the line, then just below, filmed like a particle in a
  physics experiment: shallow depth of field, slow camera orbits, motion trails. Behind it, the current candle body
  grows and shrinks (green above the strike, crimson below), soft and out of focus.
- Around it, the round frozen in slow motion: the pool total caught mid-tick (JetBrains Mono), and everyone's picks
  hanging in the dark as small seals, ink-outlined, above the line for UP and below for DOWN. Exactly one seal is
  vermilion with 決 on it: yours, on the UP side. These are fragments in space, not a UI layout.
- The timer is the arcade timer: huge Dela Gothic One seconds with JetBrains Mono tenths and a vermilion drain bar.
- Sound design leans on a low heartbeat pulse that the music grows out of.

Beats (length 45-60s, cut to the music):
1. 0-2s: the timer reads 0:09.8 and the point of light sits a hair above the line. One burned-in caption so a muted
   viewer knows what this is: "UP or DOWN. Ten seconds left." This frame is the thumbnail.
2. Each second of market time gets its own shot and its own beat. 0:09 to 0:05: the point crosses the line, crosses
   back, the camera orbits it. The pool ticks. More seals appear in the dark.
3. 0:05 to 0:02: the pulse quickens, the camera closes in, the gap between the point and the line shrinks to a hair.
   Your vermilion 決 seal drifts into the foreground.
4. 0:01: everything holds. Total silence.
5. 0:00: it closes one tick above. Release: the DOWN seals go grey and fall away; CALLED IT stamps down over your seal
   with the impact shake and a little ink splatter; the green payout rises (e.g. "+42.60 USDC", plausible).
6. Breath. A 2-3s cut into the real product (rebuilt from reference/screens/mock-win-stamp.png: the result card with
   CLAIM and "NEXT ROUND OPENS IN 0:42"). Then a live-feeling countdown fills the frame: "Next round opens in 0:12",
   ticking.
7. End card: the Yochi seal stamps down, YOCHI, yochigg.xyz. Line: "Call it right. Take the pool." (approved).

Why this should work: pure tension and release, which makes the viewer feel a close finish without explaining
anything. Ending on "the next one is about to open" makes clicking now feel urgent.

Kanji: 決 on your seal only.

Music: use asset-pack/audio/ten-seconds.wav if it exists. Otherwise build to a placeholder timing map at about 90 BPM,
heartbeat-led and accelerating, a long build, a hard silence at 0:01 and a release at 0:00.

Extra deliverable after the main film: ten-seconds-bumper.mp4, a 10-12s cut (1080×1350 and 1920×1080) from 0:03 to the
stamp to the end card, built to loop cleanly, for replies and ads.
```

---

## Prompt 4: 予知 (THE REVEAL)

```text
Make a new film for Yochi, rendered entirely in code, in this repo. Working title: 予知. Directory: film-yochi/.
Deliverable name: yochi.

SETUP
First read asset-pack/sumi/SHARED-RULES.md and follow it exactly; it covers what Yochi is, the goal, the brand, the
copy rules, the engine, the process and the deliverables. Then read asset-pack/sumi/README.md (the brand kit). If
asset-pack/sumi/ is missing, run `git fetch origin sumi-asset-pack` and check out that branch's asset-pack/sumi/
before anything else. You are unattended: never stop to ask, log decisions in TREATMENT.md.

THIS FILM'S JOB
This is the rebrand reveal. Yochi's app is changing from a cold cyan "trading terminal" look to Sumi: a Japanese game,
ink and paper, vermilion seals. The film announces that to people who already follow Yochi and introduces it to
people who don't. It is the most brand-led of the four films, so it carries a known risk: Matt's own note on the
rebrand is that "cultured isn't enough, it must say game". The ink is the hook; the versus band, the stamp and the
money are the proof that this is a game you play for USDC. Both halves must be on screen.

THE CONCEPT
The name made literal. 予知 means foresight, "knowing before". The film is ink on paper, mostly negative space (ma),
calm, then sudden.

World:
- Paper ground with its fibre texture, ink #16130f, vermilion only for the seals (CALLED IT, 勝, the Yochi seal). Green and
  crimson only for real candles.
- The craft centre: a convincing procedural brush and ink look (loaded brush, dry-brush breakup, bleed into the
  fibres, splatter). Use it for the strike line, the ghost stroke, the kanji and transitions. Never for candles:
  candles stay standard OHLC candles even here.
- The one exception to the colour rules: the first 1.5 seconds show the old brand (the cyan Y mark on near-black) so
  that it can be painted over. After that, no cyan anywhere.

Beats (length 30-40s, cut to the music):
1. 0-2s: the old cyan Y mark (asset-pack/sumi/logo/yochi-mark-original-cyan.png) glowing on near-black, and a loaded
   ink brush tearing across it from the side, mid-stroke, covering it in black ink on paper. This frame is the
   thumbnail: half cyan, half ink, caught mid-stroke. It should read as "something just changed".
2. The new stroke settles as the strike line on paper. Calm: a few small marks, lots of empty space.
3. Sudden: a fast stroke, splatter, and a real candle chart begins to form along the strike line.
4. The foresight beat: a faint grey ghost stroke draws upward ahead of time; a beat later the candles follow its path
   exactly and the candle closes green. CALLED IT stamps down in vermilion with the impact shake; "+24.00 USDC" rises
   (plausible dramatisation).
5. Repeat once, faster, on a DOWN candle (ghost stroke down, the candles follow, a 勝 seal stamps), so it reads as skill
   rather than luck.
6. Proof that it's a game, fast, two seconds each, rebuilt from reference/screens/: the duel versus band slamming in
   with the vermilion slash and 対; a Battle Royale roster with 命 lives going grey; the win stamp screen.
7. The strokes gather and paint 予知, large and calligraphic, in correct stroke order.
8. The ink of the kanji gathers into the same double-line Y the film opened on, now in ink, and the Yochi seal
   (yochi-seal-paper.svg) stamps down over it in vermilion: the old mark, reborn. End card on paper: YOCHI, "予知 · foresight",
   yochigg.xyz, and a short reveal line. Draft: "Yochi has a new face." Propose two or three alternatives in
   TREATMENT.md that follow the copy rules (no "X. Y." staccato, no "Saw it coming"), and keep the line in one constant
   so Matt can swap it.

Kanji: 予知, 勝 and 対 only.

Cultural care: handle the calligraphy respectfully and well. Correct stroke order for 予 and 知. No faux-Japanese
fonts, no clichés (no gongs, cherry blossom, torii). Taiko-like percussion is fine if it isn't a cliché.

Music: use asset-pack/audio/yochi.wav if it exists. Otherwise build to a placeholder timing map at about 90 BPM: sparse,
percussive accents with real silences between strokes, a hit for the paint-over at 0:01, and a swell for the 予知
reveal.
```
