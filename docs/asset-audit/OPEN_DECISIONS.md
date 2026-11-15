# Decisions needed (asset audit, 15 Nov 2026)

Ordered by what blocks the USDC rework first. Each has a recommendation; nothing has been decided on your behalf.

1. **Who fights in the USDC short?** Recommended: Perma-Bull (YOU, picks HYPE) against Paper Hands (USDC), with the
   cast staying *players* rather than tokens. Alternatives: Doomer as USDC (continuity with the first ad), or
   Rampage for the impact frame. See USDC_HYPE_REWORK_PLAN, "Casting".

2. **Promote the v2 paintings into the kit?** The owner's 5 Nov Perma-Bull and Cold Blooded v2 exist only on the
   flagship branches (`film-flagship/assets/cast/source/`). Recommended: copy them into `asset-pack/sumi/avatars/`
   (as `*-v2.webp`, the kit's own convention), mark the old ones retired in the kit README the way Gunslinger is,
   and fix Cold Blooded's description (the v2 painting is a man). Does the app ship v2 too?

3. **Merge the Sumi work to `master`?** `master` stops at 3 Nov. The locked first ad, the cut-out pipeline and the
   approved cards live on unmerged branches, so a fresh session from `master` doesn't see them. Recommended: merge,
   or at least promote `film-flagship/assets/cast/` and `src/lib/{cast,ui,brush}.js` into a shared location.

4. **The USDC message vs the copy rules.** SHARED-RULES: "Money is USDC. HYPE is the asset, never what you win." The
   short's premise is "choose your collateral … USDC has been eliminated … just HYPE". If Yochi on Elysium really
   stakes HYPE instead of USDC, the shared rules need an Elysium exception. If it doesn't, the premise needs a
   rethink. This is a product-truth question only you can answer.

5. **Kanji outside the allowed list.** The first ad used 氷 and 師 from the app's glyph registry. SHARED-RULES allows
   only 予知 対 決 勝 敗 命 連勝. Does the app registry now override the shared list? Every glyph is still pending
   native review. Has the November review happened?

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

11. **Mainnet gameplay cut B** (`film-gameplay`) is marked "release only once real-money play is open on Elysium". Has
    that happened? It also decides whether the USDC short's URL stays `testnet.yochigg.xyz`.

12. **Foley and textures.** Do you want recorded hanko and brush sounds, or scanned washi and ink textures, added to
    the kit? There are none now. Everything is procedural or synthesised.
