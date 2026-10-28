# Sumi brand kit for trailers

The Yochi rebrand ("Sumi"), packaged for code-rendered films. Rules live in `SHARED-RULES.md`; this file is the kit.
Source of truth is the app's `rebrand/sumi` branch; `reference/code/` holds copies of the relevant files.

## Fonts (`fonts/`, all OFL)

| Face | Files | Role |
|---|---|---|
| Dela Gothic One 400 | `dela-gothic-one-latin(-ext)-400-normal.woff2` | Moments: VS, ROUND, UP / DOWN, names, results, wordmark |
| JetBrains Mono 400/500/700/800 | `jetbrains-mono-latin-*.woff2` | Every number, tracked caps labels |
| Zen Kaku Gothic New 500/700/900 | `zen-kaku-gothic-new-latin(-ext)-*.woff2` | Sentences |
| Yuji Syuku | `YujiSyuku-Regular.ttf` | Kanji only (seals, brushed glyphs) |

## Colour tokens

| Token | Sumi (dark) | Paper (light) | Use |
|---|---|---|---|
| bg | `#0f0d0b` | `#f2ece0` + fibre | page / ground |
| surface-1 | `#1a1714` | `#fbf8f2` | cards |
| surface-2 | `#221e1a` | `#f1eadc` | inset, "you" tile |
| line | `rgba(239,231,216,0.12)` | ink at ~12% | borders |
| ink | `#efe7d8` | `#16130f` | primary text |
| muted | `#a39a8a` | `#5d5548` | secondary text |
| out | `#8f8676` | `#6e665a` | losses, eliminated, missed |
| red (vermilion) | `#ff5436` | `#d6402b` (shapes) / `#b3301e` (small text) | you, your pick, your win |
| on-red | `#140f0c` | `#fff8ef` | text on vermilion |
| up | `#3ddc84` | `#15804a` | up candles, won money |
| down | `#ff4d6d` | `#c2304d` | down candles, DOWN label |
| gold | `#e0b25a` | | tier metal only (rank #1, whale) |
| band | `#efe7d8` | | versus band ground; up/down on it `#12703f` / `#b02a44` |

Exact CSS (including the paper fibre texture, primary button with hard ink offset shadow, and the stamp / impact / rise
keyframes) is in `reference/code/sumi.css`. The seal component and its SVG stamp-texture filter are in
`reference/code/seal.tsx`; glyph meanings in `reference/code/seal-glyphs.ts`.

## Logo (`logo/`)

Matt's original double-line Y, traced as a vector and brought into the rebrand.

| File | Use |
|---|---|
| `yochi-seal-paper.svg` / `yochi-seal-sumi.svg` | **Main mark.** The Y knocked out of a vermilion hanko seal (true transparency, works on any ground). End cards, avatar, favicon. Stamp it down like CALLED IT. |
| `yochi-mark-paper.svg` / `yochi-mark-sumi.svg` | The plain Y in one colour (ink / cream). Small lockups beside the YOCHI wordmark. |
| `yochi-mark-original-cyan.png` | The retired cyan mark. Only for the 予知 film's opening "before" shot. |

Wordmark: YOCHI in Dela Gothic One. `asset-pack/Yochi_logo.png` is the same retired cyan raster.

## The cast (`avatars/`)

28 painted characters: 10 free **starters** (everyday degens; anyone can pick one) and 18 **rewards** (costume = rarity,
unlocked by achievements). `cards/` are framed 3:4 trading-card paintings at 1536×2048; `portraits/` are the
unframed paintings. Use the names exactly. Don't repaint, recolour faces, or invent new characters; you may crop, mask,
layer, parallax and grade them. Each painting has an abstract ink-disc background in its own colour, which you can
mask out or lean into.

| Name | Family | Card | Portrait | Unlock | Description |
|---|---|---|---|---|---|
| Perma-Bull | starter | `cards/starter-perma-bull.webp` | `portraits/starter-perma-bull.webp` | free pick | Grinning trader giving a thumbs up, phone full of green candles |
| Doomer | starter | `cards/starter-doomer.webp` | `portraits/starter-doomer.webp` | free pick | Unimpressed man in a hoodie with a coffee and a crashing chart |
| Night Shift | starter | `cards/starter-night-shift.webp` | `portraits/starter-night-shift.webp` | free pick | Exhausted trader in headphones holding an energy drink |
| Lucky Fool | starter | `cards/starter-lucky-fool.webp` | `portraits/starter-lucky-fool.webp` | free pick | Stunned woman with coins raining down, clutching a lucky ticket |
| Strategist | starter | `cards/starter-strategist-v3.webp` | `portraits/starter-strategist-v3.webp` | free pick | Woman in glasses with a pen and a clipboard of plans |
| Degenerate | starter | `cards/starter-degenerate.webp` | `portraits/starter-degenerate.webp` | free pick | Bruised, grinning man rubbing the back of his neck |
| Bagholder | starter | `cards/starter-bagholder-v2.webp` | `portraits/starter-bagholder-v2.webp` | free pick | Bandaged man hugging a sack of old coins |
| FOMO | starter | `cards/starter-fomo-v2.webp` | `portraits/starter-fomo-v2.webp` | free pick | Panicked woman lunging after a phone with a rising chart |
| Paper Hands | starter | `cards/starter-paper-hands.webp` | `portraits/starter-paper-hands.webp` | free pick | Terrified man in glasses clutching a paper slip |
| Contrarian | starter | `cards/starter-contrarian.webp` | `portraits/starter-contrarian.webp` | free pick | Unconvinced woman in a hoodie holding up a DOWN sign |
| Untouchable | reward | `cards/untouchable.webp` | `portraits/untouchable.webp` | Win 5 in a row | Blindfolded swordswoman in flowing robes |
| Hundred Trials | reward | `cards/hundred-trials.webp` | `portraits/hundred-trials.webp` | Play 100 rounds | Weathered old man with a tally board, sitting on a chest |
| Insider | reward | `cards/insider-v2.webp` | `portraits/insider-v2.webp` | Reach max level | Smug man with a cigar holding a sealed envelope |
| Whale | reward | `cards/whale.webp` | `portraits/whale.webp` | Reach level 5 | Laughing bearded noble raising a gold cup over a chest of coins |
| High Roller | reward | `cards/high-roller-v2.webp` | `portraits/high-roller-v2.webp` | Place a 100 USDC bet | Laughing woman in a gold-patterned robe flipping a casino chip |
| Cold Blooded | reward | `cards/cold-blooded.webp` | `portraits/cold-blooded.webp` | Win 10 in a row | Silver-haired swordswoman with a katana |
| Deadeye | reward | `cards/deadeye.webp` | `portraits/deadeye.webp` | 60% win rate over 100 rounds | Sharp-eyed marksman in glasses with a crossbow |
| In the Green | reward | `cards/in-the-green.webp` | `portraits/in-the-green.webp` | Reach +500 USDC net profit | Woman in green-and-gold robes lounging with a card |
| Took the Pool | reward | `cards/took-the-pool.webp` | `portraits/took-the-pool.webp` | Win 250 USDC in a single round | Grinning thief shushing over a bulging sack of coins |
| Rampage | reward | `cards/rampage.webp` | `portraits/rampage.webp` | Win 7 in a row | Grinning brawler throwing a bandaged fist |
| Duel Master | reward | `cards/duel-master.webp` | `portraits/duel-master.webp` | Win 10 duels | Swordswoman with a long ponytail drawing a blade |
| Gunslinger | reward | `cards/gunslinger.webp` | `portraits/gunslinger.webp` | Win 5 duels | Gunslinger in a wide hat aiming a revolver |
| Grudge Settled | reward | `cards/grudge-settled.webp` | `portraits/grudge-settled.webp` | Beat your nemesis in a duel | Grinning card sharp in a fox mask fanning a hand of cards |
| Last Legend | reward | `cards/last-legend.webp` | `portraits/last-legend.webp` | Win 10 Battle Royales | Grizzled veteran in battered armour |
| Final Three | reward | `cards/final-three.webp` | `portraits/final-three.webp` | Reach the final 3 in a Battle Royale | Battered young fighter bracing himself, still standing |
| Bloodsport | reward | `cards/bloodsport.webp` | `portraits/bloodsport.webp` | Win 5 Battle Royales | Grinning gladiator beckoning her next opponent |
| Lab Rat | reward | `cards/lab-rat.webp` | `portraits/lab-rat.webp` | Play during the closed beta | Grinning figure in goggles holding up a flask |
| Bug Hunter | reward | `cards/bughunter.webp` | `portraits/bughunter.webp` | Find a confirmed beta bug | Sly old tinkerer holding a lantern with a bug inside |

## Reference screens (`reference/screens/`)

`mock-*` are the approved design mocks; `real-*` are captures of the built app. Rebuild what you need in your renderer.

| File | What |
|---|---|
| `mock-win-stamp.png`, `mock-win-stamp-mobile.png` | FFA win moment: CALLED IT stamp, +10.91 USDC, streak 連勝, CLAIM |
| `mock-ffa.png`, `mock-ffa-mobile.png` | FFA: UP 対 DOWN band, chart, pick slip, who's in |
| `mock-duel.png` | Duel: versus band with the vermilion slash, ROUND, arcade timer |
| `real-duel-picking.png` | Built Duel screen mid-pick (ignore the fixture bar and the chat panel) |
| `real-duel-recap.png` | Duel recap, best of 3 |
| `real-br-picking.png` | Battle Royale roster with 命 lives mid-round |
| `real-br-win.png` | Battle Royale win: CALLED IT + 勝, "Last one standing", +95 USDC |
| `real-landing.png` | Paper landing: tagline, ENTER YOCHI, free practice round with CALLED IT |
| `real-ffa.png` | Built FFA screen after a pick |
