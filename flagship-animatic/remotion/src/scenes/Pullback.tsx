// ACT II: THE PULLBACK (bars 76-80). The duel turns out to be one confrontation in a much larger world.
//
// A real multiplane dolly, not a digital zoom: every plane has a depth z (her plane is z = 1) and the camera
// retreats by d(t), so a plane's screen scale is 1 / (z + d). Near planes shrink fast, far planes barely move:
// that difference is the parallax that makes a physical world open up around her.
//
// Stage 1 (bars 76-77, existing art): the approved victory pose, matted, with the paper of the painting dissolving
// into the world's paper mist. The painting is cropped mid-thigh and at the left edge, so ink mist is tracked to
// those two crop lines and hides them. That holds to about half scale.
// Stage 2 (bars 78-79, NEEDS NEW ART): under a mist sweep the shot hands over to a full-figure wide plate (brief
// B01) and the camera keeps retreating to ~1/10 scale, through the world plates (brief B02).
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { PAPER, Paper, Placeholder, Slate, SUMI } from '../lib/brand';
import { clamp, easeIn, easeInOut, easeOut, k, lerp } from '../lib/motion';
import { rnd } from '../lib/ui';
import { ART, T } from '../data';

const V = T.victory;
const BASE = 1920 / ART.victory.w; // the victory pose fills the frame width at d = 0
/** Camera retreat. Slow start (it still reads as a victory portrait), then the world opens. */
export const dolly = (t: number) => {
  if (t < V.pullStart) return 0;
  if (t < V.bridge) return 1.05 * easeIn(k(t, V.pullStart, V.bridge)) ;
  return 1.05 + 8.0 * easeInOut(k(t, V.bridge, V.world));
};
/** Camera height (world px): it rises as it retreats, so the horizon drops and the far field is revealed. */
const camY = (t: number) => -260 * easeInOut(k(t, V.bridge - 0.6, V.world));

const Plane: React.FC<{ z: number; d: number; cy: number; children: React.ReactNode; opacity?: number }> = ({ z, d, cy, children, opacity = 1 }) => {
  const s = 1 / (z + d);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', opacity,
      transform: `translate(960px, 540px) scale(${s}) translate(-960px, ${-540 - cy}px)` }}>{children}</div>
  );
};

/** A procedural sumi-e ridge line, filled down to the bottom. PLACEHOLDER world (brief B02 replaces it). */
const Ridge: React.FC<{ x0: number; x1: number; y: number; amp: number; seed: number; fill: string; depth?: number }> = ({ x0, x1, y, amp, seed, fill, depth = 4000 }) => {
  const n = 60, pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = lerp(x0, x1, i / n);
    const yy = y - amp * (0.5 * Math.sin(i * 0.37 + seed) + 0.3 * Math.sin(i * 1.13 + seed * 2) + 0.2 * rnd(seed * 100 + i));
    pts.push(`${x},${yy}`);
  }
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
      <polygon points={`${x0},${y + depth} ${pts.join(' ')} ${x1},${y + depth}`} fill={fill} />
    </svg>
  );
};

/** A small pair of competitors facing off (ink silhouettes of the cast cut-outs), with a vermilion tick between. */
const DuelPair: React.FC<{ x: number; y: number; h: number; a: string; b: string }> = ({ x, y, h, a, b }) => (
  <>
    <Img src={staticFile(`cast/${a}-fig.webp`)} style={{ position: 'absolute', left: x - h * 0.85, top: y - h, height: h, filter: 'brightness(0.15) saturate(0)', opacity: 0.85 }} />
    <Img src={staticFile(`cast/${b}-fig.webp`)} style={{ position: 'absolute', left: x + h * 0.1, top: y - h, height: h, filter: 'brightness(0.15) saturate(0)', opacity: 0.85 }} />
    <div style={{ position: 'absolute', left: x - h * 0.04, top: y - h * 0.62, width: h * 0.08, height: h * 0.3, background: SUMI.red, transform: 'skewX(-18deg)' }} />
  </>
);

const PAIRS: [string, string][] = [['bloodsport', 'last-legend'], ['untouchable', 'ronin'], ['deadeye', 'cold-blooded'], ['grudge-settled', 'took-the-pool'],
  ['high-roller-v2', 'final-three'], ['in-the-green', 'hundred-trials'], ['bughunter', 'starter-doomer'], ['starter-fomo-v2', 'starter-night-shift']];

const CROWD = ['bloodsport', 'deadeye', 'untouchable', 'ronin', 'final-three', 'high-roller-v2', 'cold-blooded', 'starter-doomer', 'starter-fomo-v2', 'starter-lucky-fool', 'took-the-pool', 'grudge-settled'];

export const World: React.FC<{ t: number; d: number; cy: number }> = ({ t, d, cy }) => (
  <>
    {/* sky: paper, a soft ink wash at the top */}
    <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(22,19,15,${0.10 + 0.25 * k(d, 1, 8)}) 0%, rgba(22,19,15,0) 45%)` }} />
    <Plane z={30} d={d} cy={cy}><Ridge x0={-60000} x1={62000} y={760} amp={1400} seed={1} fill="rgba(22,19,15,0.10)" depth={30000} /></Plane>
    <Plane z={14} d={d} cy={cy}>
      <Ridge x0={-30000} x1={32000} y={1080} amp={900} seed={2} fill="rgba(22,19,15,0.16)" depth={20000} />
      {PAIRS.slice(0, 4).map(([a, b], i) => <DuelPair key={i} x={-9000 + i * 6200} y={1000 - 300 * rnd(i + 3)} h={900} a={a} b={b} />)}
    </Plane>
    <Plane z={10} d={d} cy={cy} opacity={k(d, 3, 7)}>
      {Array.from({ length: 70 }, (_, i) => (
        <Img key={i} src={staticFile(`cast/${CROWD[i % CROWD.length]}-fig.webp`)} style={{ position: 'absolute', left: -9000 + (i % 35) * 560 + 200 * rnd(i), top: 1500 + Math.floor(i / 35) * 260 - 200 * rnd(i + 40), height: 420, filter: 'brightness(0.1) saturate(0)', opacity: 0.6 }} />
      ))}
    </Plane>
    <Plane z={6} d={d} cy={cy}>
      <Ridge x0={-14000} x1={16000} y={1500} amp={500} seed={5} fill="rgba(22,19,15,0.30)" depth={10000} />
      {PAIRS.slice(4).map(([a, b], i) => <DuelPair key={i} x={-6000 + i * 4300 + (i > 1 ? 1500 : 0)} y={1420 - 120 * rnd(i + 9)} h={620} a={a} b={b} />)}
    </Plane>
    {/* near competitors emerging from the mist at depth: the duel was not the only one */}
    <Plane z={2.3} d={d} cy={cy} opacity={k(d, 1.3, 3.2)}>
      <Ridge x0={-6000} x1={8000} y={1700} amp={220} seed={8} fill="rgba(22,19,15,0.55)" depth={6000} />
      <Img src={staticFile('cast/bloodsport-fig.webp')} style={{ position: 'absolute', left: -2300, top: 640, height: 1150, filter: 'brightness(0.12) saturate(0)' }} />
      <Img src={staticFile('cast/last-legend-fig.webp')} style={{ position: 'absolute', left: 3700, top: 600, height: 1200, filter: 'brightness(0.12) saturate(0)' }} />
      <Img src={staticFile('cast/untouchable-fig.webp')} style={{ position: 'absolute', left: -4200, top: 760, height: 1000, filter: 'brightness(0.12) saturate(0)' }} />
      <Img src={staticFile('cast/rampage-fig.webp')} style={{ position: 'absolute', left: 5600, top: 760, height: 1000, filter: 'brightness(0.12) saturate(0)' }} />
    </Plane>
  </>
);

/** Ink mist tracked to the painting's two crop lines (bottom, left), so they never read as edges. */
const CropMist: React.FC<{ s: number; d: number; strength: number }> = ({ s, d, strength }) => {
  const bottom = 540 + 540 * s; // the painting's bottom crop line on screen
  const left = 960 - 960 * s; // its left crop line
  const a = clamp(strength);
  return (
    <>
      <div style={{ position: 'absolute', left: -200, right: -200, top: bottom - 260 * s - 40, height: 2000,
        background: `linear-gradient(180deg, rgba(242,236,224,0) 0%, rgba(242,236,224,${0.95 * a}) ${Math.max(18, 26 - d * 4)}%, rgba(242,236,224,${a}) 40%)` }} />
      <div style={{ position: 'absolute', top: -200, bottom: -200, left: -2000, width: 2000 + left + 240 * s + 30,
        background: `linear-gradient(90deg, rgba(242,236,224,${a}) 0%, rgba(242,236,224,${a}) 82%, rgba(242,236,224,0) 100%)` }} />
    </>
  );
};

export const Pullback: React.FC<{ t: number; proto?: boolean }> = ({ t, proto }) => {
  const d = dolly(t);
  const cy = camY(t);
  const s = 1 / (1 + d);
  const stage2 = t >= V.bridge;
  const paperOut = k(t, V.pullStart - 0.2, V.pullStart + 0.5); // the painting's own paper dissolves into the world
  const sweep = clamp(1 - Math.abs(t - V.bridge) / 0.18); // a mist sweep across the hand-over
  const herY = 540 - cy * s; // her plane follows the camera rise
  return (
    <AbsoluteFill style={{ background: PAPER.bg }}>
      <Paper />
      <World t={t} d={d} cy={cy} />
      {/* her plane, z = 1 */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '960px 540px', transform: `translate(0px, ${herY - 540}px) scale(${s})` }}>
        {!stage2 && <Img src={staticFile(ART.victory.src)} style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 941 * BASE, opacity: 1 - paperOut }} />}
        <Img src={staticFile(ART.victory.matte)} style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 941 * BASE }} />
        {stage2 && (
          <>
            {/* B01 stands in here: the same pose painted full-figure, feet planted on a ledge, with ground contact */}
            <Placeholder id="B01" what="FULL-FIGURE WIDE PLATE: same victory pose, legs + feet + ledge, painted to continue the close-up" dark
              style={{ left: 200, top: 1000, width: 1100, height: 900, fontSize: 40 }} />
            <Ridge x0={-2400} x1={4400} y={1900} amp={120} seed={11} fill="rgba(22,19,15,0.5)" depth={3000} />
          </>
        )}
      </div>
      {!stage2 && <CropMist s={s} d={d} strength={k(t, V.pullStart, V.pullStart + 0.6)} />}
      <AbsoluteFill style={{ background: PAPER.bg, opacity: sweep * 0.9 }} />
      {stage2 && <Placeholder id="B02" what="WORLD PLATES (layered): far ranges, plateaus of duels, near ridge" dark style={{ right: 110, top: 70, width: 520, height: 110 }} />}
      <Slate text={stage2 ? `S14 PULLBACK stage 2 · NEW ART B01 + B02 · scale ${s.toFixed(2)}` : `S13 PULLBACK stage 1 · ADAPTABLE (victory matte + mist) · scale ${s.toFixed(2)}`} />
      {proto && <Slate text={`PROTOTYPE t=${t.toFixed(2)}  d=${d.toFixed(2)}`} />}
    </AbsoluteFill>
  );
};
