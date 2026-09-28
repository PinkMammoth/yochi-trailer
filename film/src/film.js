// Master timeline: every shot of the film, in order.
import { ACT1 } from './acts/act1.js';
import { ACT2 } from './acts/act2.js';
import { ACT3 } from './acts/act3.js';
import { ACT4 } from './acts/act4.js';
import { world } from './acts/common.js';
import { label } from './elements/type.js';
import { E, clamp } from './core/math.js';
import { M } from './core/music.js';

const SHOTS = [...ACT1, ...ACT2, ...ACT3, ...ACT4];

// Vertical whips between shots (vertical is meaning in this world: up or down).
// dir +1: content moves up out of frame (camera whips down); -1: content moves down (camera whips up).
const WHIPS = [
  { at: M.RISE, out: 0.22, in: 0.2, dir: -1 },      // the L -> the rise: whip UP
  { at: M.BR, out: 0.26, in: 0.24, dir: 1 },        // GG -> battle royale: fall DOWN into it
  { at: M.GROOVE, out: 0.0, in: 0.18, dir: -1 },    // DOWN -> BACK IT: come back up
];

export async function initFilm(R) {
  world();
}

export function renderFilm(t, R, P) {
  let shot = null;
  for (const s of SHOTS) if (t >= s.t0 && t < s.t1) { shot = s; break; }
  if (!shot) {
    label(R, `t=${t.toFixed(2)} — not yet built`, 960, 540, { align: 'center', size: 28, col: [120, 110, 160] });
    return;
  }
  let dy = 0, vel = 0;
  for (const w of WHIPS) {
    if (t < w.at && t >= w.at - w.out) {
      const u = (t - (w.at - w.out)) / w.out;
      dy = -w.dir * 1200 * E.inCubic(u); vel = -w.dir * 3 * u * u;
    } else if (t >= w.at && t < w.at + w.in) {
      const u = (t - w.at) / w.in;
      dy = w.dir * 1200 * (1 - E.outCubic(u)); vel = -w.dir * 3 * (1 - u) * (1 - u);
    }
  }
  if (dy) { R.b.save(); R.g.save(); R.b.translate(0, dy); R.g.translate(0, dy); }
  shot.fn(t, R, P);
  if (dy) { R.b.restore(); R.g.restore(); }
  if (vel) { P.blurVec = [0, vel * 0.06]; P.ca = Math.max(P.ca, Math.abs(vel) * 0.004); }
}
