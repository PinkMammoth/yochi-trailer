# Flagship v2: soundtrack structure and cue map

**I can't hear audio.** The edit is built from objective measurement (onsets, per-bar loudness and sub energy,
phrase novelty; `flagship-animatic/audio/analyse.py`, `docs/music-map.png` there). Matching tempo, key and phrase
lines is not proof that an edit sounds right. **Please audition the splice at 41.77 s first.**

- **Track:** `last-candle-standing/v4/music-source/Victory Stamp_dark_dnb.mp3` (the owner's dark DnB reinterpretation,
  md5 `009011fa…`, the same file THE LAST STAND uses). 213.4 s, 176 BPM (beat 0.34095 s), 8-bar phrases from 12.144 s.
- **Builder:** `film/audio/build_flagship_audio.py` → `film/audio/out-flagship/{music,sfx,mix}.wav`, `edl.json`, and
  the picture's timing map `film/remotion/src/flagship/timing.json`. Re-timing the music re-times the picture.

## The edit (79.17 s)

| video | source | what |
|---|---|---|
| 0.000–8.081 | 102.318–110.399 | **THE LAST STAND v2's opening, unchanged** (its in-point, mid-phrase, as approved) |
| 8.081–9.104 | — | **its 3 inserted silent beats** (approved) |
| 9.104–41.774 | 110.399–143.070 | continuous: drop 2 (bars 72–87) and the lighter section (bars 88–95). THE LAST STAND stopped at 115.44; the flagship just keeps going |
| **41.774** | **splice** | **bar 96 → bar 120**: the lighter section's re-entry is replaced by drop 3, the track's loudest drop. Phrase line to phrase line; 10 ms / 12 ms fades |
| 41.774–78.0 | 175.802–212.000 | continuous to the track's own ending: drop 3, the build, the outro slam, the final slam, the last stab, its decay (0.8 s fade on the decay) |
| 78.0–79.17 | — | end-card tail |

**Why this shape.** The Duels short spent the track's best material on its last two seconds. Here drop 2 carries
the strike, the victory *and* the reveal; the lighter section is the pick window's doubt; drop 3 is the candle
opening; the build is the reversal; the loudest bar in the file (136) is the close; the real ending is the end card.
The expansion in the music (drop 2's second half, bar 80) and in the picture (the gorge) land on the same bar.

**One splice, and why there.** Bar 95 is sparse (the lighter section thinning out) and its natural successor, bar 96,
is a sub slam. Bar 120 is also a sub slam after a phrase line. Same track, tempo, key and position in the phrase, so
the risk is harmonic or melodic: whether bar 120's material needs bars 104–119 to prepare it. Fall-backs, in order:
1. bar 104 → bar 120 instead (keeps one phrase of drop 2b; the candle's dive starts on bar 96; +10.9 s → 90 s);
2. no splice into drop 3: bar 96 continuous to bar 104, then splice bar 104 → bar 136 (the outro slam) for the close
   (about 75 s, loses drop 3);
3. your own edit from the stems: the picture's timings follow `timing.json`.

**Silence (owner's option).** The approved 3-beat silence stays. A second, shorter one (the last half-bar of bar 135,
before the outro slam) would make the close hit harder. It's a music decision, so it isn't in this edit.

## Cue map

| video | bar | music | picture |
|---|---|---|---|
| 0.00–11.07 | 66–73 | groove, riser, silence, drop 2's hit | **THE LAST STAND** (approved) |
| 12.95 | 73 | drop 2 hit | 勝 · mira +19 USDC |
| 13.80 | 74 | drop 2's strongest hit | (the standalone film's lockup; here: nothing. Let it ring on her) |
| **14.50** | 76 | phrase line | **the pullback begins** |
| 17.23 | 78 | | the hand-over to the full-figure plate; the camera rises |
| **19.95** | **80** | **drop 2's second half: the expansion** | **THE GORGE · FREE FOR ALL** |
| 22.68 | 82 | | High Roller arrives |
| 25.41 / 26.77 | 84 / 85 | | across the gorge / Cold Blooded picks DOWN |
| 28.14–30.18 | 86–87 | 2-beat hits | the ensemble: four panels on four hits |
| **30.86** | **88** | **the lighter section** | Lucky Fool |
| 33.59 / 34.96 | 90 / 91 | | her 5 USDC / the whole gorge, the pool said once |
| 36.32 | 92 | accent | PICKS CLOSE |
| 37.68 | 93 | | four 決 on four beats |
| 39.05 | 94 | sparse | the held breath |
| **41.77** | **120 (splice)** | **DROP 3** | **the candle opens and dives; ink floods the sky** |
| 44.50 / 47.23 | 122 / 124 | | DOWN winning / UP shaken |
| 49.96 | 126 | | Untouchable, the still point |
| **52.68** | **128** | **the build** (top end out, rising) | **the turn** |
| 55.41 / 58.14 | 130 / 132 | rising | the climb / the edge |
| 60.87 | 134 | the build's last bars | 0:01 |
| **63.59** | **136** | **THE OUTRO SLAM** (loudest bar in the file) | **CLOSED UP · the ink wave** |
| 65.31 / 65.99 / 66.66 | 137 | 2-beat hits | three losses |
| 67.35 / 68.03 / 68.72 | 138 | 2-beat hits | three wins (Lucky Fool on 68.03) |
| 69.40 | 139 | | "The side that's right splits the pool." |
| **70.41** | 140 | **the sub cut** (the breath) | Duel Master turns and steps down |
| 72.61 | 142 | | next candle (Rampage, optional) |
| **74.51** | **144** | **the final slam** | ink floods back to paper |
| **75.15** | | **the last stab** | **the seal stamps** |
| 75.15–79.17 | | the decay | the end card holds 4.0 s |

## Stems

- `music.wav`: the edit alone (no ducking; THE LAST STAND's ducks under his lock and the seal are not carried, since
  the owner is mastering).
- `sfx.wav`: THE LAST STAND v2's own SFX stem for 0–13.70 s (its lockup seal stamp at 13.74 dropped with the card),
  then placeholder synthesis, cue-listed in `edl.json`.
- `mix.wav`: music ×0.85 + sfx ×0.65, peak-normalised. The animatic MP4 carries it.
