// 0.00-5.455: the face-off, the eyes, the two locks and the last candle. Sumi ground (play and tension).
import React from 'react';
import { AbsoluteFill, Freeze, Img, staticFile, useCurrentFrame } from 'remotion';
import { IMPACT_HOUSE, type ShotSpec } from '../../../../yochi-2p5d/remotion/src/lib';
import { DELA, DOWN, MONO, SUMI, UP } from '../lib/brand';
import { Candles, liveCandle, series } from '../lib/Candles';
import { clamp, easeInOut, easeOut, lerp, shakeAt, slamK, smooth } from '../lib/motion';
import { Panel, Pips, Shot, StampSeal, type Pt } from '../lib/manga';
import { FPS, MATCH, T, fr } from '../data';

const L = MATCH.left, R = MATCH.right;
const ft = (start: number) => (f: number) => start + f / FPS;

/** The HUD: top-left the mode, top-right the pool. Stays in title-safe. */
export const Hud: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 150, background: 'linear-gradient(rgba(15,13,11,0.92), rgba(15,13,11,0))', opacity }} />
    <div style={{ position: 'absolute', left: 96, top: 54, fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: '0.2em', color: SUMI.ink, opacity }}>
      BATTLE ROYALE <span style={{ color: SUMI.muted }}>· 2 OF 10 LEFT</span>
    </div>
    <div style={{ position: 'absolute', right: 96, top: 54, fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: '0.2em', color: SUMI.muted, opacity }}>
      POOL <span style={{ color: SUMI.ink, fontWeight: 800 }}>{MATCH.pool} USDC</span>
    </div>
  </>
);

const nameStyle = (size: number, color: string): React.CSSProperties => ({ fontFamily: DELA, fontSize: size, lineHeight: 1, color, whiteSpace: 'nowrap' });

// ---------------------------------------------------------------- 1. face-off: two live panels, one diagonal gutter
export const FaceOff: React.FC = () => {
  const F = T.faceoff;
  const f = useCurrentFrame();
  const t = ft(F.start)(f);
  const dur = fr(F.end - F.start);
  const base: Omit<ShotSpec, 'character'> = { format: '4:5', fps: FPS, durationInFrames: dur, ground: 'sumi', ambient: { breath: 0.008, sway: 0.4 }, atmosphere: { dust: 70, ink: 14, bokeh: 3, wind: 1.3 }, grade: false };
  const left: ShotSpec = { ...base, character: L.character, camera: { push: [1.02, 1.14], truck: [-30, 0], toTarget: 0.6 } };
  const right: ShotSpec = { ...base, character: R.character, camera: { push: [1.02, 1.14], truck: [30, 0], toTarget: 0.6 } };
  // the gutter opens a touch as the two lean apart; the whole board settles from x1.04 on the first beat
  const open = easeOut(t / 0.5);
  const g = lerp(10, 26, open);
  const lp: Pt[] = [[0, 0], [1075 - g, 0], [905 - g, 1080], [0, 1080]];
  const rp: Pt[] = [[1075 + g, 0], [1920, 0], [1920, 1080], [905 + g, 1080]];
  const settle = lerp(1.05, 1, easeOut(t / 0.35));
  const sh = shakeAt(t, [{ t: F.vs + 0.07, px: 6, dur: 0.38 }]);
  const nL = slamK(t, F.nameL, 1.4, 0.14), nR = slamK(t, F.nameR, 1.4, 0.14);
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${settle})` }}>
        <Panel poly={lp}><Shot spec={left} x={-60 - 40 * open} y={-30} scale={1} /></Panel>
        <Panel poly={rp}><Shot spec={right} x={900 + 40 * open} y={40} scale={1} /></Panel>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 320, background: 'linear-gradient(rgba(15,13,11,0), rgba(15,13,11,0.9))' }} />
        <StampSeal t={t} t0={F.vs} glyph="対" x={990} y={560} size={170} fill={SUMI.ink} ink={SUMI.bg} rest={-8} />
        {nL.a > 0 && (
          <div style={{ position: 'absolute', left: 96, top: 840, transform: `scale(${nL.s})`, transformOrigin: 'left center' }}>
            <div style={nameStyle(120, SUMI.ink)}>{L.handle}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
              <Pips t={t} lives={L.lives} size={56} />
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: '0.2em', color: SUMI.muted }}>LAST LIFE</div>
            </div>
          </div>
        )}
        {nR.a > 0 && (
          <div style={{ position: 'absolute', right: 96, top: 840, transform: `scale(${nR.s})`, transformOrigin: 'right center', textAlign: 'right' }}>
            <div style={nameStyle(120, SUMI.ink)}>{R.handle}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}><Pips t={t} lives={R.lives} size={56} align="right" /></div>
          </div>
        )}
      </AbsoluteFill>
      <Hud />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 2. the eyes: two letterbox strips (camera on the card)
const EYE = {
  // card px (1536x2048): the eye line of each painting, and the strip window's width
  left: { c: [705, 452] as Pt, w: 700 },
  right: { c: [850, 478] as Pt, w: 700 },
};
const EyeStrip: React.FC<{ t: number; t0: number; card: string; c: Pt; w: number; y: number; h: number; from: 1 | -1 }> = ({ t, t0, card, c, w, y, h, from }) => {
  if (t < t0) return null;
  const s = t - t0;
  const inK = easeOut(s / 0.1);
  const W = 1920;
  const sc = (W / w) * lerp(1.0, 1.1, easeInOut(s / 1.3)); // the window fills the strip, then pushes
  const drift = from * 40 * (1 - easeOut(s / 0.6));
  return (
    <div style={{ position: 'absolute', left: 0, top: y, width: W, height: h, overflow: 'hidden', transform: `translateX(${from * (1 - inK) * 1920}px)`, boxShadow: `0 0 0 5px ${SUMI.ink}` }}>
      <Img src={staticFile(`cards/${card}.webp`)} style={{ position: 'absolute', left: W / 2 - c[0] * sc + drift, top: h / 2 - c[1] * sc, width: 1536 * sc, height: 2048 * sc }} />
    </div>
  );
};
export const Eyes: React.FC = () => {
  const E = T.eyes;
  const t = ft(E.start)(useCurrentFrame());
  const sh = shakeAt(t, [{ t: E.a, px: 5, dur: 0.3 }, { t: E.b, px: 5, dur: 0.3 }]);
  const la = slamK(t, E.livesA, 1.3, 0.12), lb = slamK(t, E.livesB, 1.3, 0.12);
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <EyeStrip t={t} t0={E.a} card={L.card} {...EYE.left} y={150} h={330} from={-1} />
        <EyeStrip t={t} t0={E.b} card={R.card} {...EYE.right} y={600} h={330} from={1} />
        {la.a > 0 && (
          <div style={{ position: 'absolute', left: 96, top: 496, display: 'flex', alignItems: 'center', gap: 20, transform: `scale(${la.s})`, transformOrigin: 'left center' }}>
            <div style={nameStyle(64, SUMI.ink)}>{L.handle}</div>
            <Pips t={t} lives={L.lives} size={40} appear={E.livesA} />
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: '0.2em', color: SUMI.muted }}>LAST LIFE</div>
          </div>
        )}
        {lb.a > 0 && (
          <div style={{ position: 'absolute', right: 96, top: 946, display: 'flex', alignItems: 'center', gap: 20, transform: `scale(${lb.s})`, transformOrigin: 'right center' }}>
            <Pips t={t} lives={R.lives} size={40} appear={E.livesB} align="right" />
            <div style={nameStyle(64, SUMI.ink)}>{R.handle}</div>
          </div>
        )}
      </AbsoluteFill>
      <Hud />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 3-4. the locks: painting panel + pick panel, diagonal gutter
const Lock: React.FC<{ side: 'left' | 'right' }> = ({ side }) => {
  const S = side === 'left' ? T.lockL : T.lockR;
  const P = side === 'left' ? L : R;
  const f = useCurrentFrame();
  const t = ft(S.start)(f);
  const dur = fr(S.end - S.start);
  const lockF = fr(S.lock - S.start);
  const spec: ShotSpec = {
    character: P.character, format: '4:5', fps: FPS, durationInFrames: dur, ground: 'sumi', grade: false,
    camera: { push: [1.2, 1.36], truck: [side === 'left' ? -16 : 16, 0], toTarget: 0.9, offset: 20 },
    ambient: { breath: 0.008, sway: 0.35 }, atmosphere: { dust: 70, ink: 12, bokeh: 3, wind: 1.3 },
    impact: { frame: lockF, ...IMPACT_HOUSE, punch: 0.06, anticipation: 6, seal: false },
  };
  const up = P.pick === 'UP';
  const k = slamK(t, S.lock, 1.45, 0.14);
  const sh = shakeAt(t, [{ t: S.lock, px: 6, dur: 0.38 }]);
  // painting 0..1210 (left) or 710..1920 (right); the gutter leans the same way in both
  const paint: Pt[] = side === 'left' ? [[0, 0], [1250, 0], [1150, 1080], [0, 1080]] : [[770, 0], [1920, 0], [1920, 1080], [670, 1080]];
  const px = side === 'left' ? 1250 : 96;
  const pw = side === 'left' ? 1920 - 1250 - 96 + 40 : 670 - 96 - 20;
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <Panel poly={paint}><Shot spec={spec} x={side === 'left' ? -20 : 760} y={-120} scale={1.1} /></Panel>
        <div style={{ position: 'absolute', left: px, top: 330, width: pw, textAlign: 'center' }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: '0.2em', paddingLeft: '0.2em', color: SUMI.ink, opacity: easeOut((t - S.start) / 0.08) }}>
            {P.handle} PICKS
          </div>
          {k.a > 0 && (
            <div style={{ marginTop: 26, fontFamily: DELA, fontSize: 124, lineHeight: 1, whiteSpace: 'nowrap', color: up ? UP : DOWN, transform: `scale(${k.s})` }}>{up ? '▲ UP' : '▼ DOWN'}</div>
          )}
        </div>
        <StampSeal t={t} t0={S.lock - 0.07} glyph="決" x={px + pw / 2} y={800} size={150} fill={SUMI.ink} ink={SUMI.bg} rest={side === 'left' ? -10 : 8} />
      </AbsoluteFill>
      <Hud />
    </AbsoluteFill>
  );
};
export const LockLeft: React.FC = () => <Lock side="left" />;
export const LockRight: React.FC = () => <Lock side="right" />;

// ---------------------------------------------------------------- 5-6. the last candle: three panels
const HIST = series(2, 11, 41.9, 0.02);
const O = HIST[HIST.length - 1].c;
// inside the minute: it sinks under the strike (deano is right), claws back, sinks again, then rips up to close green
function px(u: number) {
  return O - 0.016 * smooth(u / 0.6) + 0.006 * smooth((u - 0.62) / 0.15) - 0.004 * smooth((u - 0.8) / 0.08)
    + 0.046 * smooth((u - 0.9) / 0.1) + 0.0012 * Math.sin(u * 71) * (1 - u);
}
const LO = O - 0.03, HI = O + 0.05;

export const LastCandle: React.FC = () => {
  const C = T.candle;
  const f = useCurrentFrame();
  const t = ft(C.start)(f);
  const dur = fr(C.end - C.start);
  const u = clamp((t - C.start) / (C.close - C.start));
  const closed = t >= C.close;
  const live = liveCandle(O, px, u);
  const remain = Math.max(0, C.close - t);
  const secs = Math.ceil(remain / ((C.close - C.start) / 3));
  // the freeze: everything holds into the near-silence while the camera crawls in on deano
  const frozen = t >= C.freeze;
  const fz = frozen ? (t - C.freeze) / (C.end - C.freeze) : 0;
  const freezeF = fr(C.freeze - C.start);
  const sh = shakeAt(t, [{ t: C.start, px: 5, dur: 0.3 }, { t: C.close, px: 6, dur: 0.38 }]);
  const enter = easeOut((t - C.start) / 0.2);
  const base: Omit<ShotSpec, 'character' | 'camera'> = { format: '4:5', fps: FPS, durationInFrames: dur, ground: 'sumi', grade: false, ambient: { breath: 0.01, sway: 0.45 }, atmosphere: { dust: 60, ink: 10, bokeh: 2, wind: 1.4 } };
  const left: ShotSpec = { ...base, character: L.character, camera: { push: [1.15, 1.3], truck: [-10, 0], toTarget: 0.9 } };
  const right: ShotSpec = { ...base, character: R.character, camera: { push: [1.15, 1.3], truck: [10, 0], toTarget: 0.9 } };
  const sideL: Pt[] = [[0, 0], [560, 0], [520, 1080], [0, 1080]];
  const sideR: Pt[] = [[1400, 0], [1920, 0], [1920, 1080], [1360, 1080]];
  const chart = { x: 640, y: 300, w: 640, h: 600 };
  const chip = (pick: 'UP' | 'DOWN', wrong: boolean, right_: boolean): React.CSSProperties => ({
    fontFamily: DELA, fontSize: 56, lineHeight: 1, padding: '14px 22px 12px', borderRadius: 10,
    color: wrong ? SUMI.out : pick === 'UP' ? UP : DOWN, background: SUMI.surface1, boxShadow: `0 0 0 3px ${wrong ? SUMI.out : right_ ? UP : 'rgba(239,231,216,0.25)'}`,
    textDecoration: wrong ? 'line-through' : undefined,
  });
  const wrongL = closed && t >= C.close + 0.06;
  const cam = 1 + 0.04 * easeInOut(fz);
  const freezeSide = (node: React.ReactNode) => (frozen ? <Freeze frame={freezeF}>{node}</Freeze> : node);
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${lerp(1.04, 1, enter) * cam})`, transformOrigin: `${frozen ? 300 : 960}px 540px` }}>
        {freezeSide(<Panel poly={sideL}><Shot spec={left} x={-330} y={-60} scale={0.95} /></Panel>)}
        {freezeSide(<Panel poly={sideR}><Shot spec={right} x={1280} y={-60} scale={0.95} /></Panel>)}
        <div style={{ position: 'absolute', left: 0, width: 600, bottom: 0, height: 300, background: 'linear-gradient(rgba(15,13,11,0), rgba(15,13,11,0.9))' }} />
        <div style={{ position: 'absolute', left: 1330, width: 590, bottom: 0, height: 300, background: 'linear-gradient(rgba(15,13,11,0), rgba(15,13,11,0.9))' }} />
        {/* picks and lives under each face */}
        <div style={{ position: 'absolute', left: 96, top: 836, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={nameStyle(60, wrongL ? SUMI.out : SUMI.ink)}>{L.handle}</div>
            <Pips t={t} lives={L.lives} size={40} lostAt={C.crack} />
          </div>
          <div style={{ display: 'flex' }}><div style={chip('DOWN', wrongL, false)}>▼ DOWN</div></div>
        </div>
        <div style={{ position: 'absolute', right: 96, top: 836, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Pips t={t} lives={R.lives} size={40} align="right" />
            <div style={nameStyle(60, SUMI.ink)}>{R.handle}</div>
          </div>
          <div style={chip('UP', false, closed)}>▲ UP</div>
        </div>
        {/* centre: the timer and the candle */}
        <div style={{ position: 'absolute', left: chart.x, width: chart.w, top: 112, textAlign: 'center', opacity: closed ? 0 : 1 }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: '0.2em', paddingLeft: '0.2em', color: SUMI.muted }}>LAST CANDLE · HYPE 1M</div>
          <div style={{ fontFamily: DELA, fontSize: 96, lineHeight: 1.1, color: SUMI.ink }}>0:0{Math.max(0, secs)}</div>
          <div style={{ margin: '6px auto 0', width: 420, height: 14, background: SUMI.surface2 }}>
            <div style={{ width: `${(remain / (C.close - C.start)) * 100}%`, height: '100%', background: SUMI.red }} />
          </div>
        </div>
        <div style={{ position: 'absolute', left: chart.x, top: chart.y, width: chart.w, height: chart.h, opacity: enter, overflow: 'hidden' }}>
          <Candles w={chart.w} h={chart.h} data={HIST} live={live} strike={O} lo={LO} hi={HI} bodyW={150} gap={50} strikeLabel={false} fade={0.28} centerLast />
        </div>
        {closed && (
          <div style={{ position: 'absolute', left: chart.x, width: chart.w, top: 150, textAlign: 'center', transform: `scale(${slamK(t, C.close, 1.5, 0.12).s})` }}>
            <div style={{ fontFamily: DELA, fontSize: 130, lineHeight: 1, color: UP }}>▲ UP</div>
          </div>
        )}
      </AbsoluteFill>
      {/* the freeze: the frame drains toward grey and closes in, the near-silence */}
      {frozen && <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 70% at 22% 45%, rgba(15,13,11,0) 40%, rgba(15,13,11,${0.75 * smooth(fz * 1.6)}) 100%)` }} />}
      <Hud opacity={frozen ? 1 - smooth(fz * 2) : 1} />
    </AbsoluteFill>
  );
};
