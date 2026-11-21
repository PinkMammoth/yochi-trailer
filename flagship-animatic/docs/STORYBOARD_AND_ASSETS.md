# Flagship: shot-by-shot storyboard and asset matrix

Times are video seconds in the recommended FFA cut (59.64 s), from `remotion/src/timing.json`. Bars are source bars of
the owner's track (8-bar phrases from bar 0 at 12.144 s). Each shot's animatic frame carries a slate (bottom left)
with its shot id and status.

**Status key.** **READY**: existing canonical or approved art works as is. **ADAPTABLE**: existing art plus
segmentation, compositing, framing or other non-destructive work. **NEW-E**: new illustration essential.
**NEW-HI**: new illustration, high impact. **OPT**: optional. Priority 1 = blocks the film, 3 = polish.

Technique codes: **C** camera on a flat painting (push, whip, punch), **P** figure-over-plate parallax, **M**
multiplane dolly, **W** whole-figure transform (slide, slam, fly-off), **L** our layers (UI, type, seals, ink, band),
**I** impact frame (flash, ink negative, hit-stop, shake).

## Act I · The duel (bars 64–75)

| # | time | bar | purpose | character | source art | pose / expression | ground | direction, framing | technique | status | prio |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S01 | 0.00–1.36 | 64 | the threat, the hook | Rampage | kit card `rampage.webp` | fist at the lens, the grin | the card | camera climbs from the fist (2.3×) to the grin | C | READY | – |
| S02 | 1.36–2.73 | 65 | the challenger | Rampage, Duel Master | both kit cards | his grin; her face, small | sumi | he fills frame-left; she cuts in from frame-right in a skewed panel; 対 slams | C, W, L | READY | – |
| S03 | 2.73–4.09 | 66 | the stakes, once | both | both kit cards | | sumi + band | two panels; the versus band: SUDDEN DEATH 対 10 USDC EACH | L | READY | – |
| S04 | 4.09–5.46 | 67 | he picks instantly | Rampage | kit card | the grin | sumi | punch-in on the grin; ▲ UP; 決 stamps hard, shake | C, L | READY | – |
| S05 | 5.46–6.82 | 68 | she picks late | Duel Master | kit card | composed | sumi | slow push; half a bar empty, then ▼ DOWN and a quiet 決 | C, L | READY | – |
| S06 | 6.82–8.18 | 69 | the minute runs | both | kit cards | | sumi | triptych: him · live 1M candle · her; timer drains | L, C | READY | – |
| S07 | 8.18–9.55 | 70 | it's his | Rampage | kit card | grin, closer | sumi | his panel pushes; the candle tall and green | C, L | READY | – |
| S08 | 9.55–10.97 | 71 (riser) | the reversal | – / Rampage | UI rebuild; kit card | his last grin (0.3 s) | sumi | the candle full frame collapses through the strike: CLOSED DOWN | L | READY | – |
| S09 | 10.97–11.99 | silence (3 beats) | disbelief; her eyes | Rampage, Duel Master | **approved** `rampage-disbelief-hd.webp`; kit card | grin gone, then her unmoved eyes | paper | match cut on the face (faceW-registered); a push to his eyes; then her eyes at 3.2× | C | READY | – |
| S10 | 11.99–12.26 | (sub returns) | the lunge | Duel Master | **approved** `duel-master-attack` + matte | the attack pose | paper | slides toward frame-left, focus lines, −6° tilt | W, L | READY | – |
| S11 | 12.26–13.97 | 72 (drop 2 hit) | THE HIT, the defeat | both | **approved** `rampage-hit` matte, attack matte | the recoil | paper | paper-white frame, 2 ink-negative frames, the vermilion stroke, 18 px shake; he's hurled back and greys; grey 敗 | I, W, L | READY | – |
| S12 | 13.97–17.39 | 73–75 | the victory | Duel Master | **approved** `duel-master-victory.webp` | the victory pose | paper | full frame, slow push; 勝, mira +19 USDC (the film's first glow) | C, L | READY | – |

## Act II · The pullback (bars 76–79)

| # | time | bar | purpose | character | source art | pose | ground | framing | technique | status | prio |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S13 | 17.39–20.12 | 76–77 | it's still a portrait… then the world opens | Duel Master; silhouettes of Bloodsport, Last Legend, Untouchable, Rampage; distant duel pairs | victory pose + **new matte** (`tools/matte.py`, in this repo); house cut-outs as ink silhouettes | victory | paper world | dolly 1.0 → 0.49× scale; the painting's paper dissolves into mist; mist tracked to its bottom and left crop lines | M, L | **ADAPTABLE** (her) / placeholder world | 1 |
| S14 | 20.12–22.84 | 78–79 | one of many | Duel Master (tiny), the plain of players | **B01** (her, full figure), **B02** (the world) | victory, full figure | paper world | hand-over under a mist sweep at 0.49×; dolly on to ~0.10×, camera rising; far plain of competitors revealed | M | **NEW-E** (B01, B02) | 1 |

## Act III · The field (FFA, bars 80–95)

| # | time | bar | purpose | character | source art | pose | ground | framing | technique | status | prio |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S15 | 22.84–29.66 | 80–84 | the round begins; players land with picks and stakes | High Roller, Rampage, Untouchable, Bloodsport, Deadeye, Last Legend, Lucky Fool, Cold Blooded, Took the Pool, Grudge Settled | house cut-outs (`film-flagship/assets/cast`) | their card poses | sumi (ink flood on bar 80) | entry slam on the player's side every 2 beats: handle, ▲/▼, stake; the band's pool and multipliers move | W, L | **ADAPTABLE** (Rampage: D1 re-matte) | 2 |
| S16 | 29.66–31.03 | 85 | the hero enters, last | Duel Master | house cut-out | card pose | sumi | the biggest entry slam: mira ▲ UP 25 USDC | W, L | ADAPTABLE | – |
| S17 | 31.03–32.39 | 86 | picks lock before the candle opens | the field | cut-outs + crowd | | sumi | 決 stamps over every named player; PICKS LOCKED; pool frozen at 12,480 | L | ADAPTABLE | – |
| S18 | 32.39–33.75 | 87 | the 5-minute candle opens | the field | crowd = **B04** (silhouettes stand in) | | sumi | the strike drawn across the field as the front line; the live candle at centre; LIVE · 5M CANDLE 5:00 | L | ADAPTABLE / NEW-HI B04 | 2 |
| S19a | 33.75–36.48 | 88–89 | tension, UP leading | the field | as S18 | | sumi | slow push on the field; the leading side's crowd lifts | L, C | ADAPTABLE | – |
| S19b | 36.48–37.85 | 90 | her calm | Duel Master | kit card | composed | sumi | chest-up; IF IT CLOSED NOW +32.89 | C, L | READY | – |
| S19c | 37.85–39.21 | 91 | the big stake | High Roller | house cut-out (card flips the chip) | laughing, the chip | sumi | waist-up; 100 USDC | W, L | ADAPTABLE | 3 |
| S19d | 39.21–40.57 | 92 (accent) | it dips under the strike; he's back | Rampage | kit card | the grin | sumi | his grin at 1.5×; ▼ DOWN; brick 50 USDC | C, L | READY | – |
| S19e | 40.57–43.30 | 93–94 | it claws back | the field | as S18 | | sumi | wide; the timer runs down | L | ADAPTABLE | – |
| S19f | 43.30–44.66 | 95 | the last second | Duel Master, Rampage | kit cards | her eyes; his grin | sumi | split: eyes · candle on the strike · grin; 0:01 held | C, L | READY | – |

## Act IV · The close and the end (bars 136–146, after the splice)

| # | time | bar | purpose | character | source art | pose | ground | framing | technique | status | prio |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S20 | 44.66–45.21 | 136 (outro slam) | CLOSED UP | the field | as S18 | | sumi | paper-white frame, 14 px shake; CLOSED UP; DOWN side greys | I, L | ADAPTABLE | – |
| S21a | 45.21–46.38 | 136 | he loses again | Rampage | **approved** disbelief pose, greyed | disbelief | paper | full frame, grey 敗, brick −50 | C, L | READY | – |
| S21b | 46.38–51.48 | 137–140 | CALLED IT; one pool, different payouts | winners and losers | field | | sumi | CALLED IT stamps; winners rise on each hit (mira +32.89, high_roll +131.56, ghost +52.63, lucky +6.58); losers grey (brick −50, vex −60, oldguard −75); "The side that's right splits the pool." | L | ADAPTABLE | – |
| S22 | 51.48–55.57 | 141–143 (sub cut) | the breath | the field, Duel Master | field (B05 OPT: her look back) | | sumi | the camera eases back over the lit field | C, L | ADAPTABLE / OPT B05 | 3 |
| S23 | 55.57–59.64 | 144 + last stab | the end card | – | kit seal, fonts | | paper (ink flood back) | the seal stamps on the stab; YOCHI; tagline; yochigg.xyz; DUELS · FREE FOR ALL · BATTLE ROYALE; legal line TBC; held 3.4 s | L | READY (legal copy TBC) | 1 |

## Battle Royale alternative (replaces S15–S22; S01–S14 and S23 are shared)

| # | time | bar | what | art | status |
|---|---|---|---|---|---|
| BR15 | 22.84–25.57 | 80–81 | ink flood; ten seats; 10 PLAYERS · 2 LIVES EACH; LAST ONE STANDING TAKES 95 USDC (10 × 10 · 5% RAKE) | house cut-outs as seat tiles | ADAPTABLE |
| BR16 | 25.57–28.30 | 82–83 | R1 CLOSED DOWN: 4 LOSE A LIFE · NOBODY'S OUT | as above | ADAPTABLE |
| BR17 | 28.30–31.03 | 84–85 | R2 CLOSED UP: 2 out (Last Legend's impact frame) | **B06a** | NEW-E (BR) |
| BR18 | 31.03–33.75 | 86–87 | R3: 3 out (Cold Blooded's impact frame); R4: 3 out | **B06b** | NEW-E (BR) |
| BR19 | 33.75–44.66 | 88–95 | FINAL TWO · LAST LIFE EACH: mira ▲ UP 対 vex ▼ DOWN, the 1M candle | kit card; Bloodsport cut-out (**B09** for facing) | ADAPTABLE / NEW-HI |
| BR20 | 44.66–45.0 | 136 | CLOSED UP: Bloodsport knocked out | **B07** | NEW-E (BR) |
| BR21 | 45.0–55.57 | 136–143 | LAST ONE STANDING · mira +95 USDC | victory pose re-used (**B08** OPT) | READY / OPT |

## Asset inventory

| class | asset | shots |
|---|---|---|
| **READY** | kit cards: Rampage, Duel Master (`asset-pack/sumi/avatars/cards/`) | S01–S09, S19b, S19d, S19f |
| **READY** | approved poses (`claude/br-action-last-stand`, 20–21 Nov, owner-approved): Rampage disbelief HD, Rampage hit (+matte), Duel Master attack (+matte), Duel Master victory | S09–S12, S21a |
| **READY** | kit seal, fonts; the UI rebuilt from `asset-pack/sumi/reference/screens/` (FFA band, multipliers, pick lock, candle) | throughout |
| **ADAPTABLE** | Duel Master victory pose **matte** (made here, `assets/mattes/duel-master-victory.png`, original pixels + alpha; its review sheet beside it) | S13 |
| **ADAPTABLE** | house cut-outs for 24 characters (`claude/yochi-first-ad-order-a:film-flagship/assets/cast`, copied to `assets/cast`) for entries and ink-silhouette crowds | S13–S22 |
| **ADAPTABLE (prep)** | D1: re-matte Rampage's card (his cut-out carries painted ground) | S15, crowd |
| **NEW — ESSENTIAL** | **B01** Duel Master full-figure wide plate; **B02** layered world plates | S14 (and the quality of S13) |
| **NEW — HIGH IMPACT** | **B04** two-sided crowd plate | S15–S22 |
| **OPTIONAL** | B05 Duel Master look back | S22 |
| BR only | B06a Last Legend hit, B06b Cold Blooded hit, B07 Bloodsport defeat (essential); B09 Bloodsport facing left (high impact); B08 Duel Master BR win (optional) | BR17–BR21 |

Briefs for every new image: `IMAGE_BRIEFS.md`.
