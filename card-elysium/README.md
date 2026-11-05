# YOCHI × ELYSIUM: announcement card

A 5-second looping card for X announcing that Yochi is playable on **Elysium testnet**. Sumi brand, paper ground.

| file | what |
|---|---|
| `deliverables/yochi-elysium-card.mp4` | 1080×1350 (4:5), 30 fps, 150 frames, 5.0 s, H.264 High, yuv420p, silent, faststart, ~8.4 Mbps |
| `deliverables/yochi-elysium-card.png` | Static companion, 1080×1350 (the card at 1.6 s: freshly stamped, drops still on the sheet) |
| `deliverables/yochi-elysium-card@2x.png` | The same frame at 2160×2700 |

## The idea

The card stays still on purpose. Every line of type sits on the sheet from frame 0 to frame 149 and never moves,
apart from the brand's impact shake. The one thing that moves is the **Yochi hanko**. It lands on the loop point,
which makes frame 0 the impact frame, so the feed thumbnail and anyone scrolling in mid-loop get the stamped card.
The brand's rule is that the seal lands like a win; here it reads as Yochi putting its seal on the news.

| time (s) | beat |
|---|---|
| 0.00 | **Contact.** The seal is at full size, with the impact shake on the sheet (0.38 s, ≤6 px, ×0.75 because it repeats) and the brand's squash-and-settle (0.3 s) |
| 0.03–1.5 | Drops flung at impact. The wet impression (deeper red, faint sheen) wicks out along the washi's horizontal fibre |
| 0.6–4.2 | The ink settles: the seal dries to flat vermilion, the wicking dries back to a rim, the drops soak in |
| ~3.4–4.3 | Stillness |
| 4.30–4.86 | The breath: the hanko lifts toward the lens (×1.22, turning to −17°), its shadow opens under it, and the impression it leaves shows faintly |
| 4.86–5.00 | The slam, accelerating into contact on 5.00 = 0.00 |

The loop is mathematically exact. Every frame is a pure function of `t mod 5.0`, and the state at the end of the
slam is the contact frame.

**Copy:** NOW PLAYABLE / YOCHI × ELYSIUM / PLAY FREE ON TESTNET / testnet.yochigg.xyz / ELYSIUM TESTNET · NO REAL MONEY.
"Testnet" appears three times: in the offer, in the URL and in the small print. "No real money" rules out any
reading of mainnet or real-money play. Kinetiq isn't named anywhere, and no endorsement is implied.

**Brand:** paper ground and fibre texture, the official `yochi-seal-paper.svg` (the Y is never redrawn) with a stamp
texture added, Dela Gothic One for the moments, and JetBrains Mono for the URL and labels. Vermilion appears only on
the seal and the URL (the primary action, in `#b3301e` small-text red). No glow and no kanji. The grade is the
flagship's post pipeline with bloom off.

## Elysium branding

The repo had no Elysium assets, and this build environment couldn't reach Elysium's or Kinetiq's sites. The only
Elysium logos on GitHub are in third-party repos, which I couldn't verify, so I didn't use them. **ELYSIUM is set in
type and no substitute mark is drawn.** To use the official logo, put its horizontal wordmark at
`assets/elysium/elysium-wordmark.svg` and re-render. The card picks it up automatically and sizes it to the lockup's
cap height. Check its proportions before shipping. (Until then, the 404 for that file in the render log is expected.)

## Render

Needs Node 18+, ffmpeg, and Playwright's Chromium (`npm i playwright` if no global install is available).

```sh
cd card-elysium
node tools/render.mjs --out deliverables/yochi-elysium-card.mp4       # ~1 min on 4 cores; --crf 14 default
node tools/still.mjs out/stills 1.6                                   # any moment(s) to PNG, 1080×1350
node tools/still.mjs out/stills2x 1.6 --w 2160 --h 2700               # the @2x still
```

## Source

| path | what |
|---|---|
| `src/card.js` | The card: layout (`L`), the hanko's pose curve, the wicking, the drops, the sheen, and the type |
| `src/loop.js` | `LOOP = 5.0` |
| `src/main.js` | The page: two-layer canvas, post grade, `window.renderFrame(t)` |
| `src/core/math.js`, `src/core/post.js`, `src/lib/draw.js`, `src/lib/brand.js` | Copied unchanged from the flagship (`film-flagship/` on `claude/yochi-flagship`) |
| `tools/render.mjs`, `tools/still.mjs`, `tools/server.mjs` | Render and still tools, cut down from the flagship's (no audio) |
| `assets/` | Copies from `asset-pack/sumi/` (seal, fonts with OFL) |

Nothing outside `card-elysium/` was changed.
