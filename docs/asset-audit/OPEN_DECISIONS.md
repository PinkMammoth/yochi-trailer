# Decisions (asset audit, 15 Nov 2026)

## Resolved (owner, 15 Nov 2026)

| # | question | answer | where it's recorded |
|---|---|---|---|
| 1 | Who fights in the USDC short? | The recommendation stands: **Perma-Bull (YOU, picks HYPE) against Paper Hands (USDC)**, with the cast as players | USDC_HYPE_REWORK_PLAN |
| 2 | Are the v2 paintings canon? | **Yes.** There's a new Perma-Bull and a new Cold Blooded. Now in the kit as `asset-pack/sumi/avatars/{cards,portraits}/{starter-perma-bull,cold-blooded}-v2.webp`; v1 files kept, marked retired | kit README cast table (`b43ee50`) |
| 3 | Merge the Sumi branches to `master`? | **Not yet.** The canonical cut-outs and engine stay on `claude/yochi-first-ad-order-a` for now | this file |
| 4 | Is HYPE the stake on Elysium? | **Yes, HYPE, not USDC.** The short's premise is true | SHARED-RULES copy rules, Elysium exception |
| 5 | Kanji review | **Done, and the glyphs are fine**, including 氷 and 師 from the first ad. New glyphs still need review | SHARED-RULES kanji rules |

## Still open

6. **The 48 px key-text floor vs the approved cards.** SHARED-RULES wants key text at ~48 px cap at 1080p, but the
   approved landscape card and the USDC end card set the URL in ~25 px cap mono. Is the URL "key text"?
   Recommended: yes on video (≥40 px cap), with static cards exempt.

7. **Lighting on figures.** The approved films never tint a painted figure except the loss grey. May future films add
   a scene colour cast or rim light to a figure? Recommended: no, keep lighting in the world.

8. **Mesh-warp micro-motion (rung 5).** Worth a test on two clean mattes, or stay with camera and parallax only?
   Recommended: test, but don't ship it without a review of stills.

9. **Re-matte the weak cut-outs?** Contrarian (her DOWN sign is in the plate), Lab Rat (failed), Whale and Insider
   (no clean figure). Recommended: yes for Contrarian (she's a starter and the DOWN-pick face). The others can stay
   flat cards.

10. **Retire `trailer.wav` formally?** It's still named as a fallback in the v2 prompts.

11. **Mainnet timing.** Resolved for the USDC short (15 Nov): it's Elysium *mainnet* promotional material (v2 points
    to `yochigg.xyz`), and testnet is being announced without a video. Still open: whether mainnet is live yet,
    which gates releasing both v2 and gameplay cut B, and counsel's wording for the real-money line both use.

12. **Foley and textures.** Do you want recorded hanko and brush sounds, or scanned washi and ink textures, added to
    the kit? There are none now. Everything is procedural or synthesised.

13. **The app's glyph registry** (`asset-pack/sumi/reference/code/seal-glyphs.ts`) still marks every glyph
    `review: 'pending'`. That file is a copy of app code, so I left it. Flip the flags in the app itself.
