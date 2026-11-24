# Cast performance tests: High Roller, Untouchable, Cold Blooded

Isolated performance tests of three new approved paintings, judged against the Last Legend two-pose test. Pure
Remotion 2.5D, 1920×1080, 60 fps. **Status: for owner review.** Nothing merged into the flagship. Findings, verdicts
and asset asks are in **`REPORT.md`**.

Isolation: a new folder on `claude/nice-cerf-yokee2`, which is the one branch this session may push to. No existing
file was modified. The flagship's house libraries and `yochi-2p5d` are imported read-only. The Cold Blooded v2 card's
layers come from `yochi-2p5d/prep/prepare_character.py`, whose build output is gitignored.

## Deliverables (`deliverables/`)

| character | cinematic | trailer | also |
|---|---|---|---|
| Untouchable (win) | `untouchable-cinematic.mp4` (7.6 s) | `untouchable-trailer.mp4` (2.05 s, 6 beats) | `untouchable-rigid-ab.mp4` (same shot, ribbons held rigid), `untouchable-motion-map.jpg`, `untouchable-ribbon-strip.jpg` |
| High Roller (win) | `high-roller-cinematic.mp4` (5.2 s) | `high-roller-trailer.mp4` (1.36 s, 4 beats) | `high-roller-chip-paths.jpg` |
| Cold Blooded (defeat) | `cold-blooded-cinematic.mp4` (6.4 s, cut on the gesture from the v2 card) | `cold-blooded-trailer.mp4` (2.05 s, 6 beats) | `cold-blooded-single-painting.mp4` (the new painting alone), `cold-blooded-cut-frames.jpg` |

Plus `<cut>-contact.jpg` for every cut, `cast-source-vs-shot.jpg`, and separate stems in `audio/out/<cut>-{music,sfx,mix}.wav`.

## Layout

```
assets/source/       the three paintings as received (1086x1448, 1024x1536, 1122x1402)
assets/derived/      house GrabCut mattes (*-matte.png), check sheets, layers/ (what the shots read)
tools/prep.py        refined mattes (paper gaps by authored seeds, soft ink fringe), High Roller's chip sprites, Untouchable's
                     extended paper canvas, paper field and ribbon flow map, the arena crops, the Cold Blooded card layer
tools/sheets.py      every review sheet
audio/build.py       music excerpts (untouched, flagship bar grid) + synthesised SFX, separate stems
remotion/src/        Untouchable.tsx (WebGL ribbon pass + ink bloom), HighRoller.tsx (chips), ColdBlooded.tsx (the cut),
                     common.tsx (camera, arena world, motes, win amount), timing.ts (every timing)
```

## Rebuild

```bash
cd flagship-v2/cast-performance-test
for p in cold-blooded-defeat untouchable-win high-roller-win; do
  python3 ../film/tools/matte.py assets/source/$p.webp assets/derived/$p-matte.png --fill-holes; done
python3 ../../yochi-2p5d/prep/prepare_character.py cold-blooded
python3 tools/prep.py
cd remotion && npm ci && tools/sync-assets.sh
node --experimental-strip-types tools/timing.mts && python3 ../audio/build.py
tools/render.sh Untouchable-Cinematic un-cinematic ../deliverables/untouchable-cinematic.mp4
#   ... Untouchable-Trailer un-trailer, Untouchable-Rigid un-rigid, HighRoller-Cinematic hr-cinematic, HighRoller-Trailer hr-trailer,
#   ColdBlooded-Cinematic cb-cinematic, ColdBlooded-Single cb-single, ColdBlooded-Trailer cb-trailer
cd .. && python3 tools/sheets.py /tmp/study   # study frames: see REPORT.md section 6
```

All props take `diag: true` (a readout of t, frame, zoom, etc.) and `type: false` (no amount/seal).

## Assets used

| asset | from |
|---|---|
| the three new paintings | the owner's attachments, 24 Nov 2026 (approved); copied read-only to `assets/source/` |
| Cold Blooded v2 card | `asset-pack/sumi/avatars/cards/cold-blooded-v2.webp` via `yochi-2p5d` (house BiRefNet matte) |
| Grand Prediction Arena | `flagship-v2/pullback-test/assets/source/arena-master-v2-as-received.webp`: the UP side (High Roller), the DOWN side (Cold Blooded), the paved landing |
| music | `last-candle-standing/v4/music-source/Victory Stamp_dark_dnb.mp3` (the flagship's track), bars 137 / 138 |

Kanji: **敗** (grey, defeat), Cold Blooded trailer only, from 1.02 s. It's on the allowed list.
