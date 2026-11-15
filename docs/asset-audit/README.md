# Visual-identity and asset audit (15 Nov 2026)

Audit of the repo and all its branches before any further Yochi video work. Nothing was deleted, moved or
overwritten, and no film was changed. Everything here is new, under `docs/`.

| deliverable | file |
|---|---|
| 1. Asset inventory | `ASSET_INVENTORY.md` (summary and evidence) · `inventory.csv` (all 658 assets: dims, alpha, Git provenance, tier, confidence) |
| 2. Contact sheets | `contact-sheets/01-cast-current.jpg` · `02-cast-cutouts.jpg` · `03-cast-revisions.jpg` · `04-ui-reference.jpg` · `05-legacy-do-not-use.jpg` · `06-brand-system.png` · `07-matte-problems.jpg` |
| 3. Motion style guide | `../YOCHI_MOTION_STYLE_GUIDE.md` |
| 4. Character-animation approach | `ANIMATION_FEASIBILITY.md` (method ladder, per-character table) |
| 5. USDC vs HYPE rework plan | `USDC_HYPE_REWORK_PLAN.md` · stills: `usdc-review/` |
| 6. Decisions needed | `OPEN_DECISIONS.md` |

## Headline findings

- **The brand system is well documented and consistent:** `asset-pack/sumi/` (28–30 Oct) is the source of truth,
  and the approved films follow it.
- **The best evidence of current use is off `master`:** the locked first ad, the cut-out pipeline and the owner's v2
  Perma-Bull and Cold Blooded paintings all live on `claude/yochi-first-ad-order-a`.
- **The cast is already separated for 2.5D** (figure, plate and head point for all 28), but no painting has real
  layers, and every one is cropped by its frame, so there's no full-body figure. Four mattes need fixing or care
  (Contrarian, Lab Rat, Whale, Insider).
- **The USDC short v1 breaks the kit's "don't invent new characters" rule.** It also has one real overflow (the
  ELIMINATED headline), three label collisions, and sub-48 px key text. The rework keeps its timing and audio and
  swaps in the painted cast.

## Re-running

From the repo root (needs Python 3 with Pillow, ffmpeg, Node with Playwright and Chromium):

```bash
python3 docs/asset-audit/tools/inventory.py
```

```bash
NODE_PATH=$(npm root -g) python3 docs/asset-audit/tools/contact_sheets.py
```

From an engine folder (`shorts/`, or a film built on the flagship engine):

```bash
cd shorts && NODE_PATH=$(npm root -g) node ../docs/asset-audit/tools/text_audit.mjs --film usdc
```

The scripts read branch-only assets with `git show`, so run `git fetch origin` first. They write only inside
`docs/asset-audit/`.
