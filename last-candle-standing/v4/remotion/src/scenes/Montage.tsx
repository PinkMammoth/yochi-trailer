// V2 0:06.1-0:10.9 (drop 1). Rounds 2-6 on the beat grid, accelerating: 4, 3, 3, 2, 2 beats. Each round: ROUND n
// and the close, the faces it knocked out slam in on the downbeat, go grey and take the 敗 seal on the next beat;
// the roster strip loses pips and greys faces; the count drops. Round 3 costs YOU a life.
// V1 -> V2: no handles or OUT labels under the cards (the grey and the seal say it), the count and the pool are
// the only HUD.
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { CharacterShot, IMPACT_HOUSE, type ShotSpec } from '../../../../../yochi-2p5d/remotion/src/lib';
import { DELA, DOWN, MONO, SUMI, UP } from '../lib/brand';
import { splatter } from '../lib/brush';
import { Canvas2D, Slam, pick, useFmt, useT, type Fmt } from '../lib/frame';
import { InkField } from '../lib/InkField';
import { clamp, shakeAt, slamK } from '../lib/motion';
import { LossSeal, Medallion, PortraitFill } from '../lib/ui';
import { FPS, PLAYERS, T, byId, livesAfter, roundOutcome, sec, standingAfter } from '../data';
import { PoolHud } from './Hud';

const M = T.montage;
type Box = { x: number; y: number; w: number; h: number };
const LAYOUT: Record<Fmt, Record<number, Box[]>> = {
  '16:9': {
    1: [{ x: 720, y: 236, w: 480, h: 620 }],
    2: [{ x: 460, y: 236, w: 480, h: 620 }, { x: 980, y: 236, w: 480, h: 620 }],
    3: [{ x: 315, y: 256, w: 410, h: 560 }, { x: 755, y: 256, w: 410, h: 560 }, { x: 1195, y: 256, w: 410, h: 560 }],
  },
  '9:16': {
    1: [{ x: 230, y: 470, w: 620, h: 827 }],
    2: [{ x: 66, y: 540, w: 450, h: 600 }, { x: 564, y: 540, w: 450, h: 600 }],
    3: [{ x: 54, y: 600, w: 312, h: 416 }, { x: 384, y: 600, w: 312, h: 416 }, { x: 714, y: 600, w: 312, h: 416 }],
  },
};

export const roundStarts = (() => {
  const s: number[] = [];
  let acc = M.start;
  for (const b of M.beats) {
    s.push(acc);
    acc += b * T.beat;
  }
  return s;
})();

// V4: single knock-outs get a quick 2.5D close-up instead of the flat card: the painting alive (breath, push,
// motes), then a hard cut to its house-grey variant on the knock-out beat with a house impact (punch, shake, flash)
const TWO_FIVE_D: Record<string, string> = { 'high-roller': 'high-roller', bloodsport: 'bloodsport', 'final-three': 'final-three' };
const KnockoutShot: React.FC<{ character: string; box: { w: number; h: number }; t0: number; tg: number; t1: number }> = ({ character, box, t0, tg, t1 }) => {
  const f0 = sec(t0 - M.start), fg = sec(tg - M.start), f1 = sec(t1 - M.start);
  const scale = Math.max(box.w / 1080, box.h / 1350);
  const base: ShotSpec = {
    character, format: '4:5', fps: FPS, durationInFrames: Math.max(1, fg - f0),
    camera: { push: [1.06, 1.16], truck: [-12, 0], toTarget: 0.6 }, ambient: { breath: 0.008, sway: 0.35 }, atmosphere: { dust: 60, ink: 12, bokeh: 3 },
  };
  const grey: ShotSpec = {
    ...base, variant: 'grey', durationInFrames: Math.max(1, f1 - fg), camera: { ...base.camera, push: [1.16, 1.2], offset: fg - f0 },
    impact: { frame: 0, ...IMPACT_HOUSE, shake: 8, punch: 0.07, flash: 0.45, anticipation: 1 },
  };
  const wrap = (spec: ShotSpec) => (
    <div style={{ position: 'absolute', left: (box.w - 1080 * scale) / 2, top: (box.h - 1350 * scale) / 2, width: 1080, height: 1350, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
      <CharacterShot spec={spec} />
    </div>
  );
  return (
    <>
      <Sequence from={f0} durationInFrames={Math.max(1, fg - f0)} layout="none">{wrap(base)}</Sequence>
      <Sequence from={fg} durationInFrames={Math.max(1, f1 - fg)} layout="none">{wrap(grey)}</Sequence>
    </>
  );
};

export const Montage: React.FC = () => {
  const t = useT(M.start);
  const { fmt, land, W, H, safe } = useFmt();
  let k = 0;
  while (k < roundStarts.length - 1 && t >= roundStarts[k + 1] - 1e-6) k++;
  const n = M.rounds[k];
  const t0 = roundStarts[k];
  const t1 = k < roundStarts.length - 1 ? roundStarts[k + 1] : M.end;
  const { out, hurt, close } = roundOutcome(n);
  const tGrey = t0 + M.grey;
  const boxes = LAYOUT[fmt][out.length];
  const shake = shakeAt(t, [
    { t: t0, px: 5, dur: 0.25 },
    { t: tGrey, px: out.length >= 3 ? 14 : 10, dur: 0.42 },
  ]);
  const before = standingAfter(n - 1);
  const after = standingAfter(n);
  const youHurt = hurt.includes('perma-bull');
  const strip = pick(fmt, { y: 948, d: 64, gap: 82 }, { y: 1610, d: 84, gap: 98 });
  const A = pick(fmt, { y: safe.y + 6, size: 96 }, { y: safe.y + 14, size: 116 });
  const B = pick(fmt, { y: safe.y + 118, size: 60 }, { y: safe.y + 156, size: 76 });
  // V4: the count pops when it drops (hardest on round 4's triple knock-out)
  const countPop = t >= tGrey ? Math.exp(-(t - tGrey) * 7) * Math.min(1, (t - tGrey) * 30) : 0;
  // V4: the elimination: the whole frame desaturates for a beat
  const desat = t >= tGrey ? 0.9 * Math.exp(-(t - tGrey) * 6) : 0;
  const count = (
    <div style={{ whiteSpace: 'nowrap' }}>
      <span style={{ fontFamily: DELA, fontSize: land ? 88 : 76, color: SUMI.ink, display: 'inline-block', transform: `scale(${1 + (before - after >= 3 ? 0.7 : 0.4) * countPop})`, transformOrigin: '50% 70%' }}>{t >= tGrey ? after : before}</span>
      <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: land ? 40 : 40, color: SUMI.muted }}> / 10 LEFT</span>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.r}deg)`, filter: desat > 0.02 ? `grayscale(${desat})` : undefined }}>
        <InkField W={W} H={H} t={t} flood={1} swirl={1.4} light={0.35} lightAt={[0.5, 0.45]} lightR={0.5}
          lightCol={close === 'UP' ? [0.08, 0.22, 0.13] : [0.24, 0.07, 0.1]} />
        {out.map((id, j) => {
          const b = boxes[j];
          const p = byId(id);
          const s0 = t0 + j * 0.05;
          const sk = slamK(t, s0, 1.3, 0.14);
          if (sk.a <= 0) return null;
          const tg = tGrey + j * 0.04;
          const g = clamp((t - tg) / 0.08);
          const hot = t >= tg ? Math.exp(-(t - tg) * 14) : 0;
          const drift = (t - s0) * 18;
          // V4: a punch on the knock-out and a slow float on each card
          const punch = t >= tg ? 0.06 * Math.exp(-(t - tg) * 9) : 0;
          const float = Math.sin(t * 1.6 + j * 2.1) * 6;
          const live = TWO_FIVE_D[id];
          return (
            <div key={id} style={{ position: 'absolute', left: b.x, top: b.y + float, width: b.w, height: b.h, transform: `scale(${sk.s + punch})` }}>
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', boxShadow: `0 0 0 4px ${g > 0.5 ? SUMI.out : SUMI.ink}, 0 24px 60px rgba(0,0,0,0.6)`, background: '#f2ece0' }}>
                {live ? (
                  <KnockoutShot character={live} box={b} t0={s0} tg={tg} t1={t1} />
                ) : (
                  <PortraitFill p={p} w={b.w} h={b.h} src="card" grey={g} zoom={1.02 + drift / b.w} dy={b.h * 0.12} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: '#fff8ea', opacity: hot * 0.85 }} />
              </div>
              <div style={{ position: 'absolute', right: -16, bottom: -18 }}>
                <LossSeal size={Math.round(Math.min(150, b.w * 0.34))} t={t} t0={tg - 0.04} />
              </div>
            </div>
          );
        })}
        <Canvas2D draw={(ctx) => out.forEach((id, j) => {
          const b = boxes[j];
          const p = clamp((t - (tGrey + j * 0.04)) / 0.22);
          splatter(ctx, b.x + b.w * 0.5, b.y + b.h * 0.6, Math.max(b.w, b.h) * 0.75, p, 'rgba(143,134,118,0.55)', 77 + n * 10 + j, 46);
        })} />
        {PLAYERS.map((p, i) => {
          const wasOut = livesAfter(p.id, n - 1) === 0;
          const goesOut = out.includes(p.id);
          const lost = goesOut || hurt.includes(p.id);
          const gk = wasOut ? 1 : goesOut ? clamp((t - tGrey) / 0.1) : 0;
          return (
            <Medallion key={p.id} p={p} x={W / 2 + (i - 4.5) * strip.gap} y={strip.y} d={strip.d} t={t} labelSize={0}
              s={{ grey: gk, lives: livesAfter(p.id, n), lostAt: lost ? tGrey + 0.02 : undefined, hideHandle: true, flash: lost && t >= tGrey ? 0.7 * Math.exp(-(t - tGrey) * 10) : 0 }} />
          );
        })}
        {youHurt && t >= tGrey + 0.04 && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: land ? strip.y - 86 : strip.y - 160, textAlign: 'center', fontFamily: MONO, fontWeight: 800, fontSize: land ? 46 : 50, letterSpacing: '0.12em', paddingLeft: '0.12em', color: SUMI.red, transform: `scale(${slamK(t, tGrey + 0.04, 1.3).s})` }}>
            YOU: LAST LIFE
          </div>
        )}
      </div>
      <Slam t={t} t0={t0} t1={t1 - 0.02} y={A.y} size={A.size} align={land ? 'left' : 'center'}>ROUND {n}</Slam>
      <Slam t={t} t0={t0 + 0.05} t1={t1 - 0.02} y={B.y} size={B.size} align={land ? 'left' : 'center'} color={close === 'UP' ? UP : DOWN}>
        {close === 'UP' ? '▲ UP' : '▼ DOWN'}
      </Slam>
      <div style={land ? { position: 'absolute', right: safe.x, top: safe.y + 64, textAlign: 'right' } : { position: 'absolute', left: 0, right: 0, top: strip.y - 140 + (youHurt && t >= tGrey ? -116 : 0), textAlign: 'center' }}>
        {count}
      </div>
      <PoolHud t={t} t0={-1} />
    </AbsoluteFill>
  );
};
