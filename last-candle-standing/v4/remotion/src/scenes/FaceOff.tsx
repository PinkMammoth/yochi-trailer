// V2 0:12.3-0:17.7 (music: the breakdown, then the return slam). The final two, one life each.
//   versus    16:9: YOU left, deano right, the paper versus band across them (対, the vermilion slash)
//             9:16: YOU above, deano below, the band between
//   close-ups each face (2.5D, punch-in on the lock), the pick in its own block: YOU ▲ UP (決), deano ▼ DOWN
//   candle    the giant live candle between/over both faces; the arcade timer drains; a true silence; the
//             return slam is the close: ▲ UP, deano's last life goes, 敗, deano OUT
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CharacterShot, IMPACT_HOUSE, drawSlash, type ShotSpec } from '../../../../../yochi-2p5d/remotion/src/lib';
import { BAND, DELA, DOWN, MONO, PAPER, SUMI, UP, YUJI } from '../lib/brand';
import { Candles, liveCandle, series } from '../lib/Candles';
import { Canvas2D, Slam, pick, useFmt, useT } from '../lib/frame';
import { InkField } from '../lib/InkField';
import { clamp, easeOut, lerp, shakeAt, slamK, smooth } from '../lib/motion';
import { Medallion, Pips } from '../lib/ui';
import { Motes } from '../lib/Motes';
import { FPS, RIVAL, T, YOU, sec } from '../data';
import { PoolHud } from './Hud';

const fr = (s: number) => Math.round(s * FPS);
/** a 4:5 CharacterShot (1080x1350) placed and scaled into a box */
const Shot45: React.FC<{ spec: ShotSpec; x: number; y: number; scale: number; clip: { x: number; y: number; w: number; h: number } }> = ({ spec, x, y, scale, clip }) => (
  <div style={{ position: 'absolute', left: clip.x, top: clip.y, width: clip.w, height: clip.h, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: x - clip.x, top: y - clip.y, width: 1080, height: 1350, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
      <CharacterShot spec={spec} />
    </div>
  </div>
);

// ---------------------------------------------------------------- versus
export const Versus: React.FC = () => {
  const V = T.versus;
  const t = useT(V.start);
  const { land, W, H, safe } = useFmt();
  const dur = sec(V.end) - sec(V.start);
  const band = slamK(t, V.start, 1.25, 0.14);
  const bandOpen = easeOut(clamp((t - V.start) / 0.12));
  const sh = shakeAt(t, [{ t: V.start, px: 6, dur: 0.38 }]);
  const you: ShotSpec = {
    character: 'starter-perma-bull', format: '4:5', fps: FPS, durationInFrames: dur,
    camera: { push: [1.04, 1.15], truck: [-18, 0] }, ambient: { breath: 0.007, sway: 0.35 }, atmosphere: { dust: 90, ink: 18, bokeh: 4, wind: 1.2 },
  };
  const rival: ShotSpec = { ...you, character: 'last-legend', camera: { push: [1.04, 1.15], truck: [18, 0] } };
  const bandY = land ? 790 : 850;
  const bandH = land ? 190 : 220;
  const nameSize = land ? 110 : 104;
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        {land ? (
          <>
            <Shot45 spec={you} x={-0} y={-60} scale={0.9} clip={{ x: 0, y: 0, w: 956, h: H }} />
            <Shot45 spec={rival} x={964} y={-60} scale={0.9} clip={{ x: 964, y: 0, w: 956, h: H }} />
            <div style={{ position: 'absolute', left: 956, width: 8, top: 0, height: H, background: '#16130f' }} />
          </>
        ) : (
          <>
            <Shot45 spec={you} x={0} y={-40} scale={1} clip={{ x: 0, y: 0, w: W, h: bandY + 20 }} />
            <Shot45 spec={rival} x={0} y={bandY + bandH - 20 + 10} scale={1} clip={{ x: 0, y: bandY + bandH - 20, w: W, h: H - (bandY + bandH - 20) }} />
          </>
        )}
        <div style={{ position: 'absolute', left: 0, top: bandY, width: W, height: bandH, transform: `scaleY(${bandOpen}) scale(${band.s})`, opacity: band.a }}>
          <div style={{ position: 'absolute', inset: 0, background: BAND, boxShadow: '0 0 0 4px #16130f, 0 20px 50px rgba(0,0,0,0.6)' }} />
          <Canvas2D style={{ width: W, height: H, top: -bandY }} draw={(ctx) => {
            drawSlash(ctx, { from: [0.5 + (land ? 0.035 : 0.1), (bandY - 30) / H], to: [0.5 - (land ? 0.035 : 0.08), (bandY + bandH + 30) / H], width: land ? 110 : 120 }, 10, 6, W, H, 'paper');
          }} />
          <div style={{ position: 'absolute', left: safe.x + 10, top: land ? 22 : 46, fontFamily: DELA, fontSize: nameSize, lineHeight: 1, color: PAPER.red }}>YOU</div>
          <div style={{ position: 'absolute', right: safe.x + 10, top: land ? 22 : 46, fontFamily: DELA, fontSize: nameSize, lineHeight: 1, color: PAPER.ink }}>deano</div>
          <div style={{ position: 'absolute', left: safe.x + 14, top: land ? 140 : 166 }}><Pips lives={1} size={land ? 32 : 30} you t={t} /></div>
          <div style={{ position: 'absolute', right: safe.x + 14, top: land ? 140 : 166 }}><Pips lives={1} size={land ? 32 : 30} t={t} /></div>
          <div style={{ position: 'absolute', left: W / 2 - 70, top: land ? 30 : 46, width: 140, textAlign: 'center', fontFamily: YUJI, fontSize: land ? 130 : 124, lineHeight: 1, color: PAPER.ink }}>対</div>
          {land && <div style={{ position: 'absolute', left: safe.x + 110, top: 146, fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: '0.2em', color: PAPER.muted }}>LAST LIFE</div>}
          {land && <div style={{ position: 'absolute', right: safe.x + 110, top: 146, fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: '0.2em', color: PAPER.muted }}>LAST LIFE</div>}
        </div>
      </div>
      <Motes t={t} n={50} strength={0.8} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- close-ups
const CloseUp: React.FC<{ who: 'you' | 'rival' }> = ({ who }) => {
  const C = who === 'you' ? T.cuYou : T.cuRival;
  const t = useT(C.start);
  const { land, W, H } = useFmt();
  const dur = sec(C.end) - sec(C.start);
  const lockF = fr(C.lock - C.start);
  const spec: ShotSpec = {
    character: who === 'you' ? 'starter-perma-bull' : 'last-legend', format: '4:5', fps: FPS, durationInFrames: dur,
    camera: { push: [1.16, 1.36], truck: [who === 'you' ? -14 : 14, 0], toTarget: 0.9, offset: 20 },
    ambient: { breath: 0.007, sway: 0.3 }, atmosphere: { dust: 80, ink: 14, bokeh: 3, wind: 1.2 },
    impact: { frame: lockF, ...IMPACT_HOUSE, punch: 0.06, seal: who === 'you' ? { glyph: '決', at: [0.8, land ? 0.6 : 0.78], size: 200 } : false },
  };
  const dir = who === 'you' ? 'UP' : 'DOWN';
  const k = slamK(t, C.lock, 1.4, 0.14);
  // 16:9: the painting fills the left 1180 px; the pick block is the right panel. 9:16: painting above, block below.
  const panel: React.CSSProperties = land
    ? { left: 1180, top: 0, width: W - 1180, height: H }
    : { left: 0, top: 1440, width: W, height: 300 };
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      {land ? <Shot45 spec={spec} x={0} y={30} scale={1.0926} clip={{ x: 0, y: 0, w: 1180, h: H }} /> : <Shot45 spec={spec} x={0} y={120} scale={1} clip={{ x: 0, y: 0, w: W, h: H }} />}
      <div style={{ position: 'absolute', ...panel, background: SUMI.bg, boxShadow: land ? '-4px 0 0 0 rgba(239,231,216,0.25)' : '0 -4px 0 0 rgba(239,231,216,0.25)', opacity: k.a }}>
        <div style={{ position: 'absolute', left: 0, right: land ? 40 : 0, top: land ? 410 : 28, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: land ? 44 : 40, letterSpacing: '0.2em', paddingLeft: '0.2em', color: who === 'you' ? SUMI.red : SUMI.ink }}>
          {who === 'you' ? 'YOU PICK' : 'deano PICKS'}
        </div>
        <div style={{ position: 'absolute', left: 0, right: land ? 40 : 0, top: land ? 476 : 86, textAlign: 'center', fontFamily: DELA, fontSize: land ? 128 : 140, lineHeight: 1, color: dir === 'UP' ? UP : DOWN, transform: `scale(${k.s})` }}>
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
// the price inside the final minute: under the strike, over it, under again into the silence, then it rips up
function px(u: number) {
  const wav = 0.018 * Math.sin(u * Math.PI * 3.1 + 2.6) * (1 - 0.4 * u);
  const rip = 0.05 * smooth((u - 0.95) / 0.05);
  return O + wav - 0.004 + rip + 0.002 * Math.sin(u * 61);
}
const lo = O - 0.032;
const hi = O + 0.07;

export const LastCandle: React.FC = () => {
  const t = useT(C.start);
  const { land, W, H, safe } = useFmt();
  // the candle hangs, crimson, through the silence; the close is the slam
  const u = clamp((Math.min(t, C.silence) - C.start) / (C.close - C.start), 0, 1);
  const live = liveCandle(O, px, t >= C.close ? 1 : u);
  const closed = t >= C.close;
  const since = t - C.close;
  const f = Math.round(since * FPS);
  const paperFlash = closed && f === 0;
  const inkNeg = closed && (f === 1 || f === 2);
  const sh = shakeAt(t, [{ t: C.start, px: 6, dur: 0.3 }, { t: C.close, px: 18, dur: 0.65 }]);
  const enter = easeOut(clamp((t - C.start) / 0.25));
  const remain = Math.max(0, C.close - t);
  const secs = Math.min(3, Math.ceil(remain / ((C.close - C.start) / 3)));
  const bigUp = live.c >= live.o;
  const tense = t >= C.silence && !closed ? (t - C.silence) / (C.close - C.silence) : 0;
  const G = land
    ? { chart: { x: 470, y: 230, w: 980, h: 720, body: 220, gap: 60 }, you: { x: 270, y: 470 }, riv: { x: 1650, y: 470 }, d: 290, slash: { from: [-0.02, 0.88] as [number, number], to: [1.02, 0.76] as [number, number] }, versus: null as null | { x: number; y: number } }
    : { chart: { x: 90, y: 330, w: 900, h: 900, body: 230, gap: 60 }, you: { x: 280, y: 1490 }, riv: { x: 800, y: 1490 }, d: 250, slash: { from: [-0.02, 0.8] as [number, number], to: [1.03, 0.69] as [number, number] }, versus: { x: 540, y: 1470 } };
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden', filter: inkNeg ? 'grayscale(1) contrast(30) invert(1) sepia(0.15)' : undefined }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(${lerp(1.06, 1, enter) + 0.025 * tense + (closed ? 0.07 * Math.exp(-since * 6) : 0)})`, transformOrigin: `${W / 2}px ${H * 0.47}px` }}>
        <InkField W={W} H={H} t={t} flood={1} swirl={1.2} light={closed ? 0.7 * Math.exp(-since * 2.5) + 0.2 : 0.3 + 0.15 * tense} lightAt={[0.5, 0.42]} lightR={0.55}
          lightCol={closed || bigUp ? [0.1, 0.3, 0.17] : [0.3, 0.08, 0.12]} />
        {/* V4: the close throws a ring of green light out from the candle */}
        {closed && since < 0.7 && (
          <div style={{ position: 'absolute', left: W / 2 - 50, top: G.chart.y + G.chart.h * 0.45 - 50, width: 100, height: 100, borderRadius: '50%',
            boxShadow: `0 0 ${60 + 200 * since}px ${20 + 60 * since}px rgba(61,220,132,${0.45 * (1 - since / 0.7)})`, transform: `scale(${1 + since * 14})`, border: `3px solid rgba(61,220,132,${0.5 * (1 - since / 0.7)})` }} />
        )}
        <div style={{ position: 'absolute', left: G.chart.x, top: G.chart.y, width: G.chart.w, height: G.chart.h, opacity: enter, overflow: land ? 'hidden' : undefined }}>
          <Candles w={G.chart.w} h={G.chart.h} data={HIST} live={live} strike={O} lo={lo} hi={hi} bodyW={G.chart.body} gap={G.chart.gap} strikeLabel={false} fade={0.3} centerLast />
          {closed && <Slam t={t} t0={C.close} y={land ? 8 : -6} size={land ? 104 : 120} color={UP} cx={G.chart.w / 2} cw={G.chart.w}>▲ UP</Slam>}
        </div>
        {closed && <Canvas2D draw={(ctx) => drawSlash(ctx, { ...G.slash, width: 130, reveal: 3 }, fr(since) + 100, 100, W, H, 'sumi')} />}
        <Medallion p={YOU} x={G.you.x} y={G.you.y} d={G.d} t={t} labelSize={38} s={{ grey: 0, lives: 1, pick: 'UP', pickAt: C.start + 0.1, chip: 0.17, flash: closed ? 0.5 * Math.exp(-since * 8) : 0, pop: closed ? Math.exp(-since * 5) * Math.min(1, since * 25) : 0 }} />
        <Medallion p={RIVAL} x={G.riv.x} y={G.riv.y} d={G.d} t={t} labelSize={38}
          s={{ grey: closed ? clamp((since - 0.05) / 0.12) : 0, lives: 0, lostAt: C.close + 0.04, pick: 'DOWN', pickAt: C.start + 0.16, wrongAt: C.close + 0.05, chip: 0.17, chipLeft: land, outAt: C.close + 0.16, flash: closed ? 0.8 * Math.exp(-since * 9) : 0 }} />
        {G.versus && <div style={{ position: 'absolute', left: G.versus.x - 60, width: 120, top: G.versus.y - 50, textAlign: 'center', fontFamily: YUJI, fontSize: 96, color: SUMI.ink, opacity: closed ? 1 - clamp(since / 0.2) : 1 }}>対</div>}
      </div>
      {!closed && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: safe.y + (land ? 0 : 6), textAlign: 'center' }}>
          <div style={{ fontFamily: DELA, fontSize: land ? 110 : 150, lineHeight: 1, color: SUMI.ink }}>0:0{Math.max(1, secs)}</div>
          <div style={{ margin: '14px auto 0', width: land ? 420 : 560, height: 14, background: SUMI.surface2 }}>
            <div style={{ width: `${(remain / (C.close - C.start)) * 100}%`, height: '100%', background: SUMI.red }} />
          </div>
        </div>
      )}
      {closed && <Slam t={t} t0={C.close + 0.17} y={safe.y + (land ? 0 : 30)} size={land ? 88 : 100} color={SUMI.ink}>deano OUT</Slam>}
      {!paperFlash && <PoolHud t={t} t0={-1} />}
      {paperFlash && <AbsoluteFill style={{ background: '#fff8ea' }} />}
    </AbsoluteFill>
  );
};
