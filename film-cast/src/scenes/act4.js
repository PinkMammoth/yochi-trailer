// ACT 4: the unlock (連勝 to 5, the card deal, Untouchable in glory, the new face), the ladder of rewards,
// and the cut into the real product (the paper landing page, rebuilt).
import { M, BEAT, BAR } from '../core/music.js';
import { clamp, lerp, E } from '../core/math.js';
import { SUMI, PAPER, F, REWARDS, GRID_ORDER, BY_ID } from '../lib/brand.js';
import { sumi, paper, paperTex, text, label, measure, seal, stampSeal, riseK, impactK, slamK, splatter } from '../lib/draw.js';
import { CAST, drawFig, drawCard, drawFace, cardInner } from '../lib/cast.js';
import { inkFlood, chart, makeCandles } from '../lib/ui.js';
import { slamShot, gridLayout, starterRect, rewardRect, rewardSlot, softPlate } from './act1.js';
import { LOGO } from './end.js';

const U = 'untouchable';

// ------------------------------------------------------------------------------------------ the unlock
function cardBack(c, x, y, w) {
  const h = w * 4 / 3;
  c.save();
  c.fillStyle = SUMI.s2; c.fillRect(x, y, w, h);
  c.strokeStyle = SUMI.ink; c.globalAlpha = 0.5; c.lineWidth = 3; c.strokeRect(x + 18, y + 18, w - 36, h - 36);
  c.globalAlpha = 0.25; c.strokeRect(x + 30, y + 30, w - 60, h - 60); c.globalAlpha = 1;
  c.drawImage(LOGO.markSumi, x + w / 2 - w * 0.22, y + h / 2 - w * 0.22, w * 0.44, w * 0.44);
  c.restore();
}

export function unlockShot(t, R, P) {
  const { b, VW, VH } = R;
  sumi(R);
  // the streak: 連勝 and a counter, five 勝 seals one per beat
  const pre = t < M.FLIP;
  if (pre) {
    const n = M.STREAK.filter((x) => t >= x).length;
    const up = E.outExpo(clamp((t - M.BANNER) / 0.3));
    b.save(); b.translate(0, -up * 150);
    seal(b, '連勝', VW / 2 - 170, 330, 170, { tone: 'red', rot: -6 });
    const ls = n ? slamK(t - M.STREAK[n - 1], 1.4, 0.12) : { s: 1, a: 1 };
    b.save(); b.translate(VW / 2 + 80, 330); b.scale(ls.s, ls.s);
    text(b, String(n), 0, 105, { font: F.dela(300), color: SUMI.ink, align: 'center' });
    b.restore();
    for (let i = 0; i < 5; i++) {
      const x = VW / 2 + (i - 2) * 200, y = 640;
      seal(b, '勝', x, y, 150, { tone: 'empty', rot: 0, a: 0.6 });
      stampSeal(b, '勝', x, y, 150, t, M.STREAK[i] - 0.2, { tone: 'red', rest: -8 + i * 3, seed: 40 + i, dur: 0.4 });
    }
    b.restore();
    // banner + the card deal
    if (t >= M.BANNER) {
      const r = riseK(t - M.BANNER, 30);
      b.save(); b.globalAlpha = r.a;
      const bw = 900, bx = (VW - bw) / 2, by = 560 + r.y;
      b.fillStyle = SUMI.s1; b.fillRect(bx, by, bw, 110); b.fillStyle = SUMI.red; b.fillRect(bx, by, 10, 110);
      label(b, 'ACHIEVEMENT', bx + 44, by + 42, { size: 20, color: SUMI.muted });
      text(b, 'UNTOUCHABLE · WIN 5 IN A ROW', bx + 44, by + 88, { font: F.mono(40, 800), color: SUMI.ink, track: 3 });
      b.restore();
      const d = E.outExpo(clamp((t - M.BANNER - 0.06) / 0.3));
      const w = 300, x = VW / 2 - w / 2, y = lerp(VH + 50, 700, d);
      b.save(); b.translate(x + w / 2, y + w * 2 / 3); b.rotate((1 - d) * 0.5); b.translate(-w / 2, -w * 2 / 3);
      cardBack(b, 0, 0, w);
      b.restore();
    }
    return;
  }
  // the flip and the ink draining to paper
  const df = t - M.FLIP;
  const toPaper = inkFlood(b, R, VW / 2, VH / 2, t, M.FLIP + 0.12, { color: PAPER.bg, dur: 0.5, seed: 8 });
  if (toPaper > 0.98) paper(R);
  const g = t >= M.GLORY;
  if (!g) {
    // card centre stage, flipping: scaleX 1 -> 0 (back), 0 -> 1 (front), rising to full height
    const lift = E.outExpo(clamp(df / 0.4));
    const w = lerp(300, 560, lift), x = VW / 2, y = lerp(900, VH / 2, lift);
    const f = clamp(df / 0.26);
    const sx = f < 0.5 ? 1 - f * 2 : (f - 0.5) * 2;
    b.save(); b.translate(x, y); b.scale(Math.max(0.02, sx), 1); b.translate(-w / 2, -w * 2 / 3);
    if (f < 0.5) cardBack(b, 0, 0, w); else drawCard(b, U, 0, 0, w);
    b.restore();
    if (f >= 0.5) splatter(b, x, y, w * 1.1, PAPER.red, 9, clamp((df - 0.14) / 0.08));
    return;
  }
  // glory: Untouchable, full height, lifting out of her painting
  const dg = t - M.GLORY;
  const z = E.outExpo(clamp(dg / 0.45));
  const C = CAST[U];
  const k = lerp(560 / 1536, 0.84, z);
  const hx = lerp(VW / 2 - 4, VW * 0.7, z), hy = lerp(VH / 2 - 560 * 2 / 3 + (150 + C.j.head[1] * (560 / 1536)) * 1, 300, z);
  if (z < 1) { // the card frame falls away as we push in
    const w = 560 * lerp(1, 2.4, z);
    b.save(); b.globalAlpha = 1 - z; drawCard(b, U, VW / 2 - w / 2, VH / 2 - w * 2 / 3, w); b.restore();
  }
  // her own painted ground, multiplied onto the paper, lagging (depth)
  b.save(); b.globalCompositeOperation = 'multiply'; b.globalAlpha = z * 0.85;
  const kk = k * 1.03; const [W, H] = C.j.paint;
  b.drawImage(softPlate(U), hx - C.j.head[0] * kk - dg * 12, hy - C.j.head[1] * kk, W * kk, H * kk);
  b.restore();
  drawFig(b, U, hx + dg * 6, hy, k * (1 + dg * 0.02), { a: z });
  const bot = hy - C.j.head[1] * k + (C.j.fig[1] + C.j.fig[3]) * k;
  if (bot < VH + 40) { const gr = b.createLinearGradient(0, bot - 140, 0, bot); gr.addColorStop(0, 'rgba(242,236,224,0)'); gr.addColorStop(1, 'rgba(242,236,224,1)'); b.fillStyle = gr; b.fillRect(0, bot - 140, VW, 142); }
  // her name, the rule she was earned by
  const r1 = riseK(dg - 0.25, 40), r2 = riseK(dg - 0.4, 30);
  label(b, 'REWARD · UNLOCKED', 110, 300 + r1.y, { size: 24, color: PAPER.redText, alpha: r1.a });
  text(b, 'UNTOUCHABLE', 104, 440 + r1.y, { font: F.dela(128), color: PAPER.ink, alpha: r1.a, maxW: 960, stroke: PAPER.bg, strokeW: 18 });
  text(b, 'WIN 5 IN A ROW', 110, 520 + r2.y, { font: F.mono(52, 800), color: PAPER.ink, track: 4, alpha: r2.a, stroke: PAPER.bg, strokeW: 12 });
  // the player chip: same player, new face
  const cin = E.outExpo(clamp((t - (M.SWAP - BEAT * 1.5)) / 0.3));
  if (cin > 0) {
    const cx = lerp(-520, 110, cin), cy = 700;
    b.save();
    b.fillStyle = PAPER.s1; b.fillRect(cx, cy, 480, 150);
    b.strokeStyle = PAPER.red; b.lineWidth = 5; b.strokeRect(cx + 2.5, cy + 2.5, 475, 145);
    const sw = clamp((t - M.SWAP) / 0.22);
    const flip = sw < 0.5 ? 1 - sw * 2 : (sw - 0.5) * 2;
    b.save(); b.translate(cx + 80, cy + 75); b.scale(Math.max(0.02, flip), 1);
    drawFace(b, sw < 0.5 ? 'starter-perma-bull' : U, 0, 0, 56);
    b.restore();
    b.strokeStyle = PAPER.red; b.lineWidth = 4; b.beginPath(); b.arc(cx + 80, cy + 75, 60, 0, Math.PI * 2); b.stroke();
    b.fillStyle = PAPER.red; b.fillRect(cx + 160, cy + 30, 66, 28);
    text(b, 'YOU', cx + 193, cy + 51, { font: F.mono(18, 800), color: PAPER.onRed, align: 'center', track: 3 });
    text(b, 'mamo', cx + 240, cy + 56, { font: F.dela(34), color: PAPER.ink });
    label(b, sw < 0.5 ? 'PERMA-BULL' : 'UNTOUCHABLE', cx + 162, cy + 112, { size: 22, color: sw < 0.5 ? PAPER.muted : PAPER.redText });
    b.restore();
    if (t >= M.SWAP + 0.11) splatter(b, cx + 80, cy + 75, 150, PAPER.red, 13, clamp((t - M.SWAP - 0.11) / 0.06));
  }
}

// ------------------------------------------------------------------------------------------ the ladder
const HEROES = [
  { id: 'cold-blooded', side: 1, hx: 0.7, hy: 0.3, k: 0.8 },
  { id: 'duel-master', side: -1, hx: 0.3, hy: 0.3, k: 0.8 },
  { id: 'grudge-settled', side: 1, hx: 0.7, hy: 0.3, k: 0.8 },
  { id: 'took-the-pool', side: -1, hx: 0.3, hy: 0.32, k: 0.8 },
  { id: 'whale', side: 1, hx: 0.7, hy: 0.32, k: 0.8 },
  { id: 'ronin', side: -1, hx: 0.3, hy: 0.3, k: 0.8 },
];
export const HERO_IDS = HEROES.map((h) => h.id);

export function heroShot(t, R, P, i) {
  const { b, VW, VH } = R;
  const h = HEROES[i]; const r = BY_ID[h.id];
  const t0 = M.HEROES[i], dt = t - t0;
  paper(R, -dt * 14 * h.side, 0);
  const C = CAST[h.id];
  const sl = slamK(dt, 1.14, 0.15);
  const k = h.k * (1 + dt * 0.03), hx = VW * h.hx, hy = VH * h.hy;
  b.save(); b.globalCompositeOperation = 'multiply'; b.globalAlpha = 0.85;
  const kk = k * 1.03 * (1 + (sl.s - 1) * 0.5); const [W, H] = C.j.paint;
  b.drawImage(softPlate(h.id), hx - C.j.head[0] * kk - h.side * 30 * (1 - Math.exp(-dt * 3)), hy - C.j.head[1] * kk, W * kk, H * kk);
  b.restore();
  b.save(); b.translate(hx, hy); b.scale(sl.s, sl.s); b.translate(-hx, -hy);
  drawFig(b, h.id, hx, hy, k, { a: sl.a });
  b.restore();
  const bot = hy - C.j.head[1] * k + (C.j.fig[1] + C.j.fig[3]) * k;
  if (bot < VH + 40) { const gr = b.createLinearGradient(0, bot - 140, 0, bot); gr.addColorStop(0, 'rgba(242,236,224,0)'); gr.addColorStop(1, 'rgba(242,236,224,1)'); b.fillStyle = gr; b.fillRect(0, bot - 140, VW, 142); }
  const tx = h.side > 0 ? 110 : VW - 110, align = h.side > 0 ? 'left' : 'right';
  const ts = lerp(1.2, 1, E.outCubic(clamp(dt / 0.12)));
  const [ix, iy] = impactK(dt - 0.02, 1);
  const words = r.name.split(' ');
  b.save(); b.translate(tx + ix, 640 + iy); b.scale(ts, ts); b.translate(-tx, -640);
  label(b, 'REWARD', tx, 330, { size: 24, color: PAPER.muted, align });
  words.forEach((w, j) => text(b, w, tx, 470 + j * 140, { font: F.dela(136), color: PAPER.ink, align, maxW: VW * 0.44, stroke: PAPER.bg, strokeW: 18 }));
  const ly = 470 + (words.length - 1) * 140 + 86;
  text(b, r.unlock.toUpperCase(), tx, ly, { font: F.mono(44, 800), color: PAPER.ink, align, track: 3, maxW: VW * 0.46, stroke: PAPER.bg, strokeW: 12 });
  b.restore();
  if (dt < 0.1) P.zoomBlur = 0.05 * (1 - dt / 0.1);
}

// the grid again: the 18 slots light one per eighth, starting with the rewards already shown
export function ladderGridShot(t, R, P) {
  const { b, VW, VH } = R;
  const L = gridLayout(R);
  const dt = t - M.LADDER_GRID;
  paper(R);
  const shown = new Set([U, ...HERO_IDS]);
  const order = REWARDS.map((r) => r.id).filter((id) => !shown.has(id));
  // camera: a slow pull back
  const zs = lerp(1.08, 1, E.outCubic(clamp(dt / 1.2)));
  b.save(); b.translate(VW / 2, VH / 2); b.scale(zs, zs); b.translate(-VW / 2, -VH / 2);
  const ca = clamp((dt - 0.2) / 0.3);
  text(b, 'You start as one of ten and earn the other eighteen.', VW / 2, 190, { font: F.zen(60, 900), color: PAPER.ink, align: 'center', alpha: ca, maxW: VW - 160 });
  label(b, 'STARTERS · 10 FREE', L.x0, L.y0 - 72, { size: 22, color: PAPER.ink });
  label(b, 'REWARDS · 18 TO EARN', L.rx0, L.y0 - 72, { size: 22, color: PAPER.ink });
  GRID_ORDER.forEach((id) => { const [x, y, w] = starterRect(L, id); drawCard(b, id, x, y, w); });
  REWARDS.forEach((r, i) => {
    const [x, y, w] = rewardRect(L, i);
    let lit = shown.has(r.id) ? 1 : 0, s = 1;
    const j = order.indexOf(r.id);
    if (j >= 0) {
      const lt = M.LADDER_GRID + 0.35 + j * BEAT / 2;
      lit = clamp((t - lt) / 0.08);
      s = t >= lt ? 1 + 0.12 * Math.exp(-(t - lt) / 0.09) : 1;
    }
    b.save(); b.translate(x + w / 2, y + w * 2 / 3); b.scale(s, s); b.translate(-(x + w / 2), -(y + w * 2 / 3));
    rewardSlot(b, r.id, x, y, w, lit);
    b.restore();
  });
  b.restore();
}

// ------------------------------------------------------------------------------------------ the product
// The real paper landing page (reference/screens/real-landing.png), rebuilt at 1920x1080 in the renderer.
const PRACTICE = makeCandles(31, 14, 41.86, 0.03, 0.006);
export function productShot(t, R, P) {
  const { b, VW, VH } = R;
  const dt = t - M.PRODUCT;
  // the page arrives with a push, settles
  const zin = E.outExpo(clamp(dt / 0.5));
  if (dt < 0.25) P.blurVec = [0, 0.04 * (1 - dt / 0.25)];
  b.save();
  const s = lerp(1.12, 1, zin) * (1 + dt * 0.008);
  b.translate(VW / 2, VH / 2); b.scale(s, s); b.translate(-VW / 2, -VH / 2 + (1 - zin) * 80);
  paper(R);
  // nav
  b.drawImage(LOGO.markPaper, 160, 34, 48, 48);
  text(b, 'YOCHI', 224, 76, { font: F.dela(40), color: PAPER.ink, track: 1 });
  text(b, '予知', 384, 72, { font: F.glyph(26), color: PAPER.muted });
  [['THE GAMES', 730], ['HOW IT WORKS', 905], ['IT GETS PERSONAL', 1118], ['FAQ', 1320]].forEach(([s2, x]) => label(b, s2, x, 64, { size: 19, color: PAPER.ink }));
  b.strokeStyle = PAPER.ink; b.lineWidth = 3; b.strokeRect(1640, 26, 116, 58); label(b, 'ENTER', 1698, 64, { size: 19, color: PAPER.ink, align: 'center' });
  // hero copy
  label(b, 'PREDICTION GAMES ON HYPERLIQUID', 165, 172, { size: 19, color: PAPER.muted });
  text(b, 'Call it right.', 160, 330, { font: F.dela(112), color: PAPER.ink });
  text(b, 'Take the pool.', 160, 460, { font: F.dela(112), color: PAPER.ink });
  ['UP or DOWN on the next HYPE candle. Everyone in the round', 'puts in, and the side that reads it right splits the pot. Then', 'take it 1v1, or outlast a whole lobby.']
    .forEach((ln, i) => text(b, ln, 165, 552 + i * 40, { font: F.zen(28, 500), color: PAPER.muted }));
  // ENTER YOCHI: vermilion with the hard ink offset shadow, pressed in on the click
  const press = t >= M.PRESS ? Math.exp(-(t - M.PRESS) / 0.25) : 0;
  const pd = 7 - 5 * (t >= M.PRESS ? clamp((t - M.PRESS) / 0.06) : 0) * (press > 0.2 ? 1 : 0);
  const bx = 165 + (7 - pd), by = 690 + (7 - pd);
  b.fillStyle = PAPER.ink; b.fillRect(165 + 7, 690 + 7, 360, 82);
  b.fillStyle = '#c63a26'; b.fillRect(bx, by, 360, 82);
  text(b, 'ENTER YOCHI', bx + 180, by + 56, { font: F.dela(36), color: PAPER.onRed, align: 'center', maxW: 320 });
  label(b, 'SEE THE GAMES ↓', 580, 742, { size: 20, color: PAPER.ink });
  b.fillStyle = PAPER.ink; b.fillRect(580, 752, 196, 2);
  label(b, 'USDC IN, USDC OUT   ·   SETTLED BY HYPERCORE   ·   5% RAKE', 165, 830, { size: 17, color: PAPER.muted });
  // the free practice round
  const px = 1110, py = 186, pw = 660, ph = 496;
  b.save(); b.shadowColor = 'rgba(60,40,20,0.25)'; b.shadowBlur = 40; b.shadowOffsetY = 18; b.fillStyle = '#0e0c0a'; b.fillRect(px, py, pw, ph); b.restore();
  label(b, 'TRY ONE · NO WALLET · NO MONEY', px + 28, py + 40, { size: 15, color: SUMI.muted });
  label(b, '2/3 RIGHT · 2 IN A ROW', px + pw - 28, py + 40, { size: 15, color: SUMI.ink, align: 'right' });
  b.fillStyle = SUMI.line; b.fillRect(px, py + 64, pw, 2);
  {
    const cx0 = px + 28, cw = pw - 56, cy0 = py + 110, chh = 200, n = PRACTICE.length + 1, step = cw / n;
    let lo = 41.7, hi = 42.06; const Y = (p) => cy0 + chh - (p - lo) / (hi - lo) * chh;
    const live = { o: 41.95, c: lerp(41.95, 42.02, clamp((dt - 0.6) / 0.15)), h: 42.03, l: 41.93 };
    [...PRACTICE, live].forEach((k, i) => {
      const x = cx0 + step * (i + 0.5), up = k.c >= k.o; b.fillStyle = up ? SUMI.up : SUMI.down; b.strokeStyle = b.fillStyle; b.lineWidth = 3;
      b.beginPath(); b.moveTo(x, Y(k.h)); b.lineTo(x, Y(k.l)); b.stroke();
      b.fillRect(x - step * 0.28, Y(Math.max(k.o, k.c)), step * 0.56, Math.max(3, Y(Math.min(k.o, k.c)) - Y(Math.max(k.o, k.c))));
    });
    b.strokeStyle = SUMI.ink; b.globalAlpha = 0.7; b.setLineDash([8, 6]); b.lineWidth = 2; b.beginPath(); b.moveTo(cx0, Y(41.95)); b.lineTo(cx0 + cw, Y(41.95)); b.stroke(); b.setLineDash([]); b.globalAlpha = 1;
  }
  stampSeal(b, 'CALLED IT', px + 330, py + 210, 190, t, M.PRODUCT + 0.75, { tone: 'red', rest: -10, seed: 51 });
  text(b, 'It closed at 42.02', px + 28, py + 400, { font: F.dela(38), color: SUMI.ink });
  label(b, 'YOU WERE RIGHT', px + pw - 28, py + 396, { size: 17, color: SUMI.muted, align: 'right' });
  text(b, 'That’s a win in a real round.', px + 28, py + 458, { font: F.zen(22, 500), color: SUMI.muted });
  b.strokeStyle = SUMI.ink; b.lineWidth = 2; b.strokeRect(px + 330, py + 422, 106, 56); label(b, 'AGAIN', px + 383, py + 457, { size: 16, color: SUMI.ink, align: 'center' });
  b.fillStyle = SUMI.ink; b.fillRect(px + 452, py + 422, 208, 56); label(b, 'PLAY IT FOR REAL →', px + 556, py + 457, { size: 15, color: SUMI.bg, align: 'center' });
  b.restore();
  // the cursor travels to ENTER YOCHI and presses
  const mv = E.inOutCubic(clamp((t - (M.PRESS - 0.75)) / 0.6));
  if (t > M.PRESS - 0.9) {
    const x = lerp(1380, 345, mv), y = lerp(860, 735, mv);
    const s = t >= M.PRESS ? 1 - 0.12 * Math.exp(-(t - M.PRESS) / 0.1) : 1;
    b.save(); b.translate(x, y); b.scale(1.5 * s, 1.5 * s);
    b.fillStyle = '#fff'; b.strokeStyle = PAPER.ink; b.lineWidth = 2; b.lineJoin = 'round';
    b.beginPath(); b.moveTo(0, 0); b.lineTo(0, 32); b.lineTo(8, 25); b.lineTo(14, 38); b.lineTo(19, 36); b.lineTo(13, 23); b.lineTo(24, 23); b.closePath(); b.fill(); b.stroke();
    b.restore();
  }
}
