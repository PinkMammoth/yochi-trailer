# YOCHI × ELYSIUM: landscape co-branded card (v2)

The second pass at the Elysium testnet announcement: 16:9, both brands' real marks, and minimal copy. The first
version (4:5) is untouched in `../card-elysium/`.

| file | what |
|---|---|
| `deliverables/yochi-elysium-card-16x9.mp4` | 1920×1080, 30 fps, 180 frames, 6.0 s, H.264 High, yuv420p, silent, faststart |
| `deliverables/yochi-elysium-card-16x9.png` | Static companion, 1920×1080 |
| `deliverables/yochi-elysium-card-16x9@2x.png` | The same frame at 3840×2160 |

## The idea: suminagashi

Suminagashi is the Japanese craft of floating sumi ink on water in concentric rings. Here the sheet is the water
and there are **two sources of equal strength**: ink wells out from under the Yochi hanko and from under the
Elysium crest. Each new ring pushes the ones before it outward, so the rings move fast near their source, slow as
they travel, and tighten into fine lines. Where the two fields meet, they flatten against each other along the
line between the marks, and the × sits on that line.

- **Continuous life.** A pale ring is born at each mark every second, and rings live for 11 s, so the sheet is
  always slowly moving, wherever you join the loop. The Yochi rings are warm sumi and the Elysium rings a cooler
  wash of the same ink.
- **The moment.** The hanko stamp from v1 (contact on frame 0, the impact shake, drops, wet ink wicking into the
  fibre and drying, then the lift and slam on the loop point). The impact also **surges the Yochi source**: the
  whole Yochi field jumps outward, a darker loaded ring is shed, and it presses into Elysium's side. The
  Elysium source runs slightly stronger for the rest of the loop, so the boundary is pushed back. Each source
  injects exactly the same ink per loop, so the balance is equal over time.
- **The Elysium crest** floats on the sheet with a slow 6 s breath (±2.5 px, a quarter of a degree) and lifts a
  few px when the impact's wave reaches it. The logo itself is drawn exactly as supplied.

The rings are a real two-source potential flow, `v = Σ Q_i/2π · (x − c_i)/|x − c_i|²`. Each ring is 420 particles
per edge, integrated (RK2, 0.1 s steps) from its birth to the current frame. Ring births (1 s), impacts (6 s) and
each ring's shape (keyed to its slot in the loop) are all periodic in 6 s, so every frame is a pure function of
`t mod 6` and the loop is exact.

**Copy:** YOCHI · ELYSIUM (each name under its mark, with × between the marks), LIVE ON ELYSIUM TESTNET, and
testnet.yochigg.xyz. There's no other text and no mention of mainnet.

**Balance:** each mark has its own name in the same type and size, and the ink fields are mirror-equal. The Elysium
crest is 338 px against the hanko's 300 px, because a circle reads smaller than a square of the same width.
Vermilion appears only on the hanko and the URL.

## The Elysium logo

The source is `assets/elysium/kinetiq-elysium.jpeg`, a 400×400 JPEG copied from `asset-pack/kinetiq-elysium.jpeg`
on `claude/yochi-flagship`. The mark's own dark arcs are the same colour as its square ground, so a colour key
would eat the logo. Instead, `tools/elysium_cutout.py` fits the white ring's outer edge (least squares over 720 rays)
and cuts an anti-aliased circle 0.9 source px inside it, on a 4× Lanczos upsample. Nothing inside the circle is
changed.

```sh
python3 -I tools/elysium_cutout.py assets/elysium/kinetiq-elysium.jpeg assets/elysium/elysium-mark.png
```

**Resolution:** the crest is drawn at 338 px from a 400 px source, which is fine at 1080p. In the @2x PNG it's
upscaled about 1.7× and visibly softer than the vector Yochi seal. An SVG or a ≥1500 px PNG from Elysium would fix
it. Drop it in as `assets/elysium/elysium-mark.png` (a transparent circle, cropped to the ring) and re-render.

## Render

```sh
cd card-elysium-landscape
node tools/render.mjs                                   # → deliverables/yochi-elysium-card-16x9.mp4, ~4 min on 4 cores
node tools/still.mjs out/stills 2.5                     # any moment(s) to PNG
node tools/still.mjs out/stills2x 2.5 --w 3840 --h 2160 # the @2x still
```

Layout, ring parameters and timings are at the top of `src/card.js` (`L`, `RING`, `SRC`, `LIFT*`). The engine
(`src/core`, `src/lib`, `tools/server.mjs`) is the same copy of the flagship's that `../card-elysium` uses.
