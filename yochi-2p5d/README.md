# yochi-2p5d: 2.5D for the painted cast

The default production pipeline for bringing the cast's paintings to life in Yochi trailers. It's pure Remotion
(one WebGL pass per frame) and keeps the original illustration intact, in 16:9 and 9:16. Adopted by the owner on
15 Nov 2026 after the A/B test in `demo-2p5d/` (see `demo-2p5d/EVALUATION.md`).

The source of truth stays where it was: the Sumi kit (`asset-pack/sumi/SHARED-RULES.md`, `README.md`) and
`docs/YOCHI_MOTION_STYLE_GUIDE.md`. This package implements their rules and doesn't add new ones.

## What it's for, and what it isn't

**For:** a painting held on screen and made subtly alive. That means a slow push, parallax between figure and
ground, breathing and sway, world light, dust and ink on the air, and one impact (slash, seal, shake, impact
frame) when the edit needs a hit.

**Not for choreography.** The paintings are flat and framed. There are no limbs to move, and the house rules
forbid rigs, limb cuts and face animation. For a dynamic sequence, **cut** instead:

- hard cuts between `CharacterShot`s on the beat (Remotion `<Series>`), each with its own push or punch-in;
- alternate artwork: a different painting, a tighter framing of the same one, a card deal or flip;
- `variant: 'silhouette'` (the ink silhouette, a locked reward or a tease) and `variant: 'grey'` (a loss);
- camera moves and impact frames: shake, punch-in, hit-stop, ink-negative frames, slash, seal, burst.

`Cuts-16x9` in the examples is a 2.5-second instance of this grammar: silhouette tease, a hard cut to the painting on
the hit, then a hard cut to the loser gone grey.

## Two registers of motion

| | ambient (the whole shot) | impact (≤ ~0.6 s around one frame) |
|---|---|---|
| figure | **rigid**: breathing scale ≤1.5% and sway ≤2° about the figure's anchor at the frame edge (rung 4). Defaults: 0.45% and 0.25°. No local warp, so no rubber-sheet movement | a brief gust on the free hair/cloth ends only (`gust`, px), decaying with the hit |
| camera | slow push, gentle truck, drift toward the face | shake, punch-in (1.0→1.08 over 2 frames), hit-stop |
| world | parallax, ground light pool, the figure's soft shadow on the ground, motes on the wind | ink-negative frames, paper-white flash (≤2 frames), shockwave, ink burst, slash, seal |

Impact presets in `shot.ts`:

- `IMPACT_HOUSE`: the style guide's numbers. Shake 6 px for 0.38 s, punch 0.08, hit-stop 0.12 s, no gust,
  no shockwave, no ink frames.
- `IMPACT_DRAMATIC`: for a trailer's one big hit. Shake 22 px for 0.6 s, shockwave, 2 ink-negative frames,
  a 9 px gust.

Figure lighting (rim and wash on the painting) is **off** by default (`light.figure: 0`), per OPEN_DECISIONS #7:
lighting lives in the world.

## Use it

```tsx
import { CharacterShot, IMPACT_DRAMATIC } from './lib';

<CharacterShot spec={{
  character: 'untouchable', format: '9:16', durationInFrames: 150,
  camera: { push: [1, 1.1], truck: [-18, 10] },
  ambient: { breath: 0.0045, sway: 0.25 },
  impact: {
    frame: 96, ...IMPACT_DRAMATIC,
    slash: { from: [1.02, 0.05], to: [0.52, 0.47], width: 150, behind: true },
    seal: { glyph: '連勝', at: [0.8, 0.6], size: 200 },
    burst: true,
  },
}} />
```

All positions are in frame units (0..1), and all sizes are px at 1080 on the short side, so a spec ports between
16:9 and 9:16 by changing `format` and re-placing the slash and seal. Every frame is a pure function of
`(spec, character, frame)`.

- **Slash:** vermilion by default, the brand's one skewed element per scene. `behind: true` sandwiches it between
  ground and figure, so it cuts across the painting's ground behind the character. Use `tone: 'ink'` when the
  ground is itself vermilion (Duel Master).
- **Seal:** only glyphs on the SHARED-RULES list (`assertKanji` throws otherwise). It stamps with the brand
  `yo-stamp` curve, and contact lands on the hit frame.
- **Composition rules:** the camera window is clamped to the painting's safe rect (clear of the card frame and its
  crests). Dark motes fade out around the face. Keep type off faces and inside title-safe, as the style guide says.

```bash
cd yochi-2p5d/remotion
npm install && npm run sync                       # copies prepared characters + the glyph font into public/
npx remotion studio src/index.ts                  # preview
npx remotion render src/index.ts Untouchable-9x16 out/untouchable-9x16.mp4 --gl=swangle --concurrency=4 --crf=16 \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
```

A 5-second 1080p shot renders in about 2 minutes on 4 CPU cores with software GL.

## Add a character

1. Pick the painting by job, as in the style guide's section 7: its description, its unlock, and the matte notes
   in `docs/asset-audit/ANIMATION_FEASIBILITY.md`.
2. Write `characters/<id>/character.json` with:
   - `card`: the kit card, read only;
   - `matte`: either `"source": "cast"`, which copies the raw BiRefNet matte from
     `claude/yochi-first-ad-order-a:film-flagship/assets/cast/raw/<id>.png` into the folder and is the
     **default, with no hints needed**, or `"source": "grabcut"` with fg/bg hint polygons. Either one can take
     `strandZones`, which keep only the dark hair strands where hair crosses a similar-toned ground;
   - `anchor`: where the figure leaves the frame, the pivot for breath and sway;
   - `head`: the face centre;
   - `framings` for `16:9` and `9:16`: centre and width in card px, plus an optional `pushTarget`;
   - optionally `flow` (the free hair/cloth ends a gust may move) and `depth` regions for the ground.
3. `python3 prep/prepare_character.py <id>`, then review `characters/<id>/build/check.jpg` (the matte over magenta
   and the clean ground). Coordinates are card px (1536×2048). The painting rect (72,150)-(1464,1978) is the house
   cast pipeline's.
4. Add a spec in `remotion/src/examples/shots.ts`, render stills at 960×540 and at phone size, check the face,
   the slash and the seal, then render.

The prep never writes to `asset-pack/`. `build/fig.png` is the original pixels plus an alpha matte, and
`build/bg.png` fills only what the figure covers, which is only ever seen through a few pixels of parallax.
`meta.json` records the card's SHA-1 and where the matte came from.

| character | matte | notes |
|---|---|---|
| Untouchable | GrabCut + 16 hint polygons (8 figure, 7 ground, 1 probable ground) and a strand zone | cleaner in the top-left hair than the house BiRefNet matte; good for silhouettes |
| Duel Master | house BiRefNet raw matte + 1 strand zone | the matte keeps some of her red disc, so it's fine in colour and grey, but **not for silhouettes**; the slash is `ink` on her vermilion ground |

## Blender, for specific shots

Keep Blender for a shot that genuinely needs physical depth, a real camera move through space, or physically lit
relief (which needs a sign-off on figure light). It reads the same prepared character and the same ShotSpec, and
renders `back`/`front` RGBA passes. `<BlenderPasses spec passes>` stacks them around the slash and adds the same
overlays, so the shot cuts with everything else. The figure is one rigid object (no armature) and unlit by
default. Expect about 10 s/frame (Eevee under `xvfb-run`). Steps are at the top of `blender/build_shot.py`.

## Files

| path | what |
|---|---|
| `prep/prepare_character.py` | card + character.json → `build/` plates, depth, flow, relief, meta, review sheet |
| `characters/<id>/character.json` | authored per character (matte source, hints, anchor, head, framings) |
| `remotion/src/lib/shot.ts` | ShotSpec, impact presets, `shotState()` (camera, rigid figure, light, impact envelopes) |
| `remotion/src/lib/PlateCompositor.tsx` | the WebGL pass |
| `remotion/src/lib/CharacterShot.tsx` | `CharacterShot`, `BlenderPasses`, `ShotOverlays`, `useCharacter` |
| `remotion/src/lib/slash.ts`, `Seal.tsx`, `Atmosphere.tsx` | slash, seal, motes + burst + grade |
| `remotion/src/lib/brand.ts` | tokens, allowed kanji, house motion limits |
| `remotion/src/examples/shots.ts` | example specs (Untouchable and Duel Master in both formats, the cut sequence) |
| `blender/build_shot.py`, `remotion/tools/export-shot.mts` | the Blender path |
| `deliverables/` | example renders and contact sheets |
