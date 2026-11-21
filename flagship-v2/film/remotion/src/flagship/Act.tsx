// FLAGSHIP v2: everything after THE LAST STAND's approved victory reveal. A rough animatic: compositions, blocking,
// timing and story. The cast are the house cut-outs; every NEW pose stands in as the canonical figure, desaturated,
// outlined and labelled with its brief id; every new environment is procedural placeholder geometry.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { brushWipe } from '../lib/brush';
import { Canvas2D } from '../lib/frame';
import { clamp, easeIn, easeInOut, easeOut, lerp, riseK, shakeAt, slamK, stampK } from '../lib/motion';
import { StampSeal } from '../lib/manga';
import timing from './timing.json';
import { Chart, liveFrom } from './ui';
import { CAST, CYAN, DELA, DOWN, Dark, Fig, MONO, PAPER, Placeholder, SUMI, Slate, UP, UP_PAPER, Unv, YUJI, ZEN } from './tokens';
import { Gorge, Plane, REF } from './world';

export const FT = timing;
const BEAT = FT.beat;
/** video time of source bar n, plus b beats */
export const Bt = (n: number, b = 0) => (FT.bars as Record<string, number>)[String(n)] + b * BEAT;
const k = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const C = FT.candle, X = FT.close, P = FT.pull;

// ------------------------------------------------------------------ the FFA match (fictional; numbers UNVERIFIED)
// Parimutuel: the side that's right splits the pool less the rake, pro rata to stake (FEASIBILITY.md section 5).
export const POOL = { up: 5120, down: 7360, rake: 0.05 };
const mUp = ((POOL.up + POOL.down) * (1 - POOL.rake)) / POOL.up;
const net = (stake: number) => stake * mUp - stake;
const usd = (x: number) => x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const STRIKE = 41.79;
/** The 5-minute candle over the film: it opens and dives (DOWN in charge), sits deep, turns on the build, climbs, rides the strike, closes just above it. */
const price = (t: number) => {
  const dive = easeOut(k(t, C.open, C.deep)), climb = easeInOut(k(t, C.turn, C.edge));
  const edge = t > C.edge ? 0.012 * Math.sin((t - C.edge) * 9) + 0.02 * k(t, C.last, C.close) : 0;
  return STRIKE - 0.15 * dive + 0.16 * climb + edge + 0.006 * Math.sin(t * 13);
};
const candleAt = (t: number) => liveFrom((u) => price(lerp(C.open, Math.min(t, C.close), u)), 1);
const clock = (t: number) => {
  const s = Math.max(0, 300 * (1 - k(t, C.open, C.close)));
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

// ------------------------------------------------------------------ pieces
const Paper: React.FC = () => <AbsoluteFill style={{ background: PAPER.bg }} />;
const Sumi: React.FC = () => <AbsoluteFill style={{ background: SUMI.bg }} />;
const Tag: React.FC<{ x: number; y: number; handle: string; side: 'UP' | 'DOWN'; stake: number; t: number; at: number; align?: 'left' | 'right'; ground?: 'sumi' | 'paper' }> = ({ x, y, handle, side, stake, t, at, align = 'left', ground = 'sumi' }) => {
  const r = riseK(t, at, 0.3);
  if (t < at) return null;
  return (
    <div style={{ position: 'absolute', left: align === 'left' ? x : undefined, right: align === 'right' ? 1920 - x : undefined, top: y + r.y, opacity: r.a, textAlign: align,
      background: ground === 'sumi' ? 'rgba(15,13,11,0.7)' : 'rgba(242,236,224,0.85)', padding: '6px 16px' }}>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: '0.15em', color: ground === 'sumi' ? SUMI.muted : PAPER.muted }}>{handle}</div>
      <div style={{ fontFamily: DELA, fontSize: 58, lineHeight: 1.1, color: side === 'UP' ? UP : DOWN }}>{side === 'UP' ? '▲ UP' : '▼ DOWN'}<span style={{ fontFamily: MONO, fontWeight: 800, fontSize: 40, color: ground === 'sumi' ? SUMI.ink : PAPER.ink, marginLeft: 18 }}>{stake}</span><Unv /></div>
    </div>
  );
};
/** A manga panel: an arbitrary convex polygon, clipped, with a hard ink border. */
const Pan: React.FC<{ poly: [number, number][]; children: React.ReactNode; bg?: string; slamAt?: number; t?: number; bw?: number }> = ({ poly, children, bg = SUMI.bg, slamAt, t = 0, bw = 10 }) => {
  const sl = slamAt !== undefined ? slamK(t, slamAt, 1.18, 0.14) : { s: 1, a: 1 };
  if (sl.a === 0) return null;
  const clip = `polygon(${poly.map(([x, y]) => `${x}px ${y}px`).join(',')})`;
  const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length, cy = poly.reduce((a, p) => a + p[1], 0) / poly.length;
  return (
    <div style={{ position: 'absolute', inset: 0, transformOrigin: `${cx}px ${cy}px`, transform: `scale(${sl.s})` }}>
      <div style={{ position: 'absolute', inset: 0, clipPath: clip, background: SUMI.bg }} />
      <div style={{ position: 'absolute', inset: 0, clipPath: clip, background: bg, transform: 'scale(0.995)', transformOrigin: `${cx}px ${cy}px` }}>{children}</div>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}><polygon points={poly.map((p) => p.join(',')).join(' ')} fill="none" stroke={SUMI.bg} strokeWidth={bw} /></svg>
    </div>
  );
};
const BigCandle: React.FC<{ t: number; x: number; y: number; h: number; w?: number; strikeW?: number }> = ({ t, x, y, h, w = 220, strikeW = 1920 }) => (
  <div style={{ position: 'absolute', left: x - w / 2, top: y }}>
    <Chart W={w} H={h} past={[]} live={candleAt(t)} strike={STRIKE} lo={STRIKE - 0.19} hi={STRIKE + 0.11} liveScale={2.2} grid={false} />
    <div style={{ position: 'absolute', left: w / 2 - strikeW / 2, width: strikeW, top: h - ((STRIKE - (STRIKE - 0.19)) / 0.3) * h, borderTop: `3px dashed ${SUMI.ink}`, opacity: 0.55 }} />
  </div>
);
const Super: React.FC<{ t: number; at: number; until: number; children: React.ReactNode; y?: number; size?: number; color?: string }> = ({ t, at, until, children, y = 120, size = 72, color = SUMI.ink }) => {
  const a = Math.min(easeOut(k(t, at, at + 0.3)), 1 - k(t, until - 0.25, until));
  return a > 0 ? <div style={{ position: 'absolute', left: 0, width: 1920, top: y, textAlign: 'center', opacity: a, fontFamily: ZEN, fontWeight: 900, fontSize: size, color }}>{children}</div> : null;
};
const Lbl: React.FC<{ children: React.ReactNode; x?: number; y: number; size?: number; color?: string; center?: boolean }> = ({ children, x = 96, y, size = 30, color = SUMI.ink, center }) => (
  <div style={{ position: 'absolute', left: center ? 0 : x, width: center ? 1920 : undefined, textAlign: center ? 'center' : 'left', top: y, fontFamily: MONO, fontWeight: 800, fontSize: size, letterSpacing: '0.2em', color }}>{children}</div>
);

// ------------------------------------------------------------------ R1-R3: THE REVEAL (bars 76-82)
const VA = { w: 1672, h: 941 };
// THE LAST STAND's victory camera at the pull's start (Victory.tsx: push 1.0 -> 1.045, drift +60 / -10 over 11.07-17.6)
const vk = easeInOut((P.start - 11.073) / (17.6 - 11.073));
const VC = { x: VA.w / 2 + 60 * vk, y: VA.h / 2 - 10 * vk, z: (1920 / VA.w) * (1 + 0.045 * vk) };
export const dolly = (t: number) =>
  t < P.handover ? 1.05 * easeIn(k(t, P.start, P.handover)) : t < P.world ? 1.05 + 7.95 * easeInOut(k(t, P.handover, P.world)) : 9 + 0.12 * easeOut(k(t, P.world, FT.gather.highRoller));
const rise = (t: number) => -1600 * easeInOut(k(t, P.handover - 0.5, P.world));

const Reveal: React.FC<{ t: number }> = ({ t }) => {
  const d = dolly(t), cy = rise(t), s = 1 / (1 + d);
  const stage2 = t >= P.handover;
  const paperOut = k(t, P.start - 0.1, P.start + 0.6);
  const sweep = clamp(1 - Math.abs(t - P.handover) / 0.18);
  const herShift = cy / (1 + d);
  // her plane: the victory painting's camera point stays at frame centre, scaled by 1 / (1 + d)
  const tr = `translate(960px, ${540 + herShift}px) scale(${VC.z * s}) translate(${-VC.x}px, ${-VC.y}px)`;
  const bottom = 540 + herShift + (VA.h - VC.y) * VC.z * s, left = 960 - VC.x * VC.z * s;
  const title = slamK(t, P.world, 1.3, 0.16);
  return (
    <AbsoluteFill style={{ background: PAPER.bg, overflow: 'hidden' }}>
      <Gorge cam={{ d, cy }} fill={0.35 + 0.65 * k(t, P.world - 1, FT.gather.highRoller)} duels label={stage2}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: VA.w, height: VA.h, transformOrigin: '0 0', transform: tr }}>
          {/* her spire: a weathered stone column falling away into the gorge (E05) */}
          {stage2 && <svg width={1} height={1} style={{ position: 'absolute', overflow: 'visible' }}><polygon points="250,1620 1250,1620 1500,9000 0,9000" fill="rgba(22,19,15,0.7)" /></svg>}
          {!stage2 && <Img src={staticFile('poses/duel-master-victory.webp')} style={{ position: 'absolute', width: VA.w, height: VA.h, opacity: 1 - paperOut }} />}
          <Img src={staticFile('mattes/duel-master-victory.png')} style={{ position: 'absolute', width: VA.w, height: VA.h }} />
          {stage2 && <Placeholder id="B01" what="her full figure: the same victory pose painted down to the feet, planted on the spire top" dark size={34} style={{ left: 330, top: 900, width: 820, height: 720 }} />}
        </div>
      </Gorge>
      {/* stage 1: mist tracked to the painting's crop lines (bottom, left) so they never read as edges */}
      {!stage2 && (
        <>
          <div style={{ position: 'absolute', left: -200, right: -200, top: bottom - 240 * s - 40, height: 2400, background: `linear-gradient(180deg, rgba(242,236,224,0) 0%, rgba(242,236,224,${0.95 * k(t, P.start, P.start + 0.6)}) 22%, rgba(242,236,224,${k(t, P.start, P.start + 0.6)}) 40%)` }} />
          <div style={{ position: 'absolute', top: -200, bottom: -200, left: -2000, width: 2000 + left + 220 * s + 30, background: `linear-gradient(90deg, rgba(242,236,224,${k(t, P.start, P.start + 0.6)}) 82%, rgba(242,236,224,0) 100%)` }} />
        </>
      )}
      <AbsoluteFill style={{ background: PAPER.bg, opacity: sweep * 0.9 }} />
      {title.a > 0 && (
        <div style={{ position: 'absolute', left: 0, width: 1920, top: 70, textAlign: 'center', transform: `scale(${title.s})`, opacity: 1 - k(t, FT.gather.highRoller - 0.5, FT.gather.highRoller) }}>
          <div style={{ fontFamily: DELA, fontSize: 150, color: PAPER.ink, lineHeight: 1 }}>FREE FOR ALL</div>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 30, letterSpacing: '0.3em', color: PAPER.ink, marginTop: 18, opacity: k(t, Bt(81), Bt(81) + 0.3) }}>ONE CANDLE · EVERY STAKE · ONE POOL</div>
        </div>
      )}
      <Slate text={t < P.handover ? `R1 PULLBACK 1 · ADAPTABLE (approved victory pose + matte, tracked mist) · scale ${s.toFixed(2)}` : t < P.world ? `R2 PULLBACK 2 · NEW B01 + E01-E06 · the gateway passes the lens · scale ${s.toFixed(2)}` : 'R3 THE GORGE · establishing · NEW E01-E06'} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ the shots
type ShotFn = (t: number) => React.ReactNode;
const W = (t: number, props: Parameters<typeof Gorge>[0], zoom = 1, ox = 960, oy = 540, extra?: React.ReactNode) => (
  <AbsoluteFill style={{ background: PAPER.bg, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, transformOrigin: `${ox}px ${oy}px`, transform: `scale(${zoom})` }}><Gorge {...props} /></div>
    {extra}
  </AbsoluteFill>
);

export const SHOTS: { id: string; from: number; to: number; fn: ShotFn }[] = [
  // ---------------------------------------------------------- G: the gathering (drop 2, bars 82-87)
  { id: 'G1', from: Bt(82), to: Bt(84), fn: (t) => {
    const p = k(t, Bt(82), Bt(84));
    return W(t, { cam: { d: 9.6 }, label: false }, lerp(2.1, 2.25, p), 420, 620, <>
      <Dark a={0.15} />
      <Fig id="high-roller-v2" x={lerp(700, 660, p)} y={1260} h={1300} pose={t >= Bt(83) ? 'B10' : undefined} poseNote="flips the chip high, head thrown back laughing" />
      <Fig id="starter-doomer" x={1500} y={1280} h={900} sil /><Fig id="ronin" x={1800} y={1300} h={1000} sil /><Fig id="final-three" x={160} y={1300} h={760} sil />
      <Tag x={1180} y={420} handle="high_roll" side="UP" stake={100} t={t} at={Bt(83, 2)} />
      <Slate text="G1 HIGH ROLLER ARRIVES · low angle through the UP crowd · fig ADAPTABLE, chip flip NEW B10" />
    </>);
  } },
  { id: 'G2', from: Bt(84), to: Bt(85), fn: (t) => W(t, { cam: { d: 9.6 }, label: false }, 2.4, 1380, 560, <>
      <Placeholder id="B11" what="High Roller from behind, over-the-shoulder, gold robe and chip hand in the foreground" style={{ left: -40, top: 260, width: 640, height: 880 }} />
      <Fig id="cold-blooded" x={1380} y={760} h={330} />
      <Lbl y={900} x={1180} size={24} color={PAPER.ink}>ACROSS THE GORGE</Lbl>
      <Slate text="G2 OTS: her shoulder, across the drop, Cold Blooded alone on the DOWN edge · NEW B11 (OTS back view)" />
    </>) },
  { id: 'G3', from: Bt(85), to: Bt(86), fn: (t) => (
    <AbsoluteFill style={{ background: SUMI.bg }}>
      <Fig id="cold-blooded" x={1080} y={430} zoom={lerp(1.05, 1.12, k(t, Bt(85), Bt(86)))} />
      <Tag x={110} y={640} handle="frost" side="DOWN" stake={80} t={t} at={Bt(85, 2)} />
      {t >= Bt(85, 2) && <StampSeal t={t} t0={Bt(85, 2)} glyph="決" x={560} y={560} size={90} fill={SUMI.red} ink={SUMI.onRed} />}
      <Slate text="G3 COLD BLOODED picks against the crowd, without looking at it · READY (house cut-out)" />
    </AbsoluteFill>
  ) },
  { id: 'G4', from: Bt(86), to: Bt(88), fn: (t) => {
    const h = FT.gather.ensembleHits;
    return (
      <AbsoluteFill style={{ background: SUMI.bg }}>
        <Pan poly={[[0, 0], [560, 0], [430, 1080], [0, 1080]]} t={t} slamAt={h[0]}><Fig id="untouchable" x={260} y={380} zoom={0.62} /><Tag x={30} y={830} handle="ghost" side="UP" stake={40} t={t} at={h[0] + 0.1} /></Pan>
        <Pan poly={[[580, 0], [1060, 0], [930, 1080], [450, 1080]]} t={t} slamAt={h[1]}><Fig id="last-legend" x={760} y={400} zoom={0.6} /><Tag x={480} y={830} handle="oldguard" side="DOWN" stake={75} t={t} at={h[1] + 0.1} /></Pan>
        <Pan poly={[[1080, 0], [1560, 0], [1430, 1080], [950, 1080]]} t={t} slamAt={h[2]}><Fig id="grudge-settled" x={1250} y={420} zoom={0.6} /><Tag x={980} y={830} handle="foxglove" side="DOWN" stake={30} t={t} at={h[2] + 0.1} /></Pan>
        <Pan poly={[[1580, 0], [1920, 0], [1920, 1080], [1450, 1080]]} t={t} slamAt={h[3]}><Fig id="bloodsport" x={1700} y={420} zoom={0.6} /><Tag x={1880} y={830} handle="vex" side="UP" stake={60} t={t} at={h[3] + 0.1} align="right" /></Pan>
        <Slate text="G4 THE ENSEMBLE · four players, four picks, on the drop's 2-beat hits · READY (house cut-outs; diagonal gutters)" />
      </AbsoluteFill>
    );
  } },
  // ---------------------------------------------------------- L: the lighter section, the pick window (bars 88-95)
  { id: 'L1', from: Bt(88), to: Bt(90), fn: (t) => t < Bt(89) ? W(t, { cam: { d: 9.6 }, label: false }, 2.0, 520, 640, <>
      <Dark a={0.1} />
      <Fig id="whale" x={300} y={1380} h={1350} sil /><Fig id="last-legend" x={1600} y={1400} h={1400} sil /><Fig id="bloodsport" x={1200} y={1420} h={1250} sil />
      <Fig id="starter-lucky-fool" x={820} y={1060} h={560} />
      <Slate text="L1 LUCKY FOOL, small, at the back of the UP crowd · giants in the foreground · READY (starter cut-out)" />
    </>) : (
    <AbsoluteFill style={{ background: SUMI.bg }}>
      <Fig id="starter-lucky-fool" x={900} y={470} zoom={1.15} pose="B13" poseNote="hesitant: the ticket pressed to her lips, eyes darting to the crowd" />
      <Slate text="L1b LUCKY FOOL, close · NEW B13 (hesitation)" />
    </AbsoluteFill>
  ) },
  { id: 'L2', from: Bt(90), to: Bt(92), fn: (t) => t < Bt(91) ? (
    <AbsoluteFill style={{ background: SUMI.bg }}>
      <Placeholder id="B14" what="INSERT: her hand sets the crumpled ticket and a single 5 USDC chip down on the stone ledge, among bigger stacks" size={30} style={{ left: 260, top: 200, width: 1400, height: 680 }} />
      <Tag x={1240} y={760} handle="lucky" side="UP" stake={5} t={t} at={Bt(90, 2)} />
      <Slate text="L2 HER STAKE · NEW B14 (insert: hand, ticket, chip)" />
    </AbsoluteFill>
  ) : W(t, { cam: { d: 9.6 }, label: false, fill: 1 }, 1.06, 960, 560, <>
      <div style={{ position: 'absolute', left: 96, right: 96, top: 54, height: 120, background: 'rgba(239,231,216,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', opacity: easeOut(k(t, Bt(91), Bt(91) + 0.25)) }}>
        <span style={{ fontFamily: DELA, fontSize: 56, color: PAPER.ink }}>▲ UP <span style={{ fontFamily: MONO, fontSize: 38, color: UP_PAPER }}>{POOL.up.toLocaleString()}</span></span>
        <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: 40, color: PAPER.ink, letterSpacing: '0.1em' }}>POOL {(POOL.up + POOL.down).toLocaleString()} USDC<Unv /></span>
        <span style={{ fontFamily: DELA, fontSize: 56, color: PAPER.ink }}><span style={{ fontFamily: MONO, fontSize: 38, color: '#c2304d' }}>{POOL.down.toLocaleString()}</span> DOWN ▼</span>
      </div>
      <Slate text="L2b THE WHOLE GORGE, two crowds facing · the one moment the pool is said · NEW E04 crowd" />
    </>) },
  { id: 'L3', from: Bt(92), to: Bt(94), fn: (t) => {
    const faces: [string, number, number, number][] = [['high-roller-v2', 1.0, 240, 480], ['cold-blooded', 1.0, 720, 470], ['starter-lucky-fool', 1.05, 1200, 460], ['untouchable', 1.0, 1680, 450]];
    const s = Math.max(0, 3 - Math.floor(k(t, Bt(92), Bt(94)) * 4));
    return (
      <AbsoluteFill style={{ background: SUMI.bg }}>
        {faces.map(([id, z, x, y], i) => (
          <Pan key={id} poly={[[i * 480 + 8, 0], [i * 480 + 472, 0], [i * 480 + 472, 1080], [i * 480 + 8, 1080]]}>
            <Fig id={id} x={x} y={y} zoom={z} />
            {t >= Bt(93, i) && <StampSeal t={t} t0={Bt(93, i)} glyph="決" x={i * 480 + 380} y={800} size={92} fill={SUMI.red} ink={SUMI.onRed} />}
          </Pan>
        ))}
        <div style={{ position: 'absolute', left: 0, width: 1920, top: 860, textAlign: 'center' }}><span style={{ fontFamily: DELA, fontSize: 120, color: SUMI.ink, background: 'rgba(15,13,11,0.8)', padding: '0 30px' }}>0:0{s}</span></div>
        <Lbl y={800} center size={28}>PICKS CLOSE</Lbl>
        <Slate text="L3 PICKS CLOSE · four faces, four locks on the beats · READY" />
      </AbsoluteFill>
    );
  } },
  { id: 'L4', from: Bt(94), to: Bt(95, 4), fn: (t) => W(t, { cam: { d: 9.6, cy: -1600 }, label: false }, lerp(1.0, 1.08, k(t, Bt(94), Bt(95, 4))), 960, 420, <>
      <div style={{ position: 'absolute', left: 949, top: 330, width: 22, height: 50, background: 'rgba(22,19,15,0.9)' }} />
      <Lbl y={980} center size={30} color={PAPER.ink}>PICKS LOCKED · THE CANDLE OPENS</Lbl>
      <Slate text="L4 THE HELD BREATH · super-wide, the whole world still; Duel Master a speck on her spire, watching · NEW E01-E06" />
    </>) },
  // ---------------------------------------------------------- C: the candle (drop 3 + build, bars 120-135)
  { id: 'C1', from: Bt(120), to: Bt(122), fn: (t) => {
    const sh = shakeAt(t, [{ t: Bt(120), px: 22, dur: 0.6 }]);
    const storm = easeOut(k(t, Bt(120), Bt(120) + 0.5));
    return (
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        {W(t, { cam: { d: 9.6 }, storm, lit: 'DOWN', label: false }, 1.12, 960, 600, <>
          <BigCandle t={t} x={960} y={140} h={760} />
          <Lbl y={70} center size={30} color={SUMI.ink}>LIVE · 5M CANDLE · {clock(t)}</Lbl>
        </>)}
        {t < Bt(120) + 0.5 && <Canvas2D draw={(ctx) => brushWipe(ctx, 1920, 1080, k(t, Bt(120), Bt(120) + 0.5) * 0.5, [22, 19, 15], 3, 5)} />}
        <Slate text="C1 DROP 3: THE CANDLE OPENS AND DIVES · ink floods the sky (paper to sumi), the gorge shakes · NEW E07 storm sky" />
      </AbsoluteFill>
    );
  } },
  { id: 'C2', from: Bt(122), to: Bt(124), fn: (t) => (
    <AbsoluteFill style={{ background: SUMI.bg }}>
      <Pan poly={[[0, 0], [760, 0], [600, 1080], [0, 1080]]} t={t} slamAt={Bt(122)}><Fig id="cold-blooded" x={380} y={430} zoom={0.95} pose="B15" poseNote="the faintest smile; he doesn't look up" /></Pan>
      <Pan poly={[[780, 0], [1400, 0], [1260, 1080], [620, 1080]]} t={t} slamAt={Bt(122, 2)}><Fig id="grudge-settled" x={1010} y={430} zoom={0.85} /></Pan>
      <Pan poly={[[1420, 0], [1920, 0], [1920, 1080], [1280, 1080]]} t={t} slamAt={Bt(123)}><Fig id="last-legend" x={1640} y={420} zoom={0.85} /></Pan>
      <div style={{ position: 'absolute', right: 40, top: 40 }}><BigCandle t={t} x={0} y={0} h={300} w={90} strikeW={160} /></div>
      <Slate text="C2 DOWN IS WINNING · Cold Blooded's smile (NEW B15), Grudge Settled laughs, Last Legend nods · READY x2" />
    </AbsoluteFill>
  ) },
  { id: 'C3', from: Bt(124), to: Bt(126), fn: (t) => (
    <AbsoluteFill style={{ background: SUMI.bg }}>
      <Pan poly={[[0, 0], [700, 0], [700, 540], [0, 540]]} t={t} slamAt={Bt(124)}><Fig id="high-roller-v2" x={350} y={250} zoom={0.75} pose="B16" poseNote="the laugh frozen half-open" /></Pan>
      <Pan poly={[[0, 560], [700, 560], [700, 1080], [0, 1080]]} t={t} slamAt={Bt(124, 2)}><Fig id="bloodsport" x={350} y={800} zoom={0.75} pose="B18" poseNote="teeth gritted, fists up" /></Pan>
      <Pan poly={[[720, 0], [1920, 0], [1920, 1080], [720, 1080]]} t={t} slamAt={Bt(125)}>
        <Fig id="starter-lucky-fool" x={1260} y={480} zoom={1.3} pose="B17" poseNote="eyes squeezed shut, the ticket crushed to her chest" />
        {t >= Bt(125, 1) && <div style={{ position: 'absolute', left: 1500, top: 760, textAlign: 'right' }}><Lbl x={0} y={0} size={24} color={SUMI.muted}>lucky · IF IT CLOSED NOW</Lbl><div style={{ position: 'absolute', top: 40, left: 0, fontFamily: DELA, fontSize: 96, color: SUMI.out }}>−5.00</div></div>}
      </Pan>
      <Slate text="C3 UP IS SHAKEN · High Roller's laugh freezes (B16), Bloodsport braces (B18), Lucky Fool can't look (B17)" />
    </AbsoluteFill>
  ) },
  { id: 'C4', from: Bt(126), to: Bt(128), fn: (t) => (
    <AbsoluteFill style={{ background: SUMI.bg }}>
      <div style={{ position: 'absolute', left: 1180, top: 60, opacity: 0.85 }}><BigCandle t={t} x={0} y={0} h={940} w={300} strikeW={1400} /></div>
      <Fig id="untouchable" x={760} y={470} zoom={lerp(1.25, 1.4, k(t, Bt(126), Bt(128)))} />
      <Slate text="C4 THE STILL POINT · Untouchable, blindfolded, never looks at it · the candle deep red behind her · READY" />
    </AbsoluteFill>
  ) },
  { id: 'C5', from: Bt(128), to: Bt(130), fn: (t) => (
    <AbsoluteFill style={{ background: SUMI.bg }}>
      <div style={{ position: 'absolute', left: 300, top: 60 }}><BigCandle t={t} x={0} y={0} h={960} w={320} strikeW={1920} /></div>
      {t >= Bt(129) && <Pan poly={[[860, 120], [1840, 60], [1840, 1020], [960, 960]]} t={t} slamAt={Bt(129)}><Fig id="starter-lucky-fool" x={1400} y={420} zoom={1.4} pose="B17b" poseNote="one eye opening" /></Pan>}
      <Slate text="C5 THE TURN (the build) · the wick stops, the body starts to shrink · Lucky Fool opens one eye (NEW B17b)" />
    </AbsoluteFill>
  ) },
  { id: 'C6', from: Bt(130), to: Bt(132), fn: (t) => t < Bt(131) ? W(t, { cam: { d: 9.6 }, storm: 1, lit: 'UP', label: false }, 1.1, 700, 600, <>
      <BigCandle t={t} x={960} y={120} h={780} />
      <Slate text="C6 THE CLIMB · wide: the UP terraces lift, the DOWN side stills · NEW E04" />
    </>) : (
    <AbsoluteFill style={{ background: SUMI.bg }}>
      <Fig id="cold-blooded" x={960} y={460} zoom={1.3} pose="B15→" poseNote="the smile gone; nothing else moves" />
      <Slate text="C6b COLD BLOODED, the smile gone (B15 reversed, or the card itself)" />
    </AbsoluteFill>
  ) },
  { id: 'C7', from: Bt(132), to: Bt(134), fn: (t) => {
    const rows: [string, number, [number, number]?][] = [['high-roller-v2', 1.9], ['cold-blooded', 1.9], ['starter-lucky-fool', 2.0], ['untouchable', 1.9]];
    return (
      <AbsoluteFill style={{ background: SUMI.bg }}>
        {rows.map(([id, z], i) => {
          const c = CAST[id];
          return (
            <Pan key={id} poly={[[0, i * 270 + 6], [1920, i * 270 + 6], [1920, i * 270 + 264], [0, i * 270 + 264]]} t={t} slamAt={Bt(132, i)}>
              <Fig id={id} x={i % 2 ? 1300 : 620} y={i * 270 + 150} zoom={z} focus={[c.head[0], c.head[1] - 30]} />
            </Pan>
          );
        })}
        <div style={{ position: 'absolute', left: 860, top: 380, width: 200 }}><BigCandle t={t} x={100} y={0} h={320} w={120} strikeW={200} /></div>
        <Slate text="C7 THE EDGE · four eye-lines in letterbox panels, the candle riding the strike · READY (crops)" />
      </AbsoluteFill>
    );
  } },
  { id: 'C8', from: Bt(134), to: Bt(136), fn: (t) => W(t, { cam: { d: 9.6, cy: -1600 }, storm: 1, label: false }, 1.0, 960, 500, <>
      <BigCandle t={t} x={960} y={160} h={700} />
      <div style={{ position: 'absolute', left: 0, width: 1920, top: 880, textAlign: 'center', fontFamily: DELA, fontSize: 130, color: SUMI.ink }}>{clock(t)}</div>
      <Slate text="C8 THE LAST BAR · both cliffs facing, the candle on the strike, Duel Master on her spire" />
    </>) },
  // ---------------------------------------------------------- X: the close (the outro slam, bars 136-143)
  { id: 'X1', from: X.t, to: X.hits[0], fn: (t) => {
    const f = Math.floor((t - X.t) * 60);
    if (f < 1) return <AbsoluteFill style={{ background: '#fff8ef' }} />;
    const neg = f < 3;
    const sh = shakeAt(t, [{ t: X.t, px: 22, dur: 0.7 }]);
    const wave = k(t, X.t + 0.05, X.t + 0.9);
    return (
      <AbsoluteFill style={{ filter: neg ? 'invert(1)' : undefined, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        {W(t, { cam: { d: 9.6 }, storm: 1, lit: 'UP', grey: wave > 0.5 ? 'DOWN' : null, label: false }, 1.05, 960, 560, <>
          <BigCandle t={t} x={960} y={140} h={720} />
          {/* the market's force: an ink wave out of the gorge onto the DOWN terraces (the losers' metaphor; no player strikes another) */}
          <div style={{ position: 'absolute', left: lerp(900, 980, wave), top: 0, width: 1100, height: 1080, overflow: 'hidden' }}>
            <Canvas2D draw={(ctx) => brushWipe(ctx, 1100, 1080, wave * 0.55, [22, 19, 15], 9, 6)} />
          </div>
          <div style={{ position: 'absolute', left: 0, width: 1920, top: 40, textAlign: 'center', fontFamily: DELA, fontSize: 150, color: UP }}>CLOSED UP</div>
        </>)}
        <Placeholder id="FX1" what="ink-wave plate: a breaking wall of sumi rolling over the DOWN terraces" style={{ left: 1300, top: 880, width: 560, height: 120 }} size={20} />
        <Slate text="X1 THE CLOSE on the outro slam · paper-white, ink-negative, the wave hits the DOWN side · NEW FX1" />
      </AbsoluteFill>
    );
  } },
  ...([
    ['last-legend', 'B21', 'knocked to one knee by the wave, sword planted, head bowed', 'oldguard −75'],
    ['grudge-settled', 'B22', 'the fanned cards torn out of his hand by the wave, the fox mask knocked askew', 'foxglove −30'],
    ['cold-blooded', 'B23', 'lifts the white mask over his face as the grey takes him', 'frost −80'],
  ] as const).map(([id, b, note, amt], i) => ({ id: `X2${'abc'[i]}`, from: X.hits[i], to: X.hits[i + 1], fn: (t: number) => {
    const g = k(t, X.hits[i] + 0.15, X.hits[i + 1]);
    const sh = shakeAt(t, [{ t: X.hits[i], px: 12, dur: 0.35 }]);
    return (
      <AbsoluteFill style={{ background: PAPER.bg, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <Fig id={id} x={960 + (i - 1) * 120} y={460} zoom={1.05} grey={g} pose={b} poseNote={note} rot={i === 0 ? -4 : 0} />
        <div style={{ position: 'absolute', left: 1460, top: 140, opacity: g }}>
          <div style={{ fontFamily: YUJI, fontSize: 110, color: PAPER.bg, background: PAPER.out, width: 140, height: 140, borderRadius: 18, textAlign: 'center', lineHeight: '140px' }}>敗</div>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 36, color: PAPER.out, marginTop: 14 }}>{amt}<Unv /></div>
        </div>
        <Slate text={`X2 ${id.toUpperCase()} LOSES, in character · NEW ${b} · grey 敗`} />
      </AbsoluteFill>
    );
  } })),
  ...([
    ['high-roller-v2', 'B24', 'the triumphant cackle, chips flung in the air', 'high_roll', 100],
    ['starter-lucky-fool', '', '', 'lucky', 5],
    ['untouchable', 'B25', 'sheathes her blade without turning round', 'ghost', 40],
  ] as const).map(([id, b, note, handle, stake], i) => ({ id: `X3${'abc'[i]}`, from: X.hits[i + 3], to: X.hits[i + 4], fn: (t: number) => {
    const r = riseK(t, X.hits[i + 3] + 0.12);
    return (
      <AbsoluteFill style={{ background: SUMI.bg }}>
        <Fig id={id} x={i === 1 ? 860 : 760} y={i === 1 ? 500 : 460} zoom={i === 1 ? 1.15 : 1.0} pose={b || undefined} poseNote={note} />
        <div style={{ position: 'absolute', right: 120, top: 380, textAlign: 'right', opacity: r.a, transform: `translateY(${r.y}px)` }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: '0.15em', color: SUMI.muted }}>{handle} · {stake} USDC ▲ UP</div>
          <div style={{ fontFamily: DELA, fontSize: i === 1 ? 140 : 120, color: UP, textShadow: '0 0 26px rgba(61,220,132,0.45)' }}>+{usd(net(stake))}<Unv /></div>
        </div>
        <Slate text={i === 1 ? 'X3b LUCKY FOOL: the coins rain (her card IS the moment) · READY · the film\'s emotional peak' : `X3 ${id.toUpperCase()} WINS, in character · NEW ${b}`} />
      </AbsoluteFill>
    );
  } })),
  { id: 'X4', from: X.hits[6], to: X.finalSlam, fn: (t) => {
    if (t < X.breath) return W(t, { cam: { d: 9.6 }, storm: 0.6, lit: 'UP', grey: 'DOWN', label: false }, 1.0, 960, 540, <>
      <Super t={t} at={X.hits[6]} until={X.breath} y={110} size={72} color={SUMI.ink}>The side that’s right splits the pool.</Super>
      <Slate text="X4 THE POOL RESOLVES · UP lit, DOWN grey" />
    </>);
    if (t < X.breath + 2.2) return (
      <AbsoluteFill style={{ background: PAPER.bg }}>
        <Img src={staticFile('mattes/duel-master-victory.png')} style={{ position: 'absolute', left: 420, top: 60, width: 1672 * 0.9, height: 941 * 0.9 }} />
        <Placeholder id="B26" what="Duel Master turns from the view and steps down off the spire: the next one is hers" dark style={{ left: 1300, top: 820, width: 560, height: 160 }} size={22} />
        <Slate text="X5 THE BREATH (sub cut) · back to her: she watched it all · NEW B26" />
      </AbsoluteFill>
    );
    return (
      <AbsoluteFill style={{ background: SUMI.bg }}>
        <Fig id="rampage" x={1200} y={1100} h={1250} pose="B27" poseNote="(optional) on the far terrace, bandaged fist forward: he's back for the next round" />
        <Lbl y={140} x={110} size={34}>NEXT CANDLE · PICKS OPEN</Lbl>
        <Slate text="X6 NEXT ROUND · Rampage, formidable, steps up (optional cameo, NEW B27)" />
      </AbsoluteFill>
    );
  } },
];

const EndCard: React.FC<{ t: number }> = ({ t }) => {
  const seal = stampK(t, X.stab - 0.07);
  const flood = k(t, X.finalSlam, X.finalSlam + 0.45);
  const w = riseK(t, X.stab + 0.25), tag = riseK(t, X.stab + 0.6), url = riseK(t, X.stab + 0.95);
  return (
    <AbsoluteFill style={{ background: SUMI.bg }}>
      <AbsoluteFill style={{ WebkitMaskImage: `radial-gradient(circle at 50% 45%, black ${flood * 140}%, transparent ${flood * 140 + 6}%)` }}>
        <Paper />
        {seal.a > 0 && <Img src={staticFile('logo/yochi-seal-paper.svg')} style={{ position: 'absolute', left: 830, top: 150, width: 260, height: 260, opacity: seal.a, transform: `scale(${seal.s}) rotate(${seal.r}deg)` }} />}
        <div style={{ position: 'absolute', width: 1920, top: 450, textAlign: 'center', fontFamily: DELA, fontSize: 150, color: PAPER.ink, opacity: w.a, transform: `translateY(${w.y}px)` }}>YOCHI</div>
        <div style={{ position: 'absolute', width: 1920, top: 650, textAlign: 'center', fontFamily: ZEN, fontWeight: 900, fontSize: 70, color: PAPER.ink, opacity: tag.a }}>Call it right. Take the pool.</div>
        <div style={{ position: 'absolute', width: 1920, top: 780, textAlign: 'center', fontFamily: MONO, fontWeight: 800, fontSize: 56, letterSpacing: '0.12em', color: PAPER.redText, opacity: url.a }}>yochigg.xyz</div>
        <div style={{ position: 'absolute', width: 1920, top: 890, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: '0.2em', color: PAPER.muted, opacity: url.a }}>DUELS · FREE FOR ALL · BATTLE ROYALE</div>
        <div style={{ position: 'absolute', width: 1920, top: 950, textAlign: 'center', fontFamily: MONO, fontSize: 22, color: '#0b7d86', opacity: url.a }}>[PLACEHOLDER: counsel's real-money line · currency variant USDC / HYPE (Elysium)]</div>
      </AbsoluteFill>
      <Slate text="E1 END CARD · the final slam floods to paper, the seal stamps on the last stab · READY (legal line TBC)" />
    </AbsoluteFill>
  );
};

/** Everything after the approved victory: the reveal, the round, the close, the end card. t = film seconds. */
export const FlagshipAct: React.FC<{ t: number }> = ({ t }) => {
  if (t < FT.gather.highRoller) return <Reveal t={t} />;
  if (t >= X.finalSlam) return <EndCard t={t} />;
  const shot = SHOTS.find((s) => t >= s.from && t < s.to) ?? SHOTS[SHOTS.length - 1];
  return <>{shot.fn(t)}</>;
};
