// Helmeted players. Unit space: head radius 1, centred at (0,0), +y down.
// Look: cel-shaded lacquer shells (hard terminator), chamfered LED visors,
// rim light from the world's cyan backlight, key light from the candle.
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

export function shellPath(c) {
  c.beginPath();
  c.moveTo(-1, 0);
  c.arc(0, 0, 1, Math.PI, Math.PI * 2);
  c.bezierCurveTo(1.0, 0.42, 0.95, 0.80, 0.66, 0.93);
  c.quadraticCurveTo(0, 1.07, -0.66, 0.93);
  c.bezierCurveTo(-0.95, 0.80, -1.0, 0.42, -1, 0);
  c.closePath();
}

// visor extents on the unit sphere given yaw (radians) and pitch
export function visorBox(yaw = 0, pitch = 0) {
  const a = 0.95;
  const xl = Math.sin(clamp(-a + yaw, -1.5, 1.5)), xr = Math.sin(clamp(a + yaw, -1.5, 1.5));
  const y0 = -0.36 + pitch * 0.16, y1 = 0.56 + pitch * 0.10;
  return { xl, xr, y0, y1 };
}
// chamfered (cut-corner) visor, like Chakra Petch's corners
function visorPath(c, v, grow = 0) {
  const xl = v.xl - grow, xr = v.xr + grow, y0 = v.y0 - grow, y1 = v.y1 + grow;
  const h = y1 - y0;
  const ch = h * 0.30; // chamfer
  const cb = h * 0.22;
  c.beginPath();
  c.moveTo(xl + ch, y0);
  c.lineTo(xr - ch, y0);
  c.lineTo(xr, y0 + ch);
  c.lineTo(xr, y1 - cb);
  c.lineTo(xr - cb * 1.4, y1);
  c.lineTo(xl + cb * 1.4, y1);
  c.lineTo(xl, y1 - cb);
  c.lineTo(xl, y0 + ch);
  c.closePath();
}

const scl = (c, k) => [clamp(c[0] * k, 0, 255), clamp(c[1] * k, 0, 255), clamp(c[2] * k, 0, 255)];
const mul = (a, b) => [a[0] * b[0] / 255, a[1] * b[1] / 255, a[2] * b[2] / 255];
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

function accessoryPaths(c, type, yaw) {
  const place = (phi, r = 0.9) => {
    const ang = phi + yaw * 0.9;
    return { x: Math.sin(ang) * r, y: -Math.cos(phi) * r, vis: Math.cos(ang) > -0.25 };
  };
  c.beginPath();
  if (type === 'bear') {
    for (const s of [-1, 1]) { const p = place(s * 0.74, 0.88); if (p.vis) { c.moveTo(p.x + 0.36, p.y); c.arc(p.x, p.y, 0.36, 0, TAU2); } }
  } else if (type === 'cat') {
    for (const s of [-1, 1]) { const p = place(s * 0.62, 0.8); if (p.vis) { c.moveTo(p.x - 0.3, p.y + 0.14); c.lineTo(p.x + s * 0.14, p.y - 0.56); c.lineTo(p.x + 0.32, p.y + 0.2); c.closePath(); } }
  } else if (type === 'horns') {
    for (const s of [-1, 1]) {
      const p = place(s * 1.08, 0.93); if (!p.vis) continue;
      c.moveTo(p.x - s * 0.06, p.y + 0.16);
      c.quadraticCurveTo(p.x + s * 0.58, p.y + 0.06, p.x + s * 0.66, p.y - 0.6);
      c.quadraticCurveTo(p.x + s * 0.32, p.y - 0.12, p.x - s * 0.08, p.y - 0.14);
      c.closePath();
    }
  } else if (type === 'frog') {
    for (const s of [-1, 1]) { const p = place(s * 0.5, 0.86); if (p.vis) { c.moveTo(p.x + 0.38, p.y - 0.06); c.arc(p.x, p.y - 0.06, 0.38, 0, TAU2); } }
  } else if (type === 'fin') {
    const o = yaw * 0.6;
    c.moveTo(-0.14 + o, -0.92); c.quadraticCurveTo(0.08 + o, -1.5, 0.3 + o, -1.36);
    c.quadraticCurveTo(0.14 + o, -1.08, 0.2 + o, -0.9); c.closePath();
  } else if (type === 'antenna') {
    const p = place(0.4, 0.97);
    c.moveTo(p.x - 0.04, p.y + 0.08); c.lineTo(p.x + 0.1, p.y - 0.6); c.lineTo(p.x + 0.17, p.y - 0.6); c.lineTo(p.x + 0.05, p.y + 0.08); c.closePath();
  }
}

// Hooded bust
function bustPath(c) {
  c.beginPath();
  c.moveTo(-0.62, 0.74);
  c.bezierCurveTo(-1.05, 0.9, -1.62, 1.02, -1.86, 1.5);
  c.quadraticCurveTo(-2.06, 1.9, -2.12, 3.4);
  c.lineTo(2.12, 3.4);
  c.quadraticCurveTo(2.06, 1.9, 1.86, 1.5);
  c.bezierCurveTo(1.62, 1.02, 1.05, 0.9, 0.62, 0.74);
  c.closePath();
}
function hoodPath(c) {
  c.beginPath();
  c.moveTo(-1.18, 0.55);
  c.bezierCurveTo(-1.35, -0.2, -1.05, -1.02, 0, -1.08);
  c.bezierCurveTo(1.05, -1.02, 1.35, -0.2, 1.18, 0.55);
  c.bezierCurveTo(1.1, 1.05, -1.1, 1.05, -1.18, 0.55);
  c.closePath();
}

/**
 * o: { x, y, s, type, shell, accent, face, led, yaw, pitch, roll, key:{x,y,col,k}, rim:{x,y,col,k},
 *      amb, body:'bust'|null, hood, ledI, fog, fogCol, stripes:'y'|'one'|null, status }
 */
export function drawHelmet(R, o) {
  const { b, g } = R;
  const s = o.s;
  const yaw = o.yaw || 0, pitch = o.pitch || 0;
  const shell = o.shell || [62, 56, 90];
  const key = { x: -0.55, y: -0.6, col: [190, 225, 255], k: 0.6, ...(o.key || {}) };
  const rim = { x: 0.8, y: -0.5, col: RGB.cyan, k: 1.0, ...(o.rim || {}) };
  const accent = typeof o.accent === 'string' ? hexToRgb(o.accent) : (o.accent || RGB.cyan);
  const led = typeof o.led === 'string' ? hexToRgb(o.led) : (o.led || RGB.cyan);
  const fog = o.fog || 0; const fogCol = o.fogCol || [20, 18, 34];
  const F = (c) => mix(c, fogCol, fog);
  const fk = 1 - fog;
  const light = mul(key.col, shell);
  const lit = F(mix(shell, scl(mix(shell, key.col, 0.22), 1.0 + key.k * 0.35), clamp(key.k, 0, 1)));
  const shade = F(mix(scl(shell, 0.38 + (o.amb ?? 0.08)), [24, 20, 44], 0.35));

  for (const c of [b, g]) { c.save(); c.translate(o.x, o.y); c.rotate(o.roll || 0); c.scale(s, s); }

  // ---- body -------------------------------------------------------------
  if (o.body === 'bust') {
    const bodyCol = o.bodyCol || [44, 40, 64];
    b.fillStyle = rgba(F(bodyCol)); bustPath(b); b.fill();
    b.save(); bustPath(b); b.clip();
    // cel shade: shadow side
    b.fillStyle = rgba(F(scl(bodyCol, 0.55)));
    b.beginPath(); b.rect(-2.5, 0.5, 5, 3.2); b.ellipse(key.x * 0.9, 1.9, 2.05, 1.6, 0, 0, TAU2); b.fill('evenodd');
    // fold line
    b.strokeStyle = rgba(F(scl(bodyCol, 0.6)), 0.5); b.lineWidth = 0.04;
    b.beginPath(); b.moveTo(-1.25, 1.55); b.quadraticCurveTo(-1.0, 2.3, -1.05, 3.3); b.moveTo(1.25, 1.55); b.quadraticCurveTo(1.0, 2.3, 1.05, 3.3); b.stroke();
    // rim
    const rg = b.createLinearGradient(-rim.x * 2.2, -rim.y, rim.x * 2.2, rim.y);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(0.6, 'rgba(0,0,0,0)'); rg.addColorStop(1, rgba(rim.col, 0.9 * rim.k * fk));
    b.globalCompositeOperation = 'lighter'; b.strokeStyle = rg; b.lineWidth = 0.14; bustPath(b); b.stroke();
    b.restore();
    // neck ring
    b.fillStyle = rgba(F(scl(shell, 0.5)));
    b.beginPath(); b.ellipse(0, 0.9, 0.72, 0.2, 0, 0, TAU2); b.fill();
  }
  if (o.hood) {
    const hc = o.bodyCol || [44, 40, 64];
    b.fillStyle = rgba(F(scl(hc, 0.9))); hoodPath(b); b.fill();
    const rg = b.createLinearGradient(-rim.x * 1.3, -rim.y * 1.3, rim.x * 1.3, rim.y * 1.3);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(0.62, 'rgba(0,0,0,0)'); rg.addColorStop(1, rgba(rim.col, 0.8 * rim.k * fk));
    b.save(); b.globalCompositeOperation = 'lighter'; b.strokeStyle = rg; b.lineWidth = 0.08; hoodPath(b); b.stroke(); b.restore();
  }

  // occlusion: opaque parts block the emissive layer behind them
  g.fillStyle = rgba([0, 0, 0], 1 - fog * 0.6);
  if (o.body === 'bust') { bustPath(g); g.fill(); }
  if (o.hood) { hoodPath(g); g.fill(); }
  if (o.type && o.type !== 'dome') { accessoryPaths(g, o.type, yaw); g.fill(); }
  shellPath(g); g.fill();

  // ---- accessories ----------------------------------------------------------
  if (o.type && o.type !== 'dome') {
    b.fillStyle = rgba(lit); accessoryPaths(b, o.type, yaw); b.fill();
    b.save(); accessoryPaths(b, o.type, yaw); b.clip();
    b.fillStyle = rgba(shade); b.beginPath(); b.rect(-2, -2, 4, 4); b.arc(key.x * 0.55, key.y * 0.5 - 0.25, 1.2, 0, TAU2); b.fill('evenodd');
    const rg = b.createLinearGradient(-rim.x * 1.4, -rim.y * 1.4, rim.x * 1.4, rim.y * 1.4);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(0.55, 'rgba(0,0,0,0)'); rg.addColorStop(1, rgba(rim.col, rim.k * fk));
    b.globalCompositeOperation = 'lighter'; b.strokeStyle = rg; b.lineWidth = 0.14; accessoryPaths(b, o.type, yaw); b.stroke();
    b.restore();
    if (o.type === 'bear') {
      b.fillStyle = rgba(F(mix(scl(shell, 0.6), accent, 0.35)));
      for (const sg of [-1, 1]) { const ang = sg * 0.74 + yaw * 0.9; if (Math.cos(ang) < -0.25) continue; b.beginPath(); b.arc(Math.sin(ang) * 0.88, -Math.cos(sg * 0.74) * 0.88 + 0.03, 0.17, 0, TAU2); b.fill(); }
    }
    if (o.type === 'antenna') {
      const ang = 0.4 + yaw * 0.9;
      const tx = Math.sin(ang) * 0.97 + 0.135, ty = -Math.cos(0.4) * 0.97 - 0.64;
      b.fillStyle = rgba(scl(accent, 1.2)); b.beginPath(); b.arc(tx, ty, 0.1, 0, TAU2); b.fill();
      g.fillStyle = rgba(accent, 0.95 * fk); g.beginPath(); g.arc(tx, ty, 0.2, 0, TAU2); g.fill();
    }
  }

  // ---- shell (cel shaded) ------------------------------------------------------
  b.fillStyle = rgba(lit); shellPath(b); b.fill();
  b.save(); shellPath(b); b.clip();
  // soft falloff inside lit area
  const kx = key.x, ky = key.y;
  const soft = b.createRadialGradient(kx * 0.55, ky * 0.55, 0.1, kx * 0.2, ky * 0.2, 1.5);
  soft.addColorStop(0, 'rgba(255,255,255,0)'); soft.addColorStop(1, rgba(scl(shell, 0.7), 0.22));
  b.fillStyle = soft; b.fillRect(-1.2, -1.2, 2.4, 2.4);
  // hard terminator shadow
  b.fillStyle = rgba(shade);
  b.beginPath(); b.rect(-1.5, -1.5, 3, 3);
  b.ellipse(kx * 0.5, ky * 0.42, 1.0, 0.98, 0, 0, TAU2);
  b.fill('evenodd');
  // occlusion under the visor
  const us = b.createLinearGradient(0, 0.45, 0, 1.08);
  us.addColorStop(0, 'rgba(0,0,0,0)'); us.addColorStop(1, 'rgba(0,0,0,0.5)');
  b.fillStyle = us; b.fillRect(-1.2, 0.4, 2.4, 0.8);
  // stripes over the dome
  if (o.stripes) {
    const off = Math.sin(yaw * 0.9) * 0.95, sq = Math.max(0.15, Math.cos(yaw * 0.9));
    const v = visorBox(yaw, pitch);
    b.fillStyle = rgba(F(scl(accent, 0.95)));
    if (o.stripes === 'y') {
      for (const sg of [-1, 1]) {
        const x0 = off + sg * 0.11 * sq;
        b.beginPath();
        b.moveTo(x0 - 0.045 * sq, -1.2); b.lineTo(x0 + 0.045 * sq, -1.2);
        b.lineTo(x0 + 0.045 * sq, v.y0 - 0.2);
        b.lineTo(x0 + 0.045 * sq + sg * 0.3 * sq, v.y0 - 0.03);
        b.lineTo(x0 - 0.045 * sq + sg * 0.3 * sq, v.y0 + 0.02);
        b.lineTo(x0 - 0.045 * sq, v.y0 - 0.14);
        b.closePath(); b.fill();
      }
    } else {
      b.beginPath(); b.rect(off - 0.05 * sq, -1.2, 0.1 * sq, v.y0 + 1.1); b.fill();
    }
  }
  b.restore();
  // rim light (crisp)
  b.save(); shellPath(b); b.clip();
  b.globalCompositeOperation = 'lighter';
  const rgr = b.createLinearGradient(-rim.x, -rim.y, rim.x, rim.y);
  rgr.addColorStop(0, 'rgba(0,0,0,0)'); rgr.addColorStop(0.58, 'rgba(0,0,0,0)'); rgr.addColorStop(1, rgba(rim.col, rim.k * (1 - fog * 0.6)));
  b.strokeStyle = rgr; b.lineWidth = 0.12; shellPath(b); b.stroke();
  b.restore();
  if (rim.k > 0.2 && fog < 0.5) {
    g.save(); shellPath(g); g.clip();
    const rgg = g.createLinearGradient(-rim.x, -rim.y, rim.x, rim.y);
    rgg.addColorStop(0.72, 'rgba(0,0,0,0)'); rgg.addColorStop(1, rgba(rim.col, 0.3 * rim.k * fk));
    g.strokeStyle = rgg; g.lineWidth = 0.1; shellPath(g); g.stroke();
    g.restore();
  }

  // ---- side ear discs ----------------------------------------------------------
  for (const sg of [-1, 1]) {
    const ang = sg * 1.22 + yaw * 0.9;
    if (Math.cos(ang) < 0.05) continue;
    const ex = Math.sin(ang) * 0.99, ey = 0.1;
    const w = 0.2 * Math.cos(ang) + 0.03;
    b.fillStyle = rgba(F(scl(shell, 0.55)));
    b.beginPath(); b.ellipse(ex, ey, w, 0.3, 0, 0, TAU2); b.fill();
    b.strokeStyle = rgba(F(scl(shell, 1.3)), 0.6); b.lineWidth = 0.025;
    b.beginPath(); b.ellipse(ex, ey, w * 0.7, 0.21, 0, 0, TAU2); b.stroke();
    if (o.status) {
      const sc = typeof o.status === 'string' ? hexToRgb(o.status) : o.status;
      b.fillStyle = rgba(scl(sc, 1.3)); b.beginPath(); b.ellipse(ex, ey, w * 0.3, 0.08, 0, 0, TAU2); b.fill();
      g.fillStyle = rgba(sc, 0.9 * fk); g.beginPath(); g.ellipse(ex, ey, w * 0.5 + 0.02, 0.13, 0, 0, TAU2); g.fill();
    }
  }

  // ---- visor --------------------------------------------------------------------
  const v = visorBox(yaw, pitch);
  // gasket
  b.fillStyle = rgba(F(scl(shell, 0.35))); visorPath(b, v, 0.06); b.fill();
  const vGlass = b.createLinearGradient(0, v.y0, 0, v.y1);
  vGlass.addColorStop(0, rgba(F([16, 16, 30]))); vGlass.addColorStop(1, rgba(F([4, 4, 9])));
  b.fillStyle = vGlass; visorPath(b, v); b.fill();
  const ledI = o.ledI ?? 1;
  b.save(); visorPath(b, v); b.clip();
  const cxv = (v.xl + v.xr) / 2, cyv = (v.y0 + v.y1) / 2;
  const sp = b.createRadialGradient(cxv, cyv, 0.05, cxv, cyv, 1.0);
  sp.addColorStop(0, rgba(led, 0.18 * ledI * fk)); sp.addColorStop(1, 'rgba(0,0,0,0)');
  b.fillStyle = sp; b.fillRect(-1.2, -1, 2.4, 2);
  b.restore();
  if (o.face && !o.noFace) {
    const ix = 0.1, iy = 0.08;
    const box = { x: v.xl + ix, y: v.y0 + iy, w: (v.xr - v.xl) - ix * 2, h: (v.y1 - v.y0) - iy * 2 };
    if (s * box.w > 55 && !o.tiny) {
      drawFaceGrid(R, composeFace(o.face), { ...box, color: led, mouthColor: o.mouthLed || led, intensity: ledI * (1 - fog * 0.5), showOff: o.showOff });
    } else {
      drawTinyEyes(R, cxv + (o.face.lookX || 0) * 0.02, v.y0 + (v.y1 - v.y0) * 0.4 + (o.face.lookY || 0) * 0.03, (v.xr - v.xl) * 0.9, (v.y1 - v.y0) * 0.55, led, o.face.eyes || o.face.eyeL, ledI * (1 - fog * 0.4));
    }
  }
  b.save(); visorPath(b, v); b.clip();
  b.globalCompositeOperation = 'lighter';
  const band = b.createLinearGradient(v.xl, v.y0, v.xl + 1.0, v.y0 + 1.0);
  band.addColorStop(0, 'rgba(255,255,255,0)'); band.addColorStop(0.3, 'rgba(255,255,255,0)');
  band.addColorStop(0.37, `rgba(220,235,255,${0.11 * fk})`); band.addColorStop(0.5, 'rgba(255,255,255,0)');
  b.fillStyle = band; b.fillRect(-1.2, -1, 2.4, 2);
  b.fillStyle = `rgba(210,235,255,${0.2 * fk})`;
  b.fillRect(v.xl + 0.3, v.y0 + 0.035, (v.xr - v.xl) - 0.6, 0.025);
  b.restore();
  b.lineWidth = 0.04; b.strokeStyle = rgba(F(scl(accent, 1.0)), 0.95); visorPath(b, v); b.stroke();
  g.lineWidth = 0.05; g.strokeStyle = rgba(accent, 0.3 * fk); visorPath(g, v); g.stroke();

  // ---- specular (hard, lacquer) ----------------------------------------------
  const gl = o.gloss ?? 1;
  b.save(); shellPath(b); b.clip();
  b.fillStyle = `rgba(255,255,255,${0.16 * gl * fk})`;
  b.beginPath(); b.ellipse(kx * 0.42 - 0.08, -0.7, 0.46, 0.17, -0.42, 0, TAU2); b.fill();
  b.fillStyle = `rgba(255,255,255,${0.85 * gl * fk})`;
  b.beginPath(); b.ellipse(kx * 0.42 - 0.18, -0.74, 0.13, 0.045, -0.42, 0, TAU2); b.fill();
  b.restore();

  for (const c of [b, g]) c.restore();
  return v;
}

// Fast silhouette for crowds.
export function crowdSilhouette(c, type) {
  c.beginPath();
  c.moveTo(-0.55, 0.78); c.quadraticCurveTo(-1.62, 0.98, -1.92, 2.3); c.lineTo(1.92, 2.3); c.quadraticCurveTo(1.62, 0.98, 0.55, 0.78); c.closePath();
  if (type === 'bear') { c.moveTo(-0.28, -0.62); c.arc(-0.62, -0.62, 0.34, 0, TAU2); c.moveTo(0.96, -0.62); c.arc(0.62, -0.62, 0.34, 0, TAU2); }
  else if (type === 'cat') { c.moveTo(-0.9, -0.2); c.lineTo(-0.56, -1.25); c.lineTo(-0.18, -0.8); c.closePath(); c.moveTo(0.9, -0.2); c.lineTo(0.56, -1.25); c.lineTo(0.18, -0.8); c.closePath(); }
  else if (type === 'horns') { c.moveTo(-0.8, -0.5); c.quadraticCurveTo(-1.45, -0.6, -1.5, -1.36); c.lineTo(-0.6, -0.82); c.closePath(); c.moveTo(0.8, -0.5); c.quadraticCurveTo(1.45, -0.6, 1.5, -1.36); c.lineTo(0.6, -0.82); c.closePath(); }
  else if (type === 'frog') { c.moveTo(-0.07, -0.8); c.arc(-0.45, -0.8, 0.38, 0, TAU2); c.moveTo(0.83, -0.8); c.arc(0.45, -0.8, 0.38, 0, TAU2); }
  else if (type === 'antenna') { c.rect(0.33, -1.55, 0.08, 0.75); c.moveTo(0.49, -1.6); c.arc(0.37, -1.6, 0.12, 0, TAU2); }
  else if (type === 'fin') { c.moveTo(-0.14, -0.92); c.quadraticCurveTo(0.08, -1.5, 0.3, -1.36); c.lineTo(0.2, -0.9); c.closePath(); }
  c.moveTo(-1, 0);
  c.arc(0, 0, 1, Math.PI, Math.PI * 2);
  c.bezierCurveTo(1.0, 0.42, 0.95, 0.80, 0.66, 0.93);
  c.quadraticCurveTo(0, 1.07, -0.66, 0.93);
  c.bezierCurveTo(-0.95, 0.80, -1.0, 0.42, -1, 0);
  c.closePath();
}

// Back view of a player: a backlit silhouette.
// o: { x, y, s, type, shell, accent, stripes, rim:{col,k}, rimDir, rimSide, led, ledK, fog, fogCol, body, roll }
export function drawHelmetBack(R, o) {
  const { b, g } = R;
  const s = o.s;
  const fog = o.fog || 0; const fogCol = o.fogCol || [20, 18, 34];
  const rim = o.rim || { col: [230, 245, 255], k: 1 };
  const shell = o.shell || [62, 56, 90];
  const pearl = shell[0] > 150;
  const sil = mix(pearl ? [70, 70, 84] : [6, 5, 11], fogCol, fog);
  for (const c of [b, g]) { c.save(); c.translate(o.x, o.y); c.rotate(o.roll || 0); c.scale(s, s); }
  g.fillStyle = rgba([0, 0, 0], 1 - fog * 0.6);
  if (o.type && o.type !== 'dome') { accessoryPaths(g, o.type, 0); g.fill(); }
  shellPath(g); g.fill();
  b.fillStyle = rgba(sil);
  if (o.body !== false) {
    b.beginPath(); b.moveTo(-0.6, 0.75); b.bezierCurveTo(-1.1, 0.9, -1.65, 1.0, -1.9, 1.5); b.quadraticCurveTo(-2.1, 2.0, -2.15, 3.8);
    b.lineTo(2.15, 3.8); b.quadraticCurveTo(2.1, 2.0, 1.9, 1.5); b.bezierCurveTo(1.65, 1.0, 1.1, 0.9, 0.6, 0.75); b.closePath(); b.fill();
  }
  if (o.type && o.type !== 'dome') { accessoryPaths(b, o.type, 0); b.fill(); }
  shellPath(b); b.fill();
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
    b.beginPath(); b.arc(0, 0.03, 1.0, a0, a1); b.stroke();
    b.restore();
    g.strokeStyle = rgba(rim.col, rk * 0.3); g.lineWidth = 0.14;
    g.beginPath(); g.arc(0, 0.03, 1.0, a0, a1); g.stroke();
  }
  if (o.led && (o.ledK ?? 1) > 0) {
    const lk = (o.ledK ?? 1) * (1 - fog * 0.5);
    for (const sg of [-1, 1]) {
      b.fillStyle = rgba(scl(o.led, 1.2), lk * 0.7); b.beginPath(); b.ellipse(sg * 0.97, 0.12, 0.045, 0.09, 0, 0, TAU2); b.fill();
      g.fillStyle = rgba(o.led, 0.4 * lk); g.beginPath(); g.ellipse(sg * 0.97, 0.12, 0.1, 0.16, 0, 0, TAU2); g.fill();
    }
  }
  for (const c of [b, g]) c.restore();
}
