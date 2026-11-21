# Flagship v2: asset wish list and priority matrix

The film I'd make, and what it needs. Briefs for every ESSENTIAL and HIGH-IMPACT illustration are in
`IMAGE_BRIEFS.md`. Nothing has been generated.

**Common to all:** same painter's hand as the kit cards (ink linework, dry-brush texture, washed colour, warm paper
grain); no text, kanji, logo, frame, crest, seal, slash or speed lines in any image (those are animation layers);
vermilion only where a costume already has it; environments carry no vermilion. Character art on flat warm paper
(close to `#efe7d8`) or transparent, figure fully separated with ≥4% margin unless stated. Deliver 2–3 seeds.

## The matrix

| id | what | shots | priority | layers / alpha | perspective | resolution |
|---|---|---|---|---|---|---|
| **B01** | Duel Master, the victory pose painted full figure on her spire top | R2–R3, L4, C8 | **ESSENTIAL** | figure (alpha) + spire top (alpha) | the victory pose's slightly low camera | 5120×2880 |
| **E01** | Sky: dawn paper and wash | R1–L4 | **ESSENTIAL** | 1 plate | eye level, horizon at ~45% | 7680×4320 |
| **E02** | Far ranges, 2 depth layers | R1–C8 | **ESSENTIAL** | 2 alpha plates | eye level from the gorge head | 7680×3240 each |
| **E03** | Distant duel spires with pairs of fighters | R1–R3 | **ESSENTIAL** | 1–2 alpha plates | eye level | 7680×3240 |
| **E04** | The two terraced cliffs, with crowd rows as separate layers | R2–C8, X1, X4 | **ESSENTIAL** | per cliff: rock face + 3 crowd rows (alpha) = 8 plates, plus a grey and a lit variant of each crowd row | from the gorge head, slightly above, symmetrical | 7680×4320 |
| **E05** | Her spire: the stone column falling away into mist | R2–R3 | **ESSENTIAL** | 1 alpha plate, matched to B01's ledge | as B01 | 2048×8192 (tall) |
| **E06** | The stone gateway the camera retreats through | R2–R3 | **ESSENTIAL** | 1 alpha plate (the opening transparent) | dead-on, from behind | 7680×4320 |
| **B15** | Cold Blooded: the faintest smile | C2 (and reversed for C6b) | **ESSENTIAL** | figure | as his card | 2304×3072 |
| **B16** | High Roller: the laugh frozen | C3 | **ESSENTIAL** | figure | as her card | 2304×3072 |
| **B17** | Lucky Fool: eyes squeezed shut, ticket crushed | C3 | **ESSENTIAL** | figure | as her card | 2304×3072 |
| **B23** | Cold Blooded: lifting the mask over his face (the loss) | X2c | **ESSENTIAL** | figure; mask hand on its own layer if possible | as his card | 2304×3072 |
| **B24** | High Roller: triumphant cackle, chips flung | X3a | **ESSENTIAL** | figure + chips (alpha, separate) | slightly low | 2304×3072 |
| **FX1** | The ink wave: a breaking wall of sumi | X1 | **ESSENTIAL** | 3 alpha plates (crest, body, spray) | from the gorge, side-on | 5120×2880 |
| B10 | High Roller: chip flipped high, head thrown back | G1 | HIGH IMPACT | figure + chip (alpha) | low angle | 2304×3072 |
| B11 | High Roller from behind, over-the-shoulder | G2 | HIGH IMPACT | figure (alpha) | behind her right shoulder, eye level | 3840×2160 |
| B13 | Lucky Fool: hesitation, ticket at her lips | L1b | HIGH IMPACT | figure | as her card | 2304×3072 |
| B14 | Insert: her hand sets the ticket and one 5 USDC chip down among tall stacks | L2a | HIGH IMPACT | 1 plate (+ the hand on alpha) | top-down, tight | 3840×2160 |
| B17b | Lucky Fool: one eye opening | C5 | HIGH IMPACT | figure | as B17 | 2304×3072 |
| B21 | Last Legend: knocked to one knee, sword planted | X2a | HIGH IMPACT | figure; sword separate if possible | slightly high | 2304×3072 |
| B22 | Grudge Settled: cards torn from his hand, mask askew | X2b | HIGH IMPACT | figure + the cards (alpha, separate) | as his card | 2304×3072 |
| B25 | Untouchable: sheathing her blade, not turning round | X3c | HIGH IMPACT | figure | three-quarter back | 2304×3072 |
| B26 | Duel Master: turns from the view, steps down off the spire | X5 | HIGH IMPACT | figure + spire top | as B01, closer | 3840×2160 |
| E07 | Storm sky: the same sky under the live candle (ink-dark wash, torn light) | C1–C8, X1–X5 | HIGH IMPACT | 1 plate matching E01 | as E01 | 7680×4320 |
| B18 | Bloodsport: braced, teeth gritted | C3 | OPTIONAL | figure | as her card | 2304×3072 |
| B27 | Rampage: on the far terrace for the next round, fist forward | X6 | OPTIONAL | figure | low angle, like his card | 2304×3072 |
| D1 | Higher-resolution renders of Cold Blooded, High Roller, Lucky Fool and Untouchable's kit cards (same images) | C7 extreme close-ups | OPTIONAL (delivery) | – | – | 3072×4096 |
| S1 | Sound: recorded ink, paper, crowd murmur and wind beds (OPEN_DECISIONS #12) | throughout | HIGH IMPACT (audio) | stems | – | 48 kHz |

**Totals.** Essential: 13 (6 environment plates, 5 character poses, 1 figure extension, 1 FX). High impact: 11
(incl. sound). Optional: 3. Everything else in the animatic is READY: THE LAST STAND's approved art and source, the
kit cards and house cut-outs for 9 characters' existing expressions, and the UI rebuilt from the app's screens.

## Why each is needed (and why existing art isn't enough)

**B01.** The victory pose is cropped mid-thigh and at the left edge. Mist hides the crops to half scale; below
that a figure without feet can't stand in a world. *Animate:* the R2 hand-over at 0.49× under the mist sweep,
then pure dolly; rigid, never deformed.

**E01–E06, the world.** Nothing in the kit is an environment. The reveal is the film's signature shot, and its
power is the painted world plus true parallax between planes. *Animate:* each plate on its own depth
(`world.tsx`), scale (z + ref)/(z + d), plus camera rise; crowd rows lit or greyed independently. *Why layers:* a
flat painting can't parallax, and a zoom-out on one image reads as a picture shrinking.

**E07.** The ground switch (paper → sumi) on drop 3 needs a world to switch, not a black frame. *Animate:* E01 →
E07 under a brush-stroke wipe on the downbeat.

**B15, B16, B17, B23, B24: the principals' arcs.** The cards each show one state (cold, laughing, stunned). The
story needs each of them to *change*: the smile that comes and goes, the laugh that freezes and returns as
triumph, the terror and the relief, the loss that looks like a decision. Generic cards repeated through a reversal
would flatten the act into the dashboard we're trying to leave. *Animate:* hard cuts on the beat between card and
pose; breath ≤1.5%, rigid sway; brief impact gusts on the losses.

**FX1.** The close needs a single, enormous, physical image of the outcome landing. Procedural brush wipes don't
have that scale. *Animate:* three plates sliding and scaling with the camera over the DOWN cliff in 0.9 s, under
the outro slam.

**B10, B11, B13, B14, B17b, B21, B22, B25, B26.** Each turns a functional shot into a cinematic one: an entrance,
an over-the-shoulder, a hand, a gesture. The film works without them, but it's half as good.

**B18, B27, D1.** Polish and options.

## Deliberately *not* requested

- New characters: the cast is big enough, and invented costumes would dilute it. The crowd is anonymous silhouettes.
- Arena architecture (rings, stadiums): the September film's "ring/eye arena" is retired; the gorge is natural terrain.
- Weapons clashing between players, hit poses caused by other players: FFA has no attacks.
- A second Duel Master victory: she doesn't win the round.
