// Master timeline: every shot of THE CAST, in order, against src/core/music.js.
import { M, DURATION } from './core/music.js';
import { STARTERS } from './lib/brand.js';
import { initGrounds, loadImage, paper, sumi, text, label } from './lib/draw.js';
import { loadCast } from './lib/cast.js';
import { slamShot, gridShot } from './scenes/act1.js';
import { inkShot, fightShot } from './scenes/act2.js';
import { endShot, LOGO } from './scenes/end.js';
import { ffaShot, brShot } from './scenes/act3.js';
import { unlockShot, heroShot, ladderGridShot, productShot } from './scenes/act4.js';
import { SUMI, F } from './lib/brand.js';

const SHOTS = [];
const shot = (t0, t1, fn) => SHOTS.push({ t0, t1, fn });

// 1-2. the thumbnail, the smash cut, the roster (one starter per hit)
shot(0, M.PERMA, (t, R, P) => slamShot(t, R, P, 'starter-doomer', 0, M.PERMA, { noSlam: true }));
const ENTRIES = [M.PERMA, ...M.ROSTER, M.GRID];
STARTERS.slice(1).forEach((s, i) => shot(ENTRIES[i], ENTRIES[i + 1], (t, R, P) => slamShot(t, R, P, s.id, ENTRIES[i], ENTRIES[i + 1])));
// 3. character select, the locks
shot(M.GRID, M.INK - 0.16, gridShot);
// 4-5. ink, the duel
shot(M.INK - 0.16, M.VS, inkShot);
shot(M.VS, M.FFA, fightShot);
// 6. the climb
shot(M.FFA, M.BR, ffaShot);
shot(M.BR, M.UNLOCK, brShot);
// 7. the unlock
shot(M.UNLOCK, M.LADDER, unlockShot);
// 8. the ladder
const HE = [...M.HEROES, M.LADDER_GRID];
M.HEROES.forEach((h, i) => shot(HE[i], HE[i + 1], (t, R, P) => heroShot(t, R, P, i)));
shot(M.LADDER_GRID, M.PRODUCT, ladderGridShot);
// 9. the product
shot(M.PRODUCT, M.END, productShot);
// 10. end card
shot(M.END, DURATION + 1, endShot);

export async function initFilm(R) {
  initGrounds(R);
  await loadCast();
  LOGO.sealPaper = await loadImage('assets/logo/yochi-seal-paper.svg');
  LOGO.sealSumi = await loadImage('assets/logo/yochi-seal-sumi.svg');
  LOGO.markPaper = await loadImage('assets/logo/yochi-mark-paper.svg');
  LOGO.markSumi = await loadImage('assets/logo/yochi-mark-sumi.svg');
}

export function renderFilm(t, R, P) {
  const s = SHOTS.find((x) => t >= x.t0 && t < x.t1) || SHOTS[SHOTS.length - 1];
  s.fn(t, R, P);
}
