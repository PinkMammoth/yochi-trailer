// ACT 1, paper: the thumbnail (Doomer), the smash cut (Perma-Bull), the roster slams, character select, the locks.
import { M, BEAT, BAR } from '../core/music.js';
import { clamp, lerp, E, mulberry32 } from '../core/math.js';
import { PAPER, F, STARTERS, REWARDS, GRID_ORDER, BY_ID } from '../lib/brand.js';
import { paper, text, label, measure, stampSeal, seal, impactK, slamK, mk } from '../lib/draw.js';
import { CAST, drawFig, drawPlate, drawCard, cardInner, figH } from '../lib/cast.js';

// ------------------------------------------------------------------------------------------ the slams
// Each starter: figure on one side, the painting's own ink ground behind it, the take huge on the other side.
// side +1: figure right, type left. Framing per character (head position and scale) is hand-set below.
const FRAMES = {
  'starter-doomer':        { side: 1, hx: 0.69, hy: 0.30, k: 0.84 },
  'starter-perma-bull':    { side: -1, hx: 0.31, hy: 0.30, k: 0.84 },
  'starter-night-shift':   { side: 1, hx: 0.69, hy: 0.31, k: 0.8 },
  'starter-lucky-fool':    { side: -1, hx: 0.31, hy: 0.30, k: 0.8 },
  'starter-strategist-v3': { side: 1, hx: 0.69, hy: 0.30, k: 0.8 },
  'starter-degenerate':    { side: -1, hx: 0.31, hy: 0.31, k: 0.82 },
  'starter-bagholder-v2':  { side: 1, hx: 0.69, hy: 0.30, k: 0.8 },
  'starter-fomo-v2':       { side: -1, hx: 0.31, hy: 0.30, k: 0.8 },
  'starter-paper-hands':   { side: 1, hx: 0.69, hy: 0.30, k: 0.82 },
  'starter-contrarian':    { side: -1, hx: 0.31, hy: 0.30, k: 0.8 },
};
// FINAL EDIT: each starter is a player locking a pick (handles are invented, lowercase)
export const PICKS = {
  'starter-doomer': { pick: 'DOWN', h: 'exit_liquidity', seed: 1 },
  'starter-perma-bull': { pick: 'UP', h: 'mamo', you: true, seed: 2 },
  'starter-lucky-fool': { pick: 'UP', h: 'sunny', seed: 3 },
  'starter-contrarian': { pick: 'DOWN', h: 'fadethis', seed: 4 },
  'starter-degenerate': { pick: 'UP', h: 'maxlev', seed: 5 },
  'starter-paper-hands': { pick: 'DOWN', h: 'jitters', seed: 6 },
  'starter-fomo-v2': { pick: 'UP', h: 'latecomer', seed: 7 },
  'starter-bagholder-v2': { pick: 'UP', h: 'bagz', seed: 8 },
};
export const ROSTER_ORDER = Object.keys(PICKS);
const TAKE_LINES = {
  "i don't know what i did": ["i don't know", 'what i did'],
  'one more candle': ['one more', 'candle'],
  "it'll come back": ["it'll come", 'back'],
  "everyone's wrong": ["everyone's", 'wrong'],
  'never selling': ['never', 'selling'],
  'i have a plan': ['i have', 'a plan'],
  'wait for me': ['wait', 'for me'],
};

// softened plate (the painting's ink ground, edges feathered so it sits on our paper), made once per id
const SOFT = new Map();
export function softPlate(id) {
  if (SOFT.has(id)) return SOFT.get(id);
  const C = CAST[id]; const w = C.plate.width, h = C.plate.height;
  const cv = mk(w, h), c = cv.getContext('2d');
  c.drawImage(C.plate, 0, 0);
  c.globalCompositeOperation = 'destination-in';
  const g = c.createRadialGradient(w * 0.5, h * 0.42, w * 0.14, w * 0.5, h * 0.44, w * 0.5);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  SOFT.set(id, cv);
  return cv;
}

export function slamShot(t, R, P, id, t0, t1, o = {}) {
  const { b, VW, VH } = R;
  const f = FRAMES[id]; const ch = BY_ID[id];
  const dt = t - t0, life = t1 - t0;
  paper(R, -dt * 14 * f.side, 0);
  // a slow push for the whole shot, a slam at the start
  const sl = o.noSlam ? { s: 1, a: 1 } : slamK(dt, 1.16, 0.15);
  const push = 1 + dt * 0.035;
  const k = f.k * push * (VH / 1080);
  const hx = VW * f.hx, hy = VH * f.hy;
  // painted ground: lags the figure (depth), multiplied onto our paper
  {
    const C = CAST[id]; const [W, H] = C.j.paint;
    const lag = 1 + (sl.s - 1) * 0.5;
    const kk = k * 1.02 * lag;
    const [ox, oy] = [hx - C.j.head[0] * kk - f.side * 30 * (1 - Math.exp(-dt * 3)), hy - C.j.head[1] * kk];
    b.save(); b.globalCompositeOperation = 'multiply'; b.globalAlpha = 0.9;
    b.drawImage(softPlate(id), ox, oy, W * kk, H * kk);
    b.restore();
  }
  // the figure, slammed about its head
  b.save();
  b.translate(hx, hy); b.scale(sl.s, sl.s); b.translate(-hx, -hy);
  drawFig(b, id, hx, hy, k, { a: sl.a });
  b.restore();
  // fade the cut-out's bottom edge into paper (the painting stops at the card frame)
  const fy = hy - CAST[id].j.head[1] * k + (CAST[id].j.fig[1] + CAST[id].j.fig[3]) * k;
  if (fy < VH + 40) {
    const g = b.createLinearGradient(0, fy - 160, 0, fy);
    g.addColorStop(0, 'rgba(242,236,224,0)'); g.addColorStop(1, 'rgba(242,236,224,1)');
    b.fillStyle = g; b.fillRect(0, fy - 160, VW, 162);
  }
  // FINAL EDIT: no catchphrase. The big word is the player's pick for the next HYPE candle (the game's own verb),
  // stamped 決 (decided) a beat later; the name plate carries the avatar's name, the line under it the player.
  const pk = PICKS[id];
  const up = pk.pick === 'UP';
  const [ix, iy] = impactK(dt - 0.02, 1);
  const size = 236;
  const tx = f.side > 0 ? 110 : VW - 110;
  const align = f.side > 0 ? 'left' : 'right';
  const baseY = VH - 110;
  const ts = o.noSlam ? 1 : lerp(1.25, 1, E.outCubic(clamp(dt / 0.12)));
  const word = pk.pick, wf = F.dela(size);
  const ww = measure(b, word, wf), tri = size * 0.42, tg = size * 0.16;
  const blockW = tri + tg + ww;
  const bx0 = f.side > 0 ? tx : tx - blockW;
  b.save();
  b.translate(bx0 + ix, baseY + iy); b.scale(ts, ts);
  // the arrow, drawn (the display face has no triangle), cut out of the painting like the type
  const col = up ? PAPER.up : PAPER.down;
  const ay = -size * 0.36, s2 = tri / 2;
  const triPath = () => { b.beginPath(); if (up) { b.moveTo(0, ay + s2 * 0.85); b.lineTo(tri, ay + s2 * 0.85); b.lineTo(tri / 2, ay - s2 * 0.85); } else { b.moveTo(0, ay - s2 * 0.85); b.lineTo(tri, ay - s2 * 0.85); b.lineTo(tri / 2, ay + s2 * 0.85); } b.closePath(); };
  triPath(); b.lineJoin = 'round'; b.lineWidth = 22; b.strokeStyle = PAPER.bg; b.stroke(); b.fillStyle = col; b.fill();
  text(b, word, tri + tg, 0, { font: wf, color: col, stroke: PAPER.bg, strokeW: 22 });
  b.restore();
  // 決: the pick locks
  const lockT = o.noSlam ? -1 : t0 + 0.13;
  const sx = f.side > 0 ? bx0 + blockW + 70 : bx0 - 70;
  stampSeal(b, '決', sx, baseY - size * 0.62, 118, t, lockT, { ground: 'paper', tone: pk.you ? 'red' : 'ink', color: pk.you ? PAPER.red : PAPER.ink, rest: f.side > 0 ? 8 : -8, seed: 60 + (pk.seed || 0), dur: o.noSlam ? 0.0001 : 0.3 });
  // FIRST AD: the plate is the player (a stranger's handle, or YOU); over it, what they're picking
  const topY = baseY - size * 1.02;
  const nameSize = 64;
  const who = pk.you ? 'YOU' : pk.h;
  const nw = measure(b, who, F.dela(nameSize), 2) + 48;
  const nx = f.side > 0 ? tx : tx - nw;
  const na = o.noSlam ? 1 : clamp((dt - 0.04) / 0.06);
  b.save(); b.globalAlpha = na;
  label(b, 'THE NEXT HYPE CANDLE', tx, topY - nameSize - 46, { size: 30, weight: 800, color: PAPER.ink, align });
  b.fillStyle = pk.you ? PAPER.red : PAPER.ink; b.fillRect(nx + ix * 0.5, topY - nameSize - 18, nw, nameSize + 34);
  text(b, who, nx + 24 + ix * 0.5, topY - 2, { font: F.dela(nameSize), color: pk.you ? PAPER.onRed : PAPER.bg, track: 2 });
  label(b, pk.you ? 'PICKS' : 'PICKS', tx, topY + 50, { size: 26, color: PAPER.muted, align, track: 4 });
  b.restore();
  // motion: a short vertical streak on the slam
  if (!o.noSlam && dt < 0.1) P.zoomBlur = 0.05 * (1 - dt / 0.1);
}

// ------------------------------------------------------------------------------------------ the grid
// Starters 5x2 on the left, the 18 rewards as locked ink silhouettes 6x3 on the right.
export function gridLayout(R) {
  const { VW, VH } = R;
  if (R.TALL) {
    const cw = 172, gap = 14, x0 = (VW - (5 * cw + 4 * gap)) / 2, y0 = 300;
    const rw = 128, rg = 10, rx0 = (VW - (6 * rw + 5 * rg)) / 2, ry0 = 900;
    return { cw, gap, x0, y0, rw, rg, rx0, ry0, cols: 5 };
  }
  const cw = 160, gap = 16, x0 = 96, y0 = 350;
  const rw = 112, rg = 12, rx0 = VW - 96 - (6 * rw + 5 * rg), ry0 = 330 + (2 * cw * 4 / 3 + gap - (3 * rw * 4 / 3 + 2 * rg)) / 2;
  return { cw, gap, x0, y0, rw, rg, rx0, ry0, cols: 5 };
}
export function starterRect(L, id) {
  const i = GRID_ORDER.indexOf(id);
  const x = L.x0 + (i % 5) * (L.cw + L.gap), y = L.y0 + Math.floor(i / 5) * (L.cw * 4 / 3 + L.gap);
  return [x, y, L.cw, L.cw * 4 / 3];
}
export function rewardRect(L, i) {
  return [L.rx0 + (i % 6) * (L.rw + L.rg), L.ry0 + Math.floor(i / 6) * (L.rw * 4 / 3 + L.rg), L.rw, L.rw * 4 / 3];
}
// a reward slot: dashed outline, the ink silhouette of the painting inside it (or the lit card, lit 0..1)
export function rewardSlot(c, id, x, y, w, lit = 0, o = {}) {
  const h = w * 4 / 3;
  if (lit < 1) {
    c.save(); c.globalAlpha *= (o.a ?? 1) * (1 - lit);
    c.fillStyle = 'rgba(22,19,15,0.05)'; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(22,19,15,0.35)'; c.lineWidth = 2; c.setLineDash([7, 5]); c.strokeRect(x + 1, y + 1, w - 2, h - 2); c.setLineDash([]);
    const [ix, iy, iw, ih] = cardInner(x, y, w);
    c.beginPath(); c.rect(ix, iy, iw, ih); c.clip();
    const k = iw / 1392; const C = CAST[id];
    drawFig(c, id, ix + C.j.head[0] * k, iy + C.j.head[1] * k, k, { v: 'sil', a: 0.86 });
    c.restore();
  }
  if (lit > 0) drawCard(c, id, x, y, w, { a: (o.a ?? 1) * lit });
}

function cursorBox(c, x, y, w, h, col, tag, a = 1, sub = '') {
  c.save(); c.globalAlpha *= a;
  c.strokeStyle = col; c.lineWidth = 7; c.strokeRect(x - 9, y - 9, w + 18, h + 18);
  c.font = F.mono(20, 800); c.letterSpacing = '3px';
  const tw = c.measureText(tag).width + 20;
  c.fillStyle = col; c.fillRect(x - 12, y - 46, tw, 34);
  c.fillStyle = col === PAPER.ink ? PAPER.bg : PAPER.onRed; c.textBaseline = 'middle'; c.fillText(tag, x - 2, y - 28);
  if (sub) { c.fillStyle = col === PAPER.ink ? PAPER.ink : PAPER.redText; c.font = F.mono(20, 700); c.fillText(sub, x - 12 + tw + 10, y - 28); }
  c.restore();
}

// cursor path: one card per beat from CURSOR, landing on Perma-Bull at LOCK_YOU
// FLAGSHIP: one card per eighth (THE CAST stepped on the beats), landing on Perma-Bull a bar earlier
const YOU_PATH = ['starter-night-shift', 'starter-lucky-fool', 'starter-strategist-v3', 'starter-paper-hands',
  'starter-bagholder-v2', 'starter-perma-bull'];
const THEM_PATH = ['starter-degenerate', 'starter-fomo-v2', 'starter-doomer'];

export function gridShot(t, R, P) {
  const { b, VW, VH } = R;
  const L = gridLayout(R);
  const dt = t - M.GRID;
  paper(R, 0, 0);
  // camera: pulls out of Contrarian's card into the whole grid
  const [cx0, cy0, cw0, ch0] = starterRect(L, 'starter-contrarian');
  const z = E.outExpo(clamp(dt / 0.5));
  const zs = lerp(VH / ch0 * 1.02, 1, z);
  const fcx = lerp(cx0 + cw0 / 2, VW / 2, z), fcy = lerp(cy0 + ch0 / 2, VH / 2, z);
  if (dt < 0.35) P.zoomBlur = 0.08 * (1 - dt / 0.35);
  b.save();
  b.translate(VW / 2, VH / 2); b.scale(zs, zs); b.translate(-fcx, -fcy);
  // headings
  const ha = clamp((dt - 0.25) / 0.2);
  text(b, 'Pick your degen.', VW / 2, 190, { font: F.dela(84), color: PAPER.ink, align: 'center', alpha: ha });
  label(b, 'STARTERS · 10 FREE', L.x0, L.y0 - 72, { size: 22, color: PAPER.ink, alpha: ha });
  label(b, 'REWARDS · 18 TO EARN', L.rx0, L.y0 - 72, { size: 22, color: PAPER.muted, alpha: ha });
  // the lock on Perma-Bull: card lifts and shakes
  const tY = M.LOCK_YOU, tT = M.LOCK_THEM;
  for (const id of GRID_ORDER) {
    let [x, y, w, h] = starterRect(L, id);
    let s = 1, ox = 0, oy = 0;
    if (id === 'starter-perma-bull' && t >= tY) { [ox, oy] = impactK(t - tY, 1); s = 1 + 0.05 * E.outBack(clamp((t - tY) / 0.25)); }
    if (id === 'starter-doomer' && t >= tT) { [ox, oy] = impactK(t - tT, 0.7); s = 1 + 0.03 * E.outBack(clamp((t - tT) / 0.25)); }
    b.save(); b.translate(x + w / 2 + ox, y + h / 2 + oy); b.scale(s, s);
    drawCard(b, id, -w / 2, -h / 2, w);
    b.restore();
  }
  REWARDS.forEach((r, i) => { const [x, y, w] = rewardRect(L, i); rewardSlot(b, r.id, x, y, w, 0); });
  // the two cursors
  const beatIdx = Math.floor((t - M.CURSOR) / (BEAT / 2));
  if (t >= M.CURSOR) {
    const id = t >= tY ? 'starter-perma-bull' : YOU_PATH[clamp(beatIdx, 0, YOU_PATH.length - 1)];
    const [x, y, w, h] = starterRect(L, id);
    cursorBox(b, x, y, w, h, PAPER.red, t >= tY ? 'YOU' : 'P1', 1, t >= tY ? 'mamo' : '');
  }
  if (t >= tY + BEAT * 0.5) {
    const j = Math.floor((t - tY - BEAT * 0.5) / (BEAT * 0.5));
    const id = t >= tT ? 'starter-doomer' : THEM_PATH[clamp(j, 0, THEM_PATH.length - 1)];
    const [x, y, w, h] = starterRect(L, id);
    cursorBox(b, x, y, w, h, PAPER.ink, t >= tT ? 'THEM' : 'P2', 1, t >= tT ? 'exit_liquidity' : '');
  }
  // 決 seals on the locked cards
  { const [x, y, w] = starterRect(L, 'starter-perma-bull'); stampSeal(b, '決', x + w - 18, y + 30, 92, t, tY, { ground: 'paper', tone: 'red', rest: -8, seed: 5 }); }
  { const [x, y, w] = starterRect(L, 'starter-doomer'); stampSeal(b, '決', x + w - 18, y + 30, 80, t, tT, { ground: 'paper', tone: 'ink', rest: 6, seed: 6, color: PAPER.ink }); }
  b.restore();
}
