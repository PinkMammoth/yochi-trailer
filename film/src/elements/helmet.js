// Helmeted players. Unit space: head half-width ~0.95, centred at (0,0), +y down.
// Look: sculpted lacquer shells (lower crown, brow line, tapered jaw, panel seams),
// blade LED visors with a slight brow V, rim light from the world's cyan backlight,
// key light from the candle.
const TAU2 = Math.PI * 2;
import { rgba, hexToRgb, clamp, lerp } from '../core/math.js';
import { composeFace, drawFaceGrid, drawTinyEyes } from './led.js';

export const C = {
  void: '#07060c', s1: '#110f1a', s2: '#1a1828', s3: '#221f30',
  text: '#f5f3ff', muted: '#a8a2c8', faint: '#8d87b0',
  cyan: '#18e0ff', green: '#39ff14', red: '#ff3860', red2: '#ff004f',
  gold: '#ffc23a',
};
export const RGB = Object.fromEntries(Object.entries(C).map(([k, v]) => [k, hexToRgb(v)]));

// ---- geometry ------------------------------------------------------------------
// Shell: lower-profile crown, straight flanks, jaw sweeping into a chin guard.
function shellSub(c) {
  c.moveTo(0, -0.9);
  c.bezierCurveTo(0.58, -0.9, 0.94, -0.62, 0.95, -0.1);
  c.bezierCurveTo(0.955, 0.2, 0.93, 0.42, 0.86, 0.6);
  c.bezierCurveTo(0.76, 0.82, 0.55, 0.97, 0.3, 1.02);
  c.lineTo(0, 1.07);
  c.lineTo(-0.3, 1.02);
  c.bezierCurveTo(-0.55, 0.97, -0.76, 0.82, -0.86, 0.6);
  c.bezierCurveTo(-0.93, 0.42, -0.955, 0.2, -0.95, -0.1);
  c.bezierCurveTo(-0.94, -0.62, -0.58, -0.9, 0, -0.9);
  c.closePath();
}
export function shellPath(c) { c.beginPath(); shellSub(c); }

// visor extents given yaw (radians) and pitch
export function visorBox(yaw = 0, pitch = 0) {
  const a = 1.0;
  const xl = Math.sin(clamp(-a + yaw, -1.5, 1.5)) * 0.97, xr = Math.sin(clamp(a + yaw, -1.5, 1.5)) * 0.97;
  const y0 = -0.35 + pitch * 0.15, y1 = 0.55 + pitch * 0.1;
  return { xl, xr, y0, y1 };
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

const scl = (c, k) => [clamp(c[0] * k, 0, 255), clamp(c[1] * k, 0, 255), clamp(c[2] * k, 0, 255)];
const mul = (a, b) => [a[0] * b[0] / 255, a[1] * b[1] / 255, a[2] * b[2] / 255];
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// point on the crown at angle phi from the top (yaw rotates it around the head)
function crownPt(phi, yaw, inset = 0) {
  const ang = phi + yaw * 0.9;
  return { x: Math.sin(ang) * (0.95 - inset), y: -Math.cos(phi) * (0.9 - inset), vis: Math.cos(ang) > -0.3 };
}
// Sculpted accessories (subpaths only).
function accessorySub(c, type, yaw) {
  if (type === 'bear') {
    // broad, flat-topped ear fins: reads bear, not plush, not cat
    for (const s of [-1, 1]) {
      const a = crownPt(s * 0.4, yaw, 0.07), b = crownPt(s * 0.94, yaw, 0.07);
      if (!a.vis && !b.vis) continue;
      const k = Math.cos(yaw * 0.9);
      const t1x = a.x + s * 0.02 * k, t1y = a.y - 0.3, t2x = b.x + s * 0.06 * k, t2y = b.y - 0.34;
      c.moveTo(a.x, a.y);
      c.lineTo(t1x, t1y);
      c.quadraticCurveTo((t1x + t2x) / 2 + s * 0.04, Math.min(t1y, t2y) - 0.12, t2x, t2y);
      c.lineTo(b.x, b.y);
      c.closePath();
    }
  } else if (type === 'cat') {
    for (const s of [-1, 1]) {
      const a = crownPt(s * 0.3, yaw, 0.05), b = crownPt(s * 0.74, yaw, 0.05);
      if (!a.vis && !b.vis) continue;
      const tx = (a.x + b.x) / 2 + s * 0.16 * Math.cos(yaw * 0.9), ty = Math.min(a.y, b.y) - 0.62;
      c.moveTo(a.x, a.y); c.lineTo(tx, ty); c.lineTo(b.x, b.y); c.closePath();
    }
  } else if (type === 'horns') {
    for (const s of [-1, 1]) {
      const p = crownPt(s * 1.12, yaw, 0.02); if (!p.vis) continue;
      c.moveTo(p.x - s * 0.02, p.y + 0.12);
      c.bezierCurveTo(p.x + s * 0.42, p.y + 0.04, p.x + s * 0.58, p.y - 0.34, p.x + s * 0.5, p.y - 0.78);
      c.bezierCurveTo(p.x + s * 0.36, p.y - 0.38, p.x + s * 0.16, p.y - 0.16, p.x - s * 0.06, p.y - 0.12);
      c.closePath();
    }
  } else if (type === 'frog') {
    // twin low-profile sensor pods
    for (const s of [-1, 1]) {
      const p = crownPt(s * 0.5, yaw, 0.02); if (!p.vis) continue;
      const w = 0.3 * (0.35 + 0.65 * Math.abs(Math.cos(s * 0.5 + yaw * 0.9)));
      c.moveTo(p.x - w, p.y + 0.06);
      c.lineTo(p.x - w * 0.7, p.y - 0.14);
      c.lineTo(p.x + w * 0.7, p.y - 0.18);
      c.lineTo(p.x + w, p.y + 0.02);
      c.closePath();
    }
  } else if (type === 'fin') {
    const o = Math.sin(yaw * 0.9) * 0.9;
    c.moveTo(-0.14 + o, -0.88);
    c.lineTo(0.02 + o, -1.36);
    c.lineTo(0.32 + o, -1.26);
    c.lineTo(0.26 + o, -0.86);
    c.closePath();
  } else if (type === 'antenna') {
    const p = crownPt(0.52, yaw, 0.04);
    c.moveTo(p.x - 0.05, p.y + 0.04);
    c.lineTo(p.x + 0.2, p.y - 0.66);
    c.lineTo(p.x + 0.25, p.y - 0.64);
    c.lineTo(p.x + 0.05, p.y + 0.06);
    c.closePath();
  }
}
function accessoryPaths(c, type, yaw) { c.beginPath(); accessorySub(c, type, yaw); }
// centre lines of the fins (for the accent inlay)
function accessorySpines(c, type, yaw) {
  if (type === 'bear' || type === 'cat') {
    const [p0, p1, rise, out] = type === 'bear' ? [0.4, 0.94, 0.3, 0.04] : [0.3, 0.74, 0.62, 0.16];
    for (const s of [-1, 1]) {
      const a = crownPt(s * p0, yaw, 0.06), b2 = crownPt(s * p1, yaw, 0.06);
      if (!a.vis && !b2.vis) continue;
      const tx = (a.x + b2.x) / 2 + s * out * Math.cos(yaw * 0.9), ty = Math.min(a.y, b2.y) - rise;
      const mx = (a.x + b2.x) / 2, my = (a.y + b2.y) / 2;
      c.moveTo(mx, my + 0.02); c.lineTo(lerp(mx, tx, 0.78), lerp(my, ty, 0.78));
    }
  } else if (type === 'fin') {
    const o = Math.sin(yaw * 0.9) * 0.9;
    c.moveTo(0.06 + o, -0.88); c.lineTo(0.13 + o, -1.24);
  }
}
function antennaTip(yaw) { const p = crownPt(0.52, yaw, 0.04); return [p.x + 0.225, p.y - 0.68]; }

// Suit bust: collar seal, sloped trapezius, firm shoulder caps.
function bustSub(c) {
  c.moveTo(-0.4, 0.94);
  c.lineTo(-0.44, 1.2);
  c.bezierCurveTo(-0.78, 1.24, -1.1, 1.3, -1.34, 1.42);
  c.bezierCurveTo(-1.52, 1.5, -1.68, 1.62, -1.74, 1.86);
  c.lineTo(-1.8, 3.9);
  c.lineTo(1.8, 3.9);
  c.lineTo(1.74, 1.86);
  c.bezierCurveTo(1.68, 1.62, 1.52, 1.5, 1.34, 1.42);
  c.bezierCurveTo(1.1, 1.3, 0.78, 1.24, 0.44, 1.2);
  c.lineTo(0.4, 0.94);
  c.closePath();
}
function bustPath(c) { c.beginPath(); bustSub(c); }

/**
 * o: { x, y, s, type, shell, accent, face, led, yaw, pitch, roll, key:{x,y,col,k}, rim:{x,y,col,k},
 *      amb, body:'bust'|null, ledI, fog, fogCol, stripes:'y'|'one'|null, status, bodyCol, gloss }
 */
export function drawHelmet(R, o) {
  const { b, g } = R;
  const s = o.s;
  const yaw = o.yaw || 0, pitch = o.pitch || 0;
  const shell = o.shell || [40, 38, 54];
  const key = { x: -0.55, y: -0.6, col: [190, 225, 255], k: 0.6, ...(o.key || {}) };
  const rim = { x: 0.8, y: -0.5, col: RGB.cyan, k: 1.0, ...(o.rim || {}) };
  const accent = typeof o.accent === 'string' ? hexToRgb(o.accent) : (o.accent || RGB.cyan);
  const led = typeof o.led === 'string' ? hexToRgb(o.led) : (o.led || RGB.cyan);
  const fog = o.fog || 0; const fogCol = o.fogCol || [20, 18, 34];
  const F = (c) => mix(c, fogCol, fog);
  const fk = 1 - fog;
  const pearl = shell[0] > 150;
  const lit = F(mix(shell, scl(mix(shell, key.col, pearl ? 0.18 : 0.26), 1.0 + key.k * (pearl ? 0.35 : 0.85)), clamp(key.k, 0, 1)));
  const shade = F(mix(scl(shell, pearl ? 0.5 : 0.38 + (o.amb ?? 0.05)), [12, 10, 22], pearl ? 0.25 : 0.4));
  const seam = F(scl(shell, pearl ? 0.62 : 0.55));
  const edge = F(mix(scl(shell, pearl ? 1.08 : 2.2), key.col, pearl ? 0.1 : 0.3));

  for (const c of [b, g]) { c.save(); c.translate(o.x, o.y); c.rotate(o.roll || 0); c.scale(s, s); }

  // ---- body -------------------------------------------------------------
  if (o.body === 'bust') {
    const bodyCol = o.bodyCol || [30, 28, 42];
    b.fillStyle = rgba(F(bodyCol)); bustPath(b); b.fill();
    b.save(); bustPath(b); b.clip();
    // cel shade: the side away from the key light
    b.fillStyle = rgba(F(scl(bodyCol, 0.55)));
    b.beginPath(); b.rect(-2.5, 0.5, 5, 3.6); b.ellipse(key.x * 1.0, 2.1, 2.0, 1.75, 0, 0, TAU2); b.fill('evenodd');
    // arms read as separate masses: seam + slightly darker sleeve
    b.fillStyle = rgba(F(scl(bodyCol, 0.78)));
    for (const sg of [-1, 1]) { b.beginPath(); b.moveTo(sg * 1.3, 1.46); b.bezierCurveTo(sg * 1.2, 2.1, sg * 1.28, 3.0, sg * 1.34, 3.9); b.lineTo(sg * 1.9, 3.9); b.lineTo(sg * 1.8, 1.8); b.closePath(); b.fill(); }
    // shoulder plates
    for (const sg of [-1, 1]) {
      b.fillStyle = rgba(F(scl(bodyCol, 1.35)));
      b.beginPath(); b.moveTo(sg * 1.0, 1.36); b.bezierCurveTo(sg * 1.42, 1.34, sg * 1.72, 1.56, sg * 1.78, 1.96); b.lineTo(sg * 1.5, 2.02); b.bezierCurveTo(sg * 1.42, 1.72, sg * 1.26, 1.56, sg * 0.96, 1.5); b.closePath(); b.fill();
    }
    // yoke seam + accent piping, sternum seam
    b.lineJoin = 'miter';
    b.strokeStyle = rgba(F(scl(bodyCol, 0.42)), 0.95); b.lineWidth = 0.045;
    b.beginPath(); b.moveTo(-1.26, 1.56); b.lineTo(-0.32, 2.2); b.lineTo(0, 2.42); b.lineTo(0.32, 2.2); b.lineTo(1.26, 1.56); b.stroke();
    b.beginPath(); b.moveTo(0, 2.42); b.lineTo(0, 3.9); b.stroke();
    b.strokeStyle = rgba(F(accent), 0.55 * fk); b.lineWidth = 0.026;
    b.beginPath(); b.moveTo(-1.24, 1.63); b.lineTo(-0.32, 2.27); b.lineTo(0, 2.49); b.lineTo(0.32, 2.27); b.lineTo(1.24, 1.63); b.stroke();
    // rim along the shoulder line
    const rg = b.createLinearGradient(-rim.x * 2.2, -rim.y, rim.x * 2.2, rim.y);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(0.6, 'rgba(0,0,0,0)'); rg.addColorStop(1, rgba(rim.col, 0.85 * rim.k * fk));
    b.globalCompositeOperation = 'lighter'; b.strokeStyle = rg; b.lineWidth = 0.12; bustPath(b); b.stroke();
    b.restore();
    // collar seal
    b.fillStyle = rgba(F(scl(shell, pearl ? 0.35 : 0.7)));
    b.beginPath(); b.moveTo(-0.46, 0.92); b.lineTo(0.46, 0.92); b.lineTo(0.5, 1.2); b.quadraticCurveTo(0, 1.3, -0.5, 1.2); b.closePath(); b.fill();
    b.strokeStyle = rgba(F(accent), 0.7 * fk); b.lineWidth = 0.03;
    b.beginPath(); b.moveTo(-0.49, 1.12); b.quadraticCurveTo(0, 1.21, 0.49, 1.12); b.stroke();
  }

  // occlusion: opaque parts block the emissive layer behind them
  g.fillStyle = rgba([0, 0, 0], 1 - fog * 0.6);
  g.beginPath();
  if (o.body === 'bust') bustSub(g);
  if (o.type && o.type !== 'dome') accessorySub(g, o.type, yaw);
  shellSub(g);
  g.fill();

  // ---- accessories ----------------------------------------------------------
  if (o.type && o.type !== 'dome') {
    b.fillStyle = rgba(lit); accessoryPaths(b, o.type, yaw); b.fill();
    b.save(); accessoryPaths(b, o.type, yaw); b.clip();
    b.fillStyle = rgba(shade); b.beginPath(); b.rect(-2, -2, 4, 4); b.arc(key.x * 0.55, key.y * 0.5 - 0.3, 1.2, 0, TAU2); b.fill('evenodd');
    const rg = b.createLinearGradient(-rim.x * 1.4, -rim.y * 1.4, rim.x * 1.4, rim.y * 1.4);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(0.55, 'rgba(0,0,0,0)'); rg.addColorStop(1, rgba(rim.col, rim.k * fk));
    b.globalCompositeOperation = 'lighter'; b.strokeStyle = rg; b.lineWidth = 0.1; accessoryPaths(b, o.type, yaw); b.stroke();
    b.restore();
    // accent inlay: a spine line along each fin
    if (o.type === 'bear' || o.type === 'cat' || o.type === 'fin') {
      b.save(); accessoryPaths(b, o.type, yaw); b.clip();
      b.strokeStyle = rgba(F(accent), 0.85 * fk); b.lineWidth = 0.035; b.lineCap = 'butt';
      b.beginPath(); accessorySpines(b, o.type, yaw); b.stroke();
      b.restore();
    }
    if (o.type === 'frog') {
      for (const sg of [-1, 1]) {
        const p = crownPt(sg * 0.5, yaw, 0.02); if (!p.vis) continue;
        b.fillStyle = rgba(scl(accent, 1.15), fk); b.fillRect(p.x - 0.1, p.y - 0.09, 0.2, 0.05);
        g.fillStyle = rgba(accent, 0.8 * fk); g.fillRect(p.x - 0.14, p.y - 0.12, 0.28, 0.11);
      }
    }
    if (o.type === 'antenna') {
      const [tx, ty] = antennaTip(yaw);
      b.fillStyle = rgba(scl(accent, 1.2)); b.beginPath(); b.moveTo(tx, ty - 0.1); b.lineTo(tx + 0.06, ty); b.lineTo(tx, ty + 0.1); b.lineTo(tx - 0.06, ty); b.closePath(); b.fill();
      g.fillStyle = rgba(accent, 0.95 * fk); g.beginPath(); g.arc(tx, ty, 0.17, 0, TAU2); g.fill();
    }
  }

  // ---- shell (cel shaded) ------------------------------------------------------
  const kx = key.x, ky = key.y;
  b.fillStyle = rgba(lit); shellPath(b); b.fill();
  b.save(); shellPath(b); b.clip();
  const soft = b.createRadialGradient(kx * 0.55, ky * 0.55, 0.1, kx * 0.2, ky * 0.2, 1.5);
  soft.addColorStop(0, 'rgba(255,255,255,0)'); soft.addColorStop(1, rgba(scl(shell, 0.7), 0.25));
  b.fillStyle = soft; b.fillRect(-1.2, -1.2, 2.4, 2.4);
  // hard terminator: sculpts the crown and the flank away from the key light
  b.fillStyle = rgba(shade);
  b.beginPath(); b.rect(-1.5, -1.5, 3, 3);
  b.ellipse(kx * 0.46, ky * 0.34 - 0.04, 0.98, 1.0, 0, 0, TAU2);
  b.fill('evenodd');
  // jaw / chin guard: a darker lower plate
  b.fillStyle = rgba(scl(shade, 0.92), 0.55);
  b.beginPath(); b.moveTo(-1, 0.62); b.lineTo(-0.66, 0.66); b.lineTo(0, 0.72); b.lineTo(0.66, 0.66); b.lineTo(1, 0.62); b.lineTo(1, 1.2); b.lineTo(-1, 1.2); b.closePath(); b.fill();
  const us = b.createLinearGradient(0, 0.5, 0, 1.1);
  us.addColorStop(0, 'rgba(0,0,0,0)'); us.addColorStop(1, 'rgba(0,0,0,0.5)');
  b.fillStyle = us; b.fillRect(-1.2, 0.5, 2.4, 0.7);
  // panel seams: crown plate and cheek plates
  const v0 = visorBox(yaw, pitch);
  const off = Math.sin(yaw * 0.9) * 0.95, sq = Math.max(0.2, Math.cos(yaw * 0.9));
  b.strokeStyle = rgba(seam, 0.95); b.lineWidth = 0.028; b.lineJoin = 'miter';
  b.beginPath();
  if (!o.stripes) {
    for (const sg of [-1, 1]) {
      b.moveTo(off + sg * 0.3 * sq, v0.y0 - 0.1);
      b.bezierCurveTo(off + sg * 0.34 * sq, -0.62, off + sg * 0.24 * sq, -0.84, off + sg * 0.14 * sq, -0.95);
    }
  }
  for (const sg of [-1, 1]) {
    const ex = sg > 0 ? v0.xr : v0.xl, w = v0.xr - v0.xl;
    b.moveTo(ex - sg * w * 0.035, v0.y1 - (v0.y1 - v0.y0) * 0.26);
    b.lineTo(sg * 0.8, 0.7);
  }
  b.moveTo(-0.66, 0.66); b.lineTo(0, 0.72); b.lineTo(0.66, 0.66);
  b.stroke();
  // stripes over the crown (YOU's forked Y, the rival's spine)
  if (o.stripes) {
    b.fillStyle = rgba(F(scl(accent, 0.95)));
    if (o.stripes === 'y') {
      for (const sg of [-1, 1]) {
        const x0 = off + sg * 0.11 * sq;
        b.beginPath();
        b.moveTo(x0 - 0.045 * sq, -1.2); b.lineTo(x0 + 0.045 * sq, -1.2);
        b.lineTo(x0 + 0.045 * sq, v0.y0 - 0.22);
        b.lineTo(x0 + 0.045 * sq + sg * 0.3 * sq, v0.y0 - 0.06);
        b.lineTo(x0 - 0.045 * sq + sg * 0.3 * sq, v0.y0 - 0.0);
        b.lineTo(x0 - 0.045 * sq, v0.y0 - 0.15);
        b.closePath(); b.fill();
      }
    } else {
      b.beginPath(); b.rect(off - 0.05 * sq, -1.2, 0.1 * sq, v0.y0 + 1.12); b.fill();
    }
  }
  b.restore();
  // rim light (crisp)
  b.save(); shellPath(b); b.clip();
  b.globalCompositeOperation = 'lighter';
  const rgr = b.createLinearGradient(-rim.x, -rim.y, rim.x, rim.y);
  rgr.addColorStop(0, 'rgba(0,0,0,0)'); rgr.addColorStop(0.58, 'rgba(0,0,0,0)'); rgr.addColorStop(1, rgba(rim.col, rim.k * (1 - fog * 0.6)));
  b.strokeStyle = rgr; b.lineWidth = 0.11; shellPath(b); b.stroke();
  b.restore();
  if (rim.k > 0.2 && fog < 0.5) {
    g.save(); shellPath(g); g.clip();
    const rgg = g.createLinearGradient(-rim.x, -rim.y, rim.x, rim.y);
    rgg.addColorStop(0.72, 'rgba(0,0,0,0)'); rgg.addColorStop(1, rgba(rim.col, 0.3 * rim.k * fk));
    g.strokeStyle = rgg; g.lineWidth = 0.1; shellPath(g); g.stroke();
    g.restore();
  }

  // ---- side status slits (were ear discs) --------------------------------------
  for (const sg of [-1, 1]) {
    const ang = sg * 1.18 + yaw * 0.9;
    if (Math.cos(ang) < 0.08) continue;
    const ex = Math.sin(ang) * 0.88, w = 0.045 * Math.cos(ang) + 0.012;
    b.fillStyle = rgba(F(scl(shell, pearl ? 0.4 : 0.35)));
    b.beginPath(); b.moveTo(ex - w, 0.3); b.lineTo(ex + w, 0.27); b.lineTo(ex + w, 0.5); b.lineTo(ex - w, 0.53); b.closePath(); b.fill();
    if (o.status) {
      const sc = typeof o.status === 'string' ? hexToRgb(o.status) : o.status;
      b.fillStyle = rgba(scl(sc, 1.3)); b.fillRect(ex - w * 0.45, 0.32, w * 0.9, 0.17);
      g.fillStyle = rgba(sc, 0.8 * fk); g.fillRect(ex - w * 1.3, 0.28, w * 2.6, 0.26);
    }
  }

  // ---- visor --------------------------------------------------------------------
  const v = v0;
  // face-plate seam around the visor, then a dark gasket
  b.strokeStyle = rgba(seam, 0.9); b.lineWidth = 0.026; b.lineJoin = 'miter'; visorPath(b, v, 0.13); b.stroke();
  b.fillStyle = rgba(F(pearl ? [34, 34, 46] : scl(shell, 0.3))); visorPath(b, v, 0.065); b.fill();
  const vGlass = b.createLinearGradient(0, v.y0, 0, v.y1);
  vGlass.addColorStop(0, rgba(F([14, 14, 26]))); vGlass.addColorStop(1, rgba(F([4, 4, 9])));
  b.fillStyle = vGlass; visorPath(b, v); b.fill();
  const ledI = o.ledI ?? 1;
  b.save(); visorPath(b, v); b.clip();
  const cxv = (v.xl + v.xr) / 2, cyv = (v.y0 + v.y1) / 2;
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
  // brow overhang: the shell shades the top of the visor
  const bs = b.createLinearGradient(0, v.y0, 0, v.y0 + 0.16);
  bs.addColorStop(0, 'rgba(0,0,0,0.55)'); bs.addColorStop(1, 'rgba(0,0,0,0)');
  b.fillStyle = bs; b.fillRect(-1.2, v.y0 - 0.05, 2.4, 0.26);
  b.globalCompositeOperation = 'lighter';
  const band = b.createLinearGradient(v.xl, v.y0, v.xl + 1.0, v.y0 + 1.0);
  band.addColorStop(0, 'rgba(255,255,255,0)'); band.addColorStop(0.3, 'rgba(255,255,255,0)');
  band.addColorStop(0.36, `rgba(220,235,255,${0.09 * fk})`); band.addColorStop(0.46, 'rgba(255,255,255,0)');
  b.fillStyle = band; b.fillRect(-1.2, -1, 2.4, 2);
  b.restore();
  {
    const w = v.xr - v.xl, h = v.y1 - v.y0, cx = (v.xl + v.xr) / 2, yb = v.y1 + 0.065;
    // lower bevel of the gasket catches the light
    b.strokeStyle = rgba(edge, 0.55 * fk); b.lineWidth = 0.022;
    b.beginPath(); b.moveTo(v.xl + w * 0.17, yb); b.lineTo(cx - w * 0.07, yb); b.moveTo(cx + w * 0.07, yb); b.lineTo(v.xr - w * 0.17, yb); b.stroke();
    // identity trim: a thin accent line under the visor
    b.strokeStyle = rgba(F(accent), 0.85 * fk); b.lineWidth = 0.028;
    b.beginPath(); b.moveTo(v.xl + w * 0.2, v.y1 + 0.03); b.lineTo(cx - w * 0.08, v.y1 + 0.03); b.moveTo(cx + w * 0.08, v.y1 + 0.03); b.lineTo(v.xr - w * 0.2, v.y1 + 0.03); b.stroke();
    g.strokeStyle = rgba(accent, 0.45 * fk); g.lineWidth = 0.05;
    g.beginPath(); g.moveTo(v.xl + w * 0.2, v.y1 + 0.03); g.lineTo(cx - w * 0.08, v.y1 + 0.03); g.moveTo(cx + w * 0.08, v.y1 + 0.03); g.lineTo(v.xr - w * 0.2, v.y1 + 0.03); g.stroke();
  }
  // wide shots: the visor reads as a lit bar in the pick colour from across the arena (w in px)
  const vgk = o.visorGlow ? clamp((60 - s) / 30) : 0; // only small (distant) helmets need it
  if (vgk > 0) {
    g.strokeStyle = rgba(led, (o.visorGlow.a ?? 0.85) * vgk * fk); g.lineWidth = o.visorGlow.w / s; g.lineJoin = 'miter';
    visorPath(g, v); g.stroke();
  }
  // brow edge: the top of the face-plate seam catches the light
  b.save(); shellPath(b); b.clip();
  b.beginPath(); b.rect(-1.2, -1.2, 2.4, v.y0 + 1.2 + 0.05); b.clip();
  b.strokeStyle = rgba(edge, 0.9 * fk); b.lineWidth = 0.03; b.lineJoin = 'miter';
  visorPath(b, v, 0.13); b.stroke();
  b.restore();

  // ---- specular: a crisp crescent along the crown (lacquer, not a toy gloss) ------
  const gl = (o.gloss ?? 1) * fk;
  b.save(); shellPath(b); b.clip();
  b.lineCap = 'round';
  const side = kx <= 0 ? -1 : 1;
  b.strokeStyle = `rgba(255,255,255,${(pearl ? 0.45 : 0.38) * gl})`; b.lineWidth = 0.05;
  b.beginPath(); b.ellipse(0, 0.02, 0.84, 0.84, 0, side < 0 ? Math.PI * 1.12 : Math.PI * 1.62, side < 0 ? Math.PI * 1.38 : Math.PI * 1.88); b.stroke();
  b.strokeStyle = `rgba(255,255,255,${(pearl ? 0.9 : 0.75) * gl})`; b.lineWidth = 0.035;
  b.beginPath(); b.ellipse(0, 0.02, 0.84, 0.84, 0, side < 0 ? Math.PI * 1.2 : Math.PI * 1.7, side < 0 ? Math.PI * 1.3 : Math.PI * 1.8); b.stroke();
  b.restore();

  for (const c of [b, g]) c.restore();
  return v;
}

// Fast silhouette for crowds (shoulders, accessories, shell as one path).
export function crowdSilhouette(c, type) {
  c.beginPath();
  c.moveTo(-0.44, 0.9);
  c.lineTo(-0.46, 1.18);
  c.bezierCurveTo(-0.84, 1.22, -1.26, 1.34, -1.56, 1.52);
  c.bezierCurveTo(-1.84, 1.7, -1.96, 2.0, -2.0, 2.4);
  c.lineTo(2.0, 2.4);
  c.bezierCurveTo(1.96, 2.0, 1.84, 1.7, 1.56, 1.52);
  c.bezierCurveTo(1.26, 1.34, 0.84, 1.22, 0.46, 1.18);
  c.lineTo(0.44, 0.9);
  c.closePath();
  if (type && type !== 'dome') accessorySub(c, type, 0);
  shellSub(c);
}

// Back view of a player: a backlit silhouette.
// o: { x, y, s, type, shell, accent, stripes, rim:{col,k}, rimDir, rimSide, led, ledK, fog, fogCol, body, roll }
export function drawHelmetBack(R, o) {
  const { b, g } = R;
  const s = o.s;
  const fog = o.fog || 0; const fogCol = o.fogCol || [20, 18, 34];
  const rim = o.rim || { col: [230, 245, 255], k: 1 };
  const shell = o.shell || [40, 38, 54];
  const pearl = shell[0] > 150;
  const sil = mix(pearl ? [70, 70, 84] : [6, 5, 11], fogCol, fog);
  for (const c of [b, g]) { c.save(); c.translate(o.x, o.y); c.rotate(o.roll || 0); c.scale(s, s); }
  g.fillStyle = rgba([0, 0, 0], 1 - fog * 0.6);
  g.beginPath();
  if (o.type && o.type !== 'dome') accessorySub(g, o.type, 0);
  shellSub(g); g.fill();
  b.fillStyle = rgba(sil);
  if (o.body !== false) {
    b.beginPath();
    b.moveTo(-0.44, 0.9); b.lineTo(-0.46, 1.18);
    b.bezierCurveTo(-0.84, 1.22, -1.26, 1.34, -1.56, 1.52); b.bezierCurveTo(-1.84, 1.7, -1.98, 2.0, -2.06, 2.4); b.lineTo(-2.12, 3.9);
    b.lineTo(2.12, 3.9); b.lineTo(2.06, 2.4); b.bezierCurveTo(1.98, 2.0, 1.84, 1.7, 1.56, 1.52); b.bezierCurveTo(1.26, 1.34, 0.84, 1.22, 0.46, 1.18);
    b.lineTo(0.44, 0.9); b.closePath(); b.fill();
  }
  b.beginPath();
  if (o.type && o.type !== 'dome') accessorySub(b, o.type, 0);
  shellSub(b); b.fill();
  if (o.stripes === 'y') {
    const ac = hexToRgb(typeof o.accent === 'string' ? o.accent : '#18e0ff');
    b.save(); shellPath(b); b.clip();
    b.fillStyle = rgba(mix(scl(ac, 0.7), fogCol, fog)); b.fillRect(-0.17, -1.2, 0.09, 2.4); b.fillRect(0.08, -1.2, 0.09, 2.4);
    b.restore();
  }
  const rk = clamp(rim.k * (o.rimDir ?? 1) * (1 - fog * 0.9), 0, 1.2);
  if (rk > 0.02) {
    const side = o.rimSide || 0;
    const a0 = Math.PI * (1.1 + Math.max(0, side) * 0.3), a1 = Math.PI * (1.9 + Math.min(0, side) * 0.3);
    b.save(); shellPath(b); b.clip();
    b.strokeStyle = rgba(rim.col, rk * 0.55); b.lineWidth = 0.07;
    b.beginPath(); b.ellipse(0, 0.02, 0.95, 0.92, 0, a0, a1); b.stroke();
    b.restore();
    g.strokeStyle = rgba(rim.col, rk * 0.3); g.lineWidth = 0.14;
    g.beginPath(); g.ellipse(0, 0.02, 0.95, 0.92, 0, a0, a1); g.stroke();
  }
  if (o.led && (o.ledK ?? 1) > 0) {
    const lk = (o.ledK ?? 1) * (1 - fog * 0.5);
    for (const sg of [-1, 1]) {
      b.fillStyle = rgba(scl(o.led, 1.2), lk * 0.7); b.fillRect(sg * 0.9 - 0.03, 0.04, 0.06, 0.3);
      g.fillStyle = rgba(o.led, 0.4 * lk); g.fillRect(sg * 0.9 - 0.08, 0.0, 0.16, 0.38);
    }
  }
  for (const c of [b, g]) c.restore();
}
