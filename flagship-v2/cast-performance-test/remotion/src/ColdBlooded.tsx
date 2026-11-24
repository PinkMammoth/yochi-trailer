// COLD BLOODED, the defeat: concealment, not collapse.
//
// The new painting is the END of the gesture (the mask already over his face, head bowed, eyes closed). It can't be
// in-betweened from itself without warping his face, which the house rules forbid. Two treatments are tested:
//  - `card: true`, the cut on the gesture: shot 1 is the approved v2 kit card (proud, chin up, the mask held at his
//    chest). The loss reaches him (the DOWN side greys, then he does); a fast whip-tilt up, the direction the mask
//    travels, cuts on the action into shot 2, the new painting, closer: the mask is at his face. One frame of vertical
//    motion blur either side of the cut. Two different paintings, so a cut, never a dissolve.
//  - `card: false`, the single painting: start on the mask and the hand, tilt down and pull out to the bowed head, the
//    closed eye, the scar.
// Shot 2: a rigid inward settle (the whole figure sinks 0.6% about his feet, below frame), breath almost stopped, the
// grey deepening. DOWN side of the approved arena, out of focus; no floor (both paintings end above the knee).
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Grade } from '../../../../yochi-2p5d/remotion/src/lib';
import { PAPER, MONO, useFonts } from '../../../film/remotion/src/lib/brand';
import { brushWipe } from '../../../film/remotion/src/lib/brush';
import { Canvas2D } from '../../../film/remotion/src/lib/frame';
import { StampSeal } from '../../../film/remotion/src/lib/manga';
import { clamp, easeInOut } from '../../../film/remotion/src/lib/motion';
import { ArenaWorld, camAt, k01, Motes } from './common';
import { CBCut, FPS } from './timing';

const CARD = { w: 1392, h: 1828, s: 0.9, x: -150, y: -60, anchor: [700, 1828] as [number, number] };
const DEF = { w: 1086, h: 1448, s: 1.1, x: 142, y: -3, anchor: [543, 1448] as [number, number] };

const VBlur: React.FC<{ id: string; px: number }> = ({ id, px }) => (
  <svg width={0} height={0} style={{ position: 'absolute' }}><filter id={id} x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation={`0 ${px}`} /></filter></svg>
);

export const ColdBloodedShot: React.FC<{ cut: CBCut; type?: boolean; diag?: boolean }> = ({ cut, type = false, diag = false }) => {
  useFonts();
  const f = useCurrentFrame(); const t = f / FPS;
  const cutF = Math.round(cut.cut * FPS);
  const shot2 = !cut.card || f >= cutF;
  const cam = shot2 ? camAt(cut.cams2, t) : camAt(cut.cams1, t);
  // the loss: the world greys first, then him
  const gw = 0.12 + 0.4 * k01(t, cut.greyIn, cut.greyFull);
  const gf = shot2 ? 0.38 + 0.24 * k01(t, cut.settle, cut.settle + 1.6) : 0.38 * k01(t, cut.greyIn + 0.3, cut.greyFull + 0.1);
  // the whip: vertical blur on the frame before and the frame after the cut
  const blurPx = cut.card ? (f === cutF - 1 ? 16 : f === cutF ? 18 : f === cutF + 1 ? 6 : 0) : 0;
  const P = shot2 ? DEF : CARD;
  const settle = shot2 ? k01(t, cut.settle, cut.settle + 1.4) : 0;
  const breath = 0.0025 * (1 - 0.7 * settle) * Math.sin((t / 3.6) * Math.PI * 2);
  const s = 1 - 0.006 * settle + breath;
  const figTf = `translate(${P.x}px, ${P.y + 6 * settle}px) scale(${P.s}) translate(${P.anchor[0]}px, ${P.anchor[1]}px) scale(${s}) translate(${-P.anchor[0]}px, ${-P.anchor[1]}px)`;
  const exitP = t < cut.exit0 ? 0 : clamp((t - cut.exit0) / (cut.dur - cut.exit0)) * 0.6;
  return (
    <AbsoluteFill style={{ background: '#d9cfbd', overflow: 'hidden' }}>
      <VBlur id="cbv" px={blurPx} />
      <AbsoluteFill style={{ filter: blurPx ? 'url(#cbv)' : undefined }}>
        <ArenaWorld cam={cam} side="down" grey={gw} floor={false} blur={9}>
          <Img src={staticFile(shot2 ? 'cp/cb-fig.png' : 'cp/cb-card-fig.png')} style={{ position: 'absolute', left: 0, top: 0, width: P.w, height: P.h, transformOrigin: '0 0', transform: figTf,
            filter: `grayscale(${gf}) brightness(${1 - 0.05 * gf})` }} />
        </ArenaWorld>
        <Motes t={t} n={40} seed={9} wind={-25} life={0.5 * (1 - 0.6 * settle)} cam={cam} col="#3a352e" />
      </AbsoluteFill>
      <Grade W={1920} H={1080} vignette={0.3 + 0.1 * settle} grain={0.4} />
      {type && cut.seal !== undefined && (
        <>
          {/* a paper scrim under the type: the loss grey must read over the busy, greyed terraces */}
          <div style={{ position: 'absolute', right: 40, top: 60, width: 560, height: 360, opacity: clamp((t - cut.seal) / 0.12),
            background: 'radial-gradient(ellipse 50% 50% at 60% 50%, rgba(242,236,224,0.82), rgba(242,236,224,0.55) 55%, rgba(242,236,224,0) 100%)' }} />
          <StampSeal t={t} t0={cut.seal} glyph="敗" x={1690} y={170} size={140} fill={PAPER.out} ink={PAPER.bg} />
          <div style={{ position: 'absolute', right: 110, top: 262, textAlign: 'right', fontFamily: MONO, fontWeight: 800, fontSize: 68, color: PAPER.out, opacity: clamp((t - cut.seal - 0.1) / 0.15) }}>−80 USDC</div>
          <div style={{ position: 'absolute', right: 112, top: 352, fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: '0.2em', color: PAPER.out, opacity: clamp((t - cut.seal - 0.18) / 0.15) }}>FROST</div>
        </>
      )}
      {exitP > 0 && <Canvas2D draw={(ctx) => brushWipe(ctx, 1920, 1080, exitP, [22, 19, 15], 4, 6)} />}
      {diag && <div style={{ position: 'absolute', left: 16, bottom: 12, fontFamily: 'monospace', fontSize: 22, color: '#fff', background: 'rgba(0,0,0,.6)', padding: '3px 8px' }}>
        t {t.toFixed(3)} f {f} · {shot2 ? 'shot 2 (new painting)' : 'shot 1 (v2 card)'} · grey {gf.toFixed(2)} · blur {blurPx} · z {cam[2].toFixed(2)}</div>}
    </AbsoluteFill>
  );
};
export { easeInOut };
