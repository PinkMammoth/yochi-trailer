// 0:00-0:06 and 0:10-0:11. The ring: ten players around the dark ground the ink leaves behind.
//   open    paper, ink drops land and swirl until the frame is sumi; the ten faces surface; 10 PLAYERS, 2 LIVES EACH
//   round 1 the chart lights the ring; picks lock; the candle closes UP; the four who went DOWN lose a life; nobody out
//   reset   (after the montage) eight grey faces, two lit: 2 LEFT, ONE LIFE EACH
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { DELA, MONO, SUMI, UP } from '../lib/brand';
import { Candles, liveCandle, series } from '../lib/Candles';
import { InkField, type Drop } from '../lib/InkField';
import { H, SAFE, Slam, W, useT } from '../lib/frame';
import { clamp, easeOut, lerp, shakeAt, smooth } from '../lib/motion';
import { Medallion, type MedallionState } from '../lib/ui';
import { PLAYERS, T, livesAfter, outRound, pickIn } from '../data';

export const RING = { cx: 540, cy: 1030, rx: 380, ry: 540, d: 190 };
export const ringPos = (i: number, ring = RING) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / PLAYERS.length;
  return { x: ring.cx + ring.rx * Math.cos(a), y: ring.cy + ring.ry * Math.sin(a) };
};

// the opening drops: the first lands before frame 0, so the first frame already carries a bold splash
const DROPS: Drop[] = [
  { x: 0.5, y: 0.52, t0: -0.3, r: 0.42 },
  { x: 0.2, y: 0.26, t0: 0.1, r: 0.36 },
  { x: 0.82, y: 0.74, t0: 0.18, r: 0.4 },
  { x: 0.78, y: 0.2, t0: 0.3, r: 0.36 },
  { x: 0.22, y: 0.84, t0: 0.36, r: 0.4 },
  { x: 0.5, y: 0.02, t0: 0.46, r: 0.34 },
];

// round 1's chart: a fictional HYPE minute series, the live candle closes UP
const HIST = series(7, 91, 41.82, 0.03);
const O = HIST[HIST.length - 1].c;
const R1 = T.round1;
const px1 = (u: number) => O + 0.014 * Math.sin(u * 11) - 0.006 + 0.03 * smooth((u - 0.55) / 0.45) + 0.004 * Math.sin(u * 37);
const lo = Math.min(...HIST.map((k) => k.l), O - 0.03) - 0.01;
const hi = Math.max(...HIST.map((k) => k.h), O + 0.04) + 0.01;

export const Ring: React.FC<{ mode: 'open' | 'reset'; start: number }> = ({ mode, start }) => {
  const t = useT(start);
  const reset = mode === 'reset';
  const O1 = T.open;
  // camera: a slow push across the whole opening, kicks on the hits
  const zoom = reset ? lerp(1.0, 1.05, easeOut((t - T.reset.start) / 0.8)) : 1 + 0.035 * smooth(t / 6);
  const sh = shakeAt(t, reset ? [] : [
    { t: O1.headline, px: 5, dur: 0.3 },
    { t: R1.callout, px: 5, dur: 0.3 },
    { t: R1.close, px: 6, dur: 0.38 },
  ]);
  const chartOn = reset ? 0 : smooth((t - R1.chart[0]) / (R1.chart[1] - R1.chart[0])) * (1 - smooth((t - 5.75) / 0.25));
  const closed = t >= R1.close;
  const flashUp = closed ? Math.exp(-(t - R1.close) * 5) : 0;
  const flood = reset ? 1 : smooth((t - 0.65) / 0.45);

  const state = (i: number): MedallionState => {
    const p = PLAYERS[i];
    if (reset) {
      const out = outRound(p.id) !== null && outRound(p.id)! <= 6;
      return { grey: out ? 1 : 0, lives: livesAfter(p.id, 6), outAt: out ? -10 : undefined, reveal: 1 };
    }
    const reveal = clamp((t - (O1.faces[0] + i * 0.075)) / 0.32);
    const wrong = pickIn(p.id, 1) !== 'UP';
    const order = PLAYERS.filter((q, j) => j < i && pickIn(q.id, 1) !== 'UP').length;
    const lostAt = wrong ? R1.lose + order * 0.08 : undefined;
    const pickVisible = t < 5.7;
    return {
      grey: 0,
      lives: livesAfter(p.id, 1),
      lostAt,
      pick: pickVisible ? pickIn(p.id, 1) : undefined,
      pickAt: R1.picks[0] + i * 0.045,
      lockAt: p.you ? R1.lock - 0.07 : undefined,
      reveal,
      flash: lostAt !== undefined && t >= lostAt ? 0.75 * Math.exp(-(t - lostAt) * 9) : 0,
      hideLabels: t < O1.lives,
    };
  };

  // the countdown inside the minute
  const ticks = [R1.ticks[0], R1.ticks[0] + 0.267, R1.ticks[0] + 0.533];
  const left = ticks.filter((x) => t >= x).length;
  const u = clamp(0.3 + 0.7 * ((t - (R1.chart[1] - 0.1)) / (R1.close - (R1.chart[1] - 0.1))), 0.3, 1);
  const live = liveCandle(O, px1, u);

  const CH = { x: 300, y: 730, w: 480, h: 520 };
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(${zoom})`, transformOrigin: `${W / 2}px ${RING.cy}px` }}>
        <InkField W={W} H={H} t={t} drops={reset ? [] : DROPS} flood={flood} swirl={1}
          light={reset ? 0.25 : 0.55 * chartOn + 0.5 * flashUp} lightAt={[0.5, RING.cy / H]} lightR={0.42}
          lightCol={flashUp > 0.05 ? [0.12, 0.3, 0.18] : [0.16, 0.14, 0.11]} />
        {/* the chart, lighting the ring */}
        {chartOn > 0 && (
          <div style={{ position: 'absolute', left: CH.x, top: CH.y, width: CH.w, height: CH.h, opacity: chartOn, transform: `translateY(${(1 - chartOn) * 60}px)` }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: -60, textAlign: 'center', fontFamily: DELA, fontSize: 40, color: SUMI.ink }}>
              HYPE <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 34 }}>{live.c.toFixed(2)}</span>
            </div>
            <Candles w={CH.w} h={CH.h} data={HIST} live={live} strike={O} lo={lo} hi={hi} bodyW={40} gap={20} strikeLabel={false} fade={0.55} liveGlow={closed ? 0 : 0.35} />
            {!closed && t >= R1.ticks[0] && (
              <div style={{ position: 'absolute', left: 0, right: 0, top: CH.h + 18, textAlign: 'center', fontFamily: MONO, fontWeight: 800, fontSize: 36, letterSpacing: '0.16em', paddingLeft: '0.16em', color: SUMI.ink }}>
                CLOSES IN 0:0{Math.max(1, 3 - left + 1)}
              </div>
            )}
            {closed && (
              <Slam t={t} t0={R1.close} y={CH.h + 8} size={60} color={UP}>
                ▲ UP
              </Slam>
            )}
          </div>
        )}
        {PLAYERS.map((p, i) => {
          const { x, y } = ringPos(i);
          return <Medallion key={p.id} p={p} x={x} y={y} d={RING.d} s={state(i)} t={t} />;
        })}
      </div>
      {/* type sits outside the camera, inside title-safe, over the ground (never across a face) */}
      {!reset && (
        <>
          <Slam t={t} t0={O1.headline} t1={R1.start - 0.06} y={SAFE.y + 14} size={116}>10 PLAYERS</Slam>
          <Slam t={t} t0={O1.lives} t1={R1.start - 0.06} y={SAFE.y + 158} size={64} font="mono">2 LIVES EACH</Slam>
          <Slam t={t} t0={R1.callout} t1={R1.caption - 0.08} y={SAFE.y + 14} size={116}>ROUND 1</Slam>
          <Slam t={t} t0={R1.picks[0]} t1={R1.close - 0.04} y={SAFE.y + 158} size={56} font="mono" from={1.15}>PICKS LOCKED</Slam>
          <Slam t={t} t0={R1.caption} y={SAFE.y + 14} size={100}>4 LOSE A LIFE</Slam>
          <Slam t={t} t0={R1.caption + 0.25} y={SAFE.y + 158} size={64} font="mono" from={1.15}>NOBODY’S OUT</Slam>
        </>
      )}
      {reset && (
        <>
          <Slam t={t} t0={T.reset.start + 0.08} y={SAFE.y + 14} size={116}>2 LEFT</Slam>
          <Slam t={t} t0={T.reset.start + 0.3} y={SAFE.y + 158} size={64} font="mono" from={1.15}>ONE LIFE EACH</Slam>
        </>
      )}
    </AbsoluteFill>
  );
};
