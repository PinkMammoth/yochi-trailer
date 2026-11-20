// 5.46-8.08: the candle. It runs his way (long enough to believe it), then the reversal: the body collapses through
// the strike and closes crimson, leaving a long upper wick where his win was. Then his last grin.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { DELA, DOWN, MONO, SUMI, UP } from '../lib/brand';
import { Candles, liveCandle, series } from '../lib/Candles';
import { Painting, type Cam } from '../lib/camera';
import { useFmt } from '../lib/frame';
import { Panel, bbox, type Pt } from '../lib/manga';
import { clamp, easeIn, easeInOut, easeOut, lerp, shakeAt, smooth } from '../lib/motion';
import { Motes } from '../lib/Motes';
import { FPS, MATCH, T, fr } from '../data';

const HIST = series(2, 23, 41.9, 0.018);
export const O = HIST[HIST.length - 1].c;
const U0 = T.candle.start, U1 = T.close;
/** the price inside the minute: up and up (his), a stall, then it breaks down through the strike and closes under */
export function price(u: number) {
  const up = 0.032 * smooth(u / 0.7);
  const down = 0.052 * smooth((u - 0.73) / 0.2);
  return O + up - down + 0.0016 * Math.sin(u * 47) * (1 - 0.6 * u) + 0.001 * Math.sin(u * 131);
}
export const LO = O - 0.03, HI = O + 0.045;
export const uAt = (t: number) => clamp((t - U0) / (U1 - U0));

const chipStyle = (pick: 'UP' | 'DOWN', size: number): React.CSSProperties => ({
  fontFamily: DELA, fontSize: size, lineHeight: 1, padding: `${size * 0.28}px ${size * 0.42}px ${size * 0.22}px`, borderRadius: 12,
  color: pick === 'UP' ? UP : DOWN, background: SUMI.surface1, boxShadow: `0 0 0 3px ${pick === 'UP' ? UP : DOWN}`, whiteSpace: 'nowrap',
});

const Chart: React.FC<{ t: number; w: number; h: number; body: number }> = ({ t, w, h, body }) => {
  const live = liveCandle(O, price, uAt(t));
  return <Candles w={w} h={h} data={HIST} live={live} strike={O} lo={LO} hi={HI} bodyW={body} gap={body * 0.35} strikeLabel={false} fade={0.25} centerLast />;
};

const Timer: React.FC<{ t: number; size: number }> = ({ t, size }) => {
  const remain = Math.max(0, U1 - t);
  const secs = Math.max(0, Math.ceil((remain / (U1 - U0)) * 3));
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: DELA, fontSize: size, lineHeight: 1.05, color: SUMI.ink }}>0:0{secs}</div>
      <div style={{ margin: '8px auto 0', width: size * 4.4, height: 12, background: SUMI.surface2 }}>
        <div style={{ width: `${(remain / (U1 - U0)) * 100}%`, height: '100%', background: SUMI.red }} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- 5. the minute opens: him · the candle · her
export const CandleOpen: React.FC = () => {
  const S = T.candle;
  const t = S.start + useCurrentFrame() / FPS;
  const { land, W, H, safe } = useFmt();
  const dur = fr(S.end - S.start);
  const enter = easeOut((t - S.start) / 0.2);
  const sh = shakeAt(t, [{ t: S.start, px: 5, dur: 0.3 }]);
  const L: Pt[] = land ? [[0, 0], [560, 0], [520, H], [0, H]] : [[0, 0], [W, 0], [W, 520], [0, 600]];
  const R: Pt[] = land ? [[1400, 0], [W, 0], [W, H], [1360, H]] : [[0, 1380], [W, 1300], [W, H], [0, H]];
  const ch = land ? { x: 600, y: 300, w: 720, h: 640, body: 170 } : { x: 120, y: 720, w: 840, h: 520, body: 190 };
  const drift = (t - S.start) / 1.36;
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${lerp(1.04, 1, enter)})` }}>
        <Panel poly={L}><Painting id="rampage" cam={{ x: 1000, y: land ? 640 : 560, z: (land ? 0.98 : 1.05) * lerp(1, 1.04, drift) }} dur={dur} at={land ? [290, 520] : [540, 300]} box={bbox(L)} /></Panel>
        <Panel poly={R}><Painting id="duel-master" cam={{ x: 870, y: land ? 650 : 620, z: (land ? 0.98 : 1.05) * lerp(1, 1.04, drift) }} dur={dur} at={land ? [1650, 520] : [540, 1640]} box={bbox(R)} ambient={{ breath: 0.012, sway: 0.5 }} /></Panel>
        <div style={{ position: 'absolute', left: ch.x, top: land ? safe.y + 40 : 520 + 34, width: ch.w }}><Timer t={t} size={land ? 84 : 84} /></div>
        <div style={{ position: 'absolute', left: ch.x, top: ch.y, width: ch.w, height: ch.h, opacity: enter, overflow: 'hidden' }}>
          <Chart t={t} w={ch.w} h={ch.h} body={ch.body} />
        </div>
        <div style={{ position: 'absolute', left: safe.x, bottom: land ? safe.y + 10 : undefined, top: land ? undefined : 600 - 150 }}><div style={chipStyle('UP', 52)}>▲ UP</div></div>
        <div style={{ position: 'absolute', right: safe.x, bottom: safe.y + 10 }}><div style={chipStyle('DOWN', 52)}>▼ DOWN</div></div>
      </AbsoluteFill>
      <Motes t={t} n={30} strength={0.5} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 6. it runs his way: his grin, the green candle beside him
export const Winning: React.FC = () => {
  const S = T.winning;
  const t = S.start + useCurrentFrame() / FPS;
  const { land, W, H } = useFmt();
  const dur = fr(S.end - S.start);
  const k = (t - S.start) / (S.end - S.start);
  const L: Pt[] = land ? [[0, 0], [1240, 0], [1140, H], [0, H]] : [[0, 0], [W, 0], [W, 1180], [0, 1300]];
  const ch = land ? { x: 1260, y: 170, w: 560, h: 760, body: 200 } : { x: 140, y: 1330, w: 800, h: 520, body: 200 };
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <Panel poly={L}><Painting id="rampage" cam={{ x: 1000, y: 560, z: 1.25 * lerp(1, 1.07, easeInOut(k)) }} dur={dur} at={land ? [600, 540] : [560, 640]} box={bbox(L)} /></Panel>
      <div style={{ position: 'absolute', left: ch.x, top: ch.y, width: ch.w, height: ch.h, overflow: 'hidden' }}><Chart t={t} w={ch.w} h={ch.h} body={ch.body} /></div>
      <Motes t={t} n={30} strength={0.5} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 7. the reversal: the candle, full frame
export const Reversal: React.FC = () => {
  const S = T.reversal;
  const t = S.start + useCurrentFrame() / FPS;
  const { land, W, H, safe } = useFmt();
  const sh = shakeAt(t, [{ t: S.start, px: 6, dur: 0.3 }, { t: S.cross, px: 10, dur: 0.45 }]);
  const push = 1 + 0.06 * easeIn((t - S.start) / (S.end - S.start));
  const ch = land ? { x: 460, y: 120, w: 1000, h: 860, body: 280 } : { x: 90, y: 360, w: 900, h: 1180, body: 300 };
  const crossed = t >= S.cross;
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${push})` }}>
        {crossed && <AbsoluteFill style={{ background: `radial-gradient(ellipse 40% 50% at 50% 55%, rgba(255,77,109,${0.16 * Math.exp(-(t - S.cross) * 4)}), rgba(15,13,11,0) 70%)` }} />}
        <div style={{ position: 'absolute', left: ch.x, top: ch.y, width: ch.w, height: ch.h, overflow: 'hidden' }}><Chart t={t} w={ch.w} h={ch.h} body={ch.body} /></div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: safe.x, bottom: safe.y }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: '0.2em', color: SUMI.muted, marginBottom: 12 }}>{MATCH.him.handle}</div>
        <div style={chipStyle('UP', 48)}>▲ UP</div>
      </div>
      <div style={{ position: 'absolute', right: safe.x, bottom: safe.y, textAlign: 'right' }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: '0.2em', color: SUMI.muted, marginBottom: 12 }}>{MATCH.her.handle}</div>
        <div style={{ display: 'inline-block', ...chipStyle('DOWN', 48) }}>▼ DOWN</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 8. his last grin (he hasn't seen it yet): the match-cut framing
/** the match point: his face lands here, at this zoom, in both the grin and the disbelief shots */
export const matchCam = (land: boolean) => ({ at: (land ? [1290, 205] : [610, 200]) as [number, number], z: 1.6 });
export const LastGrin: React.FC = () => {
  const S = T.lastGrin;
  const t = S.start + useCurrentFrame() / FPS;
  const { land } = useFmt();
  const dur = fr(S.end - S.start);
  const m = matchCam(land);
  const z = m.z * lerp(1.0, 1.03, easeOut((t - S.start) / (S.end - S.start)));
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <Painting id="rampage" cam={{ x: 1030, y: 412, z }} dur={dur} at={m.at} atmosphere={{ dust: 60, ink: 10, bokeh: 2, wind: 1 }} />
    </AbsoluteFill>
  );
};
