# 予知 (YOCHI): treatment

A 34-second Yochi trailer in sumi-e ink, cyan on the void, rendered entirely in code.

## The idea in one line
**Knowing before.** A faint stroke draws the future, the price paints over it exactly, and the
money lands: the name made literal, in ink.

## Who it is for, and the test
Someone scrolling X with the sound off. Every frame is judged against one question: does this make
playing feel like the obvious next step? The film is not an explainer and not a feature tour. It
shows one mechanic three times (a line, a prediction, money when it comes true) and then signs its
name.

## World rules
1. **The paper is the void.** Brand void `#07060c` is the paper. It has a faint fibre (a static
   paper texture, not a moving grain), and ink sits on it, soaks into it and dries on it.
2. **Ink is light.** Ink is cyan `#18e0ff` with off-white `#f5f3ff` in its densest, wettest core.
   Green `#39ff14` and red `#ff3860` appear only in the stroke that resolves a candle (and green in
   the payout, because a payout is a win). No other hue, ever.
3. **The strike line is one horizontal brushstroke.** It is laid down in the first frame and
   everything else is measured against it.
4. **Price is a loaded brush dragged across the paper.** It has pressure, speed, texture,
   dry-brush breakup (飛白, the white streaks where the bristles run out of ink) and bleed (滲み,
   ink feathering into the fibres). Calm price is a slow wet line; sudden price is a fast dry
   stroke that throws splatter.
5. **Candles are brush marks.** UP closes with one bold upward stroke. DOWN closes with a downward
   stroke whose ink keeps going: it bleeds and drips down the paper.
6. **The ghost stroke is the future.** A thin, faint, unloaded stroke (barely touching the paper)
   draws the path first. A beat later the loaded brush follows it exactly. This is the only
   "effect" in the film that is not ink behaving like ink, so it is the one the eye learns.
7. **Ma (間).** Very little on screen at once. Empty paper is a composition element, not a gap to
   fill. Calm, then sudden. The silences in the music are held in the picture.
8. **Respect for the calligraphy.** 予 (4 strokes) and 知 (8 strokes) are written stroke by stroke
   in the correct order, each stroke with a real entry (起筆), body and ending: stop (止め), hook
   (跳ね) or sweep (払い). No font is used for the kanji anywhere, so no faux-Japanese type, and none
   of the usual "oriental" props (no gongs, no blossom, no seal-stamp wallpaper).

Stroke order used (standard Japanese order):
- 予: ① ㇇ horizontal then sweep down-left, ② 丶 dot, ③ ㇖ horizontal with a hook, ④ 亅 vertical
  with a hook to the left.
- 知: 矢 then 口. ① ノ short sweep, ② 一 short horizontal, ③ 一 longer horizontal, ④ ノ long sweep
  from the top through both horizontals, ⑤ 丶 dot (the 矢's last stroke shortens to a dot on the
  left of 知), ⑥ 丨 the left side of 口, ⑦ 𠃍 top and right side in one turn, ⑧ 一 the closing base.

## Typography
- No headline type until the payout. The film's first words are UP and DOWN, small, either side of
  the strike line.
- JetBrains Mono for money and labels: `+48.00 USDC` is large (cap height over 60px at 1080p),
  written on with a brush underline in green.
- Chakra Petch 700 for YOCHI on the end card only.
- 予知 is brush-written, never set.

## Music (placeholder until `asset-pack/audio/yochi.wav` exists)
90 BPM, beat 0.667 s, bar 2.667 s, first downbeat at 0. Sparse: deep, dry, low drum hits (felt more
than heard, no gong, no flute cliché), a breath of air and paper, a brush swish under each fast
stroke, and real silences. Every time below lives in `src/core/music.js`; the scenes only ever ask
that module for times, so the real track drops in by remeasuring (`tools/measure.py`), not by
re-editing scenes. `audio/click.wav` is a click track (beats, bar downbeats, and the hit list) to
judge the cut against.

## Beat sheet

| time (s) | music | picture |
|---|---|---|
| 0.00 | **HIT** + tearing swish | First frame (the thumbnail): one heavy cyan stroke already tearing across the black, its wet white-hot head two thirds of the way over, dry-brush streaks breaking up behind it, droplets in the air. It finishes by 0.25 s, splatter landing. |
| 0.25 to 2.67 | ring-out, air | The stroke bleeds into the paper. From beat 3 the camera pulls back and the stroke becomes the strike line across a much bigger, emptier sheet. UP fades in above it, DOWN below, HYPE on the left. |
| 2.67 to 7.33 | sparse soft taps on beats 1 and 3 | **Calm.** A slow wet brush drifts out of the line and meanders right, barely moving: small dips, small marks, a lot of empty paper. |
| 7.33 to 8.00 | **silence** | Everything holds. The brush head trembles on the paper. |
| 8.00 / 8.33 | **HIT**, **HIT** | **Sudden.** The price rips down, then up, in one fast violent dry stroke that leaves the frame, throwing splatter across the sheet. A small shake. |
| 8.40 to 10.67 | decay | The violence settles, drips run from the low stroke, the sheet fades out. |
| 10.67 | bar 4 | Fresh sheet: strike line, a short price path ending at its head. FREE FOR ALL · 5M. |
| 10.67 to 11.60 | a rising breath | **Foresight.** A thin ghost stroke draws ahead of the head, curving up and away to the right. UP marks its tip. |
| 11.67 to 12.67 | **silence** | The ghost hangs there. Nothing else moves. |
| 12.67 | accent | The loaded brush follows the ghost exactly, accelerating, eating it as it goes. |
| 13.33 | **HIT** (bar 5) | The candle closes: one bold green upward stroke. `+48.00 USDC` writes on beside it with a green brush underline. |
| 16.00 | bar 6 | Fresh sheet, mirrored composition. DUEL · 1M. Faster this time. |
| 16.00 to 16.33 | | Ghost draws down. DOWN marks its tip. |
| 16.67 | accent | The brush follows exactly. |
| 17.33 | **HIT** | Red downward stroke: the ink bleeds and drips down the paper. `+90.00 USDC` in green. Twice now: skill, not luck. |
| 18.67 | **HIT** (bar 7) | **The strokes gather.** All the ink on the sheet lifts off as a stream and flows to the centre, where it becomes the brush that writes 予, stroke by stroke on the beat and its eighths. |
| 21.33 | **HIT** (bar 8) | 知, faster, eight strokes. |
| 24.40 to 26.00 | held chord, air | 予知, large and calligraphic, alone on the sheet. Under it, small: yochi · knowing before. |
| 26.00 to 26.67 | swell | The kanji's ink lifts and flows inward. |
| 26.67 | **HIT** (bar 10) | It settles into the Y mark, clean cyan. |
| 27.33 to 29.33 | on the beats | End card builds: **YOCHI**, then `予知: foresight`, then `Call it right. Take the pool.`, then `yochigg.xyz`, large. |
| 29.33 to 34.00 | ring-out, then silence | End card holds, long enough to click. |

## End card copy
- Y mark
- **YOCHI**
- 予知: foresight
- Call it right. Take the pool.
- **yochigg.xyz**

## Vertical (1080x1350, 4:5)
Recomposed, not cropped. The strike line keeps the full width, the price paths are shorter and the
ghost travels further vertically (the axis that means up and down gets more room). Payouts stack
under the candle. 予知 is written top to bottom, as Japanese is in vertical writing, and the end card
stacks.

## Copy rules this film holds to
UP / DOWN only. Money is USDC, HYPE is the asset. No em-dashes. Product verb lines limited to
"Call it right. Take the pool." No characters, no crowd, no UI screenshots, nothing from the 62 s
film's world.
