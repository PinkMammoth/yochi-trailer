// Shared helpers for design sheets.
import { rgba } from '../../src/core/math.js';

export const COL = {
  void: [7, 6, 12], text: [245, 243, 255], muted: [168, 162, 200], faint: [141, 135, 176],
  cyan: [24, 224, 255], green: [57, 255, 20], red: [255, 56, 96], red2: [255, 0, 79], gold: [255, 194, 58],
  pearl: [226, 224, 240], graphite: [44, 42, 60], slate: [84, 82, 106],
};

export function backdrop(R, o = {}) {
  const { b } = R;
  const cx = o.cx ?? 960, cy = o.cy ?? 600;
  const bg = b.createRadialGradient(cx, cy, 40, cx, cy, o.r ?? 1250);
  bg.addColorStop(0, o.inner || '#1a1830'); bg.addColorStop(1, '#07060c');
  b.fillStyle = bg; b.fillRect(0, 0, 1920, 1080);
}

export function label(R, text, x, y, o = {}) {
  const { b } = R;
  b.save();
  b.font = o.font || `600 ${o.size || 18}px "Chakra Petch"`;
  b.letterSpacing = `${o.track ?? 3}px`;
  b.fillStyle = rgba(o.col || COL.muted, o.alpha ?? 1);
  b.textAlign = o.align || 'left';
  b.textBaseline = 'alphabetic';
  b.fillText(text, x, y);
  b.restore();
}

export function rule(R, x0, x1, y, col = COL.faint, a = 0.35) {
  R.b.fillStyle = rgba(col, a); R.b.fillRect(x0, y, x1 - x0, 1);
}

// lighting presets in the film's language
export const LIGHT = {
  studio: {
    key: { x: -0.62, y: -0.55, z: 0.55, col: [205, 228, 255], k: 1.0 },
    rim: { x: 0.85, y: -0.45, z: -0.55, col: [24, 224, 255], k: 1.0 },
    fill: { x: 0.2, y: 1.0, z: 0.4, col: [34, 36, 78], k: 1.0 },
    amb: [16, 14, 30],
  },
};
