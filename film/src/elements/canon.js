// The canonical contestants (asset-pack/characters): Base (YOU), Bear, Bull and Rogue, as painted,
// composited into the film's world instead of pasted over it.
//
// Each character is a stable body plate (the painting with its LED face and visor status bars taken out
// by tools/canon_prep.py) plus two light layers (the emissive trim, the status bars). Per draw:
//   1. the plate is drawn and graded in a work canvas: the scene's black level (a screen lift toward the
//      world's ambient), its key light (a colour cast and a soft lift from the key's side), and the
//      world's rim light along the edges that face it, all held to the plate's own alpha;
//   2. the visor is lit with the film's LED face (the same kaomoji vocabulary as every other visor, laid
//      out at the canonical dot pitch and placement measured from base-bust, so ▲/▼ read as geometry),
//      and the status bars in the state colour (cyan default, green win, red loss);
//   3. the emissive parts (trim, bars, the face) go to the glow layer, so they bloom with the scene's own
//      art-directed bloom; the silhouette knocks the glow behind it out; depth blur and fog are applied
//      to the whole character as one, and the post pass then adds grain, CA and the grade on top.
import { rgba, clamp, lerp, hexToRgb } from '../core/math.js';
import { EYES, MOUTHS } from './led.js';

const TAU = Math.PI * 2;
const NAMES = ['base-bust', 'bear-bust', 'bull-bust', 'rogue-bust', 'base-pose', 'bear-pose', 'bull-pose', 'rogue-pose'];
let META = null;
const IMG = {};

async function loadImg(src) { const im = new Image(); im.src = src; await im.decode(); return im; }
export async function loadCanon() {
  if (META) return;
  META = await (await fetch('assets/canon/canon.json')).json();
  await Promise.all(NAMES.map(async (n) => {
    const [plate, trim, status] = await Promise.all(['plate', 'trim', 'status'].map((k) => loadImg(`assets/canon/${n}-${k}.png`)));
    IMG[n] = { plate, trim, status };
  }));
}
export const canonReady = () => !!META;

// ---- the LED face -------------------------------------------------------------------------
// glyph rows as strings ('#' lit). The canonical ▲ (base-bust): a 9-wide head over a 2-wide stem, 11 tall.
const G = (rows) => rows.map((r) => [...r].map((c) => c === '#'));
const CANON_EYES = {
  up: G(['....#....', '...###...', '..#####..', '.#######.', '#########', '...##....', '...##....', '...##....', '...##....', '...##....', '...##....']),
};
CANON_EYES.down = CANON_EYES.up.slice().reverse();
const CANON_MOUTHS = { flat: G(['########']) };
const eyeGlyph = (k) => CANON_EYES[k] || EYES[k] || EYES.dot;
const mouthGlyph = (k) => (k === undefined ? CANON_MOUTHS.flat : CANON_MOUTHS[k] || MOUTHS[k] || null);

// dots of a face in visor units (x along the visor axis, 1 = a status bar), canonical layout
function faceDots(face, L) {
  const p = L.pitch;
  const lx = (face.lookX || 0) * p, ly = (face.lookY || 0) * p;
  const out = [];
  const put = (gl, cx, cy, v) => {
    if (!gl) return;
    const h = gl.length, w = gl[0].length;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (gl[y][x]) out.push([cx + (x - (w - 1) / 2) * p, cy + (y - (h - 1) / 2) * p, v]);
  };
  const blink = face.blink && face.blink > 0.5;
  put(blink ? EYES.closed : eyeGlyph(face.eyeL || face.eyes || 'dot'), -L.eyeX + lx, L.eyeY + ly, 1);
  put(blink ? EYES.closed : eyeGlyph(face.eyeR || face.eyes || 'dot'), L.eyeX + lx, L.eyeY + ly, 1);
  put(mouthGlyph(face.mouth), lx * 0.6, L.mouthY + Math.min(0, ly), 2);
  return out;
}
const hot = (c, k) => [c[0] + (255 - c[0]) * k, c[1] + (255 - c[1]) * k, c[2] + (255 - c[2]) * k];
const col3 = (c, d) => (typeof c === 'string' ? hexToRgb(c) : c || d);

// ---- work canvases ------------------------------------------------------------------------
// (with a margin round the frame, so edges cut by the frame don't read as silhouette edges to the rim light)
let WB = null, WG = null, WR = null, M = 0;
function work(R, Q) {
  M = workMargin(R);
  if (!WB || WB.width !== R.W + 2 * M || WB.height !== R.H + 2 * M) {
    const mk = () => { const c = document.createElement('canvas'); c.width = R.W + 2 * M; c.height = R.H + 2 * M; return c; };
    WB = mk(); WG = mk(); WR = mk();
  }
  for (const c of [WB, WG, WR]) {
    const x = c.getContext('2d', { willReadFrequently: true });
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none';
    x.clearRect(Q.x, Q.y, Q.w, Q.h);
  }
  return [WB.getContext('2d', { willReadFrequently: true }), WG.getContext('2d', { willReadFrequently: true }), WR.getContext('2d', { willReadFrequently: true })];
}
// a figure's box (virtual px [x0, y0, x1, y1]) as a device-px rect in the work canvases, padded for blur
function region(R, box, blur) {
  const W = R.W + 2 * M, H = R.H + 2 * M;
  if (!box) return { x: 0, y: 0, w: W, h: H };
  const pad = 6 + blur * 3;
  const x0 = Math.max(0, Math.floor(box[0] * R.S + M - pad)), y0 = Math.max(0, Math.floor(box[1] * R.S + M - pad));
  const x1 = Math.min(W, Math.ceil(box[2] * R.S + M + pad)), y1 = Math.min(H, Math.ceil(box[3] * R.S + M + pad));
  return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
}
const _tint = new Map();
function tinted(img, col) {
  const key = img.src + col.join(',');
  let c = _tint.get(key);
  if (c) return c;
  c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = rgba(col); x.fillRect(0, 0, c.width, c.height);
  _tint.set(key, c);
  return c;
}

/**
 * Draw a canonical contestant.
 * o: { who: 'base'|'bear'|'bull'|'rogue', kind: 'bust'|'pose', x, y (the head: the visor's centre sits
 *      0.08 s below it), s (size in the film's head units, as drawHelmet: the hood ~2 s wide), flip, roll,
 *      face, led, ledI, status (bar colour; default cyan), statusI, trimK (trim glow), glowK,
 *      key: {x, y, col, k}, rim: {x, y, col, k} (directions on screen, as drawHelmet),
 *      lift: [r,g,b] (the world's black level), sat, contrast, exposure, fog, fogCol, blur (px), alpha,
 *      cut: [v0, v1] (head only: fade the figure out between v0 and v1 visor half-widths below the visor
 *      centre, measured along the head's own axis, so the hood can sit on another body) }
 * Returns { vx, vy, hw } (the visor's centre and half-width on screen) for anything placed on the head.
 */
export function drawCanon(R, o) {
  const name = `${o.who}-${o.kind || 'bust'}`;
  const A = META.assets[name], I = IMG[name];
  const fx = o.flip ? -1 : 1;
  const hw = (o.hw || o.s * 0.6);                    // visor half-width on screen (virtual px)
  const k = hw / A.hw;                               // asset px -> virtual px
  const roll = o.roll || 0;
  const vx = o.x, vy = o.y + (o.hw ? 0 : 0.08 * o.s);
  // asset space -> device space (the work canvases' own transform, with their margin)
  const place = (c) => { c.setTransform(R.S, 0, 0, R.S, M, M); c.translate(vx, vy); c.rotate(roll); c.scale(k * fx, k); c.translate(-A.cx, -A.cy); };
  const st = col3(o.status, [24, 224, 255]);
  return composite(R, o, {
    vx, vy, hw, ang: roll + fx * A.ang,
    box: [vx - hw * 4.6, vy - hw * 3.4, vx + hw * 4.6, vy + hw * 8.5],
    plate: (c) => { place(c); c.drawImage(I.plate, 0, 0); },
    trim: (c) => { place(c); c.drawImage(I.trim, 0, 0); },
    status: (cb, cg, sI, glowK) => {
      const sb = A.sbox;
      place(cb); cb.globalAlpha = 0.95 * sI; cb.drawImage(tinted(I.status, hot(st, 0.55)), sb[0], sb[1]);
      place(cg); cg.globalAlpha = 0.9 * sI * glowK; cg.drawImage(tinted(I.status, st), sb[0], sb[1]);
    },
  });
}

/**
 * The compositing pipeline shared by the canonical busts and the cut-out rigs (elements/rig.js).
 * F: { vx, vy, hw, ang (the visor's frame on screen, virtual px), plate(c) (draw the figure's colour into a
 *      work context, in device space), trim(c) (its emissive trim), status(cb, cg, sI, glowK) (the visor's
 *      status bars) }. o: the drawing options documented on drawCanon.
 */
export function composite(R, o, F) {
  const L = META.layout;
  const S = R.S;
  const { vx, vy, hw } = F;
  const roll = o.roll || 0;
  const fog = o.fog || 0, fogCol = o.fogCol || [20, 18, 34];
  const key = { x: -0.55, y: -0.6, col: [190, 225, 255], k: 0.6, ...(o.key || {}) };
  const rim = { x: 0.8, y: -0.5, col: [24, 224, 255], k: 1.0, ...(o.rim || {}) };
  const lift = o.lift || [24, 21, 40];
  const led = col3(o.led, [24, 224, 255]);
  // the region the figure can touch (device px in the work canvases): every pass is limited to it
  const Q = region(R, F.box, (o.blur || 0) * S);
  const [wb, wg, wr] = work(R, Q);
  const fill = (c) => c.fillRect(Q.x, Q.y, Q.w, Q.h);
  const blit = (c, src, dx = 0, dy = 0, out = 0) => c.drawImage(src, Q.x, Q.y, Q.w, Q.h, Q.x + dx - out, Q.y + dy - out, Q.w, Q.h);

  // ---- 1. the plate, graded ---------------------------------------------------------------
  // (graded once, as a whole: a filter per part costs a pass per part)
  F.plate(wb);
  wb.setTransform(1, 0, 0, 1, 0, 0);
  {
    wr.setTransform(1, 0, 0, 1, 0, 0); wr.clearRect(Q.x, Q.y, Q.w, Q.h);
    wr.filter = `contrast(${o.contrast ?? 1}) saturate(${o.sat ?? 0.92}) brightness(${o.exposure ?? 1})`; blit(wr, WB); wr.filter = 'none';
    wb.clearRect(Q.x, Q.y, Q.w, Q.h); blit(wb, WR);
    wr.clearRect(Q.x, Q.y, Q.w, Q.h);
  }
  // the key light's colour cast over the whole figure, and a soft lift from its side
  const kc = key.col, kk = clamp(key.k, 0, 1.5);
  wb.globalCompositeOperation = 'multiply';
  wb.fillStyle = rgba([lerp(255, kc[0], 0.28 * kk), lerp(255, kc[1], 0.28 * kk), lerp(255, kc[2], 0.28 * kk)]);
  fill(wb);
  {
    const kl = Math.hypot(key.x, key.y) || 1, ex = (vx + key.x / kl * hw * 3) * S + M, ey = (vy + key.y / kl * hw * 3) * S + M;
    const gr = wb.createRadialGradient(ex, ey, 0, ex, ey, hw * (o.keyR ?? 5.5) * S);
    gr.addColorStop(0, rgba(kc, 0.16 * kk)); gr.addColorStop(1, 'rgba(0,0,0,0)');
    wb.globalCompositeOperation = 'screen'; wb.fillStyle = gr; fill(wb);
  }
  // black level: lift the painting's near-black cloth to the world's ambient
  wb.globalCompositeOperation = 'screen'; wb.fillStyle = rgba(lift); fill(wb);
  // hold everything to the plate's own silhouette
  // (through one mask: a figure drawn in several parts would otherwise keep only its last part)
  wr.globalCompositeOperation = 'source-over'; F.plate(wr); wr.setTransform(1, 0, 0, 1, 0, 0);
  wb.globalCompositeOperation = 'destination-in'; blit(wb, WR);
  // the world's rim light on the edges that face it (a crisp line, a softer falloff)
  if (rim.k > 0.02) {
    const rl = Math.hypot(rim.x, rim.y) || 1, ux = rim.x / rl, uy = rim.y / rl;
    const rs = o.rimScale ?? hw;
    for (const [d, a] of [[clamp(rs * 0.006, 1.2, 3), 0.4], [rs * 0.045, 0.12]]) {
      wr.globalCompositeOperation = 'source-over'; wr.setTransform(1, 0, 0, 1, 0, 0); wr.clearRect(Q.x, Q.y, Q.w, Q.h);
      wr.filter = 'brightness(0)'; blit(wr, WB); wr.filter = 'none';
      wr.globalCompositeOperation = 'source-in'; wr.fillStyle = rgba(rim.col); fill(wr);
      wr.globalCompositeOperation = 'destination-out'; blit(wr, WB, -ux * d * S, -uy * d * S);
      wb.globalCompositeOperation = 'lighter'; wb.globalAlpha = a * rim.k; blit(wb, WR); wb.globalAlpha = 1;
      if (a > 0.3) { wg.globalCompositeOperation = 'lighter'; wg.globalAlpha = 0.22 * rim.k; blit(wg, WR); wg.globalAlpha = 1; }
    }
  }
  // head only: feather the figure out below the collar
  const cut = (c) => {
    if (!o.cut) return;
    const ca = Math.cos(roll), sa = Math.sin(roll);
    const p0 = [(vx - sa * o.cut[0] * hw) * S + M, (vy + ca * o.cut[0] * hw) * S + M], p1 = [(vx - sa * o.cut[1] * hw) * S + M, (vy + ca * o.cut[1] * hw) * S + M];
    const gr = c.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
    gr.addColorStop(0, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-in'; c.fillStyle = gr; fill(c);
    c.globalCompositeOperation = 'source-over';
  };
  // fog: distance takes the figure toward the world's haze
  if (fog > 0) { wb.globalCompositeOperation = 'source-atop'; wb.fillStyle = rgba(fogCol, fog); fill(wb); }
  wb.globalCompositeOperation = 'source-over';

  // ---- 2. light: the trim, the status bars, the face -----------------------------------------
  const fk = 1 - fog * 0.7;
  const glowK = (o.glowK ?? 1) * fk;
  // the emissive trim: back to full strength in the base (the grade must not dim a light source),
  // and into the glow layer
  wb.globalCompositeOperation = 'lighter'; wb.globalAlpha = 0.3 * (o.trimK ?? 1) * fk; F.trim(wb);
  wg.globalCompositeOperation = 'lighter'; wg.globalAlpha = 0.7 * (o.trimK ?? 1) * glowK; F.trim(wg);
  // the status bars, lit with the state
  const sI = (o.statusI ?? 1) * fk;
  if (sI > 0) F.status(wb, wg, sI, glowK);
  wb.globalAlpha = 1; wg.globalAlpha = 1;
  // the face: the visor frame on screen (never mirrored, so glyphs read the right way round)
  if (o.face) {
    const ang = F.ang;
    const ledI = (o.ledI ?? 1) * fk;
    for (const c of [wb, wg]) {
      c.save(); c.setTransform(S, 0, 0, S, M, M); c.translate(vx, vy); c.rotate(ang); c.scale(hw * (o.faceSx ?? 1), hw);
      c.beginPath(); c.ellipse(META.face.c[0], META.face.c[1], META.face.r[0], META.face.r[1], 0, 0, TAU); c.clip();
    }
    // the display's light on the glass around it
    wb.globalCompositeOperation = 'lighter';
    const sp = wb.createRadialGradient(0, 0.05, 0.05, 0, 0.05, 0.95);
    sp.addColorStop(0, rgba(led, 0.1 * ledI)); sp.addColorStop(1, 'rgba(0,0,0,0)');
    wb.fillStyle = sp; wb.fillRect(-1.2, -1, 2.4, 2);
    const dots = faceDots(o.face, L), p = L.pitch;
    const mouth = col3(o.mouthLed, led);
    for (const v of [1, 2]) {
      const c = v === 1 ? led : mouth;
      // a soft halo, the dot, its hot core
      wb.fillStyle = rgba(c, 0.12 * ledI); wb.beginPath();
      for (const d of dots) if (d[2] === v) { wb.moveTo(d[0] + p * 0.75, d[1]); wb.arc(d[0], d[1], p * 0.75, 0, TAU); }
      wb.fill();
      wb.globalCompositeOperation = 'source-over';
      wb.fillStyle = rgba(hot(c, 0.6), Math.min(1, ledI)); wb.beginPath();
      for (const d of dots) if (d[2] === v) { wb.moveTo(d[0] + p * 0.36, d[1]); wb.arc(d[0], d[1], p * 0.36, 0, TAU); }
      wb.fill();
      wb.globalCompositeOperation = 'lighter';
      wg.fillStyle = rgba(c, Math.min(1, 0.9 * ledI) * glowK); wg.beginPath();
      for (const d of dots) if (d[2] === v) { wg.moveTo(d[0] + p * 0.55, d[1]); wg.arc(d[0], d[1], p * 0.55, 0, TAU); }
      wg.fill();
    }
    for (const c of [wb, wg]) c.restore();
  }
  for (const c of [wb, wg]) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
  cut(wb); cut(wg);

  // ---- 3. into the scene: depth blur, the glow occluder, the light --------------------------
  const { b, g } = R;
  const blur = (o.blur || 0) * S;
  const al = o.alpha ?? 1;
  for (const c of [b, g]) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = al; if (blur > 0.3) c.filter = `blur(${blur.toFixed(2)}px)`; }
  blit(b, WB, 0, 0, M);
  // the figure blocks the glow behind it; its own light goes on top
  g.save(); g.filter = `${blur > 0.3 ? `blur(${blur.toFixed(2)}px) ` : ''}brightness(0)`; g.globalAlpha = al * (1 - fog * 0.6); blit(g, WB, 0, 0, M); g.restore();
  g.globalCompositeOperation = 'lighter'; blit(g, WG, 0, 0, M);
  for (const c of [b, g]) c.restore();
  return { vx, vy, hw, ang: F.ang };
}

// the work canvases' margin (device px), for callers that place things in them
export const workMargin = (R) => Math.round(48 * R.S);
export { hot, col3 };
