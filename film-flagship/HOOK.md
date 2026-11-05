# YOCHI first ad: the opening hook and the reward (5 Nov)

Branch `claude/yochi-first-ad-hook`, cut from `claude/yochi-first-ad` (5887651). The approved 39.7 s first ad and its
source stay on `claude/yochi-first-ad` (`deliverables/yochi-first-ad.*`, also carried here unchanged). This revision
is `deliverables/yochi-first-ad-hook.*`: **41.4 s** (+1.69 s, exactly one bar).

Two changes only: a one-bar opening hook, and Duel Master as the reward. Everything else is the approved cut,
shifted by one bar.

## 1. The opening

**Recommendation: Concept A, "UP OR DOWN?", over the HYPE chart.** Built and rendered; Concept B not built.

| | A: UP OR DOWN? | B: YOU HAVE 15 SECONDS |
|---|---|---|
| Stops the scroll in the first second | Yes: three huge words in candle green and crimson, landing on the beat over a chart. Readable at thumbnail size | Yes, possibly harder: a direct address and a number |
| Earns the next three seconds | Yes: it's a question, and the next two shots answer it (a stranger: ▼ DOWN; you: ▲ UP) | Partly: "15 seconds to do what?" is curiosity, but the next shot (a painting) doesn't answer it. The answer arrives at the duel board, about nine seconds later |
| Prepares the premise | Fully: market (HYPE, 1-minute candles), binary choice, the open next candle (the dashed "?" box), and the strike line, with UP above it and DOWN below | Barely: it names urgency, not the game |
| Leads into YOU v exit_liquidity | Perfectly: the question is posed, then two players answer it opposite ways | Awkwardly: the timer is set up and then abandoned for two portraits |
| Fits the visual identity | Yes: paper, Dela, standard OHLC candles in the paper palette, the strike line the film already uses | Fine, but a countdown spends the film's best tension device (the held 0:01) in its first second |
| Faithful to the mechanics | Yes | **No as written.** Duels and Battle Royale give **30 seconds** to pick (every deployment in `multichain/registry/deployments.ts`, and `pick-window.ts`: "a 30s window to pick"). The 15 s in `pages/capture-br.tsx` is a capture-page mock. B would have to be "YOU HAVE 30 SECONDS", which is less punchy |

A wins on comprehension, flow and fit. B's one advantage (raw arrest) is outweighed by sending a cold viewer the
wrong question, and it would have needed the number corrected. Opening-only comparisons weren't worth rendering.

**How it's built** (`src/scenes/hook.js`, one bar on paper): the HYPE chart climbs to the dashed strike line; the
live candle twitches across it inside a dashed `?` / NEXT box. **▲ UP** is already there on frame 0 (so the
thumbnail reads), above the line, in green. **OR** slams on beat 2, on the line. **▼ DOWN?** slams on beat 3, below
it, in crimson. The sheet takes a small hit on each word; beat 4 holds. On the downbeat, hard cut to the stranger,
▼ DOWN: the first answer.

Copy note: the words are set without full stops (UP / OR / DOWN?) so it stays a question and avoids the copy rules'
banned "X. Y." staccato pattern. Rhythm comes from the beats, not the punctuation.

## 2. The music

**Solution: the film starts one bar earlier in the source track.** The approved cut began on source bar 2. The hook
plays **source bar 1**, the intro bar that already led into it: hats and a light pulse, no bass.

- **No splice, no silence, no new material.** The first bar is simply the music that came before; the old first
  frame's audio follows it untouched.
- **Every sync point moves by exactly one bar.** The bass entry (now on the YOU ▲ UP cut), the duel transition, the
  0:01 dropout (13.23 to 14.10 s), the drop kick, CALLED IT, the verdict beats, the splices, and the seal on the end
  card's downbeat all keep their exact relationship to the music. One timing constant (`HOOK` in
  `src/core/music.js`) does it.
- The near-silent intro bar suits the question: three words in a quiet bar, with the groove arriving as the players
  answer, which is the "silence, then the soundtrack enters as the choices begin" idea, with the track's own intro.
- Three soft felt thumps (the film's existing synthesised stamp sound, mixed under the stamps' level) sit under UP,
  OR and DOWN?. A 10 ms fade-in at frame 0.

## 3. The reward: Duel Master

**Recast to Duel Master.** Of the female rewards, she has the strongest presence and the cleanest presentation:
poised, drawing her blade, with a vermilion slash in her own painting that matches the brand accent. Bloodsport and
In the Green are posed more suggestively than the brief allows; Untouchable is elegant but muted, and was used in an
earlier cut.

**Accuracy, from the app** (`evm/profile-data.ts`, `lib/seal-glyphs.ts`): achievement `duel_win_10`, "Win 10 duels",
**EPIC**, glyph 師, the app's badge art (`public/achievements/duel_win_10.webp`). So the sequence changed with her:

- the counter is now **DUELS WON**, 7 to 10 (the 連勝 streak seal is gone, since it was Cold Blooded's condition),
  ending on TEN DUELS WON;
- the unlock is the app's **EPIC** moment: no full-screen glyph takeover (that's LEGENDARY only). The sheet
  unrolls, the badge washes in, EPIC, DUEL MASTER brushed in, "Win 10 duels", the 師 seal lands with thrown ink,
  the sheet takes the hit, the actions rise. The counter stays visible under the dimmed backdrop, as the app dims
  the page under its moments;
- the hero: **REWARD · UNLOCKED / DUEL MASTER / WIN 10 DUELS**, your chip flips to her face, and the line becomes
  **"Wins earn you new faces."** (it said "Win streaks" for Cold Blooded).

**The tradeoff:** the gold 氷 takeover was one of the film's most striking frames, and EPIC doesn't have it.
What we gain: a woman in the reward slot, a reward that pays off the duel the film is built on (you won a duel, now
win ten), and a vermilion painting that sits naturally in the brand. The sheet also gets more time on screen
(about 0.9 s of hold after the actions rise, against about 0.2 s before). If the takeover matters more, Cold Blooded
is one constant away (`REWARD` in `src/scenes/act4.js`, plus the music map's `SHEET`).

## 4. Unchanged

Everything from the stranger's ▼ DOWN onward is the approved cut, one bar later: YOU v exit_liquidity, the line, the
standoff, the duel, the final second and drop, FFA, the Battle Royale verdict, the landing page, the ink signature,
the end card with LIVE ON HYPEREVM and the URL.

## Kanji

As the approved cut, except 氷 is replaced by **師** (Duel Master's glyph in the app), on the sheet's seal from
27.6 s. Still pending the native review, like every glyph.

## Review notes

- Frame 0 is the chart and **▲ UP**: the thumbnail is the game's choice, not a stranger's face.
- The poster (`-poster.jpg`) is taken at 1.3 s, with all three words up.
