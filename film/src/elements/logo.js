// The Yochi mark, traced from asset-pack/Yochi_logo.png (IoU 0.988).
// Coordinates are normalised: 1 unit = 1000px of the 3000px source; centre of bbox at (0,0).
import { rgba, clamp, lerp } from '../core/math.js';

export const LOGO_POLY = [[-0.9350, -0.4545], [-0.8725, -0.5585], [-0.1200, -0.1185], [-0.0605, -0.1550], [-0.0605, -0.2340], [-0.8063, -0.6757], [-0.7460, -0.7795], [0.0000, -0.3400], [0.7460, -0.7795], [0.8063, -0.6757], [0.0605, -0.2340], [0.0605, -0.1550], [0.1200, -0.1185], [0.8725, -0.5585], [0.9350, -0.4545], [0.1835, -0.0110], [0.1820, 0.7800], [0.0590, 0.7790], [0.0590, -0.0130], [0.0000, -0.0490], [-0.0590, -0.0130], [-0.0590, 0.7790], [-0.1820, 0.7800], [-0.1835, -0.0110]];

// Stroke-part decomposition for assembly animations (same stroke width ≈ 0.121).
// Each part is a quad in logo units; together they cover the mark.
export const LOGO_PARTS = {
  stemL: [[-0.1835, -0.0110], [-0.0590, -0.0130], [-0.0590, 0.7790], [-0.1820, 0.7800]],
  stemR: [[0.0590, -0.0130], [0.1835, -0.0110], [0.1820, 0.7800], [0.0590, 0.7790]],
  armLoL: [[-0.9350, -0.4545], [-0.8725, -0.5585], [-0.1200, -0.1185], [-0.1835, -0.0110]],
  armLoR: [[0.9350, -0.4545], [0.8725, -0.5585], [0.1200, -0.1185], [0.1835, -0.0110]],
  armHiL: [[-0.8063, -0.6757], [-0.7460, -0.7795], [0.0000, -0.3400], [0.0000, -0.2000]],
  armHiR: [[0.8063, -0.6757], [0.7460, -0.7795], [0.0000, -0.3400], [0.0000, -0.2000]],
  core: [[-0.0605, -0.2340], [0.0605, -0.2340], [0.0605, -0.1550], [0.1200, -0.1185], [0.1835, -0.0110], [0.0590, -0.0130], [0.0000, -0.0490], [-0.0590, -0.0130], [-0.1835, -0.0110], [-0.1200, -0.1185], [-0.0605, -0.1550]],
};

export function logoPath(c, poly = LOGO_POLY) {
  c.beginPath();
  poly.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
}

// Draw the mark at (x,y) with height h (in px). o: { col, alpha, glow, reveal (0..1 bottom-up wipe) }
export function drawLogo(R, x, y, h, o = {}) {
  const { b, g } = R;
  const s = h / 1.56; // mark height in units is ~1.56
  const col = o.col || [24, 224, 255];
  const a = o.alpha ?? 1;
  for (const [c, al] of [[b, 1], [g, o.glow ?? 0.85]]) {
    c.save(); c.translate(x, y); c.scale(s, s);
    if (o.reveal !== undefined && o.reveal < 1) {
      c.beginPath(); c.rect(-2, 0.8 - 1.7 * clamp(o.reveal), 4, 3); c.clip();
    }
    c.fillStyle = rgba(c === b ? [lerp(col[0], 255, o.hot ?? 0.12), lerp(col[1], 255, o.hot ?? 0.12), lerp(col[2], 255, o.hot ?? 0.12)] : col, a * al);
    logoPath(c); c.fill();
    c.restore();
  }
}

export function drawPart(R, part, x, y, h, o = {}) {
  const { b, g } = R;
  const s = h / 1.56;
  const col = o.col || [24, 224, 255];
  const a = o.alpha ?? 1;
  for (const [c, al] of [[b, 1], [g, o.glow ?? 0.85]]) {
    c.save(); c.translate(x, y); c.scale(s, s);
    if (o.tx || o.ty) c.translate(o.tx || 0, o.ty || 0);
    if (o.rot) c.rotate(o.rot);
    c.fillStyle = rgba(col, a * al);
    logoPath(c, LOGO_PARTS[part]); c.fill();
    c.restore();
  }
}
