// USDC HAS BEEN ELIMINATED, v3: v2's painted cast and Sumi look (the foundation), with v1's physical comedy back.
// The knockout is a clear cause and effect: the wallet prompts pile up on Paper Hands; a push-in on Perma-Bull's grin
// in silence; Paper Hands panics; ONE vermilion brush strike leaves Perma-Bull's fist and lands on him; impact freeze
// (paper flash, two ink-negative frames, shake); he is launched off frame in a burst of paperwork, the prompts
// shatter, and the last SIGN MESSAGE hangs in the air, still spinning, before it drops with a squeak. Gigantic K.O.
//
// Techniques ported from the 2.5D demo (demo-2p5d/, approach A): the bristle dry-brush slash (lib/slash.js), the
// paper-tinted ink-negative impact frame, the decaying-noise shake with a hard first kick, and the anticipation
// push. The paintings are never repainted, recoloured (bar the loss grey), cut apart or warped; every frame is a
// pure function of t. Exceptions to the motion guide are listed in 01-usdc-eliminated/v3/REPORT.md.
import { SUMI, PAPER, F } from '../../lib/brand.js';
import { paper, sumi, text, label, measure, stampK, impactK, slamK, splatter, seal, stampSeal, loadImage } from '../../lib/draw.js';
import { clamp, lerp, invLerp, E, mulberry32, shake, pulse, noise1 } from '../../core/math.js';
import { CAST, AVATAR, loadCast, avatarWindow, drawFace } from '../../lib/cast.js';
import { chart, makeCandles } from '../../lib/ui.js';
import { drawSlash, inkNegative } from '../../lib/slash.js';

export const META = { VW: 1920, VH: 1080, dur: 10 };
export const LOOK = { bloom: 0, halo: 0, glowDirect: 0, vignette: 0.22, grain: 0.022, ca: 0.0007, lift: [0, 0, 0], contrast: 1.0 };

export const COPY = {
  title: 'CHOOSE YOUR COLLATERAL',
  stage: 'STAGE · ELYSIUM',
  hype: { name: 'HYPE', sub: 'NATIVE · UNHINGED', tag: '1P · YOU' },
  usdc: { name: 'USDC', sub: 'STABLE · NEEDS APPROVAL', tag: 'CPU' },
  // the bureaucracy: USDC's own flow (swap into it, approve it, sign for it). The last one is the one left hanging.
  prompts: ['SWAP TO USDC', 'APPROVE USDC', 'SIGN MESSAGE', 'CONFIRM SWAP', 'APPROVE USDC', 'SIGN MESSAGE'],
  band: ['ON ELYSIUM', 'USDC HAS BEEN ELIMINATED'],
  lines: ['NO SWAPS', 'JUST HYPE'],
  live: 'NOW LIVE ON ELYSIUM',
  url: 'yochigg.xyz',
  small: '18+ · REAL-MONEY GAMEPLAY · PLAY RESPONSIBLY', // placeholder, as in the mainnet gameplay cut: counsel's wording goes here
};

const YOU = 'starter-perma-bull', CPU = 'starter-paper-hands';
const TILES = [YOU, CPU, 'starter-doomer', 'starter-night-shift', 'starter-degenerate', 'starter-fomo-v2'];
const FACE = { [YOU]: [740, 361], [CPU]: [960, 500] };   // painting px, measured
const FIST = [260, 561];

let T, IMG = {}, LK, CANDLES, HS, DROP;

export async function init(R) {
  T = await (await fetch(new URL('./timing.json', import.meta.url))).json();
  META.dur = T.dur;
  HS = T.hit + T.hitstop;     // the release: he leaves
  DROP = HS + T.hang;         // the hanging card drops
  await loadCast([YOU, CPU]);
  IMG.seal = await loadImage('assets/logo/yochi-seal-paper.svg');
  IMG.ely = await loadImage('assets/elysium/elysium-logomark-colorized.svg');
  CANDLES = makeCandles(17, 15, 41.6, 0.03, 0.002);
  const c = R.b, fs = 88, S = 180, es = 152, g1 = 32, g2 = 40;
  const wy = measure(c, 'YOCHI', F.dela(fs)), we = measure(c, 'ELYSIUM', F.dela(fs)), wx = 40;
  const total = S + g1 + wy + g2 + wx + g2 + es + g1 + we;
  let x = 960 - total / 2;
  LK = { fs, es, S, seal: x + S / 2 };
  x += S + g1; LK.yochi = x; x += wy + g2; LK.x = x + wx / 2; x += wx + g2; LK.ely = x; x += es + g1; LK.elyW = x;
}

// ============================================================================================ the painting in a panel
function painting(c, id, ox, oy, s, o = {}) {
  const C = CAST[id]; const [W, H] = C.j.paint; const [fx, fy, fw, fh] = C.j.fig;
  c.drawImage(C.plate, ox + (o.par || 0), oy, W * s, H * s);
  c.drawImage(C.fig, ox + fx * s, oy + fy * s, fw * s, fh * s);
}
function notchPath(c, x, y, w, h, notchRight) {
  const n = Math.min(w, h) * 0.12;
  c.beginPath();
  if (notchRight) { c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h - n); c.lineTo(x + w - n, y + h); c.lineTo(x, y + h); }
  else { c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h); c.lineTo(x + n, y + h); c.lineTo(x, y + h - n); }
  c.closePath();
}
// the whole painting (plate + figure) in a notched box; never shows the painting's outer 150 px (the matte's cleared
// frame and cut corners), always covers the box
function panelGeom(id, x, y, w, h, f, rx, ry, s) {
  const [W, H] = CAST[id].j.paint, m = 16 + 150 * s;
  s = Math.max(s, (w + 2 * m) / W, (h + 2 * m) / H);
  return { s, ox: clamp(x + w * rx - f[0] * s, x + w + m - W * s, x - m), oy: clamp(y + h * ry - f[1] * s, y + h + m - H * s, y - m) };
}
function panel(c, id, x, y, w, h, f, rx, ry, s, o = {}) {
  c.save();
  notchPath(c, x + 12, y + 12, w, h, o.notchRight); c.fillStyle = 'rgba(0,0,0,0.55)'; c.fill();
  notchPath(c, x, y, w, h, o.notchRight); c.fillStyle = PAPER.bg; c.fill();
  c.save(); c.clip();
  if (o.grey) c.filter = `grayscale(${o.grey}) contrast(${lerp(1, 0.75, o.grey)}) brightness(${lerp(1, 1.05, o.grey)})`;
  const g = panelGeom(id, x, y, w, h, f, rx, ry, s);
  painting(c, id, g.ox, g.oy, g.s, o);
  c.filter = 'none';
  c.restore();
  notchPath(c, x, y, w, h, o.notchRight);
  c.strokeStyle = o.edge || 'rgba(239,231,216,0.85)'; c.lineWidth = o.edgeW || 3; c.stroke();
  c.restore();
}

// ============================================================================================ 0.0 select (v2)
function selectScreen(R, t) {
  const b = R.b;
  sumi(R);
  text(b, COPY.title, 960, 150, { font: F.dela(84), color: SUMI.ink, align: 'center' });
  label(b, 'ELYSIUM', 960, 218, { size: 40, color: SUMI.muted, align: 'center' });
  const lockP1 = t >= T.p1Lock, lockCPU = t >= T.cpuLock;
  const push = 1 + 0.03 * (t / T.vs);
  const popL = 1 + pulse(t, T.p1Lock, 0.08) * 0.03, popR = 1 + pulse(t, T.cpuLock, 0.08) * 0.03;
  const P = [
    { id: YOU, x: 96, pop: popL, f: [560, 450], notchRight: true, edge: lockP1 ? SUMI.red : 'rgba(239,231,216,0.5)' },
    { id: CPU, x: 1304, pop: popR, f: [900, 560], notchRight: false, edge: lockCPU ? SUMI.muted : 'rgba(239,231,216,0.5)' },
  ];
  for (const p of P) {
    b.save();
    b.translate(p.x + 260, 560); b.scale(p.pop, p.pop); b.translate(-(p.x + 260), -560);
    panel(b, p.id, p.x, 250, 520, 620, p.f, 0.5, 0.42, 0.56 * push, { notchRight: p.notchRight, edge: p.edge, edgeW: 4, par: -10 * t });
    b.restore();
  }
  text(b, COPY.hype.name, 96, 975, { font: F.dela(110), color: SUMI.ink });
  label(b, COPY.hype.sub, 98, 1018, { size: 32, color: SUMI.muted });
  text(b, COPY.usdc.name, 1824, 975, { font: F.dela(110), color: SUMI.ink, align: 'right' });
  label(b, COPY.usdc.sub, 1822, 1018, { size: 32, color: SUMI.muted, align: 'right' });
  label(b, COPY.hype.tag, 98, 236, { size: 26, color: SUMI.red });
  if (t > T.p1Lock) label(b, COPY.usdc.tag, 1822, 236, { size: 26, color: SUMI.muted, align: 'right' });
  const ts = 150, gap = 20, gx = 960 - (3 * ts + 2 * gap) / 2, gy = 400;
  const at = (i) => [gx + (i % 3) * (ts + gap), gy + Math.floor(i / 3) * (ts + gap)];
  TILES.forEach((id, i) => {
    const [x, y] = at(i);
    b.fillStyle = SUMI.s2; b.fillRect(x, y, ts, ts);
    const [sx, sy, sd] = avatarWindow(id);
    b.save(); b.globalAlpha = i < 2 ? 1 : 0.32; if (i >= 2) b.filter = 'grayscale(0.6)';
    b.drawImage(AVATAR[id].img, sx, sy, sd, sd, x, y, ts, ts);
    b.restore();
    b.strokeStyle = SUMI.line; b.lineWidth = 2; b.strokeRect(x + 1, y + 1, ts - 2, ts - 2);
  });
  const p1 = t < T.p1Lock - 0.14 ? 1 : 0;
  const frame = (i, col, w) => { const [x, y] = at(i); b.strokeStyle = col; b.lineWidth = w; b.strokeRect(x - w / 2 - 4, y - w / 2 - 4, ts + w + 8, ts + w + 8); };
  if (lockCPU || (t > T.p1Lock && Math.floor(t * 16) % 2 === 0)) frame(1, SUMI.muted, 5);
  frame(p1, SUMI.red, 7);
  const [tx0, ty0] = at(p1);
  label(b, '1P', tx0, ty0 - 22, { size: 26, color: SUMI.red });
  if (t > T.p1Lock) { const [tx1, ty1] = at(1); label(b, 'CPU', tx1 + ts, ty1 - 22, { size: 26, color: SUMI.muted, align: 'right' }); }
  const [lx, ly] = at(0);
  stampSeal(b, '決', lx + ts - 6, ly + 10, 84, t, T.p1Lock, { tone: 'red', rest: 8, seed: 9 });
  const fl = Math.max(pulse(t, T.p1Lock, 0.05), pulse(t, T.cpuLock, 0.05) * 0.6);
  if (fl > 0.02) { b.fillStyle = `rgba(255,248,239,${fl * 0.4})`; b.fillRect(0, 0, 1920, 1080); }
}

// ============================================================================================ 0.8 versus band (v2)
function versus(R, t) {
  const b = R.b, d = t - T.vs;
  sumi(R);
  const u = E.outCubic(clamp(d / 0.18));
  const drift = d * 14;
  const push = 1 + 0.03 * clamp(d / 0.8);
  b.save(); b.translate(960, 540); b.scale(push, push); b.translate(-960, -540);
  panel(b, YOU, lerp(-800, 96, u) + drift, 110, 730, 650, FACE[YOU], 0.55, 0.4, 0.72, { notchRight: true, par: -12 * d, edge: SUMI.red, edgeW: 4 });
  panel(b, CPU, lerp(1920, 1094, u) - drift, 110, 730, 650, FACE[CPU], 0.45, 0.4, 0.72, { par: 12 * d, edgeW: 3 });
  b.restore();
  const bu = E.outCubic(clamp((d - 0.06) / 0.16));
  const by = 640, bh = 260;
  b.save();
  b.beginPath(); b.rect(960 - 960 * bu, by - 40, 1920 * bu, bh + 80); b.clip();
  b.fillStyle = 'rgba(0,0,0,0.55)'; b.fillRect(0, by + 12, 1920, bh);
  b.fillStyle = SUMI.band; b.fillRect(0, by, 1920, bh);
  text(b, COPY.hype.name, 150, by + 172, { font: F.dela(124), color: PAPER.ink });
  text(b, COPY.usdc.name, 1770, by + 172, { font: F.dela(124), color: PAPER.ink, align: 'right' });
  const su = E.outCubic(clamp((d - 0.14) / 0.12));
  if (su > 0) {
    const sw = 230, sk = bh * 0.42, cx = 960;
    b.fillStyle = SUMI.red; b.beginPath();
    b.moveTo(cx - sw / 2 + sk, by - 30 * su); b.lineTo(cx + sw / 2 + sk, by - 30 * su);
    b.lineTo(cx + sw / 2 - sk, by + bh + 30 * su); b.lineTo(cx - sw / 2 - sk, by + bh + 30 * su); b.closePath(); b.fill();
    text(b, '対', cx, by + bh * 0.5 + 52, { font: F.glyph(150), color: SUMI.onRed, align: 'center', alpha: clamp((d - 0.2) / 0.06) });
  }
  b.restore();
  label(b, COPY.stage, 960, 985, { size: 40, color: SUMI.muted, align: 'center', alpha: clamp((d - 0.25) / 0.1) });
  const f = pulse(t, T.vs, 0.06);
  if (f > 0.02) { b.fillStyle = `rgba(255,248,239,${f * 0.5})`; b.fillRect(0, 0, 1920, 1080); }
}

// ============================================================================================ the stage
const PL = { x: 96, y: 236, w: 520, h: 640 }, PR = { x: 1304, y: 236, w: 520, h: 640 };
const PB_F = [560, 470], PH_F = [900, 580];
// where things are on the stage at painting scale 0.6
// measured through the same geometry the panels use (the coverage clamp moves the painting)
const fistAt = (lean) => { const g = panelGeom(YOU, PL.x + lean, PL.y, PL.w, PL.h, PB_F, 0.5, 0.42, 0.6); return [g.ox + FIST[0] * g.s, g.oy + FIST[1] * g.s]; };
const phFace = () => { const g = panelGeom(CPU, PR.x, PR.y, PR.w, PR.h, PH_F, 0.5, 0.42, 0.6); return [g.ox + FACE[CPU][0] * g.s, g.oy + FACE[CPU][1] * g.s]; };
const PH_CHEST = [1650, 660];

function hud(b, t) {
  const hpU = t < T.hit ? 1 : 0;
  const lagU = t < HS ? 1 : 1 - E.inOutCubic(invLerp(HS + 0.1, HS + 0.6, t));
  const bw = 690, bh = 40, y = 74;
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? 960 - 120 - bw : 960 + 120;
    b.fillStyle = 'rgba(0,0,0,0.6)'; b.fillRect(x0 - 5, y - 5, bw + 10, bh + 10);
    b.fillStyle = SUMI.s2; b.fillRect(x0, y, bw, bh);
    if (side < 0) { b.fillStyle = SUMI.red; b.fillRect(x0, y, bw, bh); }
    else { b.fillStyle = SUMI.out; b.fillRect(x0, y, bw * lagU, bh); b.fillStyle = SUMI.ink; b.fillRect(x0, y, bw * hpU, bh); }
    b.fillStyle = 'rgba(15,13,11,0.35)'; for (let i = 1; i < 10; i++) b.fillRect(x0 + (bw * i) / 10, y, 3, bh);
  }
  const nl = 960 - 120 - bw, nr = 960 + 120 + bw;
  text(b, COPY.hype.name, nl, y + bh + 72, { font: F.dela(66), color: SUMI.ink });
  label(b, '1P', nl + measure(b, COPY.hype.name, F.dela(66)) + 20, y + bh + 64, { size: 26, color: SUMI.red });
  text(b, COPY.usdc.name, nr, y + bh + 72, { font: F.dela(66), color: SUMI.ink, align: 'right' });
  label(b, 'CPU', nr - measure(b, COPY.usdc.name, F.dela(66)) - 20, y + bh + 64, { size: 26, color: SUMI.muted, align: 'right' });
  b.fillStyle = SUMI.s1; b.fillRect(960 - 92, 44, 184, 156);
  b.strokeStyle = SUMI.line; b.lineWidth = 2; b.strokeRect(960 - 91, 45, 182, 154);
  text(b, '99', 960, 160, { font: F.dela(104), color: SUMI.ink, align: 'center' });
  const drain = 1 - clamp((t - T.fight) / 60);
  b.fillStyle = 'rgba(239,231,216,0.12)'; b.fillRect(960 - 68, 176, 136, 10);
  b.fillStyle = SUMI.red; b.fillRect(960 - 68, 176, 136 * drain, 10);
}

function board(b, t) {
  const rip = E.outCubic(clamp((t - HS - 0.15) / 0.6));
  const breath = Math.sin(t * Math.PI * (T.bpm / 60)) * 0.004;
  const last = CANDLES[CANDLES.length - 1];
  const o = last.c, cl = o + 0.006 + breath + rip * 0.14;
  const live = { o, c: cl, h: Math.max(o, cl) + 0.004, l: o - 0.006 };
  chart(b, 656, 236, 608, 430, { candles: CANDLES, live, strike: o, price: cl, caption: ' ', slots: CANDLES.length + 2,
    range: [Math.min(...CANDLES.map((k) => k.l)) - 0.02, Math.max(...CANDLES.map((k) => k.h), o + 0.15) + 0.01] });
  label(b, 'HYPE · 1M · ON ELYSIUM', 960, 712, { size: 26, color: SUMI.muted, align: 'center' });
}

// Perma-Bull's lunge: back on the anticipation, then forward fast on the strike, held through the freeze, recovering
function lean(t) {
  if (t < T.strike) return 0;
  if (t < T.hit) return 230 * E.inQuad(invLerp(T.strike, T.hit, t));
  if (t < HS + 0.12) return 230;
  return 230 * (1 - E.outCubic(invLerp(HS + 0.12, HS + 0.55, t)));
}

// the wallet prompts, piled around Paper Hands
const PILE = [
  { x: 1100, y: 300, r: -4 }, { x: 1110, y: 470, r: 3 }, { x: 1170, y: 640, r: -2 },
  { x: 1500, y: 930, r: 4 }, { x: 1120, y: 810, r: 5 }, { x: 1470, y: 700, r: -3 },
];
const HANGER = 5;
function promptCard(b, title, t, k = 1, alpha = 1) {
  const tw = measure(b, title, F.dela(66));
  const w = tw + 2 * 44 + 70, h = 140;
  b.save(); b.scale(k, k); b.globalAlpha *= alpha;
  b.fillStyle = 'rgba(0,0,0,0.6)'; b.fillRect(-w / 2 + 10, -h / 2 + 10, w, h);
  b.fillStyle = SUMI.s1; b.fillRect(-w / 2, -h / 2, w, h);
  b.strokeStyle = 'rgba(239,231,216,0.3)'; b.lineWidth = 2; b.strokeRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2);
  label(b, 'WALLET', -w / 2 + 44, -h / 2 + 38, { size: 20, color: SUMI.muted });
  text(b, title, -w / 2 + 44, -h / 2 + 118, { font: F.dela(66), color: SUMI.ink });
  const sa = t * 8;
  b.strokeStyle = SUMI.muted; b.lineWidth = 6; b.beginPath(); b.arc(w / 2 - 50, 6, 16, sa, sa + 4.2); b.stroke();
  b.restore();
}
function prompts(b, t, tf) {
  COPY.prompts.forEach((title, i) => {
    const t0 = T.prompts[i];
    if (tf < t0) return;
    const p = PILE[i];
    let x = p.x, y = p.y, r = p.r * Math.PI / 180, a = 1;
    const k = slamK(tf - t0, 1.25, 0.1).s;
    if (t >= T.hit && t < HS) { x += (Math.floor(t * 60) % 2 ? 6 : -6); }            // cracked by the hit
    if (t >= HS) {
      const tt = t - HS;
      if (i === HANGER) {
        // the gag: it stays put, wobbling, still spinning... then drops
        r += Math.sin(tt * 26) * 0.035 * Math.exp(-tt * 3);
        if (t >= DROP) { const td = t - DROP; y += 0.5 * 5200 * td * td; r += td * 0.6; }
      } else {
        // shattered outward from the impact
        const ang = [-0.9, -0.2, 0.5, 0.9, 0.25, 0][i];
        const v = 2400 + i * 250;
        x += Math.cos(ang) * v * tt + 1400 * tt; y += Math.sin(ang) * v * tt * 0.8 + 1600 * tt * tt;
        r += (i % 2 ? 1 : -1) * tt * 6; a = 1 - clamp(tt / 0.18);
        if (a <= 0) return;
      }
    }
    if (y > 1300) return;
    b.save(); b.translate(x, y); b.rotate(r);
    promptCard(b, title, t, k, a);
    b.restore();
  });
}

function fighterYou(b, t, tf) {
  const ln = lean(t);
  const lunge = t >= T.strike && t < HS + 0.3 ? 1 : 0;
  // YOU: the lunge, with a short trail on the way in
  if (t >= T.strike && t < T.hit) {
    for (let g = 2; g >= 1; g--) {
      b.save(); b.globalAlpha = 0.18 * g;
      panel(b, YOU, PL.x + lean(t - g * 0.025), PL.y, PL.w, PL.h, PB_F, 0.5, 0.42, 0.6, { notchRight: true, edge: SUMI.red, edgeW: 4 });
      b.restore();
    }
  }
  b.save();
  if (lunge) { const cx = PL.x + ln + PL.w / 2, cy = PL.y + PL.h / 2; b.translate(cx, cy); b.rotate(-0.035 * clamp(ln / 230)); b.scale(1 + 0.05 * clamp(ln / 230), 1 + 0.05 * clamp(ln / 230)); b.translate(-cx, -cy); }
  panel(b, YOU, PL.x + ln, PL.y, PL.w, PL.h, PB_F, 0.5, 0.42, 0.6, { notchRight: true, edge: SUMI.red, edgeW: 4, par: -6 * Math.sin(tf * 0.8) });
  b.restore();
}
// the CPU: trembling more as the prompts pile up; jolted by the hit; launched on the release
function fighterCpu(b, t, tf) {
  if (t < T.hit) {
    const nP = T.prompts.filter((x) => tf >= x).length;
    const trem = tf >= T.prompts[0] ? (Math.floor(t * 30) % 2 ? 1 : -1) * (1 + nP * 0.5) : 0;
    panel(b, CPU, PR.x + trem, PR.y, PR.w, PR.h, PH_F, 0.5, 0.42, 0.6, { par: 6 * Math.sin(tf * 0.8) });
    return;
  }
  if (t < HS) {
    b.save(); b.translate(PR.x + PR.w / 2 + 34, PR.y + PR.h / 2); b.rotate(0.06); b.translate(-(PR.x + PR.w / 2), -(PR.y + PR.h / 2));
    panel(b, CPU, PR.x, PR.y, PR.w, PR.h, PH_F, 0.5, 0.42, 0.6, {});
    b.restore();
    return;
  }
  const tt = t - HS;
  if (tt > 0.42) return;
  // readable for ~6 frames: a hard first shove, then accelerating up and out, turning over
  for (let g = 3; g >= 0; g--) {
    const u = Math.max(0, tt - g * 0.016);
    const x = PR.x + 34 + 900 * u + 6500 * u * u, y = PR.y - 700 * u + 900 * u * u, rr = 0.06 + 4.2 * u;
    b.save(); b.globalAlpha = g ? 0.14 : 1;
    b.translate(x + PR.w / 2, y + PR.h / 2); b.rotate(rr); b.translate(-(x + PR.w / 2), -(y + PR.h / 2));
    panel(b, CPU, x, y, PR.w, PR.h, PH_F, 0.5, 0.42, 0.6, {});
    b.restore();
  }
}

// the paperwork he was holding onto: fragments thrown from the impact, fluttering down (our paper, not his painting)
function paperwork(b, t) {
  if (t < HS) return;
  const tt = t - HS, rnd = mulberry32(77);
  for (let i = 0; i < 48; i++) {
    const ang = -1.3 + rnd() * 2.3, v = 700 + rnd() * 1700, w = 26 + rnd() * 46, h = w * (0.6 + rnd() * 0.5), ph = rnd() * 6;
    const tb = Math.min(tt, 0.3);
    let x = PH_CHEST[0] + Math.cos(ang) * v * tb * (1 - tb), y = PH_CHEST[1] + Math.sin(ang) * v * tb * (1 - tb) * 0.8;
    if (tt > 0.3) { const d = tt - 0.3; x += Math.sin(d * 5 + ph) * 26 + d * 60; y += d * 180; }
    if (y > 1120 || x > 1960) continue;
    const flip = Math.cos(tt * (8 + rnd() * 6) + ph);
    b.save(); b.translate(x, y); b.rotate(ph + tt * (3 + rnd() * 5)); b.scale(1, Math.max(0.12, Math.abs(flip)));
    b.globalAlpha = 1 - clamp((tt - 1.1) / 0.4);
    b.fillStyle = flip > 0 ? '#efe7d8' : '#cfc5b3'; b.fillRect(-w / 2, -h / 2, w, h);
    b.strokeStyle = 'rgba(22,19,15,0.7)'; b.lineWidth = 1.5; b.strokeRect(-w / 2, -h / 2, w, h);
    if (flip > 0 && w > 26) { b.fillStyle = 'rgba(22,19,15,0.5)'; b.fillRect(-w / 2 + 4, -h / 2 + 5, w * 0.6, 2); b.fillRect(-w / 2 + 4, -h / 2 + 10, w * 0.4, 2); }
    b.restore();
  }
}

// the strike: one vermilion dry-brush slash from Perma-Bull's fist to Paper Hands (the scene's one skewed element)
function strike(b, t) {
  if (t < T.strike - 0.02) return;
  const [fx, fy] = fistAt(lean(Math.min(t, T.hit)));
  const rev = E.outQuad(clamp((t - (T.strike + 0.02)) / (T.hit - T.strike - 0.02)));
  const fadeOut = 1 - clamp((t - HS - 0.08) / 0.24);
  if (fadeOut <= 0) return;
  const [hx, hy] = phFace();
  // aim at his chest, just under the face (the face stays readable through the hit), and on out of frame
  const ty = hy + 190, ex = 1960, ey = ty + (ty - fy) * ((ex - hx) / (hx - fx));
  b.save(); b.globalAlpha = fadeOut;
  drawSlash(b, rev, { p0: [fx + 20, fy - 10], p1: [ex, ey], width: 132, bow: -70, color: [255, 84, 54], fade: clamp((t - T.hit) / 0.8), seed: 4021, ground: SUMI.bg });
  b.restore();
}

function callouts(b, t) {
  if (t >= T.round && t < T.fight) {
    const d = t - T.round, k = slamK(d, 1.4, 0.14), a = 1 - clamp((d - 0.4) / 0.1);
    b.save(); b.translate(960, 985); b.scale(k.s, k.s);
    text(b, 'ROUND 1', 0, 0, { font: F.dela(150), color: SUMI.ink, align: 'center', alpha: a });
    b.restore();
  }
  if (t >= T.fight && t < T.prompts[0] + 0.05) {
    const d = t - T.fight, k = stampK(d, -4, 0.28), a = 1 - clamp((d - 0.26) / 0.08);
    b.save(); b.translate(960, 985); b.rotate(k.r * Math.PI / 180); b.scale(k.s, k.s);
    text(b, 'FIGHT!', 0, 0, { font: F.dela(150), color: SUMI.ink, align: 'center', alpha: a * k.a });
    b.restore();
  }
}

// a gigantic K.O. (your win: vermilion), over the empty half of the stage
function koCard(b, t) {
  if (t < T.ko) return;
  const d = t - T.ko, k = stampK(d, -7, 0.4);
  const lift = t >= T.elim ? lerp(0, 140, E.outCubic(clamp((t - T.elim) / 0.25))) : 0;
  b.save(); b.translate(1190, 520 - lift); b.rotate(k.r * Math.PI / 180); b.scale(k.s, k.s);
  b.fillStyle = 'rgba(0,0,0,0.5)';
  text(b, 'K.O.', 10, 104, { font: F.dela(270), color: 'rgba(0,0,0,0.55)', align: 'center', alpha: k.a });
  text(b, 'K.O.', 0, 94, { font: F.dela(270), color: SUMI.red, align: 'center', alpha: k.a });
  b.restore();
  if (d >= 0.06) splatter(b, 1190, 470 - lift, 560, SUMI.red, 4, clamp((d - 0.06) / 0.05));
}

function elimBand(b, R, t) {
  if (t < T.elim) return;
  const d = t - T.elim, u = E.outCubic(clamp(d / 0.22));
  const y = 710, h = 230;
  b.save();
  b.translate((1 - u) * 1920, 0);
  b.fillStyle = 'rgba(0,0,0,0.55)'; b.fillRect(0, y + 12, 1920, h);
  b.save(); b.beginPath(); b.rect(0, y, 1920, h); b.clip(); paper({ b }, 0, 0); b.restore();
  drawFace(b, CPU, 210, y + h / 2, 82, { grey: clamp((d - 0.1) / 0.3) });
  b.strokeStyle = PAPER.line; b.lineWidth = 2; b.beginPath(); b.arc(210, y + h / 2, 82, 0, Math.PI * 2); b.stroke();
  label(b, COPY.band[0], 500, y + 92, { size: 66, color: PAPER.ink, weight: 800, track: 10 });
  text(b, COPY.band[1], 498, y + 184, { font: F.dela(66), color: PAPER.ink });
  b.restore();
  if (d > 0.18) {
    const k = stampK(d - 0.18, -8, 0.4);
    seal(b, '敗', 385, y + h / 2, 150, { tone: 'out', ground: 'paper', s: k.s, rot: k.r, a: k.a });
  }
}

function stage(R, P, t) {
  const b = R.b;
  // during the impact freeze everything that moves holds at the hit; only the camera and the flash run
  const tf = t >= T.hit && t < HS ? T.hit : t;
  sumi(R);
  const kick = t >= T.hit && t < T.hit + 1 / 30 ? [14, -10] : [0, 0];
  const s1 = shake(t, T.hit, 18, 0.65, 26, 1), s3 = shake(t, T.ko, 6, 0.35, 30, 3);
  const roll = (t >= T.hit ? 0.5 * Math.exp(-(t - T.hit) * 5) * Math.sin((t - T.hit) * 60) : 0) * Math.PI / 180;
  b.save();
  b.translate(960 + s1[0] + s3[0] + kick[0], 540 + s1[1] + s3[1] + kick[1]); b.rotate(roll); b.translate(-960, -540);
  // depth, back to front: the board, Paper Hands, his paperwork, the strike, then Perma-Bull in front of it, so the
  // stroke bursts out from behind the lunging panel at fist height (the 2.5D demo's slash sandwich)
  board(b, tf);
  fighterCpu(b, t, tf);
  prompts(b, t, tf);
  strike(b, t);
  fighterYou(b, t, tf);
  paperwork(b, t);
  // grey ink where he left (his loss is grey, never vermilion)
  const ex = t - (HS + 0.16);
  if (ex >= 0) { splatter(b, 1840, 380, 420, SUMI.out, 12, clamp(ex / 0.08)); splatter(b, 1780, 470, 280, SUMI.out, 13, clamp((ex - 0.03) / 0.08)); }
  b.restore();
  const dim = clamp((t - T.ko) / 0.15) * 0.35;
  if (dim > 0) { b.fillStyle = `rgba(11,9,8,${dim})`; b.fillRect(0, 0, 1920, 1080); }
  hud(b, t);
  callouts(b, t);
  koCard(b, t);
  elimBand(b, R, t);
  // the impact frame: one paper flash, then two ink-negative frames (the demo's manga impact frame), then the freeze
  const f = Math.floor((t - T.hit) * 30 + 1e-6);
  if (f === 0) P.flash = 0.8;
  if (f === 1 || f === 2) inkNegative(b, R.W, R.H);
  P.ca = 0.0007 + pulse(t, T.hit, 0.15) * 0.006 + pulse(t, HS, 0.12) * 0.004;
}

// ============================================================================================ the close-ups
// anticipation: cut to Perma-Bull, a slow push on the grin, the world darkens, silence
function darken(b, a, cx = 960, cy = 470) {
  const g = b.createRadialGradient(cx, cy, 200, cx, cy, 1150);
  g.addColorStop(0, 'rgba(8,6,5,0)'); g.addColorStop(1, `rgba(8,6,5,${a})`);
  b.fillStyle = g; b.fillRect(0, 0, 1920, 1080);
}
function anticipShot(R, t) {
  const b = R.b, d = t - T.anticip, u = clamp(d / (T.panic - T.anticip));
  sumi(R);
  const s = lerp(1.04, 1.12, E.inOutSine(u));
  panel(b, YOU, 460, 70, 1000, 940, FACE[YOU], 0.5, 0.36, s, { notchRight: true, edge: SUMI.red, edgeW: 5, par: -16 * u });
  darken(b, lerp(0.35, 0.62, u));
}
// panic: cut to Paper Hands, a crash zoom, trembling, and one more prompt slams in on him
function panicShot(R, t) {
  const b = R.b, d = t - T.panic, u = clamp(d / (T.strike - T.panic));
  sumi(R);
  const s = lerp(1.0, 1.14, E.outCubic(clamp(d / 0.12)));
  const trem = (Math.floor(t * 30) % 2 ? 1 : -1) * 3;
  b.save(); b.translate(trem, 0);
  panel(b, CPU, 460, 70, 1000, 940, FACE[CPU], 0.5, 0.4, s, { par: 10 * u });
  b.restore();
  // the pile, around the frame
  const cards = [['SIGN MESSAGE', 440, 190, -6], ['APPROVE USDC', 1480, 230, 5], ['CONFIRM SWAP', 430, 870, 4], ['SWAP TO USDC', 1480, 880, -4]];
  cards.forEach(([s0, x, y, r]) => { b.save(); b.translate(x, y); b.rotate(r * Math.PI / 180); promptCard(b, s0, t, 0.86); b.restore(); });
  if (d >= 0.1) { b.save(); b.translate(960, 900); b.rotate(-0.03); promptCard(b, 'APPROVE USDC', t, slamK(d - 0.1, 1.3, 0.08).s); b.restore(); }
  darken(b, 0.4);
}

// ============================================================================================ paper, the end card
function endCard(R, t) {
  const b = R.b, st = T.stamp;
  const [ix, iy] = impactK(t - st, 1);
  b.save(); b.translate(ix, iy);
  paper(R, 0, 0);
  COPY.lines.forEach((s, i) => {
    const t0 = T.lines[i];
    if (t < t0) return;
    const n = Math.min(s.length, Math.floor((t - t0) / 0.024) + 1);
    text(b, s.slice(0, n), 960, 250 + i * 150, { font: F.dela(130), color: i === 1 ? PAPER.red : PAPER.ink, align: 'center' });
  });
  b.fillStyle = PAPER.line; b.fillRect(560, 482, 800, 2);
  const ly = 612;
  if (t >= st - 0.05) {
    const k = stampK(t - (st - 0.05), -8, 0.5);
    b.save(); b.translate(LK.seal, ly); b.rotate(k.r * Math.PI / 180); b.scale(k.s, k.s); b.globalAlpha = k.a;
    b.drawImage(IMG.seal, -LK.S / 2, -LK.S / 2, LK.S, LK.S);
    b.restore();
    if (t >= st) splatter(b, LK.seal, ly, 190, PAPER.red, 6, clamp((t - st) / 0.05));
  }
  b.globalAlpha = clamp((t - st - 0.12) / 0.2);
  text(b, 'YOCHI', LK.yochi, ly + 32, { font: F.dela(LK.fs), color: PAPER.ink });
  text(b, '×', LK.x, ly + 22, { font: F.dela(64), color: PAPER.muted, align: 'center' });
  b.drawImage(IMG.ely, LK.ely, ly - LK.es / 2, LK.es, LK.es);
  text(b, 'ELYSIUM', LK.elyW, ly + 32, { font: F.dela(LK.fs), color: PAPER.ink });
  b.globalAlpha = clamp((t - st - 0.3) / 0.2);
  label(b, COPY.live, 960, 800, { size: 66, color: PAPER.ink, align: 'center', weight: 800, track: 8 });
  label(b, COPY.url, 960, 892, { size: 66, color: PAPER.redText, align: 'center', weight: 800, track: 4 });
  label(b, COPY.small, 960, 968, { size: 24, color: PAPER.muted, align: 'center' });
  b.globalAlpha = 1;
  b.restore();
}

export function render(t, R, P) {
  if (t < T.vs) return selectScreen(R, t);
  if (t < T.round) return versus(R, t);
  if (t >= T.anticip && t < T.panic) return anticipShot(R, t);
  if (t >= T.panic && t < T.strike) return panicShot(R, t);
  if (t < T.card) return stage(R, P, t);
  endCard(R, t);
  P.vignette = 0.12; P.grain = 0.028;
}
