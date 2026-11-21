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
export const Gorge: React.FC<WorldProps & { children?: React.ReactNode }> = ({ lit = null, grey = null, storm = 0, label = true, children }) => {
  // The approved Grand Prediction Arena (pullback/sky.png is the master with nearer planes removed; the full
  // painting is the composite of the planes, so we use the untouched master via the platform-free copy below).
  // UP terraces = the left cliff, DOWN terraces = the right cliff. Lit / grey act on each half.
  const half = (side: 'UP' | 'DOWN') => {
    const g = grey === side ? 'grayscale(1) brightness(0.72)' : lit === side ? 'brightness(1.06) saturate(1.05)' : lit ? 'brightness(0.88)' : '';
    return (
      <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: side === 'UP' ? 'linear-gradient(90deg, black 40%, transparent 60%)' : 'linear-gradient(90deg, transparent 40%, black 60%)', filter: g || undefined }}>
        <Img src={staticFile('pullback/arena-master.webp')} style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080 }} />
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#e9dcc8' }}>
      <Img src={staticFile('pullback/arena-master.webp')} style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080 }} />
      {half('UP')}{half('DOWN')}
      {/* Duel Master, still on her platform (feet on the circle's centre), until she steps down at the end */}
      <Img src={staticFile('pullback/figure.png')} style={{ position: 'absolute', left: 878.4 - (557 * 0.1314) * 0.96, top: 869.8 - 1365 * 0.1314 * 0.96, height: 1448 * 0.1314 * 0.96 }} />
      {/* the storm under the live candle: an ink wash over the sky */}
      {storm > 0 && <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(22,19,15,${0.78 * storm}) 0%, rgba(22,19,15,${0.45 * storm}) 45%, rgba(22,19,15,${0.15 * storm}) 75%)` }} />}
      {children}
      {label && (
        <div style={{ position: 'absolute', right: 24, top: 18, fontFamily: MONO, fontSize: 18, fontWeight: 800, color: CYAN, background: 'rgba(0,0,0,0.55)', padding: '4px 10px', letterSpacing: '0.08em' }}>
          APPROVED ARENA · crowd on the terraces = NEW E04 (not yet drawn) · storm sky = NEW E07
        </div>
      )}
    </AbsoluteFill>
  );
};
