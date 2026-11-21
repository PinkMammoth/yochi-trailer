# YOCHI flagship: creative development and animatic

Working title **ONE OF MANY**. A duel, a pullback that reveals a world, a Free For All on one candle. 59.6 s,
1920×1080, on the owner's `Victory Stamp_dark_dnb.mp3`.

**Status: animatic for owner review. Stop here before final production.** Nothing published, merged or deployed.
THE LAST STAND (`claude/br-action-last-stand`), BATTLE ROYALE V4 (`last-candle-standing/v4`), the achievement work
and every canonical illustration are untouched; this folder copies what it uses.

## Deliverables

| # | deliverable | file |
|---|---|---|
| 1 | Creative treatment (concept, tone, audience, structure, decisions, kanji) | `docs/TREATMENT.md` |
| 2 | FFA vs Battle Royale comparison and recommendation (**FFA**) | `docs/TREATMENT.md` § Option A vs Option B |
| 3 | Music map (structure, source timestamps, the edit, sync) | `docs/MUSIC_MAP.md`, `docs/music-map.png`, `audio/analysis.json`, `audio/out/edl.json` |
| 4 | Shot-by-shot storyboard with timings | `docs/STORYBOARD_AND_ASSETS.md` |
| 5 | **Rendered animatic**, recommended (FFA), with the preliminary mix | `deliverables/yochi-flagship-animatic-ffa.mp4` |
| 5b | The alternative (Battle Royale), same Acts I–II and music | `deliverables/yochi-flagship-animatic-br-alt.mp4` |
| 6 | Duel-to-world transition prototype, on its own | `deliverables/yochi-flagship-pullback-prototype.mp4` (+ S13–S14 in the animatic) |
| 7 | Casting proposal | `docs/TREATMENT.md` § Casting |
| 8 | Asset inventory (READY / ADAPTABLE / NEW-E / NEW-HI / OPT) and the per-shot matrix | `docs/STORYBOARD_AND_ASSETS.md` |
| 9 | Image-generation briefs | `docs/IMAGE_BRIEFS.md` |
| 10 | Technical feasibility report (incl. gameplay verification status) | `docs/FEASIBILITY.md` |
| 11 | Contact sheets, 1 frame per second | `deliverables/*-contact.jpg` |

Every animatic frame carries a slate (bottom left) naming its shot and the art's status. Missing art is shown as
**cyan hatched PLACEHOLDER boxes** with its brief id, never disguised.

## Layout

```
audio/analyse.py        objective track analysis -> audio/analysis.json, docs/music-map-raw.png
audio/build_audio.py    the music edit + placeholder SFX -> audio/out/{music,sfx,mix}.wav, edl.json, remotion/src/timing.json
audio/music_map.py      docs/music-map.png
assets/                 this film's copies: kit cards, approved poses, mattes (one new: duel-master-victory), house cut-outs
remotion/src/           Film.tsx (act switch), data.ts (matches, rules, numbers), scenes/{Duel,Pullback,FFA,BR,End}.tsx, lib/
tools/matte.py          THE LAST STAND's matte tool (copied)
tools/contact.py        contact sheets from an encoded MP4
```

## Rebuild

```bash
pip install numpy scipy librosa soundfile opencv-python-headless pillow
python3 audio/analyse.py            # optional: re-measure the track
python3 audio/build_audio.py        # the edit, stems, EDL, timing.json
cd remotion && npm ci && tools/sync-assets.sh
node tools/stills.mjs /tmp/st Flagship-FFA 12.3 20.5 44.7     # review stills (film seconds)
tools/render.sh Flagship-FFA ../deliverables/yochi-flagship-animatic-ffa.mp4
tools/render.sh Flagship-BR ../deliverables/yochi-flagship-animatic-br-alt.mp4
tools/render.sh Pullback-Proto ../deliverables/yochi-flagship-pullback-prototype.mp4 ../audio/out/mix.wav 13.9696
cd .. && python3 tools/contact.py deliverables/yochi-flagship-animatic-ffa.mp4 deliverables/yochi-flagship-animatic-ffa-contact.jpg
```

## Asset provenance

| asset | from | added by |
|---|---|---|
| `assets/cards/{rampage,duel-master}.webp` | `asset-pack/sumi/avatars/cards/` (the kit) | owner, Sumi kit |
| `assets/poses/*` | `claude/br-action-last-stand:br-action-last-stand/duels/assets/poses/` (approved, 20–21 Nov) | owner-approved pose variants |
| `assets/mattes/{rampage-hit,duel-master-attack}.png` | same branch, `duels/assets/mattes/` | THE LAST STAND |
| `assets/mattes/duel-master-victory.png` | **new**, `tools/matte.py` on the approved victory pose (pixels unchanged, alpha only) | this film |
| `assets/cast/*` | `claude/yochi-first-ad-order-a:film-flagship/assets/cast/` (house cut-outs, v2 Cold Blooded and Perma-Bull) | the first ad |
| music | `last-candle-standing/v4/music-source/Victory Stamp_dark_dnb.mp3` | owner |

## For the owner's review

1. Watch `yochi-flagship-animatic-ffa.mp4` with sound, then the BR alternative.
2. By ear: the splice at **44.66 s** (bar 96 → 136) and the 3-beat silence at **10.97 s**. I couldn't listen.
3. Decide FFA or BR, then approve B01 + B02 as a category (the first environment paintings in the kit).
4. Grant this project read access to the app repo, or confirm the FFA contract points in `docs/FEASIBILITY.md` §5.
5. Counsel's real-money line for the end card.
