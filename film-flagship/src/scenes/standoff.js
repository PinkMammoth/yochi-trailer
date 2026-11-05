// FINAL EDIT: the Duel standoff, rebuilt from the app (callit.win, yochi-dev:
// app/client/src/components/moment/duel-standoff.tsx and styles/sumi.css). The screen splits along the slash: you on
// the vermilion half, your rival on the ink half, faces large, names in the display face, rank and the grudge record
// under each; 対 stamps on the seam with the stake; it holds with a live PICKS OPEN IN, then collapses into the
// versus band. The app's beats (seconds from mount) are kept; only the scale is the film's (the app's desktop sizes
// x1.6, since the film frame is a 1920 stage seen on a phone).
import { M } from '../core/music.js';
import { clamp, lerp, E } from '../core/math.js';
import { SUMI, F } from '../lib/brand.js';
import { sumi, text, label, measure, stampSeal, impactK, bezier } from '../lib/draw.js';
import { drawFig, drawPlate, CAST } from '../lib/cast.js';

const K = 1.6;
const SLIDE = bezier(0.2, 0.9, 0.3, 1);           // yo-from-left / yo-from-right, 0.42 s
const COLLAPSE_E = bezier(0.6, 0, 0.3, 1);        // yo-collapse
const RISE = bezier(0, 0, 0.58, 1);
const RED_FILL = '#e5482c';                       // --yo-red-fill on sumi

const SIDES = [
  { id: 'starter-perma-bull', which: 'a', you: true, eyebrow: 'YOU', name: 'mamo', chips: ['LV 4 · TRADER'] },
  { id: 'starter-doomer', which: 'b', you: false, eyebrow: 'NEMESIS', name: 'exit_liquidity', chips: ['LV 5 · WHALE'] },
];

// the painting, cropped into the notched portrait box (object-fit: cover, top)
export function portrait(c, id, x, y, w, h, notchRight, o = {}) {
  const C = CAST[id];
  c.save();
  c.beginPath();
  if (notchRight) { c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h * 0.86); c.lineTo(x + w * 0.82, y + h); c.lineTo(x, y + h); }
  else { c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h); c.lineTo(x + w * 0.18, y + h); c.lineTo(x, y + h * 0.86); }
  c.closePath(); c.fillStyle = SUMI.bg; c.fill(); c.clip();
  const k = ((o.zoom || 1.55) * h) / C.j.fig[3];
  const hx = x + w / 2, hy = y + h * (o.hy || 0.3);
  if (o.grey) c.filter = `grayscale(${o.grey})`;
  drawPlate(c, id, hx, hy, k);
  drawFig(c, id, hx, hy, k);
  c.filter = 'none';
  c.restore();
}

// one half: the clip along the slash, the ground, the face and the name in the half's own corner
function half(c, R, S, t, push) {
  const { VW, VH } = R;
  const b = S.which === 'b';
  const sl = SLIDE(clamp((t - M.SO_IN) / 0.42));
  const dx = (b ? 1 : -1) * VW * 0.7 * (1 - sl);
  c.save();
  c.translate(dx, 0);
  c.beginPath();
  if (!b) { c.moveTo(0, 0); c.lineTo(VW * 0.57, 0); c.lineTo(VW * 0.43, VH); c.lineTo(0, VH); }
  else { c.moveTo(VW * 0.57, 0); c.lineTo(VW, 0); c.lineTo(VW, VH); c.lineTo(VW * 0.43, VH); }
  c.closePath();
  c.fillStyle = S.you ? RED_FILL : '#1a1714'; c.fill();
  c.clip();
  // the cinematic hold: a slow push on each half, about its own corner
  const ink = S.you ? SUMI.onRed : SUMI.ink;
  const muted = S.you ? 'rgba(20,15,12,0.72)' : SUMI.muted;
  const pw = 230 * 1.35, ph = 300 * 1.35, gap = 24 * K;
  const px = b ? VW * 0.95 - pw : VW * 0.05;
  const py = b ? VH * 0.87 - ph : VH * 0.13;
  c.translate(px + pw / 2, py + ph / 2); c.scale(push, push); c.translate(-px - pw / 2, -py - ph / 2);
  // face rises at +0.3
  const r = RISE(clamp((t - M.SO_IN - 0.22) / 0.45));
  c.save(); c.globalAlpha = r; c.translate(0, 24 * K * (1 - r));
  portrait(c, S.id, px, py, pw, ph, !b);
  c.restore();
  // the text column beside the face
  const tx = b ? px - gap : px + pw + gap;
  const align = b ? 'right' : 'left';
  const cy = py + ph / 2;
  const fe = clamp((t - M.SO_IN - 0.32) / 0.3);
  label(c, S.eyebrow, tx, cy - 70, { size: 13 * K, color: !S.you ? SUMI.red : muted, align, alpha: fe, track: 0.28 * 13 * K });
  // the name, brushed in from the left (yo-brush: a feathered mask sweeping across, 0.55 s)
  const nf = F.dela(3.6 * 16 * K);
  // the name fits its half (the app truncates at 38vw): the room between the column and the slash
  const slashX = (yy) => VW * lerp(0.57, 0.43, yy / VH);
  const room = b ? tx - slashX(cy) - 60 : slashX(cy) - tx - 60;
  const nw = Math.min(measure(c, S.name, nf), room);
  const bu = clamp((t - M.SO_NAME) / 0.55);
  if (bu > 0) {
    const x0 = b ? tx - nw : tx;
    const edge = lerp(-0.05, 1.12, E.outCubic(bu)) * nw;
    // a feathered edge: a few clipped passes, fading out over the last tenth of the name
    for (let i = 0; i < 5; i++) {
      c.save();
      c.beginPath(); c.rect(x0 - 40, cy - 140, Math.max(0, edge - nw * 0.1 + i * nw * 0.025) + 40, 280); c.clip();
      text(c, S.name, tx, cy + 30, { font: nf, color: ink, align, alpha: i === 0 ? 1 : 0.3, maxW: room });
      c.restore();
    }
  }
  // chips: LV · RANK, GRUDGE
  const ca = clamp((t - M.SO_NAME - 0.15) / 0.3);
  if (ca > 0) {
    c.save(); c.globalAlpha = ca;
    const cf = F.mono(11 * K, 800);
    let x = tx;
    const items = b ? [...S.chips].reverse() : S.chips;
    for (const s of items) {
      c.font = cf; c.letterSpacing = `${0.14 * 11 * K}px`;
      const w = c.measureText(s).width + 16 * K;
      const bx = b ? x - w : x;
      c.strokeStyle = muted; c.lineWidth = 1.5; c.strokeRect(bx, cy + 64, w, 22 * K);
      label(c, s, bx + w / 2, cy + 64 + 16 * K, { size: 11 * K, color: ink, align: 'center', track: 0.14 * 11 * K });
      x += b ? -(w + 8 * K) : w + 8 * K;
    }
    c.restore();
  }
  c.restore();
}

export function standoffLayer(c, R, P, t) {
  const { VW, VH } = R;
  // the collapse onto the band (the cinematic band sits at y 430, h 330)
  const cu = t >= M.COLLAPSE ? COLLAPSE_E(clamp((t - M.COLLAPSE) / 0.5)) : 0;
  const op = cu < 0.75 ? 1 : 1 - (cu - 0.75) / 0.25;
  if (op <= 0) return;
  const toY = 430 + 165 - VH / 2, sy = lerp(1, 330 / VH, cu);
  c.save();
  c.globalAlpha = op;
  c.translate(VW / 2, VH / 2 + toY * cu); c.scale(1, sy); c.translate(-VW / 2, -VH / 2);
  // the backdrop
  c.fillStyle = 'rgba(15,13,11,0.94)'; c.fillRect(0, 0, VW, VH);
  // the hit: the halves shake when 対 lands (yo-impact 1.1 at 0.75)
  const [ix, iy] = impactK(t - M.SO_VS, 1.1 * K);
  const push = 1 + 0.035 * E.inOutSine(clamp((t - M.SO_VS) / (M.COLLAPSE - M.SO_VS)));
  c.save(); c.translate(ix, iy);
  for (const S of SIDES) half(c, R, S, t, push);
  c.restore();
  // the seam: 対 on a soft dark disc, the stake under it
  const cx = VW / 2, cy = VH / 2;
  if (t >= M.SO_VS - 0.12) {
    const g = c.createRadialGradient(cx, cy - 50, 0, cx, cy - 50, 150 * K * 0.7);
    g.addColorStop(0, 'rgba(15,13,11,0.55)'); g.addColorStop(1, 'rgba(15,13,11,0)');
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy - 50, 150 * K, 0, Math.PI * 2); c.fill();
  }
  stampSeal(c, '対', cx, cy - 50, 118 * K, t, M.SO_VS, { tone: 'ink', rest: -8, splat: false });
  const sa = clamp((t - M.SO_VS - 0.12) / 0.3);
  if (sa > 0) {
    const s = 'POT 20 USDC · WINNER TAKES IT';
    c.save(); c.globalAlpha = sa;
    c.font = F.mono(12 * K, 800); c.letterSpacing = `${0.2 * 12 * K}px`;
    const w = c.measureText(s).width + 24 * K;
    c.fillStyle = SUMI.bg; c.fillRect(cx - w / 2, cy + 45, w, 30 * K);
    label(c, s, cx, cy + 45 + 21 * K, { size: 12 * K, color: SUMI.ink, align: 'center', track: 0.2 * 12 * K });
    c.restore();
  }
  // the flash at impact (yo-flash, 0.36 s, peak 0.16 at 25%)
  const fp = (t - M.SO_VS) / 0.36;
  if (fp > 0 && fp < 1) { c.fillStyle = `rgba(255,250,240,${(fp < 0.25 ? fp / 0.25 : 1 - (fp - 0.25) / 0.75) * 0.16})`; c.fillRect(0, 0, VW, VH); }
  c.restore();
  // the live gap to the pick window, leaving with the collapse
  const la = clamp((t - M.SO_IN - 0.92) / 0.3) * (t >= M.COLLAPSE ? 1 - clamp((t - M.COLLAPSE) / 0.2) : 1);
  if (la > 0) {
    const secs = Math.max(1, Math.ceil(M.COLLAPSE + 0.4 - t));
    c.save(); c.globalAlpha = la;
    const s = 'PICKS OPEN IN';
    c.font = F.mono(12 * K, 800); c.letterSpacing = `${0.26 * 12 * K}px`;
    const w1 = c.measureText(s).width, w = w1 + 70 * K, h = 46 * K;
    const x = VW / 2 - w / 2, y = VH * 0.97 - h;
    c.fillStyle = SUMI.bg; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(239,231,216,0.16)'; c.lineWidth = 1.5; c.strokeRect(x, y, w, h);
    label(c, s, x + 16 * K, y + h / 2 + 7 * K, { size: 12 * K, color: SUMI.ink, track: 0.26 * 12 * K });
    text(c, String(secs), x + w - 30 * K, y + h / 2 + 12 * K, { font: F.dela(24 * K), color: SUMI.red, align: 'center' });
    c.restore();
  }
}

export function standoffShot(t, R, P) {
  sumi(R);
  standoffLayer(R.b, R, P, t);
}
