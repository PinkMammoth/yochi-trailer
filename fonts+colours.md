The frontend loads three web fonts in app/client/index.html:82:

Chakra Petch — the main display and interface font.
JetBrains Mono — numbers, labels, and other monospace text.
VT323 — used for the retro arcade style.

The shared .callit-v2 palette in app/client/src/index.css:1108 uses:

Backgrounds: #07060c (base), #110f1a, #1a1828, #221f30 (surfaces).
Text: #f5f3ff (main), #a8a2c8 (muted), #8d87b0 (faint).
Accent: #18e0ff (cyan), with translucent soft and glow variants.
Positive: #39ff14 (neon green).
Negative: #ff3860 and #ff004f (red/pink).

There’s also a legacy palette used by arcade and other older screens: black backgrounds, white text, neon green #00ff00, red #ff0033, and purple #ff00ff.