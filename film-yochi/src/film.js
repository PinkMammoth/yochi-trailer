// Master timeline: four sheets of paper, cut on the bar lines.
import { sheet1 } from './scenes/sheet1.js';
import { foresight } from './scenes/foresight.js';
import { finale } from './scenes/finale.js';
import { labScene, kanjiLab } from './scenes/lab.js';
import { veil } from './scenes/common.js';
import { M } from './core/music.js';
import { E, clamp } from './core/math.js';

let SC = null;
export async function initFilm(R) {
  const s2 = foresight(R, { dir: 1, kicker: 'FREE FOR ALL · 5M', amount: 48, seed: 210,
    T: { start: M.FS1, ghost: M.FS1_GHOST, pick: M.FS1_PICK, follow: M.FS1_FOLLOW, close: M.FS1_CLOSE, pay: M.FS1_PAY } });
  const s3 = foresight(R, { dir: -1, kicker: 'DUEL · 1M', amount: 90, seed: 310,
    T: { start: M.FS2, ghost: M.FS2_GHOST, pick: M.FS2_PICK, follow: M.FS2_FOLLOW, close: M.FS2_CLOSE, pay: M.FS2_PAY } });
  SC = { s1: sheet1(R), s2, s3, fin: finale(R, s3), lab: labScene(R), klab: kanjiLab(R) };
}
export function renderFilm(t, R, P) {
  if (t >= 101) return SC.klab(t, P);
  if (t >= 100) return SC.lab(t, P);
  if (t < M.FS1) return SC.s1(t, P);
  if (t < M.FS2) {
    SC.s2.draw(t, P);
    veil(R, E.inOutSine(clamp((t - M.FS1_OUT[0]) / (M.FS1_OUT[1] - M.FS1_OUT[0]))));
    return;
  }
  if (t < M.GATHER) return SC.s3.draw(t, P);
  SC.fin(t, P, (tt, PP, o) => SC.s3.draw(tt, PP, o));
}
