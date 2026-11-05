// YOCHI × ELYSIUM: the living announcement card.
//
// One sheet of washi, everything on it legible on every frame. The only thing that moves is the Yochi hanko:
//
//   0.00        CONTACT. The seal lands on the loop point (frame 0 is the impact, so the feed thumbnail and a
//               viewer arriving mid-scroll both get the stamped card). The sheet takes the brand's impact shake.
//   0.00-3.40   The ink settles. The impression is wet (deeper, with a faint sheen) and wicks out along the paper
//               fibre; over the next seconds it dries to flat vermilion, the wicking fades to a rim, and the drops
//               flung at impact soak in.
//   3.40-4.30   Stillness.
//   4.30-4.86   The breath: the hanko lifts off the sheet toward the lens, turning, its shadow opening up under
//               it, the impression it leaves showing faintly.
//   4.86-5.00   The slam, accelerating into contact at 5.00 = 0.00.
//
// Every frame is a pure function of t mod LOOP, so the loop is exact: frame 150 would be frame 0.
import { clamp, lerp, E, mulberry32, noise2 } from './core/math.js';
import { PAPER, F } from './lib/brand.js';
import { paper, text, label, measure, impactK, loadImage, mk } from './lib/draw.js';
import { LOOP } from './loop.js';
export { LOOP };

const LIFT0 = 4.3, LIFT1 = 4.86;   // the breath
const LIFT_S = 1.22, LIFT_R = -17; // how far it lifts (scale toward the lens) and turns
const REST_R = -6;

// Layout on the 1080 × 1350 stage. The lifted hanko's extent is kept clear of every line of type.
export const L = {
  sealX: 540, sealY: 372, seal: 420,
  eyebrowY: 720,                        // NOW PLAYABLE
  lockY: 836, lockSize: 116,            // YOCHI × ELYSIUM
  ruleY: 902,
  playY: 1010, playSize: 70,            // PLAY FREE ON TESTNET
  urlY: 1110, urlSize: 58,              // testnet.yochigg.xyz
  footY: 1262,                          // the small print
};

const A = {};
const N = 1000; // seal raster size

// The official Elysium logo, if one is dropped in (see README): assets/elysium/elysium-wordmark.svg.
// Without it the name is set in type. No substitute mark is ever drawn.
async function tryLoad(src) { try { return await loadImage(src); } catch { return null; } }

export async function initCard() {
  A.seal = await loadImage('assets/logo/yochi-seal-paper.svg');
  A.elysium = await tryLoad('assets/elysium/elysium-wordmark.svg');
  A.sealTex = sealTexture(A.seal);
  A.bleed = bleedTexture();
}

// The seal raster with the hanko's stamp texture (fine fractal holes, kept light so the Y stays crisp).
function sealTexture(img) {
  const cv = mk(N, N), c = cv.getContext('2d');
  c.drawImage(img, 0, 0, N, N);
  const h = mk(N, N), hc = h.getContext('2d'), id = hc.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const v = noise2(x / 2.6, y / 2.6) * 0.5 + noise2(x / 8, y / 8) * 0.3 + noise2(x / 55, y / 55) * 0.45;
    id.data[(y * N + x) * 4 + 3] = v > 0.5 ? clamp((v - 0.5) * 5) * 255 : 0;
  }
  hc.putImageData(id, 0, 0);
  c.globalCompositeOperation = 'destination-out'; c.globalAlpha = 0.8; c.drawImage(h, 0, 0);
  return cv;
}

// The wicking: ink creeping out of the impression along the washi's horizontal fibres. A soft falloff around the
// seal's square, broken by fibre-shaped noise (long in x, thin in y), so it reads as pigment in paper, not glow.
// Two rings: `near` (the rim, there at contact) and `far` (the slow creep).
function bleedTexture() {
  const n = 500, pad = 0.12, out = {};
  for (const [key, reach, cut] of [['near', 0.022, 0.42], ['far', 0.06, 0.56]]) {
    const cv = mk(n, n), c = cv.getContext('2d'), id = c.createImageData(n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      // seal units: the canvas spans [-pad, 1 + pad]
      const sx = -pad + (x / n) * (1 + 2 * pad), sy = -pad + (y / n) * (1 + 2 * pad);
      // distance outside the rounded square (x 0.04..0.96, r 0.12)
      const qx = Math.max(Math.abs(sx - 0.5) - (0.46 - 0.12), 0), qy = Math.max(Math.abs(sy - 0.5) - (0.46 - 0.12), 0);
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
  out.pad = pad;
  return out;
}

// A tinted copy of a raster, cached per (raster, colour).
const TINT = new Map();
function tinted(src, col) {
  const key = src === A.sealTex ? 's' + col : null;
  if (key && TINT.has(key)) return TINT.get(key);
  const cv = mk(src.width, src.height), c = cv.getContext('2d');
  c.drawImage(src, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = col; c.fillRect(0, 0, cv.width, cv.height);
  if (key) TINT.set(key, cv);
  return cv;
}

// the hanko's pose at loop time u: scale, rotation, height off the sheet (0 = on it)
function pose(u) {
  if (u >= LIFT0 && u < LIFT1) {
    const k = E.inOutSine((u - LIFT0) / (LIFT1 - LIFT0));
    return { s: lerp(1, LIFT_S, k), r: lerp(REST_R, LIFT_R, k), h: k };
  }
  if (u >= LIFT1) { // the slam: accelerating, all the way into contact at LOOP
    const k = E.inCubic((u - LIFT1) / (LOOP - LIFT1));
    return { s: lerp(LIFT_S, 1, k), r: lerp(LIFT_R, REST_R, k), h: 1 - k };
  }
  // after contact: the brand's settle (a squash under, a touch over, rest) in 0.3 s
  const k = clamp(u / 0.3);
  const s = k < 0.35 ? lerp(1, 0.94, E.outQuad(k / 0.35)) : k < 0.7 ? lerp(0.94, 1.02, E.inOutSine((k - 0.35) / 0.35)) : lerp(1.02, 1, E.inOutSine((k - 0.7) / 0.3));
  return { s, r: REST_R + (1 - E.outCubic(k)) * 1.2, h: 0 };
}

function drawImg(c, img, x, y, size, r, s, alpha = 1) {
  c.save(); c.translate(x, y); c.rotate(r * Math.PI / 180); c.scale(s, s); c.globalAlpha *= alpha;
  c.drawImage(img, -size / 2, -size / 2, size, size);
  c.restore();
}

export function renderCard(t, R, P) {
  const { b } = R;
  const u = ((t % LOOP) + LOOP) % LOOP;
  const p = pose(u);
  paper(R);
  // the impact shake on the stamped sheet (the brand's 0.38 s, softened: it repeats every loop)
  const [ix, iy] = impactK(u, 0.75);
  b.save(); b.translate(ix, iy);

  drawType(b, R);

  const { sealX: X, sealY: Y, seal: S } = L;
  if (p.h === 0) {
    // the wicking: the rim is there at contact, the creep spreads over ~1.5 s, then both dry back
    const dry = E.inOutSine(clamp((u - 0.6) / 3.2));
    const creep = E.outCubic(clamp(u / 1.5));
    const BS = S * (1 + 2 * A.bleed.pad);
    drawImg(b, tinted(A.bleed.near, PAPER.red), X, Y, BS, p.r, p.s, lerp(0.75, 0.32, dry));
    drawImg(b, tinted(A.bleed.far, PAPER.red), X, Y, BS * lerp(0.97, 1, creep), p.r, p.s, creep * lerp(0.45, 0.1, dry));
    // the impression
    drawImg(b, A.sealTex, X, Y, S, p.r, p.s);
    // wet: deeper and a little glossy at contact, drying to flat vermilion
    const wet = 1 - E.inOutSine(clamp(u / 3.4));
    if (wet > 0.002) {
      drawImg(b, tinted(A.sealTex, '#9e2516'), X, Y, S, p.r, p.s, 0.38 * wet);
      sheen(b, X, Y, S, p.r, p.s, wet);
    }
    drops(b, X, Y, S, u);
  } else {
    // lifted: the impression left behind shows faintly, the hanko's shadow opens up under it
    drawImg(b, A.sealTex, X, Y, S, REST_R, 1, 0.14 * p.h);
    b.save(); b.filter = `blur(${lerp(3, 24, p.h)}px)`;
    drawImg(b, tinted(A.sealTex, '#3c2814'), X + 12 * p.h, Y + 26 * p.h, S, p.r, lerp(1, 1.05, p.h), lerp(0.04, 0.17, p.h));
    b.restore();
    drawImg(b, A.sealTex, X, Y - 8 * p.h, S, p.r, p.s);
  }
  b.restore();
}

// Drops flung at impact: a handful, small, a few drawn out along their flight, soaking in (spreading a touch,
// fading) over the loop. Deterministic.
const DROPS = (() => {
  const rnd = mulberry32(4711), out = [];
  for (let i = 0; i < 11; i++) {
    const a = rnd() * Math.PI * 2, d = 0.6 + rnd() * rnd() * 0.42, r = 1.6 + rnd() * rnd() * 6.5;
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
    const x = X + Math.cos(d.a) * dist, y = Y + Math.sin(d.a) * dist;
    c.globalAlpha = fly * (1 - soak) * 0.92;
    c.save(); c.translate(x, y); c.rotate(d.a);
    const r = d.r * (1 + 0.25 * soak);
    c.beginPath(); c.ellipse(0, 0, r * d.e, r, 0, 0, Math.PI * 2); c.fill();
    if (d.sat) { c.beginPath(); c.arc(r * d.e + r * 1.3, 0, r * 0.38, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  c.restore();
}

// a soft highlight across the wet seal, clipped to the seal's own shape
let SHEEN = null;
function sheen(c, x, y, size, r, s, wet) {
  const n = 600;
  SHEEN = SHEEN || mk(n, n);
  const g = SHEEN.getContext('2d');
  g.globalCompositeOperation = 'copy';
  g.drawImage(A.sealTex, 0, 0, n, n);
  g.globalCompositeOperation = 'source-in';
  const grd = g.createLinearGradient(0, 0, n, n);
  grd.addColorStop(0.16, 'rgba(255,240,225,0)');
  grd.addColorStop(0.3, 'rgba(255,240,225,0.6)');
  grd.addColorStop(0.44, 'rgba(255,240,225,0)');
  g.fillStyle = grd; g.fillRect(0, 0, n, n);
  drawImg(c, SHEEN, x, y, size, r, s, 0.2 * wet * wet);
}

function drawType(b, R) {
  const { VW } = R;
  label(b, 'NOW PLAYABLE', VW / 2, L.eyebrowY, { size: 30, color: PAPER.muted, align: 'center' });
  // the lockup: YOCHI × ELYSIUM, fitted to the margins
  const fs = L.lockSize, font = F.dela(fs), gap = fs * 0.32, xs = fs * 0.6;
  const wY = measure(b, 'YOCHI', font, 2), wX = measure(b, '×', F.dela(xs)), wE = elysiumWidth(b, font, fs);
  const total = wY + gap + wX + gap + wE, k = Math.min(1, (VW - 2 * 84) / total), w = total * k;
  b.save(); b.translate(VW / 2, L.lockY); b.scale(k, k);
  let x = -total / 2;
  text(b, 'YOCHI', x, 0, { font, color: PAPER.ink, track: 2 }); x += wY + gap;
  text(b, '×', x, -fs * 0.08, { font: F.dela(xs), color: PAPER.muted }); x += wX + gap;
  drawElysium(b, x, 0, font, fs);
  b.restore();
  b.save(); b.fillStyle = PAPER.ink; b.globalAlpha = 0.85; b.fillRect(VW / 2 - w / 2, L.ruleY, w, 3); b.restore();
  text(b, 'PLAY FREE ON TESTNET', VW / 2, L.playY, { font: F.dela(L.playSize), color: PAPER.ink, align: 'center', track: 1, maxW: w });
  text(b, 'testnet.yochigg.xyz', VW / 2, L.urlY, { font: F.mono(L.urlSize, 800), color: PAPER.redText, align: 'center' });
  // the small print: which network, and that nothing real is at stake
  label(b, 'ELYSIUM TESTNET  ·  NO REAL MONEY', VW / 2, L.footY, { size: 29, color: PAPER.muted, align: 'center' });
}

// ELYSIUM: the official wordmark if it has been supplied, otherwise the name set in the card's display type.
function elysiumWidth(b, font, fs) {
  if (A.elysium) return (A.elysium.naturalWidth / A.elysium.naturalHeight) * fs * 0.78;
  return measure(b, 'ELYSIUM', font, 2);
}
function drawElysium(b, x, y, font, fs) {
  if (A.elysium) {
    const h = fs * 0.78, w = (A.elysium.naturalWidth / A.elysium.naturalHeight) * h;
    b.drawImage(A.elysium, x, y - h, w, h);
    return;
  }
  text(b, 'ELYSIUM', x, y, { font, color: PAPER.ink, track: 2 });
}
