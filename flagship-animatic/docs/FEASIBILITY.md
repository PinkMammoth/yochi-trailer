# Flagship: technical feasibility report

## 1. What exists and what was reused

| item | where | how it's used here |
|---|---|---|
| THE LAST STAND v2 (approved Duels short) | `claude/br-action-last-stand:br-action-last-stand/duels/` (21 Nov, 17.6 s master) | its arc, its music grammar (the 3-beat silence, drop 2's hit), its measured art points and its four approved poses. **Copied** into `assets/`, never imported: the flagship has no dependency on that project's source or timeline, and that project is untouched |
| Approved poses | Rampage disbelief HD, Rampage hit (+matte), Duel Master attack (+matte), Duel Master victory | Act I and the Rampage callback |
| House cut-outs | `claude/yochi-first-ad-order-a:film-flagship/assets/cast/` (`cold-blooded` and `starter-perma-bull` there are already cut from v2) | 24 copied to `assets/cast/` for the FFA entries, crowds and BR seats |
| `yochi-2p5d` | `yochi-2p5d/remotion/src/lib` (`CharacterShot`, WebGL plate compositor) | **not used in the animatic**, deliberately: its parallel renders drop the WebGL layer on random frames (both THE LAST STAND and V4 needed frame patching). The animatic uses CSS transforms of the same layers (rungs 1–4). Production shots of the principals should move to `CharacterShot` for breath, sway and impact gusts (see §6) |
| UI | rebuilt from `asset-pack/sumi/reference/screens/mock-ffa.png`, `real-ffa.png`, `real-br-picking.png` | FFA band (multipliers, side totals, PICKS CLOSE, POOL), the pick lock, BR seats with 命 lives, ROUND n OF 20 MAX |
| Music | `last-candle-standing/v4/music-source/Victory Stamp_dark_dnb.mp3` | see `MUSIC_MAP.md` |

Repos, branches and worktrees checked: one worktree, branch `claude/nice-cerf-yokee2` (holds BATTLE ROYALE V4; it was
one commit behind its remote and was fast-forwarded), clean tree. 21 remote branches inspected for provenance.

## 2. The critical test: Duel Master to the wider world

**Built and rendered** (S13–S14; also `deliverables/yochi-flagship-pullback-prototype.mp4`, the victory hold through
the first bar of the field, with slates showing the live scale and dolly value).

**Method: a multiplane dolly.** Each layer has a depth z (her plane z = 1). The camera retreats by d(t), and a layer's
screen scale is 1 / (z + d). At d = 1 she halves while a far range at z = 14 shrinks by 7%: that difference is the
parallax that reads as a physical world opening, not a picture shrinking. The camera also rises, so the horizon
drops and the plain below is revealed. Six depth planes (sky, far range at 30, plain at 10, ranges with distant
duels at 14 and 6, near ridge with competitors at 2.3), her plane, and tracked mist.

**Stage 1 (bars 76–77): works with existing art.**
- The approved victory pose was matted here (`tools/matte.py`, THE LAST STAND's GrabCut tool: original pixels plus
  alpha, review sheet beside it). The matte is clean, including most hair strands.
- The painting's own paper dissolves (0.7 s) into the world's paper mist, so there's no compositing seam: the
  painting's ground and the world's ground are the same material.
- **The limit:** the painting is cropped mid-thigh at the bottom edge and through the cloak and ribbons at the left
  edge. Mist is tracked to both crop lines. It hides them convincingly **down to about 0.5× scale** (her figure
  then ~470 px tall). Below that the mist has to cover more of the frame than it reveals, and a figure with no legs
  and no ground contact can't be "standing in a world".

**Stage 2 (bars 78–79): fails with existing art, by design.** At 0.49× (bar 78), under a 0.36 s paper-mist sweep,
the prototype hands over to where **B01** goes (a hatched placeholder marks her missing legs, feet and ledge), and
keeps retreating to 0.10×. The hand-over lands at identical screen position and size, so with B01 painted to the
brief (upper body identical to the victory pose) the cut will be invisible.

**So the exact missing pieces are:** B01 (her full figure on a ledge, the same pose) and B02 (a painted world, in
layers). With both, the shot needs no new technique: the dolly code is final; only the images change.

**Identity and scale:** she is never redrawn or rescaled non-uniformly. One continuous scale curve (eased, no jumps),
and the only image swap happens under the mist at matched size.

**What I'd still test once B01/B02 exist:** the mist sweep's length (0.36 s may be more than needed), the camera rise
(260 world px), and whether the near-ridge competitors should rise from the mist as they do now or already be there.

## 3. Rejected approaches for the transition

- **A digital zoom-out on the painting:** shows the painting's edges at once; no parallax; reads as a picture.
- **Outpainting the victory pose into a big canvas:** a generated extension of approved art is a repaint risk (and
  the new legs would be unapproved art anyway). B01 asks for the same thing, but as a reviewed illustration.
- **Blender camera move:** not needed. The parallax is planar (painted layers at depths); Remotion does it exactly
  and renders it as a pure function of time. Blender would only earn its place if B02 were a 3D environment, which
  would break the painted look.
- **ArtCraft:** not present in this cloud container (it's on your machine). It would help with one job, the
  background reconstruction behind B02's layers if the painter delivers a flat composite instead of layers. Not
  needed otherwise.

## 4. What the animatic proves and doesn't

- **Proves:** pacing against the music, the act structure, the reveal's depth logic and its exact art limit, the FFA
  grammar (entries, live multipliers, lock, candle, close, proportional payouts, losers grey), the BR alternative on
  the same frame, the end card timing.
- **Doesn't:** final motion polish (ambient breath/sway via `CharacterShot`, gusts, the ink brush wipes and
  splatters from THE LAST STAND's `brush.ts` / `slash.ts`), final crowd art, final SFX, the 9:16 recompose.

## 5. Gameplay verification

**Access:** this session could not attach the app repository (`PinkMammoth/callit.win`, the brief's `call-it-final`;
the attach was refused by the session's permission policy). So **nothing below was re-read from `yochi-dev` today.**
The mechanics come from the app's own screens in the brand kit and from earlier sessions' verifications recorded in
this repo:

| rule | source | used as |
|---|---|---|
| Duel Sudden Death: one round; both pick the next 1M candle; picks lock before it opens; winner takes both stakes less the treasury rake (5% at launch): 2 × 10 → 19 | THE LAST STAND README, verified in `callit.win` `yochi-main` 20 Nov (`duel-fees.ts duelNetPayout`) | Act I, +19 |
| FFA: 5-minute candles; picks for the **next** candle, which "opens when the live round closes, so nobody sees it move first"; PICKS CLOSE timer; any amount (presets 5–100 and free entry; a 250 entry is shown); parimutuel multipliers per side that move as the pool fills; "5% rake"; winners see profit (+14.00 on 10 at 2.40x) and CLAIM the total | `mock-ffa.png`, `real-ffa.png`, `mock-win-stamp.png`, the 4K capture README | Act III: entries before the lock, then the candle opens; multipliers = pool × 0.95 / side (the mock's 1.53x / 2.50x check out to the cent) |
| BR: 2 lives; a wrong pick costs one; if everyone is wrong the round replays; 20 rounds max; 10 × 10 entry, 5% rake, last one standing takes 95 | `real-br-picking.png`, `real-br-win.png`, BR V1–V4 READMEs | BR alternative |

**To verify in the contract before production (FFA):** (1) whether the 5% comes off the whole pool or only the
losing side (the mock's numbers imply the whole pool; payouts here use that); (2) payout rounding (floor to the
cent?); (3) min and max stake; (4) whether a player can enter more than once per round or on both sides (the film
shows each player once, on one side, so it's safe either way); (5) what happens if one side is empty or the candle
closes flat (refund? not depicted); (6) the length of the pick window (shown as a compressed PICKS CLOSE countdown);
(7) any cap on players per round. **BR:** what happens at the 20-round cap if more than one player survives (not
depicted, but the alternative ending should be known). Every number lives in `remotion/src/data.ts`.

## 6. Realistic production approach (after art approval)

1. **Art:** B01 + B02 (essential), B04 (high impact), D1 re-matte. Briefs ready.
2. **Duel act:** port THE LAST STAND's scene components *by copy* into this project (its `Strike`, `Wipe`, brush,
   curve slash, InkField), re-timed by this timing map. Keep its approved art and look; only shot lengths change.
3. **Principals in 2.5D:** move Duel Master's and Rampage's card shots, the entry slams and the victory to
   `yochi-2p5d`'s `CharacterShot` (figure-over-plate parallax, breath ≤1.5%, sway, brief impact gusts). Keep the
   frame-patch QC from THE LAST STAND (`tools/patch.sh`) for its WebGL blank-frame glitch.
4. **Pullback:** drop B01/B02 into `Pullback.tsx` (replace `Ridge`/`DuelPair` with the plates); tune the sweep.
5. **Field:** B04 rows replace the silhouettes; add ink tides for the leading side and the close.
6. **Sound:** your edit and master from the stems; a real SFX pass (OPEN_DECISIONS #12).
7. **QC:** text audit (title-safe, ≥48 px key text), a 1 fps contact sheet beside the first ad's, phone-size checks.
8. **9:16:** recompose (not crop) once the 16:9 is locked; the field turns into two stacked sides.

Estimate, once art is approved: the 16:9 master is about 2–3 working sessions; the 9:16 one more.

## 7. Known weaknesses of the animatic itself

- Placeholder world (procedural ridges; some silhouettes show their cut-out rectangle) and placeholder crowd.
- Rampage's FFA entry shows his cut-out's painted ground (D1).
- The DOWN-side entrants aren't mirrored (rightly), so some face away from the centre.
- Inserts use the full kit cards, so the card frame shows at the edges of a few shots (production frames inside the
  painting, as THE LAST STAND does).
- Act I is rebuilt more simply than THE LAST STAND (no brush wipe, lighter strike); it's there for timing. Judge
  the duel's polish on THE LAST STAND itself.
- SFX are placeholders. Sync is measured, not heard.
