// FLAGSHIP, Act V: the ink signature, then the end card.
//   TEAR    a loaded brush tears across the landing page, three strokes on the eighths, until it's under ink
//   GATHER  the ink pulls in from the edges, ragged and wet, pooling at its receding edge, until only the official
//           double-line Y mark (yochi-mark-paper.svg, drawn as the asset) is left
//   END     the Yochi seal (yochi-seal-paper.svg) stamps over the ink Y on the downbeat with the CALLED IT motion,
//           aligned so the Y in its knockout is exactly the ink Y; the ink is taken up into the seal
//   LOCKUP  the sealed mark moves into the lockup beside YOCHI; the tagline, the URL, the no-wallet line
import { M, BEAT, DURATION } from '../core/music.js';
import { clamp, lerp, E, noise1, noise2, mulberry32 } from '../core/math.js';
import { PAPER, F } from '../lib/brand.js';
import { paper, text, label, measure, stampK, impactK, riseK, splatter, CONTACT, mk } from '../lib/draw.js';
import { makeStroke, drawStroke } from '../lib/brush.js';
import { productShot } from './act4.js';
import { LOGO } from './end.js';

// the mark, big, at the centre of the sheet; the seal that fits it exactly (the Y fills 66% of the seal, 2% high)
const MARK = 430, CX = 960, CY = 500;
const SEAL = MARK / 0.66, SEAL_DY = 0.02 * SEAL;

let STROKES = null;
function strokes() {
  if (STROKES) return STROKES;
  const [a, b2, c] = M.TEAR;
  STROKES = [
    makeStroke({ pts: [[-260, 300], [500, 250], [1300, 330], [2180, 230]], width: 700, t0: a, dur: 0.2, seed: 21, bristles: 170, load: 1.5, dry: 0.7, lift: 0.22, splat: 22 }),
    makeStroke({ pts: [[2200, 820], [1400, 760], [600, 850], [-260, 760]], width: 720, t0: b2, dur: 0.2, seed: 22, bristles: 170, load: 1.45, dry: 0.75, lift: 0.25, splat: 22 }),
    makeStroke({ pts: [[-200, 1200], [600, 640], [1300, 420], [2150, -160]], width: 640, t0: c, dur: 0.2, seed: 23, bristles: 170, load: 1.35, dry: 0.8, lift: 0.3, splat: 26 }),
  ];
  return STROKES;
}

// the finished tear, as one sheet of ink (cached: every stroke is complete by then)
let SHEET = null;
function inkSheet(R) {
  if (SHEET) return SHEET;
  SHEET = mk(R.VW, R.VH);
  const c = SHEET.getContext('2d');
  for (const s of strokes()) drawStroke(c, s, 1e9);
  return SHEET;
}

// The receding ink: a noise field around the mark, thresholded at a level that falls over the gather. Worked out
// at quarter resolution each frame and scaled up, so its edge comes out soft, like wet ink in paper fibre.
// Returns [inkMask, wetHalo] canvases (alpha only), stage-sized when drawn.
const Q = 4;
let MASK = null, HALO = null, FIELD = null;
function recede(R, level) {
  const w = Math.ceil(R.VW / Q), h = Math.ceil(R.VH / Q);
  if (!FIELD) {
    FIELD = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const X = x * Q, Y = y * Q;
      const dx = (X - CX) / 1.25, dy = (Y - CY);
      const d = Math.hypot(dx, dy) / 1000;
      const nk = clamp(d * 2.4, 0.2, 1); // the edge is wild far out and closes cleanly onto the mark
      FIELD[y * w + x] = d + nk * (0.15 * noise2(X / 210, Y / 210) + 0.055 * noise2(X / 70 + 9, Y / 70) + 0.018 * noise2(X / 36, Y / 36 + 4));
    }
    MASK = mk(w, h); HALO = mk(w, h);
  }
  const mc = MASK.getContext('2d'), hc = HALO.getContext('2d');
  const mi = mc.createImageData(w, h), hi = hc.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const f = FIELD[i] - level;
    mi.data[i * 4 + 3] = 255 * clamp(0.5 - f / 0.012);              // the ink
    hi.data[i * 4 + 3] = 255 * Math.exp(-Math.pow((f - 0.012) / 0.014, 2)) * 0.5; // the wet line just outside it
  }
  mc.putImageData(mi, 0, 0); hc.putImageData(hi, 0, 0);
  return [MASK, HALO];
}
let INKBUF = null, HALOT = null;
function tintHalo(halo) {
  HALOT = HALOT || mk(halo.width, halo.height);
  const c = HALOT.getContext('2d');
  c.globalCompositeOperation = 'copy'; c.drawImage(halo, 0, 0);
  c.globalCompositeOperation = 'source-in'; c.fillStyle = PAPER.ink; c.fillRect(0, 0, halo.width, halo.height);
  return HALOT;
}

function drawMark(c, x, y, size, a = 1) {
  c.save(); c.globalAlpha *= a;
  // a faint bleed under the crisp mark: the asset drawn a touch larger and very light
  c.globalAlpha *= 0.08; c.drawImage(LOGO.markPaper, x - size * 0.51, y - size * 0.51, size * 1.02, size * 1.02);
  c.globalAlpha /= 0.08; c.drawImage(LOGO.markPaper, x - size / 2, y - size / 2, size, size);
  c.restore();
}

export function signatureShot(t, R, P) {
  const { b, VW, VH } = R;
  const S = strokes();
  // 1. the tear over the landing page (the page gives way to paper under the ink once it's covered)
  if (t < M.GATHER) {
    const under = clamp((t - (M.TEAR[2] + 0.12)) / 0.2);
    if (under < 1) productShot(t, R, P);
    if (under > 0) { b.save(); b.globalAlpha = under; paper(R); b.restore(); }
    for (const s of S) drawStroke(b, s, t);
    for (const [i, t0] of M.TEAR.entries()) if (t >= t0 && t - t0 < 0.12) P.blurVec = [(i === 1 ? -1 : 1) * 0.025 * (1 - (t - t0) / 0.12), 0];
    return;
  }
  paper(R);
  const dt = t - M.END;
  // the impact shake on the sheet when the seal lands
  const [ix, iy] = impactK(dt, 1);
  b.save(); b.translate(ix, iy);
  // 2. the gather: the ink inside a shrinking ragged edge, the mark emerging as the edge passes it
  const gT = clamp((t - M.GATHER) / (M.END - 0.12 - M.GATHER));
  const g = E.inOutCubic(gT);
  // where the lockup will be
  const lock = E.outExpo(clamp((t - M.LOCKUP) / 0.45));
  const ws = 150, ss = 200, ww = measure(b, 'YOCHI', F.dela(ws), 4);
  const lx = (VW - (ss + 40 + ww)) / 2 + ss / 2, ly = 330;
  const sealS = lerp(SEAL, ss, lock), sx = lerp(CX, lx, lock), syy = lerp(CY + SEAL_DY, ly, lock);
  const markS = sealS * 0.66, mx = sx, my = syy - 0.02 * sealS;
  const inkY = t < M.END ? 1 : 1 - clamp(dt / 0.25); // the ink Y is taken up into the seal
  if (inkY > 0) drawMark(b, mx, my, markS, inkY);
  if (g < 0.999) {
    const level = lerp(1.25, -0.08, g);
    const [mask, halo] = recede(R, level);
    INKBUF = INKBUF || mk(VW, VH);
    const ic = INKBUF.getContext('2d');
    ic.globalCompositeOperation = 'copy'; ic.drawImage(inkSheet(R), 0, 0);
    ic.globalCompositeOperation = 'source-over';
    // the dry streaks close up as the ink pools toward the middle
    ic.globalAlpha = clamp(0.45 + g * 1.6); ic.fillStyle = PAPER.ink; ic.fillRect(0, 0, VW, VH); ic.globalAlpha = 1;
    ic.globalCompositeOperation = 'destination-in'; ic.imageSmoothingQuality = 'high'; ic.drawImage(mask, 0, 0, VW, VH);
    ic.globalCompositeOperation = 'source-over';
    b.save(); b.imageSmoothingQuality = 'high';
    // the wet line: pigment pooling where the ink is drawing back
    const hb = INKBUF; // reuse the buffer's ctx after the ink is down: tint the halo as ink
    b.drawImage(INKBUF, 0, 0);
    b.globalAlpha = 0.55; b.drawImage(tintHalo(halo), 0, 0, VW, VH);
    b.restore();
  }
  // a few drops left behind on the sheet as the ink pulls in
  if (t < M.END + 0.6) {
    const rnd = mulberry32(77);
    b.save(); b.fillStyle = PAPER.ink;
    for (let i = 0; i < 34; i++) {
      const a = rnd() * Math.PI * 2, d = 300 + rnd() * 700, at = rnd();
      if (g < at) continue;
      b.globalAlpha = (1 - clamp((t - M.END) / 0.6)) * 0.85;
      b.beginPath(); b.arc(CX + Math.cos(a) * d * 1.3, CY + Math.sin(a) * d * 0.7, 2 + rnd() * rnd() * 9, 0, Math.PI * 2); b.fill();
    }
    b.restore();
  }
  // 3. the seal stamps over the ink Y
  if (t >= M.END - CONTACT) {
    const k = stampK(dt + CONTACT, 0);
    b.save(); b.translate(sx, syy); b.rotate(k.r * Math.PI / 180 * (1 - lock)); b.scale(k.s, k.s); b.globalAlpha = k.a;
    b.drawImage(LOGO.sealPaper, -sealS / 2, -sealS / 2, sealS, sealS);
    b.restore();
    if (dt > 0) splatter(b, sx, syy, sealS * 0.9, PAPER.red, 31, clamp(dt / 0.05) * (1 - lock));
  }
  // 4. the lockup and the card
  if (t >= M.LOCKUP) {
    const wa = clamp((t - M.LOCKUP - 0.15) / 0.25);
    text(b, 'YOCHI', lx + ss / 2 + 40, ly + ws * 0.36, { font: F.dela(ws), color: PAPER.ink, track: 4, alpha: wa });
    const r1 = riseK(t - M.LOCKUP - 0.35), r2 = riseK(t - M.LOCKUP - 0.75), r3 = riseK(t - M.LOCKUP - 1.0);
    text(b, 'Call it right. Take the pool.', VW / 2, 580 + r1.y, { font: F.dela(86), color: PAPER.ink, align: 'center', alpha: r1.a });
    text(b, 'yochigg.xyz', VW / 2, 730 + r2.y, { font: F.mono(84, 800), color: PAPER.redText, align: 'center', alpha: r2.a });
    label(b, 'TRY A ROUND · NO WALLET NEEDED', VW / 2, 800 + r3.y, { size: 28, color: PAPER.muted, align: 'center', alpha: r3.a });
  }
  b.restore();
}
