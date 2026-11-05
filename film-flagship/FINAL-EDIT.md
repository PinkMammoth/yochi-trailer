# YOCHI flagship: final editorial pass (5 Nov)

Branch `claude/yochi-flagship-final-edit`, cut from `claude/yochi-flagship` (950e92a). The approved film is untouched,
both on its own branch and here (`deliverables/yochi-flagship.mp4`, `-poster.jpg`, `-contact.jpg`). The revised film
is a separate set of files (`deliverables/yochi-flagship-final-edit*`). Same track, same audio edit, same 54.6 s.

**The question:** does it make someone who has never heard of Yochi want to play? The approved cut spent its first
11.8 s (22%) on the cast, and the game's most distinctive moments (the standoff, the verdict, the unlock) were absent
or stood in for by cinematic substitutes. This pass moves those 11.8 s into the game, using the app's own moments.

**Spine:** Competition, then Players, then Gameplay, then Consequences, then Yochi (Sol's framework, kept). The
competition and the players arrive together in the first frame.

---

## The new timeline (film seconds, every event on the original 142.3 BPM grid)

| Time | Approved flagship | Final edit |
|---|---|---|
| 0.0 to 5.1 | Doomer "it's over", Perma-Bull "never selling", 7 more catchphrase slams (to 8.4) | **Players lock their picks.** The same smash-cut slams, but the big word is each player's pick for the next HYPE candle: Doomer **▼ DOWN**, Perma-Bull **▲ UP** (you, `mamo`), then six more starters, one per beat. Each pick stamps 決. Name plate plus the player's handle; "HYPE · NEXT CANDLE" over each. No catchphrases |
| 5.1 to 6.7 | (character select, 8.4 to 11.8, cut) | **The line.** Those players' picks collide on paper, the dry-brush strike line tears across, they sort UP above and DOWN below (`+ 17 MORE`, `+ 9 MORE`) |
| 6.7 | the ink drop at 13.5 | **The ink drop** onto the strike's vermilion node floods the page (the approved transition, 6.7 s earlier) |
| 7.2 to 10.1 | (absent) | **The Duel standoff**, rebuilt from `duel-standoff.tsx`: the halves slide in along the slash (you on vermilion, your nemesis on ink), faces rise, names brushed in, `LV 4 · TRADER` / `GRUDGE 3-2`; **対 stamps on the seam on the build's downbeat (8.43)** with the flash and the hit; `POT 20 USDC · BEST OF 3`; `PICKS OPEN IN 2, 1` |
| 10.1 to 11.8 | versus band slides in, ROUND 1 | **The standoff collapses into the versus band** (as in the app). Fighters break the band's edge, ROUND 1: the approved cinematic band, now born from the real one |
| 11.8 to 13.5 | (the takes) | **Round 1**: the band rises into the header, the board, both lock, it closes UP, 勝 into your tally (1 - 0) |
| 14.3 to 15.9 | (absent) | **The ROUND 2 call-out**, rebuilt from `round-callout.tsx` (vermilion slash, stamped title, 1.6 s) |
| 15.2 to 21.9 | board, final second, freeze, drop, CALLED IT, +19, 敗 | **The same**, as round 2: the board strips to the candle, `−0.006`, 0:01 through the dropout, CALLED IT on the drop, the second 勝, 2 - 0 |
| 21.9 to 24.2 | FFA | **unchanged** |
| 24.2 to 25.3 | Battle Royale roster, a life per beat (to 28.7) | The roster: two fast rounds take ten to five |
| 25.3 to 29.2 | (absent) | **The round verdict**, rebuilt from `br-verdict.tsx`: the screen to ink, `▼ CLOSED DOWN` stamped on the slash, `HALF THE ROOM, GONE`, then each player judged on the beat: grey 敗, a strike through the name and a drain for deano, soup and kaze; a cracked 命 for mira; **残 and the lift for you, judged last**. "You're still in", `3 OUT · 2 LEFT`, and it collapses onto the roster. The last round takes mira |
| 29.5 | Last one standing, CALLED IT, +95 (28.7) | **unchanged** (one half-bar later) |
| 30.4 to 32.9 | 連勝 to 5, card deal, Untouchable | 連勝 from 6 to **10**, one 勝 per beat |
| 32.9 to 36.3 | (Untouchable in glory, the face swap) | **The LEGENDARY unlock**, rebuilt from `achievement-unlock-host.tsx` with the app's own beats: the screen to ink, the glyph in gold leaf with drifting flecks (1.25 s); then the paper sheet unrolls, the real badge art (`public/achievements/cold_blooded.webp`) washes in, **LEGENDARY**, COLD BLOODED brushed in, the seal lands with thrown ink and the sheet takes the hit, SHOW BESIDE MY NAME rises |
| 36.3 to 38.8 | Cold Blooded, Duel Master, Grudge Settled, Whale | **Cold Blooded** (REWARD · UNLOCKED, WIN 10 IN A ROW) with the face swap: `mamo`'s chip flips from Perma-Bull to Cold Blooded. Then Duel Master |
| 38.8 to 54.6 | gallery, ladder grid, product, ink signature, end card | **unchanged**, except the end card |
| End card | YOCHI, tagline, yochigg.xyz, NEXT CANDLE · YOUR CALL | the same, plus **LIVE ON HYPEREVM** under the URL, in muted mono |

What's carried over as it was: the duel's final second through 敗, the FFA, the Battle Royale win, the gallery, the
ladder grid, the product page and the whole ink signature (about 23 s). Re-timed only: the ink-drop transition, the
VS band, the BR roster, the streak and Cold Blooded's hero.

## The significant decisions

1. **The pick replaces the catchphrase.** Names alone would have made the opening a pure character showcase again,
   which is the problem we were fixing. Instead the slams keep their rhythm and their painting, and the big word
   becomes the game's own verb. Doomer picks DOWN and Perma-Bull picks UP, so the portraits carry the personality and
   nobody speaks. The first frame (Doomer, **▼ DOWN** stamped 決) is both a better thumbnail and a statement of the
   game. The handles make them players, not fictional characters.
2. **Character select is cut.** Its idea ("10 free, 18 to earn") is said later by the ladder grid, after the viewer
   has seen a face being earned, which is where it lands hardest.
3. **The standoff goes where it lives in the app, at the start of the match, and the approved cinematic band is
   kept as its destination.** The ink-drop transition (note F) still opens the duel; the standoff then collapses
   into the VS band with the fighters breaking its edge, just as the app collapses it into its band. So the beautiful
   transition and the cinematic band both survive, and the literal moment sits between them.
4. **Best of 3, not sudden death.** Moving the duel earlier gave the duel 3.4 s more than it needed before the fixed
   musical freeze. Rather than hold a board, round 1 is played and won, so the app's round-start call-out gets a
   real job ("ROUND 2 · 1 - 0"), the tally fills, and the approved freeze becomes match point. The stakes rise
   without a word.
5. **You are judged last in the verdict.** The app judges in seat order; here the order is set for suspense. The
   mechanics, stamps and copy are the app's.
6. **Legendary rather than Epic.** Untouchable is EPIC in the app (no takeover). Cold Blooded is LEGENDARY, the only
   tier with the full-screen gold-glyph beat, and the film already had its painting. The streak now runs to 10 to
   earn it, the face swap moved onto its painting, and Untouchable (along with Grudge Settled and Whale as singles)
   left the film.
7. **HyperEVM** is one muted line under the URL: identification, no explanation. The product page's own copy
   ("PREDICTION GAMES ON HYPERLIQUID · SETTLED BY HYPERCORE") is the real landing page and stays as it is.
8. **Chat:** not added. Player interaction now comes through the handles, the nemesis eyebrow and the grudge record
   on the standoff, and the room's picks.

## Kanji (needs a decision)

The shared rules allow 予知 対 決 勝 敗 命 連勝. This edit adds two glyphs, both taken from the app's own registry
(`lib/seal-glyphs.ts`, also pending native review there):

| Glyph | Meaning | Where |
|---|---|---|
| 残 | Still standing | the BR verdict: survivors' seals (25.3 to 29.2); the app's BR band also shows it in `real-br-picking.png` |
| 氷 | Cold Blooded's glyph | the legendary takeover (32.9 to 34.1) and the sheet's seal (34.9 on) |

The film cannot represent the app faithfully without them. If the review rejects either, swapping it is one constant
(`GLYPH` in `act4.js`; the seal in `verdict.js`).

## Tradeoffs against the approved film

- **The cast gets less air.** 5.1 s of full-frame portraits instead of 11.8 s, and four reward singles instead of
  four plus Untouchable's glory. Doomer, Perma-Bull, Degenerate, FOMO, Bagholder, Lucky Fool, Contrarian and Paper
  Hands get slams; Night Shift and Strategist appear only in the grids. Anyone who should fall for the paintings is
  still better served by THE CAST.
- **Untouchable's unlock is gone**, including the card flip into her painting, one of the approved film's prettiest
  moments. The legendary unlock is more faithful and more dramatic, but less painterly.
- **The opening is denser.** Two more ideas (picks, the line) land in the first 6.7 s; there is less breathing room
  before the duel.
- **The duel's board now appears twice** (two rounds). The call-out separates them and the second is cut down to the
  final second, but it is more board time overall.
- **Sound design** is unchanged (the synthesised stamp thumps follow the event map, so the BR one moved with its stamp to 29.52): no new effects were added for the standoff, call-out, verdict or unlock (the
  track carries them). Real stamp and brush recordings would still help (see README).

## Review notes (from the render)

See the summary in the hand-off message; contact sheet at `deliverables/yochi-flagship-final-edit-contact.jpg`.
