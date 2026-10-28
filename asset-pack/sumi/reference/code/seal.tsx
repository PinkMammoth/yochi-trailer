import { useId, type CSSProperties, type ReactNode } from 'react';
import { RANK_GLYPHS, type GlyphEntry } from '@/lib/seal-glyphs';

// =============================================================================
// SEAL: the rebrand's reward language (brief sections 6 and 7)
// =============================================================================
// A rounded-square hanko with one brushed glyph. Picks, wins, lives,
// eliminations, nemesis and achievements are all seals, so the tones carry
// meaning, not decoration:
//
//   red      vermilion fill. You, your pick, your win.
//   outline  vermilion ring. A lighter "yours" (chips, small rows).
//   ink      ink fill. Earned but not the moment (older achievements).
//   out      grey ring. Defeat, eliminated. Losses are never vermilion.
//   empty    dashed slot. The next goal; the glyph shows faintly if given.
//
// Each seal carries its own stamp filter (keyed by useId) instead of pointing at
// a shared <defs>: an SVG whose filter reference is missing can fail to paint,
// and share-card capture clones the node without the page's defs.
// =============================================================================

export type SealTone = 'red' | 'outline' | 'ink' | 'out' | 'empty';

interface SealFrameProps {
    tone?: SealTone;
    /** Rendered edge length in px. */
    size?: number;
    /** Resting angle in degrees. Seals look stamped at -10 to +5. */
    rotate?: number;
    /** Play the stamp-lands animation once on mount. */
    stamp?: boolean;
    /** Seconds before the stamp lands. */
    delay?: number;
    /** Hide from assistive tech when the meaning is already in adjacent text. */
    decorative?: boolean;
    /** Paper grain on the ink. Off for very small seals where it eats strokes. */
    texture?: boolean;
    className?: string;
}

interface SealProps extends SealFrameProps {
    /** From lib/seal-glyphs.ts, never a bare string: the font is subset to it. */
    glyph: GlyphEntry;
}

const TONES: Record<SealTone, { fill: string; stroke: string; strokeWidth: number; dash?: string; ink: string }> = {
    red:     { fill: 'var(--yo-red)', stroke: 'none', strokeWidth: 0, ink: 'var(--yo-on-red)' },
    outline: { fill: 'none', stroke: 'var(--yo-red)', strokeWidth: 5, ink: 'var(--yo-red)' },
    ink:     { fill: 'var(--yo-ink)', stroke: 'none', strokeWidth: 0, ink: 'var(--yo-bg)' },
    out:     { fill: 'none', stroke: 'var(--yo-out)', strokeWidth: 5, ink: 'var(--yo-out)' },
    empty:   { fill: 'none', stroke: 'var(--yo-muted)', strokeWidth: 2.5, dash: '7 5', ink: 'var(--yo-muted)' },
};

function SealFrame({
    tone = 'red',
    size = 40,
    rotate = 0,
    stamp = false,
    delay = 0,
    decorative = false,
    texture = true,
    className,
    label,
    viewBox,
    children,
}: SealFrameProps & { label: string; viewBox: number; children: (t: (typeof TONES)[SealTone]) => ReactNode }) {
    const filterId = `yo-seal-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const t = TONES[tone];
    const inset = viewBox * 0.075;
    const grain = texture && tone !== 'empty';

    const style = {
        display: 'inline-block',
        width: size,
        height: size,
        flexShrink: 0,
        lineHeight: 0,
        transform: `rotate(${rotate}deg)`,
        '--yo-seal-rot': `${rotate}deg`,
        '--yo-delay': `${delay}s`,
    } as CSSProperties;

    return (
        <span className={[stamp ? 'yo-stamp' : '', className].filter(Boolean).join(' ') || undefined} style={style}>
            <svg
                viewBox={`0 0 ${viewBox} ${viewBox}`}
                width={size}
                height={size}
                {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
            >
                {grain && (
                    <defs>
                        <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
                            <feTurbulence type="fractalNoise" baseFrequency={1.4 * (80 / viewBox)} numOctaves={1} seed={5} result="n" />
                            {/* Erosion kept low (brief: heavier made 決 unreadable). */}
                            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.35" result="holes" />
                            <feComposite in="SourceGraphic" in2="holes" operator="in" />
                        </filter>
                    </defs>
                )}
                <g filter={grain ? `url(#${filterId})` : undefined}>
                    <rect
                        x={inset}
                        y={inset}
                        width={viewBox - inset * 2}
                        height={viewBox - inset * 2}
                        rx={viewBox * 0.075}
                        fill={t.fill}
                        stroke={t.stroke}
                        strokeWidth={t.strokeWidth * (viewBox / 80)}
                        strokeDasharray={t.dash}
                    />
                    {children(t)}
                </g>
            </svg>
        </span>
    );
}

/** One brushed glyph in a seal. Two-character glyphs (連勝) set smaller. */
export function Seal({ glyph, ...frame }: SealProps) {
    const chars = [...glyph.glyph].length;
    const fontSize = chars > 1 ? 58 / chars : 46;
    return (
        <SealFrame {...frame} label={glyph.meaning} viewBox={80}>
            {(t) => (
                <text
                    x={40}
                    y={40 + fontSize * 0.36}
                    textAnchor="middle"
                    fontSize={fontSize}
                    fill={t.ink}
                    opacity={frame.tone === 'empty' ? 0.55 : 1}
                    style={{ fontFamily: 'var(--yo-font-glyph)' }}
                >
                    {glyph.glyph}
                </text>
            )}
        </SealFrame>
    );
}

/** Latin hanko, set in the display face, with the inner ring from the mocks.
 *  The CALLED IT badge is the only one so far. */
export function HankoSeal({ lines, label, ...frame }: SealFrameProps & { lines: [string, string]; label: string }) {
    return (
        <SealFrame {...frame} label={label} viewBox={160}>
            {(t) => (
                <>
                    <rect x={21} y={21} width={118} height={118} rx={5} fill="none" stroke={t.ink} strokeWidth={2.5} />
                    {/* Dela Gothic One sets wider than the mock assumed; pin the long line
                        inside the inner ring rather than trusting the metrics. */}
                    <text x={80} y={72} textAnchor="middle" fontSize={26} textLength={98} lengthAdjust="spacingAndGlyphs" fill={t.ink} style={{ fontFamily: 'var(--yo-font-display)' }}>
                        {lines[0]}
                    </text>
                    <text x={80} y={116} textAnchor="middle" fontSize={40} fill={t.ink} style={{ fontFamily: 'var(--yo-font-display)' }}>
                        {lines[1]}
                    </text>
                </>
            )}
        </SealFrame>
    );
}

/** The rank glyph for a level title (凡 民 狂 商 鯨 市 影), as an ink seal.
 *  Renders nothing for a title without a glyph. */
export function RankSeal({ title, size = 28, rotate = -4, className }: { title: string; size?: number; rotate?: number; className?: string }) {
    const glyph = RANK_GLYPHS[title];
    if (!glyph) return null;
    return <Seal glyph={{ ...glyph, meaning: `${title} rank` }} tone="ink" size={size} rotate={rotate} texture={size >= 28} className={className} />;
}

/** A numeral hanko set in the display face (the leaderboard's #1). Digits are not
 *  in the Yuji Syuku subset, so this never goes through `Seal`. */
export function NumberHanko({ value, label, ...frame }: SealFrameProps & { value: string; label: string }) {
    return (
        <SealFrame {...frame} label={label} viewBox={100}>
            {(t) => (
                <text x={50} y={70} textAnchor="middle" fontSize={60} fill={t.ink} style={{ fontFamily: 'var(--yo-font-display)' }}>
                    {value}
                </text>
            )}
        </SealFrame>
    );
}
