// YOCHI × ELYSIUM, landscape: the two marks on one sheet of washi, joined by suminagashi.
//
// Suminagashi is ink floated on water in concentric rings: each new drop at the centre pushes every ring before it
// outward, so the rings spread fast near the source, slow as they travel, and tighten into fine lines. Here the
// source is the Yochi hanko and the water is the sheet:
//
//   always      A new pale ring of sumi wells out from under each mark every 1 s and drifts outward
//               (area-conserving: r² grows at a constant rate), across the sheet, under the Elysium wave crest,
//               off the edge. The crest floats on the sheet with a slow 6 s breath.
//   0.00        CONTACT. The seal lands (frame 0). The impact shake; drops flung; a loaded, darker ring is born;
//               and the impact pushes a pulse of extra area through every ring on the sheet, so the whole field
//               jumps outward and the wave reaches the Elysium mark.
//   0.0-3.4     The impression wicks into the fibre and dries (as in the 4:5 card).
//   5.30-5.86   The breath: the hanko lifts toward the lens, its shadow opening under it.
//   5.86-6.00   The slam into contact at 6.00 = 0.00.
//
// Every frame is a pure function of t mod LOOP. Ring births (every 1 s) and impacts (every 6 s) are both
// periodic in LOOP, and a ring's shape is keyed to its slot in the loop, so frame 180 would be frame 0 exactly.
import { clamp, lerp, E, mulberry32, noise2, hash1 } from './core/math.js';
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

// ------------------------------------------------------------------------------------------------- suminagashi
// Two sources of equal strength: ink wells out from under the hanko and from under the crest. A ring is a loop of
// particles born around its source; it is carried by the two-source potential flow
//     v(x) = Σ Q_i(t) / 2π · (x − c_i) / |x − c_i|²
// integrated (RK2) from its birth to now, so rings from the two marks meet and flatten against each other along
// the line between them, where the × sits. The impact surges the Yochi source (an extra J px² over 0.7 s); the
// Elysium source runs a touch stronger all loop so that each injects the same area per loop and the boundary
// breathes back. A ring's state depends only on its age and its slot in the loop, so the field is periodic.
const RING = {
  every: 1.0,         // a ring is born at each source this often (LOOP must be a multiple)
  width: 30,          // birth width of a ring, px
  K: 70000,           // area (px²/s) the Yochi source adds between impacts
  J: 150000,          // the impact's surge, px²
  jT: 0.7,            // over this long
  life: 11,           // seconds a ring is drawn for
  dt: 0.1,            // integration step
  pts: 420,           // particles per ring edge
};
const SRC = [
  { x: L.sealX, y: L.sealY, born: 150, ink: '#2a2219', key: 'y' },  // warm sumi from the hanko
  { x: L.elyX, y: L.elyY, born: 164, ink: '#1e3236', key: 'e' },    // the same ink, a cooler wash, from the crest
];
const SLOTS = Math.round(LOOP / RING.every);
const SLOT = Array.from({ length: SLOTS }, (_, j) => {
  const h = hash1(j * 7.31 + 2), h2 = hash1(j * 3.17 + 9);
  return { dens: 0.55 + 0.5 * h, w: h2 < 0.25 ? 2.2 : 0.55 + 0.9 * h2, seed: j * 5.71 + 1.3 };
});
// source strengths at time t (periodic)
const surge = (x) => (x <= 0 || x >= RING.jT ? 0 : 3 * Math.pow(1 - x / RING.jT, 2) / RING.jT);
const QY = (t) => RING.K + RING.J * surge(((t % LOOP) + LOOP) % LOOP);
const QE = RING.K + RING.J / LOOP;
function vel(x, y, t, out) {
  let vx = 0, vy = 0;
  const q = [QY(t), QE];
  for (let i = 0; i < 2; i++) {
    const dx = x - SRC[i].x, dy = y - SRC[i].y, d2 = dx * dx + dy * dy + 1;
    const k = q[i] / (2 * Math.PI * d2);
    vx += k * dx; vy += k * dy;
  }
  out[0] = vx; out[1] = vy;
}

// one ring edge: particles born at radius r around source s at time tb, carried to time t
const V1 = [0, 0], V2 = [0, 0];
function edge(s, slot, r, tb, t, out) {
  const n = RING.pts, steps = Math.max(1, Math.ceil((t - tb) / RING.dt)), h = (t - tb) / steps;
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th);
    // the drop is never a perfect circle
    const rr = r * (1 + 0.035 * noise2(cs * 1.4 + slot.seed, sn * 1.4 + slot.seed) + 0.012 * noise2(cs * 4 + slot.seed, sn * 4));
    let x = s.x + cs * rr, y = s.y + sn * rr, tt = tb;
    for (let k = 0; k < steps; k++) {
      vel(x, y, tt, V1);
      vel(x + V1[0] * h * 0.5, y + V1[1] * h * 0.5, tt + h * 0.5, V2);
      x += V2[0] * h; y += V2[1] * h; tt += h;
    }
    out[i * 2] = x; out[i * 2 + 1] = y;
  }
  return out;
}

let RINGS = null;
const BUF_O = new Float32Array(RING.pts * 2), BUF_I = new Float32Array(RING.pts * 2);
function drawRings(c, u) {
  RINGS = RINGS || mk(1920, 1080);
  const g = RINGS.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, 1920, 1080);
  const j1 = Math.floor(u / RING.every + 1e-9), j0 = Math.ceil((u - RING.life) / RING.every);
  for (const s of SRC) {
    g.fillStyle = s.ink; g.strokeStyle = s.ink;
    for (let j = j0; j <= j1; j++) {
      const tb = j * RING.every, age = u - tb;
      if (age < 0) continue;
      const slot = SLOT[((j % SLOTS) + SLOTS) % SLOTS];
      // pale as it spreads; in over its first 0.4 s; out over its last 3 s
      // the ring the Yochi source sheds on the impact is the loaded one
      const loaded = s.key === 'y' && ((j % SLOTS) + SLOTS) % SLOTS === 0;
      const a = (loaded ? 0.1 : 0.052 * slot.dens) * clamp(age / 0.4) * E.inOutSine(clamp((RING.life - age) / 5));
      if (a <= 0.002) continue;
      const o = edge(s, slot, s.born + RING.width * (loaded ? 1.9 : slot.w), tb, u, BUF_O);
      const i = edge(s, slot, s.born, tb, u, BUF_I);
      const n = RING.pts;
      g.globalAlpha = a;
      g.beginPath();
      g.moveTo(o[0], o[1]); for (let k = 1; k < n; k++) g.lineTo(o[k * 2], o[k * 2 + 1]); g.closePath();
      g.moveTo(i[0], i[1]); for (let k = n - 1; k >= 0; k--) g.lineTo(i[k * 2], i[k * 2 + 1]); g.closePath();
      g.fill('evenodd');
      // the ink gathers at a ring's outer edge
      g.globalAlpha = a * 0.85; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(o[0], o[1]); for (let k = 1; k < n; k++) g.lineTo(o[k * 2], o[k * 2 + 1]); g.closePath(); g.stroke();
    }
  }
  c.save(); c.filter = 'blur(1.1px)'; c.drawImage(RINGS, 0, 0); c.restore();
}

// ------------------------------------------------------------------------------------------------- the marks
const A = {};
const N = 900;
export async function initCard() {
  A.seal = await loadImage('assets/logo/yochi-seal-paper.svg');
  A.ely = await loadImage('assets/elysium/elysium-mark.png');
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

// The Elysium crest floats on the sheet: a slow 6 s breath (2.5 px, a quarter of a degree), and a small lift when
// the impact's wave reaches it. The asset itself is drawn as supplied: no recolouring, no redrawing.
function drawCrest(b, u) {
  const { elyX: X, elyY: Y, ely: D } = L;
  const ph = (u / LOOP) * Math.PI * 2;
  const reach = 0.55; // about when the pushed field reaches the crest
  const wave = Math.sin(clamp((u - reach) / 0.9) * Math.PI) * (1 - clamp((u - reach) / 0.9) * 0.4);
  const dy = Math.sin(ph) * 2.5 - wave * 5, rot = Math.sin(ph + 1.1) * 0.25 + wave * 0.5;
  // its shadow on the sheet: very soft, breathing with it
  b.save(); b.filter = 'blur(14px)'; b.globalAlpha = 0.1 + 0.03 * wave;
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
  drawRings(b, u);
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
