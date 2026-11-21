// 0.00-5.46: the threat, the challenger, his pick, her pick. Sumi ground (play and tension).
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { IMPACT_HOUSE } from '../../../../../yochi-2p5d/remotion/src/lib';
import { DELA, DOWN, MONO, SUMI, UP } from '../lib/brand';
import { Painting, camAt, type Cam } from '../lib/camera';
import { useFmt } from '../lib/frame';
import { Panel, StampSeal, bbox, type Pt } from '../lib/manga';
import { clamp, easeOut, lerp, shakeAt, slamK } from '../lib/motion';
import { Motes } from '../lib/Motes';
import { FPS, MATCH, T, fr } from '../data';

const useLocal = (start: number) => start + useCurrentFrame() / FPS;
const shade = (side: 'bottom' | 'top', h: number, a = 0.9): React.CSSProperties => ({
  position: 'absolute', left: 0, right: 0, [side]: 0, height: h,
  background: `linear-gradient(${side === 'bottom' ? 'rgba(15,13,11,0)' : `rgba(15,13,11,${a})`}, ${side === 'bottom' ? `rgba(15,13,11,${a})` : 'rgba(15,13,11,0)'})`,
});

// ---------------------------------------------------------------- 1. the threat: the fist at the lens, up to the grin
export const Threat: React.FC = () => {
  const S = T.threat;
  const t = useLocal(S.start);
  const { land } = useFmt();
  const dur = fr(S.end - S.start);
  const a: Cam = land ? { x: 760, y: 1440, z: 1.5 } : { x: 720, y: 1110, z: 1.2 };
  const b: Cam = land ? { x: 850, y: 660, z: 1.66 } : { x: 860, y: 860, z: 1.5 };
  const cam = camAt(a, b, t, S.start, S.end);
  const settle = lerp(1.06, 1, easeOut((t - S.start) / 0.4));
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${settle})` }}>
        <Painting id="rampage" cam={cam} dur={dur} atmosphere={{ dust: 90, ink: 16, bokeh: 4, wind: 1.4 }} />
      </AbsoluteFill>
      <Motes t={t} n={40} strength={0.7} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 2. the challenger: he fills the frame; she cuts in, small
export const Challenger: React.FC = () => {
  const S = T.challenger;
  const t = useLocal(S.start);
  const { land, W, H, safe } = useFmt();
  const dur = fr(S.end - S.start);
  const inK = easeOut((t - S.start) / 0.14);
  const him: Pt[] = land ? [[0, 0], [1300, 0], [1170, H], [0, H]] : [[0, 0], [W, 0], [W, 1110], [0, 1250]];
  const her: Pt[] = land ? [[1330, 0], [W, 0], [W, H], [1200, H]] : [[0, 1290], [W, 1150], [W, H], [0, H]];
  const herShift = land ? `translateX(${(1 - inK) * 700}px)` : `translateY(${(1 - inK) * 800}px)`;
  const hc: Cam = land ? { x: 900, y: 760, z: 1.02 } : { x: 860, y: 700, z: 1.08 };
  const dc: Cam = land ? { x: 870, y: 690, z: 1.0 } : { x: 870, y: 600, z: 1.0 };
  const sh = shakeAt(t, [{ t: S.vs + 0.07, px: 6, dur: 0.38 }]);
  const nm = slamK(t, S.start + 0.17, 1.35, 0.14);
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <Panel poly={him}>
          <Painting id="rampage" cam={{ ...hc, z: hc.z * lerp(1, 1.06, (t - S.start) / 1.36) }} dur={dur} at={land ? [640, 540] : [540, 600]} box={bbox(him)} />
        </Panel>
        <AbsoluteFill style={{ transform: herShift }}>
          <Panel poly={her}>
            <Painting id="duel-master" cam={{ ...dc, z: dc.z * lerp(1, 1.04, (t - S.start) / 1.36) }} dur={dur} at={land ? [1620, 520] : [540, 1560]} box={bbox(her)} ambient={{ breath: 0.01, sway: 0.45 }} />
          </Panel>
        </AbsoluteFill>
        <div style={shade('bottom', land ? 300 : 420)} />
        <StampSeal t={t} t0={S.vs} glyph="対" x={land ? 1250 : 540} y={land ? 560 : 1210} size={land ? 150 : 150} fill={SUMI.ink} ink={SUMI.bg} rest={-8} />
        {nm.a > 0 && (
          <>
            <div style={{ position: 'absolute', left: safe.x, top: land ? 880 : 1060, fontFamily: DELA, fontSize: land ? 118 : 110, lineHeight: 1, color: SUMI.ink, transform: `scale(${nm.s})`, transformOrigin: 'left center' }}>{MATCH.him.handle}</div>
            <div style={{ position: 'absolute', right: safe.x, top: land ? 902 : 1720, fontFamily: DELA, fontSize: land ? 92 : 96, lineHeight: 1, color: SUMI.ink, transform: `scale(${nm.s})`, transformOrigin: 'right center' }}>{MATCH.her.handle}</div>
          </>
        )}
        <div style={{ ...shade('top', 200, 0.85) }} />
        <div style={{ position: 'absolute', left: safe.x, top: safe.y, opacity: easeOut((t - S.start - 0.05) / 0.2) }}>
          <div style={{ fontFamily: DELA, fontSize: 54, lineHeight: 1, color: SUMI.ink }}>{MATCH.format}</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: '0.2em', color: SUMI.ink, marginTop: 12 }}>{MATCH.stake} USDC EACH</div>
        </div>
      </AbsoluteFill>
      <Motes t={t} n={40} strength={0.6} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 3-4. the picks: his instant and loud, hers late and quiet
const Pick: React.FC<{ who: 'him' | 'her' }> = ({ who }) => {
  const S = who === 'him' ? T.pickHim : T.pickHer;
  const P = who === 'him' ? MATCH.him : MATCH.her;
  const t = useLocal(S.start);
  const { land, W, H, safe } = useFmt();
  const dur = fr(S.end - S.start);
  const lockF = fr(S.lock - S.start);
  const up = P.pick === 'UP';
  const loud = who === 'him';
  const k = slamK(t, S.lock, loud ? 1.6 : 1.18, loud ? 0.12 : 0.16);
  const sh = shakeAt(t, loud ? [{ t: S.lock, px: 8, dur: 0.4 }] : []);
  const right = who === 'her';
  const poly: Pt[] = land
    ? (right ? [[900, 0], [W, 0], [W, H], [800, H]] : [[0, 0], [1180, 0], [1080, H], [0, H]])
    : (right ? [[0, 760], [W, 640], [W, H], [0, H]] : [[0, 0], [W, 0], [W, 1180], [0, 1300]]);
  const cam: Cam = who === 'him'
    ? { x: 1010, y: 520, z: (land ? 1.5 : 1.45) * lerp(1, 1.08, (t - S.start) / 1.36) }
    : { x: 870, y: 600, z: (land ? 1.42 : 1.4) * lerp(1, 1.05, (t - S.start) / 1.36) };
  const at: [number, number] = land ? (right ? [1420, 520] : [560, 520]) : (right ? [540, 1340] : [540, 600]);
  const box = land ? (right ? { left: safe.x, width: 800 - 30 - safe.x, top: 350 } : { left: 1180, width: W - 1180 - safe.x + 20, top: 330 })
    : (right ? { left: 0, width: W, top: 190 } : { left: 0, width: W, top: 1370 });
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <Panel poly={poly}>
          <Painting id={P.card} cam={cam} dur={dur} at={at} box={bbox(poly)} ambient={right ? { breath: 0.012, sway: 0.5 } : { breath: 0.008, sway: 0.3 }}
            impact={loud ? { frame: lockF, ...IMPACT_HOUSE, punch: 0.07, anticipation: 4, seal: false } : undefined} />
        </Panel>
        <div style={{ position: 'absolute', ...box, textAlign: 'center' }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: '0.2em', paddingLeft: '0.2em', color: SUMI.muted, opacity: k.a }}>{P.handle}</div>
          {k.a > 0 && (
            <div style={{ marginTop: 18, fontFamily: DELA, fontSize: loud ? 172 : 118, lineHeight: 1, whiteSpace: 'nowrap', color: up ? UP : DOWN, transform: `scale(${k.s})` }}>{up ? '▲ UP' : '▼ DOWN'}</div>
          )}
        </div>
        <StampSeal t={t} t0={S.lock - 0.07} glyph="決" x={box.left + box.width / 2} y={box.top + (loud ? 400 : 360)} size={loud ? 160 : 120} fill={SUMI.ink} ink={SUMI.bg} rest={right ? 8 : -10} />
      </AbsoluteFill>
      <Motes t={t} n={30} strength={0.5} />
    </AbsoluteFill>
  );
};
export const PickHim: React.FC = () => <Pick who="him" />;
export const PickHer: React.FC = () => <Pick who="her" />;
