// ACT 2, sumi: the ink flood, PERMA-BULL 対 DOOMER, the board, 0:01, CALLED IT, +19 USDC, 敗.
import { M, BEAT } from '../core/music.js';
import { clamp, lerp, E, noise1 } from '../core/math.js';
import { SUMI, PAPER, F } from '../lib/brand.js';
import { sumi, text, label, measure, stampSeal, seal, impactK, riseK, slamK } from '../lib/draw.js';
import { CAST, drawFig } from '../lib/cast.js';
import { versusBand, chart, timer, pickButtons, makeCandles } from '../lib/ui.js';
import { gridShot, gridLayout, starterRect } from './act1.js';
import { inkFlood, roundCallout } from '../lib/ui.js';
import { standoffLayer } from './standoff.js';

const YOU = 'starter-perma-bull', THEM = 'starter-doomer';
const STRIKE = 41.83;
// FINAL EDIT: best of 3. Round 1's candle (41.78 -> 41.83, yours) becomes the last of round 2's history.
const STRIKE1 = 41.78;
const HIST1 = (() => { const c = makeCandles(7, 25, 41.62, 0.03, 0.006); const d = STRIKE1 - c[c.length - 1].c; return c.map((k) => ({ o: k.o + d, c: k.c + d, h: k.h + d, l: k.l + d })); })();
const R1C = { o: STRIKE1, c: STRIKE, h: STRIKE + 0.012, l: STRIKE1 - 0.014 };
const HIST = [...HIST1, R1C];
const R2_AT = () => M.CALLOUT + 0.36; // the board turns to round 2 while the call-out's slash covers it
function liveCandle1(t) {
  const w = t - M.BOARD;
  let c = STRIKE1 + 0.012 + noise1(w * 2.4 + 9) * 0.03 + Math.sin(w * 4.3) * 0.008;
  let h = Math.max(STRIKE1, c) + 0.01, l = Math.min(STRIKE1, c) - 0.014;
  if (t >= M.R1_CLOSE) { const u = E.outExpo(clamp((t - M.R1_CLOSE) / 0.12)); c = lerp(c, STRIKE, u); h = Math.max(h, R1C.h * u + h * (1 - u)); }
  return { o: STRIKE1, c, h: Math.max(h, c), l: Math.min(l, c) };
}
const RANGE = [Math.min(...HIST.map((k) => k.l)) - 0.02, Math.max(STRIKE + 0.1, ...HIST.map((k) => k.h)) + 0.02];

// the ink drop lands between the two locked cards
export function inkShot(t, R, P) {
  const L = gridLayout(R);
  const [ax, ay, aw, ah] = starterRect(L, YOU), [bx] = starterRect(L, THEM);
  const cx = (ax + aw + bx) / 2, cy = ay + ah / 2;
  gridShot(t, R, P);
  inkFlood(R.b, R, cx, cy, t, M.INK, { dur: 0.42, seed: 4 });
}

// live candle: wanders around the strike, freezes at 0:01 just under it, snaps closed UP on the drop
function liveCandle(t) {
  const tt = Math.min(t, M.FREEZE);
  const w = (tt - M.BOARD2);
  let c = STRIKE + noise1(w * 2.2 + 4) * 0.035 + Math.sin(w * 5.1) * 0.01;
  if (t >= M.FREEZE - 0.4) c = lerp(c, STRIKE - 0.006, clamp((tt - (M.FREEZE - 0.4)) / 0.4));
  let h = Math.max(STRIKE, c) + 0.012, l = Math.min(STRIKE, c) - 0.02;
  if (t >= M.DROP) {
    const u = E.outExpo(clamp((t - M.DROP) / 0.1));
    c = lerp(STRIKE - 0.006, STRIKE + 0.075, u); h = Math.max(h, c + 0.01 * u);
  }
  return { o: STRIKE, c, h: Math.max(h, c), l: Math.min(l, c) };
}

function fighter(c, id, hx, hy, k, o = {}) { drawFig(c, id, hx, hy, k, o); }

export function fightShot(t, R, P) {
  const { b, VW, VH } = R;
  sumi(R);
  // phase 1: the versus band, big; phase 2: the band rises and becomes the board's header
  const u = E.inOutCubic(clamp((t - M.BOARD) / 0.35));
  const bandY = lerp(430, 36, u), bandH = lerp(330, 220, u);
  const bandX = 0; // FINAL EDIT: the band is where the standoff collapses to (it used to slide in from the right)
  // the stamped surface shakes when CALLED IT lands
  const [ix, iy] = impactK(t - M.STAMP, 1);
  b.save(); b.translate(ix, iy);
  b.save(); b.translate(bandX, 0);
  const r2 = t >= R2_AT();
  const score = t >= M.STAMP ? '2 - 0' : t >= M.R1_WIN ? '1 - 0' : '0 - 0';
  versusBand(b, R, bandY, bandH, { slashW: lerp(260, 170, u), round: u > 0.5 ? (r2 ? 'ROUND 2' : 'ROUND 1') : null, score: u > 0.5 ? score : null });
  // fighters: in phase 1 they break the band's top edge; in phase 2 they sit inside it as busts
  const greyT = clamp((t - M.LOSER) / 0.35);
  for (const [id, side] of [[YOU, -1], [THEM, 1]]) {
    const enter = E.outExpo(clamp((t - M.VS - 0.05) / 0.22));
    const hx = lerp(VW / 2 + side * 520, VW / 2 + side * 720, u) + side * (1 - enter) * 600;
    const hy = lerp(250, bandY + 92, u);
    const k = lerp(0.52, 0.2, u) * (side < 0 ? 1 : 1.02);
    b.save();
    b.beginPath(); b.rect(side < 0 ? 0 : VW / 2 + 160, lerp(-200, bandY, u), VW / 2 - 160, bandY + bandH - lerp(-200, bandY, u)); b.clip();
    fighter(b, id, hx, hy, k, id === THEM ? { v: 'grey', mix: greyT } : {});
    b.restore();
  }
  // names under the band (phase 1) or in it (phase 2)
  const nm = (id, nmTxt, handle, side, col) => {
    const x = side < 0 ? lerp(110, 470, u) : lerp(VW - 110, VW - 470, u);
    const align = side < 0 ? (u > 0.5 ? 'left' : 'left') : 'right';
    const y = lerp(bandY + bandH + 110, bandY + 110, u);
    const size = lerp(96, 54, u);
    const c1 = u > 0.5 ? PAPER.ink : SUMI.ink;
    const loser = id === THEM ? greyT : 0;
    text(b, nmTxt, x, y, { font: F.dela(size), color: loser > 0.5 ? (u > 0.5 ? PAPER.out : SUMI.out) : c1, align });
    label(b, handle, x, y + lerp(52, 40, u), { size: 22, color: col, align });
  };
  if (t >= M.VS + 0.12) {
    nm(YOU, 'PERMA-BULL', 'YOU · mamo', -1, u > 0.5 ? PAPER.redText : SUMI.red);
    nm(THEM, 'DOOMER', 'exit_liquidity', 1, u > 0.5 ? PAPER.muted : SUMI.muted);
  }
  // pick chips in the band
  if (u > 0.5) {
    const chip = (x, y, s, col, align) => {
      b.save(); b.font = F.dela(34); const w = b.measureText(s).width + 30;
      const xx = align === 'right' ? x - w : x;
      b.strokeStyle = col; b.lineWidth = 3; b.strokeRect(xx, y, w, 50); text(b, s, xx + 15, y + 38, { font: F.dela(34), color: col });
      b.restore();
    };
    const [pyou, pthem] = r2 ? [M.PICK_YOU, M.PICK_THEM] : [M.R1_YOU, M.R1_THEM];
    if (t >= pyou) chip(470, bandY + 160, '▲ UP', PAPER.up, 'left');
    if (t >= pthem) chip(VW - 470, bandY + 160, '▼ DOWN', greyT > 0.5 ? PAPER.out : PAPER.down, 'right');
    // best of 3: two tally boxes a side; 勝 stamps into yours per round won (mock-duel.png)
    for (let i = 0; i < 2; i++) {
      const xs = [[690 + i * 58, 'l'], [VW - 690 - 48 - i * 58, 'r']];
      for (const [x] of xs) { b.save(); b.strokeStyle = 'rgba(22,19,15,0.4)'; b.lineWidth = 2; b.setLineDash([6, 5]); b.strokeRect(x, bandY + 160, 48, 48); b.restore(); }
    }
    stampSeal(b, '勝', 690 + 24, bandY + 184, 54, t, M.R1_WIN, { tone: 'red', ground: 'paper', color: PAPER.red, rest: -6, seed: 70, dur: 0.35 });
    stampSeal(b, '勝', 690 + 58 + 24, bandY + 184, 54, t, M.STAMP + 0.3, { tone: 'red', ground: 'paper', color: PAPER.red, rest: 5, seed: 71, dur: 0.35 });
  }
  b.restore();
  // ROUND 1 header (phase 1 only)
  if (t >= M.ROUND && u < 1) {
    const k = slamK(t - M.ROUND, 1.5, 0.14);
    b.save(); b.globalAlpha = (1 - u) * k.a; b.translate(VW / 2, 200); b.scale(k.s, k.s);
    text(b, 'ROUND 1', 0, 0, { font: F.dela(96), color: SUMI.ink, align: 'center', track: 4, stroke: SUMI.bg, strokeW: 16 });
    b.restore();
    label(b, 'DUEL · BEST OF 3 · HYPE 1M · POT 20 USDC', VW / 2, 1036, { size: 24, color: SUMI.muted, align: 'center', alpha: (1 - u) * k.a });
  }
  // FLAGSHIP, the final second (from TEN SECONDS): the board strips away to the candle and the strike, the camera
  // pushes in on the price marker, the margin is drawn, and the arcade timer holds 0:01 through the dropout.
  const foc = t < M.DROP ? E.inOutCubic(clamp((t - M.FOCUS) / (M.FREEZE - M.FOCUS))) : 1 - E.outExpo(clamp((t - M.DROP) / 0.22));
  const LIVE_X = 140 + (970 / 30) * 26.5, STRIKE_TAG = 1172;
  const sy = lerp(950, 420, (STRIKE - RANGE[0]) / (RANGE[1] - RANGE[0]));
  const FX = lerp(LIVE_X, STRIKE_TAG, 0.32), FY = sy;
  const Z = 1 + 1.15 * foc;
  const focusT = (c) => { c.translate(lerp(FX, VW * 0.4, foc), lerp(FY, VH * 0.5, foc)); c.scale(Z, Z); c.translate(-FX, -FY); };
  // the board
  if (u > 0) {
    const by = lerp(VH, 0, u);
    b.save();
    if (foc > 0) focusT(b);
    b.translate(0, by);
    // the drop: the board punches in on the closing candle
    if (t >= M.DROP) {
      const pk = Math.exp(-(t - M.DROP) / 0.14) * 0.09;
      b.translate(1180, 560); b.scale(1 + pk, 1 + pk); b.translate(-1180, -560);
      if (t - M.DROP < 0.12) { P.zoomBlur = 0.06 * (1 - (t - M.DROP) / 0.12); P.zoomCenter = [1180 / 1920, 1 - 560 / 1080]; }
    }
    let sec, drain;
    if (!r2) {
      // round 1: four seconds to the close, it closes UP, it's yours
      const live = liveCandle1(t);
      chart(b, 100, 300, 1160, 700, { candles: HIST1, live, strike: STRIKE1, price: live.c, slots: 30, range: RANGE, liveBox: t < M.R1_CLOSE });
      const remain = clamp(4 - (t - M.BOARD) / (M.R1_CLOSE - M.BOARD) * 4, 0, 4);
      sec = Math.ceil(remain - 1e-6); drain = remain / 5;
      timer(b, 1300, 300, 520, 300, sec, drain);
      pickButtons(b, 1300, 630, 520, 230, t, 'UP', M.R1_YOU);
      if (t >= M.R1_CLOSE) text(b, 'Round 1 closed UP. Yours.', 1560, 920, { font: F.zen(26, 700), color: SUMI.ink, align: 'center' });
      else if (t >= M.R1_THEM) text(b, 'You picked UP. Doomer picked DOWN.', 1560, 920, { font: F.zen(26, 500), color: SUMI.muted, align: 'center' });
    } else {
      const live = liveCandle(t);
      chart(b, 100, 300, 1160, 700, { candles: HIST, live, strike: STRIKE, price: live.c, slots: 30, range: RANGE });
      const tt = Math.min(t, M.FREEZE);
      const remain = clamp(5 - (tt - M.BOARD2) / (M.FREEZE - M.BOARD2) * 4, 1, 5);
      sec = t >= M.DROP ? 0 : Math.ceil(remain - 1e-6);
      drain = t >= M.DROP ? 0 : (remain - 0.82) / 5;
      b.save(); b.globalAlpha = 1 - foc; // the side panels give way to the held timer
      timer(b, 1300, 300, 520, 300, sec, drain);
      pickButtons(b, 1300, 630, 520, 230, t, 'UP', M.PICK_YOU);
      if (t >= M.PICK_YOU) text(b, t >= M.DROP ? 'It closed UP.' : 'You picked UP. Doomer picked DOWN.', 1560, 920, { font: F.zen(26, 500), color: SUMI.muted, align: 'center' });
      b.restore();
    }
    b.restore();
  }
  if (foc > 0) {
    // strip away: everything but the candle and the strike falls back into the dark
    const g = b.createRadialGradient(VW * 0.4, VH * 0.5, 80, VW * 0.4, VH * 0.5, 620);
    g.addColorStop(0, 'rgba(15,13,11,0)'); g.addColorStop(0.45, `rgba(15,13,11,${0.55 * foc})`); g.addColorStop(1, `rgba(15,13,11,${0.94 * foc})`);
    b.fillStyle = g; b.fillRect(-20, -20, VW + 40, VH + 40);
    // the margin: a hairline bracket between the candle's close and the strike, in board space
    const live = liveCandle(t);
    if (t < M.DROP) {
      const cy = lerp(950, 420, (live.c - RANGE[0]) / (RANGE[1] - RANGE[0]));
      b.save(); focusT(b);
      const bx = LIVE_X + 34;
      b.globalAlpha = foc; b.strokeStyle = SUMI.ink; b.lineWidth = 1.4;
      b.beginPath(); b.moveTo(bx - 6, sy); b.lineTo(bx + 6, sy); b.moveTo(bx, sy); b.lineTo(bx, cy); b.moveTo(bx - 6, cy); b.lineTo(bx + 6, cy); b.stroke();
      const d = live.c - STRIKE;
      text(b, (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(3), bx + 14, (sy + cy) / 2 + 26, { font: F.mono(17, 800), color: SUMI.ink });
      label(b, 'TO THE STRIKE', bx + 14, (sy + cy) / 2 + 44, { size: 9, color: SUMI.muted });
      b.restore();
    }
    // the arcade timer, huge, holding
    const tt = Math.min(t, M.FREEZE);
    const remain = clamp(5 - (tt - M.BOARD2) / (M.FREEZE - M.BOARD2) * 4, 1, 5);
    const sec = t >= M.DROP ? 0 : Math.ceil(remain - 1e-6);
    const drain = t >= M.DROP ? 0 : (remain - 0.82) / 5;
    b.save(); b.globalAlpha = foc;
    const sg = b.createLinearGradient(1080, 0, 1260, 0);
    sg.addColorStop(0, 'rgba(15,13,11,0)'); sg.addColorStop(1, 'rgba(15,13,11,0.97)');
    b.fillStyle = sg; b.fillRect(1080, 0, VW - 1080, VH);
    b.fillStyle = 'rgba(15,13,11,0.9)'; b.fillRect(0, 0, VW, 150);
    label(b, 'PICKS LOCK IN', 1260, 330, { size: 26, color: SUMI.muted });
    text(b, `0:${String(sec).padStart(2, '0')}`, 1250, 560, { font: F.dela(210), color: SUMI.ink, track: 4, maxW: 600 });
    b.fillStyle = 'rgba(239,231,216,0.12)'; b.fillRect(1260, 610, 560, 16);
    b.fillStyle = SUMI.red; b.fillRect(1260, 610, 560 * clamp(drain), 16);
    label(b, 'YOU: UP · DOOMER: DOWN', 1260, 690, { size: 22, color: SUMI.muted });
    b.restore();
  }
  b.restore(); // impact
  // CALLED IT, the payoff, then +19 USDC
  if (t >= M.STAMP - 0.1) {
    const dim = clamp((t - M.STAMP + 0.06) / 0.2) * 0.78;
    b.fillStyle = `rgba(15,13,11,${dim})`; b.fillRect(0, 280, VW, VH);
    stampSeal(b, 'CALLED IT', 560, 640, 420, t, M.STAMP, { tone: 'red', rest: -10, seed: 12, shadow: 'rgba(0,0,0,0.5)' });
  }
  if (t >= M.RISE) {
    const k = riseK(t - M.RISE, 30);
    const fresh = Math.exp(-(t - M.RISE) / 1.4);
    for (const [c, a] of [[b, 1], [R.g, 0.35 + fresh * 0.45]]) {
      c.save(); c.globalAlpha = k.a * a;
      text(c, '+19', 900, 760 + k.y, { font: F.mono(240, 800), color: SUMI.up });
      text(c, 'USDC', 920 + measure(b, '+19', F.mono(240, 800)), 760 + k.y, { font: F.mono(70, 800), color: SUMI.up });
      c.restore();
    }
    label(b, 'POT 20 USDC · 5% RAKE · PAID TO mamo', 908, 830 + k.y, { size: 22, color: SUMI.muted, alpha: k.a });
  }
  // FINAL EDIT: the ROUND 2 call-out (round-callout.tsx), and the standoff collapsing onto the band
  roundCallout(b, R, t, M.CALLOUT, 'BEST OF 3', 'ROUND 2', '1 - 0');
  if (t < M.COLLAPSE + 0.5) standoffLayer(b, R, P, t);
  // Doomer goes grey: 敗
  if (t >= M.LOSER) stampSeal(b, '敗', VW - 240, 150, 130, t, M.LOSER, { tone: 'out', rest: 6, splat: false });
}
