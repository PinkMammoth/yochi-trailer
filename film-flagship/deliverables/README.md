# YOCHI: flagship trailer (director's cut of THE CAST)

| file | what |
|---|---|
| `yochi-flagship.mp4` | **The film.** 1920×1080, 30 fps, H.264 + AAC, 54.6 s, ~7 Mbps |
| `yochi-flagship-poster.jpg` | Thumbnail: the film's first frame (Doomer, "it's over"), the same stopping power as THE CAST |
| `yochi-flagship-contact.jpg` | One frame per second |
| `yochi-flagship-final-edit.mp4` | **The final editorial pass** (branch `claude/yochi-flagship-final-edit`, for review): same spec, same track, 54.6 s. See `../FINAL-EDIT.md` |
| `yochi-flagship-final-edit-poster.jpg` | Its first frame (Doomer, ▼ DOWN, 決) |
| `yochi-flagship-final-edit-contact.jpg` | One frame per second |

| `yochi-first-ad.mp4` | **The first ad** (branch `claude/yochi-first-ad`, for review): the game for people who've never seen it, 39.7 s, same spec. See `../FIRST-AD.md` |
| `yochi-first-ad-poster.jpg` | Its first frame |
| `yochi-first-ad-hook.mp4` | **The hook revision** (branch `claude/yochi-first-ad-hook`, for review): UP OR DOWN? opening, Duel Master reward, 41.4 s. See `../HOOK.md` |
| `yochi-first-ad-hook-poster.jpg` | At 1.3 s, all three words up |
| `yochi-first-ad-hook-contact.jpg` | One frame per second |
| `yochi-first-ad-copy.mp4` | The approved 41.4 s cut with only the FFA caption fix (HYPE CLOSED UP · …), branch `claude/yochi-first-ad-copy`. Poster and contact sheet beside it |
| `yochi-first-ad-contact.jpg` | One frame per second |

The approved `yochi-flagship.*` files are the fallback and were not re-rendered. The final edit's files replace nothing.

The 4:5 vertical is not made (see "Remaining issues").

THE CAST is untouched: `film-cast/` and its deliverables are on `claude/gracious-bell-72as9d` (and carried unchanged
on this branch). The flagship lives in `film-flagship/`, started as a copy of `film-cast/`.

## Build

```sh
cd film-flagship
npm install                       # playwright (or use a global install)
node tools/render.mjs --w 1920 --h 1080 --workers 4 --crf 17 --out out/yochi-flagship.mp4
```

About 27 minutes on 4 CPU cores. The delivery file is a 2-pass ~7 Mbps re-encode of that render:

```sh
ffmpeg -i out/yochi-flagship.mp4 -c:v libx264 -preset slow -b:v 7000k -pass 1 -an -f mp4 /dev/null
ffmpeg -i out/yochi-flagship.mp4 -c:v libx264 -preset slow -b:v 7000k -maxrate 14000k -bufsize 28000k -pass 2 \
  -pix_fmt yuv420p -profile:v high -c:a aac -b:a 256k -movflags +faststart deliverables/yochi-flagship.mp4
```

Review: `node tools/still.mjs out/stills 12.7 18.8 47.3`, `tools/strip.sh out/strip.jpg 44.6 30 8` (every frame,
tiled). The cast pipeline (mattes, plates) is THE CAST's; see `film-cast/README.md`.

The final edit renders the same way (`--out out/yochi-flagship-final-edit.mp4`). It reads two things from the app
(callit.win, `yochi-dev`), copied in: the Cold Blooded badge (`assets/achievements/cold_blooded.webp`, from
`app/client/public/achievements/`) and the choreography of the standoff, round call-out, BR verdict and unlock
moment (rebuilt in `src/scenes/standoff.js`, `src/lib/ui.js`, `src/scenes/verdict.js`, `src/scenes/act4.js`).

## Audio

The same track and the same edit as THE CAST: `asset-pack/audio/Victory Stamp.mp3` from source bar 2, the hard
dropout at the duel's 0:01, the 2.4 s fade under the end card (`src/core/music.js`, `tools/audio.mjs`). Nothing
in the music was moved: the new beats were placed on the existing grid (142.3 BPM).

Added, mixed low (`tools/sfx.mjs`, synthesised and deterministic; `node tools/audio.mjs out.wav --nosfx` builds
without them):

- a dry-brush swish under each of the three tear strokes (44.69, 44.91, 45.12)
- a felt stamp thump with a short paper slap at each stamp contact: CALLED IT in the duel (19.77) and the Battle
  Royale (28.67), and the final seal (47.23)

These are honest stand-ins. What the film really wants: **a recorded brush-on-washi pass** (one fast, loaded
stroke, close-miked) and **a real stamp** (a wooden hanko or a rubber stamp on a pad, onto paper over a wooden
table). Drop those in as WAVs and point `tools/sfx.mjs` at them.

## Changes from THE CAST

| | THE CAST | Flagship |
|---|---|---|
| 0 to 8.4 s | the thumbnail, the smash cut, the roster | **unchanged** |
| Character select | 5 s, cursor on the beats | 3.4 s, cursor on the eighths, both locks a bar earlier |
| **Act II, the takes** | none | one bar (11.8 to 13.5 s): "we're so back", "it's over", "send it", "never selling" and three quiet voices slam in with their speakers' faces and collide; a dry-brush strike line tears across; the takes sort UP and DOWN; the ink drop lands on the line's vermilion node and floods the page |
| The duel | unchanged up to 0:02 | from 0:02 the board strips away, the camera pushes in on the price marker, the gap is drawn (`−0.006 TO THE STRIKE`, you're losing), a huge 0:01 holds through the dropout; release on the drop as before |
| FFA, Battle Royale, 連勝, Untouchable | | **unchanged** |
| Rewards | six singles, then the grid over two bars | four singles (Cold Blooded, Duel Master, Grudge Settled, Whale), **a gallery** of three on one bar (Took the Pool, Ronin, Bloodsport, each over its unlock), then the grid on one bar |
| The product | the landing page, the press, a dive into the button | the same page one bar earlier, the press, then **the ink signature** |
| **The ink signature** | none | three loaded-brush strokes tear the page under ink (bristle brush: dry-brush breakup at edges and tail, pigment variation, bleed, splatter); the ink recedes from the edges, wet and ragged, until only the official Y mark is left; the Yochi seal stamps over it on bar 28 (THE CAST's end-card hit), the ink taken up into the seal |
| End card | YOCHI, "Which one are you?", URL | the sealed mark into the lockup, YOCHI, **"Call it right. Take the pool."**, yochigg.xyz, NEXT CANDLE · YOUR CALL |

About 81% of THE CAST is carried over as it was (or re-timed only). Runtime unchanged: 54.6 s.

## Revision (5 Nov)

New Perma-Bull and Cold Blooded paintings (`assets/cast/source/`), and the end-card line is now
**NEXT CANDLE · YOUR CALL** (ink, 36 px). Re-rendered.

## Remaining issues

- **Vertical (4:5)** not made: the stage switches to 1080×1350 for a tall render, but every scene (THE CAST's and
  the new ones) is composed for 16:9 and needs recomposing.
- **Sound design** is synthesised (see Audio).
- **The tear's outer edge** still shows some regular dry-brush "ticks" where short bristle runs end; it reads as
  dry brush at speed, but a hand-painted stroke would be rougher.
- From THE CAST: Lab Rat's matte is weak (only ever a grid slot or a face); Grudge Settled keeps part of her red
  brush ground; Grudge Settled's painting has 遊 on her charms; all kanji pending the November review.
