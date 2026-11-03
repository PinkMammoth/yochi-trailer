// ACT 2, sumi: the ink flood, PERMA-BULL 対 DOOMER, the board, 0:01, CALLED IT, +19 USDC, 敗.
import { M, BEAT } from '../core/music.js';
import { clamp, lerp, E, noise1 } from '../core/math.js';
import { SUMI, PAPER, F } from '../lib/brand.js';
import { sumi, text, label, measure, stampSeal, seal, impactK, riseK, slamK } from '../lib/draw.js';
import { CAST, drawFig } from '../lib/cast.js';
import { versusBand, chart, timer, pickButtons, makeCandles } from '../lib/ui.js';
import { gridShot, gridLayout, starterRect } from './act1.js';
import { inkFlood } from '../lib/ui.js';

const YOU = 'starter-perma-bull', THEM = 'starter-doomer';
const STRIKE = 41.83;
const HIST_ = (() => { const c = makeCandles(7, 26, 41.62, 0.03, 0.006); const d = STRIKE - c[c.length - 1].c; return c.map((k) => ({ o: k.o + d, c: k.c + d, h: k.h + d, l: k.l + d })); })();

const HIST = HIST_;
const RANGE = [Math.min(...HIST.map((k) => k.l)) - 0.02, Math.max(STRIKE + 0.1, ...HIST.map((k) => k.h)) + 0.02];

// the ink drop lands between the two locked cards
export function inkShot(t, R, P) {
  const L = gridLayout(R);
  const [ax, ay, aw, ah] = starterRect(L, YOU), [bx] = starterRect(L, THEM);
  const cx = (ax + aw + bx) / 2, cy = ay + ah / 2;
  gridShot(t, R, P);
  inkFlood(R.b, R, cx, cy, t, M.INK, { dur: 0.4, seed: 4 });
}

// live candle: wanders around the strike, freezes at 0:01 just under it, snaps closed UP on the drop
function liveCandle(t) {
  const tt = Math.min(t, M.FREEZE);
  const w = (tt - M.BOARD);
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
  const vsIn = E.outExpo(clamp((t - M.VS) / 0.2));
  const bandX = lerp(VW * 1.1, 0, vsIn);
  if (t - M.VS < 0.16) P.blurVec = [0.03 * (1 - (t - M.VS) / 0.16), 0];
  // the stamped surface shakes when CALLED IT lands
  const [ix, iy] = impactK(t - M.STAMP, 1);
  b.save(); b.translate(ix, iy);
  // ROUND 1 header (phase 1 only)
  if (t >= M.ROUND && u < 1) {
    const k = slamK(t - M.ROUND, 1.5, 0.14);
    b.save(); b.globalAlpha = (1 - u) * k.a; b.translate(VW / 2, 200); b.scale(k.s, k.s);
    text(b, 'ROUND 1', 0, 0, { font: F.dela(110), color: SUMI.ink, align: 'center', track: 4 });
    b.restore();
    label(b, 'DUEL · SUDDEN DEATH · HYPE 1M · POT 20 USDC', VW / 2, 268, { size: 24, color: SUMI.muted, align: 'center', alpha: (1 - u) * k.a });
  }
  b.save(); b.translate(bandX, 0);
  versusBand(b, R, bandY, bandH, { slashW: lerp(260, 170, u) });
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
    if (t >= M.PICK_YOU) chip(470, bandY + 160, '▲ UP', PAPER.up, 'left');
    if (t >= M.PICK_THEM) chip(VW - 470, bandY + 160, '▼ DOWN', greyT > 0.5 ? PAPER.out : PAPER.down, 'right');
  }
  b.restore();
  // the board
  if (u > 0) {
    const by = lerp(VH, 0, u);
    b.save(); b.translate(0, by);
    const live = liveCandle(t);
    chart(b, 100, 300, 1160, 700, { candles: HIST, live, strike: STRIKE, price: live.c, slots: 30, range: RANGE });
    const tt = Math.min(t, M.FREEZE);
    const remain = clamp(5 - (tt - M.BOARD) / (M.FREEZE - M.BOARD) * 4, 1, 5);
    const sec = t >= M.DROP ? 0 : Math.ceil(remain - 1e-6);
    const drain = t >= M.DROP ? 0 : (remain - 0.82) / 5;
    timer(b, 1300, 300, 520, 300, sec, drain);
    pickButtons(b, 1300, 630, 520, 230, t, 'UP', M.PICK_YOU);
    if (t >= M.PICK_YOU) text(b, t >= M.DROP ? 'It closed UP.' : 'You picked UP. Doomer picked DOWN.', 1560, 920, { font: F.zen(26, 500), color: SUMI.muted, align: 'center' });
    b.restore();
  }
  b.restore(); // impact
  // CALLED IT, the payoff, then +19 USDC
  if (t >= M.STAMP - 0.275) {
    const dim = clamp((t - M.STAMP + 0.1) / 0.3) * 0.78;
    b.fillStyle = `rgba(15,13,11,${dim})`; b.fillRect(0, 280, VW, VH);
    stampSeal(b, 'CALLED IT', 560, 640, 420, t, M.STAMP - 0.275, { tone: 'red', rest: -10, seed: 12, shadow: 'rgba(0,0,0,0.5)' });
  }
  if (t >= M.RISE) {
    const k = riseK(t - M.RISE, 30);
    const fresh = Math.exp(-(t - M.RISE) / 1.4);
    for (const [c, a] of [[b, 1], [R.g, 0.55 + fresh * 0.6]]) {
      c.save(); c.globalAlpha = k.a * a;
      text(c, '+19', 900, 760 + k.y, { font: F.mono(240, 800), color: SUMI.up });
      text(c, 'USDC', 920 + measure(b, '+19', F.mono(240, 800)), 760 + k.y, { font: F.mono(70, 800), color: SUMI.up });
      c.restore();
    }
    label(b, 'POT 20 USDC · 5% RAKE · PAID TO mamo', 908, 830 + k.y, { size: 22, color: SUMI.muted, alpha: k.a });
  }
  // Doomer goes grey: 敗
  if (t >= M.LOSER) stampSeal(b, '敗', VW - 240, 150, 130, t, M.LOSER, { tone: 'out', rest: 6, splat: false });
}
