# Character-fidelity audit: canonical contestants in the trailer

Branch `claude/bold-cerf-19yaoi` (cut from `master` @ `df70b9d`). Audit written 2026-10-08, before any
shot was changed. Times are seconds in the 62 s film, taken from the shot table in `src/acts/act*.js`.
Timing, music sync, pacing, scene order and the post-processing chain are unchanged throughout.

## The roster and how it maps onto the film

| canonical asset | film character(s) | before | why |
|---|---|---|---|
| **Base** (`base-bust`, `base-pose`, `base-expressions`) | **YOU** | `dome` hood, blade visor, cyan piping | Same character: plain hood, Yochi mark, cyan trim. |
| **Bear** (`bear-*`) | **EXIT_LIQUIDITY** (and RAJ_HL, HANNAH_T in the inserts) | `bear` hood, **red** trim | Same hood cut. EXIT's permanent red trim goes: the canonical bear is cyan, and red is a result colour, not an identity. |
| **Bull** (`bull-*`) | **DEANO** (and 0XTOM, THEO) | `horns` hood, gold trim | Same hood cut (horns). |
| **Rogue** (`rogue-*`) | **MIRA**, **COPE_DEALER** (and SOUP) | `cat` hood | Same hood cut (pointed ears). |

**Recasting decision (named players with no canonical asset).** 0XTOM (frog), SOUP (antenna), THEO (frog) and
RAJ_HL (fin) are focal in montage sequences (the stake portraits, the roll, the glance, the inserts) that cut
between them and the roster characters every 0.2–0.7 s. Upgrading only the roster characters would put an old
low-fidelity focal head directly next to a new high-fidelity one on every cut, which is what this pass is meant
to prevent. So in **focal shots only** they wear a roster skin: 0XTOM → Bull, SOUP → Rogue, THEO → Bull,
RAJ_HL → Bear (HANNAH_T is already a bear). Names, picks, stakes, lines and timing are unchanged, and the
skins are chosen so that no two adjacent cuts show the same skin (where one repeats two cuts apart it is
mirrored). Generic crowds keep the simplified hoods.

**Colour rules.** Cyan/white is the default for every character's trim and status bars. Green and red appear
only where the shot already puts them (the visor display on a pick or a result, status bars on a result, scene
light); no character carries a permanent green or red identity (this is what removes EXIT's red trim). UP/DOWN
is carried by the visor glyph (the canonical ▲, and the same glyph flipped for ▼). Where a shot already lit
a pick's ▲/▼ in green/red, that LED colour is kept, so the shots read exactly as before.

## How the canonical art is used (no redraws)

* `tools/canon_prep.py` takes each canonical bust and half-body pose and, without repainting anything,
  separates it into a **body plate** (the painted LED face and the visor's status bars removed and the glass
  rebuilt from its own red channel, so no ghost of the old expression remains), an **emissive trim** layer
  and a **status-bar** layer, and measures the visor frame (centre, roll, scale) from the two status bars.
* `src/elements/canon.js` (`drawCanon`) composites a character per frame:
  * **visor-expression swap**: the visor is lit by the film's own LED dot faces, laid out at the canonical
    dot pitch and placement measured from `base-bust` (the canonical ▲ glyph is copied dot for dot), in any
    state colour, and they are emitted into the glow layer;
  * **scene lighting**: the shot's key light becomes a colour cast and a soft directional lift, the world's
    rim light is added along the edges that face it, and a screen lift brings the painting's near-black cloth
    up to the world's **black level**; all of it is held to the plate's alpha;
  * **bloom**: the trim, status bars and face go to the emissive layer, and the silhouette knocks out the glow
    behind it, so the characters bloom with the shot's own art-directed bloom and halo, not the painting's;
  * **depth**: per-character blur and fog;
  * **grain, chromatic aberration, contrast, vignette, the mono/sat grades** come from the existing post
    pass, which now runs over the new characters exactly as it runs over everything else.
* The expression sheets are the reference for the LED vocabulary and state colours (cyan default, green win,
  red loss). They aren't cut up and pasted, because each cell is framed and lit differently, and the
  baked-in glow would not bloom with the scene.

## Shot audit

Classes: **A** focal/hero (must upgrade) · **B** supporting, identifiable at medium distance (upgrade where it
avoids a visible jump) · **C** crowd/background (keep). Effort/risk: S/M/L.

| # | time (s) | shot | current character usage | class | canonical replacement | compositor approach | effort / risk | untouched? |
|---|---|---|---|---|---|---|---|---|
| 1 | 0.000–1.500 | ECU (`shotECU`) | YOU bust, visor fills the frame, ▲/▼ flip, locks ▲ green on 1.33 | **A** | base-bust | Visor swap (white flips → green lock, canonical ▲); keep zoom, punch, shake and timer; cyan key/rim | M / M: a ~2.5× upscale of the painting. The LEDs are vector, so only the cloth and glass softens, under the vignette | no |
| 2 | 1.500–1.860 | two-shot (`shotTwo`) | YOU (▲ green) + EXIT (smug, red) busts | **A** | base-bust + bear-bust | Visor swaps; EXIT warm key (red now only in its LED and name tag); scaled so the bust crop sits below frame | S / L | no |
| 3 | 1.860–2.400 | pull-out over the crowd (`shotSea`) | thousands of crowd hoods, YOU/EXIT ~10 px | C | — | — | — | **yes** |
| 4 | 2.400–3.660 | the eye from above | crowd from above | C | — | — | — | **yes** |
| 5 | 3.660–5.150 | tennis wall (`shotWatch`) | generic crowd faces | C | — | — | — | **yes** |
| 6 | 5.150–6.764 | UP / OR / DOWN | silhouettes on the strike line | C | — | — | — | **yes** |
| 7 | 6.764–7.684 | BACK IT. (top) | crowd from above | C | — | — | — | **yes** |
| 8 | 7.684–8.374 | stake portrait: 0XTOM | frog bust, ▲ smile, green | **A** | bull-bust (recast) | Visor swap; green key from the right, cyan rim; text and stake stream unchanged | S / L | no |
| 9 | 8.374–9.064 | stake portrait: EXIT | bear bust, smug, red | **A** | bear-bust | Visor swap; red key spill | S / L | no |
| 10 | 9.064–9.754 | stake portrait: SOUP | antenna bust, nervous, wobble | **A** | rogue-bust (recast) | Visor swap (nervous glyphs, jitter kept) | S / L | no |
| 11 | 9.754–10.670 | the wait (top) | crowd from above | C | — | — | — | **yes** |
| 12 | 10.670–11.595 | callback tennis | generic crowd faces | C | — | — | — | **yes** |
| 13 | 11.595–13.435 | the roll (`shotRoll`) | SOUP / EXIT / 0XTOM / COPE busts (s 470) cut against the wick | **A** | rogue / bear / bull / rogue | Visor swaps, per-cut key colour, slow push kept; SOUP's sweat drop re-anchored to the new visor | S / L | no |
| 14 | 13.435–14.500 | YOU waiting (`shotHeroWait`) | YOU bust (s 560→700), candle reflected in the visor | **A** | base-bust | Visor swap (look follows the price); candle reflection clipped to the canonical glass | M / L | no |
| 15 | 14.500–16.190 | freeze (top, grey) | crowd from above | C | — | — | — | **yes** |
| 16 | 16.190–17.338 | eruption / WIN USDC. | candle; crowd from above | C | — | — | — | **yes** |
| 17 | 17.338–18.264 | payoff (`shotPayoff`) | YOU bust, $ $ grin, green | **A** | base-bust | Visor swap; green key spill and green status bars (a win) | S / L | no |
| 18 | 18.264–18.955 | the L (`shotL`) | EXIT bust, x x → crying, sags | **A** | bear-bust | Visor swap; red status (a loss); sag and tilt as a transform; tears re-anchored | S / L | no |
| 19 | 18.955–20.900 | the rise (`shotRise`) | YOU full body on the tower (hood ~120 px) over crowd heads | **B** | base-bust head on the film's body rig | The canonical poses are cut at the thigh and have fixed gestures, and the shot's motion (the rise, then the fist) lives in the rig. Use a **head swap**: the canonical hood and visor on the rig's body, graded to it. Only if it holds up | M / M | conditional |
| 20 | 20.900–21.950 | EVERY WIN IS PUBLIC | YOU tiny on the tower; crowd | C | — | — | — | **yes** |
| 21 | 21.950–24.476 | climb + DEADEYE (`shotClimb`) | YOU full body, fist up/down, badge seats on the hood | **B** | as #19 | Head swap; the badge re-seated on the canonical hood | M / M | conditional |
| 22 | 24.476–26.316 | NEMESIS DETECTED | YOU + EXIT busts (s 300), 30° split | **A** | base-bust + bear-bust | Visor swaps; YOU cool key/red rim, EXIT red key/rim (scene light, not trim) | S / L | no |
| 23 | 26.316–27.470 | 1V1 wide | YOU/EXIT small full bodies on towers (hood ~35 px) | C (small) | — | Head swap would happen automatically if #19 lands, but not needed at this size | — | **yes** |
| 24 | 27.470–29.997 | rounds (`shotRounds`) | YOU / EXIT busts (s 400) on 8ths, against the towers | **A** | base-bust + bear-bust | Visor swaps (? → pick → $/x) with per-round status colour; push kept | S / L | no |
| 25 | 29.997–30.900 | standoff split | YOU / EXIT busts (s 470), desaturated | **A** | base-bust + bear-bust | Visor swaps; the shot's mono/sat grade (post) applies to them unchanged | S / L | no |
| 26 | 30.900–31.837 | GG. (`shotPlunge`) | YOU cheers / EXIT falls, small full bodies | C (small) | — | rig motion; small | — | **yes** |
| 27 | 31.837–32.717 | BATTLE ROYALE intro | 8 players on podiums (hoods ~30–45 px) | C | — | — | — | **yes** |
| 28 | 32.717–33.500 | round 1 resolves | podiums, high angle | C | — | — | — | **yes** |
| 29 | 33.500–34.350 | glance | 0XTOM / SOUP / DEANO / MIRA busts (s 330) every 0.21 s | **A** | bull / rogue / bull (mirrored) / rogue | Visor swaps (side glances, nervous) | S / L | no |
| 30 | 34.350–35.017 | lineup, round 2 | 5 busts in a row (s ~155): 0XTOM, MIRA, YOU, DEANO, SOUP | **B** | bull / rogue / base / bull / rogue | All five upgraded (no mixed fidelity in one frame, and it follows #29) | S / M | no |
| 31 | 35.017–37.357 | round 2 resolves + chat | podiums, high angle | C | — | — | — | **yes** |
| 32 | 37.357–38.698 | lineup, round 3 | 3 busts (s ~170): DEANO, YOU, SOUP | **B** | bull / base / rogue | as #30 | S / M | no |
| 33 | 38.698–39.998 | round 3 resolves | podiums | C | — | — | — | **yes** |
| 34 | 39.998–41.038 | the final two (faceoff) | YOU and DEANO on podiums (hood ~45 px) | C/B | — | Small. Keep, and revisit if the head swap from #19 holds up | — | **yes** |
| 35 | 41.038–44.718 | FINAL CANDLE (`shotFinal`) | YOU / DEANO busts (s 430) against the candle | **A** | base-bust + bull-bust | Visor swaps; DEANO's gold becomes rim light (scene), not trim | S / L | no |
| 36 | 44.718–46.558 | LAST ONE STANDING. | YOU full body (hood ~100 px): fist up, then cheer and a jump | **B** | as #19 | Head swap on the rig (keeps the raise/cheer/jump) | M / M | conditional |
| 37 | 46.558–50.239 | VICTORY (top) | crowd + podiums from above | C | — | — | — | **yes** |
| 38 | 50.239–53.919 | world of arenas | none | — | — | — | — | **yes** |
| 39 | 53.919–55.760 | inserts | 8 busts (s 380) every 8th: MIRA, RAJ_HL, COPE, THEO, HANNAH_T, DEANO, SOUP, 0XTOM | **A** | rogue / bear / rogue (mirrored) / bull / bear (mirrored) / bull (mirrored) / rogue / bull | Visor swaps (▲, $, cry, ▼, heart, x, $ o, ?); alternate mirroring follows the existing left/right staging | S / L | no |
| 40 | 55.760–57.600 | plunge into the pupil | crowd from above | C | — | — | — | **yes** |
| 41 | 57.600–62.000 | YOUR CALL. / logo | none | — | — | — | — | **yes** |

Also unchanged: the teaser (`--cut short`, the same shots), the poster frame (2.1 s, class C), and the debug
sheets (`t=100`, `t=101`). `t=102` is a new canon lab sheet (the four contestants through the compositor).

## Order of work

1. The A busts, in order of screen time and adjacency: YOU (#1, #2, #14, #17, #22, #24, #25, #35), EXIT
   (#2, #9, #13, #18, #22, #24, #25), then the montages (#8–#10, #13, #29, #39) where the recast keeps every cut
   at the same fidelity.
2. B lineups (#30, #32), which directly follow the upgraded glance (#29).
3. B full-body shots (#19, #21, #36) only if a head swap holds up at the rig's sizes; otherwise left as they are
   and noted as the next step (a canonical full-body turnaround would be the right asset for them).
