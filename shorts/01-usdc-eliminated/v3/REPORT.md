# USDC HAS BEEN ELIMINATED v3: report

V2's paintings, type and Sumi look are the foundation. V1's physical comedy is back. The knockout is rebuilt as one
clear cause and effect. 10.0 s, 1920×1080, 30 fps, H.264 + AAC. Elysium mainnet variant.

| file | what |
|---|---|
| `usdc-eliminated-v3.mp4` | **The film** (with the announcer) |
| `usdc-eliminated-v3.wav`, `-novoice.wav` | The soundtrack, with and without the announcer (swap `--audio` to re-render without it) |
| `usdc-eliminated-v3-poster.jpg` | Thumbnail: frame 0, the select screen |
| `usdc-eliminated-v3-contact.jpg` | Timed contact sheet: one frame every 0.25 s, labelled with the beat |
| `knockout-before-after.jpg` | The knockout, V2 above, V3 below, at matching beats |
| `usdc-eliminated-v2-vs-v3.mp4` | Both full films side by side (V3's audio) |
| `emblem-comparison.jpg`, `emblem-fidelity.json` | The token-emblem experiment (see below) |
| `CAPTION-MAINNET-UNPUBLISHED.md` | Mainnet caption variants, **unpublished until launch is confirmed** |

V1 (`../deliverables/usdc-eliminated.*`) and V2 (`../deliverables/usdc-eliminated-v2.*`) are untouched. Canonical
art in `asset-pack/` is untouched.

## The cut

| t (s) | beat | what you see | what you hear |
|---|---|---|---|
| 0.00 | select | V2's select: Perma-Bull (YOU, HYPE) and Paper Hands (CPU, USDC); 1P locks with 決 | blips, the lock |
| 0.80 | versus | V2's band, HYPE 対 USDC | whoosh, slam |
| 1.60 | ROUND 1 | the duel board | "Round one" |
| 2.10 | FIGHT! | | "Fight!", the riff |
| 2.42 | **bureaucracy** | six wallet prompts slam in around Paper Hands, faster and faster (SWAP TO USDC, APPROVE USDC, SIGN MESSAGE, CONFIRM SWAP, APPROVE USDC, SIGN MESSAGE). They frame his face rather than cover it; he trembles harder with each | a rising "ding" per prompt, error buzzes on the last two |
| 3.15 | **anticipation** | hard cut to Perma-Bull, framed big, slow push on the grin, the world darkens | the music stops dead; one sting; a thin rising tone |
| 3.65 | **panic** | cut to Paper Hands: crash zoom, trembling, one more APPROVE USDC slams in on him | a nervous chattering tremolo |
| 3.95 | **the attack** | back to the stage: Perma-Bull's panel lunges; one vermilion dry-brush stroke bursts from behind it at fist height, cuts through the pile and lands on Paper Hands' chest | brush whoosh |
| 4.05 | **impact** | 1 frame of paper flash, 2 ink-negative frames, then a freeze (0.16 s) with Paper Hands jolted and the shake | ONE enormous impact: sub boom, crushed crack, a short ring |
| 4.21 | **payoff** | Paper Hands' framed painting is shoved and launched up and out of frame, turning; the prompts shatter away from Perma-Bull; his paperwork bursts out and flutters down; grey ink where he left; his health bar drains to grey; the candle rips green | launch whistle, shatter ticks, paper rustle |
| 4.21 | **the gag** | one SIGN MESSAGE stays exactly where he stood, still spinning, wobbling... | silence on it |
| 4.63 | | ...then drops off the bottom of the frame | **a rubber squeak** (twice), a falling slide |
| 4.95 | **K.O.** | a gigantic vermilion K.O. stamps over the empty half | "K.O.", slam, fanfare |
| 5.60 | eliminated | V2's band: ON ELYSIUM / USDC HAS BEEN ELIMINATED, his face greys, grey 敗 | "Perfect" |
| 6.70 | paper | **NO SWAPS / JUST HYPE** (was NO SWAPS / NO APPROVALS / JUST HYPE: players still approve the HYPE spend and confirm transactions) | whoosh, typing |
| 7.45 | end card | the seal stamps: YOCHI × ELYSIUM, **NOW LIVE ON ELYSIUM**, yochigg.xyz, 18+ · REAL-MONEY GAMEPLAY · PLAY RESPONSIBLY (held 2.55 s) | stamp, closing chord |

Muted, the joke still reads: the prompts are words, the strike is a line from one to the other, the flying panel, the
hanging card and the K.O. are all on screen.

## 2.5D techniques reused (from `demo-2p5d/`, approach A, "Pure Remotion")

The demo's Remotion components are React/WebGL; the shorts engine is plain Canvas 2D with a WebGL post pass. Both
are "every frame a pure function of time", so the pieces that are drawing code port directly, and nothing needed a
refactor or a Remotion dependency.

| technique | demo source | in v3 | how |
|---|---|---|---|
| **Dry-brush slash** (bristles running dry from the edges, dense core, paper grain, splatter) | `remotion/src/shared/slash.ts` | the strike | ported almost verbatim to `src/lib/slash.js`, parameterised (endpoints, width, bow, colour, seed). Grain is painted in the ground colour rather than punched out, since the shorts draw on one canvas |
| **Slash sandwich** (the stroke between depth layers) | `A/WarpShot.tsx` (slash between background and figure) | the stroke runs *behind* Perma-Bull's panel and *in front of* Paper Hands and the prompts | depth order in `stage()`. It's what makes the strike read as leaving his fist: it bursts out from behind him |
| **Manga impact frame** (paper flash, then a 2-frame ink negative, smoothstep 0.42..0.52 on luma, paper/ink tints) | `A/WarpShot.tsx`, shader `uFlash` / `uInkFrame` | frames 1-3 of the hit | `inkNegative()` in `lib/slash.js` does the same mapping on the canvas pixels; the flash uses the engine's existing post flash |
| **Impact camera** (decaying noise shake with a hard first kick, a little roll) | `shared/timeline.ts` `camera()` | the hit | engine `shake()` (18 px, 0.65 s) plus a one-frame kick (14, −10 px) and a decaying 0.5° roll |
| **Anticipation push** (slow push into the face before the hit, camera leaning in) | `shared/timeline.ts` (push + anticipation) | the push-in on Perma-Bull's grin | the panel's painting scale eases 1.04 → 1.12, the plate drifts against the figure |
| **Plate parallax** (figure over its own ground) | `A/WarpShot.tsx` depth parallax | every panel | V2's figure-over-plate drift, kept |
| **Ink burst** | `shared/Particles.tsx` (burst at the hit) | the grey splatter where he leaves, the vermilion splatter on K.O. | the engine's `splatter()` (same idea, already in house) |

**Not reused, deliberately:**
- **The warp shader** (rung 5: head turn, breath, hair waves by weighted deformation). It needs hand-authored plates
  per character (a clean inpainted background, weight maps for head, chest and hair, about 20 minutes of hint
  polygons each), and the face warp is still an open decision (OPEN_DECISIONS #8). V3's ambient life comes from the
  camera, parallax, trembling and the lunge instead, which keeps the linework 100% intact.
- **Blender (approach B).** The demo recommends against it for production (16× slower, softer).
- **Rim light and colour wash** on the figures. These still need sign-off.

## Token-emblem experiment: rejected, existing art used

`emblem-comparison.jpg` shows three versions of each character at in-film panel size and in a 2.3× detail:
- **A:** the existing painting, unmodified.
- **B1:** the official mark in its own colours.
- **B2:** the same mark in the painting's own thread and ink tones.

The emblems are a HYPE insignia on Perma-Bull's forearm wrap and a USDC pin on Paper Hands' backpack strap. The
marks are the coin icons served by Hyperliquid's app (`app.hyperliquid.xyz/coins/HYPE.svg` and `USDC.svg`). The USDC
file is the standard Circle coin mark; Circle's own site didn't expose a downloadable file. The variants changed
0.13–0.15% of each figure's pixels and are saved separately in `../../assets/cast-variants/`. The kit paintings and
the film's cut-outs are untouched.

**Decision: A.** The comparison shows:
- **Clarity:** at the size the film shows them, the emblems are about 20–30 px. The HYPE mark reads as a mint blob,
  not a logo, and the USDC pin lands at the very edge of his panel.
- **Brand consistency:** B1 brings mint and Circle blue onto the paintings. The Sumi rule is vermilion as the only
  accent. B2 fixes the palette, but then the shapes stop being recognisable, especially HYPE's.
- **Fidelity:** both read as flat decals on brushed cloth. They have none of the painting's linework, so they look
  pasted on, which is what the brief said to avoid.
- **Balance and fit:** Paper Hands has no tie, lapel or briefcase in his canonical painting (it's a hoodie, a
  backpack and a paper slip). The strap is the only honest place for a pin, and even there it's marginal. Adding a
  briefcase or tie would mean a new outfit.
- **It isn't needed:** the tokens are named in type throughout (the name plates, the versus band, the HUD, the
  band), which is clearer at phone size than any insignia could be.

(Worth knowing for later: putting Circle's mark on the character who gets "eliminated" would also be a
trademark-use question for review.)

The briefcase gag became the **hanging SIGN MESSAGE card**. It's built from the film's own UI rather than an
invented prop, and it's the same joke: the bureaucracy outlives its owner for a beat, then drops with a squeak.

## Exceptions to the motion style guide (for the fight's impact only)

All are confined to the knockout (3.15–4.95 s):

| guide | v3 | why |
|---|---|---|
| Impact shake ≤6 px, 0.38 s, on the ground | 18 px decaying over 0.65 s on the whole frame, plus a 1-frame kick and a 0.5° roll | the one decisive hit has to feel physical. K.O. uses the house ≤6 px |
| The only grade on a painting is the loss grey | 2 ink-negative frames (66 ms) that invert the whole frame, paintings included; the anticipation darkening reaches the panel's edges (≤62% at the corners, face untouched) | the manga impact frame and the lighting of the push-in. Both are transient and leave the painting itself unchanged |
| White flash | 1 frame only | |
| Vermilion: you, your pick, your win | the strike is vermilion | it's your attack. It's the scene's one skewed element; the K.O. is your win |
| Type never across a face | unchanged: no type crosses a face. The strike's ink crosses Paper Hands' chest for ~0.5 s | it has to land on him |
| Whole-figure transforms ≤2° | the launched panel turns up to ~100° as it flies out | it's the knockout. The painting stays whole, inside its frame |

## Visual issues found and fixed during review (frame by frame from the encoded MP4)

- **The stroke crossed Perma-Bull's own face.** In the painting his fist sits to the left of his face, so any stroke
  from the fist to the right passes his mouth. Fixed with the demo's slash sandwich: the stroke is drawn behind his
  panel, so it bursts out at fist height. It also aims at Paper Hands' chest, not his face, so his panic stays
  readable through the hit.
- **The fist position was off by about 150 px.** The panel's coverage clamp, which keeps the painting's edges out of
  frame, moves the painting. Fixed with one shared `panelGeom()` used by both the panels and the effects.
- **The prompt pile hid his face.** Fixed by restacking it around the face, which is the joke's focal point.
- **The shattered prompts flew back across Perma-Bull.** Fixed: they now fly away from him and clear in 0.18 s, so
  the launch reads.
- **The launch lasted about 3 frames.** Fixed: a hard shove, then an accelerating exit. It now reads over about 6
  frames, with a trail.
- **Prompt cards were cut off at the frame edge** in the panic close-up. Fixed: they're pulled in, and every word
  is in frame.
- **Known, kept:** one frame at 0.77 s shows the versus band's wipe opening as a narrow cream box mid-screen. That's
  V2's transition, unchanged.

**Typography gate** (`docs/asset-audit/tools/text_audit.mjs`): nothing sits outside title-safe at rest. Every
out-of-frame or out-of-safe frame is motion (entrances, the shatter, the drop). Key lines are ≥48 px cap: the
title, the names, the prompts at rest, ON ELYSIUM, the headline, NO SWAPS / JUST HYPE, NOW LIVE ON ELYSIUM and the
URL.

**Checked:** every frame from 3.90 to 5.00 s, a frame every 0.25 s across the whole film, and the soundtrack's levels
per beat:

| beat | level |
|---|---|
| the hit at 4.05 s | the loudest peak |
| the push-in silence | −18 to −22 dB |
| the squeak | audible at −15 dB |

Picture and sound share one timing map (`src/films/usdc3/timing.json`).

**Limits of this check:** this environment has no screen or speakers. "Normal playback speed" was checked as every
frame of the encoded MP4 plus the measured audio, not by eye and ear in real time. Please watch it once with sound
before sign-off, especially the announcer: it's synthesised espeak-ng, pitched down and bit-crushed, and may sound
robotic. Use `-novoice.wav` to drop it.

## Sound

All original and synthesised by `tools/audio_usdc3.py` (v1's chiptune voice and helpers, re-scored); nothing is
sampled. The beats it covers:
- the arcade announcer (Round one, Fight!, K.O., Perfect);
- rising prompt dings with error buzzes;
- the music cut dead with one sting on the push-in;
- the panic tremolo;
- the brush whoosh into one enormous impact;
- the launch whistle, shatter and paper rustle;
- the double rubber squeak with a falling slide;
- the K.O. slam and fanfare;
- the whoosh to paper, typing, and the stamp.

## Render

```sh
cd shorts
python3 tools/audio_usdc3.py 01-usdc-eliminated/v3/usdc-eliminated-v3.wav            # --no-voice for the other mix
node tools/render.mjs --film usdc3 --audio 01-usdc-eliminated/v3/usdc-eliminated-v3.wav --out 01-usdc-eliminated/v3/usdc-eliminated-v3.mp4 --crf 17
node tools/still.mjs usdc3 out/stills 3.4 4.0 4.1 4.3 4.55 5.2
NODE_PATH=$(npm root -g) python3 tools/emblem_variants.py                             # the emblem experiment
node ../docs/asset-audit/tools/text_audit.mjs --film usdc3
```

Needs Node 18+, Playwright's Chromium, ffmpeg, Python 3 with numpy and Pillow, and `espeak-ng`
(`apt-get install espeak-ng`) for the announcer.

## Open items

- **Publishing:** post only after the Elysium mainnet launch is confirmed (see the caption file's checklist).
- **The real-money line** is still a placeholder for counsel's wording.
- **The emblem variants** are kept for reference only. Delete `assets/cast-variants/` if you don't want them in the repo.
