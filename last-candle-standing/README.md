# LAST CANDLE STANDING (Yochi Battle Royale)

A 19.2 s vertical trailer for Battle Royale. Ten painted players sit in a ring of sumi ink. Rounds cost them lives
until two are left on their last life. One giant candle settles it, and YOU (Perma-Bull) are the last one standing.
**1080×1920, 60 fps, H.264 + AAC.** Status: **draft for owner review. Not published.**

| file (`deliverables/`) | what |
|---|---|
| `last-candle-standing.mp4` | the film, with sound (score and effects, no narration) |
| `last-candle-standing-contact.jpg` | timed storyboard: a frame every 0.25 s, labelled with time and scene |
| `last-candle-standing-audio.png` | waveform and spectrogram with every beat of the timing map marked |
| `last-candle-standing-poster.jpg` | thumbnail (the last candle at its close) |
| `audio/music.wav`, `audio/sfx.wav`, `audio/mix.wav` | separable stems and the film's mix (48 kHz stereo) |

## The cut

| t (s) | beat | on screen | sound |
|---|---|---|---|
| 0.0 | ink | paper; sumi drops land, spread and swirl until the frame is sumi | six ink drops, a low drone |
| 0.45 | the ten | ten round face crops surface around the ring | ten plucks round the ring |
| 1.2 | **10 PLAYERS** / 2 LIVES EACH | handles and 命 life pips appear | drum hit, two UI ticks |
| 2.8 | ROUND 1 | the chart rises in the ring's centre and lights the ground | the groove starts |
| 3.5 | PICKS LOCKED | ▲/▼ chips on every face; YOU's gets the 決 lock | ten clicks, the lock chime |
| 4.0 | CLOSES IN 0:03…0:01 | the live candle works | clock ticks over a thin riser |
| 4.8 | ▲ UP | the candle closes up | hit, rising zip |
| 5.0 | **4 LOSE A LIFE** / NOBODY'S OUT | four faces flash, one pip each drops | four glass tinks |
| 6.0 | rounds 2–6 (0.8 s each) | ROUND n and the close; the knocked-out paintings slam in, go grey, take 敗; the roster strip loses pips; STILL STANDING 9 → 7 → 4 → 3 → 2. Round 3: **YOU: LAST LIFE** | per round: drum, slam, knock-out crunch, stamp; brush wipes on three cuts |
| 10.0 | **2 LEFT** / ONE LIFE EACH | eight grey faces, two lit | the floor drops to a heartbeat |
| 10.8 | versus | Perma-Bull above, Last Legend below, the paper band: YOU 対 deano, one 命 each | slam, sub boom |
| 11.6 | YOU ▲ UP | 2.5D close-up, punch-in, the 決 seal stamps | stamp, chime |
| 12.0 | deano ▼ DOWN | 2.5D close-up | dark hit |
| 12.4 | **the last candle** | one giant candle over both faces; the arcade timer drains | ticks, heartbeat, riser |
| 13.36 | silence | the candle hangs under the strike (crimson) | **a true dropout, 0.24 s** |
| 13.6 | ▲ UP | 1 paper-white frame, 2 ink-negative frames, shake; the vermilion slash behind the faces; deano greys, his last pip falls, 敗; **deano OUT** | the one huge impact |
| 14.4 | **LAST ONE STANDING** | Perma-Bull in 2.5D, the band; 勝 stamps; **+95 USDC** rises green; OUTLASTED 9 · 7 ROUNDS | the resolution in D major, stamp, coin ticks |
| 16.4 | end card (paper, 2.8 s) | BATTLE ROYALE, UP TO 10 PLAYERS / ONE SURVIVOR; the seal stamps; YOCHI; yochigg.xyz; 18+ · REAL-MONEY GAMEPLAY · PLAY RESPONSIBLY | the seal's stamp, the chord rings out |

## Gameplay accuracy

The match is one table (`remotion/src/data.ts`), and everything on screen is derived from it, so pips, greys and
counts can't disagree. Rules follow the real app (`asset-pack/sumi/reference/screens/real-br-picking.png` /
`real-br-win.png`): 2 lives each, a wrong pick costs one, 10 × 10 USDC entry with 5% rake gives 95, and the win
screen's "OUTLASTED 9 · 7 ROUNDS".

| round | close | lost a life | out | standing |
|---|---|---|---|---|
| 1 | UP | cope_dealer, exit_liquidity, soup, 0x9c…e2 | none | 10 |
| 2 | DOWN | mira, ape_in, rektangle | soup | 9 |
| 3 | DOWN | **YOU** | 0x9c…e2, mira | 7 |
| 4 | UP | | exit_liquidity, cope_dealer, rektangle | 4 |
| 5 | DOWN | kaze, deano | ape_in | 3 |
| 6 | UP | | kaze | 2 |
| 7 | UP | | deano (picked DOWN, last life) | 1 (YOU) |

Everyone loses a life before going out. No round has everyone wrong, which would replay the round in the app, and
the data module throws if an edit makes that happen. The final round is ordinary: two players on their last life,
opposite picks, one right. Picks are shown once they lock, never before.

## Cast (all kit paintings, unaltered)

| handle | painting | why |
|---|---|---|
| **YOU** | Perma-Bull (v2) | YOU in every approved film |
| deano | Last Legend | "Win 10 Battle Royales": the veteran the final is against |
| kaze | Final Three | goes out in 3rd, which is exactly his reward |
| ape_in | Bloodsport | Battle Royale reward |
| 0x9c…e2 | Ronin | |
| rektangle | Untouchable | |
| cope_dealer | Doomer | picks DOWN in round 1, in character |
| exit_liquidity | Contrarian | picks DOWN in round 1, in character; flat crops only (matte defect) |
| soup | Paper Hands | first out (`soup` is his handle in the app's own sample data) |
| mira | FOMO | (`mira` likewise) |

Handles are invented, lowercase, as SHARED-RULES asks. Ring and strip faces use the app's crop windows on the kit
portraits. The montage uses chest-up windows on the kit cards. The 2.5D shots (versus, both close-ups, the hero) are
`yochi-2p5d` `CharacterShot`s: rigid breath and sway, camera push, world light and motes, the house impact on the
locks and the seal. There's no mesh warp, no rig and no face animation. Losses use the house grey.
**Perma-Bull v2 was prepared for `yochi-2p5d` for this film** (`yochi-2p5d/characters/starter-perma-bull/`, the
house BiRefNet matte cut from v2, `84d3dca`). It's reusable by any film, and nothing else in the package changed.

Assets are copied into `assets/` (portraits, cards, logo, fonts), per the repo convention. Provenance: Sumi kit,
`asset-pack/sumi/` (owner, 28 Oct to 5 Nov). None of the retired art is used.

## Kanji

命 (life): life pips throughout, from 1.2 s · 決 (decided): YOU's lock, 3.95 s and 11.65 s · 敗 (defeat, grey):
every knock-out, 6.36–9.6 s and 13.76 s · 対 (versus): 10.8–13.6 s · 勝 (win): 15.2 s. All five are on the allowed
list. The app's 残 ("still standing") is **not** used: it isn't on the list.

## Decisions and open questions

- **Format: 9:16 only, 60 fps.** The brief asked for vertical, and the batch notes allow vertical-first where the
  concept benefits. A ring of ten tall faces, a candle overhead of two faces and a stacked versus are vertical
  compositions. A 16:9 version would need recomposing, not a crop. It isn't made yet, and it's worth doing only if
  this goes to a landscape channel.
- **Runtime 19.2 s** (brief 15 s, batch guide 14–18 s). The extra time buys pacing: 1.6 s to read 10 PLAYERS /
  2 LIVES EACH, a 0.8 s hold on 4 LOSE A LIFE / NOBODY'S OUT (the rule that lives come before elimination), a
  0.8 s 2 LEFT beat before the final, a 0.24 s silence before the close, 0.8 s on deano OUT, and a 2.8 s end card
  (house minimum 2.5 s). The montage is the only rapid passage (0.8 s a round), by design. If it must be shorter,
  the first cut would be the reset beat (0.8 s) and 0.3 s of end card.
- **Copy changed from the brief, for house rules:** "10 ENTER THE ARENA." → **10 PLAYERS / 2 LIVES EACH** ("arena"
  is a banned word, and the new line teaches the lives). "LAST PLAYER STANDING." → **LAST ONE STANDING** (the app's
  own words). "YOCHI BATTLE ROYALE. UP TO 10 PLAYERS. ONE SURVIVOR." → YOCHI · BATTLE ROYALE · UP TO 10 PLAYERS /
  ONE SURVIVOR as separate lines, without the full stops (no "X. Y." slogans).
- **No announcer.** No TTS here would sound natural, and the batch notes say not to use an awkward voice just
  because one is available. The film is designed muted-first, so the narration-free version *is* the film. If a
  real VO is recorded, it goes on its own track (`voice` prop) and the music ducks under it.
- **Music: original**, synthesised in `audio/score.py` (150 BPM, D minor resolving to D major for the win). No
  samples and no licence questions. No gongs or koto pastiche: the Japanese register stays in the type and the ink.
- **Vermilion** only for YOU (ring, pips, lock, YOU: LAST LIFE), the slash (your winning strike) and the seals.
  Other players' life pips are cream, where the app paints everyone's red. That keeps SHARED-RULES (vermilion
  means you) over a detail of the real UI. Worth a look.
- **Impact exceptions** (the style guide's "fight-impact exceptions", used for the final close only): an 18 px
  decaying shake, 1 paper frame plus 2 ink-negative frames. Every other hit uses house values (≤6 px; the montage
  knock-outs use 11–16 px for under 0.5 s, so look at those).
- **Publication status** is a prop: `none` (default, rendered), `coming-soon`, `testnet` (testnet.yochigg.xyz),
  `elysium` (NOW LIVE ON ELYSIUM, and the payout becomes HYPE, since the stake on Elysium is HYPE). Battle Royale
  isn't a launch film, so the master carries no status line. **Don't publish an `elysium` render until mainnet is
  confirmed live.**
- **Charts are fictional** (a seeded random walk around 41.8). The film never presents them as real market data
  or a real match.
- **OPEN_DECISIONS #6:** the URL is set at 68 px mono (cap ≈ 50 px), so it passes the 48 px floor either way.

## Review done

- Stills at 540×960 of every scene, iterated: the chart was moved clear of the ring's labels, the card frame
  ornament was cropped out of the montage windows, the rival's face was moved out from under the versus band, the
  close-ups were reframed so the faces aren't cut (4:5 painting above the pick block), and the final candle was
  enlarged and centred.
- `deliverables/last-candle-standing-contact.jpg`, a frame every 0.25 s of the encoded MP4.
- The audio was checked by analysis only (`last-candle-standing-audio.png`): hits sit on their beats, the
  pre-close silence is digital silence, and the impact is the loudest moment (−0.6 dBFS peak).
  **I haven't heard the soundtrack or watched the film at speed.** This environment has no audio playback or
  real-time viewer, so the mix and the felt pacing need a human pass.
- Type: every line was measured in its font against title-safe (54 px sides, 96 px top and bottom). Nothing is
  auto-shrunk, and no type crosses a face.

## Render

```bash
cd last-candle-standing/remotion
npm install
python3 ../audio/score.py          # stems + mix into ../audio/out
tools/sync-assets.sh               # public/: assets, prepared characters, audio
npx remotion studio src/index.ts   # preview (music/sfx props play the stems)
tools/render.sh ../deliverables/last-candle-standing.mp4 [none|coming-soon|testnet|elysium]
python3 tools/review.py contact ../deliverables/last-candle-standing.mp4 ../deliverables/last-candle-standing-contact.jpg
python3 tools/review.py audio ../audio/out/mix.wav ../deliverables/last-candle-standing-audio.png
```

The full film renders in about 15–20 min on 4 cores (software GL). All timings live in `remotion/src/timing.json`,
which both the film and the score read, so a retime is one edit followed by a re-render of both.
