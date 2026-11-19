// THE LAST STAND: the match (fictional players, fictional price path) and the timing map.
import timing from './timing.json';

export const FPS = timing.fps;
export const T = timing;
export const fr = (s: number) => Math.round(s * FPS);
/** frames between two timing-map times */
export const sec = (s: number) => fr(s);

/** The final two of a ten-seat Battle Royale. 10 seats x 10 USDC = a 100 USDC pool; the winner takes 95 (5% fee). */
export const MATCH = {
  seats: 10,
  stake: 10,
  pool: 100,
  feePct: 5,
  payout: 95,
  left: { handle: 'deano', character: 'cold-blooded', card: 'cold-blooded-v2', pick: 'DOWN' as const, lives: 1 },
  right: { handle: 'mira', character: 'duel-master', card: 'duel-master', pick: 'UP' as const, lives: 2 },
};
