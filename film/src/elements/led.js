// LED dot-matrix glyphs: faces for the visors, and a dot-matrix text renderer.
const TAU2 = Math.PI * 2;
import { rgba, hexToRgb } from '../core/math.js';

const g = (rows) => rows.map((r) => [...r].map((c) => c === '#'));

// 9x9 eyes ----------------------------------------------------------------
export const EYES = {
  dot: g([
    '.........', '.........', '...###...', '..#####..', '..#####..', '..#####..', '...###...', '.........', '.........']),
  wide: g([
    '..#####..', '.#.....#.', '#.......#', '#..###..#', '#..###..#', '#..###..#', '#.......#', '.#.....#.', '..#####..']),
  happy: g([
    '.........', '.........', '...###...', '..#...#..', '.#.....#.', '#.......#', '.........', '.........', '.........']),
  smugL: g([
    '.........', '.........', '#########', '#########', '.....###.', '.....###.', '......#..', '.........', '.........']),
  smugR: g([
    '.........', '.........', '#########', '#########', '.###.....', '.###.....', '..#......', '.........', '.........']),
  up: g([
    '....#....', '...###...', '..#####..', '.#######.', '#########', '...###...', '...###...', '...###...', '...###...']),
  down: g([
    '...###...', '...###...', '...###...', '...###...', '#########', '.#######.', '..#####..', '...###...', '....#....']),
  tri_up: g([
    '.........', '....#....', '...###...', '..#####..', '.#######.', '#########', '.........', '.........', '.........']),
  tri_down: g([
    '.........', '.........', '.........', '#########', '.#######.', '..#####..', '...###...', '....#....', '.........']),
  dollar: g([
    '....#....', '..#####..', '.#..#....', '.#..#....', '..####...', '....#.#..', '....#.#..', '.#####...', '....#....']),
  x: g([
    '#.......#', '.#.....#.', '..#...#..', '...#.#...', '....#....', '...#.#...', '..#...#..', '.#.....#.', '#.......#']),
  closed: g([
    '.........', '.........', '.........', '.........', '#########', '#########', '.........', '.........', '.........']),
  gtL: g([
    '##.......', '.###.....', '...###...', '.....###.', '.......##', '.....###.', '...###...', '.###.....', '##.......']),
  ltR: g([
    '.......##', '.....###.', '...###...', '.###.....', '##.......', '.###.....', '...###...', '.....###.', '.......##']),
  question: g([
    '..#####..', '.##...##.', '.......##', '.....###.', '....##...', '....##...', '.........', '....##...', '....##...']),
  heart: g([
    '.##...##.', '####.####', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....', '.........']),
  cry: g([
    '#########', '#########', '...###...', '...###...', '...###...', '...###...', '...###...', '.........', '.........']),
  lock: g([
    '...###...', '..#...#..', '..#...#..', '.#######.', '.#######.', '.###.###.', '.###.###.', '.#######.', '.........']),
  side: g([
    '.........', '.........', '..#####..', '.#.....#.', '.#...###.', '.#...###.', '..#####..', '.........', '.........']),
  star: g([
    '....#....', '....#....', '...###...', '#########', '..#####..', '..##.##..', '.##...##.', '.#.....#.', '.........']),
};

// 11x3 mouths ------------------------------------------------------------
export const MOUTHS = {
  none: g(['...........', '...........', '...........']),
  smile: g(['#.........#', '.##.....##.', '...#####...']),
  grin: g(['###########', '#.........#', '.#########.']),
  flat: g(['...........', '.#########.', '...........']),
  smirk: g(['...........', '.........##', '.########..']),
  frown: g(['...#####...', '.##.....##.', '#.........#']),
  o: g(['....###....', '...#...#...', '....###....']),
  wobble: g(['.##...##...', '#..#.#..#.#', '....#....#.']),
  teeth: g(['###########', '#.#.#.#.#.#', '###########']),
};

// Visor grid: 25 x 13. Eyes 9x9 at col 2 and col 14, row 1. Mouth 11x3 at col 7, row 10.
export const GRID_W = 25, GRID_H = 13;

// Compose a face into a boolean grid with colour indices (0 off, 1 eye, 2 mouth).
export function composeFace(face) {
  const cells = new Uint8Array(GRID_W * GRID_H);
  const put = (glyph, cx, cy, v) => {
    if (!glyph) return;
    for (let y = 0; y < glyph.length; y++) for (let x = 0; x < glyph[y].length; x++) {
      if (!glyph[y][x]) continue;
      const gx = cx + x, gy = cy + y;
      if (gx < 0 || gy < 0 || gx >= GRID_W || gy >= GRID_H) continue;
      cells[gy * GRID_W + gx] = v;
    }
  };
  const lx = Math.round(face.lookX || 0), ly = Math.round(face.lookY || 0);
  const eL = EYES[face.eyeL || face.eyes || 'dot'];
  const eR = EYES[face.eyeR || face.eyes || 'dot'];
  // blink: squash eyes to a line
  if (face.blink && face.blink > 0.5) {
    put(EYES.closed, 2 + lx, 1 + ly, 1); put(EYES.closed, 14 + lx, 1 + ly, 1);
  } else {
    put(eL, 2 + lx, 1 + ly, 1); put(eR, 14 + lx, 1 + ly, 1);
  }
  put(MOUTHS[face.mouth || 'none'], 7 + Math.round(lx * 0.6), 10 + Math.min(0, ly), 2);
  return cells;
}

// Draw the face grid into a visor rectangle (in the current transform).
// opts: { x, y, w, h, color, mouthColor, intensity, dotGap, showOff, scan }
export function drawFaceGrid(R, cells, o) {
  const { b, g } = R;
  const cw = o.w / GRID_W, ch = o.h / GRID_H;
  const cell = Math.min(cw, ch);
  const ox = o.x + (o.w - cell * GRID_W) / 2, oy = o.y + (o.h - cell * GRID_H) / 2;
  const rad = cell * (o.dotSize || 0.36);
  const eye = typeof o.color === 'string' ? hexToRgb(o.color) : o.color;
  const mouth = o.mouthColor ? (typeof o.mouthColor === 'string' ? hexToRgb(o.mouthColor) : o.mouthColor) : eye;
  const I = o.intensity ?? 1;
  const hot = (c, k) => [Math.min(255, c[0] + (255 - c[0]) * k), Math.min(255, c[1] + (255 - c[1]) * k), Math.min(255, c[2] + (255 - c[2]) * k)];
  // unlit dots texture
  if (o.showOff !== false && cell > 3.5) {
    b.fillStyle = 'rgba(120,130,190,0.07)';
    for (let y = 0; y < GRID_H; y++) for (let x = 0; x < GRID_W; x++) {
      if (cells[y * GRID_W + x]) continue;
      b.beginPath(); b.arc(ox + (x + 0.5) * cell, oy + (y + 0.5) * cell, rad * 0.8, 0, TAU2); b.fill();
    }
  }
  const drawSet = (v, col) => {
    const core = hot(col, 0.55);
    b.fillStyle = rgba(core, Math.min(1, I));
    b.beginPath();
    for (let y = 0; y < GRID_H; y++) for (let x = 0; x < GRID_W; x++) {
      if (cells[y * GRID_W + x] !== v) continue;
      const cx = ox + (x + 0.5) * cell, cy = oy + (y + 0.5) * cell;
      b.moveTo(cx + rad, cy); b.arc(cx, cy, rad, 0, TAU2);
    }
    b.fill();
    // emissive: tight dots + soft halo
    g.fillStyle = rgba(col, Math.min(1, 0.9 * I));
    g.beginPath();
    for (let y = 0; y < GRID_H; y++) for (let x = 0; x < GRID_W; x++) {
      if (cells[y * GRID_W + x] !== v) continue;
      const cx = ox + (x + 0.5) * cell, cy = oy + (y + 0.5) * cell;
      g.moveTo(cx + rad * 1.25, cy); g.arc(cx, cy, rad * 1.25, 0, TAU2);
    }
    g.fill();
  };
  drawSet(1, eye);
  drawSet(2, mouth);
}

// Simplified face for small sizes: two glowing bars.
export function drawTinyEyes(R, x, y, w, h, col, eyes, I = 1) {
  const { b, g } = R;
  const c = typeof col === 'string' ? hexToRgb(col) : col;
  const ew = w * 0.26, eh = h * 0.42;
  const gap = w * 0.16;
  const shapes = [[x - gap - ew, y - eh / 2], [x + gap, y - eh / 2]];
  for (const [ex, ey] of shapes) {
    if (eyes === 'up' || eyes === 'tri_up') {
      tri(b, ex, ey, ew, eh, true, rgba([Math.min(255, c[0] + 90), Math.min(255, c[1] + 90), Math.min(255, c[2] + 90)], I));
      tri(g, ex - ew * 0.1, ey - eh * 0.1, ew * 1.2, eh * 1.2, true, rgba(c, I));
    } else if (eyes === 'down' || eyes === 'tri_down') {
      tri(b, ex, ey, ew, eh, false, rgba([Math.min(255, c[0] + 90), Math.min(255, c[1] + 90), Math.min(255, c[2] + 90)], I));
      tri(g, ex - ew * 0.1, ey - eh * 0.1, ew * 1.2, eh * 1.2, false, rgba(c, I));
    } else {
      const hh = eyes === 'closed' ? eh * 0.25 : eh * 0.7;
      b.fillStyle = rgba([Math.min(255, c[0] + 90), Math.min(255, c[1] + 90), Math.min(255, c[2] + 90)], I);
      b.fillRect(ex, ey + (eh - hh) / 2, ew, hh);
      g.fillStyle = rgba(c, I);
      g.fillRect(ex - ew * 0.15, ey + (eh - hh) / 2 - ew * 0.15, ew * 1.3, hh + ew * 0.3);
    }
  }
}
function tri(c, x, y, w, h, up, style) {
  c.fillStyle = style; c.beginPath();
  if (up) { c.moveTo(x + w / 2, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h); }
  else { c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w / 2, y + h); }
  c.closePath(); c.fill();
}

// Dot-matrix text using VT323 rasterised into a small grid (cached per string).
const _dmCache = new Map();
export function dotMatrix(text, rows = 11) {
  const key = text + '|' + rows;
  if (_dmCache.has(key)) return _dmCache.get(key);
  const c = document.createElement('canvas');
  const fs = rows * 1.25;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.font = `400 ${fs}px VT323`;
  const w = Math.ceil(ctx.measureText(text).width) + 2;
  c.width = w; c.height = rows + 2;
  ctx.font = `400 ${fs}px VT323`;
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, 1, rows * 0.95);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const cells = [];
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4] > 110) cells.push([x, y]);
  const out = { w: c.width, h: c.height, cells };
  _dmCache.set(key, out);
  return out;
}
export function drawDotText(R, text, x, y, dot, col, o = {}) {
  const dm = dotMatrix(text, o.rows || 11);
  const { b, g } = R;
  const c = typeof col === 'string' ? hexToRgb(col) : col;
  const I = o.intensity ?? 1;
  const align = o.align || 'left';
  const ox = align === 'center' ? x - (dm.w * dot) / 2 : align === 'right' ? x - dm.w * dot : x;
  const oy = y - (dm.h * dot) / 2;
  const r = dot * (o.size || 0.42);
  const hot = [Math.min(255, c[0] + 110), Math.min(255, c[1] + 110), Math.min(255, c[2] + 110)];
  b.fillStyle = rgba(hot, I);
  b.beginPath();
  for (const [cx, cy] of dm.cells) { const px = ox + (cx + 0.5) * dot, py = oy + (cy + 0.5) * dot; b.moveTo(px + r, py); b.arc(px, py, r, 0, TAU2); }
  b.fill();
  g.fillStyle = rgba(c, I * (o.glow ?? 0.9));
  g.beginPath();
  for (const [cx, cy] of dm.cells) { const px = ox + (cx + 0.5) * dot, py = oy + (cy + 0.5) * dot; g.moveTo(px + r * 1.3, py); g.arc(px, py, r * 1.3, 0, TAU2); }
  g.fill();
  return { w: dm.w * dot, h: dm.h * dot };
}

// Animated LED flame (streak fire), 7x9, three flicker frames.
const FLAME = [
  ['...#...', '...##..', '..###..', '..####.', '.#####.', '.##.##.', '##...##', '##...##', '.#####.'],
  ['..#....', '..##...', '..###..', '.####..', '.#####.', '.##.##.', '##..###', '##...##', '.#####.'],
  ['....#..', '...##..', '..###..', '..####.', '.#####.', '.#####.', '##.#.##', '##...##', '.#####.'],
].map((f) => f.map((r) => [...r].map((c) => c === '#')));
export function drawFlame(R, x, y, cell, t, o = {}) {
  const { b, g } = R;
  const fr = FLAME[Math.floor(t * 14) % 3];
  const I = o.intensity ?? 1;
  for (let yy = 0; yy < 9; yy++) for (let xx = 0; xx < 7; xx++) {
    if (!fr[yy][xx]) continue;
    const hotness = yy / 8; // hotter at the base
    const col = [255, Math.round(120 + hotness * 110), Math.round(20 + hotness * 60)];
    const px = x + (xx - 3) * cell, py = y + (yy - 8) * cell;
    b.fillStyle = rgba([255, Math.min(255, col[1] + 60), Math.min(255, col[2] + 80)], I);
    b.beginPath(); b.arc(px, py, cell * 0.4, 0, TAU2); b.fill();
    g.fillStyle = rgba(col, 0.9 * I);
    g.beginPath(); g.arc(px, py, cell * 0.62, 0, TAU2); g.fill();
  }
}
