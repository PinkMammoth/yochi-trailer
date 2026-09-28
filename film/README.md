# Yochi trailer: rendered in code

A 62-second trailer for Yochi, drawn frame by frame in a headless browser with
Canvas 2D (every character, crowd, candle and word) and a WebGL2 post-processing pass
(art-directed bloom from a separate emissive layer, filmic shoulder, chromatic
aberration, motion/zoom blur, grain). Every frame is a pure function of time, so the
film renders in parallel and any moment can be inspected on its own.

See `TREATMENT.md` for the creative direction and the beat-by-beat structure.

## Deliverables

| file | what |
|---|---|
| `deliverables/yochi-trailer.mp4` | **The film.** 62 s, 1080p30, H.264 ~5.8 Mbps + AAC 256 kbps, 47 MB. Upload this to X. |
| `deliverables/yochi-teaser.mp4` | Optional 21.5 s cut for paid placements: the first drop spliced on the bar line into YOUR CALL and the logo. The full film is the recommended cut. |
| `deliverables/yochi-trailer-poster.jpg` | Thumbnail frame (the crowd reveal, 2.1 s). |

## Render

```sh
cd film
npm install                      # playwright + fonts (Chromium must be available to Playwright)
node tools/render.mjs --w 1920 --h 1080 --workers 4 --crf 17 --out out/yochi.mp4
```

Needs `ffmpeg` on the PATH. Rendering 1080p30 takes about 24 minutes on 4 CPU cores
(software WebGL). Useful options: `--from`/`--to` (seconds), `--w`/`--h` (preview at
960x540 is ~3x faster), `--keep 1` (also keep a near-lossless master MKV),
`--cut short --to 21.516` (the teaser).

Delivery encodes from a kept master:

```sh
tools/deliver.sh out/yochi_master.mkv ../asset-pack/audio/trailer.wav deliverables yochi-trailer 62
```

Review tools:

```sh
node tools/still.mjs out/stills 1.4 15.3 30.4    # PNG stills at given times
node tools/still.mjs out/stills 100.5            # character sheet: the cast as busts and full-body poses
node tools/profile.mjs 2.6 15.7                  # per-frame cost
python3 tools/sheet.py out/stills out/sheet.jpg  # contact sheet
```

## Code map

| path | what |
|---|---|
| `src/core/music.js` | timing map measured from `asset-pack/audio/trailer.wav` (130.42 BPM, bar grid, hits, silences, drops) |
| `src/core/post.js` | WebGL2 post pipeline |
| `src/core/math.js` | easing, seeded randomness, noise, camera shake |
| `src/elements/helmet.js` | the players: sculpted helmets, blade LED visors, crowd silhouettes, back views |
| `src/elements/led.js` | LED dot-matrix faces, text, flame |
| `src/elements/body.js` | full-body rig and poses |
| `src/elements/crowd.js` | crowds (ring layout, front/back/top views, batched) |
| `src/elements/world.js` | camera, glass floor, strike line, LED candles |
| `src/elements/type.js`, `fx.js`, `logo.js` | typography (headlines, rules, kickers, titles placed in the 3D world), effects, the traced Y mark |
| `src/acts/act1..4.js` | the shots, in order, against the music |
| `src/film.js` | the master timeline and vertical whip transitions |
