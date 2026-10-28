import type { CSSProperties } from 'react';
import { BRAND } from '@/lib/brand';

/** The Y mark, inline so it follows the theme: ink arms, vermilion stem. Use
 *  this in the app; capture-only surfaces (share cards) use the literal SVG
 *  files in BRAND because html-to-image cannot resolve tokens. */
export function YochiMark({ className, style, decorative = false }: { className?: string; style?: CSSProperties; decorative?: boolean }) {
    return (
        <svg
            viewBox="0 0 40 40"
            className={className}
            style={style}
            {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': BRAND.name })}
        >
            <path d="M5 4 L12 4 L21 19 L18 23 Z" fill="var(--yo-ink)" />
            <path d="M35 4 L28 4 L18 21 L22 24 Z" fill="var(--yo-ink)" />
            <path d="M18 21 L22 21 L22.5 37 L17.5 37 Z" fill="var(--yo-red)" />
        </svg>
    );
}
