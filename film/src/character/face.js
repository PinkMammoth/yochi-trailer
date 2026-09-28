// The visor's LED display: vector glyphs quantised onto the dot grid.
//
// Two registers:
//   CALL  - one big centred symbol that fills the face (up, down, lock, win, out, digits, flame...).
//           Used whenever the character has committed; it reads at any distance.
//   FACE  - two narrow, lidded eyes for acting (watch, smug, focus, shock, happy, nervous, sad...).
// commit(dir, t) animates the moment between them: the eyes collapse into one strike line, which then
// grows up or down into the triangle, like a candle.
//
// A glyph is drawn with Canvas 2D in grid units (one unit = one LED), then thresholded into an RGBA
// grid (rgb = LED colour, a = intensity). Layers stack, each with its own colour.

export const GRID_W = 33, GRID_H = 17;

let _cv = null, _ctx = null;
function scratch(w, h) {
  if (!_cv) { _cv = document.createElement('canvas'); _ctx = _cv.getContext('2d', { willReadFrequently: true }); }
  if (_cv.width !== w || _cv.height !== h) { _cv.width = w; _cv.height = h; }
  return _ctx;
}

// Rasterise one layer: draw(ctx, cx, cy, W, H) paints white shapes; returns coverage per cell.
export function rasterLayer(W, H, draw) {
  const c = scratch(W, H);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, W, H);
  c.fillStyle = '#fff'; c.strokeStyle = '#fff';
  c.lineCap = 'butt'; c.lineJoin = 'miter';
  draw(c, W / 2, H / 2, W, H);
  const d = c.getImageData(0, 0, W, H).data;
  const out = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = d[i * 4 + 3] / 255;
  return out;
}

// layers: [{ draw, col:[r,g,b], k (intensity), thr (coverage threshold) }]
export function composeLayers(W, H, layers) {
  const data = new Uint8Array(W * H * 4);
  for (const L of layers) {
    const cov = rasterLayer(W, H, L.draw);
    const thr = L.thr ?? 0.5, k = L.k ?? 1;
    for (let i = 0; i < W * H; i++) {
      const a = cov[i];
      if (a < thr * 0.55) continue;
      const on = a >= thr ? 1 : 0.35; // edge LEDs glow dimmer: an anti-aliased dot matrix
      data[i * 4] = L.col[0]; data[i * 4 + 1] = L.col[1]; data[i * 4 + 2] = L.col[2];
      data[i * 4 + 3] = Math.round(255 * Math.min(1, on * k));
    }
  }
  return { data, w: W, h: H };
}

// ---- drawing helpers (grid units; y down) ----------------------------------------------------
const poly = (c, pts) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fill(); };
const tri = (c, x, y, w, h, up) => (up ? poly(c, [[x, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]]) : poly(c, [[x, y + h / 2], [x + w / 2, y - h / 2], [x - w / 2, y - h / 2]]));
const rect = (c, x, y, w, h) => c.fillRect(x - w / 2, y - h / 2, w, h);
const ring = (c, x, y, r, w) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.arc(x, y, r - w, 0, Math.PI * 2, true); c.fill(); };
const bar = (c, x0, y0, x1, y1, w) => { c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
// eye positions: FACE glyphs sit a little above the display centre
const EX = 8.2, EY = -1.0;
const eyes = (c, cx, cy, fn) => { fn(cx - EX, cy + EY, -1); fn(cx + EX, cy + EY, 1); };

export const GLYPHS = {
  // ---- CALL register ---------------------------------------------------------------------------
  up: (c, cx, cy) => tri(c, cx, cy + 0.2, 18, 13.4, true),
  down: (c, cx, cy) => tri(c, cx, cy - 0.2, 18, 13.4, false),
  strike: (c, cx, cy, W) => { for (let x = 2; x < W - 2; x += 3) c.fillRect(x, cy - 0.5, 2, 1); },
  lock: (c, cx, cy) => { rect(c, cx, cy + 2.5, 11, 8); ring(c, cx, cy - 2.2, 4.2, 1.6); c.clearRect(cx - 5, cy - 2.2, 10, 1.2); rect(c, cx - 3.3, cy - 1.2, 1.6, 3); rect(c, cx + 3.3, cy - 1.2, 1.6, 3); c.clearRect(cx - 0.8, cy + 1.6, 1.6, 2.6); },
  win: (c, cx, cy) => {
    // a bold dot-matrix dollar
    c.lineWidth = 2.2; c.lineCap = 'butt';
    c.beginPath(); c.moveTo(cx + 5, cy - 4.3); c.lineTo(cx - 3, cy - 4.3); c.quadraticCurveTo(cx - 5.2, cy - 4.3, cx - 5.2, cy - 2); c.quadraticCurveTo(cx - 5.2, cy, cx - 3, cy);
    c.lineTo(cx + 3, cy); c.quadraticCurveTo(cx + 5.2, cy, cx + 5.2, cy + 2.2); c.quadraticCurveTo(cx + 5.2, cy + 4.4, cx + 3, cy + 4.4); c.lineTo(cx - 5, cy + 4.4); c.stroke();
    rect(c, cx, cy, 2, 14);
  },
  out: (c, cx, cy) => { c.lineCap = 'butt'; bar(c, cx - 6, cy - 6, cx + 6, cy + 6, 2.6); bar(c, cx + 6, cy - 6, cx - 6, cy + 6, 2.6); },
  bang: (c, cx, cy) => { rect(c, cx, cy - 2, 3, 9); rect(c, cx, cy + 5, 3, 2.2); },
  ask: (c, cx, cy) => { c.lineWidth = 2.4; c.beginPath(); c.arc(cx, cy - 3, 3.8, Math.PI * 1.1, Math.PI * 2.35); c.lineTo(cx, cy + 1.5); c.stroke(); rect(c, cx, cy + 5, 2.6, 2.2); },
  flame: (c, cx, cy) => {
    c.beginPath();
    c.moveTo(cx, cy + 6.6);
    c.bezierCurveTo(cx - 4.6, cy + 6.6, cx - 6.2, cy + 2.4, cx - 4.6, cy - 1.2);
    c.bezierCurveTo(cx - 4.0, cy - 2.6, cx - 3.6, cy - 3.4, cx - 3.4, cy - 5.2);
    c.bezierCurveTo(cx - 2.0, cy - 3.8, cx - 1.4, cy - 2.8, cx - 0.9, cy - 1.8);
    c.bezierCurveTo(cx - 0.8, cy - 4.8, cx + 1.0, cy - 6.8, cx + 2.4, cy - 7.8);
    c.bezierCurveTo(cx + 2.6, cy - 5.0, cx + 6.4, cy - 2.2, cx + 5.6, cy + 2.4);
    c.bezierCurveTo(cx + 5.2, cy + 5.4, cx + 3.0, cy + 6.6, cx, cy + 6.6);
    c.fill();
    c.globalCompositeOperation = 'destination-out';
    c.beginPath(); c.moveTo(cx + 0.2, cy + 4.8);
    c.bezierCurveTo(cx - 2.2, cy + 4.8, cx - 2.6, cy + 2.4, cx - 1.2, cy + 0.6);
    c.bezierCurveTo(cx - 0.6, cy + 1.6, cx + 0.4, cy + 0.4, cx + 0.8, cy - 0.8);
    c.bezierCurveTo(cx + 2.8, cy + 1.0, cx + 2.8, cy + 4.8, cx + 0.2, cy + 4.8);
    c.fill();
    c.globalCompositeOperation = 'source-over';
  },
  // ---- FACE register ---------------------------------------------------------------------------
  watch: (c, cx, cy) => eyes(c, cx, cy, (x, y) => rect(c, x, y, 8, 2)),
  focus: (c, cx, cy) => eyes(c, cx, cy, (x, y, s) => poly(c, [[x - 4, y - 1.2 - s * 1.2], [x + 4, y - 1.2 + s * 1.2], [x + 4, y + 1.2 + s * 1.2], [x - 4, y + 1.2 - s * 1.2]])),
  // heavy lids: flat bottom, top edge dropping toward the outer corner (the internet's smug)
  smug: (c, cx, cy) => { eyes(c, cx, cy, (x, y, s) => poly(c, [[x - 4.4, y - 0.4 + (s < 0 ? 1.4 : 0)], [x + 4.4, y - 0.4 + (s > 0 ? 1.4 : 0)], [x + 4.4, y + 1.6], [x - 4.4, y + 1.6]])); rect(c, cx + 2.5, cy + 5.5, 6, 1.2); rect(c, cx + 6, cy + 4.6, 1.2, 1.4); },
  shock: (c, cx, cy) => { eyes(c, cx, cy, (x, y) => { c.fillRect(x - 3, y - 3.5, 6, 7); c.clearRect(x - 1.2, y - 1.7, 2.4, 3.4); }); ring(c, cx, cy + 5.6, 1.6, 1.0); },
  happy: (c, cx, cy) => eyes(c, cx, cy, (x, y) => { c.lineWidth = 1.9; c.beginPath(); c.moveTo(x - 4.2, y + 1.8); c.lineTo(x, y - 2.2); c.lineTo(x + 4.2, y + 1.8); c.stroke(); }),
  nervous: (c, cx, cy) => { eyes(c, cx, cy, (x, y, s) => { c.lineWidth = 1.8; c.beginPath(); c.moveTo(x - s * 3.5, y - 2.8); c.lineTo(x + s * 3.5, y); c.lineTo(x - s * 3.5, y + 2.8); c.stroke(); }); for (let i = -3; i <= 3; i++) rect(c, cx + i * 1.5, cy + 5.6 + (i % 2 ? 0.8 : 0), 1, 1); },
  sad: (c, cx, cy) => eyes(c, cx, cy, (x, y) => { rect(c, x, y - 1.5, 8, 1.6); rect(c, x - 2, y + 2.4, 1.4, 4.2); rect(c, x + 2, y + 1.4, 1.4, 2.4); }),
  dead: (c, cx, cy) => eyes(c, cx, cy, (x, y) => { bar(c, x - 3, y - 3, x + 3, y + 3, 1.6); bar(c, x + 3, y - 3, x - 3, y + 3, 1.6); }),
  cash: (c, cx, cy) => eyes(c, cx, cy, (x, y) => { c.lineWidth = 1.3; c.beginPath(); c.moveTo(x + 2.8, y - 3); c.lineTo(x - 1.6, y - 3); c.quadraticCurveTo(x - 3, y - 3, x - 3, y - 1.5); c.quadraticCurveTo(x - 3, y, x - 1.5, y); c.lineTo(x + 1.5, y); c.quadraticCurveTo(x + 3, y, x + 3, y + 1.5); c.quadraticCurveTo(x + 3, y + 3, x + 1.6, y + 3); c.lineTo(x - 2.8, y + 3); c.stroke(); rect(c, x, y, 1.2, 8.4); }),
  // legacy names used by the old sheets
  slits: (c, cx, cy) => eyes(c, cx, cy, (x, y) => rect(c, x, y, 8, 2)),
};

// Commit animation: dir +1 (up) / -1 (down), t 0..1.
//   0.00-0.35: the eyes slide together into one strike line
//   0.35-1.00: the line grows into the triangle, pointing the way of the call
export function commitGlyph(dir, t) {
  return (c, cx, cy) => {
    if (t < 0.35) {
      const u = t / 0.35, e = u * u * (3 - 2 * u);
      const x = EX * (1 - e), w = 8 + e * 14, y = cy + EY * (1 - e);
      rect(c, cx - x, y, w, 2); rect(c, cx + x, y, w, 2);
      return;
    }
    const u = (t - 0.35) / 0.65, e = 1 - Math.pow(1 - u, 3);
    const H = 13.4 * e, Wd = 18 + (1 - e) * 10;
    // base sits on the strike line and the apex grows away from it
    const base = cy + (dir > 0 ? 6.9 : -6.9) * e;
    if (dir > 0) poly(c, [[cx, base - H], [cx + Wd / 2, base], [cx - Wd / 2, base]]);
    else poly(c, [[cx, base + H], [cx + Wd / 2, base], [cx - Wd / 2, base]]);
    if (H < 1.2) rect(c, cx, base, Wd, 2);
  };
}

const _faceCache = new Map();
export function face(glyph, col, W = GRID_W, H = GRID_H, k = 1) {
  const key = typeof glyph === 'string' ? `${glyph}|${col.join(',')}|${W}|${H}|${k}` : null;
  if (key && _faceCache.has(key)) return _faceCache.get(key);
  const g = typeof glyph === 'function' ? glyph : GLYPHS[glyph];
  if (!g) throw new Error(`no glyph "${glyph}"`);
  const out = composeLayers(W, H, [{ draw: g, col, k }]);
  if (key) _faceCache.set(key, out);
  return out;
}
