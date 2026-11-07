# YOCHI × ELYSIUM: landscape co-branded card (v3)

The landscape Elysium testnet announcement: 16:9, both brands' real marks, minimal copy. The first version (4:5) is
untouched in `../card-elysium/`. The v2 suminagashi version of this card (ink rings from both marks) was
withdrawn; its source and render are in commit `3b9f2b3`.

| file | what |
|---|---|
| `deliverables/yochi-elysium-card-16x9.mp4` | 1920×1080, 30 fps, 180 frames, 6.0 s, H.264 High, yuv420p, silent, faststart |
| `deliverables/yochi-elysium-card-16x9.png` | Static companion, 1920×1080 |
| `deliverables/yochi-elysium-card-16x9@2x.png` | The same frame at 3840×2160 |

## Motion

The composition, copy and branding are the approved v2 layout, unchanged. Only the secondary motion is new.

- **The moment: the Yochi hanko stamp,** unchanged from v2. Contact is on frame 0, with the impact shake,
  drops, and the wet impression wicking into the fibre and drying. The hanko lifts at 5.3 s and slams back on the
  loop point.
- **Continuous: a bokashi wash.** One pale sumi wash soaks through the sheet with a soft tide line at its edge,
  where the pigment settles, and drifts slowly. It's one field moving at one pace across the whole card, so there
  are no seams and no competing rhythms. It's lightest through the band that carries the marks and the type, and
  fullest toward the edges, so it frames the lockup without passing behind the words.
- **The stamp feeds the wash.** At impact the wash blooms out around the hanko, as if the stamp's ink is running
  into it, then settles back over about 5 s.
- **The Elysium crest** floats on the sheet with a slow 6 s breath (±2.5 px, a quarter of a degree), drawn exactly
  as supplied.

The wash is domain-warped value noise worked out at quarter resolution each frame and drawn up soft. Every offset
moves on a circle that turns once per 6 s loop, and the bloom is zero at both ends of the loop. Every frame is a
pure function of `t mod 6`, so the loop is exact.

**Copy:** YOCHI · ELYSIUM (each name under its mark, with × between the marks), LIVE ON ELYSIUM TESTNET, and
testnet.yochigg.xyz. There's no other text and no mention of mainnet.

**Balance:** each mark has its own name in the same type and size. The Elysium
crest is 338 px against the hanko's 300 px, because a circle reads smaller than a square of the same width.
Vermilion appears only on the hanko and the URL.

## The Elysium logo

The official Elysium colourised logomark, `assets/elysium/elysium-logomark-colorized.svg`, copied unchanged from
the brand assets in `asset-pack/Elysium/`. It's a vector, so it's crisp at any render size, and it's drawn as
supplied: no recolouring or redrawing. The ELYSIUM name under it is set in the card's display type, matching
YOCHI. The official wordmark (`elysium-wordmark-dark.svg`) is in the same folder if Elysium would rather see
their own lettering there.

(Earlier renders used a 400 px JPEG found online, which turned out to be a lookalike rather than the official
mark. It and its cutout tool were removed in favour of the official SVG; they're in the git history.)

## Render

```sh
cd card-elysium-landscape
node tools/render.mjs                                   # → deliverables/yochi-elysium-card-16x9.mp4, about 4 min on 4 cores; 11.2 MB, ~15 Mbps (the grain is costly; X re-encodes it anyway)
node tools/still.mjs out/stills 2.5                     # any moment(s) to PNG
node tools/still.mjs out/stills2x 2.5 --w 3840 --h 2160 # the @2x still
```

Layout, wash parameters and timings are at the top of `src/card.js` (`L`, `WASH`, `LIFT*`). The engine
(`src/core`, `src/lib`, `tools/server.mjs`) is the same copy of the flagship's that `../card-elysium` uses.

## Comparison: wash +7%

`deliverables/yochi-elysium-card-16x9-wash107.mp4` / `-wash107.png` are the same card with the wash's opacity
×1.07. Nothing else changed. They're a comparison only; the files above remain the approved version.

```sh
node tools/render.mjs --wash 1.07 --out deliverables/yochi-elysium-card-16x9-wash107.mp4
node tools/still.mjs out/stills 2.5 --wash 1.07
```

`--wash` defaults to 1, which reproduces the approved card pixel for pixel. The +7% raises the wash's peak alpha by
less than one percentage point (≤2 of 255 levels on any pixel). The two MP4s measure 48.5 dB PSNR against each
other, so the difference is below what's visible.
