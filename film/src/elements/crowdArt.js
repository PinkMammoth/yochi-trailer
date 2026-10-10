// The crowd's painted heads (asset-pack/characters/crowd, prepared by tools/crowd_prep.py): seven hood types
// seen from the front, from a little above, and from behind. Thousands are drawn a frame, so each sprite is
// kept as a chain of pre-shrunk copies (mips) with its silhouette and its top-edge rim band, and per member
// the scene's light is laid on with a few cheap draws: a lift in the shot's key colour (and a trace of the
// member's own cloth tint), the world's rim light, distance fog, and the cyan trim as light in the glow
// layer, dimming with distance so a crowd of thousands never outshines the players.
import { clamp, lerp, rgba } from '../core/math.js';
import { drawTinyEyes, drawFaceGrid, composeFace } from './led.js';

const TYPES = ['dome', 'cat', 'bear', 'horns', 'frog', 'fin', 'antenna'];
const VIEWS = ['front', 'high', 'back'];
let META = null;
const SPR = {};

async function loadImg(src) { const im = new Image(); im.src = src; await im.decode(); return im; }
// (CPU-backed, like the frame's own canvases: drawing a GPU canvas into them would read it back every time)
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); c.getContext('2d', { willReadFrequently: true }); return c; };
// halve repeatedly (smooth downscales, no shimmer)
function mips(img) {
  const out = [];
  let c = mk(img.naturalWidth || img.width, img.naturalHeight || img.height);
  c.getContext('2d').drawImage(img, 0, 0);
  out.push(c);
  while (c.height > 12) {
    const d = mk(Math.round(c.width / 2), Math.round(c.height / 2));
    const x = d.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, d.width, d.height);
    out.push(d); c = d;
  }
  return out;
}
// a white silhouette, and the band along its top edge (what the world's overhead rim light catches)
function silhouette(c) {
  const s = mk(c.width, c.height), x = s.getContext('2d');
  x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, s.width, s.height);
  const r = mk(c.width, c.height), y = r.getContext('2d');
  y.drawImage(s, 0, 0); y.globalCompositeOperation = 'destination-out'; y.drawImage(s, 0, Math.max(1, c.height * 0.025));
  return { sil: s, rim: r };
}

export async function loadCrowdArt() {
  if (META) return;
  META = await (await fetch('assets/crowd/crowd.json')).json();
  await Promise.all(VIEWS.flatMap((v) => TYPES.map(async (t) => {
    const k = `${v}-${t}`;
    const [plate, trim] = await Promise.all([loadImg(`assets/crowd/${k}.png`), loadImg(`assets/crowd/${k}-trim.png`)]);
    const P = mips(plate), T = mips(trim);
    SPR[k] = { m: META[k], levels: P.map((p, i) => ({ plate: p, trim: T[i], ...silhouette(p), k: p.height / P[0].height })) };
  })));
}
export const crowdArtReady = () => !!META;

// tinted copies of the white masks, cached per (mask, colour) with the colour quantised
const _tint = new WeakMap();
function tint(mask, col) {
  const q = [col[0] & ~15, col[1] & ~15, col[2] & ~15], key = q.join(',');
  let m = _tint.get(mask);
  if (!m) { m = new Map(); _tint.set(mask, m); }
  let c = m.get(key);
  if (!c) {
    c = mk(mask.width, mask.height); const x = c.getContext('2d');
    x.drawImage(mask, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = rgba(q); x.fillRect(0, 0, c.width, c.height);
    m.set(key, c);
  }
  return c;
}

/**
 * Draw one crowd member. p: the head's screen position, r: the head unit (px), view: front|high|back,
 * o: { type, led, ledI, eyes, face, look, yaw, roll, flip, fog, fogCol, key: {col,k}, rim: {col,k}, cloth, trimK, detail }
 */
export function drawCrowdHead(R, p, r, view, o) {
  const S = SPR[`${view}-${o.type}`] || SPR[`${view}-dome`];
  const M = S.m;
  const k = (r * 1.02) / M.hw;                   // sprite px (full size) -> screen px
  const need = M.h * k * R.S;
  let L = S.levels[0];
  for (const l of S.levels) if (l.plate.height >= need) L = l;
  const fog = o.fog || 0, fogCol = o.fogCol || [22, 19, 40];
  const { b, g } = R;
  const place = (c) => {
    c.save(); c.translate(p[0], p[1] + 0.1 * r); c.rotate(o.roll || 0); c.scale((o.flip ? -k : k) / L.k, k / L.k); c.translate(-M.cx * L.k, -M.cy * L.k);
  };
  // the painted bust ends mid-chest: the body carries on below it as the same dark cloth, so a front row
  // runs down out of frame (as a crowd does) instead of floating over the floor
  if (o.torso !== false) {
    const kc0 = o.key?.col || [200, 225, 255], kk0 = clamp((o.key?.k ?? 0.6) * 0.22 * (1 - fog));
    const cloth = [lerp(26, kc0[0], kk0 * 0.5), lerp(25, kc0[1], kk0 * 0.5), lerp(34, kc0[2], kk0 * 0.5)];
    const c0 = [lerp(cloth[0], fogCol[0], fog * 0.92), lerp(cloth[1], fogCol[1], fog * 0.92), lerp(cloth[2], fogCol[2], fog * 0.92)];
    const top = 0.1 * r + (M.h - M.cy) * k * 0.6, bot = 0.1 * r + 4.4 * r, w0 = M.w * k * 0.44, w1 = M.w * k * 0.4;
    const torso = (c) => { c.save(); c.translate(p[0], p[1]); c.rotate(o.roll || 0); c.beginPath(); c.moveTo(-w0, top); c.lineTo(w0, top);
      c.bezierCurveTo(w0 * 1.02, top + r * 0.8, w1, bot - r * 1.5, w1, bot); c.lineTo(-w1, bot); c.bezierCurveTo(-w1, bot - r * 1.5, -w0 * 1.02, top + r * 0.8, -w0, top); c.closePath(); };
    torso(b);
    const gr = b.createLinearGradient(0, top, 0, bot);
    const v = [lerp(8, fogCol[0], fog), lerp(7, fogCol[1], fog), lerp(14, fogCol[2], fog)];
    gr.addColorStop(0, rgba(c0)); gr.addColorStop(0.3, rgba([lerp(c0[0], v[0], 0.6), lerp(c0[1], v[1], 0.6), lerp(c0[2], v[2], 0.6)], 0.85)); gr.addColorStop(0.75, rgba(v, 0)); gr.addColorStop(1, rgba(v, 0));
    b.fillStyle = gr; b.fill(); b.restore();
    const gg = g.createLinearGradient(0, top, 0, bot); gg.addColorStop(0, rgba([0, 0, 0], 1 - fog * 0.7)); gg.addColorStop(0.75, 'rgba(0,0,0,0)');
    torso(g); g.fillStyle = gg; g.fill(); g.restore();
  }
  place(b);
  b.drawImage(L.plate, 0, 0);
  // the scene's key light (and a trace of the member's own cloth tint) lifts the painted near-black cloth
  const kc = o.key?.col || [200, 225, 255], cl = o.cloth || kc;
  b.globalCompositeOperation = 'screen';
  b.globalAlpha = clamp((o.key?.k ?? 0.6) * 0.22 * (1 - fog));
  b.drawImage(tint(L.sil, [lerp(kc[0], cl[0], 0.35), lerp(kc[1], cl[1], 0.35), lerp(kc[2], cl[2], 0.35)]), 0, 0);
  b.globalCompositeOperation = 'source-over';
  if (fog > 0.01) { b.globalAlpha = clamp(fog * 0.92); b.drawImage(tint(L.sil, fogCol), 0, 0); }
  if (o.rim && o.rim.k > 0.02) { b.globalCompositeOperation = 'lighter'; b.globalAlpha = clamp(o.rim.k * 0.32 * (1 - fog * 0.85)); b.drawImage(tint(L.rim, o.rim.col), 0, 0); }
  const tk = clamp((o.trimK ?? 1) * (1 - fog));
  if (tk > 0.02) { b.globalCompositeOperation = 'lighter'; b.globalAlpha = 0.25 * tk; b.drawImage(L.trim, 0, 0); }
  b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
  b.restore();
  // the glow layer: the figure blocks what's behind it, its trim shines
  place(g);
  g.globalAlpha = 1 - fog * 0.7; g.drawImage(tint(L.sil, [0, 0, 0]), 0, 0);
  if (tk > 0.02) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6 * tk; g.drawImage(L.trim, 0, 0); g.globalCompositeOperation = 'source-over'; }
  g.globalAlpha = 1;
  g.restore();
  if (view === 'back' || !M.vw) return;
  // the visor: the member's pick on the LED grid (close) or as two glowing bars (far)
  const led = o.led || [245, 243, 255];
  const I = (o.ledI ?? 1) * (1 - fog * 0.72) * clamp(r / 5, 0.35, 1);
  const yaw = o.yaw || 0;
  const vw = M.vw * k * 0.62 * (1 - Math.abs(yaw) * 0.25), vh = M.vh * k * 0.5;
  const ex = p[0] + yaw * r * 0.3, ey = p[1] + 0.1 * r - (o.look || 0) * 0.12 * r;
  if (o.detail && vw > 60) {
    const cells = composeFace(o.face || { eyes: o.eyes || 'dot', lookY: -(o.look || 0) * 2 });
    drawFaceGrid(R, cells, { x: ex - vw / 2, y: ey - vh / 2, w: vw, h: vh, color: led, intensity: I, showOff: false });
  } else {
    drawTinyEyes(R, ex, ey, vw, vh * 0.75, led, o.eyes || 'dot', I);
  }
}
