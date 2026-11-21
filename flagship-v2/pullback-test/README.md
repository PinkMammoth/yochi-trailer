# Pullback test: Duel Master into the Grand Prediction Arena

The findings, verdict and asset briefs are in **`REPORT.md`**. The deliverables are in `deliverables/`.

```
assets/source/        the two approved illustrations, read-only copies (arena-master.webp 1672x941, duel-master-full-body.webp 1086x1448)
assets/derived/       everything made from them: the figure matte, the victory registration, the depth planes (layers/), layers.json
tools/align.py        SIFT registration of the approved victory pose onto the full-body drawing
tools/layers.py       the depth-plane separation and reconstruction, and the breakdown sheet
tools/sheets.py       the contact sheet, the key frames and the continuity strip from the render
audio/build.py        the music excerpt (bars 75-82, untouched) and the placeholder SFX, as separate stems
../film/remotion/src/pullback/Pullback.tsx   the shot (composition Pullback-Test)
```

## Rebuild

```bash
cd flagship-v2/pullback-test
python3 ../film/tools/matte.py assets/source/duel-master-full-body.webp assets/derived/duel-master-full-body-matte.png --keep-flecks
python3 tools/align.py
python3 tools/layers.py
python3 tools/victory_plates.py
python3 audio/build.py
cd ../film/remotion && tools/sync-assets.sh
COMP=Pullback-Test PROPS='{"diag":true}' node tools/stills.mjs /tmp/st 0.5 2.4 4.4 6.0 10.0   # diag: magenta holes + camera readout
tools/render-pullback.sh ../../pullback-test/deliverables/yochi-pullback-test.mp4
cd ../../pullback-test && python3 tools/sheets.py
```

Props: `diag` (magenta background and a camera readout), `strips` (the A/B: the platform as flat strips), `slab` (keep
the full-body drawing's own painted rock under her feet).
