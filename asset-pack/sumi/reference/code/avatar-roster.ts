// =============================================================================
// AVATAR ROSTER — the curated profile-picture gallery.
// -----------------------------------------------------------------------------
// Players pick any entry from this roster (profile page → click avatar); the
// choice is stored as an opaque `avatar_id` in evm_user_profiles via the
// evm-auth Edge Function. No id / an unknown id renders the procedural
// PlayerSigil default instead, so entries can be added or retired here without
// a migration or function redeploy.
//
// The Sumi collectible cast (Oct 2026): painted 3:4 portraits, each with a
// framed card. Free starters, then achievement rewards. The rewards keep their
// original `pepe-*` ids from the sticker era: evm_avatar_unlock_rules and saved
// avatar_ids key on them. The legacy free stickers (Pepes / Bulls / Bears) were
// retired 2026-10-24; anyone still wearing one falls back to their sigil.
//
// NFT pfps later: same slot, e.g. an 'nft:' prefixed id resolved separately.
// =============================================================================

import type { CSSProperties } from 'react';

export type RosterFamily = 'starter' | 'reward';

export interface RosterAvatar {
    id: string;      // ^[a-z0-9][a-z0-9_-]{0,31}$ (enforced server-side)
    src: string;
    alt: string;
    family: RosterFamily;
    name?: string;   // short display label (reward callouts); falls back to alt

    // Challenge-gated: this face is a reward, not a free pick. It stays visible
    // in the picker but greyed + locked until the player earns `achievementId`.
    // The gating map is duplicated server-side (evm-auth avatar route) so a curl
    // can't claim it — keep the two in sync when editing.
    unlock?: { achievementId: string; hint: string };

    // Sumi collectible art (2026-10-21): `src` is the frameless 3:4 portrait and
    // `crop` the square window small slots show, as fractions of the art's width
    // (x, y = top-left corner; size = side). `card` is the full framed 3:4
    // collectible for big surfaces (profile View Card). Rarity is NOT stored here:
    // it comes from the unlocking achievement (lib/avatar-card.ts).
    crop?: { x: number; y: number; size: number };
    card?: string;
}

/** Picker section order + labels. */
export const ROSTER_FAMILIES: { id: RosterFamily; label: string }[] = [
    { id: 'starter', label: 'STARTERS' },
    { id: 'reward', label: 'REWARDS' },
];

export const AVATAR_ROSTER: RosterAvatar[] = [
    // Sumi starters (2026-10-22): free picks with a Common collectible card. New
    // ids, so nobody's current face changes; free ids need no unlock rule.
    { id: 'starter-perma-bull',  src: '/avatars/portraits/starter-perma-bull.webp',  alt: 'Grinning trader giving a thumbs up, phone full of green candles', family: 'starter', name: 'Perma-Bull',  crop: { x: 0.36, y: 0.02, size: 0.6 }, card: '/avatars/cards/starter-perma-bull.webp' },
    { id: 'starter-doomer',      src: '/avatars/portraits/starter-doomer.webp',      alt: 'Unimpressed man in a hoodie with a coffee and a crashing chart', family: 'starter', name: 'Doomer',      crop: { x: 0.15, y: 0, size: 0.7 }, card: '/avatars/cards/starter-doomer.webp' },
    { id: 'starter-night-shift', src: '/avatars/portraits/starter-night-shift.webp', alt: 'Exhausted trader in headphones holding an energy drink', family: 'starter', name: 'Night Shift', crop: { x: 0.15, y: 0, size: 0.7 }, card: '/avatars/cards/starter-night-shift.webp' },
    { id: 'starter-lucky-fool',  src: '/avatars/portraits/starter-lucky-fool.webp',  alt: 'Stunned woman with coins raining down, clutching a lucky ticket', family: 'starter', name: 'Lucky Fool',  crop: { x: 0.15, y: 0, size: 0.7 }, card: '/avatars/cards/starter-lucky-fool.webp' },
    { id: 'starter-strategist',  src: '/avatars/portraits/starter-strategist-v3.webp',  alt: 'Woman in glasses with a pen and a clipboard of plans', family: 'starter', name: 'Strategist',  crop: { x: 0.15, y: 0, size: 0.7 }, card: '/avatars/cards/starter-strategist-v3.webp' },
    { id: 'starter-degenerate',  src: '/avatars/portraits/starter-degenerate.webp',  alt: 'Bruised, grinning man rubbing the back of his neck', family: 'starter', name: 'Degenerate',  crop: { x: 0.15, y: 0, size: 0.7 }, card: '/avatars/cards/starter-degenerate.webp' },
    { id: 'starter-bagholder',   src: '/avatars/portraits/starter-bagholder-v2.webp',   alt: 'Bandaged man hugging a sack of old coins', family: 'starter', name: 'Bagholder',   crop: { x: 0.15, y: 0, size: 0.7 }, card: '/avatars/cards/starter-bagholder-v2.webp' },
    { id: 'starter-fomo',        src: '/avatars/portraits/starter-fomo-v2.webp',        alt: 'Panicked woman lunging after a phone with a rising chart', family: 'starter', name: 'FOMO',        crop: { x: 0.25, y: 0.02, size: 0.62 }, card: '/avatars/cards/starter-fomo-v2.webp' },
    { id: 'starter-paper-hands', src: '/avatars/portraits/starter-paper-hands.webp', alt: 'Terrified man in glasses clutching a paper slip', family: 'starter', name: 'Paper Hands', crop: { x: 0.25, y: 0.04, size: 0.62 }, card: '/avatars/cards/starter-paper-hands.webp' },
    { id: 'starter-contrarian',  src: '/avatars/portraits/starter-contrarian.webp',  alt: 'Unconvinced woman in a hoodie holding up a DOWN sign', family: 'starter', name: 'Contrarian',  crop: { x: 0.12, y: 0.04, size: 0.66 }, card: '/avatars/cards/starter-contrarian.webp' },
    { id: 'pepe-laser',  src: '/avatars/portraits/untouchable.webp',  alt: 'Blindfolded swordswoman in flowing robes', family: 'reward', name: 'Untouchable', crop: { x: 0.2, y: 0.02, size: 0.7 }, card: '/avatars/cards/untouchable.webp',  unlock: { achievementId: 'untouchable',   hint: 'Win 5 in a row' } },
    // Rewards: earned by the achievement in `unlock`.
    { id: 'pepe-suit',   src: '/avatars/portraits/hundred-trials.webp',   alt: 'Weathered old man with a tally board, sitting on a chest',          family: 'reward', name: 'Hundred Trials', crop: { x: 0.08, y: 0, size: 0.62 }, card: '/avatars/cards/hundred-trials.webp', unlock: { achievementId: 'diamond_hands',  hint: 'Play 100 rounds' } },
    { id: 'pepe-king',   src: '/avatars/portraits/insider-v2.webp',   alt: 'Smug man with a cigar holding a sealed envelope', family: 'reward', name: 'Insider', crop: { x: 0.3, y: 0, size: 0.62 }, card: '/avatars/cards/insider-v2.webp',   unlock: { achievementId: 'rank_degen_god', hint: 'Reach max level' } },
    { id: 'pepe-wizard', src: '/avatars/portraits/whale.webp', alt: 'Laughing bearded noble raising a gold cup over a chest of coins', family: 'reward', name: 'Whale', crop: { x: 0.3, y: 0, size: 0.7 }, card: '/avatars/cards/whale.webp', unlock: { achievementId: 'rank_seer',      hint: 'Reach level 5' } },
    // Replaced Hazmat Pepe (0097 moves anyone wearing pepe-hazmat onto this id).
    { id: 'pepe-highroller', src: '/avatars/portraits/high-roller-v2.webp', alt: 'Laughing woman in a gold-patterned robe flipping a casino chip', family: 'reward', name: 'High Roller', crop: { x: 0.22, y: 0.06, size: 0.56 }, card: '/avatars/cards/high-roller-v2.webp', unlock: { achievementId: 'high_roller', hint: 'Place a 100 USDC bet' } },
    // Capstone faces — earned by the ladder + money capstones (migration 0026).
    // Keep `unlock` in sync with evm_avatar_unlock_rules.
    { id: 'pepe-ice',      src: '/avatars/portraits/cold-blooded.webp',      alt: 'Silver-haired swordswoman with a katana', family: 'reward', name: 'Cold Blooded', crop: { x: 0.15, y: 0, size: 0.7 }, card: '/avatars/cards/cold-blooded.webp', unlock: { achievementId: 'cold_blooded',  hint: 'Win 10 in a row' } },
    { id: 'pepe-thirdeye', src: '/avatars/portraits/deadeye.webp', alt: 'Sharp-eyed marksman in glasses with a crossbow', family: 'reward', name: 'Deadeye', crop: { x: 0.3, y: 0.02, size: 0.62 }, card: '/avatars/cards/deadeye.webp', unlock: { achievementId: 'deadeye',       hint: '60% win rate over 100 rounds' } },
    { id: 'pepe-printer',  src: '/avatars/portraits/in-the-green.webp',  alt: 'Woman in green-and-gold robes lounging with a card', family: 'reward', name: 'In the Green', crop: { x: 0.08, y: 0.02, size: 0.62 }, card: '/avatars/cards/in-the-green.webp', unlock: { achievementId: 'in_the_green',  hint: 'Reach +500 USDC net profit' } },
    { id: 'pepe-jackpot',  src: '/avatars/portraits/took-the-pool.webp',  alt: 'Grinning thief shushing over a bulging sack of coins', family: 'reward', name: 'Took the Pool', crop: { x: 0.15, y: 0, size: 0.7 }, card: '/avatars/cards/took-the-pool.webp', unlock: { achievementId: 'took_the_pool', hint: 'Win 250 USDC in a single round' } },
    { id: 'pepe-rampage',  src: '/avatars/portraits/rampage.webp',  alt: 'Grinning brawler throwing a bandaged fist', family: 'reward', name: 'Rampage', crop: { x: 0.3, y: 0, size: 0.6 }, card: '/avatars/cards/rampage.webp', unlock: { achievementId: 'rampage', hint: 'Win 7 in a row' } },
    // Duels + Battle Royale reward faces (migration 0028). Keep `unlock` in
    // sync with evm_avatar_unlock_rules.
    { id: 'pepe-knight',     src: '/avatars/portraits/duel-master.webp',     alt: 'Swordswoman with a long ponytail drawing a blade',   family: 'reward', name: 'Duel Master', crop: { x: 0.22, y: 0, size: 0.7 }, card: '/avatars/cards/duel-master.webp',     unlock: { achievementId: 'duel_win_10',    hint: 'Win 10 duels' } },
    { id: 'pepe-gunslinger', src: '/avatars/portraits/gunslinger.webp', alt: 'Gunslinger in a wide hat aiming a revolver', family: 'reward', name: 'Gunslinger', crop: { x: 0.12, y: 0.02, size: 0.8 }, card: '/avatars/cards/gunslinger.webp', unlock: { achievementId: 'duel_win_5',     hint: 'Win 5 duels' } },
    { id: 'pepe-devil',      src: '/avatars/portraits/grudge-settled.webp',      alt: 'Grinning card sharp in a fox mask fanning a hand of cards',           family: 'reward', name: 'Grudge Settled', crop: { x: 0.15, y: 0, size: 0.7 }, card: '/avatars/cards/grudge-settled.webp',      unlock: { achievementId: 'grudge_settled', hint: 'Beat your nemesis in a duel' } },
    { id: 'pepe-tactical',   src: '/avatars/portraits/last-legend.webp',   alt: 'Grizzled veteran in battered armour',    family: 'reward', name: 'Last Legend', crop: { x: 0.32, y: 0.02, size: 0.6 }, card: '/avatars/cards/last-legend.webp',   unlock: { achievementId: 'br_win_10',      hint: 'Win 10 Battle Royales' } },
    { id: 'pepe-laststand',  src: '/avatars/portraits/final-three.webp',  alt: 'Battered young fighter bracing himself, still standing',     family: 'reward', name: 'Final Three', crop: { x: 0.12, y: 0.02, size: 0.62 }, card: '/avatars/cards/final-three.webp', unlock: { achievementId: 'br_final_three', hint: 'Reach the final 3 in a Battle Royale' } },
    { id: 'pepe-bloodsport', src: '/avatars/portraits/bloodsport.webp', alt: 'Grinning gladiator beckoning her next opponent', family: 'reward', name: 'Bloodsport', crop: { x: 0.2, y: 0, size: 0.62 }, card: '/avatars/cards/bloodsport.webp', unlock: { achievementId: 'br_win_5', hint: 'Win 5 Battle Royales' } },
    // Closed beta reward faces (migration 0097). Never reissued, like the badges.
    // Keep `unlock` in sync with evm_avatar_unlock_rules.
    { id: 'pepe-labrat',    src: '/avatars/portraits/lab-rat.webp',    alt: 'Grinning figure in goggles holding up a flask', family: 'reward', name: 'Lab Rat', crop: { x: 0.18, y: 0, size: 0.82 }, card: '/avatars/cards/lab-rat.webp',    unlock: { achievementId: 'lab_rat',    hint: 'Play during the closed beta' } },
    { id: 'pepe-bughunter', src: '/avatars/portraits/bughunter.webp', alt: 'Sly old tinkerer holding a lantern with a bug inside',         family: 'reward', name: 'Bug Hunter', crop: { x: 0.15, y: 0, size: 0.7 }, card: '/avatars/cards/bughunter.webp', unlock: { achievementId: 'bug_hunter', hint: 'Find a confirmed beta bug' } },
];

const byId = new Map(AVATAR_ROSTER.map((a) => [a.id, a]));

// Chat-only personas used in FFA recording sessions deliberately have no real
// wallet/profile. Give that fixed cast a face in the arena without creating
// fake on-chain identities or affecting any real player's profile choice.
const CHAT_ONLY_DEMO_AVATARS: Readonly<Record<string, string>> = {
    "cope_dealer": "starter-bagholder",
    "soup": "starter-paper-hands",
    "kev1n": "starter-perma-bull",
    "hannah_t": "starter-night-shift",
    "mira": "starter-fomo",
};

/** Curated fallback face for a chat-only recording persona, if one is known. */
export function chatOnlyDemoAvatarId(username: string): string | null {
    return CHAT_ONLY_DEMO_AVATARS[username.toLowerCase()] ?? null;
}

/** Style for an <img> of `a` filling a square, overflow-hidden slot. Art with a
 *  `crop` shows that window (cover-fit to the top square, then scaled about the
 *  point that lands the window on the slot); sticker art just covers. */
export function rosterImageStyle(a: Pick<RosterAvatar, 'src'> & Partial<Pick<RosterAvatar, 'crop'>>): CSSProperties {
    const c = a.crop;
    if (!c || c.size >= 1) return { objectFit: 'cover', objectPosition: c ? '50% 0%' : undefined };
    const origin = (offset: number) => `${((offset / (1 - c.size)) * 100).toFixed(2)}%`;
    return {
        objectFit: 'cover',
        objectPosition: '50% 0%',
        transform: `scale(${(1 / c.size).toFixed(4)})`,
        transformOrigin: `${origin(c.x)} ${origin(c.y)}`,
    };
}

/** Resolve a stored avatar_id to a roster entry; null → caller falls back to the sigil. */
export function rosterAvatar(id: string | null | undefined): RosterAvatar | null {
    if (!id) return null;
    return byId.get(id) ?? null;
}

const byAchievement = new Map(
    AVATAR_ROSTER.filter((a) => a.unlock).map((a) => [a.unlock!.achievementId, a] as const),
);

/** The reward avatar an achievement unlocks, if any (for the achievements grid). */
export function avatarForAchievement(achievementId: string): RosterAvatar | null {
    return byAchievement.get(achievementId) ?? null;
}

/** True if a roster avatar is a free pick, or its gating achievement is unlocked. */
export function isRosterAvatarUnlocked(a: RosterAvatar, unlockedIds: Set<string>): boolean {
    return !a.unlock || unlockedIds.has(a.unlock.achievementId);
}
