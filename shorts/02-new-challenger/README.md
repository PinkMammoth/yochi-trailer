# 02 · NEW CHALLENGER

An 8-second 9:16 fighting-game character reveal that announces Yochi's Elysium expansion. The incumbent is locked in
for HyperEVM, a challenger emerges from the dark for Elysium, and the two of them share the frame.
1080×1920, 60 fps, H.264 + AAC.

**Built on the house 2.5D pipeline** (`yochi-2p5d/`, pure Remotion). The film's code is in
`yochi-2p5d/remotion/src/films/new-challenger/`, the shared film kit is in `src/films/kit.tsx`, the caption variants
are in `src/films/captions.ts`, and every timing lives in `new-challenger/timing.json`.

## Deliverables (`deliverables/`)

| file | status |
|---|---|
| `new-challenger-coming-soon.mp4` | **The publishable film.** Safe caption: COMING SOON, yochigg.xyz. It makes no claim that anything is live on Elysium |
| `new-challenger-coming-soon-contact.jpg` | Timed contact sheet, one frame every 0.25 s, each labelled with its beat (reviewed, notes below) |
| `new-challenger-poster.jpg` | Frame 0, the thumbnail |
| `new-challenger-endcards.jpg` | The three caption variants' final frames side by side. The mainnet one carries its UNPUBLISHED slate |
| `new-challenger-mainnet-UNPUBLISHED-preview.jpg` | A still of the mainnet variant with its slate burned in. **No mainnet MP4 has been rendered** |

## Caption variants

One prop, `caption`, switches the end card. Three compositions are registered in `src/Root.tsx`:

| composition | caption | URL / small print | status |
|---|---|---|---|
| `NewChallenger` | COMING SOON | yochigg.xyz | **published default** |
| `NewChallenger-Testnet` | LIVE ON TESTNET | testnet.yochigg.xyz · ELYSIUM TESTNET · NO REAL MONEY | ready (matches the approved Elysium testnet card) |
| `NewChallenger-MAINNET-UNPUBLISHED` | NOW LIVE ON ELYSIUM | yochigg.xyz · 18+ · REAL-MONEY GAMEPLAY · PLAY RESPONSIBLY (placeholder for counsel) | **UNPUBLISHED.** Every frame carries a vermilion "UNPUBLISHED VARIANT · MAINNET NOT CONFIRMED · DO NOT POST" slate. Only remove it (`slate: false`) once mainnet deployment is confirmed and counsel's wording is in |

## The cut

Victory Stamp, 142.3 BPM (beat 0.4217 s). Film 0 is source 17.72 s, so the track's drop kick lands on the two-shot
at 6.00. Source 19.72 to 23.10 is muted, which leaves the alarm and the reveal in the dropout. The swell into the drop
plays under the end of the reveal.

| t (s) | beat | picture | sound |
|---|---|---|---|
| 0.00 | select | PLAYER SELECT. Ronin's painting lives in the portrait window (2.5D: push, parallax, breath, motes). 1P chip, **HYPEREVM**, a two-slot roster | the build, cursor blips |
| 0.91 | lock | the pick locks: 決 stamps, the slot pulses | stamp |
| 1.33 | slot 2 | the empty "?" slot starts pulsing: 2P ? | two low blips |
| 2.00 | flicker | dropped and dimmed frames with scanlines, then the screen sinks to sumi | music cuts; 60 Hz buzz; the low two-tone alarm |
| 2.11 / 2.53 / 2.95 | slams | **NEW** / **CHALLENGER** (ink on a cream band) / **APPROACHING**, one per beat, 6 px house shake each; WARNING tickers | a slam on each |
| 3.43, 3.64 | blink | the type blinks off twice, arcade-style | alarm |
| 3.90 | dark | black | |
| 4.00 | beam | Untouchable, almost entirely in the dark. A light beam sweeps right to left across her face, and the key light swings round so her shadow moves on the misty ground | low drone, rising wind |
| 4.30 | ink | the dark recedes from her face outward with a ragged wet ink edge; slow push, breath, wind-blown motes | wind |
| 5.07 | **ELYSIUM** | the last of the dark blows off; one brief gust on her free hair and blindfold tails (impact only), a small shake; the Elysium crest and **ELYSIUM** slam in | gust, thud |
| 6.00 | drop | the two-shot: Ronin and Untouchable slide in from either side, split by the one vermilion slash, with 対. HYPEREVM / ELYSIUM over each | **the drop** |
| 6.00 / 6.42 | copy | **TWO CHAINS.** / **ONE ARENA.** | slams |
| 6.84 | seal | the Yochi seal stamps: YOCHI × ELYSIUM | stamp |
| 7.05 | caption | **COMING SOON**, yochigg.xyz, held to 8.00 | |

## Assets (all read-only; nothing in `asset-pack/` was changed)

| what | source |
|---|---|
| Ronin (HyperEVM) | `asset-pack/sumi/avatars/cards/ronin.webp`, plates from `yochi-2p5d/characters/ronin` (house BiRefNet raw matte, `claude/yochi-first-ad-order-a:film-flagship/assets/cast/raw/ronin.png`, 9bb5f1d) |
| Untouchable (Elysium) | `asset-pack/sumi/avatars/cards/untouchable.webp`, plates from `yochi-2p5d/characters/untouchable` (authored GrabCut matte, the clean one that's fit for silhouettes) |
| Yochi seal | `asset-pack/sumi/logo/yochi-seal-sumi.svg` |
| Elysium crest | `asset-pack/Elysium/elysium-logomark-colorized.svg`, as supplied (the one in the approved card) |
| Fonts | `asset-pack/sumi/fonts/` (Dela Gothic One, JetBrains Mono, Yuji Syuku for the kanji) |
| Music | `asset-pack/audio/Victory Stamp.mp3`, cut in code (`yochi-2p5d/remotion/tools/film-audio.py`); SFX synthesised there |

**Why these two.** The brief asked for two visually distinct canonical fighters. Ronin is warm, earthy and scarred,
a grinning veteran with a hand on his sword: the incumbent who's already here. Untouchable is cool blue-white and
blindfolded, in flowing robes. Hers is the cleanest matte in the cast (fit for silhouettes) and her flow mask covers
her hair and blindfold tails, so she suits a reveal from darkness with wind. Their blue and grey also sit next to the
Elysium crest's teal. Both are reward paintings that already have yochi-2p5d plates. Neither is repainted or tinted
(figure light stays off, OPEN_DECISIONS #7), and motion is rigid: breath ≤0.6%, sway ≤0.35°.

They can't plausibly stand in one painted scene (separate cards, separate grounds), so the finale uses the
**portrait composition** the brief allows: two columns split by the slash.

## Kanji

| glyph | meaning | when |
|---|---|---|
| 決 | decided, a locked pick | 0.91 s, the 1P lock |
| 対 | versus | 6.05 to 8.00 s, on the slash in the two-shot |

Both are on the SHARED-RULES list.

## Review (contact sheet, stills at phone size, `tools/text-audit.mts`)

See "Review notes" at the bottom (filled in after the render).

## Decisions and open questions

1. **The copy conflicts with SHARED-RULES. Rendered as commissioned; needs owner sign-off.** "ARENA" is on the
   banned-words list, and "TWO CHAINS. ONE ARENA." is the banned "X. Y." staccato pattern. The brief names this
   line explicitly, so the film uses it. A rule-compliant alternative is one prop away: `tagline: 'house'` renders
   **NOW ON / TWO CHAINS**, one sentence over two lines, with no "arena" and no slogan pattern.
2. **A painting stands for a chain.** Style guide §4 asks for a decision before a painting represents a brand. I took
   the brief as that decision and kept the player grammar: each one is a *player-select fighter* playing for a chain
   (1P / 2P, their own names shown small), not a mascot for it.
3. **End-card hold.** The house end card holds ≥2.5 s. The brief's 8-second structure puts the logo inside 6 to 8 s,
   so the seal holds 1.16 s and the caption 0.95 s. If the film gets longer, add the time to the end card.
4. **"NEW CHALLENGER APPROACHING"** is used as fighting-game grammar, which the style guide allows. There's no
   pastiche of a specific game's screen, fonts or HUD: it's set in the house type, on the house grounds, with the
   house band.
5. **HyperEVM has no mark in the kit**, so it appears as type only. No logo was invented.
6. **The URL on COMING SOON** is yochigg.xyz (live on HyperEVM today). Testnet uses testnet.yochigg.xyz.
7. **The 48 px floor** (OPEN_DECISIONS #6): see the audit below for the URL and labels.
