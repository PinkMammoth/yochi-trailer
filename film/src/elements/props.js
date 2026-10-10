// Prop textures (asset-pack/props, prepared by tools/props_prep.py): the glass faces of the tower blocks and
// the satin plinth of the hex podiums, wrapped onto the film's 3D shapes face by face. A face is drawn as a
// grid of affine-mapped triangles (canvas 2D has no perspective mapping; at these sizes a 3x3 grid hides it).
import { rgba } from '../core/math.js';

const TEX = {};
const NAMES = ['glass-face-a', 'glass-face-b', 'podium-side', 'podium-top'];
const cpu = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d', { willReadFrequently: true }); return c; };
async function load(name) {
  const im = new Image(); im.src = `assets/props/${name}.png`; await im.decode();
  const c = cpu(im.naturalWidth, im.naturalHeight); c.getContext('2d').drawImage(im, 0, 0);
  return c;
}
export async function loadProps() { await Promise.all(NAMES.map(async (n) => { TEX[n] = await load(n); })); }
export const propsReady = () => !!TEX['podium-top'];
export const tex = (n) => TEX[n];

// the podium side's bands, as fractions of its height: the chamfer band, then the empty LED recess
export const PODIUM_SIDE = { band: [0, 0.067], recess: [0.067, 0.1] };

// the glass, tinted (light on black times the tower's colour), cached per colour
const _tint = new Map();
export function glassTex(which, col) {
  const q = [col[0] & ~7, col[1] & ~7, col[2] & ~7], key = which + q.join(',');
  let c = _tint.get(key);
  if (!c) {
    const src = TEX[which];
    c = cpu(src.width, src.height); const x = c.getContext('2d');
    x.drawImage(src, 0, 0); x.globalCompositeOperation = 'multiply'; x.fillStyle = rgba(q); x.fillRect(0, 0, c.width, c.height);
    _tint.set(key, c);
  }
  return c;
}

// one triangle of the image (s0, s1, s2 in image px) onto the screen (d0, d1, d2), in the context's transform
function tri(c, img, s0, s1, s2, d0, d1, d2) {
  const den = (s1[0] - s0[0]) * (s2[1] - s0[1]) - (s2[0] - s0[0]) * (s1[1] - s0[1]);
  if (Math.abs(den) < 1e-6) return;
  const a = ((d1[0] - d0[0]) * (s2[1] - s0[1]) - (d2[0] - d0[0]) * (s1[1] - s0[1])) / den;
  const b = ((d1[1] - d0[1]) * (s2[1] - s0[1]) - (d2[1] - d0[1]) * (s1[1] - s0[1])) / den;
  const cc = ((d2[0] - d0[0]) * (s1[0] - s0[0]) - (d1[0] - d0[0]) * (s2[0] - s0[0])) / den;
  const d = ((d2[1] - d0[1]) * (s1[0] - s0[0]) - (d1[1] - d0[1]) * (s2[0] - s0[0])) / den;
  const e = d0[0] - a * s0[0] - cc * s0[1], f = d0[1] - b * s0[0] - d * s0[1];
  // grow the clip a hair so neighbouring triangles leave no seam
  const mx = (d0[0] + d1[0] + d2[0]) / 3, my = (d0[1] + d1[1] + d2[1]) / 3;
  const g = (p) => { const dx = p[0] - mx, dy = p[1] - my, l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * 0.6, p[1] + dy / l * 0.6]; };
  const [e0, e1, e2] = [g(d0), g(d1), g(d2)];
  c.save();
  c.beginPath(); c.moveTo(e0[0], e0[1]); c.lineTo(e1[0], e1[1]); c.lineTo(e2[0], e2[1]); c.closePath(); c.clip();
  c.transform(a, b, cc, d, e, f);
  c.drawImage(img, 0, 0);
  c.restore();
}
// a quad of the image (sx0..sx1, sy0..sy1 in px) onto four screen points (top-left, top-right, bottom-right,
// bottom-left), bilinear across an n x n grid
export function texQuad(c, img, src, q, n = 3) {
  const [sx0, sy0, sx1, sy1] = src;
  const P = (u, v) => [
    (q[0][0] * (1 - u) + q[1][0] * u) * (1 - v) + (q[3][0] * (1 - u) + q[2][0] * u) * v,
    (q[0][1] * (1 - u) + q[1][1] * u) * (1 - v) + (q[3][1] * (1 - u) + q[2][1] * u) * v,
  ];
  const S = (u, v) => [sx0 + (sx1 - sx0) * u, sy0 + (sy1 - sy0) * v];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const u0 = i / n, u1 = (i + 1) / n, v0 = j / n, v1 = (j + 1) / n;
    tri(c, img, S(u0, v0), S(u1, v0), S(u1, v1), P(u0, v0), P(u1, v0), P(u1, v1));
    tri(c, img, S(u0, v0), S(u1, v1), S(u0, v1), P(u0, v0), P(u1, v1), P(u0, v1));
  }
}
// a polygon fan: the image's points src[] (around centre sc) onto dst[] (around dc)
export function texFan(c, img, sc, src, dc, dst) {
  for (let k = 0; k < src.length; k++) {
    const k2 = (k + 1) % src.length;
    tri(c, img, sc, src[k], src[k2], dc, dst[k], dst[k2]);
  }
}
