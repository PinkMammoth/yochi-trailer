// 0:06-0:10. Rounds 2-6 at 0.8 s each. Each round: ROUND n and the candle's close, then the faces it knocked
// out slam in, go grey and take the 敗 seal; along the bottom the roster strip loses pips and greys faces, and the
// STILL STANDING count drops. Round 3 costs YOU a life: the strip says so in vermilion.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { DELA, DOWN, MONO, SUMI, UP } from '../lib/brand';
import { splatter } from '../lib/brush';
import { Canvas2D, H, SAFE, Slam, W, useT } from '../lib/frame';
import { InkField } from '../lib/InkField';
import { clamp, shakeAt, slamK } from '../lib/motion';
import { LossSeal, Medallion, PortraitFill } from '../lib/ui';
import { PLAYERS, T, byId, livesAfter, roundOutcome, standingAfter } from '../data';

const M = T.montage;
type Box = { x: number; y: number; w: number; h: number };
const LAYOUT: Record<number, Box[]> = {
  1: [{ x: 230, y: 470, w: 620, h: 827 }],
  2: [{ x: 66, y: 540, w: 450, h: 600 }, { x: 564, y: 540, w: 450, h: 600 }],
  3: [{ x: 54, y: 600, w: 312, h: 416 }, { x: 384, y: 600, w: 312, h: 416 }, { x: 714, y: 600, w: 312, h: 416 }],
};

export const roundStart = (k: number) => M.start + k * M.round;

export const Montage: React.FC = () => {
  const t = useT(M.start);
  const k = clamp(Math.floor((t - M.start) / M.round), 0, M.rounds.length - 1);
  const n = M.rounds[k];
  const t0 = roundStart(k);
  const u = t - t0;
  const { out, hurt, close } = roundOutcome(n);
  const tGrey = t0 + M.grey;
  const boxes = LAYOUT[out.length];
  const shake = shakeAt(t, [
    { t: t0 + M.slam, px: 5, dur: 0.25 },
    { t: tGrey, px: out.length >= 3 ? 16 : 11, dur: 0.45 },
  ]);
  const before = standingAfter(n - 1);
  const after = standingAfter(n);
  const youHurt = hurt.includes('perma-bull');
  const strip = { y: 1650, d: 84, gap: 98 };

  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.r}deg)` }}>
        <InkField W={W} H={H} t={t} flood={1} swirl={1.4} light={0.35} lightAt={[0.5, 0.45]} lightR={0.5}
          lightCol={close === 'UP' ? [0.08, 0.22, 0.13] : [0.24, 0.07, 0.1]} />
        {/* the knocked-out faces: chest-up windows on the card paintings */}
        {out.map((id, j) => {
          const b = boxes[j];
          const p = byId(id);
          const s0 = t0 + M.slam + j * 0.06;
          const sk = slamK(t, s0, 1.3, 0.14);
          if (sk.a <= 0) return null;
          const tg = tGrey + j * 0.05;
          const g = clamp((t - tg) / 0.08);
          const hot = t >= tg ? Math.exp(-(t - tg) * 14) : 0;
          const drift = (t - s0) * 18; // a slow push on each face
          return (
            <div key={id} style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, transform: `scale(${sk.s})` }}>
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', boxShadow: `0 0 0 4px ${g > 0.5 ? SUMI.out : SUMI.ink}, 0 24px 60px rgba(0,0,0,0.6)`, background: '#f2ece0' }}>
                <PortraitFill p={p} w={b.w} h={b.h} src="card" grey={g} zoom={1.02 + drift / b.w} dy={b.h * 0.12} />
                <div style={{ position: 'absolute', inset: 0, background: '#fff8ea', opacity: hot * 0.85 }} />
              </div>
              <div style={{ position: 'absolute', top: b.h + 14, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: out.length >= 3 ? 25 : 32, letterSpacing: '0.04em', color: g > 0.5 ? SUMI.out : SUMI.ink, whiteSpace: 'nowrap' }}>
                {p.handle}
                {g > 0.5 && <span style={{ letterSpacing: '0.2em', marginLeft: 12 }}>OUT</span>}
              </div>
              <div style={{ position: 'absolute', right: -16, bottom: -18 }}>
                <LossSeal size={Math.round(Math.min(150, b.w * 0.34))} t={t} t0={tg - 0.04} />
              </div>
            </div>
          );
        })}
        {/* grey ink thrown off each knock-out */}
        <Canvas2D draw={(ctx) => out.forEach((id, j) => {
          const b = boxes[j];
          const tg = tGrey + j * 0.05;
          const p = clamp((t - tg) / 0.22);
          splatter(ctx, b.x + b.w * 0.5, b.y + b.h * 0.6, Math.max(b.w, b.h) * 0.75, p, 'rgba(143,134,118,0.55)', 77 + n * 10 + j, 46);
        })} />
        {/* the roster strip */}
        <div style={{ position: 'absolute', left: SAFE.x, right: SAFE.x, top: strip.y - 150, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          {youHurt && t >= tGrey + 0.04 ? (
            <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 46, letterSpacing: '0.12em', color: SUMI.red, transform: `scale(${slamK(t, tGrey + 0.04, 1.3).s})`, transformOrigin: 'left center' }}>YOU: LAST LIFE</div>
          ) : (
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: '0.2em', color: SUMI.muted }}>STILL STANDING</div>
          )}
          <div style={{ fontFamily: DELA, fontSize: 76, color: SUMI.ink }}>
            {t >= tGrey ? after : before}
            <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, color: SUMI.muted }}> / 10</span>
          </div>
        </div>
        {PLAYERS.map((p, i) => {
          const wasOut = livesAfter(p.id, n - 1) === 0;
          const goesOut = out.includes(p.id);
          const lost = goesOut || hurt.includes(p.id);
          const gk = wasOut ? 1 : goesOut ? clamp((t - tGrey) / 0.1) : 0;
          return (
            <Medallion key={p.id} p={p} x={W / 2 + (i - 4.5) * strip.gap} y={strip.y} d={strip.d} t={t} labelSize={0}
              s={{ grey: gk, lives: livesAfter(p.id, n), lostAt: lost ? tGrey + 0.02 : undefined, flash: lost && t >= tGrey ? 0.7 * Math.exp(-(t - tGrey) * 10) : 0 }} />
          );
        })}
      </div>
      <Slam t={t} t0={t0} t1={t0 + M.round - 0.02} y={SAFE.y + 14} size={116}>ROUND {n}</Slam>
      <Slam t={t} t0={t0 + 0.07} t1={t0 + M.round - 0.02} y={SAFE.y + 156} size={76} color={close === 'UP' ? UP : DOWN}>
        {close === 'UP' ? '▲ UP' : '▼ DOWN'}
      </Slam>
    </AbsoluteFill>
  );
};
