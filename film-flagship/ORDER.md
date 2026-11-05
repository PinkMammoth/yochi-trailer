# YOCHI first ad: sequencing study (5 Nov)

Baseline: the approved 41.4 s cut, `claude/yochi-first-ad-hook` (4e8e840), untouched.

| Branch | What |
|---|---|
| `claude/yochi-first-ad-copy` | the baseline plus the approved caption fix only: **HYPE CLOSED UP · THE UP SIDE SPLITS THE POOL** (`deliverables/yochi-first-ad-copy.*`) |
| `claude/yochi-first-ad-order-a` | the copy fix plus **Option A** (`deliverables/yochi-first-ad-order-a.*`) |

Option B was assessed and not built. (The caption uses the film's middle dot, not a dash: the copy rules ban dashes.)

## What the timeline allows

After the drop, the track is one steady groove (source bars 13 to 28, flat energy bar to bar). Every gameplay
block is a whole number of bars and starts on a downbeat:

| Block | Length | Its own music cues |
|---|---|---|
| Duel payoff (CALLED IT, +19, 敗) | to bar 9 | the drop kick, the next kick, bar 8 |
| Free For All | 1.375 bars | whip on the downbeat, the close on the kick (+1.5 beats) |
| Battle Royale | 3.625 bars | entry on a kick, two rounds on the beats, the verdict judged one player per beat, the collapse on a downbeat, the win a beat later |
| Reward (counter, EPIC sheet, hero) | 3 bars | stamps on the eighths, the seal, the hero slam on a downbeat |

So **any reorder is purely a picture edit**: the soundtrack is byte-identical, every block keeps its internal sync,
and the only constraint is the second (inaudible) splice at 28.67 s, which should stay under a cut. In Option A it
falls on the verdict's collapse onto the win, a downbeat transition. Neither option needs music editing.

## The three orders, as films

**Current: Duel → FFA → BR → Duel Master → site.** The gameplay escalates well (one rival, a room, survival) and
the progression is a calm aspirational beat before the site, sharing paper with the landing page. Its weakness is
the one you spotted, plus a second: the reward arrives three games after the activity that earned it ("DUELS WON"
after a Battle Royale win reads as a non sequitur), and then the film ends, so the face is earned but never worn.
(There was also a continuity slip: a Battle Royale stranger, `rektangle`, was already wearing Duel Master.)

**Option A: Duel → Duel Master → FFA → BR → site.** Recommended.
- **Cause and effect is immediate.** You win the duel; the count runs to ten duels; Duel Master unlocks.
- **The reward is used, not just shown.** You enter the Free For All and the Battle Royale wearing her face (your
  seat, your verdict tile, your win). This is the strongest gain: it shows what collectible identities are for,
  without a word, and it's what the old order couldn't do.
- **The climax is the last gameplay.** The Battle Royale's survival drama (the verdict, last one standing, CALLED
  IT, +95) is the film's biggest win, and it now hands straight to "Call it right. Take the pool." on the landing
  page: the tagline lands on a pot just taken.
- **Momentum after the drop holds.** The reward isn't a lull: 7, 8, 9, 10 stamp on the eighths in the drop's
  first full groove, the sheet's seal lands with its ink and hit, and the hero is a slam on the downbeat. The one
  quiet second (the sheet's hold) sits between two hits.
- **Costs.** Two ground switches become hard cuts: the hero (paper) into the FFA (sumi), and the BR win (sumi) into
  the landing page (paper). Both land on downbeats and both mean something ("back into the game", "now you"), so
  I left them as cuts rather than spending time on ink transitions. The calm reward-into-site paper bridge is gone.
  The reward comes earlier, so the viewer has seen one duel won when the count reads 7: it reads as time passing,
  which the counter is for.

**Option B: Duel → Duel Master → BR → FFA → site.** Not recommended.
- The film's FFA is its shortest scene (2.3 s), with no stamp, many winners and +14 to +55 amounts. Placed last, the
  gameplay ends on its smallest moment, straight after its biggest (the BR win, +95). That's a deflation right
  before the call to action.
- Its premise, the largest pools, isn't on screen: the film's FFA payouts are smaller than the Battle Royale's
  +95. Showing it would mean new numbers, which falls outside a sequencing change (and the copy rules keep FFA wins
  modest).
- Musically it works as well as A (same blocks), but emotionally it runs the wrong way.

## Recommendation

**Option A.** It fixes the reward's logic, turns progression from a coda into something you carry into the next
game, and puts the strongest gameplay moment last, all with no change to the music. Render:
`deliverables/yochi-first-ad-order-a.mp4`. If the paper-to-sumi hard cuts bother you on viewing, the existing ink
flood can soften either one at small cost.

If you prefer the current order, `claude/yochi-first-ad-copy` is the baseline with only the caption fix, rendered
and ready to lock.

## Changes in Option A (all reversible, on its own branch)

- `src/core/music.js`: the reward block moves to bars 9 to 12, FFA to 12, BR to 13.375; the site, signature and end
  card are unchanged. Audio and sound design untouched (the stamp accents follow their events).
- `src/film.js`: the shot order.
- `src/scenes/act3.js`, `verdict.js`: you wear Duel Master in the FFA and the Battle Royale; `rektangle` now wears
  Deadeye.
- Plus the caption fix. 41.4 s, unchanged.
