# Last Legend, the fallen champion: two-pose performance test

Two approved Last Legend defeat paintings, Pose A (the collapse) and Pose B (the defiance), turned into one
performance in the Grand Prediction Arena. Pure Remotion 2.5D, 1920×1080, 60 fps.

**Status: for owner review.** Nothing merged, published or re-rendered in the flagship. The findings, the
recommendation and every known defect are in **`REPORT.md`**.

Isolation: everything is in this new folder, on `claude/nice-cerf-yokee2`. That is the one branch this session may
push to, so a separate feature branch wasn't possible. No existing file was modified: the flagship, the pullback,
the Duels short, the animatics, `yochi-2p5d/` and the kit are untouched. The flagship's house libraries
(`film/remotion/src/lib`, `yochi-2p5d/remotion/src/lib`) are imported read-only.

## Deliverables (`deliverables/`)

| # | file | what |
|---|---|---|
| 1 | `last-legend-two-pose-cinematic.mp4` | **Version A, cinematic**, 6.00 s, with temp mix |
| 2 | `last-legend-two-pose-trailer.mp4` | **Version B, trailer-paced**, 2.73 s (8 beats), grey 敗 and the amount |
| 2b | `last-legend-two-pose-trailer-6beat.mp4` | **Version B-6**, 2.05 s: B cut to the flagship's current X2 slot (6 beats) |
| 3 | `last-legend-comparison.jpg` | the two paintings beside the shot's Beat A and Beat C holds |
| 4 | `last-legend-two-pose-*-contact.jpg` | timed contact sheets (0.1 s cinematic, 0.05 s trailers) |
| 4 | `last-legend-transition-{cinematic,trailer}.jpg` | **every frame** through the head lift, full frame and head crop at 1080p px |
| 4 | `last-legend-transition-methods.jpg` | five transition methods on identical frames (why the cut won) |
| 5 | `last-legend-pose-registration.jpg` | originals, onion overlay, flow and colour-difference maps, the change region, per-region numbers |
| 5 | `last-legend-change-mask-in-shot.jpg` | the change region as it sits in the shot |
| – | `last-legend-mask-qc.jpg` | matte edges and ground contact at 1080p |
| 6 | `remotion/` | editable source (below) |
| 7 | `assets/derived/` | mattes, registered Pose B, floor ink, change mask, arena crops, registration data |
| – | `audio/out/<cut>-{music,sfx,mix}.wav` | separate stems per cut |

## Layout

```
assets/source/      the two approved paintings as received (1199x1312 each; read-only copies)
assets/derived/     *-matte.png (house GrabCut), *-fig.png / *-floor-ink.png (refined), registration/ (flow, maps, onion),
                    registration.json, layers/ (what the shot reads: pose-a-fig, pose-b-fig-reg, change-mask, floor-ink-a/b,
                    arena-back, arena-floor)
tools/register.py   SIFT + RANSAC similarity fit of B onto A, dense flow, per-region statistics, diagnostic maps
tools/matte_refine.py   fills the costume's paper-coloured paint, removes the paper seen under the thigh, cuts at the
                    authored ground line, extracts the painted floor's ink as its own alpha
tools/layers.py     registers B, builds the change mask, the ragged canvas-edge falloff, the arena crops
tools/sheets.py     every review sheet in deliverables/
audio/build.py      music excerpt (untouched) + synthesised placeholder SFX, separate stems; reads audio/timing.json
remotion/src/LastLegend.tsx   the shot (the per-frame pose mix, camera, world, ink, type)
remotion/src/timing.ts        every timing for the three cuts (CINEMATIC, TRAILER, TRAILER6)
```

Compositions: `LastLegend-Cinematic`, `LastLegend-Trailer`, `LastLegend-Trailer6`. Props: `method` (`cut-smear` is
the default; `cut-masked`, `smear`, `dissolve-masked` and `dissolve-full` are kept for comparison), `showMask` (veils
the change region), `diag` (a readout of method, frame, swap, zoom and grey), `type` (the 敗 seal and the amount).

## Rebuild

```bash
cd flagship-v2/last-legend-test
python3 tools/register.py
for p in a-collapse b-defiance; do
  python3 ../film/tools/matte.py assets/source/last-legend-pose-$p.webp assets/derived/pose-$p-matte.png --fill-holes
  python3 tools/matte_refine.py assets/source/last-legend-pose-$p.webp assets/derived/pose-$p-matte.png assets/derived/pose-$p
done
python3 tools/layers.py
cd remotion && npm ci && tools/sync-assets.sh
node --experimental-strip-types tools/timing.mts && python3 ../audio/build.py
COMP=LastLegend-Cinematic PROPS='{"diag":true}' node tools/stills.mjs /tmp/st 0.5 1.0 3.0 3.9 5.0
tools/render.sh LastLegend-Cinematic cinematic ../deliverables/last-legend-two-pose-cinematic.mp4
tools/render.sh LastLegend-Trailer trailer ../deliverables/last-legend-two-pose-trailer.mp4
tools/render.sh LastLegend-Trailer6 trailer6 ../deliverables/last-legend-two-pose-trailer-6beat.mp4
COMP=LastLegend-Cinematic node tools/frames.mjs /tmp/meth '[{"name":"cut-smear","props":{"method":"cut-smear"}}, ...]' 232 233 ...
cd .. && python3 tools/sheets.py /tmp/meth
```

Needs ffmpeg, opencv-python-headless, numpy, scipy, pillow. Each cut renders in about 1.5 min on 4 cores.

## Assets used

| asset | from | how |
|---|---|---|
| Last Legend Pose A and Pose B | the owner's attachments (24 Nov 2026), approved | copied to `assets/source/`, never altered; alpha and registration only |
| Grand Prediction Arena | `flagship-v2/pullback-test/assets/source/arena-master-v2-as-received.webp` (approved) | read in place; two crops: the DOWN side (backdrop) and the paved landing at the foot of the right stairs (floor) |
| Victory Stamp dark DnB | `last-candle-standing/v4/music-source/Victory Stamp_dark_dnb.mp3` (the flagship's track) | untouched excerpt from bar 137 |
| fonts, 敗 seal | `asset-pack/sumi/fonts/`, the house `StampSeal` | |

Kanji: **敗** (defeat, grey), trailer cuts only, from 1.36 s (B) and 1.02 s (B-6). It's on the allowed list.
