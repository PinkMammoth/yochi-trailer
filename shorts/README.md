# Yochi shorts

Short-form films (5–16 s), rendered in code. There's one shared engine and one folder per short.

| short | dir | film module |
|---|---|---|
| 02 · NEW CHALLENGER (9:16 60 fps, Elysium reveal; on yochi-2p5d, not this engine) | `02-new-challenger/` | `../yochi-2p5d/remotion/src/films/new-challenger/` |
| 03 · THE SWAP TAX (9:16 60 fps, Elysium comedy; on yochi-2p5d, not this engine) | `03-swap-tax/` | `../yochi-2p5d/remotion/src/films/swap-tax/` |
| 01 · USDC HAS BEEN ELIMINATED, v3 (current: the knockout rebuilt, Elysium mainnet) | `01-usdc-eliminated/v3/` | `src/films/usdc3/` |
| 01 · USDC HAS BEEN ELIMINATED, v2 (superseded: the painted cast, slide-off knockout) | `01-usdc-eliminated/` | `src/films/usdc2/` |
| 01 · USDC HAS BEEN ELIMINATED, v1 (superseded: pixel fighters, testnet) | `01-usdc-eliminated/` | `src/films/usdc/` |

Before any new short, read `../docs/YOCHI_MOTION_STYLE_GUIDE.md`. The cast library (`src/lib/cast.js`) and the
game UI (`src/lib/ui.js`) are the flagship's. Copy a character's layers into `assets/cast/` before using it.

## Engine

- `index.html?film=<name>` loads `src/films/<name>/film.js`, which exports `META`, `LOOK`, `init(R)` and `render(t, R, P)`. Every frame is a pure function of `t`.
- `src/core/` (math, WebGL post) and `src/lib/draw.js` / `brand.js` (Sumi grounds, type, seals, the stamp motion) are copied from the Elysium cards.
- `src/lib/pixel.js` is the pixel-art kit: shapes get shaded per part, snapped to a palette and ink-outlined. `src/lib/pixfont.js` is a 3×5 sign font.
- `tools/render.mjs --film <name> --out <mp4> [--audio <wav>]` does a parallel render, streamed in order to ffmpeg. `tools/still.mjs <name> <dir> <t...>` writes PNG stills.

Renders and work-in-progress go in `out/` (gitignored). Only signed-off deliverables are committed, each once.
