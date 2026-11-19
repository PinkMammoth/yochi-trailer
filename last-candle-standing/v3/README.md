# BATTLE ROYALE V3: one continuous soundtrack

V2 (`../v2/`) with its soundtrack fixed. The picture, assets, gameplay, final confrontation, payout and both
compositions are V2's; only the timing after the final candle follows the new music. **25.0 s, 60 fps.** The
1920×1080 landscape is the master; the 1080×1920 portrait is the recomposed V2 portrait. Status: **draft for
owner review. Not published.** V2 and every earlier output are untouched.

**I couldn't listen.** This environment has no audio playback. Everything below is technical analysis (beat and
onset tracking, band energies, pitch-class content, spectral flux at the splices). The musical approval is yours.

| file (`deliverables/`) | what |
|---|---|
| `br-v3-candidate-A-continuous.wav` | **candidate A**, music only |
| `br-v3-candidate-B-victory-release.wav` | **candidate B**, music only (used for the film) |
| `br-v3-music-comparison.png` | V2, A and B on one time axis: spectrograms, splices (red), marks (green) |
| `br-v3-16x9.mp4` | **master**, 1920×1080, with sound (B) |
| `br-v3-9x16.mp4` | portrait, 1080×1920, with sound (B) |
| `br-v3-16x9-contact.jpg`, `br-v3-9x16-contact.jpg` | timed contact sheets (exact frames, every 0.25 s) |
| `audio/music.wav`, `audio/sfx.wav`, `audio/mix.wav`, `audio/edl.json`, `audio/sfx_cues.json` | the separate tracks, the mix, and the edit and cue lists |

## What was wrong with V2

V2 cut at 17.73 s from source 95.336 (the 176 BPM groove one bar after the climax) to 206.231 (the track's outro).
The analysis agrees with your ear on three counts:
- **The tempo drops.** The outro is a ritardando, about 164 BPM against 176.
- **The texture changes.** The drums give way to a sustained tonal bed.
- **The harmonic colour shifts.** Pitch-class similarity to the material before it is 0.70–0.89, the lowest of any
  section. Drop 1, the slam bar and drop 2 all score 0.96–0.99 against one another.

## Analysis of what follows the slam

| source (s) | what's there |
|---|---|
| 94.135 | the breakdown's return: the sub re-enters (the slam transient is at 94.142) |
| 94.1–107.9 | drop 1's groove continues, flat and without strong accents (every onset ≤ about 1.0) |
| 107.94 | the sub drops out: drop 2's own run-up, a pad over the drums |
| 110.38–110.48 | a built-in silence in the sub |
| **110.500** | **drop 2**: the sub re-enters, then its first big hit at **110.660** (the strongest transient in the area) |
| 112.368, 115.095, 117.825 | drop 2's next big hits, every 8 beats from 112.368 |

The slam and drop 2 are exactly 48 beats (12 bars) apart, so they share one phrase grid. The structural
downbeats sit on that phase: 94.135 + n × 1.3638 s.

## The two candidates

Both keep V2's first two regions exactly: source 42.148–53.058 (build + drop 1) and from 88.517 (the breakdown,
the half-beat of true silence, the slam at video 16.536). Neither uses a pitch shift, a time-stretch or new music.
Both end with the track's own sound: the final hit's beat, a 40 ms close just before the next transient, and a
2.2 s tail (the last beat through a generated room, low-passed and decorrelated).

| | **A: continuous** | **B: victory release (recommended)** |
|---|---|---|
| after the slam | **no splice**: the groove simply carries on | 1 bar of groove, then **one splice** at video **17.892**: source 95.499 → **107.772** (both structural downbeats; drop 2's run-up, 2 bars before the drop) |
| EDL | v 0–10.910 = src 42.148–53.058 · v 10.910–22.325 = src 88.517–99.931 | v 0–10.910 = src 42.148–53.058 · v 10.910–17.892 = src 88.517–95.499 · v 17.892–22.820 = src 107.772–112.700 |
| the release | none: one texture to the end | run-up from 18.06 (sub drops out), the source's own silence at v 20.50–20.62, **drop 2 at v 20.620** (hit 20.780) |
| the stop | v **21.984** = src 99.590, the 4th bar line after the slam (a weak downbeat, onset 0.5); stop 22.325 | v **22.488** = src 112.368, drop 2's second big hit (onset 2.7); stop 22.820 |
| length | 24.5 s | 25.0 s |
| splice check | none after the slam | flux at the splice 39 (median 12, p95 34, p99 47): a strong downbeat, not a spike. Pitch-class similarity slam bar → run-up 0.96 |

**Why B.** Both are coherent, since everything after the slam comes from one tempo, one key and one phrase grid.
A is the safest: there's nothing to hear because nothing changes. But that's also its weakness. After the
climax it just keeps grooving and has no accent to end on. Its stop lands on an unaccented downbeat, so the
ending would be made by the edit, not by the music.

B does what the brief asks of the victory. The music draws breath (the run-up) while LAST ONE STANDING / TAKES THE
POOL / the pool maths read. It stops for a moment (the source's own gap), and **drop 2, the track's strongest
section, arrives exactly as +95 USDC lands**. The film then ends on a real hit, with the seal on it. B's one
splice sits on the picture cut from the candle to the hero, which masks it further, and it joins drop 1's
groove to drop 2's run-up, two passages of the same production in the same key and tempo.

**Risk to check by ear:** in B the phrase compresses. The listener hears 1 bar after the slam, then the last
2 bars of a later phrase. This edit is common in DnB and the texture matches, but it's the thing to listen for.
If it sounds wrong, A is ready: `python3 audio/build_candidates.py A` writes A as `music.wav`. The picture would
then need re-timing after 17.9 s, because the payout and end card currently follow B.

## Picture changes (V2 → V3)

| video (s) | V2 | V3 (on B) |
|---|---|---|
| 0–17.73 | | unchanged |
| 16.54–17.89 | deano OUT, 1.2 s | deano OUT, 1.36 s (one bar) |
| 17.892 | hero | hero, **on the splice downbeat**: LAST ONE STANDING |
| 18.574 / 19.256 / 19.938 | | 勝 + TAKES THE POOL / POOL 100 USDC / −5 USDC · 5% RAKE, one per two beats over the run-up |
| **20.620** | | **+95 USDC on drop 2** (held 1.36 s, one bar) |
| 21.984 | | the end card: BATTLE ROYALE, UP TO 10 PLAYERS · ONE SURVIVOR |
| **22.488** | | **the Yochi seal and YOCHI on the music's last hit**, then the URL and responsible play |
| 22.82 → 25.02 | | the music stops; the tail rings under the end card (3.0 s held) |

## Mix

- **Separate tracks:** music, effects and mix, with no announcer.
- **Loudness:** −14 LUFS integrated, −1.5 dBTP. A static gain only: V2's soft-clip stage is removed, so the
  track keeps its own dynamics.
- **Effects that compete less with the music:**
  - The final-candle impact is lower and starts 10 ms after the music's slam, so the slam leads.
  - The +95 has no chime, just a light coin run after drop 2's first hit.
  - The seal's stamp sits under the music's last hit.
  - There's no ducking on drop 2 or on the last hit. The music still ducks a few dB under the two pick locks and
    the 勝 stamp.

## The money

- **Currency is now its own prop** (`currency: 'USDC' | 'HYPE'`, default USDC), separate from the publication status.
- **The film doesn't say HYPE is the live collateral on HyperEVM.**
- **A HYPE render refuses to run** until `data.ts` carries confirmed HYPE amounts (`CONFIRMED_AMOUNTS.HYPE` is
  `null`). No HYPE stake or fee is invented. Elysium films also need this now, since on Elysium the stake is HYPE.
- **The amounts are verified against what the repo has.** There's no game or contract code here. The app's own
  Battle Royale screens (`asset-pack/sumi/reference/screens/real-br-picking.png`, `real-br-win.png`) show "LAST ONE
  STANDING TAKES 95.00 USDC · 10 × 10 USDC ENTRY · 5% RAKE" and "+95 USDC". SHARED-RULES says the rake is 5% and
  gives the same 10 × 10 → 95 example. The film's numbers come from those, defined once in `data.ts`.
- **Open question:** the app's glyph registry (`reference/code/seal-glyphs.ts`) lists two Battle Royale endings
  with no champion, a **split pot** and **entries returned**. The film shows a champion outcome, which is
  accurate, but the end card's "ONE SURVIVOR" reads as a guarantee. Please confirm the rules (or the contract)
  before release. "UP TO 10 PLAYERS · LAST ONE STANDING TAKES THE POOL" would be a safe alternative.

## Rebuild

```bash
cd last-candle-standing/v3
python3 audio/build_candidates.py B     # both candidates + music.wav (B) + edl.json
python3 audio/build_sfx_mix.py          # effects + mix
python3 audio/compare.py deliverables/br-v3-music-comparison.png
cd remotion && npm install && tools/sync-assets.sh && cp ../audio/out/{music,sfx,mix}.wav public/audio/
tools/render.sh 16x9 ../deliverables/br-v3-16x9.mp4
tools/render.sh 9x16 ../deliverables/br-v3-9x16.mp4
```
