// YOCHI × ELYSIUM, landscape: the two marks on one sheet of washi.
//
//   always      Bokashi: one pale wash of sumi soaking through the sheet, with a slightly darker tide line at its
//               edge where the pigment settles, drifting slowly. One field at one pace across the whole card; it
//               is lightest through the band that carries the marks and the type. The Elysium crest floats on
//               the sheet with a slow 6 s breath.
//   0.00        CONTACT. The seal lands (frame 0): the impact shake, drops flung, and the wash blooms out a little
//               around the seal, as if the stamp's ink is running into it. The bloom settles back over ~5 s.
//   0.0-3.4     The impression wicks into the fibre and dries (as in the 4:5 card).
//   5.30-5.86   The breath: the hanko lifts toward the lens, its shadow opening under it.
//   5.86-6.00   The slam into contact at 6.00 = 0.00.
//
// Every frame is a pure function of t mod LOOP. The wash drifts along a closed loop through its noise field
// (offsets on a circle, one turn per LOOP), so frame 180 would be frame 0 exactly.
import { clamp, lerp, E, mulberry32, noise2 } from './core/math.js';
import { PAPER, F } from './lib/brand.js';
import { paper, text, label, measure, impactK, loadImage, mk } from './lib/draw.js';
import { LOOP } from './loop.js';
export { LOOP };

const LIFT0 = LOOP - 0.7, LIFT1 = LOOP - 0.14;
const LIFT_S = 1.16, LIFT_R = -16, REST_R = -6;

// Layout on the 1920 × 1080 stage.
export const L = {
  sealX: 640, sealY: 400, seal: 300,      // Yochi hanko
  elyX: 1280, elyY: 400, ely: 338,        // Elysium crest (a circle reads smaller than a square of the same width)
  crossY: 400,
  nameY: 672, nameSize: 92,               // YOCHI / ELYSIUM under their marks
  liveY: 826, liveSize: 50,               // LIVE ON ELYSIUM TESTNET
  urlY: 922, urlSize: 64,                 // testnet.yochigg.xyz
};

// ------------------------------------------------------------------------------------------------- the wash
// Worked out at quarter resolution each frame and drawn up with smoothing, so its edges come out soft, like dilute
// ink in paper fibre. Domain-warped value noise; every offset moves on a circle that turns once per LOOP.
// Opacity multiplier for comparison renders only (?wash=1.07). Default 1: the approved card, unchanged.
const WASH_GAIN = +(new URLSearchParams(location.search).get('wash') || 1);
const WASH = {
  q: 4,                 // quarter resolution
  scale: 560,           // px per noise unit (big, slow shapes)
  warp: 240,            // px of domain warp
  drift: 0.16,          // radius of the drift circle, noise units (≈90 px)
  level: 0.02,          // where the wash starts (noise is in -1..1)
  body: 0.075,          // alpha of the wash's body
  tide: 0.03,           // extra alpha along its edge
  ink: [42, 34, 25],    // warm sumi
  bloom: 0.3,           // how far the impact pushes the level down at the seal
  bloomR: 330,          // and over what radius
};
let WC = null, WD = null, WF = null;
function drawWash(c, u) {
  const q = WASH.q, w = 1920 / q, h = 1080 / q;
  if (!WC) {
    WC = mk(w, h); WD = WC.getContext('2d').createImageData(w, h);
    // the weighting is static: lighter through the band that carries the marks and the type, fuller to the edges
    WF = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const nx = (x * q - 960) / 960, ny = (y * q - 560) / 540;
      WF[y * w + x] = clamp(0.35 + 0.75 * (nx * nx * 0.7 + ny * ny * 1.1));
    }
  }
  const ph = (u / LOOP) * Math.PI * 2, cs = Math.cos(ph), sn = Math.sin(ph), D = WASH.drift;
  // the bloom: rises over 0.8 s after contact, settles by 5.2 s; zero at both ends of the loop
  const bl = E.outCubic(clamp(u / 0.8)) * (1 - E.inOutSine(clamp((u - 0.8) / 4.4)));
  const d = WD.data, [ir, ig, ib] = WASH.ink, S = WASH.scale;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = x * q, Y = y * q, U = X / S, V = Y / S;
    const wx = noise2(U * 0.8 + 3.1 + cs * D, V * 0.8 + sn * D);
    const wy = noise2(U * 0.8 - 5.7 - sn * D, V * 0.8 + 2.3 + cs * D);
    const Uw = U + wx * WASH.warp / S, Vw = V + wy * WASH.warp / S;
    const n = noise2(Uw + cs * D * 1.4, Vw + sn * D * 1.4) * 0.7 + noise2(Uw * 3.2 + 9 - sn * D, Vw * 3.2 + cs * D) * 0.3;
    const dx = X - L.sealX, dy = Y - L.sealY;
    const lev = WASH.level - bl * WASH.bloom * Math.exp(-(dx * dx + dy * dy) / (2 * WASH.bloomR * WASH.bloomR));
    const f = n - lev;
    let a = 0;
    if (f > -0.03) {
      const g = Math.exp(-(dx * dx + dy * dy) / (2 * WASH.bloomR * WASH.bloomR));
      a = WASH.body * E.inOutSine(clamp(f / 0.3)) + WASH.tide * Math.exp(-Math.pow((f - 0.03) / 0.05, 2));
      a *= Math.max(WF[y * w + x], bl * g * 0.9) * WASH_GAIN;
    }
    const i = (y * w + x) * 4;
    d[i] = ir; d[i + 1] = ig; d[i + 2] = ib; d[i + 3] = 255 * a;
  }
  WC.getContext('2d').putImageData(WD, 0, 0);
  c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.filter = 'blur(3px)';
  c.drawImage(WC, 0, 0, 1920, 1080);
  c.restore();
}

// ------------------------------------------------------------------------------------------------- the marks
const A = {};
const N = 900;
export async function initCard() {
  A.seal = await loadImage('assets/logo/yochi-seal-paper.svg');
  A.ely = await loadImage('assets/elysium/elysium-logomark-colorized.svg');
  A.sealTex = sealTexture(A.seal);
  A.bleed = bleedTexture();
}

// the seal with the hanko's stamp texture (as in the 4:5 card)
function sealTexture(img) {
  const cv = mk(N, N), c = cv.getContext('2d');
  c.drawImage(img, 0, 0, N, N);
  const h = mk(N, N), hc = h.getContext('2d'), id = hc.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const v = noise2(x / 2.4, y / 2.4) * 0.5 + noise2(x / 7.5, y / 7.5) * 0.3 + noise2(x / 50, y / 50) * 0.45;
    id.data[(y * N + x) * 4 + 3] = v > 0.5 ? clamp((v - 0.5) * 5) * 255 : 0;
  }
  hc.putImageData(id, 0, 0);
  c.globalCompositeOperation = 'destination-out'; c.globalAlpha = 0.8; c.drawImage(h, 0, 0);
  return cv;
}
// the wicking along the washi fibre (as in the 4:5 card)
function bleedTexture() {
  const n = 500, pad = 0.12, out = { pad };
  for (const [key, reach, cut] of [['near', 0.022, 0.42], ['far', 0.06, 0.56]]) {
    const cv = mk(n, n), c = cv.getContext('2d'), id = c.createImageData(n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const sx = -pad + (x / n) * (1 + 2 * pad), sy = -pad + (y / n) * (1 + 2 * pad);
      const qx = Math.max(Math.abs(sx - 0.5) - 0.34, 0), qy = Math.max(Math.abs(sy - 0.5) - 0.34, 0);
      const d = Math.hypot(qx, qy) - 0.12;
      if (d < -0.01) continue;
      const fib = noise2(sx * 9, sy * 150) * 0.55 + noise2(sx * 30, sy * 300 + 7) * 0.3 + noise2(sx * 4, sy * 22 + 3) * 0.4;
      const fall = Math.exp(-Math.max(0, d) / reach);
      const v = fall * (0.55 + 0.45 * fib) - (1 - fall) * 0.25;
      id.data[(y * n + x) * 4 + 3] = 255 * clamp((v - (1 - cut) * 0.5) / 0.35) * clamp(1 + d / 0.01);
    }
    c.putImageData(id, 0, 0);
    out[key] = cv;
  }
  return out;
}
const TINT = new Map();
function tinted(src, col) {
  const key = (src === A.sealTex ? 's' : src === A.bleed.near ? 'n' : src === A.bleed.far ? 'f' : '?') + col;
  if (TINT.has(key)) return TINT.get(key);
  const cv = mk(src.width, src.height), c = cv.getContext('2d');
  c.drawImage(src, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = col; c.fillRect(0, 0, cv.width, cv.height);
  TINT.set(key, cv); return cv;
}
function drawImg(c, img, x, y, size, r, s, alpha = 1) {
  c.save(); c.translate(x, y); c.rotate(r * Math.PI / 180); c.scale(s, s); c.globalAlpha *= alpha;
  c.drawImage(img, -size / 2, -size / 2, size, size);
  c.restore();
}
function pose(u) {
  if (u >= LIFT0 && u < LIFT1) {
    const k = E.inOutSine((u - LIFT0) / (LIFT1 - LIFT0));
    return { s: lerp(1, LIFT_S, k), r: lerp(REST_R, LIFT_R, k), h: k };
  }
  if (u >= LIFT1) {
    const k = E.inCubic((u - LIFT1) / (LOOP - LIFT1));
    return { s: lerp(LIFT_S, 1, k), r: lerp(LIFT_R, REST_R, k), h: 1 - k };
  }
  const k = clamp(u / 0.3);
  const s = k < 0.35 ? lerp(1, 0.94, E.outQuad(k / 0.35)) : k < 0.7 ? lerp(0.94, 1.02, E.inOutSine((k - 0.35) / 0.35)) : lerp(1.02, 1, E.inOutSine((k - 0.7) / 0.3));
  return { s, r: REST_R + (1 - E.outCubic(k)) * 1.2, h: 0 };
}

const DROPS = (() => {
  const rnd = mulberry32(4711), out = [];
  for (let i = 0; i < 10; i++) {
    const a = rnd() * Math.PI * 2, d = 0.6 + rnd() * rnd() * 0.4, r = 1.4 + rnd() * rnd() * 5.5;
    out.push({ a, d, r, e: rnd() < 0.45 ? 1.6 + rnd() * 1.6 : 1, sat: rnd() < 0.5 });
  }
  return out;
})();
function drops(c, X, Y, S, u) {
  const soak = E.inOutSine(clamp((u - 1.2) / 3.0));
  if (soak >= 1) return;
  const fly = E.outCubic(clamp(u / 0.06));
  c.save(); c.fillStyle = PAPER.red;
  for (const d of DROPS) {
    const dist = S * d.d * (0.85 + 0.15 * fly);
    c.globalAlpha = fly * (1 - soak) * 0.92;
    c.save(); c.translate(X + Math.cos(d.a) * dist, Y + Math.sin(d.a) * dist); c.rotate(d.a);
    const r = d.r * (1 + 0.25 * soak);
    c.beginPath(); c.ellipse(0, 0, r * d.e, r, 0, 0, Math.PI * 2); c.fill();
    if (d.sat) { c.beginPath(); c.arc(r * d.e + r * 1.3, 0, r * 0.38, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  c.restore();
}
let SHEEN = null;
function sheen(c, x, y, size, r, s, wet) {
  const n = 600;
  SHEEN = SHEEN || mk(n, n);
  const g = SHEEN.getContext('2d');
  g.globalCompositeOperation = 'copy'; g.drawImage(A.sealTex, 0, 0, n, n);
  g.globalCompositeOperation = 'source-in';
  const grd = g.createLinearGradient(0, 0, n, n);
  grd.addColorStop(0.16, 'rgba(255,240,225,0)'); grd.addColorStop(0.3, 'rgba(255,240,225,0.6)'); grd.addColorStop(0.44, 'rgba(255,240,225,0)');
  g.fillStyle = grd; g.fillRect(0, 0, n, n);
  drawImg(c, SHEEN, x, y, size, r, s, 0.2 * wet * wet);
}

function drawSeal(b, u) {
  const p = pose(u), { sealX: X, sealY: Y, seal: S } = L;
  if (p.h === 0) {
    const dry = E.inOutSine(clamp((u - 0.6) / 3.2)), creep = E.outCubic(clamp(u / 1.5));
    const BS = S * (1 + 2 * A.bleed.pad);
    drawImg(b, tinted(A.bleed.near, PAPER.red), X, Y, BS, p.r, p.s, lerp(0.75, 0.32, dry));
    drawImg(b, tinted(A.bleed.far, PAPER.red), X, Y, BS * lerp(0.97, 1, creep), p.r, p.s, creep * lerp(0.45, 0.1, dry));
    drawImg(b, A.sealTex, X, Y, S, p.r, p.s);
    const wet = 1 - E.inOutSine(clamp(u / 3.4));
    if (wet > 0.002) { drawImg(b, tinted(A.sealTex, '#9e2516'), X, Y, S, p.r, p.s, 0.38 * wet); sheen(b, X, Y, S, p.r, p.s, wet); }
    drops(b, X, Y, S, u);
  } else {
    drawImg(b, A.sealTex, X, Y, S, REST_R, 1, 0.14 * p.h);
    b.save(); b.filter = `blur(${lerp(3, 22, p.h)}px)`;
    drawImg(b, tinted(A.sealTex, '#3c2814'), X + 10 * p.h, Y + 22 * p.h, S, p.r, lerp(1, 1.05, p.h), lerp(0.04, 0.17, p.h));
    b.restore();
    drawImg(b, A.sealTex, X, Y - 16 * p.h, S, p.r, p.s);
  }
}

// The Elysium crest floats on the sheet: a slow 6 s breath (2.5 px, a quarter of a degree). The asset itself is
// drawn as supplied: no recolouring, no redrawing.
function drawCrest(b, u) {
  const { elyX: X, elyY: Y, ely: D } = L;
  const ph = (u / LOOP) * Math.PI * 2;
  const dy = Math.sin(ph) * 2.5, rot = Math.sin(ph + 1.1) * 0.25;
  // its shadow on the sheet: very soft, breathing with it
  b.save(); b.filter = 'blur(14px)'; b.globalAlpha = 0.1;
  b.fillStyle = '#3c2814'; b.beginPath(); b.arc(X + 6, Y + 14 - dy * 0.3, D * 0.48, 0, Math.PI * 2); b.fill();
  b.restore();
  drawImg(b, A.ely, X, Y + dy, D, rot, 1);
}

export function renderCard(t, R, P) {
  const { b, VW } = R;
  const u = ((t % LOOP) + LOOP) % LOOP;
  paper(R);
  const [ix, iy] = impactK(u, 0.7);
  b.save(); b.translate(ix, iy);
  drawWash(b, u);
  drawCrest(b, u);
  drawSeal(b, u);
  // × between the marks
  text(b, '×', VW / 2, L.crossY + 26, { font: F.dela(76), color: PAPER.muted, align: 'center' });
  // the names, each under its mark
  text(b, 'YOCHI', L.sealX, L.nameY, { font: F.dela(L.nameSize), color: PAPER.ink, align: 'center', track: 3 });
  text(b, 'ELYSIUM', L.elyX, L.nameY, { font: F.dela(L.nameSize), color: PAPER.ink, align: 'center', track: 3 });
  label(b, 'LIVE ON ELYSIUM TESTNET', VW / 2, L.liveY, { size: L.liveSize, color: PAPER.ink, align: 'center', weight: 800 });
  text(b, 'testnet.yochigg.xyz', VW / 2, L.urlY, { font: F.mono(L.urlSize, 800), color: PAPER.redText, align: 'center' });
  b.restore();
}
