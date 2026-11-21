# Flagship v2: technical feasibility and production considerations

## 1. Repository state and discipline

- Branch `claude/nice-cerf-yokee2` (this session's only push target; it also carries BATTLE ROYALE V4 and the first
  flagship animatic). Clean tree before starting; remote fetched; no new owner commits since the last pass (so the
  full-body victory extension isn't in the repo yet: B01 is a placeholder).
- Everything new lives in `flagship-v2/`. **Untouched:** THE LAST STAND (`claude/br-action-last-stand`), the first
  animatic (`flagship-animatic/`), BR V4 (`last-candle-standing/v4`), the achievement work, `yochi-2p5d/`, the kit and
  every canonical painting. The `yochi-2p5d` character builds for Rampage and Duel Master were generated locally
  (they're gitignored, as before).
- A separate worktree wasn't used: the session can push only to this one branch, and the app can only open files
  in the primary checkout. Isolation is by folder.

## 2. How the approved Duels film is used

- `flagship-v2/film/` is a **copy** of `br-action-last-stand/duels/` at its latest approved commit (`cfc745a`, YOCHI
  DUELS v2), including its source, assets, audio builder and tools. Copying keeps the flagship independent of that
  project's future edits, as you asked.
- `film/remotion/src/Film.tsx` and the `Duels-16x9` / `Duels-9x16` compositions are **unchanged**: the standalone film
  still renders from this copy exactly as approved.
- **The one source change:** `scenes/Victory.tsx` gains a `lockup` prop (default `true`, so the standalone is
  identical). The flagship passes `false`: no seal, no YOCHI DUELS card, no URL, and its stamp shake is dropped.
- `src/Flagship.tsx` mounts THE LAST STAND's own scenes in their own `Sequence`s with their own timing map, holds the
  victory to bar 76, and continues with `src/flagship/*`.
- Audio: the same source run and silence, extended. THE LAST STAND's SFX stem is used for the opening.

## 3. The reveal: what is proven, what needs art

**Proven in the animatic (R1–R3):**
- the move is one unbroken dolly from her portrait to the establishing shot;
- every plane parallaxes at its own rate;
- the camera rises so the gorge opens beneath her;
- the gateway passes the lens and frames the view;
- the matched-size hand-over at 0.49× sits under a mist sweep.

**Needs art:** B01 (her full figure; without it she has no feet at small scale) and E01–E06. The code takes them as
drop-in images: `world.tsx`'s procedural `Ridge`/`Cliff`/`Row`/gateway polygons become `<Img>` plates at the same
depths.

**Risks to check once art exists:**
1. B01's upper body must match the victory pose closely enough for the hand-over to be invisible (it's the brief's
   first rule).
2. The gorge plates must be wide enough at their depths (sizes in the wish list are computed for the move).
3. The gateway at z −8.3 enters in the last 0.1 s of the move; if that reads as a flash, start the camera's last metre
   earlier.

## 4. Gameplay verification: **not done this session**

The read-only attach of the app repository (`PinkMammoth/callit.win`, the brief's `call-it-final`) was refused twice
by this session's permission policy. **So nothing below was re-read from `yochi-dev`, and every FFA figure on screen
carries an UNVERIFIED tag.** No hypothetical number has been put into anything production-ready.

| item | status | basis in this repo |
|---|---|---|
| Duel: 2 × 10 → +19 USDC (5% rake) | verified 20 Nov (THE LAST STAND, `duel-fees.ts`) | approved film |
| FFA picks lock before the 5-minute candle opens | consistent with the app's own screens | `real-ffa.png` ("It opens when the live round closes"), `mock-ffa.png` |
| FFA payout: the right side splits the pool less 5%, pro rata | consistent with the mock (1.53x / 2.50x check out to the cent with a whole-pool 5% rake) | `mock-ffa.png` |
| Whole-pool vs losing-side rake; rounding | **unverified** | |
| Stake limits (min, max), pick-window length | **unverified** (presets 5–100 and a 250 entry appear in the mock) | |
| Multiple entries per player / both sides | **unverified** (the film shows each player once, one side: safe either way) | |
| One side empty / flat close (refund?) | **unverified** (not depicted) | |
| Collateral by chain | USDC on Hyperliquid (yochigg.xyz); **HYPE on Elysium** (owner, 15 Nov) | SHARED-RULES |
| Displayed amount | the app shows **profit** ("+14.00" on a 10 USDC 2.40x win) and CLAIM the total | 4K capture README |

On-screen placeholders: pool 5,120 UP / 7,360 DOWN = 12,480; multiplier 2.3156 (UP); net +131.56 / +52.63 / +6.58 on
100 / 40 / 5; losses −80 / −75 / −30. All in `src/flagship/Act.tsx` (`POOL`, `net`). **To unblock:** grant this project
read access to the app repo, or confirm the eight points above.

**Currency variants:** the film needs two end states, USDC (yochigg.xyz) and HYPE (Elysium lockup, testnet or
mainnet URL). The amounts change with the collateral; the picture doesn't.

## 5. Pipeline

| part | technique | status |
|---|---|---|
| Act I | THE LAST STAND's own source (`yochi-2p5d` WebGL `CharacterShot`s, brush, slash, ink) | final |
| Reveal | multiplane dolly in Remotion (`world.tsx`, `Act.tsx`): CSS planes, one function of t | structure final; art pending |
| Principals' shots | the house cut-outs now; production on `yochi-2p5d` `CharacterShot` (figure-over-plate parallax, breath ≤1.5%, rigid sway, gusts on impacts) | needs B-series art |
| Panels | `Pan` clip polygons; diagonal gutters are the scene's one skewed element | ready |
| Candle | standard OHLC, rebuilt from the app's screens | ready |
| Close | ink-wave FX plates (FX1) + the house brush wipe and ink-negative frames | FX1 pending |
| Sound | stems; THE LAST STAND's SFX; placeholders after | needs a sound pass |

**Not needed:** Blender (the depth is planar: painted layers at depths), ArtCraft (no specific job yet; it's not in
this cloud container anyway: possible use is separating layers if an environment arrives flat), any new framework.

**Rendering:** 60 fps to match THE LAST STAND (its impact frames are counted in 60 fps frames). Expect the
`yochi-2p5d` blank-frame glitch in the duel act on full renders; `tools/patch.sh` (from THE LAST STAND) fixes it.

## 6. Production plan (after review)

1. **Owner:** approve the direction and cast; confirm the FFA rules; generate B01, E01–E06, then the principals' poses.
2. Drop the plates into `world.tsx`; tune the reveal (mist sweep, rise, gateway timing).
3. Move the principals' shots onto `CharacterShot` with their poses; ambient life; impact gusts on the losses.
4. FX1 and the close; E07 storm sky.
5. Sound pass, your music edit and master from the stems.
6. QC: text audit (title-safe, ≥48 px key text), blank-frame patch, contact sheet beside the first ad's.
7. 9:16 recompose (the gorge becomes vertical: cliffs stacked, the candle between).

Rough effort once the essential art is in: 3–4 working sessions for the 16:9 master, plus 1–2 for 9:16.

## 7. Animatic caveats

- Placeholder world: procedural ink shapes; crowd silhouettes repeat and some show their cut-out's rectangle.
- New poses are shown as the canonical figure, desaturated, outlined in cyan with the brief id, so the composition
  and blocking can be judged. They don't show the expression.
- Some close-ups (C7) push the house cut-outs to ~2×, where they soften.
- SFX after 13.7 s are placeholders. Nothing here has been listened to.
