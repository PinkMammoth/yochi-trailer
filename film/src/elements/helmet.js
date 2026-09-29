// Hooded players. Unit space: the hood's half-width ~1.02, the head centred at (0,0), +y down.
// The hood is the head: a structured technical hood that stands just off the head, peaks softly
// where its centre panel meets, and falls straight onto the shoulders (no neck, no shell). Each
// player's personality is cut into its pattern (cat, bear, horns, fin and frog shape the crown; the
// antenna is a toggle on it), never stuck on. The face opening tapers to where the hood's fronts
// cross at the throat, and frames the blade LED visor, which still does all the talking: dark glass
// in a satin bezel, the status lights set into its ends. Matte cloth everywhere (a two-step cel
// terminator that follows the silhouette, a soft kiss of the world's rim light); only the visor is
// glossy.
// (The module keeps its old name and API, so every shot, bust and crowd member wears the hood.)
const TAU2 = Math.PI * 2;
import { rgba, hexToRgb, clamp, lerp } from '../core/math.js';
import { composeFace, drawFaceGrid, drawTinyEyes } from './led.js';
import { logoPath } from './logo.js';

export const C = {
  void: '#07060c', s1: '#110f1a', s2: '#1a1828', s3: '#221f30',
  text: '#f5f3ff', muted: '#a8a2c8', faint: '#8d87b0',
  cyan: '#18e0ff', green: '#39ff14', red: '#ff3860', red2: '#ff004f',
  gold: '#ffc23a',
};
export const RGB = Object.fromEntries(Object.entries(C).map(([k, v]) => [k, hexToRgb(v)]));

// ---- geometry ------------------------------------------------------------------
// A closed, mirrored path from right-half cubic segments [c1x, c1y, c2x, c2y, x, y], drawn from
// (x0, y0) down the right side, across the bottom, and back up the left.
export function mirrorSub(c, x0, y0, segs) {
  c.moveTo(x0, y0);
  for (const s of segs) c.bezierCurveTo(s[0], s[1], s[2], s[3], s[4], s[5]);
  const last = segs[segs.length - 1];
  c.lineTo(-last[4], last[5]);
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i], px = i ? segs[i - 1][4] : x0, py = i ? segs[i - 1][5] : y0;
    c.bezierCurveTo(-s[2], s[3], -s[0], s[1], -px, py);
  }
  c.closePath();
}
// The part of a shape not covered by itself moved by (dx, dy): a band along the edges that face
// (-dx, -dy), as deep as the move, that follows the silhouette (cel terminators, rims). Filled
// inside a clip to the shape.
function crescent(c, sub, dx, dy) {
  c.beginPath(); c.rect(-5, -5, 10, 10);
  c.save(); c.translate(dx, dy); sub(c); c.restore();
  c.fill('evenodd');
}
const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3; };

const scl = (c, k) => [clamp(c[0] * k, 0, 255), clamp(c[1] * k, 0, 255), clamp(c[2] * k, 0, 255)];
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ---- the hood ------------------------------------------------------------------
// Right half of each silhouette, from the centre of the crown down to the base: the sides and the
// base are shared, the crown is where the personality lives. Cubic segments as in mirrorSub.
const SIDES = [
  [1.01, -0.47, 1.03, -0.16, 1.02, 0.14],      // temple to cheek: the hood stands just off the head
  [1.01, 0.44, 0.99, 0.7, 1.0, 0.9],           // it falls past the jaw rather than tucking under it
  [1.01, 1.02, 1.05, 1.1, 1.1, 1.16],          // and settles onto the shoulders
  [0.92, 1.26, 0.42, 1.38, 0, 1.4],            // its fronts curve down into the neckline
];
const CROWNS = {
  // a soft point where the three panels meet: sleek, a little ninja
  dome: { start: [0, -1.23], segs: [[0.3, -1.17, 0.88, -1.05, 0.97, -0.72]] },
  cat: { start: [0, -1.02], segs: [
    [0.1, -1.03, 0.2, -1.05, 0.28, -1.08],
    [0.38, -1.2, 0.5, -1.37, 0.6, -1.46],      // the ear's inner edge up to a clean point
    [0.72, -1.28, 0.93, -1.03, 0.97, -0.72],   // and down the outside into the temple
  ] },
  bear: { start: [0, -1.15], segs: [
    [0.2, -1.16, 0.34, -1.15, 0.42, -1.13],
    [0.4, -1.28, 0.53, -1.37, 0.67, -1.37],    // a rounded ear, stiff like a panel
    [0.83, -1.37, 0.93, -1.26, 0.9, -1.13],    // curving back in where it's set into the crown
    [0.94, -1.02, 0.97, -0.9, 0.97, -0.72],
  ] },
  horns: { start: [0, -1.17], segs: [
    [0.24, -1.15, 0.46, -1.1, 0.62, -1.02],
    [0.86, -1.06, 1.02, -1.22, 1.07, -1.45],   // the horn's inner curve sweeps out, then up to its tip
    [1.17, -1.29, 1.16, -0.98, 0.97, -0.74],   // its outer curve, full at the base
  ] },
  frog: { start: [0, -1.11], segs: [
    [0.08, -1.11, 0.16, -1.11, 0.22, -1.13],
    [0.24, -1.25, 0.36, -1.31, 0.47, -1.31],   // two low domes over the brow
    [0.6, -1.31, 0.7, -1.23, 0.69, -1.11],
    [0.82, -1.03, 0.93, -0.9, 0.97, -0.72],
  ] },
  fin: { start: [0, -1.57], segs: [
    [0.05, -1.56, 0.07, -1.32, 0.17, -1.2],    // a narrow crest along the centre panel
    [0.38, -1.13, 0.86, -1.04, 0.97, -0.72],
  ] },
};
CROWNS.antenna = CROWNS.dome;

// the crown turns with the head (the lower hood stays on the shoulders)
const crownShift = (yaw) => Math.sin(yaw * 0.9) * 0.24;
const shear = (dx) => (x, y) => [x + dx * clamp((-y - 0.6) / 0.6), y];

// the hood's base continues into the garment, so shading bands test against the hood extended
// down past the shoulders (its lower edge is a seam, not a silhouette)
const SIDES_OPEN = [...SIDES.slice(0, 3), [1.1, 2, 1.1, 3, 1.1, 4], [0.7, 4, 0.3, 4, 0, 4]];
function hoodSub(c, type, yaw, sides = SIDES) {
  const T = shear(crownShift(yaw));
  const cr = CROWNS[type] || CROWNS.dome;
  const segs = [...cr.segs, ...sides];
  const p0 = T(cr.start[0], cr.start[1]);
  c.moveTo(p0[0], p0[1]);
  for (const g of segs) { const a = T(g[0], g[1]), b = T(g[2], g[3]), e = T(g[4], g[5]); c.bezierCurveTo(a[0], a[1], b[0], b[1], e[0], e[1]); }
  for (let i = segs.length - 1; i >= 0; i--) {
    const g = segs[i], q = i ? segs[i - 1] : null;
    const px = q ? q[4] : cr.start[0], py = q ? q[5] : cr.start[1];
    const a = T(-g[2], g[3]), b = T(-g[0], g[1]), e = T(-px, py);
    c.bezierCurveTo(a[0], a[1], b[0], b[1], e[0], e[1]);
  }
  c.closePath();
}
function hoodPath(c, type, yaw) { c.beginPath(); hoodSub(c, type, yaw); }

// visor extents given yaw (radians) and pitch
export const VISOR_K = 0.86;             // the visor within the hood (the helmet's was 1)
export function visorBox(yaw = 0, pitch = 0) {
  const a = 1.0, k = VISOR_K * 0.97;
  const xl = Math.sin(clamp(-a + yaw, -1.5, 1.5)) * k, xr = Math.sin(clamp(a + yaw, -1.5, 1.5)) * k;
  const y0 = 0.1 - 0.45 * VISOR_K + pitch * 0.15, y1 = 0.1 + 0.45 * VISOR_K + pitch * 0.1;
  return { xl, xr, y0, y1 };
}
// The face opening, right half: an arch over the brow, the sides hugging the visor, and the hood's
// fronts closing in under it to a soft point where they cross at the throat.
function openingSegs(v, grow = 0) {
  const cx = (v.xl + v.xr) / 2, hw = (v.xr - v.xl) / 2 + grow, y0 = v.y0 - grow, y1 = v.y1 + grow;
  return { cx, top: y0 - 0.22, segs: [
    [cx + hw * 0.45, y0 - 0.22, cx + hw * 0.9, y0 - 0.2, cx + hw + 0.1, y0 - 0.06],
    [cx + hw + 0.19, y0 + 0.06, cx + hw + 0.2, y1 - 0.34, cx + hw + 0.12, y1 - 0.1],
    [cx + hw + 0.04, y1 + 0.12, cx + 0.3, y1 + 0.26, cx, y1 + 0.33],
  ] };
}
function openingSub(c, v, grow = 0) {
  const { cx, top, segs } = openingSegs(v, grow);
  const m = (x) => 2 * cx - x;
  c.moveTo(cx, top);
  for (const s of segs) c.bezierCurveTo(s[0], s[1], s[2], s[3], s[4], s[5]);
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i], px = i ? segs[i - 1][4] : cx, py = i ? segs[i - 1][5] : top;
    c.bezierCurveTo(m(s[2]), s[3], m(s[0]), s[1], m(px), py);
  }
  c.closePath();
}
function openingPath(c, v, grow = 0) { c.beginPath(); openingSub(c, v, grow); }
// a point on the lower edge of the opening (t along the fronts from the cheek to the throat)
function openingLow(v, t, sg) {
  const { cx, segs } = openingSegs(v);
  const a = segs[1], s = segs[2];
  const x = bez(a[4], s[0], s[2], s[4], t), y = bez(a[5], s[1], s[3], s[5], t);
  return [sg > 0 ? x : 2 * cx - x, y];
}
// Blade visor: swept outer points, a shallow brow V at the top, a small nose-bridge notch.
function visorPath(c, v, grow = 0) {
  const xl = v.xl - grow, xr = v.xr + grow, y0 = v.y0 - grow, y1 = v.y1 + grow;
  const cx = (xl + xr) / 2, w = xr - xl, h = y1 - y0;
  const dip = h * 0.12, tip = h * 0.36;
  c.beginPath();
  c.moveTo(xl + w * 0.06, y0);
  c.lineTo(cx - w * 0.12, y0 + dip * 0.35);
  c.lineTo(cx, y0 + dip);
  c.lineTo(cx + w * 0.12, y0 + dip * 0.35);
  c.lineTo(xr - w * 0.06, y0);
  c.lineTo(xr, y0 + tip);
  c.lineTo(xr - w * 0.035, y1 - h * 0.26);
  c.lineTo(xr - w * 0.17, y1);
  c.lineTo(cx + w * 0.07, y1);
  c.lineTo(cx, y1 - h * 0.035);
  c.lineTo(cx - w * 0.07, y1);
  c.lineTo(xl + w * 0.17, y1);
  c.lineTo(xl + w * 0.035, y1 - h * 0.26);
  c.lineTo(xl, y0 + tip);
  c.closePath();
}
function antennaTip(yaw) { const [x, y] = shear(crownShift(yaw))(0.56, -1.8); return [x, y]; }

// ---- hoodie bust -----------------------------------------------------------------
// The hood's base sits on dropped shoulders; full sleeves hang beside a straight, soft torso
// (a garment, not a shell).
const BUST = [
  [0.96, 1.12, 1.16, 1.22, 1.3, 1.36],     // shoulder slope from under the hood
  [1.42, 1.48, 1.5, 1.66, 1.52, 1.9],      // the dropped shoulder rounding into the sleeve
  [1.54, 2.5, 1.52, 3.2, 1.5, 3.95],       // sleeve, outer edge
];
// the same outline cut at the chest, for distant crowd silhouettes
const BUST_SHORT = [...BUST.slice(0, 2), [1.53, 2.1, 1.53, 2.25, 1.53, 2.4]];
function bustSub(c) { mirrorSub(c, 0.74, 1.04, BUST); }
function bustPath(c) { c.beginPath(); bustSub(c); }
// the torso between the sleeves: the dropped shoulder seam, the armpit, the side seam
const TORSO_EDGE = [
  [1.12, 1.3, 1.2, 1.42, 1.2, 1.56],
  [1.2, 1.8, 1.14, 2.05, 1.1, 2.26],
  [1.08, 2.8, 1.07, 3.4, 1.07, 3.95],
];
function torsoPanelPath(c) { c.beginPath(); mirrorSub(c, 1.1, 1.2, TORSO_EDGE); }

// the garment colour: dark shells become near-black cloth that keeps a trace of the player's hue
export function clothOf(shell) { return shell[0] > 150 ? shell : mix(shell, [15, 14, 22], 0.58); }
// fabric tones from the garment colour and the key light (matte: a gentle lift, no gloss)
function fabric(shell, key, fogF, amb = 0) {
  const light = shell[0] > 150;
  const kk = clamp(key.k, 0, 1);
  // dark cloth takes the key softly (the hood and the hoodie are one fabric, and it stays dark)
  const lit0 = light ? mix(shell, scl(mix(shell, key.col, 0.12), 1.0 + key.k * 0.18), kk) : scl(mix(shell, key.col, 0.12 * kk), 1.0 + key.k * 0.4);
  const shade0 = mix(scl(shell, light ? 0.6 : 0.42 + amb), light ? [70, 74, 104] : [10, 9, 18], light ? 0.28 : 0.3);
  return { light, lit0, shade0, lit: fogF(lit0), shade: fogF(shade0), half: fogF(mix(lit0, shade0, 0.5)) };
}
const unit = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };

/**
 * o: { x, y, s, type, shell (the hood's colour), accent, face, led, yaw, pitch, roll, key:{x,y,col,k}, rim:{x,y,col,k},
 *      amb, body:'bust'|null, ledI, fog, fogCol, stripes:'y' (YOU: the Yochi mark on the brow, lit piping)|null,
 *      status, cords (drawstring length; busts default to 1), visorGlow, noFace, tiny, showOff, mouthLed }
 */
export function drawHelmet(R, o) {
  const { b, g } = R;
  const s = o.s;
  const yaw = o.yaw || 0, pitch = o.pitch || 0;
  const shell = o.shell || [40, 38, 54];
  const type = o.type || 'dome';
  const key = { x: -0.55, y: -0.6, col: [190, 225, 255], k: 0.6, ...(o.key || {}) };
  const rim = { x: 0.8, y: -0.5, col: RGB.cyan, k: 1.0, ...(o.rim || {}) };
  const accent = typeof o.accent === 'string' ? hexToRgb(o.accent) : (o.accent || RGB.cyan);
  const led = typeof o.led === 'string' ? hexToRgb(o.led) : (o.led || RGB.cyan);
  const fog = o.fog || 0; const fogCol = o.fogCol || [20, 18, 34];
  const F = (c) => mix(c, fogCol, fog);
  const fk = 1 - fog;
  const fine = clamp((s - 55) / 25);    // detail that only reads when the head is big (faded in, no pop)
  const cloth = clothOf(shell);
  const fab = fabric(cloth, key, F, o.amb ?? 0.04);
  const { lit, shade, half } = fab;
  const plain = accent[0] === RGB.faint[0] && accent[1] === RGB.faint[1];   // crowd: no identity colour
  const you = o.stripes === 'y';
  const [kux, kuy] = unit(key.x, key.y), [rux, ruy] = unit(rim.x, rim.y);
  const hsub = (c) => hoodSub(c, type, yaw);
  const hcover = (c) => hoodSub(c, type, yaw, SIDES_OPEN);

  for (const c of [b, g]) { c.save(); c.translate(o.x, o.y); c.rotate(o.roll || 0); c.scale(s, s); }

  // ---- body -------------------------------------------------------------
  if (o.body === 'bust') drawBust(b, o, cloth, accent, key, rim, F, fk, plain, you);
  // the hood's weight on the shoulders: a soft contact shadow
  if (o.body === 'bust' || o.seat) {
    b.save(); b.translate(0, 0.06); hoodPath(b, type, yaw); b.restore();
    b.fillStyle = rgba(F([4, 3, 8]), 0.3); b.fill();
  }

  // occlusion: opaque parts block the emissive layer behind them
  g.fillStyle = rgba([0, 0, 0], 1 - fog * 0.6);
  g.beginPath();
  if (o.body === 'bust') bustSub(g);
  hsub(g);
  g.fill();

  // ---- the hood: matte cloth, a two-step cel terminator that follows the silhouette -----------
  const v = visorBox(yaw, pitch);
  const cxv = (v.xl + v.xr) / 2, hwv = (v.xr - v.xl) / 2;
  b.fillStyle = rgba(lit); hoodPath(b, type, yaw); b.fill();
  b.save(); hoodPath(b, type, yaw); b.clip();
  // cloth turns away from the light toward its edges (soft, no fresnel sheen)
  const soft = b.createRadialGradient(kux * 0.4, kuy * 0.4 - 0.1, 0.2, kux * 0.15, kuy * 0.15, 1.8);
  soft.addColorStop(0, 'rgba(0,0,0,0)'); soft.addColorStop(1, rgba(F(scl(cloth, 0.5)), 0.3));
  b.fillStyle = soft; b.fillRect(-2, -2, 4, 4);
  b.fillStyle = rgba(half); crescent(b, hcover, kux * 0.6, kuy * 0.6);
  b.fillStyle = rgba(shade); crescent(b, hcover, kux * 0.3, kuy * 0.3);
  // the base of the hood sits in its own shadow where it gathers onto the shoulders
  const nb = b.createLinearGradient(0, 0.9, 0, 1.4);
  nb.addColorStop(0, 'rgba(0,0,0,0)'); nb.addColorStop(1, rgba(F(scl(cloth, 0.45)), 0.2));
  b.fillStyle = nb; b.fillRect(-2, 0.9, 4, 0.6);
  // a soft sheen on the crown toward the key (technical cloth)
  const shx = kux * 0.42 + crownShift(yaw) * 0.6, shy = -0.8 + kuy * 0.1;
  const sh = b.createRadialGradient(shx, shy, 0.02, shx, shy, 0.72);
  sh.addColorStop(0, rgba(F(mix(lit, [255, 255, 255], 0.14)), (fab.light ? 0.3 : 0.24) * fk)); sh.addColorStop(1, 'rgba(0,0,0,0)');
  b.fillStyle = sh; b.fillRect(-1.5, -1.8, 3, 1.8);
  b.lineCap = 'round'; b.lineJoin = 'round';
  // the fronts cross over at the throat: the right front overlaps the left
  {
    const [xo, yo] = [cxv, v.y1 + 0.33];
    b.fillStyle = rgba(F(scl(cloth, 0.3)), 0.35);
    b.beginPath(); b.moveTo(xo, yo); b.bezierCurveTo(xo + 0.05, yo + 0.14, 0.18, 1.14, 0.3, 1.4); b.lineTo(0.16, 1.41); b.bezierCurveTo(0.1, 1.2, xo - 0.02, yo + 0.14, xo, yo); b.fill();
    b.strokeStyle = rgba(F(scl(cloth, 0.38)), 0.85); b.lineWidth = 0.026;
    b.beginPath(); b.moveTo(xo, yo); b.bezierCurveTo(xo + 0.05, yo + 0.14, 0.18, 1.14, 0.3, 1.4); b.stroke();
    b.strokeStyle = rgba(F(mix(lit, [255, 255, 255], 0.1)), 0.3 * fk); b.lineWidth = 0.012;
    b.beginPath(); b.moveTo(xo + 0.02, yo + 0.01); b.bezierCurveTo(xo + 0.07, yo + 0.15, 0.2, 1.14, 0.32, 1.4); b.stroke();
  }
  // folds: the cloth gathers from the face onto the shoulders
  if (s > 20) {
    b.strokeStyle = rgba(F(scl(cloth, 0.42)), 0.45); b.lineWidth = 0.024;
    b.beginPath();
    for (const sg of [-1, 1]) {
      const ox = cxv + sg * (hwv + 0.26);
      b.moveTo(ox, v.y0 + 0.2); b.bezierCurveTo(ox + sg * 0.04, v.y0 + 0.5, sg * 0.9, v.y1 + 0.2, sg * 0.97, 1.02);
      b.moveTo(cxv + sg * (hwv * 0.5), v.y1 + 0.4); b.quadraticCurveTo(sg * 0.66, 1.08, sg * 0.9, 1.18);
    }
    b.stroke();
    // and a catch of light along the key side of each fold
    b.strokeStyle = rgba(F(mix(lit, [255, 255, 255], 0.12)), 0.16 * fk * fine); b.lineWidth = 0.014;
    b.beginPath();
    for (const sg of [-1, 1]) { const ox = cxv + sg * (hwv + 0.26) - 0.02; b.moveTo(ox, v.y0 + 0.22); b.bezierCurveTo(ox + sg * 0.04, v.y0 + 0.52, sg * 0.9 - 0.02, v.y1 + 0.22, sg * 0.97 - 0.02, 1.02); }
    b.stroke();
  }
  // ear, horn and crest panels are set in with a seam
  if ((type === 'cat' || type === 'bear' || type === 'horns' || type === 'fin' || type === 'frog') && s > 20) {
    const T = shear(crownShift(yaw));
    const seam = (pts) => { const a = T(pts[0], pts[1]), c1 = T(pts[2], pts[3]), e = T(pts[4], pts[5]); b.moveTo(a[0], a[1]); b.quadraticCurveTo(c1[0], c1[1], e[0], e[1]); };
    b.strokeStyle = rgba(F(scl(cloth, 0.42)), 0.6); b.lineWidth = 0.02;
    b.beginPath();
    for (const sg of [-1, 1]) {
      if (type === 'cat') seam([sg * 0.3, -1.1, sg * 0.62, -1.18, sg * 0.95, -0.98]);
      else if (type === 'bear') seam([sg * 0.43, -1.14, sg * 0.66, -1.2, sg * 0.9, -1.13]);
      else if (type === 'horns') seam([sg * 0.72, -0.99, sg * 0.84, -0.9, sg * 0.97, -0.76]);
      else if (type === 'frog') seam([sg * 0.23, -1.14, sg * 0.46, -1.2, sg * 0.69, -1.12]);
    }
    if (type === 'fin') seam([0, -1.24, 0.005, -1.32, 0, -1.5]);
    b.stroke();
  }
  // YOU wears the Yochi mark on the brow of the hood, its stem pointing into the brow of the opening
  if (you) {
    const MARK_H = 0.24, k = MARK_H / 1.56;
    const lx = cxv, ly = v.y0 - 0.5;
    for (const [c, col, al] of [[b, F(accent), 1], [g, accent, 0.35 * fk]]) {
      c.save(); c.translate(lx, ly); c.scale(k * Math.max(0.25, Math.cos(yaw)), k);
      c.fillStyle = rgba(col, al); logoPath(c); c.fill();
      c.restore();
    }
  }
  b.restore();
  // the world's rim light along the edges that face it: a crisp line and a soft falloff
  b.save(); hoodPath(b, type, yaw); b.clip();
  b.globalCompositeOperation = 'lighter';
  const ra = rim.k * (1 - fog * 0.6);
  b.fillStyle = rgba(rim.col, 0.08 * ra); crescent(b, hsub, -rux * 0.16, -ruy * 0.16);
  b.fillStyle = rgba(rim.col, 0.3 * ra); crescent(b, hsub, -rux * Math.max(0.045, 1.1 / s), -ruy * Math.max(0.045, 1.1 / s));
  // the key side's edge turns away too: a faint lift so the far silhouette never disappears
  b.fillStyle = rgba(F(mix(lit, key.col, 0.3)), 0.12 * fk); crescent(b, hsub, -kux * 0.05, -kuy * 0.05);
  b.restore();
  if (rim.k > 0.2 && fog < 0.5) {
    g.save(); hoodPath(g, type, yaw); g.clip();
    g.fillStyle = rgba(rim.col, 0.12 * rim.k * fk); crescent(g, hsub, -rux * 0.06, -ruy * 0.06);
    g.restore();
  }
  // the antenna: a thin toggle rod out of the crown, a lit bead at its tip
  if (type === 'antenna') {
    const T = shear(crownShift(yaw));
    const a = T(0.34, -1.12), [ex, ey] = antennaTip(yaw);
    b.strokeStyle = rgba(F(scl(cloth, 0.8))); b.lineWidth = 0.045; b.lineCap = 'round';
    b.beginPath(); b.moveTo(a[0], a[1]); b.lineTo(ex, ey); b.stroke();
    b.strokeStyle = rgba(F(mix(lit, [255, 255, 255], 0.25)), 0.5 * fk); b.lineWidth = 0.016;
    b.beginPath(); b.moveTo(a[0] + 0.012, a[1]); b.lineTo(ex + 0.012, ey); b.stroke();
    b.fillStyle = rgba(scl(accent, 1.2)); b.beginPath(); b.arc(ex, ey, 0.07, 0, TAU2); b.fill();
    g.fillStyle = rgba(accent, 0.95 * fk); g.beginPath(); g.arc(ex, ey, 0.16, 0, TAU2); g.fill();
  }

  // ---- the face opening: a bound edge, the dark inside of the hood -----------------------
  const inner = F(fab.light ? [30, 30, 44] : [7, 6, 13]);
  b.fillStyle = rgba(inner); openingPath(b, v); b.fill();
  b.save(); openingPath(b, v); b.clip();
  const ig = b.createLinearGradient(0, v.y0 - 0.3, 0, v.y1 + 0.45);
  ig.addColorStop(0, 'rgba(0,0,0,0.8)'); ig.addColorStop(0.5, 'rgba(0,0,0,0)'); ig.addColorStop(1, rgba(F(scl(cloth, fab.light ? 0.5 : 0.85)), 0.4));
  b.fillStyle = ig; b.fillRect(-1.5, v.y0 - 0.5, 3, v.y1 - v.y0 + 1.2);
  // the hood's edge stands off the face: it shades the inside along its rim
  b.strokeStyle = 'rgba(0,0,0,0.5)'; b.lineWidth = 0.14; openingPath(b, v); b.stroke();
  b.restore();
  // the binding: a rolled edge that catches the key along its top and falls away underneath
  const bg = b.createLinearGradient(0, v.y0 - 0.25, 0, v.y1 + 0.38);
  bg.addColorStop(0, rgba(F(mix(lit, [255, 255, 255], fab.light ? 0.08 : 0.12)))); bg.addColorStop(0.55, rgba(F(mix(lit, shade, 0.5)))); bg.addColorStop(1, rgba(F(scl(shade, 0.9))));
  b.strokeStyle = bg; b.lineWidth = 0.09; openingPath(b, v); b.stroke();
  b.strokeStyle = rgba(F(scl(cloth, 0.28)), 0.9); b.lineWidth = 0.016; openingPath(b, v, -0.04); b.stroke();
  b.strokeStyle = rgba(F(mix(lit, [255, 255, 255], 0.2)), 0.22 * fk * fine); b.lineWidth = 0.012; openingPath(b, v, 0.03); b.stroke();
  if (you) {
    // YOU's opening is piped with a lit cyan line: the one face you can find in any crowd
    // (a fine line at any size: close up it's piping, not a neon tube)
    b.strokeStyle = rgba(F(mix(accent, [255, 255, 255], 0.3)), 0.95 * fk); b.lineWidth = Math.min(0.026, 6 / s);
    openingPath(b, v, 0.055); b.stroke();
    g.strokeStyle = rgba(accent, 0.45 * fk); g.lineWidth = Math.min(0.07, 16 / s); openingPath(g, v, 0.055); g.stroke();
  }

  // ---- visor: a blade of dark glass in a satin bezel -----------------------------------------
  const bezel = F(fab.light ? [34, 34, 48] : scl(mix(cloth, [60, 62, 84], 0.5), 0.55));
  b.fillStyle = rgba(bezel); visorPath(b, v, 0.075); b.fill();
  b.strokeStyle = rgba(F(mix(bezel, [255, 255, 255], 0.16)), 0.6 * fk); b.lineWidth = 0.016; visorPath(b, v, 0.075); b.stroke();
  const vGlass = b.createLinearGradient(0, v.y0, 0, v.y1);
  vGlass.addColorStop(0, rgba(F([14, 14, 26]))); vGlass.addColorStop(1, rgba(F([4, 4, 9])));
  b.fillStyle = vGlass; visorPath(b, v); b.fill();
  const ledI = o.ledI ?? 1;
  const cyv = (v.y0 + v.y1) / 2;
  b.save(); visorPath(b, v); b.clip();
  const sp = b.createRadialGradient(cxv, cyv, 0.05, cxv, cyv, 1.0);
  sp.addColorStop(0, rgba(led, 0.07 * ledI * fk)); sp.addColorStop(1, 'rgba(0,0,0,0)');
  b.fillStyle = sp; b.fillRect(-1.2, -1, 2.4, 2);
  b.restore();
  if (o.face && !o.noFace) {
    const ix = 0.1, iy = 0.07;
    const box = { x: v.xl + ix, y: v.y0 + iy, w: (v.xr - v.xl) - ix * 2, h: (v.y1 - v.y0) - iy * 2 };
    if (s * box.w > 55 && !o.tiny) {
      drawFaceGrid(R, composeFace(o.face), { ...box, color: led, mouthColor: o.mouthLed || led, intensity: ledI * (1 - fog * 0.5), showOff: o.showOff });
    } else {
      drawTinyEyes(R, cxv + (o.face.lookX || 0) * 0.02, v.y0 + (v.y1 - v.y0) * 0.42 + (o.face.lookY || 0) * 0.03, (v.xr - v.xl) * 0.9, (v.y1 - v.y0) * 0.55, led, o.face.eyes || o.face.eyeL, ledI * (1 - fog * 0.4));
    }
  }
  b.save(); visorPath(b, v); b.clip();
  // the hood's brow shades the top of the glass
  const bs = b.createLinearGradient(0, v.y0, 0, v.y0 + 0.22);
  bs.addColorStop(0, 'rgba(0,0,0,0.7)'); bs.addColorStop(1, 'rgba(0,0,0,0)');
  b.fillStyle = bs; b.fillRect(-1.2, v.y0 - 0.05, 2.4, 0.3);
  b.globalCompositeOperation = 'lighter';
  // glass depth: a soft sky reflection across the upper glass with a crisp horizon edge
  if (fine > 0) {
    const hz = v.y0 + (v.y1 - v.y0) * 0.3;
    const sky = b.createLinearGradient(0, v.y0, 0, hz);
    sky.addColorStop(0, 'rgba(0,0,0,0)'); sky.addColorStop(1, `rgba(150,170,230,${0.05 * fk * fine})`);
    b.fillStyle = sky; b.beginPath(); b.moveTo(-1.2, v.y0 - 0.1); b.lineTo(1.2, v.y0 - 0.1); b.lineTo(1.2, hz - 0.05); b.quadraticCurveTo(0, hz + 0.07, -1.2, hz - 0.05); b.closePath(); b.fill();
  }
  const band = b.createLinearGradient(v.xl, v.y0, v.xl + 1.0, v.y0 + 1.0);
  band.addColorStop(0, 'rgba(255,255,255,0)'); band.addColorStop(0.3, 'rgba(255,255,255,0)');
  band.addColorStop(0.36, `rgba(220,235,255,${0.09 * fk})`); band.addColorStop(0.46, 'rgba(255,255,255,0)');
  b.fillStyle = band; b.fillRect(-1.2, -1, 2.4, 2);
  b.restore();
  {
    const w = v.xr - v.xl, cx = cxv;
    // glass lower lip
    b.strokeStyle = rgba([200, 215, 255], 0.16 * fk); b.lineWidth = 0.016;
    b.beginPath(); b.moveTo(v.xl + w * 0.17, v.y1 - 0.012); b.lineTo(cx - w * 0.07, v.y1 - 0.012); b.moveTo(cx + w * 0.07, v.y1 - 0.012); b.lineTo(v.xr - w * 0.17, v.y1 - 0.012); b.stroke();
    // identity trim: a thin accent LED strip set into the bezel under the glass
    b.strokeStyle = rgba(F(accent), 0.85 * fk); b.lineWidth = 0.028;
    b.beginPath(); b.moveTo(v.xl + w * 0.2, v.y1 + 0.036); b.lineTo(cx - w * 0.08, v.y1 + 0.036); b.moveTo(cx + w * 0.08, v.y1 + 0.036); b.lineTo(v.xr - w * 0.2, v.y1 + 0.036); b.stroke();
    g.strokeStyle = rgba(accent, 0.45 * fk); g.lineWidth = 0.05;
    g.beginPath(); g.moveTo(v.xl + w * 0.2, v.y1 + 0.036); g.lineTo(cx - w * 0.08, v.y1 + 0.036); g.moveTo(cx + w * 0.08, v.y1 + 0.036); g.lineTo(v.xr - w * 0.2, v.y1 + 0.036); g.stroke();
  }
  // status lights: slits set into the ends of the bezel, lit with the pick
  if (o.status) {
    const sc = typeof o.status === 'string' ? hexToRgb(o.status) : o.status;
    const h = v.y1 - v.y0, ya = v.y0 + h * 0.24, yb = v.y0 + h * 0.5;
    for (const sg of [-1, 1]) {
      const ang = sg * 1.0 + yaw;
      const ca = Math.cos(ang);
      if (ca < 0.1) continue;
      const ex = (sg > 0 ? v.xr : v.xl) + sg * 0.035, w = 0.014 + 0.016 * ca;
      b.fillStyle = rgba(scl(sc, 1.3)); b.fillRect(ex - w, ya, w * 2, yb - ya);
      g.fillStyle = rgba(sc, 0.8 * fk); g.fillRect(ex - w * 2.6, ya - 0.04, w * 5.2, yb - ya + 0.08);
    }
  }
  // wide shots: the visor reads as a lit bar in the pick colour from across the arena (w in px)
  const vgk = o.visorGlow ? clamp((60 - s) / 30) : 0; // only small (distant) heads need it
  if (vgk > 0) {
    g.strokeStyle = rgba(led, (o.visorGlow.a ?? 0.85) * vgk * fk); g.lineWidth = o.visorGlow.w / s; g.lineJoin = 'miter';
    visorPath(g, v); g.stroke();
  }

  // ---- drawstrings: out of eyelets in the hood's fronts, down the chest ----------------------
  const cords = o.cords ?? (o.body === 'bust' ? 1.0 : 0);
  if (cords > 0 && s * 0.05 > 1.2) {
    const cordCol = F(fab.light ? scl(cloth, 0.82) : mix(scl(cloth, 1.8), [200, 200, 220], 0.16));
    const tipCol = F(plain ? [150, 148, 168] : accent);
    for (const sg of [-1, 1]) {
      const [x0, y0] = openingLow(v, 0.42, sg);
      const x1 = x0 - sg * 0.04, y1 = y0 + cords;
      const sway = sg * 0.06;
      b.strokeStyle = rgba(F(scl(cloth, 0.3)), 0.5); b.lineWidth = 0.05; b.lineCap = 'round';
      b.beginPath(); b.moveTo(x0 + 0.02, y0 + 0.03); b.quadraticCurveTo(x0 + sway + 0.02, (y0 + y1) / 2 + 0.03, x1 + 0.02, y1 + 0.03); b.stroke();
      b.strokeStyle = rgba(cordCol); b.lineWidth = 0.034;
      b.beginPath(); b.moveTo(x0, y0); b.quadraticCurveTo(x0 + sway, (y0 + y1) / 2, x1, y1); b.stroke();
      // the eyelet and the aglet
      b.fillStyle = rgba(F(scl(cloth, 0.3))); b.beginPath(); b.arc(x0, y0, 0.036, 0, TAU2); b.fill();
      b.strokeStyle = rgba(F(mix(lit, [255, 255, 255], 0.2)), 0.35 * fk); b.lineWidth = 0.01; b.beginPath(); b.arc(x0, y0, 0.036, Math.PI, Math.PI * 1.9); b.stroke();
      b.fillStyle = rgba(tipCol, fk); b.fillRect(x1 - 0.026, y1 - 0.02, 0.052, 0.13);
      if (you) { g.fillStyle = rgba(accent, 0.5 * fk); g.fillRect(x1 - 0.05, y1 - 0.03, 0.1, 0.18); }
    }
    b.lineCap = 'butt';
  }

  for (const c of [b, g]) c.restore();
  return v;
}

// Bust shading, in head unit space (already transformed). The hoodie is the hood's garment: same cloth.
function drawBust(b, o, shell, accent, key, rim, F, fk, plain, you) {
  const cloth = shell;
  const light = shell[0] > 150;
  const litSide = key.x <= 0 ? -1 : 1;
  const lift = mix(cloth, key.col, 0.05);
  const dk = (k) => F(light ? mix(scl(cloth, k + 0.2), [80, 84, 110], 0.25) : scl(cloth, k));
  const [rux, ruy] = unit(rim.x, rim.y);
  b.fillStyle = rgba(F(cloth)); bustPath(b); b.fill();
  b.save(); bustPath(b); b.clip();
  // sleeves: the one toward the key catches it, the other falls away
  const ag = b.createLinearGradient(-1.6, 0, 1.6, 0);
  ag.addColorStop(0, rgba(litSide < 0 ? F(scl(lift, 1.18)) : dk(0.58)));
  ag.addColorStop(0.5, rgba(F(cloth)));
  ag.addColorStop(1, rgba(litSide > 0 ? F(scl(lift, 1.18)) : dk(0.58)));
  b.fillStyle = ag; b.fillRect(-1.8, 0.8, 3.6, 3.4);
  // torso: the chest faces the light, the stomach turns away from it
  const tg = b.createLinearGradient(0, 1.2, 0, 3.9);
  tg.addColorStop(0, rgba(F(scl(lift, 1.2)))); tg.addColorStop(0.55, rgba(F(cloth))); tg.addColorStop(1, rgba(dk(0.74)));
  b.fillStyle = tg; torsoPanelPath(b); b.fill();
  // cel shade: the side away from the key light
  b.fillStyle = rgba(dk(0.56), 0.9);
  b.beginPath(); b.rect(-2.5, 0.5, 5, 3.8); b.ellipse(key.x * 0.9, 2.3, 1.8, 2.0, 0, 0, TAU2); b.fill('evenodd');
  // the dropped shoulder seams and the arm creases, folds under the arms
  b.lineJoin = 'round'; b.lineCap = 'round';
  b.strokeStyle = rgba(dk(0.36), 0.75); b.lineWidth = 0.034;
  b.beginPath();
  for (const sg of [-1, 1]) { b.moveTo(sg * 1.06, 1.24); b.bezierCurveTo(sg * 1.14, 1.32, sg * 1.2, 1.42, sg * 1.2, 1.56); b.bezierCurveTo(sg * 1.2, 1.8, sg * 1.14, 2.05, sg * 1.1, 2.26); b.bezierCurveTo(sg * 1.08, 2.8, sg * 1.07, 3.4, sg * 1.07, 3.95); }
  b.stroke();
  b.strokeStyle = rgba(dk(0.4), 0.45); b.lineWidth = 0.028;
  b.beginPath();
  for (const sg of [-1, 1]) { b.moveTo(sg * 1.08, 2.34); b.quadraticCurveTo(sg * 0.92, 2.5, sg * 0.76, 2.56); b.moveTo(sg * 1.36, 2.7); b.quadraticCurveTo(sg * 1.3, 3.0, sg * 1.33, 3.3); }
  b.stroke();
  for (const sg of [-1, 1]) {
    b.strokeStyle = rgba(F(mix(scl(cloth, light ? 1.08 : 1.8), key.col, 0.25)), sg === litSide ? 0.5 : 0.16); b.lineWidth = 0.04;
    b.beginPath(); b.moveTo(sg * 1.14, 1.3); b.bezierCurveTo(sg * 1.3, 1.4, sg * 1.42, 1.54, sg * 1.48, 1.78); b.stroke();
  }
  // a small Yochi mark on the chest: YOU's in cyan, the named players' in their colour, the crowd's tonal
  const mk = 0.3 / 1.56, mx = 0, my = 2.2;
  b.save(); b.translate(mx, my); b.scale(mk, mk);
  b.fillStyle = plain ? rgba(F(scl(cloth, light ? 0.8 : 1.7)), 0.55) : rgba(F(accent), 0.9 * fk); logoPath(b); b.fill();
  b.restore();
  // the kangaroo pocket's top edge, low on the frame
  b.strokeStyle = rgba(dk(0.4), 0.6); b.lineWidth = 0.03;
  b.beginPath(); b.moveTo(-0.95, 3.72); b.lineTo(-0.7, 3.4); b.lineTo(0.7, 3.4); b.lineTo(0.95, 3.72); b.stroke();
  // rim along the shoulders: the edges that face the world's light
  b.globalCompositeOperation = 'lighter';
  b.fillStyle = rgba(rim.col, 0.26 * rim.k * fk); crescent(b, bustSub, -rux * 0.06, -ruy * 0.06);
  b.fillStyle = rgba(rim.col, 0.07 * rim.k * fk); crescent(b, bustSub, -rux * 0.18, -ruy * 0.18);
  b.restore();
}

// Fast silhouette for crowds (shoulders and the hood as one path).
export function crowdSilhouette(c, type) {
  c.beginPath();
  mirrorSub(c, 0.74, 1.04, BUST_SHORT);
  hoodSub(c, type || 'dome', 0);
}
// The rim band along the top of a crowd member's hood (w: its depth in head units), in the current
// fill style.
export function crowdRim(c, type, w) {
  c.save(); hoodPath(c, type || 'dome', 0); c.clip();
  crescent(c, (cc) => hoodSub(cc, type || 'dome', 0), 0, w);
  c.restore();
}

// Back view of a player: a backlit silhouette (the back of the hood, its panel seams).
// o: { x, y, s, type, shell, accent, stripes, rim:{col,k}, rimDir, rimSide, led, ledK, fog, fogCol, body, roll }
export function drawHelmetBack(R, o) {
  const { b, g } = R;
  const s = o.s;
  const fog = o.fog || 0; const fogCol = o.fogCol || [20, 18, 34];
  const rim = o.rim || { col: [230, 245, 255], k: 1 };
  const shell = o.shell || [40, 38, 54];
  const light = shell[0] > 150;
  const type = o.type || 'dome';
  const you = o.stripes === 'y';
  const hsub = (c) => hoodSub(c, type, 0);
  const sil = mix(light ? [70, 70, 84] : [6, 5, 11], fogCol, fog);
  for (const c of [b, g]) { c.save(); c.translate(o.x, o.y); c.rotate(o.roll || 0); c.scale(s, s); }
  g.fillStyle = rgba([0, 0, 0], 1 - fog * 0.6);
  hoodPath(g, type, 0); g.fill();
  b.fillStyle = rgba(sil);
  if (o.body !== false) { bustPath(b); b.fill(); }
  hoodPath(b, type, 0); b.fill();
  const rk = clamp(rim.k * (o.rimDir ?? 1) * (1 - fog * 0.9), 0, 1.2);
  if (rk > 0.02) {
    const side = o.rimSide || 0;
    // the light is behind the player: it catches the top of the hood, more on the side it's on
    const w = Math.max(0.07, 1.1 / s);
    const [dx, dy] = unit(-side * 0.6, 1);
    b.save(); hoodPath(b, type, 0); b.clip();
    b.fillStyle = rgba(rim.col, rk * 0.5); crescent(b, hsub, dx * w, dy * w);
    // the centre panel's seams run down the back of the hood
    if (s > 14) { b.strokeStyle = rgba(mix(sil, rim.col, 0.25), 0.5 * rk); b.lineWidth = 0.03; b.beginPath(); b.moveTo(-0.2, -1.1); b.quadraticCurveTo(-0.24, 0.1, -0.16, 1.1); b.moveTo(0.2, -1.1); b.quadraticCurveTo(0.24, 0.1, 0.16, 1.1); b.stroke(); }
    b.restore();
    g.save(); hoodPath(g, type, 0); g.clip();
    g.fillStyle = rgba(rim.col, rk * 0.3); crescent(g, hsub, dx * w * 1.6, dy * w * 1.6);
    g.restore();
  }
  // YOU's hood is piped down its centre seam: findable from behind
  if (you) {
    const ac = o.accent ? (typeof o.accent === 'string' ? hexToRgb(o.accent) : o.accent) : RGB.cyan;
    const ak = 1 - fog * 0.7;
    b.strokeStyle = rgba(mix(ac, [255, 255, 255], 0.3), 0.9 * ak); b.lineWidth = Math.max(0.035, 0.9 / s);
    b.beginPath(); b.moveTo(0, -1.24); b.quadraticCurveTo(0.02, 0.1, 0, 1.2); b.stroke();
    g.strokeStyle = rgba(ac, 0.6 * ak); g.lineWidth = Math.max(0.09, 2.2 / s);
    g.beginPath(); g.moveTo(0, -1.24); g.quadraticCurveTo(0.02, 0.1, 0, 1.2); g.stroke();
  }
  // the visor's light spills round the sides of the hood
  if (o.led && (o.ledK ?? 1) > 0) {
    const lk = (o.ledK ?? 1) * (1 - fog * 0.5);
    for (const sg of [-1, 1]) {
      b.fillStyle = rgba(scl(o.led, 1.2), lk * 0.4); b.fillRect(sg * 1.0 - 0.03, -0.1, 0.06, 0.3);
      g.fillStyle = rgba(o.led, 0.3 * lk); g.fillRect(sg * 1.0 - 0.1, -0.16, 0.2, 0.42);
    }
  }
  for (const c of [b, g]) c.restore();
}
