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
| `yochi-duels-last-stand-poster.jpg` | the thumbnail frame |
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
```
