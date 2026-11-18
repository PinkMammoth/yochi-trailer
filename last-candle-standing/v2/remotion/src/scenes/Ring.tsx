// V2 0:00-0:06 and 0:10.9-0:12.3 (music: the build, drop 1, the breakdown's first bar). The ring.
//   open    ink floods paper into sumi; ten faces surface on the build's beats; 10 PLAYERS / ONE PRIZE POOL;
//           the pool, 100 USDC, sits in the centre; life pips light
//   round 1 on the drop: ROUND 1, the chart lights the ring; ▲/▼ picks pop; PICKS LOCKED; the close; the four who
//           went DOWN lose a life (their chips grey); 4 LOSE A LIFE / NOBODY'S OUT YET
//   reset   8 grey, 2 lit: 2 LEFT / ONE LIFE EACH, and the two handles named
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { DELA, MONO, SUMI, UP } from '../lib/brand';
import { Candles, liveCandle, series } from '../lib/Candles';
import { InkField, type Drop } from '../lib/InkField';
import { Slam, pick, useFmt, useT, type Fmt } from '../lib/frame';
import { clamp, easeOut, lerp, shakeAt, slamK, smooth } from '../lib/motion';
import { Medallion, type MedallionState } from '../lib/ui';
import { PLAYERS, POT, T, livesAfter, outRound, pickIn } from '../data';
import { PoolHud } from './Hud';

type RingGeo = { cx: number; cy: number; rx: number; ry: number; d: number; a0: number };
export const RINGS: Record<Fmt, RingGeo> = {
  '16:9': { cx: 960, cy: 626, rx: 760, ry: 298, d: 140, a0: -72 },
  '9:16': { cx: 540, cy: 1030, rx: 380, ry: 540, d: 190, a0: -90 },
};
export const ringPos = (i: number, g: RingGeo) => {
  const a = ((g.a0 + (i * 360) / PLAYERS.length) * Math.PI) / 180;
  return { x: g.cx + g.rx * Math.cos(a), y: g.cy + g.ry * Math.sin(a) };
};
// ring order for 16:9 starts at -72 deg: shift the cast so YOU stays lower left and deano upper right
const ORDER: Record<Fmt, number[]> = { '16:9': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], '9:16': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] };

const DROPS: Drop[] = [
  { x: 0.5, y: 0.52, t0: -0.3, r: 0.42 },
  { x: 0.2, y: 0.26, t0: 0.1, r: 0.36 },
  { x: 0.82, y: 0.74, t0: 0.18, r: 0.4 },
  { x: 0.78, y: 0.2, t0: 0.3, r: 0.36 },
  { x: 0.22, y: 0.84, t0: 0.36, r: 0.4 },
  { x: 0.5, y: 0.02, t0: 0.46, r: 0.34 },
];

const HIST = series(7, 91, 41.82, 0.03);
const O = HIST[HIST.length - 1].c;
const R1 = T.round1;
const OP = T.open;
const px1 = (u: number) => O + 0.014 * Math.sin(u * 11) - 0.006 + 0.03 * smooth((u - 0.55) / 0.45) + 0.004 * Math.sin(u * 37);
const lo = Math.min(...HIST.map((k) => k.l), O - 0.03) - 0.01;
const hi = Math.max(...HIST.map((k) => k.h), O + 0.04) + 0.01;

export const Ring: React.FC<{ mode: 'open' | 'reset'; start: number }> = ({ mode, start }) => {
  const t = useT(start);
  const { fmt, land, W, H, safe } = useFmt();
  const g = RINGS[fmt];
  const reset = mode === 'reset';
  const zoom = reset ? lerp(1.0, 1.04, easeOut((t - T.reset.start) / 1.2)) : 1 + 0.03 * smooth(t / 6);
  const sh = shakeAt(t, reset ? [{ t: T.reset.start, px: 5, dur: 0.3 }] : [
    { t: OP.players, px: 4, dur: 0.25 },
    { t: R1.start, px: 7, dur: 0.38 },
    { t: R1.close, px: 6, dur: 0.38 },
  ]);
  const chartOn = reset ? 0 : smooth((t - R1.chart[0]) / (R1.chart[1] - R1.chart[0]));
  const closed = t >= R1.close;
  const flashUp = closed ? Math.exp(-(t - R1.close) * 5) : 0;
  const flood = reset ? 1 : smooth((t - 0.6) / 0.45);

  const state = (i: number): MedallionState => {
    const p = PLAYERS[i];
    if (reset) {
      const out = outRound(p.id) !== null && outRound(p.id)! <= 6;
      return { grey: out ? 1 : 0, lives: livesAfter(p.id, 6), outAt: out ? -10 : undefined, reveal: 1, hideHandle: out, flash: !out ? 0.4 * Math.exp(-(t - T.reset.start) * 6) : 0 };
    }
    const reveal = clamp((t - (OP.faces[0] + i * 0.102)) / 0.3);
    const wrong = pickIn(p.id, 1) !== 'UP';
    const order = PLAYERS.filter((q, j) => j < i && pickIn(q.id, 1) !== 'UP').length;
    const lostAt = wrong ? R1.lose + order * 0.06 : undefined;
    return {
      grey: 0,
      lives: livesAfter(p.id, 1),
      lostAt,
      pick: t < R1.end - 0.05 ? pickIn(p.id, 1) : undefined,
      pickAt: R1.picks[0] + i * 0.05,
      lockAt: p.you ? R1.lock - 0.07 : undefined,
      wrongAt: wrong ? R1.close + 0.05 : undefined,
      chip: land ? 0.21 : 0.17,
      chipLeft: ringPos(i, g).x > g.cx + 1,
      reveal,
      flash: lostAt !== undefined && t >= lostAt ? 0.75 * Math.exp(-(t - lostAt) * 9) : 0,
      hideLabels: t < OP.lives,
      hideHandle: true,
    };
  };

  const u = clamp(0.3 + 0.7 * ((t - (R1.chart[1] - 0.1)) / (R1.close - (R1.chart[1] - 0.1))), 0.3, 1);
  const live = liveCandle(O, px1, u);
  const CH = pick(fmt, { x: 640, y: 470, w: 640, h: 300, body: 46, gap: 26 }, { x: 300, y: 730, w: 480, h: 520, body: 40, gap: 20 });
  // the pool chip in the centre of the ring (open), handing over to the HUD on the drop
  const chip = slamK(t, OP.poolChip, 1.4, 0.16);
  const chipOut = clamp((t - R1.start) / 0.2);
  const A = pick(fmt, { y: safe.y - 4, size: 92 }, { y: safe.y + 14, size: 116 });
  const B = pick(fmt, { y: safe.y + 100, size: 46 }, { y: safe.y + 158, size: 60 });
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(${zoom})`, transformOrigin: `${W / 2}px ${g.cy}px` }}>
        <InkField W={W} H={H} t={t} drops={reset ? [] : DROPS} flood={flood} swirl={1}
          light={reset ? 0.25 : 0.55 * chartOn + 0.5 * flashUp + 0.2 * chip.a * (1 - chipOut)} lightAt={[0.5, g.cy / H]} lightR={land ? 0.36 : 0.42}
          lightCol={flashUp > 0.05 ? [0.12, 0.3, 0.18] : [0.16, 0.14, 0.11]} />
        {/* the prize pool, centre stage */}
        {chip.a > 0 && chipOut < 1 && (
          <div style={{ position: 'absolute', left: g.cx - 300, width: 600, top: g.cy - (land ? 92 : 110), textAlign: 'center', opacity: 1 - chipOut, transform: `scale(${chip.s * (1 - 0.3 * chipOut)})` }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: land ? 30 : 34, letterSpacing: '0.2em', paddingLeft: '0.2em', color: SUMI.muted }}>PRIZE POOL</div>
            <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: land ? 104 : 120, lineHeight: 1.1, color: SUMI.ink }}>
              {POT}<span style={{ fontSize: land ? 44 : 50, marginLeft: 14, letterSpacing: '0.06em' }}>USDC</span>
            </div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: land ? 26 : 30, letterSpacing: '0.16em', paddingLeft: '0.16em', color: SUMI.muted }}>10 × 10 USDC IN</div>
          </div>
        )}
        {chartOn > 0 && (
          <div style={{ position: 'absolute', left: CH.x, top: CH.y, width: CH.w, height: CH.h, opacity: chartOn, transform: `translateY(${(1 - chartOn) * 50}px)` }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: -56, textAlign: 'center', fontFamily: DELA, fontSize: 38, color: SUMI.ink }}>
              HYPE <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 32 }}>{live.c.toFixed(2)}</span>
            </div>
            <Candles w={CH.w} h={CH.h} data={HIST} live={live} strike={O} lo={lo} hi={hi} bodyW={CH.body} gap={CH.gap} strikeLabel={false} fade={0.5} liveGlow={closed ? 0 : 0.35} />
            {closed && <Slam t={t} t0={R1.close} y={CH.h + 6} size={land ? 56 : 60} color={UP} cx={CH.w / 2} cw={CH.w}>▲ UP</Slam>}
          </div>
        )}
        {ORDER[fmt].map((i) => {
          const { x, y } = ringPos(i, g);
          return <Medallion key={PLAYERS[i].id} p={PLAYERS[i]} x={x} y={y} d={g.d} s={state(i)} t={t} labelSize={land ? 24 : 26} />;
        })}
      </div>
      {!reset && (
        <>
          <Slam t={t} t0={OP.players} t1={R1.start - 0.05} y={A.y} size={A.size}>10 PLAYERS</Slam>
          <Slam t={t} t0={OP.pool} t1={R1.start - 0.05} y={B.y} size={B.size} font="mono" from={1.15}>ONE PRIZE POOL</Slam>
          <Slam t={t} t0={R1.start} t1={R1.caption - 0.06} y={A.y} size={A.size}>ROUND 1</Slam>
          <Slam t={t} t0={R1.picks[0]} t1={R1.lock - 0.05} y={B.y} size={B.size} font="mono" from={1.15}>▲ UP OR ▼ DOWN?</Slam>
          <Slam t={t} t0={R1.lock} t1={R1.close - 0.05} y={B.y} size={B.size} font="mono" from={1.15}>PICKS LOCKED</Slam>
          <Slam t={t} t0={R1.caption} y={A.y} size={A.size * 0.92}>4 LOSE A LIFE</Slam>
          <Slam t={t} t0={R1.rule} y={B.y} size={B.size} font="mono" from={1.15}>NOBODY’S OUT YET</Slam>
        </>
      )}
      {reset && (
        <>
          <Slam t={t} t0={T.reset.start} y={A.y} size={A.size}>2 LEFT</Slam>
          <Slam t={t} t0={T.reset.start + 0.341} y={B.y} size={B.size} font="mono" from={1.15}>ONE LIFE EACH</Slam>
        </>
      )}
      <PoolHud t={t} t0={reset ? -1 : R1.start} />
    </AbsoluteFill>
  );
};
