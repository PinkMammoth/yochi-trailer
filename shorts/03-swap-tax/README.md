# 03 · THE SWAP TAX

A 12-second 9:16 comedy short for Yochi on Elysium. Duel Master wants into the arcade, and the paperwork piles up
at the door: swap to USDC, approve spending, then a scroll 47 steps long. She freezes, draws, and one ink slash
clears the lot. Inside: skip the swap, skip the approval, just HYPE. 1080×1920, 60 fps, H.264 + AAC.

**Built on the house 2.5D pipeline** (`yochi-2p5d/`, pure Remotion). Code: `yochi-2p5d/remotion/src/films/swap-tax/`
(shared kit `src/films/kit.tsx`, captions `src/films/captions.ts`, all timings `swap-tax/timing.json`).

## Deliverables (`deliverables/`)

| file | what |
|---|---|
| `swap-tax-testnet.mp4` | **The film**, with the brief's end card: YOCHI × ELYSIUM, LIVE ON TESTNET, testnet.yochigg.xyz |
| `swap-tax-testnet-contact.jpg` | Timed contact sheet, one frame every 0.25 s, each labelled with its beat (reviewed, notes below) |
| `swap-tax-poster.jpg` | Frame 0, the thumbnail |

The same `caption` prop as NEW CHALLENGER: `SwapTax` (testnet, the default here), `SwapTax-ComingSoon`, and
`SwapTax-MAINNET-UNPUBLISHED` (slated UNPUBLISHED on every frame, never rendered for release).

## Technical accuracy (the claim, and what the film doesn't say)

The comparison is about **staking native HYPE on Elysium**: there's no swap into USDC and no ERC-20 spending
approval, because a native-token stake is sent as the transaction's value. The film doesn't say wallet signatures or
transaction confirmations go away. The guardians are a USDC swap and an ERC-20 approval, nothing else. The
"paperwork" scroll lists swap and approval steps (route, slippage, quote, allowance) and no signing step. The end
card's small print says so in plain words:

> NATIVE HYPE ON ELYSIUM: NO USDC SWAP, NO ERC-20 APPROVAL.
> YOU STILL CONFIRM EACH TRANSACTION IN YOUR WALLET.
> ELYSIUM TESTNET · NO REAL MONEY

**Check before posting:** USDC v3 (`../01-usdc-eliminated/v3/REPORT.md`) dropped "NO APPROVALS" because "players
still approve the HYPE spend". That's only true if the Elysium contract takes **wrapped** HYPE (an ERC-20). If it
takes native HYPE as `msg.value`, "SKIP THE APPROVAL." is correct, and this brief says it does. Please confirm with
whoever owns the contract.

The swap numbers are plausible and consistent: 10 HYPE at the first ad's 41.83 is 418.30 USDC, and 0.3% fees and
slippage (−1.25, in grey: a loss) leaves 417.05 USDC.

## The cut

Victory Stamp, 142.3 BPM. Film 0 is source 16.72 s, so the track's drop kick (source 23.72) lands on the slash at
7.00, and bar 14's downbeat lands on the first end line at 8.08. Source 22.72 to 23.70 is muted: the silence before
the strike.

| t (s) | beat | picture | sound |
|---|---|---|---|
| 0.00 | arrival | sumi night; the arcade front (YOCHI marquee, lattice doors, a line of paper light at the seam). Duel Master's cut-out eases in, foreground right | the build |
| 0.91 | **G1** | Took the Pool's card slams across the doors. STEP 1 OF 2 / **SWAP TO USDC.** | card slap |
| 2.17 | comply | cut to her painting in 2.5D. A rebuilt swap panel: 10 HYPE → 417.05 USDC, the bar fills, SWAPPED, then the fee drops in grey: −1.25 USDC FEES + SLIPPAGE | ticks, a sad low blip |
| 3.01 | **G2** | back at the doors: Took the Pool shuffles aside; Insider (sealed envelope) slams in. STEP 2 OF 3 / **APPROVE SPENDING.** | card slap |
| 4.27 | **G3** | Hundred Trials (tally board) slams in front. STEP 3 OF 47 in vermilion. The ENTRY PAPERWORK scroll unrolls down the floor | slap, a long paper unroll, the roll lands |
| 5.12 | freeze | cut to her: no breath, no sway. A slow push from her face into her eyes, the vignette closing in | a low drone under the build |
| 6.00 | silence | (the music drops out; the push lands) | **nothing** |
| 6.39 | the hilt | extreme close-up on her katana's hilt and guard | |
| 6.62 | the blade | a whip up her body to the hand and the drawn blade | a metallic draw |
| 7.00 | **SLASH** | back to the doors: one vermilion dry-brush slash across the guardians. 1 paper flash frame, 2 ink-negative frames, 0.12 s hit-stop, an 18 px shake decaying over 0.65 s; the cards go grey | whoosh, **the drop**, the boom |
| 7.12 | swept | the guardians spin off (grey, motion-blurred) and the paperwork bursts into ~110 parchment fragments that tumble and flutter | a paper storm |
| 7.66 | doors | the doors slide open onto paper and the camera goes through; the foreground falls away | door slide, whoosh |
| 8.08 / 8.50 / 8.92 | lines | paper: **SKIP THE SWAP.** / **SKIP THE APPROVAL.** / **JUST HYPE.** (vermilion, splatter) | a slam on each beat |
| 9.35 | seal | the Yochi seal stamps; YOCHI × ELYSIUM | stamp |
| 9.60 | caption | **LIVE ON TESTNET**, testnet.yochigg.xyz, small print. Held to 12.00 (2.65 s from the seal) | |

## Animation method (house ladder, no rigs, no face animation)

- **Rung 0, the card as an object:** the three guardians are the kit cards themselves, slammed, shuffled, greyed
  (the house loss grade) and thrown.
- **Rungs 1 to 4, yochi-2p5d `CharacterShot`:** the comply shot, the eye push, the hilt and the blade are the same
  painting under four framings (a new `framing` override on `ShotSpec`), with parallax, world light and atmosphere.
  Ambient motion is rigid and is switched **off** for the freeze, which is the joke.
- **Rung 2, the cut-out:** Duel Master's figure (`build/fig.png`, original pixels with the matte) stands in front of
  the doors, with whole-figure moves only: ease in, breath, a recoil on the hit, and falling away on the push.
- **No believable sword draw exists in the art**, so, as the brief allowed, the draw is an extreme close-up, a cut
  and a whip, and the strike itself is the animated slash.
- **Impact:** the USDC v3 fight-impact exception (style guide §6, pending sign-off), used once.

## Assets (read-only; nothing in `asset-pack/` was changed)

| what | source |
|---|---|
| Duel Master (the warrior) | `asset-pack/sumi/avatars/cards/duel-master.webp`, plates from `yochi-2p5d/characters/duel-master` (house BiRefNet raw matte, flagship branch) |
| Took the Pool, Insider, Hundred Trials (the guardians) | `asset-pack/sumi/avatars/cards/{took-the-pool,insider-v2,hundred-trials}.webp`, as card objects |
| Yochi seal, plain mark | `asset-pack/sumi/logo/yochi-seal-paper.svg`, `yochi-mark-paper.svg` |
| Elysium crest | `asset-pack/Elysium/elysium-logomark-colorized.svg` |
| Fonts, music | `asset-pack/sumi/fonts/`, `asset-pack/audio/Victory Stamp.mp3` (cut in `tools/film-audio.py`; SFX synthesised) |

**Casting by job:** Duel Master's painting is literally a blade being drawn, and she's the first ad's earned face.
The guardians are cast by their props: Took the Pool, the grinning thief with the sack of coins, takes the swap fee;
Insider holds the sealed envelope (the approval); Hundred Trials, the old man with the tally board, brings the
47-step scroll. They lose, so they go grey, the house loss treatment.

## Kanji

None.

## Review

See "Review notes" at the bottom (filled in after the render).

## Decisions and open questions

1. **The copy conflicts with SHARED-RULES. Rendered as commissioned; needs owner sign-off.** "SKIP THE SWAP. /
   SKIP THE APPROVAL. / JUST HYPE." is the banned "X. Y." staccato pattern (USDC v3's end card used
   "NO SWAPS / JUST HYPE" for the same idea).
2. **The arcade front is built in code, not painted.** The kit has no environment paintings, and the style guide says
   to ask before inventing one. This is a construction of house shapes (sumi surfaces, the versus-band paper as a
   marquee with the plain mark and wordmark, lattice door panels), not a painting or a texture. If an environment
   painting is ever commissioned, it can drop in behind the same layers.
3. **The cast as bureaucrats.** The paintings are players' faces (style guide §4). Here three of them play obstacles
   in a sketch. They aren't portrayed as real people or brands.
4. **Duel Master's matte keeps some of her vermilion disc** (known, ANIMATION_FEASIBILITY). In the door shots it
   reads as red ink around her cut-out. A re-matte would clean it up.
5. **"LIVE ON TESTNET."** OPEN_DECISIONS #11 noted that testnet was being announced without a video. The brief asks
   for this card, and it matches the approved testnet card's facts (testnet URL, no real money).
6. **The vermilion is used three times** (the slash, JUST HYPE., the seal), all on "your win" moments, as the rule
   allows. The step counter turns vermilion on STEP 3 OF 47 as a warning; that's the one debatable use, and it can
   go to muted if you prefer.
