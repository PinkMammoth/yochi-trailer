// The painted cast as flat cut-out layers: the figure, its own painted ground (the plate), the framed card,
// and the variants the film needs (grey for a loss, ink silhouette for a locked reward, round face crops).
// Positions are given in painting pixels (the card's inner area, 1392x1828) and placed by the head point.
import { loadImage, mk } from './draw.js';
import { SUMI, PAPER, ALL_IDS } from './brand.js';

export const CAST = {};      // id -> { j, fig, plate, card }
// LOCK (5 Nov): small portrait slots use the app's own framing (callit.win, yochi-dev, lib/avatar-roster.ts): the
// frameless 3:4 portrait and its `crop`, the square window small slots show (fractions of the art's width: x, y =
// top-left, size = side). Copied into assets/avatars/ (crops.json + portraits/), keyed by the film's ids.
export const AVATAR = {};    // id -> { img, crop }
const VAR = new Map();       // cached variants

export async function loadCast() {
  const J = await (await fetch('assets/cast/cast.json')).json();
  const have = ALL_IDS.filter((id) => J[id]);
  if (have.length < ALL_IDS.length) console.warn('cast: missing ' + ALL_IDS.filter((id) => !J[id]).join(', ') + ' (run tools/cast_prep.py)');
  await Promise.all(have.map(async (id) => {
    const [fig, plate, card] = await Promise.all([
      loadImage(`assets/cast/${id}-fig.webp`), loadImage(`assets/cast/${id}-plate.webp`), loadImage(`assets/cast/${id}-card.webp`),
    ]);
    CAST[id] = { j: J[id], fig, plate, card };
  }));
  for (const id of ALL_IDS) if (!CAST[id]) CAST[id] = CAST[have[0]]; // review-only stand-in
  const A = await (await fetch('assets/avatars/crops.json')).json();
  await Promise.all(Object.entries(A).map(async ([id, a]) => { AVATAR[id] = { img: await loadImage(a.src), crop: a.crop }; }));
}

// painting origin so that the head lands on (hx, hy) at painting scale k
export function origin(id, hx, hy, k) {
  const h = CAST[id].j.head;
  return [hx - h[0] * k, hy - h[1] * k];
}
// figure height on stage at scale k
export const figH = (id, k) => CAST[id].j.fig[3] * k;

function variant(id, kind) {
  const key = id + '|' + kind;
  if (VAR.has(key)) return VAR.get(key);
  const { fig } = CAST[id];
  const s = 0.6, w = Math.round(fig.width * s), h = Math.round(fig.height * s);
  const cv = mk(w, h), c = cv.getContext('2d');
  if (kind === 'grey' || kind === 'greyPaper') {
    c.filter = 'grayscale(1) contrast(0.72) brightness(1.1)';
    c.drawImage(fig, 0, 0, w, h);
    c.filter = 'none';
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = kind === 'grey' ? SUMI.out : PAPER.out; c.globalAlpha = 0.35; c.fillRect(0, 0, w, h);
  } else if (kind === 'sil') {
    c.drawImage(fig, 0, 0, w, h);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = PAPER.ink; c.fillRect(0, 0, w, h);
  }
  VAR.set(key, cv);
  return cv;
}

// Draw the figure with its head at (hx, hy), painting scale k.
//   o.v: 'color' | 'grey' | 'greyPaper' | 'sil'   o.mix: 0..1 crossfade from colour to o.v
export function drawFig(c, id, hx, hy, k, o = {}) {
  const C = CAST[id]; const [fx, fy, fw, fh] = C.j.fig;
  const [ox, oy] = origin(id, hx, hy, k);
  c.save();
  c.globalAlpha *= o.a ?? 1;
  const v = o.v || 'color', mix = o.mix ?? 1;
  if (v === 'color' || mix < 1) c.drawImage(C.fig, ox + fx * k, oy + fy * k, fw * k, fh * k);
  if (v !== 'color' && mix > 0) {
    c.globalAlpha *= mix;
    c.drawImage(variant(id, v), ox + fx * k, oy + fy * k, fw * k, fh * k);
  }
  c.restore();
}
// The painting's own ground, behind the figure (same placement), optionally offset for parallax.
export function drawPlate(c, id, hx, hy, k, o = {}) {
  const C = CAST[id]; const [W, H] = C.j.paint;
  const [ox, oy] = origin(id, hx, hy, k);
  c.save(); c.globalAlpha *= o.a ?? 1;
  if (o.grey) c.filter = 'grayscale(1) contrast(0.7)';
  c.drawImage(C.plate, ox + (o.dx || 0), oy + (o.dy || 0), W * k, H * k);
  c.restore();
}
// The framed card (3:4), top-left at x,y, width w.
export function drawCard(c, id, x, y, w, o = {}) {
  const C = CAST[id];
  c.save(); c.globalAlpha *= o.a ?? 1;
  if (o.grey) c.filter = 'grayscale(1) contrast(0.75) brightness(1.05)';
  c.drawImage(C.card, x, y, w, w * 4 / 3);
  c.restore();
}
// The card rect of the painting inside a card of width w at (x,y): where the inner art sits.
export function cardInner(x, y, w) {
  const s = w / 1536;
  return [x + 72 * s, y + 150 * s, 1392 * s, 1828 * s];
}

// The app's small-slot window of a portrait, in that portrait's pixels: [sx, sy, side]
export function avatarWindow(id) {
  const a = AVATAR[id]; const W = a.img.width;
  return [a.crop.x * W, a.crop.y * W, a.crop.size * W];
}
// Round face: the app's crop window, in a circle; a 512 px canvas per id and look, made once.
export function faceCanvas(id, kind = 'color') {
  const key = id + '|face|' + kind;
  if (VAR.has(key)) return VAR.get(key);
  const n = 512, cv = mk(n, n), c = cv.getContext('2d');
  c.beginPath(); c.arc(n / 2, n / 2, n / 2, 0, Math.PI * 2); c.clip();
  if (kind !== 'color') c.filter = 'grayscale(1) contrast(0.7) brightness(1.08)';
  const [sx, sy, sd] = avatarWindow(id);
  c.imageSmoothingQuality = 'high';
  c.drawImage(AVATAR[id].img, sx, sy, sd, sd, 0, 0, n, n);
  c.filter = 'none';
  if (kind !== 'color') { c.globalCompositeOperation = 'source-atop'; c.fillStyle = SUMI.out; c.globalAlpha = 0.3; c.fillRect(0, 0, n, n); }
  VAR.set(key, cv);
  return cv;
}
export function drawFace(c, id, x, y, r, o = {}) {
  c.save(); c.globalAlpha *= o.a ?? 1;
  c.drawImage(faceCanvas(id, 'color'), x - r, y - r, r * 2, r * 2);
  if (o.grey) { c.globalAlpha *= o.grey; c.drawImage(faceCanvas(id, 'grey'), x - r, y - r, r * 2, r * 2); }
  c.restore();
}
