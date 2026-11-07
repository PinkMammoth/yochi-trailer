// The two edits, A (Elysium testnet) and B (Elysium mainnet). Every shot is real footage or a real still from
// asset-pack/4k clips + hq stills (the product's /capture routes, fictional cast, real HYPE candles). Nothing in a
// shot is redrawn or altered: shots are trimmed, retimed, framed (crop + gentle push) and cut on the music. The
// film's own words (supers, kickers, the badge, the disclosure) sit on top and never imitate the UI.
//
// shot: { t0, t1, kind: 'clip' | 'still', src, s0 (source seconds at t0), rate, map (t -> source seconds),
//         cam: [[u, cx, cy, z], ...] (u = 0..1 through the shot, cx/cy in source px, z = output px per source px),
//         rect: [x0, y0, x1, y1] (only this part of the source is shown: keeps the chat fixture out),
//         look: post overrides }
// Supers: { t0, t1, kick, text, ground }.
import { bar, beat, BAR, M, DURATION } from './core/music.js';

export const CLIPS = 'asset-pack/4k clips + hq stills/desktop';
export const STILLS = 'asset-pack/4k clips + hq stills/stills/desktop';

const W = 1920, H = 1080;
// Framings, in source pixels (see README "Framing")
const HOOK = { kind: 'still', src: 'home', rect: [150, 150, 2730, 1250], cam: [[0, 1440, 700, 0.7], [1, 1420, 680, 0.77]] };
const STANDOFF = { kind: 'clip', src: 'c1-duel-standoff', s0: 0.6, rate: 1, cam: [[0, 960, 540, 1.0], [1, 960, 540, 1.06]] };
// The duel board: everything above the chat panel (which starts at y 750). The second bar pushes in to the
// clock and the UP / DOWN buttons.
const BOARD = (t0, t1, push) => ({
  kind: 'clip', src: 'c1-duel-standoff', s0: 6.8, rate: 1, rect: [330, 0, 1590, 742],
  cam: push ? [[0, 960, 400, 1.0], [0.45, 960, 400, 1.0], [1, 1180, 430, 1.24]] : [[0, 960, 400, 1.0], [1, 1010, 405, 1.06]],
  t0, t1,
});
const ROLLCALL = { kind: 'clip', src: 'c5-br-rollcall', s0: 0.75, rate: 1, rect: [300, 150, 1620, 1060], cam: [[0, 960, 560, 1.22], [1, 960, 545, 1.3]] };
// The verdict: the board slowed to 0.7x into the silence, so the CLOSED UP band (source frame 48) lands on the
// drop kick; then real time.
const VERDICT = {
  kind: 'clip', src: 'c6-br-verdict', rect: [0, 0, 1920, 780],
  map: (t) => (t < M.DROP ? 1.6 * (t - bar(5)) / (M.DROP - bar(5)) : 1.6 + (t - M.DROP)),
  cam: [[0, 960, 420, 1.0], [0.5, 960, 430, 1.08], [0.62, 960, 470, 1.18], [1, 960, 470, 1.22]],
  look: { silence: true },
};
const BR_WIN = { kind: 'clip', src: 'c13-br-win', s0: 0.3, rate: 1, cam: [[0, 800, 450, 1.2], [1, 800, 430, 1.3]] };     // stamp contact: source frame 12
const FFA_WIN = (s0) => ({ kind: 'clip', src: 'c3-ffa-win', s0, rate: 1, cam: [[0, 800, 450, 1.2], [1, 800, 440, 1.3]] }); // contact: frame 15
const NEMESIS = { kind: 'clip', src: 'c14-rivalry', s0: 0.4, rate: 1, cam: [[0, 800, 450, 1.2], [1, 800, 330, 1.36]] };
const RANKS = { kind: 'still', src: 'leaderboard', rect: [0, 120, 2880, 1560], cam: [[0, 1440, 900, 0.72], [1, 1440, 830, 0.8]], paper: true };
const CLANS = { kind: 'still', src: 'clans', rect: [0, 100, 2880, 1800], cam: [[0, 1440, 760, 0.72], [1, 1500, 700, 0.8]], paper: true };
const RECAP = { kind: 'still', src: 'duel-recap', rect: [900, 40, 1980, 1720], cam: [[0, 1440, 840, 0.6], [1, 1440, 780, 0.68]] };

const at = (shot, t0, t1, extra = {}) => ({ ...shot, t0, t1, ...extra });

export const CARD_IN = M.END - 0.14; // the hanko's slam starts 0.14 s before contact

const COMMON_TAIL = [
  at(ROLLCALL, bar(4), bar(5)),
  at(VERDICT, bar(5), bar(7)),
  at(BR_WIN, bar(7), bar(8)),
];
const SOCIAL = [
  at(NEMESIS, bar(9), bar(10)),
  at(RANKS, bar(10), bar(11)),
  at(CLANS, bar(11), CARD_IN),
];
const SOCIAL_SUPERS = [
  { t0: bar(9) + beat(0.5), t1: bar(10), kick: 'NEMESIS', text: 'Your Nemesis keeps score.' },
  { t0: bar(10) + beat(0.5), t1: bar(11), kick: 'RANKINGS', text: 'Climb the season rankings.', ground: 'paper' },
  { t0: bar(11) + beat(0.5), t1: CARD_IN, kick: 'CLANS', text: 'Join a clan.', ground: 'paper' },
];

export const EDITS = {
  // A: discovery, free. Teaches the game: the question, the pick, the two modes, a win, the social layer.
  A: {
    name: 'yochi-elysium-testnet',
    badge: 'ELYSIUM TESTNET · FREE PLAY',
    shots: [
      at(HOOK, 0, bar(1)),
      at(STANDOFF, bar(1), bar(2)),
      BOARD(bar(2), bar(3), false),
      { ...BOARD(bar(3), bar(4), true), s0: 6.8 + BAR },
      ...COMMON_TAIL,
      at(FFA_WIN(0.3), bar(8), bar(9)),
      ...SOCIAL,
    ],
    supers: [
      { t0: bar(1) + beat(1), t1: bar(2), kick: 'DUEL · 1V1', text: 'Face off on the next candle.' },
      { t0: bar(2) + beat(0.5), t1: bar(3), text: 'Pick UP or DOWN.' },
      { t0: bar(3) + beat(2), t1: bar(4), text: 'Read it right, take the pot.' },
      { t0: bar(4) + beat(0.5), t1: bar(5), kick: 'BATTLE ROYALE', text: 'Every wrong pick costs a life.' },
      { t0: M.SILENCE, t1: M.DROP, text: 'One candle decides.', mid: true },
      { t0: bar(7) + beat(2), t1: bar(8), kick: 'ELYSIUM TESTNET', text: 'Free to play, no real money.' },
      { t0: bar(8) + beat(1.5), t1: bar(9), kick: 'FREE FOR ALL', text: 'The right side splits the pool.' },
      ...SOCIAL_SUPERS,
    ],
    stamps: [bar(7) + 0.1, bar(8) + 0.2, M.END],
    card: {
      line1: 'PLAY YOCHI ON ELYSIUM TESTNET',
      line2: 'Try it free.',
      url: 'testnet.yochigg.xyz',
      foot: 'TEST FUNDS ONLY · NO REAL MONEY',
    },
  },
  // B: the launch. Opens on a win, leads with the money, the duel resolves on screen.
  B: {
    name: 'yochi-elysium-mainnet',
    badge: 'LIVE ON ELYSIUM',
    shots: [
      at(FFA_WIN(0.45), 0, bar(1)), // the stamp lands on the first bass hit (contact at 0.05)
      at(HOOK, bar(1), bar(2)),
      at(STANDOFF, bar(2), bar(3)),
      { ...BOARD(bar(3), bar(4), true), s0: 6.8 },
      ...COMMON_TAIL,
      at(RECAP, bar(8), bar(9)),
      ...SOCIAL,
    ],
    supers: [
      { t0: beat(1.5), t1: bar(1), kick: 'NOW LIVE ON ELYSIUM', text: 'Win USDC on the next candle.' },
      { t0: bar(2) + beat(1), t1: bar(3), kick: 'DUEL · 1V1', text: 'Face off on the next candle.' },
      { t0: bar(3) + beat(0.5), t1: bar(4), text: 'Pick UP or DOWN.' },
      { t0: bar(4) + beat(0.5), t1: bar(5), kick: 'BATTLE ROYALE', text: 'Everyone stakes into one pot.' },
      { t0: M.SILENCE, t1: M.DROP, text: 'One candle decides.', mid: true },
      { t0: bar(7) + beat(2), t1: bar(8), text: 'Call it right. Take the pool.' },
      { t0: bar(8) + beat(1), t1: bar(9), kick: 'DUEL', text: 'Winner takes the pot.' },
      ...SOCIAL_SUPERS,
    ],
    stamps: [0.05, bar(7) + 0.1, M.END],
    card: {
      line1: 'YOCHI IS LIVE ON ELYSIUM',
      line2: 'Predict. Compete. Win.',
      url: 'yochigg.xyz',
      foot: '18+ · REAL-MONEY GAMEPLAY · PLAY RESPONSIBLY',
    },
  },
};

export const FPS = 30;
export { DURATION, W, H };
