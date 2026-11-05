// ACT 3, sumi: the climb. A Free For All (a crowd split either side of the strike line), then a Battle
// Royale of ten veterans and our Perma-Bull, lives going grey one beat at a time until one is left.
import { M, BEAT } from '../core/music.js';
import { clamp, lerp, E, noise1, mulberry32 } from '../core/math.js';
import { SUMI, PAPER, F } from '../lib/brand.js';
import { sumi, text, label, measure, seal, stampSeal, riseK, impactK, slamK } from '../lib/draw.js';
import { drawFace } from '../lib/cast.js';
import { versusBand } from '../lib/ui.js';
import { verdictLayer } from './verdict.js';

const YOU = 'duel-master'; // ORDER A: you've earned her by now, so you wear her in both games

// ------------------------------------------------------------------------------------------ FFA
const UP_IDS = ['whale', 'cold-blooded', 'starter-night-shift', 'ronin', 'high-roller-v2', 'starter-lucky-fool', YOU, 'in-the-green',
  'starter-fomo-v2', 'insider-v2', 'deadeye', 'bloodsport'];
const DN_IDS = ['starter-doomer', 'starter-contrarian', 'starter-paper-hands', 'rampage', 'hundred-trials', 'starter-bagholder-v2',
  'last-legend', 'starter-strategist-v3', 'grudge-settled', 'lab-rat', 'final-three', 'starter-degenerate'];
const FFA_WIN = ['+14.20', '+31.05', '+12.66', '+48.10', '+19.92', '+10.75', '+14.20', '+27.31', '+16.40', '+55.80', '+22.08', '+12.10'];

function seats(ids, up, VW, VH) {
  // two rows of six per side of the line, the gap in the middle kept for the candle
  const rnd = mulberry32(up ? 3 : 4);
  const xs = [170, 410, 650, 1270, 1510, 1750];
  return ids.map((id, i) => {
    const row = Math.floor(i / 6), col = i % 6;
    const y = up ? 410 - row * 200 : 670 + row * 200;
    return { id, x: xs[col] + (row ? 60 : -40) + (rnd() - 0.5) * 30, y: y + (rnd() - 0.5) * 24, r: 66 + rnd() * 8, d: (rnd() * 0.25) };
  });
}

export function ffaShot(t, R, P) {
  const { b, VW, VH } = R;
  sumi(R);
  const dt = t - M.FFA;
  // whip in from below
  const w = E.outExpo(clamp(dt / 0.22));
  if (dt < 0.2) P.blurVec = [0, 0.05 * (1 - dt / 0.2)];
  b.save(); b.translate(0, (1 - w) * VH * 0.35);
  // after the close, a slow push in towards you
  const pz = 1; // FIRST AD: no push here, so the caption under the room stays clear
  const yx = 230, yy = 210;
  b.translate(yx, yy); b.scale(pz, pz); b.translate(-yx, -yy);
  const cy = 540;
  const closed = t >= M.FFA_CLOSE;
  const res = clamp((t - M.FFA_CLOSE) / 0.25);
  // strike line
  b.strokeStyle = SUMI.ink; b.globalAlpha = 0.6; b.lineWidth = 3; b.setLineDash([16, 12]);
  b.beginPath(); b.moveTo(40, cy); b.lineTo(VW - 40, cy); b.stroke(); b.setLineDash([]); b.globalAlpha = 1;
  // the candle in the middle
  {
    const live = closed ? lerp(0, 1, E.outExpo(res)) : noise1(dt * 3) * 0.12;
    const top = cy - (closed ? 230 * live : Math.max(0, live) * 140), bot = cy + (closed ? 0 : Math.max(0, -live) * 140);
    b.fillStyle = closed || live >= 0 ? SUMI.up : SUMI.down; b.strokeStyle = b.fillStyle; b.lineWidth = 8;
    b.beginPath(); b.moveTo(VW / 2, top - 50); b.lineTo(VW / 2, bot + 40); b.stroke();
    b.fillRect(VW / 2 - 46, top, 92, Math.max(8, bot - top));
  }
  text(b, 'UP', VW / 2 - 100, cy - 30, { font: F.dela(64), color: SUMI.up, align: 'right' });
  text(b, 'DOWN', VW / 2 - 100, cy + 84, { font: F.dela(64), color: closed ? SUMI.out : SUMI.down, align: 'right' });
  // faces pop out from the line, staggered
  for (const [ids, up] of [[UP_IDS, true], [DN_IDS, false]]) {
    seats(ids, up, VW, VH).forEach((s, i) => {
      const pt = dt - 0.06 - s.d;
      if (pt < 0) return;
      const p = E.outBack(clamp(pt / 0.22), 2.2);
      const y = lerp(cy, s.y, E.outExpo(clamp(pt / 0.25)));
      const you = s.id === YOU;
      const grey = !up ? res : 0;
      b.save();
      const lift = up && closed ? -12 * E.outBack(res) : 0;
      drawFace(b, s.id, s.x, y + lift, s.r * p, { grey, a: up || !closed ? 1 : 1 - res * 0.35 });
      b.strokeStyle = you ? SUMI.red : (up && closed ? SUMI.up : SUMI.line); b.lineWidth = you ? 7 : 3;
      b.globalAlpha = you ? 1 : (up && closed ? res : 1);
      b.beginPath(); b.arc(s.x, y + lift, s.r * p + 4, 0, Math.PI * 2); b.stroke();
      b.restore();
      if (you) {
        b.save(); b.fillStyle = SUMI.red; b.fillRect(s.x - 40, y + lift - s.r - 44, 80, 32);
        text(b, 'YOU', s.x, y + lift - s.r - 19, { font: F.mono(20, 800), color: SUMI.onRed, align: 'center', track: 3 }); b.restore();
      }
      if (closed) {
        const r = riseK(t - M.FFA_CLOSE - 0.12 - i * 0.03, 20);
        if (up) {
          const big = you;
          text(b, FFA_WIN[i], s.x, y + lift + s.r + (big ? 58 : 44) + r.y, { font: F.mono(big ? 46 : 30, 800), color: SUMI.up, align: 'center', alpha: r.a });
          if (big) text(R.g, FFA_WIN[i], s.x, y + lift + s.r + 58 + r.y, { font: F.mono(46, 800), color: SUMI.up, align: 'center', alpha: r.a * 0.7 });
        } else text(b, '−10.00', s.x, y + s.r + 40 + r.y, { font: F.mono(26, 700), color: SUMI.out, align: 'center', alpha: r.a });
      }
    });
  }
  b.restore();
  // FIRST AD: the mode, named big; what happened, in one line
  { const k = slamK(dt - 0.02, 1.3, 0.14);
    b.save(); b.translate(1860, 112); b.scale(k.s, k.s); text(b, 'FREE FOR ALL', 0, 0, { font: F.dela(84), color: SUMI.ink, align: 'right', stroke: SUMI.bg, strokeW: 14 }); b.restore(); }
  label(b, closed ? 'HYPE CLOSED UP · THE UP SIDE SPLITS THE POOL' : 'EVERYONE PICKS · 24 IN', VW / 2, 1050, { size: 28, color: closed ? SUMI.up : SUMI.muted, align: 'center' });
}

// ------------------------------------------------------------------------------------------ Battle Royale
// ten seats: our Perma-Bull, two starters, seven veterans wearing reward faces
const BR = [
  { id: YOU, h: 'mamo', you: true },
  { id: 'bloodsport', h: 'mira' }, { id: 'last-legend', h: 'deano' }, { id: 'ronin', h: 'soup' }, { id: 'whale', h: 'kaze' },
  { id: 'deadeye', h: 'rektangle' }, { id: 'rampage', h: 'cope_dealer' }, { id: 'cold-blooded', h: '0x9c…e2' },
  { id: 'starter-degenerate', h: 'ape_in' }, { id: 'starter-night-shift', h: 'lowcap' },
];
// [beat after BR, seat, 'life' | 'out']. Every beat a round settles; the field empties until only mamo is left.
// FINAL EDIT: two fast rounds take the field from 10 to 5, the verdict takeover judges round 5 (three out, mira
// loses a life, you're still in), and it lands back on the roster; the final round takes mira.
const EVENTS = [
  [1, 8, 'out'], [1, 5, 'out'], [1, 0, 'life'], [1, 2, 'life'], [1, 4, 'life'],
  [2, 6, 'out'], [2, 9, 'out'], [2, 7, 'out'], [2, 3, 'life'],
  ['V', 2, 'out'], ['V', 3, 'out'], ['V', 4, 'out'], ['V', 1, 'out'],
];
function brState(t) {
  const st = BR.map(() => ({ lives: 2, outT: Infinity, lifeT: [] }));
  st[2].lives = 2;
  let round = 3;
  for (const [bt, i, kind] of EVENTS) {
    const et = bt === 'V' ? M.V_EXIT : bt === 'L' ? M.BR_LAST : M.BR + bt * BEAT;
    if (t < et) break;
    round = bt === 'V' ? 6 : bt === 'L' ? 7 : 3 + bt;
    if (kind === 'life') { st[i].lives--; st[i].lifeT.push(et); }
    else { st[i].lifeT.push(et); st[i].lives = 0; st[i].outT = et; }
  }
  return { st, round };
}

export function brShot(t, R, P) {
  const { b, VW, VH } = R;
  sumi(R);
  const dt = t - M.BR;
  const w = E.outExpo(clamp(dt / 0.22));
  if (dt < 0.2) P.blurVec = [0, -0.05 * (1 - dt / 0.2)];
  const win = t >= M.BR_WIN;
  const { st, round } = brState(t);
  const standing = st.filter((s) => s.outT > t).length;
  b.save(); b.translate(0, -(1 - w) * VH * 0.35);
  // header band, as in the real Battle Royale screen
  const bandY = 40, bandH = 190;
  versusBand(b, R, bandY, bandH, { glyph: false, slashW: 200 });
  label(b, 'ROUND', VW / 2, bandY + 46, { size: 20, color: SUMI.onRed, align: 'center' });
  text(b, String(round), VW / 2, bandY + 140, { font: F.dela(84), color: SUMI.onRed, align: 'center' });
  label(b, 'STILL STANDING', 110, bandY + 62, { size: 22, color: PAPER.muted });
  text(b, `${standing}`, 110, bandY + 158, { font: F.dela(90), color: PAPER.ink });
  text(b, '/ 10', 110 + measure(b, `${standing}`, F.dela(90)) + 18, bandY + 158, { font: F.dela(44), color: PAPER.muted });
  label(b, 'LAST ONE STANDING TAKES', VW - 110, bandY + 62, { size: 22, color: PAPER.muted, align: 'right' });
  text(b, '95.00', VW - 230, bandY + 158, { font: F.mono(84, 800), color: PAPER.up, align: 'right' });
  text(b, 'USDC', VW - 110, bandY + 158, { font: F.mono(34, 800), color: PAPER.up, align: 'right' });
  { const k = slamK(dt - 0.02, 1.3, 0.14);
    b.save(); b.translate(VW / 2, bandY + bandH + 72); b.scale(k.s, k.s); text(b, 'BATTLE ROYALE', 0, 0, { font: F.dela(64), color: SUMI.ink, align: 'center', stroke: SUMI.bg, strokeW: 12 }); b.restore(); }
  // seats
  const cw = 336, ch = 300, gap = 20, x0 = (VW - (5 * cw + 4 * gap)) / 2, y0 = 320;
  BR.forEach((s, i) => {
    const x = x0 + (i % 5) * (cw + gap), y = y0 + Math.floor(i / 5) * (ch + gap);
    const S = st[i];
    const out = clamp((t - S.outT) / 0.25);
    const [ix, iy] = S.lifeT.length ? impactK(t - S.lifeT[S.lifeT.length - 1], 0.8) : [0, 0];
    const pop = E.outBack(clamp((dt - 0.05 - i * 0.025) / 0.2), 2);
    b.save(); b.translate(x + cw / 2 + ix, y + ch / 2 + iy); b.scale(pop, pop); b.translate(-cw / 2, -ch / 2);
    b.fillStyle = S.outT <= t ? SUMI.bg : SUMI.s1; b.fillRect(0, 0, cw, ch);
    b.strokeStyle = s.you ? SUMI.red : SUMI.line; b.lineWidth = s.you ? 6 : 2; b.strokeRect(1, 1, cw - 2, ch - 2);
    drawFace(b, s.id, cw / 2, 118, 92, { grey: out, a: 1 - out * 0.4 });
    text(b, s.h, 26, 262, { font: F.dela(32), color: out > 0.5 ? SUMI.out : SUMI.ink, maxW: cw - 150 });
    if (s.you) { b.fillStyle = SUMI.red; b.fillRect(26, 18, 70, 30); text(b, 'YOU', 61, 40, { font: F.mono(18, 800), color: SUMI.onRed, align: 'center', track: 3 }); }
    // two lives: yours vermilion, theirs cream; spent lives grey
    for (let L = 0; L < 2; L++) {
      const alive = L < S.lives;
      const lt = alive ? -1 : S.lifeT[Math.min(S.lifeT.length - 1, 1 - L)] ?? -1;
      seal(b, '命', cw - 100 + L * 52, 250, 46, { tone: alive ? (s.you ? 'red' : 'ink') : 'out', rot: -4, s: alive ? 1 : 1 + 0.4 * Math.exp(-(t - lt) / 0.08) });
    }
    b.restore();
    if (S.outT <= t) stampSeal(b, '敗', x + cw - 70, y + 70, 96, t, S.outT, { tone: 'out', rest: 8, splat: false, dur: 0.3 });
  });
  b.restore();
  // FINAL EDIT: the round verdict takes the whole screen, then collapses back onto the roster
  if (t >= M.VERDICT && t < M.V_EXIT + 0.6) verdictLayer(b, R, P, t);
  // last one standing
  if (win) {
    const dw = t - M.BR_WIN;
    // everything dims but your seat
    const cw = 336, ch = 300, gap = 20, x0 = (VW - (5 * cw + 4 * gap)) / 2, y0 = 320;
    b.save(); b.fillStyle = `rgba(15,13,11,${clamp(dw / 0.2) * 0.8})`;
    b.beginPath(); b.rect(0, 0, VW, VH); b.rect(x0 - 6, y0 - 6, cw + 12, ch + 12); b.fill('evenodd'); b.restore();
    stampSeal(b, 'CALLED IT', 640, 760, 340, t, M.BR_WIN, { tone: 'red', rest: -10, seed: 17, shadow: 'rgba(0,0,0,0.5)' });
    stampSeal(b, '勝', 830, 590, 120, t, M.BR_WIN + 0.12, { tone: 'red', rest: 6, seed: 18 });
    const r1 = riseK(dw - 0.15), r2 = riseK(dw - 0.3);
    text(b, 'Last one standing', 900, 520 + r1.y, { font: F.dela(96), color: SUMI.ink, alpha: r1.a });
    label(b, 'OUTLASTED 9 · 6 ROUNDS', 906, 580 + r1.y, { size: 26, color: SUMI.muted, alpha: r1.a });
    for (const [c, a] of [[b, 1], [R.g, 0.35 + 0.4 * Math.exp(-dw / 1.0)]]) {
      text(c, '+95', 896, 790 + r2.y, { font: F.mono(230, 800), color: SUMI.up, alpha: r2.a * a });
      text(c, 'USDC', 916 + measure(b, '+95', F.mono(230, 800)), 790 + r2.y, { font: F.mono(66, 800), color: SUMI.up, alpha: r2.a * a });
    }
  }
}
