# yochi-trailer: working notes for Claude sessions

Before any Yochi video, card or trailer work:

1. Read `docs/YOCHI_MOTION_STYLE_GUIDE.md`. It names the canonical assets, the brand and motion rules, and the
   asset-selection process. Use the approved assets it lists by default.
2. Read `asset-pack/sumi/SHARED-RULES.md` and `asset-pack/sumi/README.md` (the Sumi brand kit). They outrank the guide.
3. Check `docs/asset-audit/OPEN_DECISIONS.md` for questions that are still open.

Hard rules (details in the guide):
- Use only the painted cast. Never invent, repaint, recolour or restyle a character.
- Animate with camera, parallax, whole-figure transforms, ink, seals and impact frames. No rigs, limb cuts or face animation.
- Bring a painting to life with `yochi-2p5d/` (pure Remotion 2.5D, 16:9 and 9:16): subtle rigid ambient motion,
  exaggeration only in brief impact moments. Blender only for specific shots that need physical depth, light or camera.
- `film/`, `asset-pack/characters|avatars|props|raw-clips`, `stills/`, `prompt.md` and `fonts+colours.md` are the
  retired September brand. Don't use them, and don't delete them.
- Never overwrite an approved deliverable. Add new versions beside it.
