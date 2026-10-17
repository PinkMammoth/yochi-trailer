# 予知: a Yochi trailer in ink, rendered in code

A 34-second trailer for Yochi in sumi-e ink, cyan on the void: one brushstroke becomes the strike
line, a ghost stroke draws the future, the price paints over it exactly, the candle closes and the
money lands, twice; then the strokes gather and write 予知 (yochi, foresight), which settles into the
Y. Drawn frame by frame in headless Chromium with Canvas 2D (a procedural bristle brush) and a
WebGL2 pass (paper fibre, ink bleed, granulation, a restrained bloom, grain). Every frame is a pure
function of time, so the film renders in parallel and any moment can be inspected on its own.

See `TREATMENT.md` for the idea, the world rules and the beat sheet.

This film is separate from `../film/` (the 62 s trailer) and shares nothing with its world. It
copies the engine pattern (post pipeline, math, timing map, render and still tools) and uses the
shared brand fonts and the Y mark.

## Deliverables (`deliverables/`)

| file | what |
|---|---|
| `yochi.mp4` | The film. 1920x1080, 30 fps, H.264 + AAC, 34 s. |
| `yochi-vertical.mp4` | 1080x1350 (4:5), recomposed for mobile feeds (not cropped: the layouts are built for the frame, and 予知 is written top to bottom). |
| `yochi-poster.jpg` | The thumbnail: frame 0, the stroke tearing across the black. |
| `yochi-contact.jpg`, `yochi-vertical-contact.jpg` | One frame per second. |

**Sound:** `asset-pack/audio/yochi.wav` does not exist yet, so the deliverables carry the
placeholder score (`audio/placeholder.wav`, synthesised by `tools/score.mjs` from the timing map:
low drums, wooden knocks, brush swishes, a breath under the ghost, real silences). When the real
track lands, measure it, update `src/core/music.js`, and re-render: `--audio auto` picks the real
track up automatically.

## Render

Needs `ffmpeg` on the PATH and Playwright's Chromium (`npm install` pins Playwright 1.56.1, which
matches the browser in `/opt/pw-browsers`).

```sh
cd film-yochi
npm install
node tools/score.mjs                                     # audio/placeholder.wav + audio/click.wav
node tools/render.mjs --w 1920 --h 1080 --workers 4 --out deliverables/yochi.mp4
node tools/render.mjs --w 1080 --h 1350 --workers 4 --out deliverables/yochi-vertical.mp4
node tools/still.mjs out/poster 0 && ffmpeg -i out/poster/t000.000.png -q:v 2 deliverables/yochi-poster.jpg
```

Each 1080p render takes roughly 10 minutes on 4 cores (software WebGL). Options: `--from` / `--to`
(seconds), `--w` / `--h` (a 960x540 preview is about 4x faster), `--crf`, `--keep 1` (also keep a
near-lossless master), `--audio auto|score|click|mix|none` (`mix` lays the click track over the
score, to judge the cut).

## Review tools

```sh
node tools/still.mjs out/stills 0 8.1 13.4 24.5 --w 960 --h 540    # stills at given times
node tools/still.mjs out/stills 100                                 # brush lab: the stroke vocabulary
node tools/still.mjs out/stills 101                                 # 予知 written out, for the calligraphy
node tools/still.mjs out/sheet $(seq 0 33) --w 960 --h 540 && python3 tools/sheet.py out/sheet out/contact.jpg 6 320
node tools/profile.mjs 9 14 22                                      # per-frame cost
python3 tools/measure.py ../asset-pack/audio/yochi.wav              # when the track exists
```

## The music, and dropping in the real track

`src/core/music.js` is the only place that knows when anything happens: BPM, the bar grid, every
hit, every silence, each stroke of the kanji. The scenes only ask it for `M.*`, and the placeholder
score and click track are generated from the same module. To cut to the real track:

1. Put it at `asset-pack/audio/yochi.wav`.
2. `python3 tools/measure.py ../asset-pack/audio/yochi.wav` prints BPM, first downbeat, hits,
   silences and loudness per bar.
3. Move `BPM`, `T0`, `DURATION` and the event times in `music.js` onto what it measured.
4. Re-render (stills first: `0`, the silences, the two closes, the end card).

## Code map

| path | what |
|---|---|
| `src/core/music.js` | the timing map (placeholder: 90 BPM, sparse hits, silences), the hit list, silences and swishes for the score |
| `src/core/post.js` | WebGL2 post: paper fibre (static, it is the sheet), ink bleed (a fibre-driven ring sample, so wet edges feather into the paper), granulation, bloom from a separate glow layer, grain |
| `src/core/math.js` | easing, seeded randomness, noise, shake (copied from `film/`) |
| `src/ink/brush.js` | the brush: centripetal Catmull-Rom centreline, pressure profiles (止め stop, 払い sweep, 跳ね hook, dot), bristles in clumps with their own ink, speed starvation and dry-brush breakup (飛白), a ragged moving front, splatter in flight and landed, drips, the ghost stroke |
| `src/ink/kanji.js` | 予 and 知 as authored brush strokes, in standard stroke order, with no font |
| `src/ink/flow.js` | ink in flight: the gather into 予 and the dissolve into the Y |
| `src/ink/logo.js` | the Y mark polygon |
| `src/scenes/sheet1.js` | the tear, calm, the held silence, sudden |
| `src/scenes/foresight.js` | the ghost, the follow, the close, the payout (used twice: UP, then DOWN) |
| `src/scenes/finale.js` | the gather, 予知, the Y, the end card |
| `src/scenes/lab.js` | review sheets at t = 100 (brush) and t = 101 (kanji) |
| `src/film.js` | the master timeline |
| `tools/` | `render.mjs`, `still.mjs`, `profile.mjs`, `sheet.py`, `score.mjs` (placeholder score + click), `measure.py` |
