// The flagship animatic's single timing map (written by audio/build_audio.py from the measured track) and the
// fictional matches. All players are invented handles; all prices are a fictional path.
import timing from './timing.json';

export const T = timing;
export const FPS = timing.fps;
export const fr = (s: number) => Math.round(s * FPS);
export const B = (n: number) => (timing.bars as Record<string, number>)[String(n)];

/** Measured points on the approved art (image px). Kit cards are 1536x2048. */
export const ART = {
  rampageCard: { src: 'cards/rampage.webp', w: 1536, h: 2048, face: [1030, 412], faceW: 236, fist: [520, 1480] },
  dmCard: { src: 'cards/duel-master.webp', w: 1536, h: 2048, face: [880, 545], eyes: [860, 505] },
  disbelief: { src: 'poses/rampage-disbelief-hd.webp', w: 1500, h: 2000, face: [1029, 296], faceW: 226.5, eyes: [1036, 238] },
  victory: { src: 'poses/duel-master-victory.webp', matte: 'mattes/duel-master-victory.png', w: 1672, h: 941, face: [710, 165] },
  hit: { src: 'mattes/rampage-hit.png', w: 1086, h: 1448, chest: [388, 560], head: [171, 233] },
  attack: { src: 'poses/duel-master-attack.webp', matte: 'mattes/duel-master-attack.png', w: 1500, h: 2000, face: [1050, 615], blade: [150, 1290] },
} as const;

/** Duel: Sudden Death, 10 USDC each, winner takes 19 (2 x 10 less the 5% rake), as THE LAST STAND verified. */
export const DUEL = { stake: 10, payout: 19, him: 'brick', her: 'mira' };

// ---------------------------------------------------------------- Free For All (recommended second act)
// Parimutuel: the winning side splits the whole pool less the 5% rake, pro rata to stake. Multiplier = pool*0.95/side.
// The figures below are internally consistent; the rake base and rounding still need confirming in the contract.
export type Entrant = { id: string; handle: string; name: string; side: 'UP' | 'DOWN'; stake: number };
export const FFA = {
  upTotal: 5120,
  downTotal: 7360,
  rake: 0.05,
  entrants: [
    { id: 'high-roller-v2', handle: 'high_roll', name: 'High Roller', side: 'UP', stake: 100 },
    { id: 'rampage', handle: 'brick', name: 'Rampage', side: 'DOWN', stake: 50 },
    { id: 'untouchable', handle: 'ghost', name: 'Untouchable', side: 'UP', stake: 40 },
    { id: 'bloodsport', handle: 'vex', name: 'Bloodsport', side: 'DOWN', stake: 60 },
    { id: 'deadeye', handle: 'scope', name: 'Deadeye', side: 'UP', stake: 20 },
    { id: 'last-legend', handle: 'oldguard', name: 'Last Legend', side: 'DOWN', stake: 75 },
    { id: 'starter-lucky-fool', handle: 'lucky', name: 'Lucky Fool', side: 'UP', stake: 5 },
    { id: 'cold-blooded', handle: 'frost', name: 'Cold Blooded', side: 'DOWN', stake: 30 },
    { id: 'took-the-pool', handle: 'sackman', name: 'Took the Pool', side: 'UP', stake: 60 },
    { id: 'grudge-settled', handle: 'foxglove', name: 'Grudge Settled', side: 'DOWN', stake: 15 },
    { id: 'duel-master', handle: 'mira', name: 'Duel Master', side: 'UP', stake: 25 },
  ] as Entrant[],
};
export const FFA_POOL = FFA.upTotal + FFA.downTotal;
export const mult = (side: 'UP' | 'DOWN') => (FFA_POOL * (1 - FFA.rake)) / (side === 'UP' ? FFA.upTotal : FFA.downTotal);
/** What a winner sees: profit (the app's "+14.00" on a 10 USDC, 2.40x win; "CLAIM" is the total). */
export const profit = (stake: number, side: 'UP' | 'DOWN') => stake * mult(side) - stake;
export const usd = (x: number) => x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---------------------------------------------------------------- Battle Royale (alternative second act)
// App screens (real-br-picking / real-br-win): 10 x 10 USDC entry, 2 lives each, a wrong pick costs one life,
// if everyone is wrong the round replays, 20 rounds max, last one standing takes 95.
export const BR = {
  seats: [
    { id: 'duel-master', handle: 'mira' }, { id: 'bloodsport', handle: 'vex' }, { id: 'last-legend', handle: 'oldguard' },
    { id: 'untouchable', handle: 'ghost' }, { id: 'deadeye', handle: 'scope' }, { id: 'cold-blooded', handle: 'frost' },
    { id: 'high-roller-v2', handle: 'high_roll' }, { id: 'ronin', handle: 'drifter' }, { id: 'final-three', handle: 'kid' },
    { id: 'grudge-settled', handle: 'foxglove' },
  ],
  // lives after each round (R1..R4); 0 = out. Round 1 nobody is out (lives before elimination).
  rounds: [
    { close: 'DOWN', lives: [2, 2, 1, 1, 2, 1, 2, 1, 2, 2] },
    { close: 'UP', lives: [2, 1, 0, 1, 2, 1, 1, 0, 2, 1] },
    { close: 'UP', lives: [1, 1, 0, 1, 1, 0, 0, 0, 1, 0] },
    { close: 'DOWN', lives: [1, 1, 0, 0, 0, 0, 0, 0, 0, 0] },
  ],
  pot: 100,
  payout: 95,
};
