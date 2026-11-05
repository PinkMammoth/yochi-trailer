// Master timeline: every shot of THE CAST, in order, against src/core/music.js.
import { M, DURATION } from './core/music.js';
import { STARTERS } from './lib/brand.js';
import { initGrounds, loadImage, paper, sumi, text, label } from './lib/draw.js';
import { loadCast } from './lib/cast.js';
import { slamShot, ROSTER_ORDER } from './scenes/act1.js';
import { inkShot, fightShot } from './scenes/act2.js';
import { endShot, LOGO } from './scenes/end.js';
import { opinionsShot } from './scenes/opinions.js';
import { standoffShot } from './scenes/standoff.js';
import { signatureShot } from './scenes/signature.js';
import { ffaShot, brShot } from './scenes/act3.js';
import { unlockShot, heroShot, ladderGridShot, productShot, galleryShot, UNLOCK_ART } from './scenes/act4.js';
import { SUMI, F } from './lib/brand.js';

const SHOTS = [];
const shot = (t0, t1, fn) => SHOTS.push({ t0, t1, fn });

// 1-2. the thumbnail, the smash cut, the roster (one starter per hit)
shot(0, M.PERMA, (t, R, P) => slamShot(t, R, P, 'starter-doomer', 0, M.PERMA, { noSlam: true }));
const ENTRIES = [M.PERMA, ...M.ROSTER, M.OPIN];
ROSTER_ORDER.slice(1).forEach((id, i) => shot(ENTRIES[i], ENTRIES[i + 1], (t, R, P) => slamShot(t, R, P, id, ENTRIES[i], ENTRIES[i + 1])));
// FINAL EDIT: character select is cut (the ladder grid later carries "ten free, eighteen to earn")
// 3b. FLAGSHIP: the takes, the strike line, the ink drop
shot(M.OPIN, M.SO_IN, opinionsShot);
// FINAL EDIT: the duel standoff, then its collapse into the band (drawn over the fight)
shot(M.SO_IN, M.COLLAPSE, standoffShot);
shot(M.COLLAPSE, M.FFA, fightShot);
// 4-5. the duel
// 6. the climb
shot(M.FFA, M.BR, ffaShot);
shot(M.BR, M.UNLOCK, brShot);
// 7. the unlock
shot(M.UNLOCK, M.LADDER, unlockShot);
// 8. the ladder
const HE = [...M.HEROES, M.GALLERY];
M.HEROES.forEach((h, i) => shot(HE[i], HE[i + 1], (t, R, P) => heroShot(t, R, P, i)));
shot(M.GALLERY, M.LADDER_GRID, galleryShot);
shot(M.LADDER_GRID, M.PRODUCT, ladderGridShot);
// 9. the product
shot(M.PRODUCT, M.TEAR[0], productShot);
// 10. end card
// 9b-10. FLAGSHIP: the ink signature into the end card
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
