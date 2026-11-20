# YOCHI DUELS: THE LAST STAND

A hulking, arrogant brute. A smaller, lethal assassin. One Sudden Death candle. **14.2 s, 60 fps.** The 1920×1080
landscape is the master and the 1080×1920 portrait is recomposed. Status: **draft for owner review. Not published, not
merged.** The original PoC (`../deliverables/`), the casting stage (`../casting/`), V4 and the canonical art are untouched.

| file (`deliverables/`) | what |
|---|---|
| `yochi-duels-last-stand-16x9.mp4` | **master**, 1920×1080, H.264 High + AAC 320k, with the mix |
| `yochi-duels-last-stand-9x16.mp4` | portrait, 1080×1920, recomposed (not cropped) |
| `*-contact.jpg` | timed contact sheets: exact frames every 0.25 s, labelled with time, frame, scene and beat |
| `yochi-duels-last-stand-audio-sync.png` | the mix's waveform and onsets with every timing-map event marked |
| `yochi-duels-last-stand-poster.jpg`, `-poster-9x16.jpg` | the hit-stop frame (9.12 s), both formats |
| `audio/music.wav`, `audio/sfx.wav`, `audio/mix.wav`, `audio/sfx_cues.json` | the separate stems (music + sfx = mix) and the effects cue list |

## The film

| time (s) | beat | what you see | music |
|---|---|---|---|
| 0.00–1.36 | **the threat** | Rampage's fist at the lens, the camera climbing his arm to the grin | bar 1 |
| 1.36–2.73 | the challenger | he fills the frame; Duel Master cuts in from the right, small. 対. brick · mira. SUDDEN DEATH · 10 USDC EACH | bar 2 |
| 2.73–4.09 | he picks, instantly | on the downbeat: **▲ UP**, a hard 決, a punch-in on his grin | bar 3 |
| 4.09–5.46 | she picks, late | her face, an empty panel for half a bar, then **▼ DOWN** and a quiet 決 | bar 4 |
| 5.46–6.82 | the minute runs | him · the live candle · her; the timer drains, and the candle climbs green | bar 5, the sub drops out |
| 6.82–7.36 | **it's his** | his grin, closer; the candle tall and green beside him | pad build |
| 7.36–7.78 | **the reversal** | the candle full frame: the body collapses through the strike, leaving a long upper wick where his win was | build peak |
| 7.78–8.08 | his last grin | he hasn't seen it yet | |
| 8.08–8.55 | **disbelief** | a match cut in true silence: the same framing, the grin gone, his world drained to bare paper. **▼ DOWN** | **2 inserted silent beats** |
| 8.55–8.76 | her eyes | unmoved | silence |
| 8.76–8.93 | the lunge | the attack pose: a camera slam, a Dutch tilt, focus lines | the sub returns |
| 8.93–9.03 | the strike | wide, on paper: she drives in and the ink leaves her blade | |
| **9.03** | **THE HIT** | paper-white, two ink-negative frames, then the page: the stroke runs from her blade through his chest, his body recoiling (the hit pose), black ink exploding off him, hit-stop | **drop 2's big hit** |
| 9.18–10.74 | defeat | he's hurled back into depth, greying and breaking into ink, a fresh burst on each of the drop's hits; she holds her follow-through | drop 2 |
| 10.74–14.20 | **the win** | Duel Master on paper, alive and composed. 勝. mira **+19 USDC**. The house seal stamps: **YOCHI DUELS · SUDDEN DEATH · yochigg.xyz**, held 2.8 s on the ring-out | the final hit, then a controlled decay |

**Duel rules, verified in the app** (`callit.win`, branch `yochi-main`, 20 Nov):
- **Sudden Death** is "one round for the pot". "You both pick the next 1-minute candle", and picks lock before it opens.
- **The winner takes both stakes less the contract's treasury rake** (`app/client/src/evm/duel-fees.ts`, `duelNetPayout`). The rake is read from chain, and it's 5% at launch (the landing page's "5% RAKE"). So 2 × 10 USDC pays the winner **19**, which the app's result screen shows as **+19**.
- A flat candle replays the round (not depicted).
- The film shows the stake once ("10 USDC EACH") and the payout once (+19). No arithmetic on screen.
- Caveat: the app deliberately reads the fee from chain because it can be retuned. If the mainnet rake changes, +19 must change with it.

## Art used (all read-only)

| asset | source | use |
|---|---|---|
| Rampage, kit card | `asset-pack/sumi/avatars/cards/rampage.webp` via `yochi-2p5d` (whole-image: the camera, world light and motes move, the painting never does) | threat, challenger, his pick, the candle panels, his grin |
| Duel Master, kit card | `asset-pack/sumi/avatars/cards/duel-master.webp` via `yochi-2p5d` (figure over ground, breath and sway, parallax) | challenger, her pick, the candle, her eyes, the win |
| Rampage disbelief, Rampage hit, Duel Master attack (hi-res) | owner-approved pose variants, 20 Nov, copied to `assets/poses/` | the match cut, the impact, the lunge and strike |
| Alpha mattes for the hit and attack poses | `tools/matte.py` (GrabCut seeded by distance to paper; original pixels plus alpha only) → `assets/mattes/` | the strike composite |
| Seal, fonts | `asset-pack/sumi/logo/yochi-seal-paper.svg`, `asset-pack/sumi/fonts/` | the lockup, all type |
| Music | `last-candle-standing/v4/music-source/Victory Stamp_dark_dnb.mp3` | the score |
| Effects | V1's synthesised instruments, `last-candle-standing/audio/score.py` | sfx stem |

Kanji (all on the allowed list): 対 versus 1.36–2.73 · 決 locked pick 2.73–4.09 and 4.61–5.46 · 勝 win 10.74–14.20.

## Music and sound

- **One continuous run** of the owner's track from 1:42.32 (a structural bar line), with two edits only:
  1. **Two beats of true silence** inserted just before drop 2. That's the disbelief and her calm; the track's own gap
     there is ~0.2 s, too short for a face to register.
  2. **The ending:** the dry track runs to the end of the final big hit's beat (1:52.37), closes with a 40 ms fade, and
     that last beat rings out through a generated room (low-passed, decorrelated L/R), so the end card holds on a
     controlled decay of the track's own sound, not on a cut.
- No pitch shift, no stretch, no new music. Everything after the insert stays on the beat grid.
- **Sync:** the reversal runs through the build peak; the close lands on the silence; the lunge comes out of the silence
  as the sub returns; the hit is drop 2's big hit; the knockback bursts land on its next three hits; the win is the
  final hit. Measured with an onset detector and checked on the sync sheet. **I couldn't listen to it: please confirm
  by ear**, above all the two-beat silence (does it breathe, or feel like a dropout?) and the ring-out.
- Stems: `audio/music.wav`, `audio/sfx.wav`, `audio/mix.wav` (−14 LUFS integrated, peaks under −1 dBTP). Rebuild with
  `python3 audio/build_audio.py`. It also writes `remotion/src/timing.json`, so a re-timed music edit moves the picture
  with it.

## Rebuild

```bash
python3 tools/matte.py assets/poses/rampage-hit.webp assets/mattes/rampage-hit.png --fill-holes
python3 tools/matte.py assets/poses/duel-master-attack.webp assets/mattes/duel-master-attack.png --keep-flecks
python3 audio/build_audio.py
cd remotion && npm ci && tools/sync-assets.sh          # needs the yochi-2p5d builds of rampage and duel-master
node tools/stills.mjs out/stills 0.5 1.6 7.5 8.15 9.1  # review stills (COMP=Duels-9x16 for portrait)
tools/render.sh 16x9 ../deliverables/yochi-duels-last-stand-16x9.mp4
tools/render.sh 9x16 ../deliverables/yochi-duels-last-stand-9x16.mp4
python3 tools/review.py qc ../deliverables/yochi-duels-last-stand-16x9.mp4
python3 tools/review.py contact ../deliverables/yochi-duels-last-stand-16x9.mp4 ../deliverables/yochi-duels-last-stand-16x9-contact.jpg
tools/patch.sh 16x9 ../deliverables/yochi-duels-last-stand-16x9.mp4 <frames qc flags>   # see Render QC
```

## Render QC

- Both formats: 852 frames, 60 fps, 14.20 s, H.264 High + AAC 320k, picture and sound exactly the same length.
- **The `yochi-2p5d` parallel-render blank-frame glitch** (V4 hit it too) dropped the WebGL painting layer for a single frame
  at random. That was 3 frames in the 16:9 (470, 516, 647) and 7 in the 9:16 (248, 409, 412, 467, 468, 646, 647).
  `tools/patch.sh` re-renders exactly those frames as stills, overlays each on its own frame of the silent render, and
  re-muxes. After patching, `tools/review.py qc` flags nothing in either file. The only solid frames left are the authored
  paper flash (f542) and the two ink-negative frames (f543–544). I also checked every frame that jumps against both
  neighbours by eye: the rest are deliberate (the threat's camera climb, the slide-ins, the lunge, the hit).
- I inspected the key transitions in the encoded files: the grin-to-disbelief match cut (the face, shoulder and sash
  register in place in both formats), the strike sequence frame by frame, and the end hold.

## Remaining weaknesses

1. **The disbelief shot is soft.** The supplied Rampage poses came in at 1086×1448 (the brief asked for ≥2304×3072).
   To register his face with the card's grin, the disbelief image plays at ~2.3×. It holds for half a second in silence,
   and it's the softest shot in the film. A 2× re-render of that one image would fix it with no other change.
2. **Rampage's canonical card can't separate figure from ground** (its matte failed in the house pipeline). His
   canonical shots move with the camera, world light and motes only, no parallax. Duel Master's card gets full 2.5D.
   A re-matte of his card (a prep task) would add depth to the first five seconds.
3. **No hair or cloth motion on the new poses.** They have no flow masks. Their motion is whole-figure: her drive-in and
   follow-through drift, his squash, flight and spin, plus smear and the dissolve.
4. **She barely follows through after the hit** (she holds the attack pose with a 26 px drift). A follow-through image
   would be the next thing to add for a longer cut.
5. **The stroke covers part of his torso during the hit-stop.** It's narrowed and soaks back after 0.25 s, so his head,
   arms and the recoil read, but on a pause the chest is under the ink.
6. **Both faces are cropped at the top in the match cut.** That keeps the card's frame and crests out of the window, and
   it lets the two faces register.
7. **Sync is measured, not heard.** Please judge the two-beat silence and the ring-out by ear.
8. **The +19 is right at the launch rake.** The app reads the rake from chain because it can be retuned; the number must
   follow it.
9. **Decisions still open** from the earlier stages, applied here unchanged:
   - the vermilion stroke crossing the loser (the USDC v3 exception);
   - the ink dissolve on a painting;
   - diagonal panel gutters as each scene's one skewed element;
   - paper as the ground of the strike.
