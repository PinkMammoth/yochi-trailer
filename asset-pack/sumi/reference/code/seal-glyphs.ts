// =============================================================================
// SEAL GLYPHS (Sumi rebrand)
// =============================================================================
// The ONLY place a brushed glyph is introduced. Yuji Syuku is loaded from Google
// Fonts with a `&text=` subset in index.html, so it costs a few KB instead of
// megabytes, which means a glyph that is not listed in that URL silently falls
// back to a system Japanese font. seal-glyphs.test.ts fails when the URL and this
// registry drift; regenerate the URL with `glyphFontText()`.
//
// Every entry is a PROPOSAL until a native speaker has reviewed it (brief section
// 6). Flip `review` to 'approved' only on that review, never on our own reading.
// =============================================================================

export type GlyphReview = 'pending' | 'approved';

export interface GlyphEntry {
    glyph: string;
    /** English meaning. Becomes the seal's accessible name. */
    meaning: string;
    review: GlyphReview;
}

const g = (glyph: string, meaning: string): GlyphEntry => ({ glyph, meaning, review: 'pending' });

/** Core vocabulary: picks, wins, lives, the tabs, the brand. */
export const CORE_GLYPHS = {
    decided:   g('決', 'Decided'),
    win:       g('勝', 'Win'),
    life:      g('命', 'Life'),
    defeat:    g('敗', 'Defeat'),
    enemy:     g('敵', 'Nemesis'),
    streak:    g('連勝', 'Win streak'),
    first:     g('初', 'First'),
    versus:    g('対', 'Versus'),
    remaining: g('残', 'Still standing'),
    crowd:     g('群', 'Free for all'),
    me:        g('我', 'Me'),
    brand:     g('予知', 'Yochi'),
} as const;

/** Battle Royale rooms and results: the room phase steps, the locked roster, and
 *  the two non-champion endings (a split pot, entries returned). */
export const BR_GLYPHS = {
    recruit:  g('募', 'Recruiting'),
    ready:    g('備', 'Ready'),
    seat:     g('席', 'Seat'),
    start:    g('始', 'Start'),
    locked:   g('締', 'Roster locked'),
    split:    g('分', 'Split'),
    returned: g('返', 'Returned'),
} as const;

/** Home: the departures board heading and the Forecast row. */
export const HOME_GLYPHS = {
    departures: g('発車', 'On the board'),
    forecast:   g('予', 'Forecast'),
} as const;

/** Paper pages: the clans seal, the FAQ seal and topics, the settings sections.
 *  The FAQ and settings also reuse 群 対 残 予 敵 from the sets above. */
export const PAGE_GLYPHS = {
    clans:    g('組', 'Clans'),
    question: g('問', 'Questions'),
    basics:   g('基', 'The basics'),
    money:    g('銭', 'Fees and payouts'),
    account:  g('人', 'Account'),
    sound:    g('音', 'Sound'),
    privacy:  g('隠', 'Privacy'),
    muted:    g('黙', 'Muted'),
} as const;

/** Keyed by the level title in lib/levels.ts. */
export const RANK_GLYPHS: Record<string, GlyphEntry> = {
    'Normie':       g('凡', 'Normie'),
    'Pleb':         g('民', 'Pleb'),
    'Degen':        g('狂', 'Degen'),
    'Trader':       g('商', 'Trader'),
    'Whale':        g('鯨', 'Whale'),
    'Market Maker': g('市', 'Market Maker'),
    'Insider':      g('影', 'Insider'),
};

/** Keyed by achievement id (evm/profile-data.ts). All 41, every one a proposal
 *  pending native review (brief section 6). */
export const ACHIEVEMENT_GLYPHS: Record<string, GlyphEntry> = {
    lab_rat:        g('鼠', 'Lab Rat'),
    bug_hunter:     g('虫', 'Bug Hunter'),
    first_blood:    g('血', 'First Blood'),
    night_owl:      g('梟', 'Night Owl'),
    back_to_back:   g('双', 'Back to Back'),
    hot_streak:     g('炎', 'Hot Streak'),
    untouchable:    g('盾', 'Untouchable'),
    rampage:        g('暴', 'Rampage'),
    cold_blooded:   g('氷', 'Cold Blooded'),
    finding_range:  g('狙', 'Finding Range'),
    marksman:       g('的', 'Marksman'),
    sharpshooter:   g('矢', 'Sharpshooter'),
    deadeye:        g('眼', 'Deadeye'),
    rank_seer:      g('鯨', 'Whale'),
    rank_legend:    g('市', 'Market Maker'),
    rank_degen_god: g('影', 'Insider'),
    high_roller:    g('賭', 'High Roller'),
    took_the_pool:  g('奪', 'Took the Pool'),
    in_the_green:   g('緑', 'In the Green'),
    diamond_hands:  g('剛', 'Hundred Trials'),
    duel_debut:     g('始', 'First Duel'),
    duel_win_1:     g('剣', 'Duelist'),
    duel_win_5:     g('銃', 'Gunslinger'),
    duel_win_10:    g('師', 'Duel Master'),
    grudge_settled: g('報', 'Grudge Settled'),
    duel_friend:    g('仲', 'Friendly Fire'),
    br_debut:       g('戦', 'Into the Fray'),
    br_outlast:     g('耐', 'Cut the Field'),
    br_final_three: g('終', 'Final Three'),
    br_win_1:       g('冠', 'Sole Survivor'),
    br_win_3:       g('覇', 'Hat Trick'),
    br_win_5:       g('闘', 'Bloodsport'),
    br_win_10:      g('王', 'Last Legend'),
    triple_threat:  g('三', 'Triple Threat'),
    friend_added:   g('友', 'Plus One'),
    nemesis_named:  g('印', 'Marked'),
    mutual_grudge:  g('怨', 'Mutual Grudge'),
    grudge_duel:    g('挑', 'Called Out'),
    clan_joined:    g('旗', 'Colours'),
    clan_founder_5: g('創', 'Founder'),
    br_with_friend: g('援', 'Bring Backup'),
};

export function allGlyphEntries(): GlyphEntry[] {
    return [
        ...Object.values(CORE_GLYPHS),
        ...Object.values(BR_GLYPHS),
        ...Object.values(HOME_GLYPHS),
        ...Object.values(RANK_GLYPHS),
        ...Object.values(ACHIEVEMENT_GLYPHS),
        ...Object.values(PAGE_GLYPHS),
    ];
}

/** Every distinct character the glyph font must carry, in first-seen order. This
 *  is the value of the `text=` parameter in index.html (URL-encoded there). */
export function glyphFontText(): string {
    const seen = new Set<string>();
    for (const entry of allGlyphEntries()) {
        for (const ch of entry.glyph) seen.add(ch);
    }
    return [...seen].join('');
}
