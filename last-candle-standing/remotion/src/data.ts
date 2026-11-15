// The match. Ten players, two lives each, seven rounds, one survivor. The game state is derived from the round
// table below, so every life pip, grey face and counter in the film agrees with it (and with the real app rules:
// asset-pack/sumi/reference/screens/real-br-picking.png, "Two lives left. A wrong pick costs one. If everyone is
// wrong, the round replays." No round here has everyone wrong).
import T from './timing.json';

export type Dir = 'UP' | 'DOWN';

export interface Player {
  id: string;          // our key
  name: string;        // the painting's kit name (docs only, never on screen)
  handle: string;      // invented lowercase handle (SHARED-RULES copy rules)
  you?: boolean;
  portrait: string;    // assets/portraits/<file> (kit portrait, 512x683)
  card: string;        // assets/cards/<file> (kit card, 1536x2048)
  crop: { x: number; y: number; size: number }; // app's square face window, fractions of portrait width
}

// Ring order, clockwise from the top. YOU sits lower left, the rival upper right: opposite sides of the ring.
export const PLAYERS: Player[] = [
  { id: 'untouchable', name: 'Untouchable', handle: 'rektangle', portrait: 'untouchable.webp', card: 'untouchable.webp', crop: { x: 0.24, y: 0.02, size: 0.68 } },
  { id: 'bloodsport', name: 'Bloodsport', handle: 'ape_in', portrait: 'bloodsport.webp', card: 'bloodsport.webp', crop: { x: 0.2, y: 0, size: 0.62 } },
  { id: 'last-legend', name: 'Last Legend', handle: 'deano', portrait: 'last-legend.webp', card: 'last-legend.webp', crop: { x: 0.32, y: 0.02, size: 0.6 } },
  { id: 'doomer', name: 'Doomer', handle: 'cope_dealer', portrait: 'starter-doomer.webp', card: 'starter-doomer.webp', crop: { x: 0.15, y: 0, size: 0.7 } },
  { id: 'final-three', name: 'Final Three', handle: 'kaze', portrait: 'final-three.webp', card: 'final-three.webp', crop: { x: 0.12, y: 0.02, size: 0.62 } },
  { id: 'paper-hands', name: 'Paper Hands', handle: 'soup', portrait: 'starter-paper-hands.webp', card: 'starter-paper-hands.webp', crop: { x: 0.25, y: 0.04, size: 0.62 } },
  { id: 'fomo', name: 'FOMO', handle: 'mira', portrait: 'starter-fomo-v2.webp', card: 'starter-fomo-v2.webp', crop: { x: 0.25, y: 0.02, size: 0.62 } },
  { id: 'perma-bull', name: 'Perma-Bull', handle: 'you', you: true, portrait: 'starter-perma-bull-v2.webp', card: 'starter-perma-bull-v2.webp', crop: { x: 0.2, y: 0.0, size: 0.62 } },
  { id: 'contrarian', name: 'Contrarian', handle: 'exit_liquidity', portrait: 'starter-contrarian.webp', card: 'starter-contrarian.webp', crop: { x: 0.12, y: 0.04, size: 0.66 } },
  { id: 'ronin', name: 'Ronin', handle: '0x9c…e2', portrait: 'ronin.webp', card: 'ronin.webp', crop: { x: 0.2, y: 0.0, size: 0.66 } },
];

export const LIVES = 2;
export const ENTRY = 10; // USDC per seat
export const POT = PLAYERS.length * ENTRY; // 100
export const PAYOUT = POT * 0.95; // 95, the 5% rake

/** The rounds: the candle's close and who read it wrong. */
export const ROUNDS: { n: number; close: Dir; wrong: string[] }[] = [
  { n: 1, close: 'UP', wrong: ['doomer', 'contrarian', 'paper-hands', 'ronin'] },
  { n: 2, close: 'DOWN', wrong: ['paper-hands', 'fomo', 'bloodsport', 'untouchable'] },
  { n: 3, close: 'DOWN', wrong: ['ronin', 'fomo', 'perma-bull'] },
  { n: 4, close: 'UP', wrong: ['contrarian', 'doomer', 'untouchable'] },
  { n: 5, close: 'DOWN', wrong: ['bloodsport', 'final-three', 'last-legend'] },
  { n: 6, close: 'UP', wrong: ['final-three'] },
  { n: 7, close: 'UP', wrong: ['last-legend'] },
];

/** Lives left after `round` rounds have settled (0 = before round 1). */
export function livesAfter(id: string, round: number) {
  let l = LIVES;
  for (const r of ROUNDS) if (r.n <= round && r.wrong.includes(id)) l--;
  return Math.max(0, l);
}
/** The round a player went out in, or null. */
export function outRound(id: string): number | null {
  for (let r = 1; r <= ROUNDS.length; r++) if (livesAfter(id, r) === 0) return r;
  return null;
}
export const standingAfter = (round: number) => PLAYERS.filter((p) => livesAfter(p.id, round) > 0).length;
/** What each player picked in a round (the wrong ones picked against the close). */
export function pickIn(id: string, round: number): Dir {
  const r = ROUNDS[round - 1];
  const wrong = r.wrong.includes(id);
  return wrong ? (r.close === 'UP' ? 'DOWN' : 'UP') : r.close;
}
/** Who was eliminated in a round, and who only lost a life. */
export function roundOutcome(round: number) {
  const r = ROUNDS[round - 1];
  const out = r.wrong.filter((id) => livesAfter(id, round) === 0);
  const hurt = r.wrong.filter((id) => livesAfter(id, round) > 0);
  return { out, hurt, close: r.close };
}
/** Face centre in painting fractions (of the painting's width), from the face window. */
export const faceOf = (p: Player): [number, number] => [p.crop.x + p.crop.size / 2, p.crop.y + p.crop.size * 0.42];
export const byId = (id: string) => PLAYERS.find((p) => p.id === id)!;
export const YOU = byId('perma-bull');
export const RIVAL = byId('last-legend');

// sanity: the story must hold (fails the render if someone edits the table into an impossible match)
(() => {
  if (standingAfter(6) !== 2 || livesAfter('perma-bull', 6) !== 1 || livesAfter('last-legend', 6) !== 1) throw new Error('final two must be YOU and the rival on one life each');
  if (standingAfter(7) !== 1 || livesAfter('perma-bull', 7) !== 1) throw new Error('YOU must be last one standing');
  for (const r of ROUNDS) if (r.wrong.length >= standingAfter(r.n - 1)) throw new Error(`round ${r.n}: everyone wrong would replay`);
})();

export const FPS = T.fps;
export const sec = (s: number) => Math.round(s * T.fps);
export { T };
