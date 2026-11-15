// The app's reward collection (callit.win app/client/src/lib/avatar-roster.ts, entries with `unlock`) and the
// two assets each reward gets in the app:
//   loop    VIEW CARD: the painting rect inside the card's own (static) frame, a seamless 6 s ambient loop.
//           Frame 0 is the still card exactly, so the <img> poster and the video swap invisibly.
//   unlock  the unlock moment's panel: 4:5, 2.5 s, one hit timed to the moment's seal stamp, ending on a hold.
//           No seal in the video (the app stamps its own glyph seal on the beat) and no type.
// Plain data, importable by node (--experimental-strip-types) for the batch renderer.
import { IMPACT_DRAMATIC, type ShotSpec } from '../lib/shot.ts';

export interface Reward {
  /** character folder in yochi-2p5d/characters */
  id: string;
  /** the app's card file name, without .webp (public/avatars/cards/<card>.webp) */
  card: string;
  /** the achievement that unlocks it (EVM_ACHIEVEMENTS id) */
  achievement: string;
}

export const REWARDS: Reward[] = [
  { id: 'untouchable', card: 'untouchable', achievement: 'untouchable' },
  { id: 'hundred-trials', card: 'hundred-trials', achievement: 'diamond_hands' },
  { id: 'insider', card: 'insider-v2', achievement: 'rank_degen_god' },
  { id: 'whale', card: 'whale', achievement: 'rank_seer' },
  { id: 'quick-draw', card: 'quick-draw', achievement: 'quick_draw' },
  { id: 'high-roller', card: 'high-roller-v2', achievement: 'high_roller' },
  { id: 'cold-blooded', card: 'cold-blooded-v2', achievement: 'cold_blooded' },
  { id: 'deadeye', card: 'deadeye', achievement: 'deadeye' },
  { id: 'in-the-green', card: 'in-the-green', achievement: 'in_the_green' },
  { id: 'took-the-pool', card: 'took-the-pool', achievement: 'took_the_pool' },
  { id: 'rampage', card: 'rampage', achievement: 'rampage' },
  { id: 'duel-master', card: 'duel-master', achievement: 'duel_win_10' },
  { id: 'ronin', card: 'ronin', achievement: 'duel_win_5' },
  { id: 'grudge-settled', card: 'grudge-settled', achievement: 'grudge_settled' },
  { id: 'last-legend', card: 'last-legend', achievement: 'br_win_10' },
  { id: 'final-three', card: 'final-three', achievement: 'br_final_three' },
  { id: 'bloodsport', card: 'bloodsport', achievement: 'br_win_5' },
  { id: 'lab-rat', card: 'lab-rat', achievement: 'lab_rat' },
  { id: 'bughunter', card: 'bughunter', achievement: 'bug_hunter' },
];

export const LOOP_FRAMES = 180; // 6 s at 30 fps
export const UNLOCK_FRAMES = 75; // 2.5 s
/** the moment shows the art at +0.40 s and stamps the seal at +0.95 s (RARE and up): the hit lands on the stamp */
export const UNLOCK_HIT = 17;

export const loopSpec = (id: string): ShotSpec => ({
  character: id, format: 'card', durationInFrames: LOOP_FRAMES, loop: true,
  camera: { push: [1, 1.012], truck: [-8, 5] },
  ambient: { breath: 0.0045, sway: 0.22 },
  light: { angle: [-20, 20], shadow: 0.16, pool: 0.06 },
  atmosphere: { dust: 70, ink: 16, bokeh: 0, wind: 0.6 },
  grade: false,
});

export const unlockSpec = (id: string): ShotSpec => ({
  character: id, format: '4:5', durationInFrames: UNLOCK_FRAMES,
  camera: { push: [1, 1.07], truck: [-14, 6] },
  ambient: { breath: 0.0045, sway: 0.2 },
  atmosphere: { dust: 60, ink: 14, bokeh: 1 },
  impact: {
    frame: UNLOCK_HIT, ...IMPACT_DRAMATIC, shake: 16, anticipation: 12,
    // routed per painting: over visible ground and clear of the face; behind the figure where it can show
    slash: { from: [1.03, 0.4], to: [0.4, 1.03], width: 150, behind: true, tone: 'auto', route: 'auto' },
    seal: false,
    burst: true,
  },
  grade: { vignette: 0.18, grain: 0 },
});
