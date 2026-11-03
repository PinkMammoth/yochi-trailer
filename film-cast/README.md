# THE CAST

A 54.6 s Yochi trailer in the Sumi brand, drawn frame by frame in code: Canvas 2D in headless Chromium for every
painting, card, chart, seal and word, then a WebGL2 post pass (grain, motion and zoom blur, glow only on fresh win
amounts). Every frame is a pure function of time, so the film renders in parallel and any moment can be inspected.

The creative direction, beat sheet, kanji list and every decision are in `TREATMENT.md`.

## Deliverables (`deliverables/`)

| file | what |
|---|---|
| `the-cast.mp4` | **The film.** 1920×1080, 30 fps, H.264 + AAC, 54.6 s. |
| `the-cast-poster.jpg` | Thumbnail A: Doomer, "it's over" (the film's first frame). |
| `the-cast-poster-reward.jpg` | Thumbnail B: Cold Blooded with her unlock, WIN 10 IN A ROW. |
| `the-cast-contact.jpg` | Contact sheet, one frame per second. |

**Which poster:** A, the Doomer. It is the film's actual first frame, so the thumbnail and the autoplay agree, and
"it's over" is a reaction-bait line every crypto timeline already uses: people stop to see who's saying it. B is the
more beautiful image, but a striking painting with a mono caption reads as "game art" and asks nothing of the viewer.
Use B for a second post or a reply.

Not made yet: the 4:5 vertical and the per-starter 6 s shorts (see "Unfinished").

## Track

`asset-pack/audio/Victory Stamp.mp3`, measured at 142.3 BPM (bar 1.6866 s). Edited in code, reproducibly
(`tools/audio.mjs` reads the `AUDIO` block in `src/core/music.js`):

1. Starts at source bar 2 (4.556 s), so the film's 0 is a downbeat and the bass entry lands on the Perma-Bull cut (1.69 s).
2. A hard dropout from source 22.85 to 23.70 s (the fight's 0:01 freeze), 6 ms fades. It cuts the pre-drop swell, so
   the drop kick hits out of silence.
3. A 2.4 s fade from 52.2 s under the end card (the file ends at full energy).

All event times (the slams, the locks, the stamp, every Battle Royale elimination) are in `src/core/music.js`; a new
track drops in by remeasuring that file.

## Render

Needs Node 18+, ffmpeg, and Playwright with Chromium.

```sh
cd film-cast
npm install                       # playwright (or use a global install)
node tools/render.mjs --w 1920 --h 1080 --workers 4 --crf 17 --out out/the-cast.mp4
```

About 5 minutes on 4 CPU cores (software WebGL). `--from`/`--to` render a range, `--w 960 --h 540` previews,
`--click 1` mixes a beat click into the soundtrack for judging the cut.

Review tools:

```sh
node tools/still.mjs out/stills 0 19.8 47.4        # PNG stills at given times
tools/strip.sh out/strip.jpg 19.1 30 8              # every frame from 19.1 s, 30 frames, tiled (motion review)
python3 tools/sheet.py out/stills out/sheet.jpg     # contact sheet of a folder of stills
node tools/profile.mjs 9.5 23.3                     # per-frame cost
```

## The cast pipeline

The paintings are the 1536×2048 cards in `asset-pack/sumi/avatars/cards/` (the 512 px portraits are too soft for
full-frame shots). They are never repainted or recoloured; the only grade is the step to grey for a loss.

```sh
pip install "rembg[cpu]" opencv-python-headless pillow numpy
for f in ../asset-pack/sumi/avatars/cards/*.webp; do python3 tools/cast_mask.py $(basename $f .webp); done  # ~1 min each
python3 tools/cast_mask_fix.py    # Bug Hunter, Grudge Settled, Lab Rat: the cards BiRefNet reads as all-figure
python3 tools/cast_prep.py        # cut-outs, plates, half-size cards, cast.json (head points, ink colours)
python3 tools/cast_sheet.py out/cast.jpg
```

The raw mattes are committed (`assets/cast/raw/`), so only `cast_prep.py` needs to run after a change.

## Code map

| path | what |
|---|---|
| `src/core/music.js` | the timing map and the audio edit |
| `src/core/post.js`, `math.js` | the post pass and deterministic math, copied from `film/` (the shoulder knee raised so paper stays paper) |
| `src/lib/brand.js` | Sumi tokens, the roster: names, takes, unlocks |
| `src/lib/draw.js` | paper and sumi grounds, type, seals (with stamp texture), the stamp / impact / rise motion, splatter |
| `src/lib/cast.js` | the painted cast as layers: figure, plate, card, grey and silhouette variants, face crops |
| `src/lib/ui.js` | the game UI rebuilt: versus band, chart, timer, pick buttons, the ink flood |
| `src/scenes/act1.js` | the thumbnail, the roster slams, character select, the locks |
| `src/scenes/act2.js` | the ink, the duel, 0:01, CALLED IT |
| `src/scenes/act3.js` | the Free For All and the Battle Royale |
| `src/scenes/act4.js` | the unlock, the ladder, the landing page |
| `src/scenes/end.js` | the end card |
| `src/film.js` | the shot list |

## Unfinished

- **4:5 vertical** not made. The stage already switches to 1080×1350 for a tall render (`--w 1080 --h 1350`), but
  the scenes are composed for 16:9 and need recomposing.
- **Per-starter 6 s shorts** not made.
- **Lab Rat's matte** is weak (busy ground), so Lab Rat only appears as a grid slot and a face. Grudge Settled keeps
  part of her own red brush ground behind her.
- **Kanji** all pending the November native review (list in `TREATMENT.md`).
