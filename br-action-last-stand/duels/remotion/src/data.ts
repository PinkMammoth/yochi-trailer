// YOCHI DUELS: THE LAST STAND. The match (fictional players, fictional price path) and the timing map.
// Duel rules verified in the app (callit.win, yochi-main, 20 Nov): Sudden Death is one round for the pot; both pick
// the next 1-minute candle and picks lock before it opens; the winner takes both stakes less the contract's
// treasury rake (duel-fees.ts duelNetPayout), 5% at launch, so 2 x 10 USDC pays the winner 19, shown "+19".
import timing from './timing.json';

export const FPS = timing.fps;
export const T = timing;
export const fr = (s: number) => Math.round(s * FPS);

export const MATCH = {
  format: 'SUDDEN DEATH',
  stake: 10,
  feePct: 5,
  payout: 19, // 2 x 10 x (1 - 0.05)
  him: { handle: 'brick', card: 'rampage', pick: 'UP' as const },
  her: { handle: 'mira', card: 'duel-master', pick: 'DOWN' as const },
};

/** Measured points on the art (source px). Card px for the kit cards (1536x2048); image px for the poses. */
export const ART = {
  rampage: { face: [1030, 412] as [number, number], faceW: 236, fist: [520, 1480] as [number, number] },
  duelMaster: { face: [880, 545] as [number, number], eyes: [860, 505] as [number, number] },
  disbelief: { src: 'poses/rampage-disbelief.webp', w: 1086, h: 1448, face: [745, 214] as [number, number], faceW: 164 },
  hit: { src: 'mattes/rampage-hit.png', w: 1086, h: 1448, chest: [388, 560] as [number, number], head: [171, 233] as [number, number] },
  attack: { src: 'poses/duel-master-attack.webp', matte: 'mattes/duel-master-attack.png', w: 1500, h: 2000, face: [1050, 615] as [number, number], blade: [150, 1290] as [number, number], hand: [214, 1071] as [number, number] },
};
