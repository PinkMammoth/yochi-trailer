// Pixel-art toolkit: shapes are drawn with ordinary Canvas 2D paths on a small canvas, then snapped to the sprite's
// palette (alpha thresholded, every pixel to its nearest palette colour) and given a one-pixel ink outline. Shading
// is done per part with a clip: shade fills the part, base fills it shifted toward the light, and a light rim is the
// even-odd difference of the part and itself shifted away from the light.
import { hexToRgb } from '../core/math.js';

export const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

const LIGHT = [-1, -1]; // upper left

// A part: `path(c)` adds one closed, non-self-intersecting contour to the current path.
// col = [light, base, shade]. o.rim = light rim width, o.sh = shade depth, o.line = inner contour colour.
export function part(c, path, col, o = {}) {
  const [L, B, S] = col;
  const sh = o.sh ?? 2, rim = o.rim ?? 1;
  const lx = o.lx ?? LIGHT[0], ly = o.ly ?? LIGHT[1];
  c.save();
  c.beginPath(); path(c); c.clip();
  c.fillStyle = S || B; c.fillRect(-4000, -4000, 8000, 8000);
  c.save(); c.translate(lx * sh, ly * sh); c.beginPath(); path(c); c.fillStyle = B; c.fill(); c.restore();
  if (L && rim > 0) {
    c.beginPath(); path(c); c.translate(-lx * rim, -ly * rim); path(c);
    c.setTransform(c.getTransform()); c.fillStyle = L; c.fill('evenodd');
  }
  c.restore();
  if (o.line) { c.save(); c.beginPath(); path(c); c.strokeStyle = o.line; c.lineWidth = o.lw ?? 1; c.stroke(); c.restore(); }
}

// A tapered capsule from (x1, y1, r1) to (x2, y2, r2) as one contour.
export function capsule(x1, y1, r1, x2, y2, r2) {
  return (c) => {
    const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 0.001;
    const a = Math.atan2(dy, dx);
    const k = Math.max(-1, Math.min(1, (r1 - r2) / d));
    const off = Math.acos(k);
    c.moveTo(x1 + r1 * Math.cos(a + off), y1 + r1 * Math.sin(a + off));
    c.arc(x1, y1, r1, a + off, a - off + Math.PI * 2, false);
    c.arc(x2, y2, r2, a - off, a + off, false);
    c.closePath();
  };
}
export function ellipse(x, y, rx, ry, rot = 0) {
  return (c) => { c.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.closePath(); };
}
// A closed polygon with optionally rounded corners (r) through the points.
export function poly(pts, r = 0) {
  return (c) => {
    const n = pts.length;
    if (!r) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); return; }
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const m0 = mid(pts[n - 1], pts[0]);
    c.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; c.arcTo(p[0], p[1], q[0], q[1], r); }
    c.closePath();
  };
}
// A smooth closed blob through points (Catmull-Rom as quadratic midpoints).
export function blob(pts) {
  return (c) => {
    const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const m0 = mid(pts[n - 1], pts[0]);
    c.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % n]); c.quadraticCurveTo(p[0], p[1], m[0], m[1]); }
    c.closePath();
  };
}

// Snap a canvas to its palette, threshold alpha, then add the outer outline.
const PAL_CACHE = new Map();
function palRgb(pal) {
  const k = pal.join(',');
  if (!PAL_CACHE.has(k)) PAL_CACHE.set(k, pal.map(hexToRgb));
  return PAL_CACHE.get(k);
}
export function crunch(cv, pal, outline = '#0b0908', o = {}) {
  const w = cv.width, h = cv.height, c = cv.getContext('2d', { willReadFrequently: true });
  const id = c.getImageData(0, 0, w, h), d = id.data;
  const P = palRgb(pal), O = hexToRgb(outline);
  const solid = new Uint8Array(w * h);
  for (let i = 0, p = 0; p < w * h; p++, i += 4) {
    if (d[i + 3] < (o.thresh ?? 110)) { d[i + 3] = 0; continue; }
    // un-premultiply is not needed: getImageData returns straight alpha
    const r = d[i], g = d[i + 1], b = d[i + 2];
    let best = 0, bd = 1e9;
    for (let k = 0; k < P.length; k++) { const q = P[k]; const e = (r - q[0]) ** 2 * 0.3 + (g - q[1]) ** 2 * 0.59 + (b - q[2]) ** 2 * 0.11; if (e < bd) { bd = e; best = k; } }
    d[i] = P[best][0]; d[i + 1] = P[best][1]; d[i + 2] = P[best][2]; d[i + 3] = 255; solid[p] = 1;
  }
  if (outline) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x; if (solid[p]) continue;
      if ((x > 0 && solid[p - 1]) || (x < w - 1 && solid[p + 1]) || (y > 0 && solid[p - w]) || (y < h - 1 && solid[p + w])) {
        const i = p * 4; d[i] = O[0]; d[i + 1] = O[1]; d[i + 2] = O[2]; d[i + 3] = 255;
      }
    }
  }
  c.putImageData(id, 0, 0);
  return cv;
}

// Draw a sprite function into a fresh canvas of (w, h) with its origin at (ox, oy), crunch it, return it.
const POOL = new Map();
export function sprite(key, w, h, ox, oy, pal, fn, o = {}) {
  let cv = POOL.get(key);
  if (!cv || cv.width !== w || cv.height !== h) { cv = mk(w, h); POOL.set(key, cv); }
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h);
  c.imageSmoothingEnabled = false;
  c.translate(ox, oy);
  if (o.rot) c.rotate(o.rot);
  if (o.flip) c.scale(-1, 1);
  if (o.scale) c.scale(o.scale, o.scale);
  fn(c);
  return crunch(cv, pal, o.outline === undefined ? '#0b0908' : o.outline, o);
}

// Crisp pixel rect (integer), for faces and details.
export function px(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); }
