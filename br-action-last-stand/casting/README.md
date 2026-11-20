# THE LAST STAND v2: casting review and dramatic storyboard (creative development)

Stage: **creative direction only. No production render, no new character art generated.** The original 8 s PoC
(`../deliverables/`, `../README.md`), Battle Royale V4 and the shared style guidance are untouched. Branch
`claude/br-last-stand-casting`.

| file | what |
|---|---|
| `deliverables/casting-contact.jpg` | Duel Master (kit card + supplied attack pose), the current pairing with the three Cold Blooded variants, and the four ranked candidates, each with a matchup frame against her attack pose |
| `deliverables/storyboard-v2.jpg` | the 12.6 s storyboard, one mock-up frame per shot. Hatched frames are **placeholders** for the new poses, not generated art |
| `deliverables/music-edit-preview.wav`, `music-edit-sheet.png` | the storyboard's music edit, audio only, so the pacing can be judged by ear now; the sheet marks every shot |
| `storyboard-timing.json` | the timing map every shot will read from |
| `IMAGE_BRIEFS.md` | the image-generation briefs: 2 new poses + 1 delivery request on the supplied attack pose |
| `supplied/` | the four images you supplied (20 Nov), stored as experimental variants, not canonical art |
| `tools/`, `audio/` | the scripts that make the sheets and the music edit (read-only on the kit) |

---

## 1. Casting review: does the current pair work?

**Duel Master's attack pose (supplied): keep it.** It's the best action image anyone has made for Yochi: one long
diagonal from the trailing hand to the blade point, her weight thrown toward frame-left, and the ponytail, ribbons
and cloak all trailing against the motion. The costume reads true to her card: the diamond-and-dot crest, the
bandaged upper arm, the red cords, fingerless gloves, tag earring, the red mark under the eye, the black-and-red
katana hilt at her hip. Her face is focused, not screaming, which is her character. Four notes for production:

- **The weapon is her short blade, not the katana.** That matches the raised short blade on her card, so the storyboard's
  strike is a short-blade slash. I dropped the iai-draw idea from the first MISSING_ASSETS.
- **Resolution: 1086×1448, about 70% of a kit card**, with no alpha and no ink-disc ground. That's fine for a full-figure
  frame, but soft for anything tighter than waist-up. See delivery request D1 in IMAGE_BRIEFS.
- **Framing:** this is the first time she's painted full length, legs included. The house rule (frame women as men are
  framed, never cropped to the body) means every crop keeps her face in frame. The storyboard's S6 does.
- **It's an experimental variant.** It should be approved explicitly before it becomes reference art for her.

**Cold Blooded: I agree it's a casting problem, but not only for the reason given.** Judged on the images themselves:

- *Part of it is the generations, and fixable.* All three variants keep the mask held up and poised in his hand. The
  topknot and hairpin stay intact. The backbend pivots on a planted base instead of losing balance. And the free
  hand is an open, graceful palm (variant 2 is the card again with the palm offered to camera: an invitation, not a
  hit). Variants 1 and 3 do grimace, but the face is the only part of him that has been hit. A sharper prompt could
  improve those things.
- *But even a perfect hit pose wouldn't fix the film*, for three reasons the art can't overcome:
  1. **He never threatens.** No visible weapon, chin up, eyes off his opponent. The new arc needs an opponent who
     dominates the opening and looks about to win, and nothing in his painting does that. Without the threat, the
     reversal has nothing to overturn.
  2. **He's the same type as Duel Master**: slender, long black hair, black robes with cream accents, a single cool or
     warm accent. In the PoC's fast cuts and at phone size they merge, and her attack pose has nothing to push against.
  3. **Composure *is* the character** ("Cold Blooded", the mask, ten wins in a row). Every generation drifts back to poise
     because the design is built from it. Making him flail fights the painting.

  **So: no more Cold Blooded variants.** He stays a strong reward-unlock and silhouette character, just not the body
  that takes this hit.

## 2. Opponent shortlist (ranked)

Audited all 18 kit rewards (Sumi kit, `asset-pack/sumi/avatars/cards/`, current per the kit README and
`b43ee50`). No newer cast art exists on any branch. Quick Draw is app-only and not in the kit, so it's excluded.
One hard constraint came out of the supplied pose: **she lunges toward frame-left, so the opponent must stand on
frame-left facing right, as painted** (mirroring isn't an allowed operation).

| rank | painting | why, concretely |
|---|---|---|
| **1** | **Rampage** | the only painting where the threat is already happening: the bandaged fist is thrown at the lens and the grin is all teeth. Mass gives the biggest size contrast with her (a slight blade-fighter against a wall of muscle), and his face turns toward frame-right as she needs. Brawler versus blade makes the metaphor plain: her read cuts through his force. His palette (tan skin, charcoal, rust sash on an orange disc) separates from her black, cream and red. His face is built for extremes, so disbelief and pain will read, not be performed politely. **Against:** the matte failed (92%), so his existing card moves with the camera only, and he needs both new poses |
| **2** | **Last Legend** | looks like the reigning champion: battered armour, a planted great sword, a smug grin, facing frame-right. A clean matte, so he's full 2.5D today. The armour plates give a hit physical debris, and the gold ring and steel separate well from her red. **Against:** he's calmer than Rampage, so the same composure risk comes back if the hit pose is soft. V4 already casts him as the final rival |
| 3 | Bloodsport | the taunt: beckoning hand, wide grin, rust armour, facing right, clean matte. **Against:** a similar build and warm palette to Duel Master, so weaker contrast, and she reads as a rival rather than a threat |
| 4 | Ronin | scarred grin, hand on the sword, a natural duellist. **Against:** he faces frame-LEFT, which breaks the screen direction of her lunge unless every shot of him is new art. Brown on paper means low contrast |

Left out after looking: Deadeye (the best colour contrast, but the same stillness problem, and he faces left),
Untouchable (composure), Took the Pool, Lab Rat and Bug Hunter (comic), Final Three (reads vulnerable, and defeating him
would feel cheap), Hundred Trials (seated elder), Whale, Insider, High Roller and In the Green (no combat read),
Grudge Settled (an unreviewed glyph on her charms), the starters (everyday degens; Perma-Bull is YOU).

## 3–4. Recommendation

- **Primary: Rampage**, handle `brick`. He's the opponent whose defeat means most, and the one whose painting already
  does the hardest job (the threat) with no new art.
- **Backup: Last Legend.** The storyboard carries over unchanged. S1 becomes a low-angle push up the armour to the grin,
  and he needs his own N1 and N2 (notes at the end of IMAGE_BRIEFS).
- **Guardrails for Rampage:** his card has painted blood. Keep it as painted, add none, and keep every hit effect
  black ink plus the one vermilion stroke, so the hit stays graphic, not gory. Avoid fighting-game pastiche around him
  (no headband, no rooftop, no stage HUD): his gi-like jacket and bandaged fists are canon, the setting is ours.

## 5. Storyboard v2: THE LAST STAND (12.6 s)

**The game state, made explicit from the first frame:** the final two of a ten-seat Battle Royale (10 × 10 USDC, a
100 USDC pool, 5% fee, the winner takes 95). This mode has **2 lives**, and *a wrong pick costs one*. Both players
show two 命 pips, one already grey: **both are on their last life**. That's the only reason this one candle eliminates
someone, and the viewer can see it before anything happens. Picks are private in the app (others show only PICKED or
THINKING), so each pick appears only in that player's own panel, and both are revealed at the close.

**The arc** (`deliverables/storyboard-v2.jpg`; times from `storyboard-timing.json`):

| shot | time (s) | beat | what happens | music |
|---|---|---|---|---|
| S1 | 0.00–1.36 | **the threat** | Rampage owns the frame: the fist at the lens, then a slow push up to the grin. `brick` · LAST LIFE. No impact effects: only market outcomes get hits | bar 1 |
| S2 | 1.36–2.73 | **the challenger** | he fills 70% of the frame; she arrives in a narrow panel, small, glancing at him. 対 stamps in the gutter | bar 2 |
| S3a | 2.73–3.75 | he locks, instantly | on the downbeat, no hesitation: his panel slams ▲ UP 決. Her chip still reads THINKING | bar 3 |
| S3b | 3.75–4.09 | she locks, late | almost the whole bar later, she locks ▼ DOWN 決, against him. Quiet, no punch-in | a hat |
| S4a | 4.09–5.46 | the minute runs | three panels: him · the live HYPE candle against the strike · her. The arcade timer drains | the sub drops out (4.27) |
| S4b | 5.46–6.20 | **it runs his way** | the candle climbs green well above the strike. Cut in to his grin, closer. Her last 命 pulses, LAST LIFE · AT RISK. For two seconds it's over | pad build |
| S4c | 6.20–6.72 | the turn | the last second: a long crimson wick knifes down through the strike. Cut to her: she hasn't moved | build peak |
| S5 | 6.72–7.06 | **the close · disbelief** | it closes ▼ DOWN. True silence. Hard cut to him: **the grin is gone** (N1). Both picks flip face up: his ▲ UP greys and strikes through, her ▼ DOWN holds | **the inserted silent beat** |
| S6 | 7.06–7.33 | the strike | the sub returns: she lunges (her attack pose slides in, toward frame-left), camera slam, focus lines on her eyes, a gust in the ponytail and ribbons | sub re-entry (7.16) |
| S7 | 7.33–7.45 | **IMPACT** | paper-white, two ink-negative frames, then the page: one enormous vermilion stroke across his chest (N2), a black ink explosion, hit-stop | **drop 2's big hit** |
| S8 | 7.45–9.03 | his last life breaks | he's hurled back into depth (whole figure), his last 命 shatters, he greys and breaks into ink, with a fresh burst on each of the drop's hits | drop 2 |
| S9 | 9.03–9.90 | eliminated | the grey 敗 stamps, `brick OUT` | the next big hit |
| S10 | 9.90–11.76 | **last one standing** | Duel Master on paper, composed and alive (her card, 2.5D). 勝. LAST ONE STANDING · mira · **+95 USDC** rising on the mid hit · 100 USDC POOL · 5% FEE | mid hit (10.91) |
| S11 | 11.76–12.60 | BATTLE ROYALE | the house seal stamps, BATTLE ROYALE, LAST ONE STANDING TAKES THE POOL. The music fades | the last big hit |

**Why this reversal.** Three things build the opponent's upper hand, and all three are true to the game. *His
certainty*: he locks on the downbeat while she's still THINKING. *The market*: the candle runs his way for two full
seconds while her last life is flagged AT RISK. *Composition*: he fills the frame and she's a sliver. The reversal is
the market's (the wick), and the strike is her read paying off. She doesn't win a fight; she was right.

Alternatives I considered:
- **Hiding her pick until the close:** the app does hide it from him, but without seeing it the viewer can't feel
  her danger. I kept the danger.
- **A double reversal** (the candle flips twice): illegible with the sound off.
- **Ending B, "survival"**, for use mid-trailer. He starts on 2 lives, so the hit costs him one (a grey flash, a pip
  breaks, no dissolve), and it ends on LAST LIFE EACH · NEXT CANDLE. S1–S7 are the same shots; only the HUD values and
  S8–S11 change. It makes the "a wrong pick costs one life, not the match" point outright. Use it if this sequence
  sits mid-trailer, and keep Ending A for a finale.

**Duration and music: 12.6 s, chosen from the track's structure.** One continuous run of `Victory Stamp_dark_dnb.mp3`
from 1:43.68, a bar earlier than the PoC, with **one edit: a single inserted beat of true silence before drop 2.**
That's the disbelief beat. The track's own near-silence there lasts only ~0.2 s, too short to register a face.
Everything after the insert shifts by exactly one beat, so every later hit stays on the grid. The arc is made of
whole musical units: a bar each for threat, challenger and locks; two bars of build for the candle; the silent beat
for disbelief; drop 2 for the hit; its next big hit for the elimination; the mid hit for +95; the last big hit for the
seal. At 8 s the threat and the disbelief would both have to go, and they're what turn this from mechanics into
drama. **Pacing**: S1–S4 run at 1.0–1.4 s per shot (registrable, not frantic), the turn tightens to 0.3–0.5 s, and
after the hit there's one long hold. Listen to `deliverables/music-edit-preview.wav`: the main question for your ear
is whether the inserted silence feels like the track's own breath or like a dropout.

A standalone release adds the house end card (seal, YOCHI, yochigg.xyz, ≥2.5 s). Inside a larger trailer, S11 is
the bridge.

## 6. Shot-by-shot assets: existing versus new

| shot | A. existing art is enough | B. new art genuinely required |
|---|---|---|
| S1 the threat | Rampage card, camera only (the method ladder's camera rung): a slow push from fist to grin. Optional prep: a Rampage re-matte would add figure/ground parallax | |
| S2 the challenger | Rampage (camera) + Duel Master card (2.5D) in panels | |
| S3a / S3b the locks | his grin crop; her card in 2.5D; procedural chips and seals | |
| S4a–c the candle | both cards in panels; procedural OHLC candle, timer, pips | |
| **S5 disbelief** | | **N1 Rampage, disbelief.** His only painting grins. A crop, freeze or grey grade of a grin still reads smug, and faces can't be animated. The turn has to land on his face, so this is the one shot editing can't rescue |
| S6 the strike | **the supplied Duel Master attack pose** (a whole-figure slide toward frame-left, a gust on the ponytail and ribbons) | delivery only: **D1** (2× resolution + a flow region list). Not a new pose |
| **S7 impact** | the stroke, flash, ink frames and splatter are procedural | **N2 Rampage, the hit.** The PoC proved that a calm pose thrown backwards reads as a cut-out. This is where a body has to be seen taking the blow |
| S8 knockback | the PoC's whole-figure knockback + ink dissolve, applied to N2 | (N2, the same asset) |
| S9 eliminated | procedural (band, seal, type) | |
| S10 last one standing | Duel Master's own card: her composure is the point, so a "victory pose" would be weaker than the card | |
| S11 BATTLE ROYALE | the kit seal + type | |

**Total: two new illustrations (N1, N2) plus one delivery request (D1).** Not requested, because existing art or
compositing does it as well:
- a knocked-down Rampage (the dissolve ends him);
- a Duel Master victory pose (her card is better);
- Duel Master reacting during the candle (her stillness *is* the reaction);
- background plates (impacts happen on paper, the rest on the sumi ground and our own layers).

## 8. Technical feasibility (pure Remotion, `yochi-2p5d`; no Blender)

| element | verdict | how |
|---|---|---|
| Rampage, existing card (S1–S4) | proven | `yochi-2p5d` whole-image mode (already used for his app unlock clips): camera, world light, atmosphere; no figure parallax |
| panels, locks, candle, timer, pips, seals, result band | proven | the PoC's components, re-timed from `storyboard-timing.json` |
| the inserted silent beat | done | `audio/music_edit.py`, reproducible; picture and stems stay separate |
| N1 / N2 / D1 as 2.5D characters | straightforward | unframed art is padded into the house card geometry (a 1536×2048 canvas, painting rect 72,150–1464,1978) in this film's own folder, then `prepare_character.py` with a GrabCut matte (proven on Untouchable) seeded by a few hint polygons. Flat paper grounds make the matte easy. No change to the shared package |
| her lunge (S6) | feasible, house-safe | rigid whole-figure slide (method ladder rung 4) of ~6–8% of frame width over 8–10 frames, motion smear, the house gust on a flow mask of her free ends. The pose does the rest |
| the hit and knockback on N2 | proven in the PoC | the same transform, smear, stroke and dissolve; the pose finally gives it a body |
| style continuity across cuts | **main risk** | N1 cuts straight out of his canonical grin (S4b → S5). Generate in the same session, check side by side at 960×540 before animating, and keep the paper grain and grade identical |
| render | ~7 min | 12.6 s at 60 fps on 4 cores |
| 9:16 | later | every position is in frame units except the panel polygons |

Decisions still open from the PoC, which carry over unchanged:
- the vermilion stroke crossing the loser (the USDC v3 exception);
- diagonal gutters as the one skewed element per scene;
- the ink dissolve on a painting;
- switching to the paper ground for the hit;
- a fee line versus one number at the payout.
