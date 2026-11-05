# THE CAST: treatment

**One line:** everyone in crypto is a type, Yochi has painted all of them, and they fight. You start as one of ten
everyday degens and you play your way into one of eighteen legends.

Length 54.6 s (picture to 52.2 s, then the end card holds under the music's fade). 1920×1080, 30 fps, plus a
1080×1350 recomposition. Track: `asset-pack/audio/Victory Stamp.mp3` (Matt's call: it was made for this film and
it's the more playful track).

---

## World rules

- **Two grounds, and the switch means something.** Paper (`#f2ece0` + washi fibre) is identity: the roster, the
  unlock, the ladder, the end card. Sumi (`#0f0d0b`) is play: every match. Paper turns to sumi in exactly one
  way: **an ink drop hits the page and floods it**. The match starts the moment the ink lands. Coming back to
  paper (the unlock) is the reverse: the ink drains to reveal the card.
- **The paintings stay paintings.** Each card is masked from its ink-disc ground (BiRefNet matte, cleaned) and
  cut into two depth layers: the figure, and the painting's own background plate (the figure region inpainted).
  They move only as flat cards in depth: parallax, push-ins, whip pans, hard cuts, slams, stamps. No warping
  faces, no puppeted limbs, no recolouring. The only grading is a step to grey for a loss, which is the brand's
  language for defeat.
- **Vermilion is you.** In this film "you" is the Perma-Bull player, `mamo`. Your cursor, your 決, your slash
  side, your CALLED IT, your new face. Nobody else ever gets vermilion. The opponent's cursor is ink.
- **Losses go grey** (`#8f8676` on sumi, `#6e665a` on paper) with the outlined grey 敗 seal.
- **Candles are candles.** Real OHLC, green `#3ddc84` / crimson `#ff4d6d`, a dashed strike line.
- **Type:** Dela Gothic One for every moment (names, takes, VS, ROUND, UP/DOWN, results). JetBrains Mono for all
  numbers and tracked caps labels. Zen Kaku Gothic New for the one sentence. Yuji Syuku for kanji, only inside seals.
- **One skew per scene:** the vermilion slash of the versus band. Everything else is square to the frame.
- **Muted-first:** every key word is ≥ 48 px cap height at 1080p. The takes are the size of the people.

## Cast in the film

Starters (all ten, with their takes, in this order):

| # | Starter | Take | Enters |
|---|---|---|---|
| 1 | Doomer | it's over | 0:00.0, the thumbnail |
| 2 | Perma-Bull | never selling | 0:01.69, the bass entry |
| 3 | Night Shift | one more candle | 0:02.53 |
| 4 | Lucky Fool | i don't know what i did | 0:03.37 |
| 5 | Strategist | i have a plan | 0:04.22 |
| 6 | Degenerate | max size | 0:05.06 |
| 7 | Bagholder | it'll come back | 0:05.90 |
| 8 | FOMO | wait for me | 0:06.75 |
| 9 | Paper Hands | i'm out | 0:07.17 |
| 10 | Contrarian | everyone's wrong | 0:07.59 |

The takes are the drafts from the prompt, unchanged: they're already funny and short enough to read in 0.4 s at
that size. The last three come one per beat, so the roster accelerates into the grid.

Handles (invented): you `mamo`; the duel opponent (Doomer) `exit_liquidity`; the Battle Royale lobby `deano`,
`mira`, `soup`, `kaze`, `rektangle`, `cope_dealer`, `0x9c…e2`, `ape_in`, `lowcap`.

---

## Beat sheet

Film bar n = source bar n + 2. Bar = 1.687 s, beat = 0.422 s. All times live in `src/core/music.js`.

| Film time | Music | Beat | What we see |
|---|---|---|---|
| **0.00** | intro, no bass | **1. Thumbnail** | Paper. Doomer, cut out, filling the frame from the chest up, coffee in hand, looking at you like you just said "wagmi". **"it's over"** in Dela, ink, 300 px, lower third, deadpan. A slow push-in. Small mono plate: `DOOMER · STARTER`. |
| **1.69** | bass enters (bar 1) | **Smash cut** | Perma-Bull, thumbs up, grinning, slams in from the opposite side with a hard 6 px impact shake. **"never selling"**. Same layout mirrored: the joke is the symmetry. |
| 2.53 → 7.59 | the groove | **2. Roster** | The other eight starters slam in one per hit, alternating left and right, each one with name plate and take. Every entry is the same move (a 0.15 s slam from 1.35× with a motion-blur streak, the figure 0.1 s ahead of its own background plate for depth), so the rhythm does the work. The last three come one per beat. |
| **8.43** | build starts (bar 5) | **Character select** | The camera pulls back. All ten land as cards in a 5×2 grid on the left. On the right, an 18-slot grid of **ink silhouettes**: the rewards, locked, each with a small padlock-free dashed seal slot (the brand's "next goal" tone). Caption: **"Pick your degen."** A vermilion cursor steps across the starters on the beat. |
| **11.81** | | **3. Lock** | The cursor stops on Perma-Bull: a vermilion **決** seal stamps on the card (stamp motion, impact shake). `YOU · mamo`. |
| 12.65 | | | An ink cursor locks Doomer: `exit_liquidity`. A small ink 決. |
| **13.49** | bar 8 | **4. Ink** | A single drop of ink falls onto the paper between the two cards and floods it. Paper is gone. |
| 13.91 | | **Versus** | The paper-coloured versus band slams across the frame: Perma-Bull bursting out of the left, Doomer out of the right, both larger than the band. The vermilion slash in the centre carries **対**. Names in Dela: **PERMA-BULL 対 DOOMER**. |
| 15.18 | bar 9 | | **ROUND 1** stamps in mono over Dela. `DUEL · SUDDEN DEATH · HYPE 1M · POT 20 USDC`. |
| 16.02 | | **The board** | The band rises to the top (as in the real Duel screen). Below: the HYPE 1-minute chart with the dashed strike line, the arcade timer **0:05** with a vermilion drain bar, the UP / DOWN buttons. |
| 16.87 | bar 10 | | UP locks for Perma-Bull: **決** stamps on the UP button. |
| 17.29 | | | DOWN locks for Doomer (ink). The live candle wobbles around the strike. Timer 0:03, 0:02. |
| **18.29** | **hard dropout** | **0:01** | The audio cuts to nothing. Everything freezes: the candle mid-wick, the timer on **0:01**, the drain bar a sliver. Held for 0.87 s. |
| **19.16** | **the drop kick** | **5. Close** | The candle snaps closed UP, green, out of the silence. Timer 0:00. |
| **19.77** | the next kick | **CALLED IT** | **CALLED IT** makes contact on Perma-Bull's side (scale 2.8 → 0.9 → 1, −28° → −10°, 0.5 s), the board dims and shakes, ink splatters. |
| 20.01 | | | **+19 USDC** rises in green, the only glow in the film. |
| 20.24 | bar 12 | | Doomer fades to grey, the grey **敗** seal lands on his side. |
| **21.93** | bar 13 | **6. Climbing: FFA** | Whip down into a Free For All: a crowd of 28 painted faces, mostly rewards, split either side of the strike line, UP above and DOWN below; Perma-Bull is among the UP side with a vermilion ring. The candle closes UP: the UP side lights, small green amounts pop over them (`+14.20` on you); the DOWN side greys. `FREE FOR ALL · 5M CANDLE`. |
| **24.46** | | **Battle Royale** | Ten seats in two rows, each a face card with two **命** life seals. Mostly rewards (Bloodsport, Last Legend, Ronin, Whale, Duel Master, Rampage, Cold Blooded...) and our Perma-Bull, the underdog. The rounds tick on the kicks: lives go grey, cards go grey with **敗**, one per hit, until only Perma-Bull is left. `BATTLE ROYALE · 10 SEATS · 2 LIVES · POT 100 USDC`. |
| **28.67** | bar 17 | | **CALLED IT** + **勝**, "Last one standing", **+95 USDC**. |
| **29.52** | | **7. The unlock** | Back to sumi black, centre frame: a **連勝** counter, the streak. Five small 勝 seals stamp in a row, one per beat, and the number ticks 1, 2, 3, 4, **5**. |
| 31.20 | | | The achievement banner lands in mono: **UNTOUCHABLE · WIN 5 IN A ROW**. A card deals in face down (the ink back with the Y mark). |
| **32.05** | bar 19 | | The card flips. The ink drains off the frame to paper: **Untouchable**, full height, the blindfolded swordswoman in her robes, in glory, the figure lifting out of her plate in parallax. Her name in Dela. Then the earned beat: the `YOU · mamo` player chip from the duel slides in and its face swaps from Perma-Bull to Untouchable. Same player, new face. |
| **35.42** | bar 21 | **8. The ladder** | Paper. Six hero rewards, one per two beats, each full height with its unlock in mono: Cold Blooded (WIN 10 IN A ROW), Duel Master (WIN 10 DUELS), Grudge Settled (BEAT YOUR NEMESIS IN A DUEL), Took the Pool (WIN 250 USDC IN A SINGLE ROUND), Whale (REACH LEVEL 5), Ronin (WIN 5 DUELS). |
| 40.48 | bar 24 | | Pull back to the 18-slot grid: the remaining silhouettes light into paintings one per eighth note until all 18 are lit. The 10 starters sit beside them. Caption, in Zen Kaku: **"You start as one of ten and earn the other eighteen."** |
| **43.85** | bar 26 | **9. The product** | The real Yochi landing page, rebuilt at full resolution in the renderer (paper, "Call it right. Take the pool.", ENTER YOCHI with its hard ink shadow, the free practice round with the CALLED IT stamp). A cursor presses ENTER YOCHI on the beat. 2.5 s. |
| **47.23** | bar 28 | **10. End card** | Paper. The ten starters small and faded behind. The **Yochi seal** stamps down on the downbeat with the CALLED IT motion. **YOCHI** in Dela, **"Which one are you?"**, **yochigg.xyz**, and under it in mono, in ink **NEXT CANDLE · YOUR CALL**. Held 7 s (the track fades from 52.2 s). |

## End card copy

- YOCHI (wordmark, Dela Gothic One), with the Yochi seal (`yochi-seal-paper.svg`) stamped
- Which one are you?
- yochigg.xyz
- NEXT CANDLE · YOUR CALL

## Kanji used

| Glyph | Meaning | Where |
|---|---|---|
| 決 | decided (a locked pick) | 11.81 (you lock Perma-Bull), 12.65 (opponent), 16.87 (your UP), 17.29 (their DOWN) |
| 対 | versus | 13.91 to 18.29, in the vermilion slash of the versus band |
| 勝 | win | 28.67 (Battle Royale win), 29.52 to 31.2 (the five streak seals) |
| 敗 | defeat (grey) | 20.24 (Doomer), 24.9 to 28.3 (Battle Royale eliminations) |
| 命 | life | 24.46 to 28.67 (Battle Royale life seals) |
| 連勝 | win streak | 29.52 to 32.0 (the streak counter) |

All pending the November native review. No glyph is animated as being written. 残 ("still standing"), which appears
in the real Battle Royale screen, is **not** on the allowed list, so the rebuilt BR board says `STILL STANDING`
in mono instead.

---

## Decisions and open questions

1. **Track: Victory Stamp, not trailer.wav.** Matt's call. Measured at 142.3 BPM; the film starts at source bar 2
   so the bass entry lands on the Perma-Bull smash cut. The 0:01 silence is a real dropout cut into the audio
   (source 22.85 to 23.70), and it removes the swell, so the drop kick at 23.72 lands out of nothing on CALLED IT.
   The file ends at full energy, so the end card holds under a 2.4 s fade. All of this is in `music.js` and
   `tools/audio.mjs`.
2. **Three hits for the payoff.** The first big kick after the silence (source 23.72) is a pickup, 1.5 beats
   before the drop's first downbeat. The candle closes on it, CALLED IT makes contact on the next kick (24.33),
   and Doomer greys on the downbeat (24.80). Close, stamp, loss: one hit each.
3. **Paintings source:** the 1536×2048 cards, cropped inside the frame. The portraits are 512×683, too soft for
   full-frame shots at 1080p.
4. **Masks:** BiRefNet (via rembg) on each card, one process per card, then cleaned (frame cleared, corners cut,
   islands dropped). Raw mattes are committed in `assets/cast/raw/` so nobody has to rerun the model. Three cards
   (Bug Hunter, Grudge Settled, Lab Rat) came back all-figure because of their busy grounds;
   `tools/cast_mask_fix.py` reruns them on the cropped painting and combines two models. Bug Hunter is clean,
   Grudge Settled keeps her own red brush ground behind her (reads as part of the painting), and Lab Rat is
   still weak, which is why Lab Rat is only ever a grid slot and a face, never cut out at size.
4b. **The plates** (each painting's own ground, for parallax) are the painting with the figure filled by a soft
   push-pull fill, multiplied onto our paper through a radial feather so the painted ink disc sits on the film's
   paper.
5. **"YOU" is Perma-Bull** all the way through the climb (duel, FFA, BR), so the unlock lands on one player's
   journey. The underdog in the BR is our Perma-Bull, among veterans wearing reward faces.
6. **The FFA crowd** uses round crops of the painted faces (starters and rewards). No handles there, it's a crowd.
7. **Untouchable is "earned, not a transformation":** we never morph Perma-Bull into her. The card is dealt and
   flipped, and the player chip's avatar is swapped. Unlock rule copied as written: "Win 5 in a row".
8. **Ladder caption** (the line about ten and eighteen, written to avoid the banned "X. Y." shape): "You start as
   one of ten and earn the other eighteen."
9. **Real product beat:** the paper landing page rather than the win screen, because it's paper (it leads straight
   into the paper end card) and it carries the tagline, ENTER YOCHI and the free practice round.
10. **No 残.** It's in the built BR screen but not on the allowed list (see Kanji).
11. **Silhouettes** are made in the renderer from the mattes (ink fill at ~88%), not separate files.

12. **Kanji inside the paintings:** Grudge Settled's painting has 遊 on her charms. That's the artwork, not our
   type, and the rules forbid repainting, so it stays. Flagging it for the November review anyway.

13. **Motion pass (after the first stills):** every stamp's time now means its moment of contact (the motion's
   first full-size frame, 0.1 s in), so all of them land on their hits; smash cuts are solid on their first frame;
   the ink flood spreads over ~12 frames instead of cutting; the board punches in on the closing candle at the drop;
   the Untouchable reveal is a hard cut on the beat with a slam; the product beat ends by diving into ENTER YOCHI,
   which hands over to the end card's seal (the cut is 0.1 s early so the seal is seen falling).

Open, for Matt:
- The female cast (Lucky Fool, Strategist, FOMO, Contrarian, Untouchable, Cold Blooded, Duel Master, Bloodsport,
  High Roller, In the Green) get exactly the same framing as the men: chest-up or full card, never cropped to the
  body. Worth a check on the contact sheet.
- Which poster: see `README.md` once both are rendered.

## Revision (5 Nov): new paintings, new end-card line

- **Perma-Bull and Cold Blooded have new paintings** (Matt's, in `assets/cast/source/`, same 1536×2048 card format).
  `tools/cast_mask.py` and `tools/cast_prep.py` take a card from `assets/cast/source/<id>.webp` over the kit's when one
  exists; both were re-masked (BiRefNet, clean on both) and re-packed. The new Cold Blooded is a man; the kit's cast
  table still describes the old painting.
- **End-card line:** "TRY A ROUND · NO WALLET NEEDED" became **NEXT CANDLE · YOUR CALL** (one of the three lines the
  copy rules allow "call" in), set in ink rather than muted and up from 26–28 px to 36 px, since it's now the hook,
  not a footnote. "No wallet" lives on the landing page.
- Both films re-rendered.
