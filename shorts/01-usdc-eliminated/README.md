# 01 · USDC HAS BEEN ELIMINATED

10 s, 1920×1080, 30 fps. An arcade fighting game: you pick your collateral, HYPE punches USDC off the screen, and USDC is eliminated **on Elysium**.

## v3 (15 Nov): the knockout, rebuilt (current)

**v3 is the current cut**: `v3/usdc-eliminated-v3.mp4` (10.0 s). It keeps v2's painted cast and Sumi look and
brings back v1's physical comedy:
1. the wallet prompts pile up on Paper Hands;
2. a silent push-in on Perma-Bull's grin;
3. Paper Hands panics;
4. one vermilion brush strike from the fist;
5. an ink-negative impact freeze;
6. Paper Hands is launched out of frame, and the last SIGN MESSAGE is left hanging before it drops with a squeak;
7. a gigantic K.O.

The end card reads NO SWAPS / JUST HYPE and NOW LIVE ON ELYSIUM. Everything is in `v3/`:
- `REPORT.md`: the cut, the 2.5D techniques reused, the emblem decision, the exceptions and the fixes;
- the contact sheet;
- the before/after still and side-by-side video;
- the emblem comparison;
- `CAPTION-MAINNET-UNPUBLISHED.md`.

Source: `src/films/usdc3/` (film, timing), `src/lib/slash.js` (ported from `demo-2p5d/`), `tools/audio_usdc3.py`,
`tools/emblem_variants.py`.

## v2 (15 Nov): the painted cast, Elysium mainnet promo (superseded by v3)

v2 was the current cut until v3. v1 (below) is kept unchanged. It used invented pixel fighters, which the Sumi kit
doesn't allow (see `docs/asset-audit/USDC_HYPE_REWORK_PLAN.md`).

| file | what |
|---|---|
| `deliverables/usdc-eliminated-v2.mp4` | The short: 10.0 s, 1920×1080, 30 fps, H.264 + AAC, with v1's soundtrack (same timings, so it's still in sync) |
| `deliverables/usdc-eliminated-v2-poster.jpg` | Thumbnail: frame 0, the select screen with both paintings |
| `deliverables/usdc-eliminated-v2-contact.jpg` | Contact sheet, one frame every 0.5 s |

**Release only once real-money play is open on Elysium mainnet.** The end card points to `yochigg.xyz` and carries
the real-money line. Testnet is being announced without a video.

What changed from v1 (same beats, same `../src/films/usdc/timing.json`, same audio):

| t (s) | v2 |
|---|---|
| 0.0 | Select on sumi: **Perma-Bull** (v2 painting, YOU, picks HYPE) and **Paper Hands** (CPU, USDC) in framed panels; the roster grid uses the app's own portrait windows, with four other starters dimmed; 1P locks with a vermilion 決 |
| 0.8 | The versus band: both paintings rise behind it, HYPE 対 USDC, STAGE · ELYSIUM below it, clear of both |
| 1.8 | The duel board: HUD, the real-looking HYPE 1-minute chart (`lib/ui.js chart`), the two fighters framed either side; ROUND 1 and FIGHT! under the panels, over no face |
| 2.8 | Paper Hands trembles while three Sumi wallet cards list up (APPROVE USDC, CONFIRM SWAP, SIGN MESSAGE) |
| 3.3 | The camera pushes in on YOU, his panel leans in |
| 3.6 | **Impact frame**: one white frame, then a hard cut to Perma-Bull's fist and grin filling the frame on paper, ink flung off the fist, hit-stop, the music cut as v1 |
| 3.74 | Paper Hands' framed painting is launched off the right edge; the cards shatter; grey ink where he left (his loss is grey); his health drains grey; the candle rips green |
| 4.8 | K.O. stamps in vermilion (your win) over the board |
| 5.2 | Paper band: his face greys, the grey 敗 stamps, ON ELYSIUM / USDC HAS BEEN ELIMINATED, sized to title-safe |
| 6.4 | Paper: NO SWAPS / NO APPROVALS / JUST HYPE |
| 7.45 | The seal stamps: YOCHI × ELYSIUM, **yochigg.xyz**, 18+ · REAL-MONEY GAMEPLAY · PLAY RESPONSIBLY, held 2.55 s |

Decisions:
- **Casting** (confirmed 15 Nov): the cast stay players. YOU is Perma-Bull, as in every approved film; Paper
  Hands is the CPU, glasses and a paper slip clutched like an approval form. No painting is repainted, recoloured
  (bar the loss grey), mirrored, cut apart or warped.
- **Paintings in panels, not cut-outs on sumi.** Perma-Bull's v2 matte keeps some paper ground on its left edge, so
  a bare cut-out would show an edge on the dark ground. Each painting is drawn whole (plate + figure) in a notched
  panel that never shows its outer 150 px, with a few px of plate parallax.
- **The premise** is true on Elysium: the stake is HYPE (owner, 15 Nov; SHARED-RULES carries the exception).
- **Kanji:** 決 (0.28 to 0.8 s), 対 (1.0 to 1.8 s), 敗 (5.4 to 6.4 s). All reviewed and fine.
- **The real-money line** is the same placeholder as the mainnet gameplay cut. Swap in counsel's wording
  (`COPY.small` in `src/films/usdc2/film.js`).
- **Typography gate** (`docs/asset-audit/tools/text_audit.mjs`): nothing sits outside title-safe at rest. Key lines
  are 48 px cap or more: the title, the names, ON ELYSIUM, the headline, the three lines and the URL. The mono
  labels (ELYSIUM, STAGE · ELYSIUM, the plate subtitles, the small print) are smaller, as secondary text.
- No scanlines and no pixel font: v2 uses only the Sumi grounds, type and UI.

```sh
cd shorts
node tools/render.mjs --film usdc2 --audio 01-usdc-eliminated/deliverables/usdc-eliminated.wav --out 01-usdc-eliminated/deliverables/usdc-eliminated-v2.mp4 --crf 17
node tools/still.mjs usdc2 out/stills 0 1.3 3.7 5.8 8.5
cd shorts && node ../docs/asset-audit/tools/text_audit.mjs --film usdc2
```

Use `usdc-eliminated-novoice.wav` as `--audio` to drop the announcer. Assets copied in for v2: `assets/cast/`
(Perma-Bull and Paper Hands figure, plate and card, plus `cast.json`, from the flagship branch) and
`assets/avatars/` (six kit portraits plus the app's `crops.json`). `src/lib/cast.js` and `src/lib/ui.js` come from
the flagship; `loadCast` takes an id list.

## v1 (14 Nov): pixel fighters, testnet (superseded)

| file | what |
|---|---|
| `deliverables/usdc-eliminated.mp4` | The short, with the soundtrack (music, SFX, announcer) |
| `deliverables/usdc-eliminated-poster.jpg` | Thumbnail (frame 0: the select screen) |
| `deliverables/usdc-eliminated.wav` / `-novoice.wav` | The soundtrack, with and without the announcer |

## Beats (150 BPM, one beat = 0.4 s; all timings in `src/films/usdc/timing.json`)

| t (s) | beat |
|---|---|
| 0.0 | **CHOOSE YOUR COLLATERAL.** Pixel portraits: HYPE (1P, "NATIVE · UNHINGED") and USDC (CPU, "STABLE · NEEDS APPROVAL"). The 1P cursor flicks off USDC and locks HYPE (0.28); the CPU gets USDC (0.56) |
| 0.8 | Versus band: HYPE 対 USDC, the vermilion slash, STAGE · ELYSIUM |
| 1.8 | ROUND 1 on a rooftop stage: a HYPE 1m candle board, spectators, health bars, a 99 timer that never moves |
| 2.4 | FIGHT! |
| 2.8 | USDC doesn't fight. He holds up his phone, and wallet prompts stack up: APPROVE USDC, CONFIRM SWAP, SIGN MESSAGE |
| 3.3 | HYPE coils. 3.5 dash. **3.6 the hit**: a white frame, a 0.14 s hit stop with a punch-in, and the music cuts dead |
| 3.74 | USDC is launched off the right edge, the prompts shatter, his briefcase and paperwork go everywhere. 3.9 the blast where he left the screen, his health drains to grey, the candle on the board rips green, the crowd jumps |
| 4.8 | **K.O.** (stamped) |
| 5.2 | Paper band: ON ELYSIUM / USDC HAS BEEN ELIMINATED, with the grey 敗 seal |
| 6.4 | Cut to paper. NO SWAPS / NO APPROVALS / JUST HYPE typed in |
| 7.45 | The Yochi seal stamps: YOCHI × ELYSIUM, testnet.yochigg.xyz. Held 2.55 s |

## Decisions and open questions

- **The Elysium caveat** is stated twice: ON ELYSIUM sits directly above USDC HAS BEEN ELIMINATED, and the stage is ELYSIUM throughout (select screen, versus band, candle board).
- **The end lines** are stacked lines with no full stops, not "No swaps. No approvals." That keeps the copy rule against staccato "X. Y." slogans.
- **The URL** is `testnet.yochigg.xyz`, matching the latest Elysium card. Change it if Elysium is now mainnet.
- **The fighters** are new pixel characters drawn in code (`src/films/usdc/cast.js`), not members of the painted cast. They personify the two tokens. USDC's tie and lapel pin are a muted blue, a nod to USDC rather than Circle's actual brand. HYPE wears vermilion (the hachimaki and sash) because he's *your* pick.
- **Kanji:** 対 (versus, 0.8–1.8 s) and 敗 (defeat, grey seal, 5.4–6.4 s). Both are on the allowed list and both still need native review.
- **The announcer** ("Round one", "Fight!", "K.O.", "Perfect") is espeak-ng, pitched down, driven and bit-crushed to sound like an old sampled arcade voice. No neural TTS was reachable from the build machine, so I couldn't audition it; it may sound robotic. If it does, `usdc-eliminated-novoice.wav` drops it, or you can drop a recorded voice into `tools/audio_usdc.py`. The film reads fully muted.
- The look is an original arcade screen, not a recreation of any specific game's layout, fonts or characters.

## Render

```sh
cd shorts
python3 tools/audio_usdc.py 01-usdc-eliminated/deliverables/usdc-eliminated.wav          # add --no-voice to drop the announcer
node tools/render.mjs --film usdc --audio 01-usdc-eliminated/deliverables/usdc-eliminated.wav --out 01-usdc-eliminated/deliverables/usdc-eliminated.mp4 --crf 17
node tools/still.mjs usdc out/stills 0 3.7 5.8 8.5                                         # stills
```

Needs Node 18+, Playwright's Chromium, ffmpeg, Python 3 with numpy and `espeak-ng`.
