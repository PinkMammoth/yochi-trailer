# 01 · USDC HAS BEEN ELIMINATED

10 s, 1920×1080, 30 fps. An arcade fighting game: you pick your collateral, HYPE punches USDC off the screen, and USDC is eliminated **on Elysium**.

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
