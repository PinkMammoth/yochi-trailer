// 0:10.8-0:14.4. The final two, one life each.
//   versus   YOU above, deano below, the paper versus band between them: 対 and the vermilion slash
//   close-ups each face, punch-in on the pick: YOU ▲ UP (the 決 lock stamps), deano ▼ DOWN
//   candle   a giant live candle over both faces; the arcade timer drains; the music drops out; it closes UP;
//            deano's last life goes, his face greys, 敗
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CharacterShot, IMPACT_HOUSE, drawSlash, type ShotSpec } from '../../../../yochi-2p5d/remotion/src/lib';
import { BAND, DELA, DOWN, MONO, PAPER, SUMI, UP, YUJI } from '../lib/brand';
import { Candles, liveCandle, series } from '../lib/Candles';
import { Canvas2D, H, SAFE, Slam, W, useT } from '../lib/frame';
import { InkField } from '../lib/InkField';
import { clamp, easeOut, lerp, shakeAt, slamK, smooth } from '../lib/motion';
import { Medallion, Pips } from '../lib/ui';
import { FPS, RIVAL, T, YOU, sec } from '../data';

const fr = (s: number) => Math.round(s * FPS);

// ---------------------------------------------------------------- versus
export const Versus: React.FC = () => {
  const V = T.versus;
  const t = useT(V.start);
  const dur = sec(V.end) - sec(V.start);
  const band = slamK(t, V.start + 0.05, 1.25, 0.14);
  const bandOpen = easeOut(clamp((t - V.start) / 0.12));
  const sh = shakeAt(t, [{ t: V.start + 0.05, px: 6, dur: 0.38 }]);
  const you: ShotSpec = {
    character: 'starter-perma-bull', format: '4:5', fps: FPS, durationInFrames: dur,
    camera: { push: [1.04, 1.1], truck: [-14, 0] }, ambient: { breath: 0.005, sway: 0.25 }, atmosphere: { dust: 60, ink: 14, bokeh: 3 },
  };
  const rival: ShotSpec = { ...you, character: 'last-legend', camera: { push: [1.04, 1.1], truck: [14, 0] } };
  const bandY = 850;
  const bandH = 220;
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: bandY + 20, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: -40, width: 1080, height: 1350 }}><CharacterShot spec={you} /></div>
        </div>
        <div style={{ position: 'absolute', left: 0, top: bandY + bandH - 20, width: W, height: H - (bandY + bandH - 20), overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 10, width: 1080, height: 1350 }}><CharacterShot spec={rival} /></div>
        </div>
        {/* the versus band */}
        <div style={{ position: 'absolute', left: 0, top: bandY, width: W, height: bandH, transform: `scaleY(${bandOpen}) scale(${band.s})`, opacity: band.a }}>
          <div style={{ position: 'absolute', inset: 0, background: BAND, boxShadow: '0 0 0 4px #16130f, 0 20px 50px rgba(0,0,0,0.6)' }} />
          <Canvas2D style={{ width: W, height: H, top: -bandY }} draw={(ctx) => {
            ctx.save();
            ctx.translate(0, 0);
            drawSlash(ctx, { from: [0.6, (bandY - 30) / H], to: [0.42, (bandY + bandH + 30) / H], width: 120 }, 10, 6, W, H, 'paper');
            ctx.restore();
          }} />
          <div style={{ position: 'absolute', left: SAFE.x + 10, top: 46, fontFamily: DELA, fontSize: 104, lineHeight: 1, color: PAPER.red }}>YOU</div>
          <div style={{ position: 'absolute', right: SAFE.x + 10, top: 46, fontFamily: DELA, fontSize: 104, lineHeight: 1, color: PAPER.ink }}>deano</div>
          <div style={{ position: 'absolute', left: SAFE.x + 14, top: 166 }}><Pips lives={1} size={30} you t={t} /></div>
          <div style={{ position: 'absolute', right: SAFE.x + 14, top: 166 }}><Pips lives={1} size={30} t={t} /></div>
          <div style={{ position: 'absolute', left: W / 2 - 60, top: 46, width: 120, textAlign: 'center', fontFamily: YUJI, fontSize: 124, lineHeight: 1, color: PAPER.ink }}>対</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- close-ups
const CloseUp: React.FC<{ who: 'you' | 'rival' }> = ({ who }) => {
  const C = who === 'you' ? T.cuYou : T.cuRival;
  const t = useT(C.start);
  const dur = sec(C.end) - sec(C.start);
  const lockF = fr(C.lock - C.start);
  const spec: ShotSpec = {
    character: who === 'you' ? 'starter-perma-bull' : 'last-legend', format: '4:5', fps: FPS, durationInFrames: dur,
    camera: { push: [1.18, 1.3], truck: [who === 'you' ? -10 : 10, 0], toTarget: 0.9, offset: 20 },
    ambient: { breath: 0.005, sway: 0.2 }, atmosphere: { dust: 50, ink: 10, bokeh: 2 },
    impact: {
      frame: lockF, ...IMPACT_HOUSE, punch: 0.06,
      seal: who === 'you' ? { glyph: '決', at: [0.8, 0.78], size: 200 } : false,
    },
  };
  const dir = who === 'you' ? 'UP' : 'DOWN';
  const k = slamK(t, C.lock, 1.4, 0.14);
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 120, width: 1080, height: 1350 }}><CharacterShot spec={spec} /></div>
      {/* the pick, in the sumi block under the painting (never across the face) */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1440, height: 300, background: SUMI.bg, boxShadow: '0 -4px 0 0 rgba(239,231,216,0.25)', opacity: k.a }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 28, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: '0.2em', paddingLeft: '0.2em', color: who === 'you' ? SUMI.red : SUMI.ink }}>
          {who === 'you' ? 'YOU' : 'deano'}
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 86, textAlign: 'center', fontFamily: DELA, fontSize: 140, lineHeight: 1, color: dir === 'UP' ? UP : DOWN, transform: `scale(${k.s})` }}>
          {dir === 'UP' ? '▲ UP' : '▼ DOWN'}
        </div>
      </div>
    </AbsoluteFill>
  );
};
export const CloseUpYou: React.FC = () => <CloseUp who="you" />;
export const CloseUpRival: React.FC = () => <CloseUp who="rival" />;

// ---------------------------------------------------------------- the last candle
const HIST = series(3, 7, 41.9, 0.022);
const O = HIST[HIST.length - 1].c;
const C = T.candle;
// the price inside the final minute: it dips under the strike, climbs over, dips again into the silence, then
// rips up at the close
function px(u: number) {
  const wav = 0.018 * Math.sin(u * Math.PI * 3.1 + 2.6) * (1 - 0.4 * u);
  const rip = 0.05 * smooth((u - 0.93) / 0.07);
  return O + wav - 0.004 + rip + 0.002 * Math.sin(u * 61);
}
const lo = O - 0.032;
const hi = O + 0.07;

export const LastCandle: React.FC = () => {
  const t = useT(C.start);
  const u = clamp((t - C.start) / (C.close - C.start), 0, 1);
  const live = liveCandle(O, px, u);
  const closed = t >= C.close;
  const since = t - C.close;
  const f = Math.round(since * FPS);
  // impact frame: 1 paper-white frame, then 2 ink-negative frames
  const paperFlash = closed && f === 0;
  const inkNeg = closed && (f === 1 || f === 2);
  const sh = shakeAt(t, [{ t: C.start, px: 6, dur: 0.3 }, { t: C.close, px: 18, dur: 0.65 }]);
  const enter = easeOut(clamp((t - C.start) / 0.25));
  // the arcade timer: 0:03 -> 0:01, the vermilion bar drains to the close
  const remain = Math.max(0, C.close - t);
  const secs = Math.min(3, Math.ceil(remain / ((C.close - C.start) / 3)));
  const youD = 250;
  const bigUp = live.c >= live.o;
  const tense = t >= C.silence && !closed ? (t - C.silence) / (C.close - C.silence) : 0;
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden', filter: inkNeg ? 'grayscale(1) contrast(30) invert(1) sepia(0.15)' : undefined }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(${lerp(1.06, 1, enter) + 0.02 * tense})`, transformOrigin: '540px 900px' }}>
        <InkField W={W} H={H} t={t} flood={1} swirl={1.2} light={closed ? 0.7 * Math.exp(-since * 2.5) + 0.2 : 0.3 + 0.15 * tense} lightAt={[0.5, 0.42]} lightR={0.55}
          lightCol={closed || bigUp ? [0.1, 0.3, 0.17] : [0.3, 0.08, 0.12]} />
        {/* the giant candle */}
        <div style={{ position: 'absolute', left: 90, top: 330, width: 900, height: 900, opacity: enter }}>
          <Candles w={900} h={900} data={HIST} live={live} strike={O} lo={lo} hi={hi} bodyW={230} gap={60} strikeLabel={false} fade={0.3} centerLast />
          {closed && <Slam t={t} t0={C.close} y={-6} size={120} color={UP} align="center">▲ UP</Slam>}
        </div>
        {/* the slash: your win, behind the two faces */}
        {closed && (
          <Canvas2D draw={(ctx) => drawSlash(ctx, { from: [-0.02, 0.8], to: [1.03, 0.69], width: 130, reveal: 3 }, fr(since) + 100, 100, W, H, 'sumi')} />
        )}
        <Medallion p={YOU} x={280} y={1490} d={youD} t={t} labelSize={36} s={{ grey: 0, lives: 1, pick: 'UP', pickAt: C.start + 0.1, flash: closed ? 0.5 * Math.exp(-since * 8) : 0 }} />
        <Medallion p={RIVAL} x={800} y={1490} d={youD} t={t} labelSize={36}
          s={{ grey: closed ? clamp((since - 0.05) / 0.12) : 0, lives: 0, lostAt: C.close + 0.04, pick: closed && since > 0.35 ? undefined : 'DOWN', pickAt: C.start + 0.16, outAt: C.close + 0.16, flash: closed ? 0.8 * Math.exp(-since * 9) : 0 }} />
        <div style={{ position: 'absolute', left: 480, width: 120, top: 1420, textAlign: 'center', fontFamily: YUJI, fontSize: 96, color: SUMI.ink, opacity: closed ? 1 - clamp(since / 0.2) : 1 }}>対</div>
      </div>
      {/* the arcade timer (outside the shake: the HUD) */}
      {!closed && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: SAFE.y + 6, textAlign: 'center' }}>
          <div style={{ fontFamily: DELA, fontSize: 150, lineHeight: 1, color: SUMI.ink }}>0:0{Math.max(1, secs)}</div>
          <div style={{ margin: '16px auto 0', width: 560, height: 16, background: SUMI.surface2 }}>
            <div style={{ width: `${(remain / (C.close - C.start)) * 100}%`, height: '100%', background: SUMI.red }} />
          </div>
        </div>
      )}
      {closed && <Slam t={t} t0={C.close + 0.2} y={SAFE.y + 30} size={100} color={SUMI.ink}>deano OUT</Slam>}
      {paperFlash && <AbsoluteFill style={{ background: '#fff8ea' }} />}
    </AbsoluteFill>
  );
};
