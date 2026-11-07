// The gameplay films: real footage, framed and cut on the music, with the film's own type on top.
// renderFilm(t, R, edit) is a pure function of t (frames are fetched from cache/, extracted by tools/frames.mjs).
import { clamp, lerp, E } from './core/math.js';
import { SUMI, PAPER, F } from './lib/brand.js';
import { text, label, measure, loadImage, slamK, sumi, paper } from './lib/draw.js';
import { M, bar, BEAT } from './core/music.js';
import { CARD_IN, STILLS, FPS } from './edl.js';
import { renderCard } from './endcard.js';

const STILL_IMG = {};
export async function initFilm(edit) {
  for (const s of edit.shots) if (s.kind === 'still' && !STILL_IMG[s.src]) STILL_IMG[s.src] = await loadImage(`../${STILLS}/${s.src}.png`);
}

// ------------------------------------------------------------------------------------------------ frames
const CACHE = new Map();
function frameIndex(shot, t) {
  const s = shot.map ? shot.map(t) : shot.s0 + (t - shot.t0) * (shot.rate ?? 1);
  return Math.max(0, Math.round(s * FPS));
}
async function frameImage(shot, t) {
  if (shot.kind === 'still') return STILL_IMG[shot.src];
  const key = `${shot.src}/${String(frameIndex(shot, t)).padStart(5, '0')}`;
  if (CACHE.has(key)) return CACHE.get(key);
  const img = await loadImage(`cache/${key}.jpg`);
  CACHE.set(key, img);
  if (CACHE.size > 12) CACHE.delete(CACHE.keys().next().value);
  return img;
}
export const shotAt = (edit, t) => edit.shots.find((s) => t >= s.t0 && t < s.t1);

// ------------------------------------------------------------------------------------------------ camera
function cam(shot, t) {
  const u = clamp((t - shot.t0) / (shot.t1 - shot.t0));
  const k = shot.cam;
  let i = 0;
  while (i < k.length - 2 && u > k[i + 1][0]) i++;
  const [u0, x0, y0, z0] = k[i], [u1, x1, y1, z1] = k[i + 1];
  const v = E.inOutSine(clamp((u - u0) / (u1 - u0 || 1)));
  return [lerp(x0, x1, v), lerp(y0, y1, v), lerp(z0, z1, v)];
}

function drawShot(R, shot, img, t) {
  const { b } = R;
  if (shot.paper) paper(R); else sumi(R);
  let [cx, cy, z] = cam(shot, t);
  // the cut lands like a hit: 2.5% over, settling in 0.16 s
  z *= slamK(t - shot.t0, 1.025, 0.16).s;
  b.save();
  b.translate(960, 540); b.scale(z, z); b.translate(-cx, -cy);
  if (shot.rect) { const [x0, y0, x1, y1] = shot.rect; b.beginPath(); b.rect(x0, y0, x1 - x0, y1 - y0); b.clip(); }
  b.imageSmoothingEnabled = true; b.imageSmoothingQuality = 'high';
  b.drawImage(img, 0, 0);
  b.restore();
}

// ------------------------------------------------------------------------------------------------ type
function backing(b, ground, a) {
  const g = b.createLinearGradient(0, 720, 0, 1080);
  const c = ground === 'paper' ? '242,236,224' : '15,13,11';
  g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(0.45, `rgba(${c},${0.78 * a})`); g.addColorStop(1, `rgba(${c},${0.94 * a})`);
  b.fillStyle = g; b.fillRect(0, 720, 1920, 360);
}
function drawSuper(R, s, t) {
  const { b } = R, dt = t - s.t0;
  const G = s.ground === 'paper' ? PAPER : SUMI;
  const k = slamK(dt, 1.14, 0.15);
  const a = clamp(dt / 0.05);
  if (s.mid) {
    b.save(); b.globalAlpha = 0.62 * clamp(dt / 0.12); b.fillStyle = SUMI.bg; b.fillRect(0, 0, 1920, 1080); b.restore();
    b.save(); b.translate(960, 560); b.scale(k.s, k.s);
    text(b, s.text, 0, 0, { font: F.dela(112), color: SUMI.ink, align: 'center', alpha: a, maxW: 1700 });
    b.restore();
    return;
  }
  backing(b, s.ground, clamp(dt / 0.1));
  const y = 990;
  b.save(); b.translate(960, y - 28); b.scale(k.s, k.s); b.translate(-960, -(y - 28));
  if (s.kick) {
    const kw = measure(b, s.kick, F.mono(28, 800), 28 * 0.24);
    label(b, s.kick, 960, y - 104, { size: 28, weight: 800, color: s.ground === 'paper' ? PAPER.redText : SUMI.red, align: 'center', alpha: a });
    // the vermilion tick under the kicker: the one accent
    b.save(); b.globalAlpha = a; b.fillStyle = s.ground === 'paper' ? PAPER.red : SUMI.red;
    const w = E.outCubic(clamp(dt / 0.25)) * Math.min(kw, 220);
    b.fillRect(960 - w / 2, y - 88, w, 4); b.restore();
  }
  text(b, s.text, 960, y, { font: F.dela(78), color: G.ink, align: 'center', alpha: a, maxW: 1760 });
  b.restore();
}
function drawBadge(R, edit) {
  const { b } = R;
  const s = 21, tr = s * 0.24, w = measure(b, edit.badge, F.mono(s, 800), tr) + 30, h = 42, x = 1880 - w, y = 36;
  b.save();
  b.fillStyle = 'rgba(15,13,11,0.82)'; b.fillRect(x, y, w, h);
  b.strokeStyle = SUMI.red; b.lineWidth = 2; b.strokeRect(x + 1, y + 1, w - 2, h - 2);
  label(b, edit.badge, x + 15, y + 29, { size: s, weight: 800, color: SUMI.ink, track: tr });
  b.restore();
}
function drawDisclosure(R) {
  label(R.b, 'GAMEPLAY DEMO · FICTIONAL PLAYERS', 40, 1052, { size: 15, weight: 700, color: SUMI.muted, alpha: 0.85, track: 3 });
}

// a vermilion slash sweeps across a section change, covering the cut
function slash(R, tc, t) {
  const u = (t - (tc - 0.12)) / 0.28;
  if (u <= 0 || u >= 1) return;
  const { b } = R, x = lerp(-900, 2820, E.inOutCubic(u));
  b.save(); b.fillStyle = SUMI.red;
  b.beginPath(); b.moveTo(x - 260, 0); b.lineTo(x + 520, 0); b.lineTo(x + 260, 1080); b.lineTo(x - 520, 1080); b.closePath(); b.fill();
  b.restore();
}

// ------------------------------------------------------------------------------------------------ the film
export async function renderFilm(t, R, P, edit, CARD_LOOK) {
  if (t >= CARD_IN) {
    Object.assign(P, structuredClone(CARD_LOOK));
    R.b.fillStyle = PAPER.bg; R.b.fillRect(0, 0, 1920, 1080);
    renderCard(t - M.END, R, P, edit.card);
    return;
  }
  const shot = shotAt(edit, t);
  drawShot(R, shot, await frameImage(shot, t), t);
  // the silence: the frame drains to ink while the clock holds; colour slams back on the drop
  if (t >= M.SILENCE && t < M.DROP) P.monoTint = 0.75 * E.outCubic(clamp((t - M.SILENCE) / 0.2));
  if (t >= M.DROP) P.flash = 0.22 * Math.exp(-(t - M.DROP) / 0.09);
  for (const s of edit.supers) if (t >= s.t0 && t < s.t1) drawSuper(R, s, t);
  drawBadge(R, edit);
  drawDisclosure(R);
  for (const tc of [bar(4), bar(9)]) slash(R, tc, t);
}
