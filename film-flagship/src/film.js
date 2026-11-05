// Master timeline: every shot of THE CAST, in order, against src/core/music.js.
import { M, DURATION } from './core/music.js';
import { STARTERS } from './lib/brand.js';
import { initGrounds, loadImage, paper, sumi, text, label } from './lib/draw.js';
import { loadCast } from './lib/cast.js';
import { slamShot } from './scenes/act1.js';
import { inkShot, fightShot } from './scenes/act2.js';
import { endShot, LOGO } from './scenes/end.js';
import { opinionsShot } from './scenes/opinions.js';
import { standoffShot } from './scenes/standoff.js';
import { signatureShot } from './scenes/signature.js';
import { ffaShot, brShot } from './scenes/act3.js';
import { unlockShot, heroShot, productShot, UNLOCK_ART } from './scenes/act4.js';
import { SUMI, F } from './lib/brand.js';

const SHOTS = [];
const shot = (t0, t1, fn) => SHOTS.push({ t0, t1, fn });

// FIRST AD: the premise, the duel, two more ways to play, the streak and the face it earns, the site, the mark.
// 1. a stranger picks DOWN, you pick UP, the strike line splits you
shot(0, M.PERMA, (t, R, P) => slamShot(t, R, P, 'starter-doomer', 0, M.PERMA, { noSlam: true }));
shot(M.PERMA, M.OPIN, (t, R, P) => slamShot(t, R, P, 'starter-perma-bull', M.PERMA, M.OPIN));
shot(M.OPIN, M.SO_IN, opinionsShot);
// 2. the duel: the standoff, its collapse into the band, the board, the final second, CALLED IT
shot(M.SO_IN, M.COLLAPSE, standoffShot);
shot(M.COLLAPSE, M.FFA, fightShot);
// 3. Free For All, Battle Royale (the final round's verdict, last one standing)
shot(M.FFA, M.BR, ffaShot);
shot(M.BR, M.UNLOCK, brShot);
// 4. ten in a row, the legendary unlock, the face you earned
shot(M.UNLOCK, M.LADDER, unlockShot);
shot(M.LADDER, M.PRODUCT, (t, R, P) => heroShot(t, R, P, 0));
// 5. the site, the ink signature, the end card
shot(M.PRODUCT, M.TEAR[0], productShot);
shot(M.TEAR[0], DURATION + 1, signatureShot);

export async function initFilm(R) {
  initGrounds(R);
  await loadCast();
  LOGO.sealPaper = await loadImage('assets/logo/yochi-seal-paper.svg');
  LOGO.sealSumi = await loadImage('assets/logo/yochi-seal-sumi.svg');
  LOGO.markPaper = await loadImage('assets/logo/yochi-mark-paper.svg');
  LOGO.markSumi = await loadImage('assets/logo/yochi-mark-sumi.svg');
  UNLOCK_ART.badge = await loadImage('assets/achievements/cold_blooded.webp'); // the app's badge art (public/achievements)
}

export function renderFilm(t, R, P) {
  const s = SHOTS.find((x) => t >= x.t0 && t < x.t1) || SHOTS[SHOTS.length - 1];
  s.fn(t, R, P);
}
