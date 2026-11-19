# BATTLE ROYALE V4: impact and vitality pass

V3 (`../v3/`) polished, not rebuilt: same structure, landscape-first, same soundtrack edit (V3's candidate B),
same narrative and type. **25.8 s, 60 fps.** The 1920×1080 landscape is the master; the 1080×1920 portrait is
recomposed. Status: **draft for owner review. Not published.** V3 and every earlier output are untouched.

| file (`deliverables/`) | what |
|---|---|
| `br-v4-16x9.mp4` | **master**, 1920×1080, with sound |
| `br-v4-9x16.mp4` | portrait, 1080×1920 |
| `br-v4-16x9-contact.jpg`, `br-v4-9x16-contact.jpg` | timed contact sheets (exact frames, every 0.25 s) |
| `br-v4-poster-16x9.jpg`, `br-v4-poster-9x16.jpg` | thumbnails (16:9: the +95 moment; 9:16: the versus) |
| `br-v4-audio.png` | waveform and spectrogram of the mix with the cues |
| `audio/music.wav`, `audio/sfx.wav`, `audio/mix.wav`, `audio/edl.json`, `audio/sfx_cues.json` | separate tracks and the mix |

## What changed

1. **The cast: nine rewards and YOU.** Four commons out (Doomer, Paper Hands, FOMO, Contrarian), four rewards in.
   Each new face takes over the match role of the one it replaces, so the round table, lives and outcome are
   unchanged.
2. **The ending: one number.**
   - The POOL / RAKE / NET lines are gone. The panel now reads LAST ONE STANDING, then 勝 with TAKES THE POOL, then
     **+95 USDC** alone, as the hero.
   - The +95 slams in on drop 2: the shot punches and shakes, the light lifts, motes burst, ink splatters behind
     the number and the fresh win glows (the only place the brand allows a glow).
   - The fee stays where it belongs: in `data.ts`, and implied by 95 from a 100 pool. HYPE renders stay locked
     until confirmed amounts exist.
   - The end card's hold is 0.8 s longer: the music's ring-out tail is now 3.0 s, so the end card holds 3.8 s,
     2.8 s of it after the music stops.
3. **Impact at the key beats** (below).
4. **Life inside the shots** (below).

## Added impact (one peak per beat, not everywhere)

| beat | video (s) | what's added |
|---|---|---|
| wrong pick resolves | 4.77 | camera punch on the ring (+3.5%, decaying); the four wrong faces flash to grey for a beat; wrong chips grey and strike through (V3) |
| a life is lost | 4.94–5.12 | the face pops (scale), the pip falls (V3), and a burst of grey ink comes off the face |
| player eliminated | 6.48, 7.84, 8.87, 9.89, 10.57 | whole-frame **desaturation flash**; a punch on the knocked-out card; grey ink (V3) and the 敗 stamp (V3). **Single knock-outs are now quick 2.5D close-ups** (High Roller R2, Bloodsport R5, Final Three R6): the painting alive, then a hard cut to its grey variant with a house impact |
| count drops | each round | the count number pops as it falls, hardest on round 4 (7 → 4, the triple knock-out) |
| final two remain | 10.91 | the camera slams in on 2 LEFT (1.16 → 1.0 in 0.28 s), the two survivors pop and flash, cream ink bursts off them |
| final candle closes | 16.54 | V3's paper frame, ink-negative frames and shake, plus a **camera punch-in** (+7%) and a **ring of green light** thrown out from the candle; YOU's face pops while deano's greys |
| winner reveal | 17.89 | a **camera slam** (1.12 → 1.0 in 0.3 s) with one paper-white frame, on the music's splice downbeat; a whoosh into the cut |
| +95 USDC lands | 20.62 | on drop 2: the slam, the shot's impact (punch, 12 px shake, light, motes burst), ink behind the number, the glow, and a low stamp under the drop |
| the Yochi seal | 22.49 | on the music's last hit: a harder stamp (9 px) and a small ink splatter round the seal (the house stamp recipe) |

## Added life

- **The arena:** the whole ring turns slowly (about 1° a second), and every face floats and breathes inside its
  circle (the painting drifts and scales gently; it never deforms). Foreground motes drift at different depths
  for dimensionality. Out players are still.
- **The montage:** cards float. The single knock-outs are live 2.5D paintings (breath, sway, push, motes).
- **The final two:** bigger pushes and more atmosphere on the versus and both close-ups, plus foreground motes on
  the versus. The close-ups keep their house anticipation lean-in before the lock.
- **The winner hold:** stronger breath and sway, more dust and wind, a slow lean-in across the whole run-up as
  anticipation for the payout, and the impact on the drop.
- **Not done:** hair and cloth motion. In `yochi-2p5d` only paintings with a prepared flow mask get the gust, and
  none of the 2.5D characters here has one (Perma-Bull, Last Legend, High Roller, Bloodsport and Final Three all
  have `flow: false`). Adding flow masks is a prep task on the shared package. I left it alone rather than fake
  it with mesh warping.

## Final roster

| ring slot | painting (kit) | family | handle | fate |
|---|---|---|---|---|
| 0 | Untouchable | reward | rektangle | −1 R2, out R4 |
| 1 | Bloodsport | reward | ape_in | −1 R2, out R5 (2.5D close-up) |
| 2 | **Last Legend** | reward | **deano** | −1 R5, out R7 (the final) |
| 3 | **Duel Master** (new) | reward | cope_dealer | −1 R1, out R4 |
| 4 | Final Three | reward | kaze | −1 R5, out R6 in 3rd (2.5D close-up) |
| 5 | **High Roller v2** (new) | reward | soup | −1 R1, out R2, first out (2.5D close-up) |
| 6 | **Deadeye** (new) | reward | mira | −1 R2, out R3 |
| 7 | **Perma-Bull v2** | starter | **YOU** | −1 R3, **wins** |
| 8 | **Cold Blooded v2** (new) | reward | exit_liquidity | −1 R1, out R4 |
| 9 | Ronin | reward | 0x9c…e2 | −1 R1, out R3 |

- **Why YOU stays Perma-Bull:** YOU is Perma-Bull in every approved film. Swapping the player's face would break
  that continuity, so YOU is the only common in the field.
- **Considered and left out:** Grudge Settled (the asset audit flags an unreviewed glyph, 遊, on her charms) and
  Rampage (weak matte).
- **Women and men:** five each.
- **Provenance:** all paintings are unaltered Sumi kit art, copied into `../assets/`.

## Unchanged and still open

- **The music** is V3's candidate B, with a longer tail. Same separate tracks, −14 LUFS, −1.5 dBTP, no saturation.
- **"ONE SURVIVOR"** on the end card: the app also has split-pot and entries-returned endings (see V3). This is
  still awaiting your call.
- **The `yochi-2p5d` parallel-render blank-frame glitch** is patched per frame as before (see Render QC).

## Render QC

- **Scan:** a per-frame outlier scan of both encoded films, plus a by-eye check of every 2.5D sequence boundary
  (the new montage close-ups are small boxes a whole-frame scan can miss).
- **Remaining bright frames:** only the intended ones: the one-frame paper flash on the winner reveal (17.90) and
  the one-frame white flash on each knock-out card.
- **Patched:**
  - The known `yochi-2p5d` parallel-render blank frame: 16:9 frames 739 (versus) and 1077 (winner hold), and 9:16
    frame 839 (deano's close-up).
  - A one-frame gap at the end of the round-2 close-up (frame 450, both formats; also frames 653–654 under the
    wipe). The close-up's sequence ended one frame before the round, a round-off. It's fixed in code
    (`Montage.tsx`, +2 frames), and the frames were re-rendered as stills.
- **Method:** every patch is the deterministic still of that frame, composited onto the original render in a
  single encode.
- **Not possible here:** watching at speed and listening. The new peaks were judged frame by frame. **For owner
  review:** whether the montage's desaturation flashes and the winner-reveal slam feel right at speed, and
  whether 25.8 s is fine.
