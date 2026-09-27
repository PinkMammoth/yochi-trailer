// Master timeline: every shot of the film, in order.
import { ACT1 } from './acts/act1.js';
import { ACT2 } from './acts/act2.js';
import { ACT3 } from './acts/act3.js';
import { ACT4 } from './acts/act4.js';
import { world } from './acts/common.js';
import { label } from './elements/type.js';

const SHOTS = [...ACT1, ...ACT2, ...ACT3, ...ACT4];

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
  shot.fn(t, R, P);
}
