# Sumi gameplay showcase clips (30 Oct 2026)

These are promotional demonstrations of the real Sumi UI and animations, rendered from the `/capture/*` routes on the local branch `capture/campaign-cast` (never merged).
- The cast is fictional, from `AI Instructions/17102026 - Opus-Web-Yochi-Campaign-Pack/capture-roster.md`.
- There are no on-screen labels.
- **Copy rule:** never present a clip as a real match, result, achievement or player.

**How they were recorded**
- Windows headless Chrome, CDP screencast at about 55 fps, re-timed to constant 30 fps, H.264 CRF 16, no audio.
- Network blocked to everything except the local dev server and Google Fonts, so no live data (chat, prices, players) can appear in any frame.
- Chat is a static fixture.
- **Charts are real HYPE:** 30 one-minute candles bucketed from mainnet `evm_price_ticks` (the keeper-sampled HyperCore oraclePx feed the app charts and settles on), 21 Oct 2026, 13:18-13:47 UTC. Timestamps are shifted to the recording time. Every strike, settlement, round log and result-card price comes from those same candles.
- **Moments play over the Free For All arena** (`?bg=ffa`): FFA win/loss (C3, C4), level-ups (C8-C10), achievements (C11, C12) and rivalry (C14). It's the real arena components with fixture data, real HYPE 5-minute candles (same mainnet source, 21 Oct 10:30-13:50 UTC) and a ticking round clock. The product's own scrim dims and blurs it behind each card. Each clip opens on a clear frame of the arena before the moment lands. C13 (BR win) keeps its own Battle Royale background.
- **Clocks tick** from the page's load time, as in the live app: "picks open in" counts down, then the round opens with a 30-second pick window.

| File | Route | Shows | Calendar |
|---|---|---|---|
| `desktop/c1-duel-standoff.mp4` | `/capture/duel?view=game&state=standoff&gap=7` | Standoff, rektless vs hedged, collapses onto the band | P04 |
| `desktop/c2a-duel-match-point.mp4` | `...&state=match-point` | MATCH POINT callout | P22 |
| `desktop/c2b-duel-final-round.mp4` | `...&state=final-round` | FINAL ROUND callout | P22 |
| `desktop/c3-ffa-win.mp4` | `/capture/moments?bg=ffa&ffa=win&mult=2.4&streak=3` | CALLED IT stamp, 2.40x, +14.00, CLAIM 24.00 | P06 |
| `desktop/c4-ffa-loss.mp4` | `/capture/moments?bg=ffa&ffa=loss` | Grey 敗, RUN IT BACK | Reserve |
| `desktop/c5-br-rollcall.mp4` | `/capture/br?view=game&state=rollcall&players=8&gap=8` | Roll call, 8 starters, 76.00 pot | P08 |
| `desktop/c6-br-verdict.mp4` | `/capture/br?view=game&state=verdict` | CLOSED UP verdict takeover, "You're still in" | P26 |
| `desktop/c7-br-final-two.mp4` | `/capture/br?view=game&state=final-two` | Final two standoff, 95.00 pot | P39 |
| `desktop/c8-levelup-pleb.mp4` | `/capture/moments?level=2` | First level-up cut + paper card | P13 |
| `desktop/c9-levelup-trader.mp4` | `?level=4` | Trader cut (two slashes) | P32 |
| `desktop/c10-levelup-insider.mp4` | `?level=7` | Insider vermilion flood | P44 (cut before the full flood) |
| `desktop/c11a-ach-common.mp4` | `?ach=first_blood` | Common stamp | P18 |
| `desktop/c11b-ach-rare.mp4` | `?ach=marksman` | Rare unroll | P18 |
| `desktop/c12-ach-legendary.mp4` | `?ach=cold_blooded` | Legendary gold glyph beat | P37 |
| `desktop/c13-br-win.mp4` | `/capture/br?view=result&kind=win&players=6` | BR win on paper, +57.00 (6 × 10 less 5%) | P43 |
| `desktop/c14-rivalry.mp4` | `/capture/moments?bg=ffa&rivalry=1` | Rivalry history with hedged | P16 |
| `mobile/*.mp4` | Same routes at 390px, 2x | C1, C3, C6, C7, C8, C10, C12, C13 | 4:5 / vertical crops |

**Sizes**
- **Game-screen clips (C1, C2, C5-C7):** 1920x1080 at 1x.
- **Moment-card clips (C3, C4, C8-C14):** a 1600x900 layout at 1.2x, so the cards fill more of the frame and stay sharp under a punch-in. Still output at 1920x1080.

**Editing notes**
- Timers run for the whole clip (re-recorded 30 Oct after review). Picks never hit 0:00 within a clip.
- The mobile game clips are shorter than their desktop versions: on a 390px screen the timer sits below the fold, so frames stop changing once the moment ends.
- Moment clips run their full recorded length, with a 2s hold on the final frame. Extend or trim in the edit.
- The FFA result headline ("EZ MONEY.", "PURE SKILL.", "NEVER IN DOUBT.", "PRINTING.") is chosen at random by the product, so takes differ.
- **Mobile:** the 4-column BR roster truncates names longer than about 6 characters ("hed…"). That's the real UI, so the C5 roll call is desktop-only.
- The level-up cut's "from" glyph depends on the escalation plan (product behaviour).

**Stills:** `stills/desktop/` (1440x900 at 2x) and `stills/mobile/` (390x844 at 3x).
- Covers: FFA arena (`ffa-arena.png`), home, profile (own + visitor), leaderboard, clans, clan, landing, Duel lobby, BR lobby, Duel and BR picking, Duel recap.
- `/capture/seals` is an internal gallery. Don't post it.
- The intro-thread stills (P03) must come from the **real** mainnet app after G1, not from here.
