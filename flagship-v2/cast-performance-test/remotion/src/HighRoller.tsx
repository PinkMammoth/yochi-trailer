// HIGH ROLLER, the win: the pose already sells it (open-mouthed laugh, the throw, the chip held up). What moves:
//  - the six chips she painted in the air are their own sprites (tools/prep.py; original pixels). They burst out of her
//    open hand, decelerate into a slow-motion hang at exactly where she painted them (the painting's frozen instant),
//    then the speed ramps back to real time and they drop, tumbling. Spin is a flip (scaleY by cos) plus rotation:
//    rigid moves of props, never the figure.
//  - her body: rigid, whole-figure laugh accents (a 0.8% lift and settle about her heels, three times), a slow sway.
//  - the camera: low and wide, pushing up toward her face and the chip.
// She stands on the UP side of the approved arena (the left terraces), on the same paved landing as Last Legend.
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Grade } from '../../../../yochi-2p5d/remotion/src/lib';
import { useFonts } from '../../../film/remotion/src/lib/brand';
import { clamp, easeOut, mulberry } from '../../../film/remotion/src/lib/motion';
import { ArenaWorld, camAt, Motes, WinAmount } from './common';
import chipsMeta from '../../assets/derived/layers/hr-chips.json';
import { FPS, HRCut } from './timing';

const PW = 1122, PH = 1402;
const S0 = 0.68, OX = 860 - 520 * S0, OY = 1030 - 1385 * S0; // her heels (painting y 1385) on stage y 1030
const ANCHOR: [number, number] = [560, 1385];
const PALM: [number, number] = [172, 218];                     // her open hand, where the chips leave from

function chipState(i: number, t: number, cut: HRCut) {
  const c = chipsMeta.chips[i];
  const r = mulberry(100 + i);
  const delay = r() * 0.05, spin0 = r() * 6.28, spinW = 5 + r() * 6, rot0 = (r() - 0.5) * 40, rotW = (r() - 0.5) * 90;
  const P: [number, number] = [c.cx, c.cy];
  const v: [number, number] = [P[0] - PALM[0], P[1] - PALM[1]];
  const L = Math.hypot(v[0], v[1]); const u: [number, number] = [v[0] / L, v[1] / L];
  const ts = t - cut.toss - delay;
  if (ts < 0) return null;
  // phase 1: out of the hand to the painted position, decelerating (real time -> slow motion)
  const T1 = cut.hang - cut.toss;
  let x: number, y: number, clock: number;
  if (ts < T1) {
    const e = easeOut(ts / T1); x = PALM[0] + v[0] * e; y = PALM[1] + v[1] * e; clock = ts;
  } else {
    // phase 2: the hang, drifting on at ~3% speed; phase 3: the ramp back to real time and the fall
    const th = ts - T1, drift = 14;
    x = P[0] + u[0] * drift * th; y = P[1] + u[1] * drift * th - 6 * th;
    clock = T1 + th * 0.12;
    const tf = t - cut.fall - delay * 2;
    if (tf > 0) { const g = 2600; x += u[0] * 120 * tf + (r() - 0.5) * 60 * tf; y += -180 * tf + 0.5 * g * tf * tf; clock += tf * 1.6 + tf * tf * 2; }
  }
  const spin = Math.cos(spin0 + spinW * clock);
  return { x, y, sy: Math.sign(spin || 1) * Math.max(0.18, Math.abs(spin)), rot: rot0 + rotW * clock, c, a: clamp(ts / 0.04) };
}

export const HighRollerShot: React.FC<{ cut: HRCut; type?: boolean; diag?: boolean }> = ({ cut, type = true, diag = false }) => {
  useFonts();
  const t = useCurrentFrame() / FPS;
  const cam = camAt(cut.cams, t);
  // laugh accents: a quick lift and settle about the heels, each decaying
  let lift = 0;
  for (const l of cut.laughs) { const d = t - l; if (d > 0) lift += Math.sin(Math.min(d / 0.32, 1) * Math.PI) * Math.exp(-d * 2.5); }
  const s = 1 + 0.008 * lift + 0.003 * Math.sin(t * 1.4);
  const sway = 0.35 * Math.sin(t * 0.9 + 0.4);
  const figTf = `translate(${OX}px, ${OY}px) scale(${S0}) translate(${ANCHOR[0]}px, ${ANCHOR[1]}px) rotate(${sway}deg) scale(${s}) translate(${-ANCHOR[0]}px, ${-ANCHOR[1]}px)`;
  return (
    <AbsoluteFill style={{ background: '#d9cfbd', overflow: 'hidden' }}>
      <ArenaWorld cam={cam} side="up" grey={0.1}>
        <div style={{ position: 'absolute', left: OX + 140 * S0, top: OY + 1340 * S0, width: 900 * S0, height: 90 * S0, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(22,19,15,0.5), rgba(22,19,15,0))', mixBlendMode: 'multiply' }} />
        <Img src={staticFile('cp/hr-fig.png')} style={{ position: 'absolute', left: 0, top: 0, width: PW, height: PH, transformOrigin: '0 0', transform: figTf }} />
        {/* the chips, in her painting's coordinates but outside her body's motion */}
        <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${OX}px, ${OY}px) scale(${S0})` }}>
          {chipsMeta.chips.map((c, i) => {
            const k = chipState(i, t, cut);
            if (!k) return null;
            return <Img key={i} src={staticFile(`cp/hr-chip-${i}.png`)} style={{ position: 'absolute', left: k.x - (c.cx - c.x), top: k.y - (c.cy - c.y), width: c.w, height: c.h, opacity: k.a,
              transformOrigin: `${c.cx - c.x}px ${c.cy - c.y}px`, transform: `rotate(${k.rot}deg) scaleY(${k.sy})` }} />;
          })}
        </div>
      </ArenaWorld>
      <Motes t={t} n={28} seed={3} wind={-30} life={0.6} cam={cam} col="#5d5548" />
      <Grade W={1920} H={1080} vignette={0.28} grain={0.4} />
      {type && <WinAmount t={t} at={cut.amount} x={100} y={720} size={100} handle="HIGH_ROLL · 100 USDC ▲ UP" amount="+131.56" ground="arena" />}
      {diag && <div style={{ position: 'absolute', left: 16, bottom: 12, fontFamily: 'monospace', fontSize: 22, color: '#fff', background: 'rgba(0,0,0,.6)', padding: '3px 8px' }}>t {t.toFixed(3)} f {Math.round(t * FPS)} · z {cam[2].toFixed(2)}</div>}
    </AbsoluteFill>
  );
};
