// Sumi brand tokens (asset-pack/sumi/README.md) and the roster (names, takes and unlocks copied exactly).

export const SUMI = {
  bg: '#0f0d0b', s1: '#1a1714', s2: '#221e1a', line: 'rgba(239,231,216,0.12)',
  ink: '#efe7d8', muted: '#a39a8a', out: '#8f8676',
  red: '#ff5436', onRed: '#140f0c', up: '#3ddc84', down: '#ff4d6d', gold: '#e0b25a',
  band: '#efe7d8', bandUp: '#12703f', bandDown: '#b02a44',
};
export const PAPER = {
  bg: '#f2ece0', s1: '#fbf8f2', s2: '#f1eadc', line: 'rgba(22,19,15,0.12)',
  ink: '#16130f', muted: '#5d5548', out: '#6e665a',
  red: '#d6402b', redText: '#b3301e', onRed: '#fff8ef', up: '#15804a', down: '#c2304d',
};

export const F = {
  dela: (px) => `400 ${px}px "Dela Gothic One"`,
  mono: (px, w = 700) => `${w} ${px}px "JetBrains Mono"`,
  zen: (px, w = 700) => `${w} ${px}px "Zen Kaku Gothic New"`,
  glyph: (px) => `400 ${px}px "Yuji Syuku"`,
};

// The ten free starters, in the order they enter the film.
export const STARTERS = [
  { id: 'starter-doomer', name: 'DOOMER', take: "it's over" },
  { id: 'starter-perma-bull', name: 'PERMA-BULL', take: 'never selling' },
  { id: 'starter-night-shift', name: 'NIGHT SHIFT', take: 'one more candle' },
  { id: 'starter-lucky-fool', name: 'LUCKY FOOL', take: "i don't know what i did" },
  { id: 'starter-strategist-v3', name: 'STRATEGIST', take: 'i have a plan' },
  { id: 'starter-degenerate', name: 'DEGENERATE', take: 'max size' },
  { id: 'starter-bagholder-v2', name: 'BAGHOLDER', take: "it'll come back" },
  { id: 'starter-fomo-v2', name: 'FOMO', take: 'wait for me' },
  { id: 'starter-paper-hands', name: 'PAPER HANDS', take: "i'm out" },
  { id: 'starter-contrarian', name: 'CONTRARIAN', take: "everyone's wrong" },
];
// The character-select grid order (5x2): the two leads in the middle of the top row.
export const GRID_ORDER = ['starter-night-shift', 'starter-lucky-fool', 'starter-perma-bull', 'starter-doomer', 'starter-strategist-v3',
  'starter-degenerate', 'starter-bagholder-v2', 'starter-fomo-v2', 'starter-paper-hands', 'starter-contrarian'];

// The 18 rewards with their unlocks, as written in the kit's cast table (README.md).
export const REWARDS = [
  { id: 'untouchable', name: 'UNTOUCHABLE', unlock: 'Win 5 in a row' },
  { id: 'hundred-trials', name: 'HUNDRED TRIALS', unlock: 'Play 100 rounds' },
  { id: 'insider-v2', name: 'INSIDER', unlock: 'Reach max level' },
  { id: 'whale', name: 'WHALE', unlock: 'Reach level 5' },
  { id: 'high-roller-v2', name: 'HIGH ROLLER', unlock: 'Place a 100 USDC bet' },
  { id: 'cold-blooded', name: 'COLD BLOODED', unlock: 'Win 10 in a row' },
  { id: 'deadeye', name: 'DEADEYE', unlock: '60% win rate over 100 rounds' },
  { id: 'in-the-green', name: 'IN THE GREEN', unlock: 'Reach +500 USDC net profit' },
  { id: 'took-the-pool', name: 'TOOK THE POOL', unlock: 'Win 250 USDC in a single round' },
  { id: 'rampage', name: 'RAMPAGE', unlock: 'Win 7 in a row' },
  { id: 'duel-master', name: 'DUEL MASTER', unlock: 'Win 10 duels' },
  { id: 'ronin', name: 'RONIN', unlock: 'Win 5 duels' },
  { id: 'grudge-settled', name: 'GRUDGE SETTLED', unlock: 'Beat your nemesis in a duel' },
  { id: 'last-legend', name: 'LAST LEGEND', unlock: 'Win 10 Battle Royales' },
  { id: 'final-three', name: 'FINAL THREE', unlock: 'Reach the final 3 in a Battle Royale' },
  { id: 'bloodsport', name: 'BLOODSPORT', unlock: 'Win 5 Battle Royales' },
  { id: 'lab-rat', name: 'LAB RAT', unlock: 'Play during the closed beta' },
  { id: 'bughunter', name: 'BUG HUNTER', unlock: 'Find a confirmed beta bug' },
];
export const BY_ID = Object.fromEntries([...STARTERS, ...REWARDS].map((c) => [c.id, c]));
export const ALL_IDS = [...STARTERS, ...REWARDS].map((c) => c.id);
