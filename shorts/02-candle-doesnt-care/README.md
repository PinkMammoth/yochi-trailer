# 02 · THE CANDLE DOESN'T CARE

A serious, beautiful samurai-film opening, played completely straight for six seconds, and then a giant red
candle falls out of the sky. **14.25 s, 1080×1920 (9:16, vertical-first), 60 fps, H.264 + AAC.**

| file (`deliverables/`) | what |
|---|---|
| `candle-doesnt-care.mp4` | **The film**: captions on, original score and effects, no narrator |
| `candle-doesnt-care-poster.jpg` | thumbnail (frame 0) |
| `candle-doesnt-care-storyboard.jpg` | timed storyboard: a frame every 0.25 s, each labelled with the beat and the mix level |
| `candle-doesnt-care-impact.jpg` | every frame from 7.40 to 8.10 s: the turn from cinema into absurdity |
| `audio/candle-{mix,music,sfx,vo}.wav` | the separable stems (48 kHz / 24-bit). `vo` is the empty voice-over slot |
| `../VO_SCRIPT.md` | the narration cue sheet and direction for a recorded read |
| `CAPTIONS.md` | post copy |

Nothing in `asset-pack/`, `yochi-2p5d/` or any other film was modified.

## The cut

| t (s) | beat | picture | sound |
|---|---|---|---|
| 0.00 | **wide** | Cold Blooded, low angle, under an enormous blood moon; ink-wash mountains, mist, snow. Slow tilt down and push (camera only, parallax across 9 depth layers) | drone, wind, a plucked phrase |
| 0.30 | caption | *I have studied the markets / for twenty years...* | |
| 2.50 | **insert** | hard cut to his hand closing on the white mask, the face above it, the moon filling the sky; slow push | soft drum on the cut |
| 2.70 | caption | *I have mastered / technical analysis...* | |
| 5.00 | **eyes** | letterboxed strip of his eyes, slow push | drum, a rising string tone, heartbeat |
| 5.20 | caption | *I cannot lose.* | |
| 6.40 | **silence** | cut back to the wide, held | **digital silence** (measured −120 dB) |
| 7.12 | the shadow | a shadow falls over him; the moonlight dims | still silent |
| 7.46 | the candle | a standard OHLC down candle enters, motion-smeared | a 0.16 s air rush |
| 7.70 | **impact** | 2 frames paper-white with the warrior and candle in one ink mass and the splat; 4 frames (≈2 at 30 fps) ink negative; 0.1 s hit-stop; 22 px shake with a 0.6° roll, decaying over 0.75 s | sub drop, crunch, wet ink splash, debris |
| 7.80 | sandals | two zori fly up and out of frame; ink drops, snow spray, a billow of snow; he's gone | two thin whistles; a ringing tone fading |
| 8.90 | one returns | one sandal falls back in... | a small falling whistle |
| 9.18 | **squeak** | ...lands on top of the candle, hops once (9.36), rocks, settles (9.66) | tiny rubber squeak, a smaller one on the hop |
| 9.66 | pause | nothing moves but the snow | silence |
| 10.00 | **title** | THE CANDLE / DOESN'T CARE. slams in over the sky | one deadpan low pluck |
| 11.60 | **end card** | paper. The seal stamps (11.75), YOCHI slams, *Call it right. Take the pool.*, **yochigg.xyz**, 18+ · PLAY RESPONSIBLY. Held 2.5 s | hanko thump, the phrase resolves |

Muted, it reads: the lines are captioned, the candle is a candle, the sandal is a sandal.

## Pacing (the HYPE vs USDC V3 lesson)

The brief asked for 10 s. It's 14.25 s, because:
- the three lines each hold long enough to read on a phone (2.05 s, 2.15 s, 1.1 s), at 66 px (≥48 px cap height);
- the silence before the candle is **1.06 s** of nothing plus 0.58 s of shadow and fall. That's the anticipation
  the gag depends on. At 0.3 s it read as a glitch;
- after the squeak there's a 0.34 s still beat before the title, so the sandal lands as its own joke;
- the end card holds 2.5 s (house rule).

Fast editing is confined to the 0.6 s around the impact.

## Art direction and decisions

**The warrior: Cold Blooded (v2).** Picked by job from the 2.5D-prepared cast:
- **Duel Master** has the sword in hand, but her house matte keeps chunks of her vermilion disc. That's fine on her
  own ground, but on a night sky it would read as red debris.
- **Ronin** has his hand on his sword, but he's grinning. That's an early comic cue, which the brief forbids.
- **Untouchable** is blindfolded, so there's no "eyes" shot.
- **Cold Blooded** is solemn. His eyes are open and he's looking up, at exactly where the candle comes from. He's the
  ice character, which gives the snow.

The painting is the kit's (`asset-pack/sumi/avatars/cards/cold-blooded-v2.webp`, SHA-1 `5818532d…`) through
the house BiRefNet matte (`yochi-2p5d/characters/cold-blooded`). `tools/clean_matte.py` makes a film-local copy
that removes stray card-paper fragments from the matte's edge. **Only alpha is reduced. No painted pixel is
changed.** The mask, the hand and the face are protected from the rule.

**"Hand on the weapon."** Cold Blooded's painting doesn't show a sword. Repainting one would break the house rule,
so the insert at 2.5 s frames his hand closing on the white mask instead. The original pose is kept, and nothing
is invented.

**Motion.** House 2.5D grammar (`yochi-2p5d`), rungs 1–4 only:
- the camera: tilt, push and truck, with layer zoom by depth;
- rigid ambient on the figure: 0.42% breath and 0.22° sway about the frame-edge anchor;
- no warp and no rig.

The scene is composed on Canvas 2D in its own small Remotion project, because `CharacterShot` composites a figure
over its *own* painted ground, and this film needed a new environment behind him. The pipeline isn't modified.
The prepared character, the depth-zoom model (`layerZoom`), the impact grammar (`IMPACT_DRAMATIC`: shake,
hit-stop, flash, ink-negative frames) and the ink-negative mapping are the pipeline's.

**The world** is our own layers (rung 3), generated procedurally by `tools/make_world.py`. There are no
environment paintings in the kit, and nothing was AI-generated or sourced. The layers:
- a sumi night sky with washi fibre;
- the moon;
- dark ink-wash cloud wisps across the moon;
- three sumi-e mountain ranges with dry-brush crests;
- drifting mist;
- snow in two depth bands, the near flakes out of focus;
- grain at 24 fps.

**Kit rules that overrode the brief** (SHARED-RULES and the kit README outrank the brief, per `CLAUDE.md`):
- **No cherry blossom.** The kit bans it by name as a cliché. The drifting particles are **snow** instead: they're
  just as haunting, they belong to the ice character, and the same burst grammar works.
- **The moon isn't vermilion.** Vermilion means *you / your win* and is never decoration. The moon is a dusky blood
  crimson mixed from the **down-candle crimson** (`#ff4d6d` at about 45% into sumi). It reads as a crimson moon,
  and it quietly rhymes with the candle that kills him. It has no rays, so it isn't a rising sun.
- **The candle** is a standard OHLC down candle: flat `#ff4d6d`, a body and wicks, with no brush or texture. The
  flatness against the painting is part of the joke.
- **The ink explosion** is sumi ink and snow, never vermilion.
- **No kanji are used.** No 敗 seal either: a loss stamp would explain the joke.
- **Copy:** no em-dashes and none of the banned words. "Call" appears only in the tagline.

**Sandals.** The painting doesn't show his feet. The sandals are simple zori (a straw sole and a dark cloth strap)
drawn in code as a graphic prop, in ink outline, never touching the painting. Flag for review if the owner wants
props from a painted source instead.

**Impact exceptions** (house limits apply everywhere else), matching the USDC v3 precedent:
- a 22 px decaying shake with a 0.6° roll;
- 2 paper-white frames at 60 fps (33 ms, inside the house 2-frames-at-30 fps limit);
- 4 ink-negative frames at 60 fps (≈2 at 30 fps).

**Figure lighting:** none (OPEN_DECISIONS #7). The falling shadow is a world layer passing over the figure, and the
painting itself is never tinted.

## Sound

Everything is original and synthesised in `tools/make_audio.py`, so nothing needs licensing:
- **the score:** a drone and wind, Karplus-Strong plucked-string phrases in a D hirajoshi mode, two soft drums on
  the cuts, a string tone and heartbeat on the eyes, then a hard cut to true silence. No gongs (kit rule);
- **the effects:** the impact (sub drop, crunch, granular wet splash, debris), the ringing, the whistles, the
  squeaks and the hanko thump.

Music, effects and voice are separate stems.

Measured levels per beat (RMS / peak, dBFS):

| beat | rms | peak |
|---|---|---|
| act one wide | −20.7 | −9.4 |
| medium / eyes | −16.4 / −14.2 | −2.9 / −3.2 |
| **silence** | **−120** | digital zero |
| impact | −13.1 | **−1.0 (the loudest moment)** |
| squeak | ≈ −24 | ≈ −12 |
| end card | −26 | −7 |

**No narrator.** The only speech synthesis reachable here is espeak-class, and the brief asks not to use a robotic
voice. The film ships captioned and narration-free, and `VO_SCRIPT.md` has the cue sheet and direction for a
recorded read. `VO=read.wav python3 tools/make_audio.py` places it and ducks the music.

**Limits of review:** this environment has no screen or speakers. I didn't watch or hear the film in real time.
Timing was checked through every frame of the impact sequence from the encoded MP4, a timed storyboard every
0.25 s with the mix level at each frame, and the measured level map above. Please watch it once with sound before
sign-off, especially the length of the silence and the squeak.

## Formats

The master is 9:16 only. The brief asked for 1080×1920, and the concept is vertical-first: a tall moon, and a
candle falling the height of a phone. A 16:9 version would need the composition rebuilt rather than cropped (the
cut-out's card edges limit how wide he can sit), so it isn't made yet. It's an open item if wanted.

**Publication status:** this isn't a launch film, and it makes no Elysium claims. The end card takes an optional
`status` prop (`COMING SOON` / `LIVE ON TESTNET` / `NOW LIVE ON ELYSIUM`) for a cut that needs one, and it's off
by default.

## Rebuild

```bash
cd shorts/02-candle-doesnt-care
pip install opencv-python-headless numpy pillow
(cd ../../yochi-2p5d && python3 prep/prepare_character.py cold-blooded)    # the house plates (not committed)
python3 tools/clean_matte.py ../../yochi-2p5d/characters/cold-blooded/build/fig.png project/public/cast/cold-blooded-fig.png
python3 tools/make_world.py                 # world plates -> project/public/world (committed; ~45 s)
python3 tools/make_audio.py                 # stems -> project/public/audio
cd project && npm install
npx remotion render src/index.ts Candle-9x16 out/candle.mp4 --gl=swangle --concurrency=4 --crf=16 \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
node tools/stills.mjs out/stills 0 7.7 9.2       # PNG stills at given seconds
python3 ../tools/contact.py out/candle.mp4 public/audio/candle-mix.wav out/storyboard.jpg
```

All timings live in `project/src/timing.ts`. The audio script reads the same file.

## Assets and attribution

| asset | source | provenance |
|---|---|---|
| Cold Blooded v2 painting | `asset-pack/sumi/avatars/cards/cold-blooded-v2.webp` | owner's kit, v2 canon (15 Nov) |
| figure matte | `yochi-2p5d/characters/cold-blooded/source-matte.png` (house BiRefNet, `claude/yochi-first-ad-order-a` 84d3dca) | cleaned copy: `project/public/cast/cold-blooded-fig.png` |
| seal | `asset-pack/sumi/logo/yochi-seal-paper.svg` | kit, copied unchanged |
| fonts | Dela Gothic One, Zen Kaku Gothic New, JetBrains Mono (`asset-pack/sumi/fonts`, OFL) | copied |
| world, candle, sandals, ink, snow | procedural, this folder | original |
| score and effects | `tools/make_audio.py` | original, synthesised |

## Review log

- **v1:** the medium shot read as a near-copy of the wide in the storyboard, so the cut didn't register. It's now an
  insert on the hand and mask, framed so the caption sits over the moon and never crosses his face.
- **v1:** the impact flash held 3 frames because of a float boundary. It's now exactly 2 frames at 60 fps, then 4
  ink-negative frames.
- **v1:** the captions were 62 px (≈45 px cap). They're now 66 px.
- The matte's blocky left fur edge is pushed out of frame and under an edge falloff.
- **Checked:** the timed storyboard (every 0.25 s with the mix level), every frame from 7.40 to 8.10 s
  (`candle-doesnt-care-impact.jpg`), and stills at full size. Title-safe and cap heights were measured on the
  stills. The repo's `text_audit.mjs` targets the canvas shorts engine, not this Remotion project, so it wasn't run.

## Open items

- **Voice:** record a read to `VO_SCRIPT.md`, or approve the captioned-only version.
- **The cherry-blossom and moon substitutions:** if the owner wants the brief's literal petals or a brighter red
  moon, that needs an explicit exception to SHARED-RULES.
- **16:9 recomposition:** not made.
- **Owner approval** before any posting.
