// 8.08-8.93: the close, in true silence. Match cut: the same framing, the grin gone, the world drained to bare
// paper (the disbelief pose). Then her eyes, unmoved. Then the sub returns and she lunges (the attack pose).
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { DELA, DOWN, PAPER, SUMI } from '../lib/brand';
import { Flat, Painting, type Cam } from '../lib/camera';
import { Canvas2D, useFmt } from '../lib/frame';
import { focusLines } from '../lib/manga';
import { clamp, easeIn, easeInOut, easeOut, lerp, slamK } from '../lib/motion';
import { matchCam } from './Candle';
import { ART, FPS, T, fr } from '../data';

const CALM = T.disbelief.calm; // her eyes: the last ~0.29 s of the silence

// ---------------------------------------------------------------- 9. disbelief: the match cut out of his grin
export const Disbelief: React.FC = () => {
  const S = T.disbelief;
  const t = S.start + useCurrentFrame() / FPS;
  const { land } = useFmt();
  const m = matchCam(land);
  const D = ART.disbelief;
  const zd = m.z * (236 / D.faceW); // the faces register at the same size: the cut changes only the expression
  // the cut lands with a small jolt, holds on the match framing a beat, then a slow, deliberate push into his
  // eyes and brow through the silence: the realisation, at a size the HD painting holds
  const jolt = 1 + 0.03 * Math.exp(-(t - S.start) * 18);
  const k = easeInOut((t - S.push) / (CALM - S.push));
  const target: [number, number] = land ? [1180, 400] : [560, 640];
  const z = zd * jolt * lerp(1, land ? 1.62 : 1.5, k);
  const cx = lerp(D.face[0], D.eyes[0], k), cy = lerp(D.face[1], D.eyes[1], k);
  const at: [number, number] = [lerp(m.at[0], target[0], k), lerp(m.at[1], target[1], k)];
  const down = slamK(t, S.start + 0.05, 1.25, 0.14);
  const downOut = 1 - easeOut((t - (S.start + 0.42)) / 0.2);
  return (
    <AbsoluteFill style={{ background: '#e9dcc3', overflow: 'hidden' }}>
      <Flat src={D.src} w={D.w} h={D.h} cam={{ x: cx, y: cy, z }} at={at} />
      {down.a > 0 && downOut > 0 && (
        <div style={{ position: 'absolute', ...(land ? { left: 96, top: 70 } : { left: 0, right: 0, top: 1580, textAlign: 'center' as const }), fontFamily: DELA, fontSize: 150, lineHeight: 1,
          color: DOWN, opacity: downOut, transform: `scale(${down.s})`, transformOrigin: land ? 'left center' : 'center', whiteSpace: 'nowrap' }}>▼ DOWN</div>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 9b. her eyes: unmoved (a letterbox strip)
export const Calm: React.FC = () => {
  const t = CALM + useCurrentFrame() / FPS;
  const { land, W, H } = useFmt();
  const sh = land ? 400 : 440;
  const dur = fr(T.strike.start - CALM);
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: (H - sh) / 2, width: W, height: sh, overflow: 'hidden', boxShadow: `0 0 0 5px ${SUMI.ink}` }}>
        <Painting id="duel-master" cam={{ x: ART.duelMaster.eyes[0], y: ART.duelMaster.eyes[1], z: (land ? 2.0 : 1.6) * lerp(1, 1.03, (t - CALM) / (T.strike.start - CALM)) }} dur={dur} at={[W / 2, sh / 2]} ambient={{ breath: 0.004, sway: 0.1 }} atmosphere={{ dust: 0, ink: 0, bokeh: 0, wind: 0 }} />
      </div>
    </AbsoluteFill>
  );
};
export const CALM_AT = CALM;

// ---------------------------------------------------------------- 10. the lunge: the attack pose, a camera slam and focus lines
export const Lunge: React.FC = () => {
  const S = T.strike;
  const t = S.start + useCurrentFrame() / FPS;
  const { land, W, H } = useFmt();
  const A = ART.attack;
  const p = clamp((t - S.start) / (S.wide - S.start));
  // slam in toward her face and blade hand, a Dutch tilt that tightens, her whole figure driving toward frame-left
  const a: Cam = land ? { x: 760, y: 980, z: 1.42, r: -2 } : { x: 760, y: 1000, z: 1.02, r: -2 };
  const b: Cam = land ? { x: 760, y: 860, z: 1.78, r: -6 } : { x: 700, y: 880, z: 1.34, r: -6 };
  const e = easeOut(p * 1.25);
  const cam: Cam = { x: lerp(a.x, b.x, e) + 40 * (1 - e), y: lerp(a.y, b.y, e), z: a.z * Math.pow(b.z / a.z, e), r: lerp(a.r!, b.r!, e) };
  const face: [number, number] = [W / 2 + (A.face[0] - cam.x) * cam.z, H / 2 + (A.face[1] - cam.y) * cam.z];
  return (
    <AbsoluteFill style={{ background: '#efe4d2', overflow: 'hidden' }}>
      <Flat src={A.src} w={A.w} h={A.h} cam={cam} />
      <Canvas2D draw={(ctx) => focusLines(ctx, W, H, face, [260, 200], 160, 'rgba(22,19,15,1)', 0.5 + 0.35 * p, 5, t)} />
    </AbsoluteFill>
  );
};
