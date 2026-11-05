# YOCHI: the first ad (5 Nov)

Branch `claude/yochi-first-ad`, cut from `claude/yochi-flagship-final-edit` (b07a6e7). Both earlier films are untouched:
the approved flagship (`claude/yochi-flagship`, `deliverables/yochi-flagship.*`) and the final edit
(`claude/yochi-flagship-final-edit`, `deliverables/yochi-flagship-final-edit.*`). This film is
`deliverables/yochi-first-ad.*`.

**The brief, restated:** the first advertisement for a competitive crypto game nobody has heard of. Understand the
premise almost immediately, get pulled into the competition, want to try it. Not a rebrand film, not a roster film.

**Length:** 39.7 s (was 54.6). Same track, cut by two whole 4-bar phrases (see Music).

---

## The story (the player's experience)

| Time | Beat | What a newcomer reads |
|---|---|---|
| 0.0 | A stranger's painting, **THE NEXT HYPE CANDLE · exit_liquidity PICKS ▼ DOWN** (stamped 決) | someone is betting the price goes down |
| 1.7 | Smash cut on the bass: **YOU ▲ UP** | you're betting against them |
| 3.4 | The two picks land on paper; a strike line tears across (`HYPE NOW 41.83`), you sort above it, they sort below; **"Whoever's right takes the pot."** | the whole game in one diagram |
| 5.1 | The ink drop on the line floods the page | |
| 5.5 | **The Duel standoff** (the app's): you on vermilion, your nemesis on ink, 対, `POT 20 USDC · WINNER TAKES IT`, PICKS OPEN IN | it's a 1v1 fight |
| 8.0 | It collapses into the versus band; **DUEL** slams in | the mode's name |
| 9.3 | The board: chart, timer, you lock UP, they lock DOWN | the real game |
| 11.0 | The board strips to the candle and the strike, `−0.006`, **0:01** held through silence | you're losing, by a hair |
| 12.4 | The drop: the candle snaps UP; **CALLED IT**, **+19 USDC**; they go grey, 敗 | you won real money |
| 15.2 | **FREE FOR ALL**: a room of 24 split either side of the line, it closes UP, the up side's winnings rise, the down side goes grey (`IT CLOSED UP · THE UP SIDE SPLITS THE POOL`) | a second way to play |
| 17.5 | **BATTLE ROYALE**: ten seats, two lives each, two rounds take it to five | a third |
| 18.6 | The final round's **verdict** (the app's): `▼ CLOSED DOWN`, each player judged in turn, four grey 敗, then you, 勝, LAST ONE STANDING | survival, in a beat each |
| 22.3 | **Last one standing**, CALLED IT, 勝, **+95 USDC** | |
| 23.6 | 連勝 climbs 7, 8, 9, **10** | winning streaks count |
| 24.5 | The **legendary unlock** (the app's): the gold glyph, the sheet unrolls, COLD BLOODED, LEGENDARY | the streak earned something |
| 27.0 | **COLD BLOODED, WIN 10 IN A ROW**: your player chip flips to the new face; **"Win streaks earn you new faces."** | progression, in plain words |
| 28.7 | The real landing page: tagline, the free practice round stamps CALLED IT, ENTER YOCHI is pressed | you can try it now, free |
| 31.2 | The ink signature: the brush tears the page, the ink gathers onto the Y | |
| 33.7 | The seal stamps over it; **YOCHI · Call it right. Take the pool. · yochigg.xyz · LIVE ON HYPEREVM · NEXT CANDLE · YOUR CALL**, held 6 s | |

## Characters

Three named presences, as the story needs: **you** (Perma-Bull's painting), **your rival** (Doomer's), and **the face
you earn** (Cold Blooded). The FFA room and the Battle Royale seats use other paintings as faces in a crowd; nobody
is introduced. Gone: the roster, character select, the takes, the hero singles, the gallery, the ladder grid.

The duel band now names the players as the film introduced them (**YOU** / **exit_liquidity**), not the avatars
(PERMA-BULL / DOOMER), since avatar names mean nothing to a newcomer.

## What was kept

The strongest cinematic moments, as built: the Doomer thumbnail composition, the bass-entry smash cut, the strike
line and ink-drop flood, the standoff and its collapse into the cinematic band, the final second (strip, macro,
margin, held 0:01, silence, drop), CALLED IT and +19, the FFA close, the BR verdict and win, the legendary unlock,
the face swap, the product page, and **the whole ending** (the tear, the gather, the seal, the end card) unchanged.

## Decisions

1. **One round, not best of 3.** One candle decides is the clearest premise; the round call-out (and the best-of-3
   build) stays on the final-edit branch.
2. **The verdict is the final round.** You're judged last and you're the one left, which goes straight into
   "Last one standing" (it was a mid-game round plus one more on the roster).
3. **Plain-English supers, three of them**, because the film must work muted: "Whoever's right takes the pot.",
   the mode names (DUEL, FREE FOR ALL, BATTLE ROYALE), and "Win streaks earn you new faces." Everything else is the
   game's own UI copy. None uses "call" (the copy rules); none is the banned "X. Y." two-liner.
4. **No push on the FFA close** (the approved film had one): at this pace the caption under the room needed to stay
   clear.

## Music

`src/core/music.js` (`SEGMENTS`), built by `tools/audio.mjs` (each splice a 12 ms equal-power crossfade):

- **Source bars 7 to 10 cut** (12.99 to 19.74 s, the first half of the build). The groove now drops straight into
  the build's last two bars, where the bass thins out. The splice is under the DUEL slam (8.43 s).
- **Source bars 22 to 25 cut** (38.29 to 45.03 s), one 4-bar phrase of the drop groove. The splice is under the
  cut to Cold Blooded (26.99 s).
- Everything else is the approved edit: start at source bar 2, the 0:01 dropout, the drop kick, the end card's seal
  on source bar 30's downbeat (the bass dip), now with a 6 s hold and a 2.4 s fade.

Both cuts are whole bars on 4-bar phrase lines (measured: bars 14 to 28 are one steady groove), so the bar grid
stays regular and the drop pattern keeps its phase. Verified on the built audio: silence from 11.55 to 12.42 s, the
drop kick at 12.42 s, and no level step at either splice.

## Kanji

予知 is not used. In the film: 決 (picks, 0.0 and 1.7), 対 (standoff and band, 6.7 to 13), 敗 (13.5; the verdict,
19 to 22), 勝 (verdict and BR win, 21 to 23; the streak, 23.6 to 24.5), 連勝 (23.6), and one from the app's registry
that the shared rules don't list: **氷** (Cold Blooded's legendary glyph and seal, 24.5 to 27). 残 is gone (the only
survivor in this verdict is the winner, whose seal is 勝). All pending the native review, as before.

## Tradeoffs

- **The paintings are a supporting cast now.** Someone who'd fall for the art sees three paintings large, not
  twenty-eight. THE CAST is still the film for that.
- **No round call-out, no Untouchable**: both are good moments that the story didn't need.
- **Denser per second**: five ideas land before the drop. The pacing is the music's, but there is less air.
