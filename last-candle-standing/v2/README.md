# BATTLE ROYALE V2: LAST CANDLE STANDING, music-driven

V1 (`../`) rebuilt as one piece with the owner's soundtrack, `music-source/Victory Stamp_dark_dnb.mp3`, a Suno
reinterpretation of the flagship music (sha1 `8248736c…bec37`). **23.6 s, 60 fps.** The 1920×1080 landscape is the
master. The 1080×1920 portrait is recomposed scene by scene, not cropped. Status: **draft for owner review. Not
published.** V1, its renders and all kit art are untouched.

| file (`deliverables/`) | what |
|---|---|
| `br-v2-16x9.mp4` | **master**, 1920×1080, with sound |
| `br-v2-9x16.mp4` | portrait, 1080×1920, recomposed |
| `br-v2-16x9-contact.jpg`, `br-v2-9x16-contact.jpg` | timed contact sheets: a frame every 0.25 s, labelled with time and scene |
| `br-v2-audio.png` | waveform and spectrogram of the mix, every cue of the timing map marked |
| `audio/music.wav`, `audio/sfx.wav`, `audio/mix.wav` | the music edit, the effects, the mix (separate tracks; no narration exists, so there's no narration-free variant to make) |
| `br-v2-poster-16x9.jpg`, `br-v2-poster-9x16.jpg` | thumbnails |

## 1. The music, analysed first

**I couldn't listen.** This environment has no audio playback. Everything below comes from signal analysis
(onset and beat tracking, band energies and spectrograms), and the edit needs a human ear before release.

- **Tempo: 176 BPM, constant** from 12 s to about 204 s. The beat is 0.34095 s and a bar is 1.364 s. Beat *n*
  sits at 12.144 + n × 0.34095 s. The fit holds to the millisecond across five separate sections. (A first
  library estimate of 172 was a frame-quantisation artefact.) The outro then **slows to about 164 BPM**.
- **Phrases** run in 8 bars (32 beats) from 12.144: drop 1 lands on beat 96 and the breakdown starts on beat 224.

| source | section | use |
|---|---|---|
| 0–12 | sparse intro, ticking top end, two sub swells | not used (slow to get going) |
| 12.1–44.9 | first slam, then swelling pre-drop builds | the last 2 bars (42.1–44.9) open the film: the hats climb, the sub drains away |
| **44.9** | **drop 1**: chopped full beat, distorted bass | rounds 1–6 |
| 64–88 | drop 1 continues | not needed |
| **88.5–94.0** | **breakdown**: the top end falls away, sparse ticks, one sub swell | the final two |
| **94.14** | **the return slam**, half a beat after bar 240 | the final candle's close |
| 108–110.5 | sub cut, then a near-silent gap into drop 2 at 110.5 | alternative climax (not used: the breakdown is the better "oppressive" passage) |
| 132–140 | lighter section | not used |
| 197–207 | outro: sustained sub, gated hats | not used |
| **206.2–212.5** | outro downbeat; the sub cuts at 207.3; **the final stab at 209.17** decays to silence | victory, payout, end card |

## 2. The music edit (EDL)

Built by `audio/build_music.py` (reproducible). There's no pitch shift and no time-stretch: every splice is on
a downbeat, with a 12 ms equal-power crossfade.

| video in → out | source in → out | what |
|---|---|---|
| 0.000 → 10.910 | 42.148 → 53.058 | 2 bars of build, then **drop 1 at video 2.728** (src 44.875), 6 bars of drop |
| 10.910 → 17.729 | 88.517 → 95.336 | the breakdown from its phrase start; **true silence 16.366–16.531** (the half-beat before the return, gated); **the slam at video 16.536** (src 94.142) |
| 17.729 → 23.598 | 206.231 → 212.100 | the outro's ritardando; **the final stab at video 20.663** (src 209.165), its decay, 0.9 s fade |

Splice checks: spectral flux at both splices is at the level of an ordinary downbeat (p95), so there are no
click spikes. Both splices are drop-texture to drop-texture on downbeats. **For human review:** the second splice
(17.73) moves from the 176 BPM section into the outro's ~164 BPM ritardando, one bar after the slam. On paper it
reads as the release after the climax, but only listening can confirm it doesn't feel like a stumble.

## 3. The cut against the music

| video (s) | music | picture |
|---|---|---|
| 0.00 | build, bar 1 | sumi floods the paper; the ten faces surface on the beats |
| 0.68 | beat 2 | **10 PLAYERS** |
| 1.36 | bar 2 | **ONE PRIZE POOL**; 1.71: the pool in the ring's centre, **100 USDC**, 10 × 10 USDC IN |
| 2.05 | | life pips light (two each) |
| **2.73** | **drop 1** | **ROUND 1**, the chart rises, the pool moves to the corner HUD |
| 3.07 / 3.75 | beats | ▲/▼ picks pop (**▲ UP OR ▼ DOWN?**) / **PICKS LOCKED** (YOU's 決) |
| 4.77 | beat | the candle closes **▲ UP**; the wrong chips grey out |
| 4.94–5.46 | | four lose a pip: **4 LOSE A LIFE / NOBODY'S OUT YET** |
| 6.14 → 10.91 | drop, 4·3·3·2·2 beats | rounds 2–6 accelerate: ROUND n + the close, the knocked-out paintings slam on the downbeat and grey with 敗 on the next beat; the count 9 → 7 → 4 → 3 → 2 / 10 LEFT; round 3 **YOU: LAST LIFE**. Brush wipes on three cuts |
| **10.91** | **breakdown** | **2 LEFT / ONE LIFE EACH** (the two named) |
| 12.28 | bar | versus: YOU 対 deano, LAST LIFE each |
| 13.30 / 13.98 | beats | 2.5D close-ups: **YOU PICK ▲ UP** (決), **deano PICKS ▼ DOWN** |
| 14.66 | | the giant last candle, the arcade timer, both faces |
| 16.37 | **silence** | the candle hangs crimson under the strike |
| **16.54** | **the slam** | it closes **▲ UP**: paper frame, ink-negative frames, the shake, deano greys and loses his last pip, 敗, **deano OUT** |
| 17.73 | outro | Perma-Bull in 2.5D: **LAST ONE STANDING** |
| 18.46 | beat | 勝 stamps: **TAKES THE POOL** |
| 19.19 / 19.55 / 19.92 | beats | **POOL 100 USDC**, then **−5 USDC · 5% RAKE**, then **+95 USDC** rising green |
| **20.66** | **the final stab** | paper; the Yochi seal stamps on the stab; YOCHI, BATTLE ROYALE, UP TO 10 PLAYERS · ONE SURVIVOR, yochigg.xyz, 18+ · REAL-MONEY GAMEPLAY · PLAY RESPONSIBLY (held 2.9 s while the stab decays) |

## 4. Accuracy

- **Rules** come from the app's own Battle Royale screens (`asset-pack/sumi/reference/screens/real-br-picking.png`,
  `real-br-win.png`): 2 lives each; a wrong pick costs one; 10 × 10 USDC entry; **"LAST ONE STANDING TAKES 95.00
  USDC · 10 × 10 USDC ENTRY · 5% RAKE"**; the win screen's "Last one standing · outlasted 9 · 7 rounds · +95
  USDC". The payout sequence shows exactly that sum. The contract code isn't in this repo, so these app screens
  are the source. If the contract differs, the numbers sit in one place (`data.ts`: `ENTRY`, `POT`, `PAYOUT`).
- **"TAKES THE POOL"** is the app's own wording, and the next two beats show the 5% coming off. I didn't use
  "fee": SHARED-RULES and the app both call it the rake.
- The match is the same table as V1: lives before elimination, no round with everyone wrong (which would
  replay), and an ordinary final round (both on their last life, opposite picks). Picks show once they lock.
- Nothing promises a win. The financial message is the pool and the payout rule, with the responsible-play
  line on the end card. Charts are fictional.
- Publication status is a prop, as in V1 (`none` by default and rendered; `coming-soon`, `testnet`, `elysium`,
  where `elysium` switches the stake to HYPE). Battle Royale isn't a launch film, so the master carries no status
  line.

## 5. What changed from V1

- **Music:** the owner's track replaces V1's synthesised score. The picture is re-timed to its grid, so every
  major event is a musical event: drop = ROUND 1, breakdown = final two, silence + slam = the close, final stab =
  the seal.
- **Landscape first:** every scene has its own 16:9 composition: the ring as a wide ellipse, versus left/right,
  close-ups with a side panel, the candle between the two faces, the hero with a payout panel, a centred end card.
- **The stakes:** V1 only showed money at the end (+95). V2 shows the pool from the opening (**ONE PRIZE POOL,
  100 USDC**), keeps it on screen through every round as the only persistent HUD, and pays it out in three
  readable beats with the rake shown.
- **Less clutter:** no player handles in the ring (the paintings are the identities; YOU and deano are named
  when it matters), no handle or OUT labels on the knocked-out cards, no pool HUD over the face-off. Wrong
  picks grey out with a strike-through at the close, so you can see who pays. Chips on the right of the ring
  flip inward (V1 cut one off at the frame edge).
- **Pacing:** the run is 23.6 s against the brief's 18–22. The extra time goes to the music's own phrasing (the
  build, a full breakdown, the stab's decay) and gives the final two 5.6 s (V1: 3.6 s). The montage accelerates
  instead of ticking at a fixed 0.8 s.
- **Effects:** V1's synthesised effects (ink drops, picks, lock, life loss, knock-out, stamp, brush, impact, payout
  ticks) are reused unchanged, loaded from V1's `audio/score.py`, and re-cued. They sit 8–19 dB under the music
  on average. The music ducks 2–3 dB only under the lock, the 勝 stamp, the payout and the seal, and never under
  its own slam. The mix is at −14 LUFS, −1.4 dBTP. **No announcer** (see V1: a TTS read would hurt it).
- **Kept:** the ten-player ring, the ink flood, the rounds, the candlesticks, the versus, the 2.5D close-ups, the
  last-candle impact (the style guide's fight-impact exception) and the victory.

## Kanji

命 (lives, throughout), 決 (YOU's lock, 3.75 s and 13.47 s), 敗 (knock-outs, 6.5–10.6 s, 16.7 s), 対 (versus and
candle, 12.3–16.5 s), 勝 (18.46 s). All are on the allowed list.

## Render

```bash
cd last-candle-standing/v2
python3 audio/build_music.py          # the music edit + audio/out/edl.json
python3 audio/build_sfx_mix.py        # effects + mix (-14 LUFS)
cd remotion && npm install && tools/sync-assets.sh
npx remotion studio src/index.ts      # BR-V2-16x9 / BR-V2-9x16; the music and sfx props toggle the two tracks
tools/render.sh 16x9 ../deliverables/br-v2-16x9.mp4 [status]
tools/render.sh 9x16 ../deliverables/br-v2-9x16.mp4 [status]
python3 tools/review.py contact ../deliverables/br-v2-16x9.mp4 ../deliverables/br-v2-16x9-contact.jpg
```

About 15–20 min per format on 4 cores (software GL). All timings are in `remotion/src/timing.json`, which was
derived from the EDL.
