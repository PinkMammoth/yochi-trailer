// USDC HAS BEEN ELIMINATED, v2: the same 10 s beats as v1 (../usdc/timing.json, 150 BPM), rebuilt with Yochi's
// painted cast instead of invented pixel fighters. YOU (Perma-Bull, v2 painting) pick HYPE; Paper Hands is the CPU on
// USDC. Elysium mainnet promotional cut: the end card points to yochigg.xyz with the real-money line.
//
// Motion follows docs/YOCHI_MOTION_STYLE_GUIDE.md, rungs 0-4 only: the paintings sit whole in framed panels (their
// own plate behind the figure, a few px of parallax), and move as objects: slides, pushes, a punch-in, one panel
// flying off frame. Nothing is repainted, recoloured (bar the loss grey), cut apart or warped.
// Every frame is a pure function of t.
import { SUMI, PAPER, F } from '../../lib/brand.js';
import { paper, sumi, text, label, measure, stampK, impactK, slamK, splatter, seal, stampSeal, loadImage } from '../../lib/draw.js';
import { clamp, lerp, invLerp, E, mulberry32, shake, pulse } from '../../core/math.js';
import { CAST, AVATAR, loadCast, avatarWindow, drawFace } from '../../lib/cast.js';
import { chart, makeCandles } from '../../lib/ui.js';

export const META = { VW: 1920, VH: 1080, dur: 10 };
export const LOOK = { bloom: 0, halo: 0, glowDirect: 0, vignette: 0.22, grain: 0.022, ca: 0.0007, lift: [0, 0, 0], contrast: 1.0 };

// the copy, in one place
export const COPY = {
  title: 'CHOOSE YOUR COLLATERAL',
  stage: 'STAGE · ELYSIUM',
  hype: { name: 'HYPE', sub: 'NATIVE · UNHINGED', tag: '1P · YOU' },
  usdc: { name: 'USDC', sub: 'STABLE · NEEDS APPROVAL', tag: 'CPU' },
  prompts: ['APPROVE USDC', 'CONFIRM SWAP', 'SIGN MESSAGE'],
  band: ['ON ELYSIUM', 'USDC HAS BEEN ELIMINATED'],
  lines: ['NO SWAPS', 'NO APPROVALS', 'JUST HYPE'],
  url: 'yochigg.xyz',
  small: '18+ · REAL-MONEY GAMEPLAY · PLAY RESPONSIBLY', // placeholder, as in the mainnet gameplay cut: counsel's wording goes here
};

const YOU = 'starter-perma-bull', CPU = 'starter-paper-hands';
const TILES = [YOU, CPU, 'starter-doomer', 'starter-night-shift', 'starter-degenerate', 'starter-fomo-v2'];
// focus points in painting pixels (the card's inner 1392x1828), measured on the paintings
const FACE = { [YOU]: [740, 361], [CPU]: [960, 500] };
const FIST = [260, 561];
const SAFE = { x0: 96, x1: 1824, y0: 54, y1: 1026 };

let T, IMG = {}, LK, CANDLES;

export async function init(R) {
  T = await (await fetch(new URL('../usdc/timing.json', import.meta.url))).json();
  META.dur = T.dur;
  await loadCast([YOU, CPU]);
  IMG.seal = await loadImage('assets/logo/yochi-seal-paper.svg');
  IMG.ely = await loadImage('assets/elysium/elysium-logomark-colorized.svg');
  CANDLES = makeCandles(17, 15, 41.6, 0.03, 0.002);
  // the end card lockup, measured and centred: [seal] YOCHI × [crest] ELYSIUM
  const c = R.b, fs = 88, S = 190, es = 160, g1 = 34, g2 = 40;
  const wy = measure(c, 'YOCHI', F.dela(fs)), we = measure(c, 'ELYSIUM', F.dela(fs)), wx = 40;
  const total = S + g1 + wy + g2 + wx + g2 + es + g1 + we;
  let x = 960 - total / 2;
  LK = { fs, es, S, seal: x + S / 2 };
  x += S + g1; LK.yochi = x; x += wy + g2; LK.x = x + wx / 2; x += wx + g2; LK.ely = x; x += es + g1; LK.elyW = x;
}

// ============================================================================================ the painting in a panel
// The whole painting (plate + figure, so no cut edge ever shows) inside a notched box. The painting point `f` lands
// at the panel's relative point (rx, ry) at painting scale s. `par` slides the plate against the figure (parallax).
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
function panel(c, id, x, y, w, h, f, rx, ry, s, o = {}) {
  c.save();
  // the brand's hard ink offset shadow, then the frame
  notchPath(c, x + 12, y + 12, w, h, o.notchRight); c.fillStyle = 'rgba(0,0,0,0.55)'; c.fill();
  notchPath(c, x, y, w, h, o.notchRight); c.fillStyle = PAPER.bg; c.fill();
  c.save(); c.clip();
  if (o.grey) c.filter = `grayscale(${o.grey}) contrast(${lerp(1, 0.75, o.grey)}) brightness(${lerp(1, 1.05, o.grey)})`;
  // the painting always covers the panel, and the panel never shows the painting's outer ~150 px (where the matte's
  // frame was cleared and its corners cut), with spare for the plate's parallax
  const [W, H] = CAST[id].j.paint, m = 16 + 150 * s;
  s = Math.max(s, (w + 2 * m) / W, (h + 2 * m) / H);
  const ox = clamp(x + w * rx - f[0] * s, x + w + m - W * s, x - m);
  const oy = clamp(y + h * ry - f[1] * s, y + h + m - H * s, y - m);
  painting(c, id, ox, oy, s, o);
  c.filter = 'none';
  c.restore();
  notchPath(c, x, y, w, h, o.notchRight);
  c.strokeStyle = o.edge || 'rgba(239,231,216,0.85)'; c.lineWidth = o.edgeW || 3; c.stroke();
  c.restore();
}

// ============================================================================================ 0.0 select
function selectScreen(R, t) {
  const b = R.b;
  sumi(R);
  text(b, COPY.title, 960, 150, { font: F.dela(84), color: SUMI.ink, align: 'center' });
  label(b, 'ELYSIUM', 960, 218, { size: 40, color: SUMI.muted, align: 'center' });
  const lockP1 = t >= T.p1Lock, lockCPU = t >= T.cpuLock;
  const push = 1 + 0.03 * (t / T.vs);
  // the two leads, large, framed; the panel pops on its lock
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
  // name plates under the panels
  text(b, COPY.hype.name, 96, 975, { font: F.dela(110), color: SUMI.ink });
  label(b, COPY.hype.sub, 98, 1018, { size: 32, color: SUMI.muted });
  text(b, COPY.usdc.name, 1824, 975, { font: F.dela(110), color: SUMI.ink, align: 'right' });
  label(b, COPY.usdc.sub, 1822, 1018, { size: 32, color: SUMI.muted, align: 'right' });
  label(b, COPY.hype.tag, 98, 236, { size: 26, color: SUMI.red });
  if (t > T.p1Lock) label(b, COPY.usdc.tag, 1822, 236, { size: 26, color: SUMI.muted, align: 'right' });
  // the roster grid: 3 x 2 of the app's own portrait windows; the four other starters are there but dim
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
  // cursors: 1P hovers USDC, flicks to HYPE and locks (決); the CPU lands on USDC
  const p1 = t < T.p1Lock - 0.14 ? 1 : 0;
  const frame = (i, col, w) => { const [x, y] = at(i); b.strokeStyle = col; b.lineWidth = w; b.strokeRect(x - w / 2 - 4, y - w / 2 - 4, ts + w + 8, ts + w + 8); };
  if (lockCPU || (t > T.p1Lock && Math.floor(t * 16) % 2 === 0)) frame(1, SUMI.muted, 5);
  frame(p1, SUMI.red, 7);
  const [tx0, ty0] = at(p1);
  label(b, '1P', tx0, ty0 - 22, { size: 26, color: SUMI.red });
  if (t > T.p1Lock) { const [tx1, ty1] = at(1); label(b, 'CPU', tx1 + ts, ty1 - 22, { size: 26, color: SUMI.muted, align: 'right' }); }
  const [lx, ly] = at(0);
  stampSeal(b, '決', lx + ts - 6, ly + 10, 84, t, T.p1Lock, { tone: 'red', rest: 8, seed: 9 });
  // the lock flash
  const fl = Math.max(pulse(t, T.p1Lock, 0.05), pulse(t, T.cpuLock, 0.05) * 0.6);
  if (fl > 0.02) { b.fillStyle = `rgba(255,248,239,${fl * 0.4})`; b.fillRect(0, 0, 1920, 1080); }
}

// ============================================================================================ 0.8 versus band
function versus(R, t) {
  const b = R.b, d = t - T.vs;
  sumi(R);
  const u = E.outCubic(clamp(d / 0.18));
  const drift = d * 14;
  const push = 1 + 0.03 * clamp(d / 1.0);
  // the fighters rise out of the band: panels behind it, faces large
  b.save(); b.translate(960, 540); b.scale(push, push); b.translate(-960, -540);
  panel(b, YOU, lerp(-800, 96, u) + drift, 110, 730, 650, FACE[YOU], 0.55, 0.4, 0.72, { notchRight: true, par: -12 * d, edge: SUMI.red, edgeW: 4 });
  panel(b, CPU, lerp(1920, 1094, u) - drift, 110, 730, 650, FACE[CPU], 0.45, 0.4, 0.72, { par: 12 * d, edgeW: 3 });
  b.restore();
  // the band wipes open from the centre; one vermilion slash carrying 対
  const bu = E.outCubic(clamp((d - 0.06) / 0.16));
  const by = 640, bh = 260;
  b.save();
  b.beginPath(); b.rect(960 - 960 * bu, by - 20, 1920 * bu, bh + 40); b.clip();
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

// ============================================================================================ 1.8 the stage
// HUD on top, the HYPE board between the two framed fighters, call-outs underneath on the ground.
function hud(b, t) {
  const hs = T.hit + T.hitstop;
  const hpU = t < T.hit ? 1 : 0;
  const lagU = t < hs ? 1 : 1 - E.inOutCubic(invLerp(hs + 0.15, T.exit + 0.5, t));
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
  // the arcade timer: it never gets the chance to move
  b.fillStyle = SUMI.s1; b.fillRect(960 - 92, 44, 184, 156);
  b.strokeStyle = SUMI.line; b.lineWidth = 2; b.strokeRect(960 - 91, 45, 182, 154);
  text(b, '99', 960, 160, { font: F.dela(104), color: SUMI.ink, align: 'center' });
  const drain = 1 - clamp((t - T.fight) / 60);
  b.fillStyle = 'rgba(239,231,216,0.12)'; b.fillRect(960 - 68, 176, 136, 10);
  b.fillStyle = SUMI.red; b.fillRect(960 - 68, 176, 136 * drain, 10);
}

function board(b, t) {
  const rip = E.outCubic(clamp((t - T.exit) / 0.6));
  const breath = Math.sin(t * Math.PI * (T.bpm / 60)) * 0.004;
  const last = CANDLES[CANDLES.length - 1];
  const o = last.c, cl = o + 0.006 + breath + rip * 0.14;
  const live = { o, c: cl, h: Math.max(o, cl) + 0.004, l: o - 0.006 };
  chart(b, 656, 236, 608, 430, { candles: CANDLES, live, strike: o, price: cl, caption: ' ', slots: CANDLES.length + 2,
    range: [Math.min(...CANDLES.map((k) => k.l)) - 0.02, Math.max(...CANDLES.map((k) => k.h), o + 0.15) + 0.01] });
  label(b, 'HYPE · 1M · ON ELYSIUM', 960, 712, { size: 26, color: SUMI.muted, align: 'center' });
}

// where the fighters are. YOU leans in for the hit; the CPU trembles over his paperwork, then is launched off frame.
const PL = { x: 96, y: 236, w: 520, h: 640 }, PR = { x: 1304, y: 236, w: 520, h: 640 };
function fighters(b, t) {
  const hs = T.hit + T.hitstop;
  // YOU
  const lean = E.inQuad(invLerp(T.windup, T.hit, t)) * 40 * (t < hs + 0.3 ? 1 : 1 - E.outCubic(invLerp(hs + 0.3, hs + 0.7, t)));
  panel(b, YOU, PL.x + lean, PL.y, PL.w, PL.h, [560, 470], 0.5, 0.42, 0.6, { notchRight: true, edge: SUMI.red, edgeW: 4, par: -6 * Math.sin(t * 0.8) });
  // the CPU
  if (t < hs) {
    const trem = t >= T.approve ? (Math.floor(t * 30) % 2 ? 1 : -1) * (t > T.windup ? 2 : 1) : 0;
    panel(b, CPU, PR.x + trem, PR.y, PR.w, PR.h, [900, 580], 0.5, 0.42, 0.6, { par: 6 * Math.sin(t * 0.8) });
    return;
  }
  // launched: the whole framed painting, fast, turning, with a short motion trail; gone in ~0.25 s
  const dt = t - hs;
  if (dt > 0.4) return;
  for (let k = 3; k >= 0; k--) {
    const tt = Math.max(0, dt - k * 0.012);
    const x = PR.x + 2600 * tt * tt * 3 + 600 * tt, y = PR.y - 260 * tt, r = 0.9 * tt;
    b.save(); b.globalAlpha = k ? 0.16 : 1;
    b.translate(x + PR.w / 2, y + PR.h / 2); b.rotate(r); b.translate(-(x + PR.w / 2), -(y + PR.h / 2));
    panel(b, CPU, x, y, PR.w, PR.h, [900, 580], 0.5, 0.42, 0.6, {});
    b.restore();
  }
}

// the wallet prompts USDC wants signed before he does anything: Sumi cards over the board; they shatter on the hit
function prompts(b, t) {
  if (t < T.approve || t > T.hit + T.hitstop + 0.2) return;
  const sh = E.outCubic(clamp((t - T.hit - T.hitstop) / 0.2));
  COPY.prompts.forEach((title, i) => {
    const t0 = T.approve + i * 0.17;
    if (t < t0) return;
    const k = slamK(t - t0, 1.2, 0.12);
    const tw = measure(b, title, F.dela(66));
    const w = tw + 2 * 44 + 70, h = 140;
    const cx = 960 + i * 14, cy = 320 + i * 150; // a list, not a pile: every title stays readable
    b.save();
    b.translate(cx + sh * (700 + i * 180), cy - sh * (220 + i * 90)); b.rotate(sh * (0.35 + i * 0.25)); b.scale(k.s, k.s);
    b.globalAlpha = 1 - sh;
    b.fillStyle = 'rgba(0,0,0,0.6)'; b.fillRect(-w / 2 + 10, -h / 2 + 10, w, h);
    b.fillStyle = SUMI.s1; b.fillRect(-w / 2, -h / 2, w, h);
    b.strokeStyle = 'rgba(239,231,216,0.3)'; b.lineWidth = 2; b.strokeRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2);
    label(b, 'WALLET', -w / 2 + 44, -h / 2 + 38, { size: 20, color: SUMI.muted });
    text(b, title, -w / 2 + 44, -h / 2 + 118, { font: F.dela(66), color: SUMI.ink });
    const sa = t * 8;
    b.strokeStyle = SUMI.muted; b.lineWidth = 6; b.beginPath(); b.arc(w / 2 - 50, 6, 16, sa, sa + 4.2); b.stroke();
    b.restore();
  });
}

function callouts(b, t) {
  if (t >= T.round && t < T.fight) {
    const d = t - T.round, k = slamK(d, 1.4, 0.14), a = 1 - clamp((d - 0.48) / 0.1);
    b.save(); b.translate(960, 985); b.scale(k.s, k.s);
    text(b, 'ROUND 1', 0, 0, { font: F.dela(150), color: SUMI.ink, align: 'center', alpha: a });
    b.restore();
  }
  if (t >= T.fight && t < T.approve + 0.05) {
    const d = t - T.fight, k = stampK(d, -4, 0.32), a = 1 - clamp((d - 0.34) / 0.08);
    b.save(); b.translate(960, 985); b.rotate(k.r * Math.PI / 180); b.scale(k.s, k.s);
    text(b, 'FIGHT!', 0, 0, { font: F.dela(150), color: SUMI.ink, align: 'center', alpha: a * k.a });
    b.restore();
  }
}

// K.O. is your win, so it stamps in vermilion, over the board (the CPU's side is empty by now)
function koCard(b, t) {
  if (t < T.ko) return;
  const d = t - T.ko, k = stampK(d, -8, 0.42);
  const lift = t >= T.elim ? lerp(0, 120, E.outCubic(clamp((t - T.elim) / 0.25))) : 0;
  b.save(); b.translate(1010, 560 - lift); b.rotate(k.r * Math.PI / 180); b.scale(k.s, k.s);
  text(b, 'K.O.', 0, 76, { font: F.dela(220), color: SUMI.red, align: 'center', alpha: k.a });
  b.restore();
  if (d >= 0.08) splatter(b, 1010, 520 - lift, 420, SUMI.red, 4, clamp((d - 0.08) / 0.05));
}

// the paper band: his face greys, the grey 敗 seal stamps, ON ELYSIUM over the headline. Sized to sit in title-safe.
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

// the impact frame: a hard cut to the fist, paper-white ground, the painting filling the frame; hit-stop
function impactFrame(R, t) {
  const b = R.b, d = t - T.hit;
  paper(R, 0, 0);
  const s = 1.45 * (1 + 0.08 * E.outQuad(clamp(d / (2 / 30))));
  const [ix, iy] = shake(t, T.hit, 7, T.hitstop, 40, 5);
  b.save(); b.translate(ix, iy);
  b.translate(300, 540); b.scale(s / 1.45, s / 1.45); b.translate(-300, -540);
  painting(b, YOU, 300 - FIST[0] * 1.45, 540 - FIST[1] * 1.45, 1.45);
  b.restore();
  // ink flung off the fist, toward where the CPU stands
  const rnd = mulberry32(31);
  b.save(); b.fillStyle = PAPER.ink;
  for (let i = 0; i < 26; i++) {
    // flung down and right, away from the face (upper centre in this crop): ink never lands on the painted face
    const a = 0.15 + rnd() * 0.75, r0 = 160 + rnd() * 120, r = r0 + clamp(d / T.hitstop) * (180 + rnd() * 520);
    const x = 300 + Math.cos(a) * r, y = 540 + Math.sin(a) * r * 0.9, sz = 3 + rnd() * rnd() * 30;
    b.globalAlpha = 0.85; b.beginPath(); b.arc(x, y, sz, 0, Math.PI * 2); b.fill();
  }
  b.restore();
}

function stage(R, P, t) {
  const b = R.b;
  sumi(R);
  // camera: the push toward YOU on the wind-up, release shake on the hit, a small shake on the K.O.
  const wind = E.inQuad(invLerp(T.windup, T.hit, t)) * (t < T.hit + T.hitstop ? 1 : 1 - E.outCubic(invLerp(T.hit + T.hitstop, T.exit + 0.2, t)));
  const z = 1 + 0.12 * wind;
  const s1 = shake(t, T.hit + T.hitstop, 10, 0.4, 30, 1), s3 = shake(t, T.ko, 5, 0.3, 30, 3);
  b.save();
  b.translate(s1[0] + s3[0], s1[1] + s3[1]);
  b.translate(356, 556); b.scale(z, z); b.translate(-356, -556);
  board(b, t);
  fighters(b, t);
  // grey ink where he left the frame (his loss is grey, never vermilion)
  const ex = t - T.exit;
  if (ex >= 0) splatter(b, 1830, 430, 380, SUMI.out, 12, clamp(ex / 0.08));
  if (ex >= 0) splatter(b, 1760, 520, 260, SUMI.out, 13, clamp((ex - 0.03) / 0.08));
  b.restore();
  const dim = clamp((t - T.ko) / 0.15) * 0.35;
  if (dim > 0) { b.fillStyle = `rgba(11,9,8,${dim})`; b.fillRect(0, 0, 1920, 1080); }
  hud(b, t);
  callouts(b, t);
  prompts(b, t);
  koCard(b, t);
  elimBand(b, R, t);
  P.ca = 0.0007 + pulse(t, T.hit + T.hitstop, 0.12) * 0.005;
}

// ============================================================================================ 6.4 paper, the end card
function endCard(R, t) {
  const b = R.b, st = T.stamp;
  const [ix, iy] = impactK(t - st, 1);
  b.save(); b.translate(ix, iy);
  paper(R, 0, 0);
  COPY.lines.forEach((s, i) => {
    const t0 = T.lines[i];
    if (t < t0) return;
    const n = Math.min(s.length, Math.floor((t - t0) / 0.022) + 1);
    text(b, s.slice(0, n), 960, 212 + i * 130, { font: F.dela(112), color: i === 2 ? PAPER.red : PAPER.ink, align: 'center' });
  });
  b.fillStyle = PAPER.line; b.fillRect(560, 548, 800, 2);
  const ly = 680;
  if (t >= st - 0.05) {
    const k = stampK(t - (st - 0.05), -8, 0.5);
    b.save(); b.translate(LK.seal, ly); b.rotate(k.r * Math.PI / 180); b.scale(k.s, k.s); b.globalAlpha = k.a;
    b.drawImage(IMG.seal, -LK.S / 2, -LK.S / 2, LK.S, LK.S);
    b.restore();
    if (t >= st) splatter(b, LK.seal, ly, 200, PAPER.red, 6, clamp((t - st) / 0.05));
  }
  b.globalAlpha = clamp((t - st - 0.12) / 0.2);
  text(b, 'YOCHI', LK.yochi, ly + 32, { font: F.dela(LK.fs), color: PAPER.ink });
  text(b, '×', LK.x, ly + 22, { font: F.dela(64), color: PAPER.muted, align: 'center' });
  b.drawImage(IMG.ely, LK.ely, ly - LK.es / 2, LK.es, LK.es);
  text(b, 'ELYSIUM', LK.elyW, ly + 32, { font: F.dela(LK.fs), color: PAPER.ink });
  label(b, COPY.url, 960, 880, { size: 66, color: PAPER.redText, align: 'center', weight: 800, track: 4 });
  label(b, COPY.small, 960, 958, { size: 24, color: PAPER.muted, align: 'center' });
  b.globalAlpha = 1;
  b.restore();
}

export function render(t, R, P) {
  if (t < T.vs) return selectScreen(R, t);
  if (t < T.round) return versus(R, t);
  if (t >= T.hit && t < T.hit + T.hitstop) {
    impactFrame(R, t);
    if (t < T.hit + 1 / 30) P.flash = 0.75; // one frame of white, then the fist holds for the hit-stop
    return;
  }
  if (t < T.card) return stage(R, P, t);
  endCard(R, t);
  P.vignette = 0.12; P.grain = 0.028;
}
