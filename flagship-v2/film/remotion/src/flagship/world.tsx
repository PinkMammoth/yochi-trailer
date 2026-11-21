// THE GORGE: the flagship's world, as depth planes. PLACEHOLDER geometry (procedural ink washes and silhouettes)
// standing in for the painted plates E01-E06 (docs/ASSET_WISHLIST.md). The layout and depths are the design;
// the paintings replace the shapes one for one.
//
// Geography: Duel Master's duel happened on a lone stone spire at the head of a vast mountain gorge. Down the gorge,
// two great terraced cliffs face each other across a drop into mist: the UP terraces on the left (east, dawn-lit)
// and the DOWN terraces on the right. A Free For All round gathers on both. Further off, on lesser spires, other
// duels are being fought. A rough-hewn stone gateway stands behind the camera's start position, so the retreating
// camera passes through it.
//
// Camera model: a plane at depth z (her spire is z = 1) has screen scale (z + ref) / (z + d), where `ref` is the
// camera distance its content is drawn for. Near planes shrink fast and far ones barely move: real parallax.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { CAST, CYAN, MONO } from './tokens';
import { rnd } from './ui';

export const REF = 9;
export const ARCH_Z = -8.3; // the gateway: the camera retreats through it in the last metre of the move // the establishing shot's camera distance: the gorge planes are drawn at this framing
type Cam = { d: number; cy?: number; px?: number };

export const Plane: React.FC<{ z: number; cam: Cam; ref0?: number; children: React.ReactNode; opacity?: number; filter?: string }> = ({ z, cam, ref0 = REF, children, opacity = 1, filter }) => {
  const s = (z + ref0) / (z + cam.d);
  const cy = (cam.cy ?? 0) / (z + cam.d); // camera height shifts near planes more than far ones
  const px = (cam.px ?? 0) / (z + cam.d);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '960px 540px', opacity, filter,
      transform: `translate(${-px}px, ${-cy}px) scale(${s})` }}>{children}</div>
  );
};

const ridge = (x0: number, x1: number, y: number, amp: number, seed: number, n = 48, depth = 3000) => {
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const yy = y - amp * (0.55 * Math.sin(i * 0.41 + seed) + 0.3 * Math.sin(i * 1.27 + seed * 2.1) + 0.25 * rnd(seed * 91 + i));
    pts.push(`${x.toFixed(1)},${yy.toFixed(1)}`);
  }
  return `${x0},${y + depth} ${pts.join(' ')} ${x1},${y + depth}`;
};
const Poly: React.FC<{ pts: string; fill: string; stroke?: string }> = ({ pts, fill, stroke }) => (
  <svg width={1} height={1} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}><polygon points={pts} fill={fill} stroke={stroke} strokeWidth={stroke ? 3 : 0} /></svg>
);

const CROWD = ['bloodsport', 'deadeye', 'untouchable', 'ronin', 'final-three', 'high-roller-v2', 'cold-blooded', 'starter-doomer', 'starter-fomo-v2', 'starter-lucky-fool',
  'took-the-pool', 'grudge-settled', 'last-legend', 'in-the-green', 'hundred-trials', 'bughunter', 'starter-night-shift', 'starter-degenerate', 'starter-paper-hands',
  'starter-strategist-v3', 'starter-bagholder-v2', 'starter-contrarian', 'whale', 'insider-v2'];
/** A terrace's row of tiny players: ink silhouettes of the house cut-outs (the painted crowd plate E04 replaces them). */
const Row: React.FC<{ x0: number; x1: number; y: number; h: number; n: number; seed: number; fill: number; ink: number }> = ({ x0, x1, y, h, n, seed, fill, ink }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      if (rnd(seed * 13 + i) > fill) return null;
      const id = CROWD[Math.floor(rnd(seed * 7 + i * 3) * CROWD.length)];
      const c = CAST[id];
      const hh = h * (0.85 + 0.3 * rnd(i + seed));
      const w = (hh * c.paint[0]) / c.paint[1];
      const x = x0 + ((x1 - x0) * (i + 0.5)) / n + (rnd(i * 5 + seed) - 0.5) * 20;
      return <Img key={i} src={staticFile(`cast/${id}-fig.webp`)} style={{ position: 'absolute', left: x - w / 2, top: y - hh, height: hh, width: w, filter: `brightness(${ink}) saturate(0)` }} />;
    })}
  </>
);

/** One terraced cliff. side -1 = UP (left), +1 = DOWN (right). Drawn in REF framing. */
const Cliff: React.FC<{ side: -1 | 1; fill: number; light: number; grey: number }> = ({ side, fill, light, grey }) => {
  const X = (x: number) => (side < 0 ? x : 1920 - x);
  const face = side < 0 ? `-900,1400 -900,250 300,300 620,420 760,560 820,760 860,1400` : `2820,1400 2820,250 1620,300 1300,420 1160,560 1100,760 1060,1400`;
  const ink = 0.13 + 0.12 * light - 0.04 * grey;
  const tone = `rgba(${Math.round(40 - 18 * grey)},${Math.round(34 - 12 * grey)},${Math.round(28 - 8 * grey)},${0.8 + 0.1 * light})`;
  const terr = [{ y: 430, a: 240, b: 610, h: 38, n: 18 }, { y: 560, a: 160, b: 740, h: 52, n: 20 }, { y: 720, a: 80, b: 800, h: 74, n: 18 }];
  return (
    <div style={{ position: 'absolute', inset: 0, filter: grey ? `grayscale(${grey}) brightness(${1 - 0.35 * grey})` : undefined }}>
      <Poly pts={face} fill={tone} />
      {terr.map((r, i) => (
        <React.Fragment key={i}>
          <div style={{ position: 'absolute', left: Math.min(X(r.a), X(r.b)) - 40, top: r.y, width: Math.abs(X(r.b) - X(r.a)) + 80, height: 8, background: 'rgba(242,236,224,0.10)' }} />
          <Row x0={Math.min(X(r.a), X(r.b))} x1={Math.max(X(r.a), X(r.b))} y={r.y + 2} h={r.h} n={r.n} seed={i * 17 + (side < 0 ? 3 : 7)} fill={fill} ink={ink} />
        </React.Fragment>
      ))}
    </div>
  );
};

export type WorldProps = { cam: Cam; fill?: number; lit?: 'UP' | 'DOWN' | null; grey?: 'UP' | 'DOWN' | null; storm?: number; duels?: boolean; arch?: boolean; label?: boolean };

/** The gorge, back to front (her spire and figure are drawn by the caller, between the cliffs and the arch). */
export const Gorge: React.FC<WorldProps & { children?: React.ReactNode }> = ({ cam, fill = 1, lit = null, grey = null, storm = 0, duels = true, arch = true, label = true, children }) => (
  <AbsoluteFill style={{ overflow: 'hidden' }}>
    {/* sky: paper at dawn; the storm (the live candle) darkens it toward sumi */}
    <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(22,19,15,${0.12 + 0.75 * storm}) 0%, rgba(22,19,15,${0.02 + 0.65 * storm}) 60%)` }} />
    <Plane z={60} cam={cam}><Poly pts={ridge(-4000, 6000, 360, 240, 1, 64, 2000)} fill={`rgba(22,19,15,${0.10 + 0.1 * storm})`} /></Plane>
    <Plane z={30} cam={cam}><Poly pts={ridge(-3000, 5000, 470, 200, 2, 64, 2000)} fill={`rgba(22,19,15,${0.16 + 0.1 * storm})`} /></Plane>
    {duels && (
      <Plane z={20} cam={cam}>
        {[[-700, 430], [-250, 470], [2150, 440], [2600, 470], [330, 520], [1560, 515]].map(([x, y], i) => (
          <React.Fragment key={i}>
            <Poly pts={`${x - 30},${y + 900} ${x - 18},${y} ${x + 18},${y} ${x + 30},${y + 900}`} fill="rgba(22,19,15,0.35)" />
            <div style={{ position: 'absolute', left: x - 14, top: y - 22, width: 9, height: 22, background: 'rgba(22,19,15,0.6)' }} />
            <div style={{ position: 'absolute', left: x + 5, top: y - 22, width: 9, height: 22, background: 'rgba(22,19,15,0.6)' }} />
            <div style={{ position: 'absolute', left: x - 2, top: y - 18, width: 4, height: 10, background: '#d6402b', opacity: 0.7, transform: 'skewX(-18deg)' }} />
          </React.Fragment>
        ))}
      </Plane>
    )}
    {/* mist pooled in the gorge */}
    <Plane z={12} cam={cam}><AbsoluteFill style={{ background: 'radial-gradient(ellipse 30% 22% at 50% 74%, rgba(242,236,224,0.85), rgba(242,236,224,0) 100%)' }} /></Plane>
    <Plane z={9} cam={cam}>
      <Cliff side={-1} fill={fill} light={lit === 'UP' ? 1 : 0} grey={grey === 'UP' ? 1 : 0} />
      <Cliff side={1} fill={fill} light={lit === 'DOWN' ? 1 : 0} grey={grey === 'DOWN' ? 1 : 0} />
    </Plane>
    {children}
    {arch && (
      // the stone gateway behind the camera's start: it enters at the frame edges and passes the lens as the camera retreats
      <Plane z={ARCH_Z} cam={{ d: cam.d }} opacity={cam.d > -ARCH_Z + 0.02 ? 1 : 0}>
        <Poly pts="-4000,-4000 105,-4000 130,300 118,900 140,5000 -4000,5000" fill="rgba(22,19,15,0.95)" />
        <Poly pts="5920,-4000 1815,-4000 1790,320 1805,880 1780,5000 5920,5000" fill="rgba(22,19,15,0.95)" />
        <Poly pts="-4000,-4000 5920,-4000 5920,70 1400,95 960,82 500,100 -4000,78" fill="rgba(22,19,15,0.95)" />
      </Plane>
    )}
    {label && (
      <div style={{ position: 'absolute', right: 24, top: 18, fontFamily: MONO, fontSize: 18, fontWeight: 800, color: CYAN, background: 'rgba(0,0,0,0.55)', padding: '4px 10px', letterSpacing: '0.08em' }}>
        WORLD = PLACEHOLDER (E01 sky · E02 ranges · E03 duel spires · E04 terraced cliffs + crowd · E05 her spire · E06 gateway)
      </div>
    )}
  </AbsoluteFill>
);
