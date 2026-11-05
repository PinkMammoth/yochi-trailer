// FINAL EDIT: the Battle Royale round verdict, rebuilt from the app (callit.win, yochi-dev:
// app/client/src/components/moment/br-verdict.tsx and styles/sumi.css). For a few seconds the screen goes to ink:
// how the candle closed, on the slash; everyone who was in the round, large, judged in turn (grey 敗, a strike
// through the name and a drain for the fallen; 残 and a lift for survivors; a cracked 命 for a lost life); then
// YOU'RE STILL IN and the room's tally, and it collapses onto the roster. The app staggers at 0.36 s; the film
// judges on the beat (0.42 s). Sizes are the app's desktop x1.6.
import { M } from '../core/music.js';
import { clamp, lerp, E } from '../core/math.js';
import { SUMI, F } from '../lib/brand.js';
import { text, label, measure, seal, stampSeal, stampK, impactK, bezier } from '../lib/draw.js';
import { portrait } from './standoff.js';

const K = 1.6;
const SLASH_E = bezier(0.6, 0, 0.2, 1);
const COLLAPSE_E = bezier(0.6, 0, 0.3, 1);
const LIVE_E = bezier(0.2, 0.9, 0.3, 1.2);

// FIRST AD: the final round: it closed DOWN; five were in it, four go out, you're the last one standing
export const VERDICT_PLAYERS = [
  { id: 'bloodsport', h: 'mira', pick: 'UP', res: 'OUT' },
  { id: 'last-legend', h: 'deano', pick: 'UP', res: 'OUT' },
  { id: 'ronin', h: 'soup', pick: 'UP', res: 'OUT' },
  { id: 'whale', h: 'kaze', pick: 'UP', res: 'OUT' },
  { id: 'duel-master', h: 'mamo', pick: 'DOWN', res: 'WINNER', you: true },
];

function tile(c, P, x, y, w, t, d) {
  const out = P.res === 'OUT';
  const h = w + 128;
  // yo-impact on the fallen, yo-verdict-live (a lift with an ink ring) on survivors
  let ox = 0, oy = 0, ring = 0;
  if (out) [ox, oy] = impactK(t - d, P.you ? 1.4 * K : K);
  else if (t >= d) {
    const u = clamp((t - d) / 0.55);
    const k = u < 0.35 ? LIVE_E(u / 0.35) : 1 - LIVE_E((u - 0.35) / 0.65);
    oy = -6 * K * k; ring = k;
  }
  const g = out ? clamp((t - d - 0.15) / 0.5) : 0; // yo-verdict-out: to grey, to half
  c.save(); c.translate(x + ox, y + oy);
  c.save(); c.globalAlpha *= 1 - 0.5 * g;
  c.fillStyle = P.you ? '#2a2520' : SUMI.s1; c.fillRect(0, 0, w, h);
  c.strokeStyle = P.you ? SUMI.red : SUMI.line; c.lineWidth = P.you ? 2 * K : 1.5; c.strokeRect(0, 0, w, h);
  if (ring > 0) { c.strokeStyle = SUMI.ink; c.globalAlpha *= ring; c.lineWidth = 2 * K; c.strokeRect(-2 * K, -2 * K, w + 4 * K, h + 4 * K); c.globalAlpha /= ring; }
  const p = 10 * K, aw = w - 2 * p;
  portrait(c, P.id, p, p, aw, aw, true, { zoom: 1.9, hy: 0.36, grey: g });
  const nm = P.you ? 'YOU' : P.h;
  const nf = F.dela(16 * K);
  text(c, nm, w / 2, p + aw + 40, { font: nf, color: SUMI.ink, align: 'center' });
  // the strike through the fallen name
  if (out && t >= d + 0.2) {
    const nw = measure(c, nm, nf), su = clamp((t - d - 0.2) / 0.28);
    c.fillStyle = SUMI.ink; c.fillRect(w / 2 - nw / 2, p + aw + 30, nw * su, 3 * K * 0.8);
  }
  label(c, P.pick === 'UP' ? '▲ UP' : '▼ DOWN', w / 2, p + aw + 72, { size: 10 * K, weight: 800, color: P.pick === 'UP' ? SUMI.up : SUMI.down, align: 'center', track: 0.14 * 10 * K });
  const st = out ? 'OUT' : P.res === 'LIFE' ? 'LOST A LIFE' : P.res === 'WINNER' ? 'LAST ONE STANDING' : 'STILL STANDING';
  label(c, st, w / 2, p + aw + 102, { size: 10 * K, weight: 800, color: out ? SUMI.out : SUMI.ink, align: 'center', track: 0.14 * 10 * K, alpha: clamp((t - d - 0.12) / 0.3) });
  c.restore();
  // the seals
  if (out) stampSeal(c, '敗', w / 2, w / 2, 92 * K, t, d, { tone: 'out', rest: -12, splat: false });
  else stampSeal(c, P.res === 'WINNER' ? '勝' : '残', w + 3 * K - 8, -3 * K + 8, 40 * K * (P.res === 'WINNER' ? 1.5 : 1), t, d + 0.05, { tone: P.you || P.res === 'WINNER' ? 'red' : 'ink', rest: 7, splat: P.res === 'WINNER' });
  if (P.res === 'LIFE' && t >= d + 0.15) {
    // yo-life-crack: a wobble, then it drains to a quarter
    const u = clamp((t - d - 0.15) / 0.6);
    const [r, s, a] = u < 0.3 ? [lerp(0, -14, u / 0.3), lerp(1, 1.15, u / 0.3), 1] : u < 0.55 ? [lerp(-14, 10, (u - 0.3) / 0.25), lerp(1.15, 0.95, (u - 0.3) / 0.25), 1] : [lerp(10, 0, (u - 0.55) / 0.45), lerp(0.95, 0.9, (u - 0.55) / 0.45), lerp(1, 0.25, (u - 0.55) / 0.45)];
    seal(c, '命', -2 * K + 12, -2 * K + 12, 30 * K, { tone: 'red', rot: -8 + r, s, a });
  }
  c.restore();
}

export function verdictLayer(c, R, P, t) {
  const { VW, VH } = R;
  const d0 = t - M.VERDICT;
  if (d0 < 0) return;
  const cu = t >= M.V_EXIT ? COLLAPSE_E(clamp((t - M.V_EXIT) / 0.55)) : 0;
  const op = (cu < 0.75 ? 1 : 1 - (cu - 0.75) / 0.25) * clamp(d0 / 0.3);
  if (op <= 0) return;
  c.save();
  c.globalAlpha = op;
  // collapses onto the roster (centre 470 + 155, about its size)
  c.translate(VW / 2, VH / 2 + (625 - VH / 2) * cu); c.scale(lerp(1, 0.9, cu), lerp(1, 0.6, cu)); c.translate(-VW / 2, -VH / 2);
  c.fillStyle = SUMI.bg; c.fillRect(0, 0, VW, VH);
  // the candle's verdict, on the slash
  const sy = 232, sh = 176 * 1.5;
  const w = SLASH_E(clamp((d0 - 0.05) / 0.32));
  c.fillStyle = '#e5482c';
  c.beginPath(); c.moveTo(0, sy - sh / 2 + sh * 0.18); c.lineTo(VW * w, sy - sh / 2 + sh * 0.18 * (1 - w)); c.lineTo(VW * w, sy - sh / 2 + sh * (0.82 + 0.18 * (1 - w))); c.lineTo(0, sy + sh / 2); c.closePath(); c.fill();
  label(c, 'HALF THE ROOM, GONE', VW / 2, sy - 74, { size: 12 * K, weight: 800, color: SUMI.onRed, align: 'center', track: 0.3 * 12 * K, alpha: clamp((d0 - 0.2) / 0.3) });
  const k = stampK(d0 - 0.25, -2);
  c.save(); c.translate(VW / 2, sy + 34); c.rotate(k.r * Math.PI / 180); c.scale(k.s, k.s); c.globalAlpha *= k.a;
  // the arrow, drawn, then the words
  const tf = F.dela(64 * 1.5), tw = measure(c, 'CLOSED DOWN', tf), ts = 52;
  c.fillStyle = SUMI.onRed; c.beginPath();
  c.moveTo(-tw / 2 - ts - 24, -60); c.lineTo(-tw / 2 - 24, -60); c.lineTo(-tw / 2 - 24 - ts / 2, -14); c.closePath(); c.fill();
  text(c, 'CLOSED DOWN', ts / 2, 0, { font: tf, color: SUMI.onRed, align: 'center' });
  c.restore();
  label(c, '41.86 → 41.79', VW / 2, sy + 86, { size: 12 * K, weight: 800, color: SUMI.onRed, align: 'center', track: 0.2 * 12 * K, alpha: clamp((d0 - 0.45) / 0.3) });
  // everyone who was in the round, judged in turn
  const tw2 = 172 * 1.95, gap = 16 * K, n = VERDICT_PLAYERS.length;
  const x0 = (VW - (n * tw2 + (n - 1) * gap)) / 2, y0 = 405;
  VERDICT_PLAYERS.forEach((Pl, i) => tile(c, Pl, x0 + i * (tw2 + gap), y0, tw2, t, M.JUDGE[i]));
  // your result, then the room's
  const ta = clamp((t - M.TALLY) / 0.55);
  if (ta > 0) {
    const tf2 = F.dela(3.4 * 16 * K), s = "You're still in", wv = measure(c, s, tf2);
    c.save(); c.beginPath(); c.rect(VW / 2 - wv / 2 - 20, 910, (wv + 40) * E.outCubic(ta), 140); c.clip();
    text(c, s, VW / 2, 1000, { font: tf2, color: SUMI.ink, align: 'center' });
    c.restore();
  }
  label(c, '4 OUT · 1 LEFT', VW / 2, 1050, { size: 12 * K, weight: 800, color: SUMI.muted, align: 'center', track: 0.24 * 12 * K, alpha: clamp((t - M.TALLY - 0.2) / 0.3) });
  c.restore();
}
