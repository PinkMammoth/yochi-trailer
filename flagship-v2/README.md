# YOCHI flagship v2: ONE OF MANY

The approved Duels short, extended without a seam into a world-reveal and a character-driven Free For All round.
79.2 s, 1920×1080, 60 fps, on the owner's dark DnB `Victory Stamp`.

**Status: storyboard and rough animatic for owner review. Stop before final production.** Not merged, not
published. Untouched: THE LAST STAND, `flagship-animatic/` (the 59.6 s experiment), BR V4, achievement work,
`yochi-2p5d/`, the kit, every canonical painting.

## Deliverables

| # | deliverable | file |
|---|---|---|
| 1 | Revised creative treatment (incl. what would make it exceptional, candid assessment) | `docs/TREATMENT.md` |
| 2 | FFA cast and character roles | `docs/TREATMENT.md` § Casting |
| 3 | Detailed cinematic storyboard (camera, framing, blocking, emotion, gameplay, motion, FG/BG, transition, music, assets) | `docs/STORYBOARD.md` |
| 4 | Visual storyboard sheets (one annotated frame per shot) | `deliverables/storyboard/storyboard-*.jpg` |
| 5 | Revised rough animatic, with the preliminary mix | `deliverables/yochi-flagship-v2-animatic.mp4` |
| 6 | Soundtrack structure and cue map | `docs/MUSIC_CUES.md`; stems in `film/audio/out-flagship/` (rebuilt by the script) |
| 7–8 | Asset wish list and priority matrix | `docs/ASSET_WISHLIST.md` |
| 9 | Image-generation briefs (essential + high impact) | `docs/IMAGE_BRIEFS.md` |
| 10 | Technical feasibility, gameplay verification status | `docs/FEASIBILITY.md` |
| 11 | What makes it exceptional | `docs/TREATMENT.md` § Candid assessment |
| – | Contact sheet, 1 fps | `deliverables/yochi-flagship-v2-contact.jpg` |

In the animatic every frame carries a slate (bottom left) with the shot id and its art status. Missing art is
**cyan**: hatched boxes for new images, and for new poses the canonical figure stands in desaturated inside a cyan
outline with its brief id. Every unconfirmed FFA number carries a cyan **UNVERIFIED** tag.

## Layout

```
film/                         a copy of br-action-last-stand/duels/ (THE LAST STAND v2, approved) + the flagship
  DUELS_SOURCE_README.md      the approved film's own README
  audio/build_audio.py        the approved Duels edit (unchanged)
  audio/build_flagship_audio.py   the flagship edit, stems, EDL, timing map
  remotion/src/Film.tsx       the approved Duels film (unchanged; Duels-16x9 / Duels-9x16 still render)
  remotion/src/Flagship.tsx   the flagship: THE LAST STAND's scenes, then src/flagship/*
  remotion/src/flagship/      Act.tsx (the reveal, every shot, the end card), world.tsx (the gorge's depth planes), tokens.tsx, ui.tsx, timing.json
  assets/cast/                house cut-outs (from claude/yochi-first-ad-order-a)
tools/storyboard_sheets.py    the visual storyboard from a render
docs/                         treatment, storyboard, music cues, asset wish list, briefs, feasibility
```

## Rebuild

```bash
python3 yochi-2p5d/prep/prepare_character.py rampage        # from the repo root, once (gitignored builds)
python3 yochi-2p5d/prep/prepare_character.py duel-master
cd flagship-v2/film
python3 audio/build_audio.py              # the approved Duels stems (its sfx feeds the flagship)
python3 audio/build_flagship_audio.py     # the flagship edit, stems, timing.json
cd remotion && npm ci && tools/sync-assets.sh
COMP=Flagship-v2 node tools/stills.mjs /tmp/st 0.5 17.5 21.4 41.9 63.7    # review stills
tools/render-flagship.sh ../../deliverables/yochi-flagship-v2-animatic.mp4
cd ../.. && python3 tools/storyboard_sheets.py deliverables/yochi-flagship-v2-animatic.mp4 deliverables/storyboard
```

## For your review

1. Watch the animatic with sound. Listen hardest at **41.77 s** (the one splice, bar 96 → 120) and **63.59 s** (the
   close on the outro slam). I couldn't listen.
2. The direction: Duel Master as witness (not a player), the three principals, UP winning after a DOWN dive.
3. Approve the environment category (E01–E07) and the essential poses; B01 is already in hand.
4. FFA rules: grant the project read access to the app repo, or confirm `docs/FEASIBILITY.md` §4.
5. Counsel's real-money line; USDC vs HYPE variant.
