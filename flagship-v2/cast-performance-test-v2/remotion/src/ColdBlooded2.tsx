// COLD BLOODED v2: the mask rises. Two approved paintings on one canvas: A (mask lowered, face visible) and B (mask
// raised over the face), B registered onto A (similarity, 1.3 px median; the body below the collar to ~2-3 px).
// The gesture's path: the mask centre travels from A's (715, 585) to B's (670, 265): 320 px up, 45 px left.
//
// method 'concealed' (B, chosen):
//   shot 1  medium on his face and the lowered mask; the grey arrives; the camera tilts up to his face as his own hand
//           (A's mask + hand + wrist, one rigid piece) begins to rise, its wrist end below the frame
//   swap    mid-rise the hand that rises becomes B's (mask + hand + forearm), at the same mask centre, on two smear
//           frames; B's chest and sleeve (hanging from a raised arm) replace A's below the collar, which at that moment
//           is the bottom of the frame and nearly identical
//   rise    B's mask rises over A's face, decelerating: his expression disappears behind it
//   settle  the head settles into the mask: a cut to all-B under a 0.6% rigid sink and one smear frame (B's head is
//           bowed a little lower, so it reads as him lowering his face into it)
//   then the camera eases back to the whole painting as the loss grey washes in
// method 'layered' (A, for comparison): the whole figure; A's hand rises 110 px, then a masked cut of the measured
// change region straight to B (the remaining 210 px in one frame) on smear frames.
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Grade } from '../../../../yochi-2p5d/remotion/src/lib';
import { PAPER, MONO, useFonts } from '../../../film/remotion/src/lib/brand';
import { StampSeal } from '../../../film/remotion/src/lib/manga';
import { clamp, easeInOut, lerp } from '../../../film/remotion/src/lib/motion';
import { ArenaWorld, camAt, k01, Motes } from './common';
import { CBCut, FPS } from './timing';

const PW = 1086, PH = 1448;
const K0 = 1080 / PH;                         // painting px -> stage px (z = 1: the painting fills the height)
const OX = 960 - (PW / 2) * K0;
const toStage = (c: [number, number, number]): [number, number, number] => [c[0] * K0 + OX, c[1] * K0, c[2]];
const TRAVEL = 320, XSHIFT = 45;             // mask centre travel, A -> B (painting px)

const Blur: React.FC<{ id: string; px: number }> = ({ id, px }) => (
  <svg width={0} height={0} style={{ position: 'absolute' }}><filter id={id} x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation={`0 ${px}`} /></filter></svg>
);
const L: React.FC<{ src: string; dx?: number; dy?: number; rot?: number; blur?: string; op?: number }> = ({ src, dx = 0, dy = 0, rot = 0, blur, op = 1 }) => (
  <Img src={staticFile(`cp/${src}.png`)} style={{ position: 'absolute', left: 0, top: 0, width: PW, height: PH, opacity: op,
    transformOrigin: '715px 585px', transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, filter: blur }} />
);

export const ColdBlooded2Shot: React.FC<{ cut: CBCut; type?: boolean; diag?: boolean }> = ({ cut, type = false, diag = false }) => {
  useFonts();
  const f = useCurrentFrame(); const t = f / FPS;
  const cam = toStage(camAt(cut.cams, t));
  // the gesture's progress along its path (0 = lowered, 1 = over the face): slow out, slow in
  const u = easeInOut((t - cut.lift0) / (cut.lift1 - cut.lift0));
  const swapU = 110 / TRAVEL;                                         // A's hand hands over to B's here
  const swapF = cut.method === 'concealed'
    ? Math.round((cut.lift0 + (cut.lift1 - cut.lift0) * invEase(swapU)) * FPS)
    : Math.round(cut.swap * FPS);
  const settleF = Math.round(cut.settle * FPS);
  // motion blur on the moving hand, proportional to its speed (painting px per frame), so the swap frames don't pop
  const du = (easeInOut((t + 1 / FPS - cut.lift0) / (cut.lift1 - cut.lift0)) - easeInOut((t - cut.lift0) / (cut.lift1 - cut.lift0))) * TRAVEL;
  const smear = (k: number) => Math.max(0.6 * du, f === k - 1 ? 5 : f === k ? 6 : f === k + 1 ? 3 : 0);
  const settleSmear = f === settleF ? 2.5 : 0;   // the settle is a nudge, not a whip
  // grade: the world first, then him; the wash deepens after the mask is on
  const gw = 0.12 + 0.4 * k01(t, cut.greyIn, cut.greyFull);
  const gf = 0.3 * k01(t, cut.greyIn + 0.3, cut.greyFull + 0.2) + 0.3 * k01(t, cut.washIn, cut.washIn + 1.6);
  const sink = k01(t, cut.settle, cut.settle + 1.2);
  const breath = 0.002 * (1 - 0.8 * sink) * Math.sin((t / 3.6) * Math.PI * 2);
  const s = 1 - 0.006 * sink + breath;
  const figTf = `translate(${OX}px, 0px) scale(${K0}) translate(543px, ${PH}px) scale(${s}) translate(-543px, ${-PH}px)`;

  let layers: React.ReactNode;
  let phase = '';
  if (cut.method === 'concealed') {
    if (f < swapF) {             // A, its own hand rising
      phase = 'A: own hand rising';
      layers = <><L src="cb-base1" /><L src="cb-Ahand" dy={-TRAVEL * u} blur={smear(swapF) > 0.3 ? 'url(#cbs)' : undefined} /></>;
    } else if (f < settleF) {    // B's mask over A's face
      phase = 'B mask over A face';
      const o = TRAVEL * (1 - u);
      layers = <><L src="cb-base2" /><L src="cb-Bhand" dx={XSHIFT * (1 - u) * 1.0} dy={o} rot={5 * (1 - u)} blur={smear(swapF) > 0.3 ? 'url(#cbs)' : undefined} /></>;
    } else {                     // all B: the head settles into the mask
      phase = 'B';
      layers = <L src="cb-B" blur={settleSmear ? 'url(#cbs)' : undefined} />;
    }
  } else {
    const d = Math.min(TRAVEL * u, 110);
    if (f < swapF) { phase = 'A, hand rising'; layers = <><L src="cb-base1" /><L src="cb-Ahand" dy={-d} blur={smear(swapF) ? 'url(#cbs)' : undefined} /></>; }
    else {
      phase = 'B (masked cut)';
      // the change region swaps; outside it, B and A are the same drawing to ~2-3 px
      layers = <><L src="cb-A" /><div style={{ position: 'absolute', left: 0, top: 0, width: PW, height: PH, WebkitMaskImage: `url(${staticFile('cp/cb-change.png')})`, WebkitMaskSize: `${PW}px ${PH}px`,
        maskMode: 'luminance', filter: smear(swapF) ? 'url(#cbs)' : undefined } as React.CSSProperties}><L src="cb-B" /></div></>;
    }
  }
  return (
    <AbsoluteFill style={{ background: '#d9cfbd', overflow: 'hidden' }}>
      <Blur id="cbs" px={Math.max(smear(swapF), settleSmear) || 0.01} />
      <ArenaWorld cam={cam} side="down" grey={gw} floor={false} blur={9}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: PW, height: PH, transformOrigin: '0 0', transform: figTf, filter: `grayscale(${gf}) brightness(${1 - 0.05 * gf})` }}>
          {layers}
        </div>
      </ArenaWorld>
      <Motes t={t} n={34} seed={9} wind={-22} life={0.45 * (1 - 0.6 * sink)} cam={cam} col="#3a352e" />
      <Grade W={1920} H={1080} vignette={0.3 + 0.1 * sink} grain={0.4} />
      {type && cut.seal !== undefined && (
        <>
          <div style={{ position: 'absolute', right: -60, top: -20, width: 860, height: 520, opacity: clamp((t - cut.seal) / 0.12),
            background: 'radial-gradient(closest-side, rgba(242,236,224,0.88), rgba(242,236,224,0.72) 60%, rgba(242,236,224,0) 100%)' }} />
          <StampSeal t={t} t0={cut.seal} glyph="敗" x={1690} y={150} size={140} fill={PAPER.out} ink={PAPER.bg} />
          <div style={{ position: 'absolute', right: 110, top: 240, textAlign: 'right', fontFamily: MONO, fontWeight: 800, fontSize: 68, color: PAPER.out, opacity: clamp((t - cut.seal - 0.1) / 0.15) }}>−80 USDC</div>
          <div style={{ position: 'absolute', right: 112, top: 330, fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: '0.2em', color: PAPER.out, opacity: clamp((t - cut.seal - 0.18) / 0.15) }}>FROST · PROVISIONAL</div>
        </>
      )}
      {diag && <div style={{ position: 'absolute', left: 16, bottom: 12, fontFamily: 'monospace', fontSize: 22, color: '#fff', background: 'rgba(0,0,0,.6)', padding: '3px 8px' }}>
        {cut.method} · t {t.toFixed(3)} f {f} · u {u.toFixed(2)} · {phase} · swap f{swapF} settle f{settleF} · z {cam[2].toFixed(2)}</div>}
    </AbsoluteFill>
  );
};

/** inverse of easeInOut (cubic), for finding the time at which the path reaches a given progress */
function invEase(y: number) { let a = 0, b = 1; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (easeInOut(m) < y) a = m; else b = m; } return (a + b) / 2; }
export { lerp };
