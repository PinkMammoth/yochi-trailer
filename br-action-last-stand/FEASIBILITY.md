# THE LAST STAND: asset feasibility, before the proof of concept

An independent action experiment for Battle Royale. It isn't a revision of V4 (`last-candle-standing/v4/`, untouched).
This file was written **before** the PoC was built, from the canonical paintings only. Missing-asset specifications
are kept apart in `MISSING_ASSETS.md`.

Sources: the Sumi kit (`asset-pack/sumi/`), `docs/YOCHI_MOTION_STYLE_GUIDE.md`,
`docs/asset-audit/ANIMATION_FEASIBILITY.md`, and the prepared 2.5D layers in `yochi-2p5d/characters/`.

## 1. Character audit: who can carry action

Every painting is a flat, framed 3:4 card (1536×2048), waist-up to three-quarter length, with no layers and no legs.
So the action has to come from cuts, camera, panels and ink. The question for each painting is how much the
composition already *implies* motion, and how well it survives being cut out and moved.

| painting (kit) | action read | silhouette | gaze / facing | matte (2.5D) | verdict |
|---|---|---|---|---|---|
| **Duel Master** | **strongest.** Low angle, hand on a raised blade, the red brush slashes already in the ground, a hard sidelong stare | strong, but the matte keeps red disc fragments in the hair, so **no ink-silhouette variant** | turned toward frame-left | clean, 71%, flow mask (hair) | **the striker** (right of frame, facing left) |
| **Cold Blooded (v2)** | strong. Fur collar and cloak make a big, readable mass; chin up, contemptuous; white mask in hand | very strong, clean edge (a slight paper fringe on the fur's right edge) | up and toward frame-right | clean, 71.5%, no flow mask | **the target** (left of frame, facing right). His calm pose is the weak point for a hit reaction, see section 3 |
| **Rampage** | the only painting with a strike already in it: the fist comes at the camera | n/a | toward frame-left | **whole-image only** (the matte took 92%) | best impact-frame insert (rung 1, camera only). Left out of the PoC: a third fighter's fist landing on the target muddles who hit whom in a 1v1 |
| Untouchable | elegant, flowing robes, profile | the best silhouette in the cast | profile, frame-right | GrabCut, 54%, flow mask | strong alternative target or a silhouette tease. Calm, not aggressive |
| Ronin | grin, hand on sword, scarred | good | frame-right | 64% | duel alternative; static pose |
| Bloodsport | beckoning hand, "come on" | good | at camera | 61% | great taunt beat, not a strike |
| Last Legend | armoured mass, sword | good | frame-right | 71% | survivor / veteran; static |
| Final Three | bracing, looking back, battered | good | frame-right | 78% | the only *reacting* body in the cast: a natural "about to be hit" insert for the full trailer |

**Selected:** Duel Master (winner, `mira`) and Cold Blooded v2 (eliminated, `deano`). Both are swordfighters, they
face each other without mirroring, and between them they hold the cast's best striking composition and its best
silhouette. Rampage is the recommended third for the full trailer (an impact insert in the field rounds).

Provenance: `asset-pack/sumi/avatars/cards/duel-master.webp` (owner, Sumi kit, 8a2fc71, 28 Oct) and
`cold-blooded-v2.webp` (owner's v2, recorded canon b43ee50, 15 Nov). Both go through `yochi-2p5d/` unaltered.
No retired or pre-rebrand asset is used.

## 2. Technique by technique (existing art only)

| technique | supported? | how, and the limit |
|---|---|---|
| Close-ups | **yes**, to chest-up (~1.7×) sharp; **eye-strip ECUs are soft** (~2.7× on the card) | eye strips are held ≤0.35 s each, under a push and grain. A sharper ECU needs a larger source (MISSING_ASSETS, optional) |
| Dramatic parallax | **yes** for both | figure over its own cleaned ground in `yochi-2p5d`; the plates are only clean to ~1.5% of frame width, so parallax is a texture, not a set |
| Rapid camera pushes | **yes** | camera only (rung 1); a slam is 1.25 → 1.0 in 6-10 frames |
| Ink-brush attacks | **yes** | the house slash (`yochi-2p5d/lib/slash.ts`) scaled up to fill the frame, sandwiched across the target; procedural, no art needed |
| Silhouette transitions | **Cold Blooded only** | Duel Master's matte carries red disc fragments; the ink-negative impact frames give a silhouette read for both without the variant |
| Knockback | **partly** | the whole figure can be hurled back (translate, rotate, scale into depth, smear), but his pose is calm: it reads as a figure *thrown*, not a body *hit*. This is the main gap |
| Subtle reactions | **no** | faces can't be animated. Reactions come from the cut (a tighter frame, a grey grade, a freeze), not from the face |
| Manga-panel compositions | **yes** | panels are our own layer (rung 3): clipped live 2.5D shots inside ink gutters; type sits in the gutters and bands, never on a face |
| Limited deformation | **only brief and whole-figure** | a ≤4% squash along the hit direction for a few frames is the most the rules allow without warping the painting; anything local would be rung 5 |

## 3. Shot-by-shot feasibility for the 8-second sequence

Music: `Victory Stamp_dark_dnb.mp3`, one continuous passage, source 1:45.045 → 1:53.045 (176 BPM). The cut is
on its own structure: 2 bars of groove, the sub drops out at 2.90 s, a build, a near-silence, and drop 2's big
hit at **5.619 s**, then its second hit at **7.325 s**. Times below are video seconds.

| # | time | beat | existing-asset method | feasible now? | what's missing to make it excellent |
|---|---|---|---|---|---|
| 1 | 0.00–1.54 | FACE-OFF: two live panels split by one diagonal gutter, 対 stamps in the gutter, names slam on the hats | 2.5D figure/ground, opposing trucks, panel = our layer | **yes, convincingly** | nothing |
| 2 | 1.54–2.90 | EYES: two letterbox eye strips slam in, stacked, lives under each (命) | camera crop of the card | **yes, but soft** at this size; acceptable for 0.35 s with grain | optional: hi-res eye crops |
| 3 | 2.90–3.41 | deano locks **▼ DOWN** (決) | 2.5D chest-up, punch-in on the lock, pick block in its own panel | **yes** | nothing |
| 4 | 3.41–3.92 | mira locks **▲ UP** (決) | same | **yes** | nothing |
| 5 | 3.92–5.11 | THE CANDLE: three panels (deano · the live candle · mira), timer drains, price whips across the strike | OHLC candle in code, live panels | **yes** | nothing |
| 6 | 5.11–5.45 | it closes **▲ UP**; deano's last 命 cracks; freeze into the near-silence | type, pips, hit-stop | **yes** | nothing |
| 7 | 5.45–5.62 | anticipation: slam in on mira, focus lines converge | camera slam, procedural lines | **yes, as a stare** | **essential:** her strike in motion. The painting holds a raised hilt; the draw is implied by the slash, not seen |
| 8 | 5.62 | IMPACT: paper-white frame, 2 ink-negative frames, an enormous vermilion stroke across deano, hit-stop | house slash at frame scale, `IMPACT_DRAMATIC`-class numbers (USDC v3 exception) | **yes, convincingly** | nothing |
| 9 | 5.75–7.32 | KNOCKBACK: deano hurled back into depth, greying, dissolving to ink | whole-figure transform + smear + ink dissolve over his real matte | **feasible but compromised**: his chin-up calm pose flies backwards like a cut-out | **essential:** a hit-reaction pose (MISSING_ASSETS #2) |
| 10 | 7.32–8.00 | 敗 stamps grey on deano, **deano OUT**; mira takes the pool, **+95 USDC** | grey variant, seal, type | **yes** | optional: a defeated pose for the hold |

**Summary.** Eight of the ten beats are achievable convincingly with the existing art. The two that carry the
fight itself, the strike (7) and the hit reaction (9), are where existing art runs out: the paintings are portraits
in poses of readiness, not of action. The PoC does both beats the best way the existing art allows, so the
difference two targeted poses would make can be judged from the result, not guessed.
