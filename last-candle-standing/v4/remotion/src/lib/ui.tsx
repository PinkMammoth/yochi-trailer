// The film's UI pieces, rebuilt from the app's Battle Royale screens (asset-pack/sumi/reference/screens/real-br-*.png)
// at full resolution: round face medallions, 命 life pips, pick chips, the painted card flash.
import React from 'react';
import { Img, staticFile } from 'remotion';
import { DELA, DOWN, MONO, SUMI, UP, YUJI } from './brand';
import { clamp, easeOut, lerp, stampK } from './motion';
import type { Dir, Player } from '../data';

/** House grey for a loss (film-flagship lib/cast.js `grey`): grayscale, contrast 0.72, brightness 1.1, 35% out-grey atop. */
export const GREY_FILTER = (k: number) => (k <= 0 ? undefined : `grayscale(${k}) contrast(${lerp(1, 0.72, k)}) brightness(${lerp(1, 1.1, k)})`);

/** A painting inside a window, positioned by its face crop (fractions of the painting width). */
export const PortraitFill: React.FC<{ p: Player; w: number; h: number; zoom?: number; grey?: number; dx?: number; dy?: number; src?: 'portrait' | 'card' }> = ({
  p, w, h, zoom = 1, grey = 0, dx = 0, dy = 0, src = 'portrait',
}) => {
  // painting width so the crop square fills the window's width
  const pw = (w / p.crop.size) * zoom;
  const cx = (p.crop.x + p.crop.size / 2) * pw;
  const cy = (p.crop.y + p.crop.size / 2) * pw;
  const card = src === 'card';
  // card files carry the frame: the painting rect is (72,150)-(1464,1978) of 1536x2048
  const imgW = card ? (pw * 1536) / 1392 : pw;
  const offX = card ? (pw * 72) / 1392 : 0;
  const offY = card ? (pw * 150) / 1392 : 0;
  // keep the painting covering the window (never show the card frame or past the painting's edge)
  const ph = (pw * 1828) / 1392;
  const left = clamp(w / 2 - cx + dx, w - pw, 0);
  // card art: skip the top few % of the painting, where the frame's ornament overhangs it
  const top = clamp(h / 2 - cy + dy, h - ph, card ? -pw * 0.055 : 0);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Img
        src={staticFile(`${card ? 'cards' : 'portraits'}/${card ? p.card : p.portrait}`)}
        style={{ position: 'absolute', width: imgW, left: left - offX, top: top - offY, filter: GREY_FILTER(grey) }}
      />
      {grey > 0 && <div style={{ position: 'absolute', inset: 0, background: SUMI.out, opacity: 0.35 * grey }} />}
    </div>
  );
};

/** One 命 life pip: alive (cream, or vermilion for YOU) or spent (grey outline). `lost` animates the loss. */
export const Pip: React.FC<{ size: number; alive: boolean; you?: boolean; lostAt?: number; t: number }> = ({ size, alive, you, lostAt, t }) => {
  // the loss: a pop, a drop and a fade to the empty outline
  const since = lostAt === undefined ? -1 : t - lostAt;
  const losing = since >= 0 && since < 0.45;
  const isAlive = alive && !(since >= 0);
  const pop = losing ? Math.sin(clamp(since / 0.12) * Math.PI) * 0.35 : 0;
  const drop = losing ? easeOut(since / 0.45) * size * 0.6 : 0;
  const ghostA = losing ? 1 - clamp((since - 0.1) / 0.35) : 0;
  const fill = you ? SUMI.red : SUMI.ink;
  const box = (filled: boolean, extra: React.CSSProperties = {}) => (
    <div
      style={{
        position: 'absolute', inset: 0, borderRadius: size * 0.14,
        background: filled ? fill : 'transparent',
        border: filled ? 'none' : `${Math.max(2, size * 0.07)}px solid ${SUMI.out}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: YUJI, fontSize: size * 0.66, lineHeight: 1, color: filled ? SUMI.onRed : SUMI.out,
        ...extra,
      }}
    >
      命
    </div>
  );
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {isAlive ? box(true) : box(false, { opacity: 0.8 })}
      {losing && box(true, { transform: `translateY(${drop}px) scale(${1 + pop}) rotate(${since * 60}deg)`, opacity: ghostA })}
    </div>
  );
};

export const Pips: React.FC<{ lives: number; max?: number; size: number; you?: boolean; lostAt?: number; t: number; gap?: number }> = ({
  lives, max = 2, size, you, lostAt, t, gap,
}) => {
  // lives = lives AFTER the pending loss; lostAt animates pip index `lives` going out
  const g = gap ?? size * 0.22;
  return (
    <div style={{ display: 'flex', gap: g }}>
      {Array.from({ length: max }, (_, i) => (
        <Pip key={i} size={size} you={you} t={t} alive={i < lives || (lostAt !== undefined && i === lives && t < lostAt)} lostAt={i === lives ? lostAt : undefined} />
      ))}
    </div>
  );
};

/** ▲ UP / ▼ DOWN chip, as on the app's pick buttons; YOU's carries the 決 lock seal. */
export const PickChip: React.FC<{ dir: Dir; size: number; you?: boolean; t: number; t0: number; lockAt?: number; wrongAt?: number }> = ({ dir, size, you, t, t0, lockAt, wrongAt }) => {
  if (t < t0) return null;
  const p = clamp((t - t0) / 0.14);
  const s = lerp(1.4, 1, easeOut(p));
  const wrong = wrongAt !== undefined && t >= wrongAt;
  const col = wrong ? SUMI.out : dir === 'UP' ? UP : DOWN;
  const st = lockAt !== undefined ? stampK(t, lockAt) : null;
  return (
    <div style={{ position: 'relative', transform: `scale(${s})`, opacity: p * (wrong ? 0.75 : 1) }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: size * 0.28, padding: `${size * 0.22}px ${size * 0.42}px`,
          background: SUMI.surface2, border: `${Math.max(2, size * 0.06)}px solid ${you ? SUMI.red : 'rgba(239,231,216,0.18)'}`, borderRadius: size * 0.16,
          fontFamily: DELA, fontSize: size, lineHeight: 1, color: col, whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: size * 0.78 }}>{dir === 'UP' ? '▲' : '▼'}</span>
        <span style={{ color: wrong ? SUMI.out : SUMI.ink, textDecoration: wrong ? 'line-through' : undefined }}>{dir}</span>
      </div>
      {st && st.a > 0 && (
        <div
          style={{
            position: 'absolute', right: -size * 0.75, top: -size * 0.8, width: size * 1.3, height: size * 1.3, borderRadius: size * 0.12,
            background: SUMI.red, color: SUMI.onRed, fontFamily: YUJI, fontSize: size * 0.95, lineHeight: `${size * 1.3}px`, textAlign: 'center',
            transform: `scale(${st.s}) rotate(${st.r}deg)`, opacity: st.a,
          }}
        >
          決
        </div>
      )}
    </div>
  );
};

/** The grey 敗 seal (a loss): outlined in out-grey, stamping down. */
export const LossSeal: React.FC<{ size: number; t: number; t0: number; ground?: 'sumi' | 'paper' }> = ({ size, t, t0 }) => {
  const st = stampK(t, t0, -8);
  if (st.a <= 0) return null;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: size * 0.1, border: `${size * 0.07}px solid ${SUMI.out}`, background: 'rgba(15,13,11,0.82)',
        color: SUMI.out, fontFamily: YUJI, fontSize: size * 0.66, lineHeight: `${size * 0.86}px`, textAlign: 'center',
        transform: `scale(${st.s}) rotate(${st.r}deg)`, opacity: st.a,
      }}
    >
      敗
    </div>
  );
};

export interface MedallionState {
  grey: number;          // 0..1
  lives: number;         // after any pending loss
  lostAt?: number;       // time the pending life is lost
  pick?: Dir;
  pickAt?: number;
  lockAt?: number;
  outAt?: number;        // 敗 seal stamp time
  reveal?: number;       // 0..1 entrance
  flash?: number;        // 0..1 white-hot flash on the hit
  hideLabels?: boolean;
  hideHandle?: boolean;
  /** V4: ambient life (0 = still): the medallion floats and its painting breathes inside the circle */
  life?: number;
  /** V4: a scale pop (0..1) on a hit */
  pop?: number;
  wrongAt?: number;
  chip?: number;
  chipLeft?: boolean;
}

/** A player in the ring: round face crop, handle, life pips, pick chip. Centre at (x, y). */
export const Medallion: React.FC<{ p: Player; x: number; y: number; d: number; s: MedallionState; t: number; labelSize?: number }> = ({ p, x, y, d, s, t, labelSize = 25 }) => {
  const rv = s.reveal ?? 1;
  if (rv <= 0) return null;
  const scale = lerp(0.6, 1, easeOut(rv));
  const ring = p.you ? SUMI.red : s.grey > 0.5 ? 'rgba(143,134,118,0.5)' : 'rgba(239,231,216,0.35)';
  const pip = Math.round(d * 0.19);
  // V4 ambient life: a slow float of the whole medallion and a slow breathing drift of the painting inside its
  // circle (rigid: the painting only moves and scales, it never deforms). Out players are still.
  const life = (s.life ?? 1) * (s.grey > 0.5 ? 0 : 1);
  const ph = [...p.id].reduce((a, c) => a + c.charCodeAt(0), 0) * 0.37;
  const bob = life * d * 0.022 * Math.sin(t * 1.25 + ph);
  const inZoom = 1.04 + life * 0.025 * (0.5 + 0.5 * Math.sin(t * 0.9 + ph * 1.7));
  const inDx = life * d * 0.03 * Math.sin(t * 0.55 + ph);
  const inDy = life * d * 0.02 * Math.cos(t * 0.47 + ph * 0.6);
  const pop = 1 + 0.14 * (s.pop ?? 0);
  return (
    <div style={{ position: 'absolute', left: x - d / 2, top: y - d / 2 + bob, width: d, height: d, transform: `scale(${scale * pop})`, opacity: clamp(rv * 1.6) }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', background: '#f2ece0', boxShadow: `0 0 0 ${p.you ? 6 : 3}px ${ring}, 0 12px 30px rgba(0,0,0,0.55)` }}>
        <PortraitFill p={p} w={d} h={d} grey={s.grey} zoom={inZoom} dx={inDx} dy={inDy} />
        {(s.flash ?? 0) > 0 && <div style={{ position: 'absolute', inset: 0, background: '#fff8ea', opacity: s.flash }} />}
      </div>
      {!s.hideLabels && (
        <div style={{ position: 'absolute', top: d + 10, left: -60, right: -60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {!(s.hideHandle && !p.you) && <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: labelSize, color: p.you ? SUMI.red : s.grey > 0.5 ? SUMI.out : SUMI.ink, letterSpacing: p.you ? '0.2em' : '0.02em', textDecoration: s.grey > 0.5 && !p.you ? 'line-through' : undefined }}>
            {p.you ? 'YOU' : p.handle}
          </div>}
          <Pips lives={s.lives} size={pip} you={p.you} lostAt={s.lostAt} t={t} />
        </div>
      )}
      {s.pick && s.pickAt !== undefined && (
        <div style={{ position: 'absolute', ...(s.chipLeft ? { right: d * 0.58 } : { left: d * 0.58 }), top: -d * 0.12 }}>
          <PickChip dir={s.pick} size={Math.round(d * (s.chip ?? 0.15))} you={p.you} t={t} t0={s.pickAt} lockAt={s.lockAt} wrongAt={s.wrongAt} />
        </div>
      )}
      {s.outAt !== undefined && (
        <div style={{ position: 'absolute', right: -d * 0.12, bottom: -d * 0.06 }}>
          <LossSeal size={Math.round(d * 0.36)} t={t} t0={s.outAt} />
        </div>
      )}
    </div>
  );
};
