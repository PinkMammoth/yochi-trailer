// HOOK (5 Nov): the question before anyone answers it. One bar on paper: the HYPE chart climbing to the strike
// line, the next candle a dashed "?" box, and UP / OR / DOWN? landing on the first three beats where they belong
// (UP above the line, OR on it, DOWN? below). The next shot (a stranger, ▼ DOWN) answers it.
import { M } from '../core/music.js';
import { clamp, lerp, E, noise1 } from '../core/math.js';
import { PAPER, F } from '../lib/brand.js';
import { paper, text, label, measure, impactK, slamK } from '../lib/draw.js';
import { makeCandles } from '../lib/ui.js';

const STRIKE = 41.83, LINE_Y = 560;
const HIST = (() => { const c = makeCandles(11, 16, 41.55, 0.03, 0.017); const d = STRIKE - 0.004 - c[c.length - 1].c; return c.map((k) => ({ o: k.o + d, c: k.c + d, h: k.h + d, l: k.l + d })); })();
const LO = Math.min(...HIST.map((k) => k.l)) - 0.01, HI = STRIKE + 0.12;
const Y = (p) => lerp(980, 170, (p - LO) / (HI - LO)) + (LINE_Y - lerp(980, 170, (STRIKE - LO) / (HI - LO)));
const X0 = 110, STEP = 44, BW = 26;
const LIVE_X = X0 + STEP * (HIST.length + 0.5);

function arrow(c, x, y, s, up, col) {
  c.beginPath();
  if (up) { c.moveTo(x, y + s * 0.42); c.lineTo(x + s, y + s * 0.42); c.lineTo(x + s / 2, y - s * 0.42); }
  else { c.moveTo(x, y - s * 0.42); c.lineTo(x + s, y - s * 0.42); c.lineTo(x + s / 2, y + s * 0.42); }
  c.closePath(); c.lineJoin = 'round'; c.lineWidth = 18; c.strokeStyle = PAPER.bg; c.stroke(); c.fillStyle = col; c.fill();
}

export function hookShot(t, R, P) {
  const { b, VW } = R;
  paper(R);
  // the sheet takes each word's hit
  const hits = M.HOOK_WORDS.map((w) => impactK(t - w, 0.8));
  const [ix, iy] = hits.reduce((a, h) => [a[0] + h[0], a[1] + h[1]], [0, 0]);
  b.save(); b.translate(ix, iy);
  // a slow push for the whole bar
  const z = 1 + 0.03 * clamp(t / M.DOOMER);
  b.translate(VW / 2, LINE_Y); b.scale(z, z); b.translate(-VW / 2, -LINE_Y);
  // the market, named: HYPE and its price
  text(b, 'HYPE', X0, 150, { font: F.dela(64), color: PAPER.ink });
  text(b, STRIKE.toFixed(2), X0 + measure(b, 'HYPE', F.dela(64)) + 28, 150, { font: F.mono(60, 700), color: PAPER.ink });
  label(b, '1-MINUTE CANDLES', X0 + 4, 196, { size: 22, color: PAPER.muted });
  // history: standard OHLC, candles stay candles
  HIST.forEach((k, i) => {
    const x = X0 + STEP * (i + 0.5), up = k.c >= k.o, col = up ? PAPER.up : PAPER.down;
    b.strokeStyle = col; b.lineWidth = 4; b.beginPath(); b.moveTo(x, Y(k.h)); b.lineTo(x, Y(k.l)); b.stroke();
    const y0 = Y(Math.max(k.o, k.c)), y1 = Y(Math.min(k.o, k.c));
    b.fillStyle = col; b.fillRect(x - BW / 2, y0, BW, Math.max(4, y1 - y0));
  });
  // the strike line, dashed, right across
  b.save(); b.strokeStyle = PAPER.ink; b.globalAlpha = 0.7; b.lineWidth = 3; b.setLineDash([14, 10]);
  b.beginPath(); b.moveTo(X0, LINE_Y); b.lineTo(VW - 80, LINE_Y); b.stroke(); b.restore();
  // the live candle, undecided, twitching across the line, inside the NEXT box
  const w = noise1(t * 2.6 + 3) * 0.022 + Math.sin(t * 9) * 0.004;
  const c = STRIKE + w, col = c >= STRIKE ? PAPER.up : PAPER.down;
  b.strokeStyle = col; b.lineWidth = 4; b.beginPath(); b.moveTo(LIVE_X, Y(Math.max(c, STRIKE) + 0.01)); b.lineTo(LIVE_X, Y(Math.min(c, STRIKE) - 0.012)); b.stroke();
  b.fillStyle = col; b.fillRect(LIVE_X - BW / 2, Y(Math.max(c, STRIKE)), BW, Math.max(4, Math.abs(Y(c) - Y(STRIKE))));
  b.save(); b.strokeStyle = PAPER.ink; b.globalAlpha = 0.55; b.lineWidth = 3; b.setLineDash([8, 7]);
  b.strokeRect(LIVE_X - 44, 260, 88, 600); b.restore();
  text(b, '?', LIVE_X, 330, { font: F.dela(64), color: PAPER.ink, align: 'center', alpha: 0.55 });
  label(b, 'NEXT', LIVE_X, 900, { size: 22, color: PAPER.muted, align: 'center' });
  b.restore();
  // the question, a word a beat, each where it lives on the chart
  const WORDS = [
    { s: 'UP', y: LINE_Y - 90, px: 250, col: PAPER.up, arrow: 'up' },
    { s: 'OR', y: LINE_Y + 42, px: 116, col: PAPER.ink },
    { s: 'DOWN?', y: LINE_Y + 290, px: 178, col: PAPER.down, arrow: 'down' },
  ];
  const RX = VW - 90;
  WORDS.forEach((W, i) => {
    const tw = M.HOOK_WORDS[i];
    if (t < tw) return;
    const k = i === 0 ? { s: 1 } : slamK(t - tw, 1.45, 0.13);
    if (i > 0 && t - tw < 0.08) P.zoomBlur = 0.04 * (1 - (t - tw) / 0.08);
    const f = F.dela(W.px), ww = measure(b, W.s, f), aw = W.arrow ? W.px * 0.42 + W.px * 0.12 : 0;
    const x0 = RX - ww - aw;
    b.save(); b.translate(x0 + (ww + aw) / 2, W.y - W.px * 0.35); b.scale(k.s, k.s); b.translate(-(x0 + (ww + aw) / 2), -(W.y - W.px * 0.35));
    if (W.arrow) arrow(b, x0, W.y - W.px * 0.36, W.px * 0.42, W.arrow === 'up', W.col);
    text(b, W.s, x0 + aw, W.y, { font: f, color: W.col, stroke: PAPER.bg, strokeW: 22 });
    b.restore();
  });
}
