# THE CALLER — the Yochi competitor

Character design for the Yochi trailer. It replaces the round-helmet, box-bodied players with one
master design. It keeps what worked: the visor says UP or DOWN, crowds read, and they are avatars, not
humans. It fixes what didn't: squat, mascot-like, rounded, under-designed.

Renders live in `design/renders/`. The character is code in `src/character/` (see "Implementation").
Nothing in the film uses it yet; wiring it into the shots is a separate job (see "Integration").

| sheet | what |
|---|---|
| `master.jpg` | the design on one page: annotated hero, turnaround with proportion ruler, visor, crests, palette |
| `turnaround.jpg` | front, three-quarter, side, back |
| `head.jpg` | the helmet at hero scale from five angles, with mid and small scale strips |
| `head-closeup.jpg`, `closeup.jpg` | hero framing: the head and shoulders, and waist-up, from three angles |
| `silhouette.jpg` | the design as flat shapes: turnaround, poses, crowd size, crests |
| `helmet-iterations.jpg` | round (before) → gem, front only → revolved gem (final) → with ducktail; shaded, silhouettes, crowd scale |
| `visor.jpg` | every display state on the real helmet, and the commit animation |
| `poses.jpg` | neutral, call up, call down, ready, victory, smug, slump |
| `cast.jpg` | YOU, EXIT_LIQUIDITY, DEANO, SOUP, 0XTOM, COPE_DEALER, a crowd member |
| `pfp.jpg`, `poster-you.jpg`, `poster-rival.jpg` | alone: profile-image crops and single-figure posters |
| `crowd.jpg` | 408 competitors, each raymarched: the readability test |
| `crowd-impostors.jpg` | a larger crowd with impostor sprites for everything small |
| `styleframe.jpg` | YOU in front of the crowd |
| `battle-royale.jpg` | full figures from high above at elimination-shot scale |
| `before-after-hero.jpg`, `before-after-body.jpg` | the film's current characters (drawn by the film's own code) beside the new design |
| `explore-*.jpg` | the helmet directions that were tried and rejected |

## The idea in one line
**A competitor who wears the call on their face and the Y on their body.** The head is a cut gem of
lacquer whose whole face is one pane of black glass; when they commit, the glass shows one symbol, big
enough to read from the back of the arena. The body is tall, dark and tailored, with the logo's
double-stroke Y built into it as a harness.

## Design principles
1. **The face is a display, not a face.** One black-glass pane, one symbol. Big round eyes on a round
   head were most of the mascot problem. A faceless pane with a single glowing triangle is mysterious,
   premium and far more legible.
2. **Cut corners, not curves.** The brand already has an angle: the logo's 30-degree arms and Chakra
   Petch's chamfered letters. The helmet is a cut gem with 30-degree chamfers, the pauldrons are cut the
   same way, the harness knot is a hexagon. Premium comes from precise tension surfaces meeting at
   crisp chamfers that catch the rim light.
3. **The logo is structure, not a sticker.** Twin crown stripes are the Y's double stroke. The harness
   straps rise from the knot at the logo's 30 degrees, and the helmet seam runs at the same 30.
4. **Hierarchy.** First the helmet. Then the lacquer harness, pauldrons and sneaker caps. Then the dark
   suit, then gunmetal trim. Emissive light is rationed: the call on the face, the identity colour in
   thin inlays, and the pick echoed at three small points (cheek slits, taillight, harness knot).
5. **Cyan is the world, green and red are decisions** (the film's rule). The pick colour is never an
   identity colour and never floods the body, so crowds stay a field of symbols, not a traffic light.
6. **Solve for both scales at once, and check it in silhouette.** Every choice was tested at hero
   scale, at 20-pixel crowd scale, and as a flat shape.

## Proportions
Units are helmet heights (the helmet is 1.0 tall).

| | |
|---|---|
| standing height | 6.1 (was ~3.3 in the current film) |
| helmet | 1.0 tall, 0.66 wide, ~0.9 deep; head centre at 5.56 |
| shoulders (pauldron to pauldron) | ~1.6, about two and a half helmet widths |
| waist | ~0.6: a clear V from shoulders to waist, hips narrower than the chest |
| hip joints | 3.14: legs are just over half the height |
| neck | ~0.1 visible: a ribbed seal inside a gunmetal collar |

Athletic, slightly long-legged, gender-neutral. The head is a little large for a human (stylised, and
it is the display) but nowhere near chibi, and narrower than it is tall.

## The helmet
- **Hood.** A lacquer crown shaped like a cut gem: a crowned top, 30-degree chamfers at the crown's
  shoulders, straight flanks, and a chamfered jaw tapering to a narrow chin. The gem profile is
  revolved around an elliptical plan, so the chamfers run all the way round and the silhouette is cut
  from every angle, not only from the front. A side profile then rakes it: a slightly forward-leaning
  face, a brow facet, and a facet across the back of the crown.
- **Seam.** The hood meets the cheek section along a seam that runs at 30 degrees in profile and makes a
  shallow V over the brow. It gives the head a brow (focus, intent) and gives the side and rear views a
  designed line.
- **Cheek section.** The same shell in a satin, darker tone below the seam. It carries the cheek status
  slits (pick colour, readable from the side) and the taillight at the nape (pick colour, readable from
  behind, since the arena ring is often seen from the back).
- **Glass.** One pick-shaped black-glass pane, flush with the cheek section, wrapping around the face.
  Its outline and the LED grid follow the wrap (a cylindrical projection), so the symbol curves with
  the glass. Unlit LEDs show faintly as a dot texture up close.
- **Crown stripes.** Twin light-lines from brow to nape in the identity colour: the Y's double stroke.
- **Crest modules** (identity and clans, in the helmet's language, never plush), seated on the crown's
  shoulder facets: bear (broad flat-topped fins leaning out at 30 degrees: the rival), cat (sharp fins,
  same lean), bull (swept blade horns), antenna (hairline rod, LED tip), frog (sensor pods with
  lenses), fin (a single blade along the crown). The plain dome has none.

## The visor
33 x 17 LEDs on the glass. Glyphs are drawn as vector shapes and quantised to the dots, with edge
LEDs at partial brightness (an anti-aliased dot matrix). Below ~2 pixels per LED the dots fill in
and the glyph reads as a solid shape.

Two registers:
- **CALL**: one centred symbol that fills the face. `up` ▲ and `down` ▼ (the picks), `lock`, `win` ($),
  `out` (✕), `flame` (streak), `strike` (a dashed strike line: uncommitted).
- **FACE**: two narrow, lidded eyes for acting in hero shots. `watch` (neutral slits), `focus`
  (determined), `smug` (heavy lids and a smirk: the internet's smug), `shock`, `happy`, `nervous`,
  `sad` (the L), `cash`. Narrow slits and lids instead of round dots move it from cute to cool.
- **COMMIT**: `commitGlyph(dir, t)` animates the decision. The eyes slide together into one strike
  line, and the line grows up or down into the triangle, like a candle.

Colour: green #39ff14 for up, red #ff3860 for down, white for uncommitted and watching. Acting faces
may use the character's accent (cyan for YOU, red for the rival, gold for rank).

## The body
- **Suit**: dark satin (#161520), low sheen, thin rim. Tonal dark-lacquer panels on the outer thighs,
  knees, shins and forearms: a material difference rather than a colour, so it reads as crafted up
  close and disappears at distance.
- **Y-harness**: lacquer straps in the helmet's colour. From a hexagonal knot on the sternum, two
  straps rise at 30 degrees to the pauldrons (the Y's arms) and one drops to the belt (the stem). A
  Y-back mirrors it. Each strap carries the double stroke as two fine inlaid light-lines, and the
  knot's core shows the pick. From across the arena every chest reads as a Y.
- **Pauldrons**: lacquer caps over the deltoids with a flat top and a 30-degree cut at the outer
  shoulder (the helmet's chamfer again), an inlaid edge line, and the harness anchored beneath. They
  give the silhouette a real shoulder line.
- **Collar**: gunmetal, with a thin light ring at its lip where the helmet docks. A ribbed neck seal
  inside. Dark on purpose, so the head stays the star.
- **Belt**: gunmetal, with the buckle as the end of the Y's stem.
- **Sneakers**: a lacquer upper on a wider, longer midsole with a light line around it. They ground
  the figure and give the only streetwear note.
- **Hands**: gloved mitts (fist, open, point). Enough for the film's scales; the weakest part in an
  extreme close-up.

## Palette and cast
| | shell | accent | crest |
|---|---|---|---|
| YOU | pearl #E2E0F0 | cyan #18E0FF | dome |
| EXIT_LIQUIDITY (rival) | obsidian #1E1B26 | red #FF3860 | bear |
| DEANO | bronze #5C5048 | gold #FFC23A | bull |
| SOUP | violet #60547C | gold | antenna |
| 0XTOM | jade #46605A | green #39FF14 | frog |
| COPE_DEALER | plum #504668 | muted #A8A2C8 | cat |
| crowd | slate #54526A (varied) | dim lavender | mixed |

Pearl belongs to YOU alone, so YOU can be found in any crowd without a label.

## Poses
`neutral` (contrapposto), `callUp` (pointing up, weight forward, chin up), `callDown` (pointing down
and out), `ready` (squared, fists low, leaning in: the moment before the close), `victory` (both arms up:
the silhouette is the Y), `smug` (hands on hips), `slump` (eliminated). `blendPose(a, b, t)` for
motion. Forward kinematics only; there is no foot-planting IK yet.

## Readability
- **Silhouette** (`silhouette.jpg`): the head reads as a cut gem from every view. Crests, pauldrons and
  poses all read as flat shapes.
- **Crowd** (`crowd.jpg`): 408 competitors from ~230 px down to ~25 px per helmet. Every pick reads to
  the horizon, where the old two-arrow faces blur at half the distance. The harness knots repeat the
  picks as a secondary pattern, and the crests give silhouette variety.
- **Battle Royale** (`battle-royale.jpg`): full figures ~200 px tall seen from high above. Poses,
  glyphs, crests and each chest's coloured Y all read.
- **Side and back**: the cheek slits and taillight carry the pick when the face is turned away.

## How it belongs in the film
It is lit and composited in the film's own language: a cool key from upper left, a thin cyan rim from
behind, an indigo fill, crisp cel terminators, softbox strip highlights instead of round toy
highlights, and crease highlights on machined edges. It renders into the same two layers the film
uses (base and emissive), with the emissive layer occluded by the character. The film's bloom, filmic
shoulder, chromatic aberration and grain therefore treat it like everything else. Every sheet here
went through that same post pipeline.

## Implementation
```
src/character/
  index.js       drawCompetitor(R, o): the public API; poseBox; re-exports
  cast.js        palettes, crests, PICK helpers, the named cast
  rig.js         19-bone skeleton, poses, forward kinematics
  face.js        visor glyphs (CALL / FACE), commitGlyph, LED quantiser
  head.glsl.js   the helmet (signed-distance model, surface detail, crests)
  body.glsl.js   the body (torso, harness, limbs); includes the helmet
  shade.glsl.js  raymarcher, toon shading, supersample resolve
  renderer.js    WebGL2 renderer: camera, bounds, passes, compositing into R.b / R.g
  impostor.js    ImpostorAtlas: pre-rendered sprites for crowds
  sdf.glsl.js, gl.js
design/          the workbench (not part of the film); tools/design.mjs renders its sheets
```
Render any sheet with `node tools/design.mjs <outDir> master visor cast crowd ...` (see
`design/sheets/index.js` for the list). `--jpg` writes JPEGs and `--name sheet=file` renames the output.

```js
import { drawCompetitor, CAST, YOCHI } from './character/index.js';
drawCompetitor(R, { x: 960, y: 1000, scale: 140, yaw: 0.3, pose: 'callUp', cast: CAST.you, call: +1 });
drawCompetitor(R, { x, y, scale, cast: CAST.rival, glyph: 'smug', led: YOCHI.red, pick: YOCHI.red, pose: 'smug' });
```

Every frame stays a pure function of its inputs.

### Cost (software WebGL, 4 cores)
| | |
|---|---|
| hero, full figure ~900 px tall, 2x supersampled | ~10 s |
| head ~330 px | ~0.5-1 s |
| figure ~200 px (Battle Royale scale) | ~0.2 s |
| impostor atlas, 672 sprites at 120 px | ~90 s, once |
| impostor draw | milliseconds each |

The 2D characters were nearly free; these are not. That is the price of real form, turnarounds and
consistent lighting, and it shapes the integration plan below.

## Integration (next session)
1. **LOD.** Live raymarching only for a handful of hero figures per frame. Mid-size figures at 1x
   supersampling with shadows and crease detection off. Everything small comes from impostor atlases:
   bigger cells (256 px) and 24 yaws for mid-size crowd members, pre-built for each shot's lighting.
   Specks below ~6 px are drawn in 2D as a dark gem silhouette with a coloured triangle.
2. **Caching.** Idle crowd members under a static camera can reuse their pixels between frames.
3. **Mapping the old calls.** `drawHelmet`/`drawPlayer`/`drawCrowd` call sites map to `drawCompetitor`
   and `ImpostorAtlas`. Old faces map to new glyphs: `up`/`down` → `up`/`down`; `dot`/`wide` → `watch`;
   `smugL`/`smugR` + `smirk` → `smug`; `dollar` + `grin` → `win` (or `cash` as a face); `x` + `frown` →
   `out`; `gtL`/`ltR` → `nervous`; `happy` → `happy`; `cry` → `sad`. `led` stays `led`, `status` becomes
   `pick`, and the old `type` becomes `cast.crest`.
4. **Animation.** Tennis heads are the `head` bone's pitch, picks can use `commitGlyph`, and crowds jump
   by moving the anchor.

## Honest assessment
- **Better on every point the brief raised.** Not squat, not a mascot, not a South Park bust. A
  narrow, tapered, articulated body. Intentional detail with a clear hierarchy. A helmet with its own
  silhouette from every angle. Picks that read better than before at every distance. Profile images
  and posters that hold up alone.
- **The hood reads as a cowl.** Front-on, the gem helmet has a hooded, faintly monastic quality. It
  was chosen for exactly that ("slightly mysterious"), but it is the most opinionated call in the
  design. If it reads too solemn in the film, soften the crown chamfers (`sh` in `frontProf`) before
  touching anything else.
- **Deliberately restrained suit.** Up close, the torso between the straps is plain on purpose. If
  close-ups need more, add tonal seams, not more light.
- **Cost.** See above; this is the main integration risk.
- **Hands and poses** are good enough for the film's scales, not for extreme close-ups or long
  performances.

## What was tried and rejected
Six helmet directions were built on the same neutral bust and judged at hero and crowd scale
(`explore-concepts.jpg`, `explore-*.jpg`):
- **VANE** (aero racer, wraparound band, keel): a generic motorcycle helmet, and the band caps the
  symbol's height.
- **MASK** (the whole face one glass shield, on an egg): the right face on the wrong head.
- **HALO** (a display ring around the head): readable from behind, but it reads as a visor strip.
- **PRISM** (machined facets, hex window): the only distinctive silhouette, but a box head.
- **CREST** (cheek guards, light-blade crest): costume, and a generic arena soldier.
- **SHIELD** (soft facets around a glass pane): the facets were too subtle; still an egg.
- **CALLER** (MASK's pick-shaped glass face on designed profiles): kept. Glowing twin fins read as a
  pause symbol (`explore-caller-fins.jpg`), so flush stripes won. A stepped hood read as a bike helmet
  over a mask, so it became a flush seam. A flat chest plate read as armour, so it became the Y-harness.

Then the silhouette test (`helmet-iterations.jpg`) showed that, in flat silhouette, the CALLER head
was still a circle: the detail had been hiding the shape. Cutting the front profile into a gem fixed
the front view only (the back of the head was still an ellipsoid, so three-quarter views stayed
round). Revolving the gem around the plan fixed every view. A pronounced ducktail on top of that
turned the back into a beak and was dropped. The same pass cut the pauldrons, made the collar gunmetal
with a light ring (three stacked pearl masses were one too many), slimmed the hips and gave the
sneakers midsoles.
