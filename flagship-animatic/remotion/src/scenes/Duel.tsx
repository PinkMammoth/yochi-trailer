// ACT I: THE DUEL (0 to ~17.4 s). THE LAST STAND's arc, re-timed to a full 8-bar phrase (bars 64-71) and rebuilt
// here with the same approved art, so this film never depends on that film's source or timeline.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { DELA, DOWN, KANJI, Label, Moment, MONO, PAPER, Paper, SUMI, Seal, Slate, Sumi, UP, YUJI } from '../lib/brand';
import { clamp, easeIn, easeInOut, easeOut, fade, k, lerp, rise, shake, slam, stamp, within } from '../lib/motion';
import { Chart, Shot, Timer, VersusBand, liveFrom, pastCandles } from '../lib/ui';
import { ART, DUEL, T } from '../data';

const D = T.duel;
const V = T.victory;
// the duel's price: opens on the strike, climbs, reverses through it, closes DOWN
const STRIKE = 41.79;
// climbs through bars 69-70 (his), reverses on the riser (bar 71) and closes below the strike
const path = (u: number) => STRIKE + (u < 0.66 ? 0.11 * easeOut(u / 0.66) + 0.008 * Math.sin(u * 60) : 0.11 - 0.18 * easeInOut(k(u, 0.68, 0.93)));
const RAW = pastCandles(14, STRIKE, 0.018, 3);
const SHIFT = STRIKE - RAW[RAW.length - 1].c;
const PAST = RAW.map((c) => ({ o: c.o + SHIFT, h: c.h + SHIFT, l: c.l + SHIFT, c: c.c + SHIFT }));
// candle progress over the film: opens at bar 69, the minute is compressed into bars 69-71
const candleU = (t: number) => k(t, D.candle, D.close);

const Rampage: React.FC<{ zoom: number; fx?: number; fy?: number; sx?: number; sy?: number; grey?: number }> = ({ zoom, fx = ART.rampageCard.face[0], fy = ART.rampageCard.face[1], sx, sy, grey = 0 }) => (
  <Shot src={ART.rampageCard.src} w={1536} h={2048} fx={fx} fy={fy} zoom={zoom} sx={sx} sy={sy} filter={grey ? `grayscale(${grey})` : undefined} />
);
const DM: React.FC<{ zoom: number; fx?: number; fy?: number; sx?: number; sy?: number }> = ({ zoom, fx = ART.dmCard.face[0], fy = ART.dmCard.face[1], sx, sy }) => (
  <Shot src={ART.dmCard.src} w={1536} h={2048} fx={fx} fy={fy} zoom={zoom} sx={sx} sy={sy} />
);
const Panel: React.FC<{ x: number; w: number; children: React.ReactNode; bg?: string }> = ({ x, w, children, bg = SUMI.bg }) => (
  <div style={{ position: 'absolute', left: x, top: 0, width: w, height: 1080, overflow: 'hidden', background: bg }}>
    <div style={{ position: 'absolute', left: -x, top: 0, width: 1920, height: 1080 }}>{children}</div>
  </div>
);

export const Duel: React.FC<{ t: number }> = ({ t }) => {
  // ---------- S01 the threat: the fist at the lens, the camera climbs his arm to the grin
  if (t < D.challenger) {
    const u = easeInOut(k(t, 0, D.challenger));
    return (
      <AbsoluteFill style={{ background: SUMI.bg }}>
        <Rampage zoom={lerp(2.3, 1.15, u)} fx={lerp(ART.rampageCard.fist[0], ART.rampageCard.face[0], u)} fy={lerp(ART.rampageCard.fist[1], ART.rampageCard.face[1] + 120, u)} sy={lerp(540, 470, u)} />
        <Slate text="S01 THE THREAT · READY (Rampage card)" />
      </AbsoluteFill>
    );
  }
  // ---------- S02 the challenger: she cuts in from the right, small; 対
  if (t < D.stakes) {
    const sl = easeOut(k(t, D.challenger, D.challenger + 0.25));
    const v = slam(t, D.challenger + 0.34);
    return (
      <AbsoluteFill style={{ background: SUMI.bg }}>
        <Panel x={0} w={1220}><Rampage zoom={0.95} sx={520} sy={430} /></Panel>
        <div style={{ position: 'absolute', left: lerp(1920, 1240, sl), top: 120, width: 560, height: 840, overflow: 'hidden', background: PAPER.bg, transform: 'skewX(-8deg)', border: `6px solid ${SUMI.bg}` }}>
          <div style={{ position: 'absolute', inset: 0, transform: 'skewX(8deg)' }}><DM zoom={0.62} sx={300} sy={330} /></div>
        </div>
        <div style={{ position: 'absolute', left: 1080, top: 380, opacity: v.o, transform: `scale(${v.s})` }}><Seal glyph={KANJI.vs} size={170} /></div>
        <Label size={34} style={{ position: 'absolute', left: 110, top: 940 }}>{DUEL.him}</Label>
        <Label size={34} style={{ position: 'absolute', right: 110, top: 990, opacity: sl }}>{DUEL.her}</Label>
        <Slate text="S02 THE CHALLENGER · READY (both kit cards)" />
      </AbsoluteFill>
    );
  }
  // ---------- S03 the stakes: one band, real money, said once
  if (t < D.pickHim) {
    const v = slam(t, D.stakes);
    const s2 = rise(t, D.stakes + 0.35);
    return (
      <AbsoluteFill style={{ background: SUMI.bg }}>
        <Panel x={0} w={960}><Rampage zoom={0.8} sx={480} sy={380} /></Panel>
        <Panel x={960} w={960}><DM zoom={0.8} sx={1440} sy={380} /></Panel>
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${v.s})`, opacity: v.o }}>
          <VersusBand y={760} h={220} left={<Moment size={74} color={PAPER.ink}>SUDDEN DEATH</Moment>} right={<Moment size={74} color={PAPER.ink}>10 USDC EACH</Moment>}
            centre={<span style={{ fontFamily: YUJI, fontSize: 140, color: '#140f0c' }}>{KANJI.vs}</span>} />
        </div>
        <Label size={30} weight={800} style={{ position: 'absolute', width: 1920, textAlign: 'center', top: 1000, opacity: s2.o, transform: `translateY(${s2.y}px)` }}>WINNER TAKES THE POT</Label>
        <Slate text="S03 THE STAKES · READY + type" />
      </AbsoluteFill>
    );
  }
  // ---------- S04 he picks, instantly: UP, a hard 決, a punch-in on his grin
  if (t < D.pickHer) {
    const p = easeOut(k(t, D.pickHim, D.pickHer));
    const st = stamp(t, D.pickHim + 0.17);
    const sh = shake(t, D.pickHim + 0.17);
    return (
      <AbsoluteFill style={{ background: SUMI.bg, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <Rampage zoom={lerp(1.3, 1.5, p)} sx={1180} sy={500} />
        <div style={{ position: 'absolute', left: 110, top: 780 }}><Moment size={190} color={UP}>▲ UP</Moment></div>
        <div style={{ position: 'absolute', left: 640, top: 760, transform: `scale(${st.s}) rotate(${st.r}deg)`, opacity: st.o }}><Seal glyph={KANJI.lock} size={150} /></div>
        <Slate text="S04 HE PICKS · READY" />
      </AbsoluteFill>
    );
  }
  // ---------- S05 she picks, late: half a bar of nothing, then DOWN and a quiet 決
  if (t < D.candle) {
    const lockAt = D.pickHer + 2 * T.beat - 0.17;
    const on = t >= lockAt;
    const p = easeInOut(k(t, D.pickHer, D.candle));
    return (
      <AbsoluteFill style={{ background: SUMI.bg }}>
        <DM zoom={lerp(1.2, 1.32, p)} sx={700} sy={470} />
        {on && <div style={{ position: 'absolute', right: 130, top: 640 }}><Moment size={190} color={DOWN}>▼ DOWN</Moment></div>}
        {on && <div style={{ position: 'absolute', right: 140, top: 450, transform: 'rotate(-10deg)', opacity: 0.95 }}><Seal glyph={KANJI.lock} size={110} /></div>}
        <Slate text="S05 SHE PICKS · READY" />
      </AbsoluteFill>
    );
  }
  // ---------- S06-S07 the minute runs: him | the live candle | her; then it's his
  if (t < D.riser) {
    const u = candleU(t);
    const live = liveFrom(path, u);
    const winning = t >= D.winning;
    const z = winning ? easeOut(k(t, D.winning, D.riser)) : 0;
    return (
      <AbsoluteFill style={{ background: SUMI.bg }}>
        <Panel x={0} w={600}><Rampage zoom={lerp(0.9, 1.2, z)} sx={300} sy={520} /></Panel>
        <Panel x={1320} w={600}><DM zoom={0.9} sx={1620} sy={520} /></Panel>
        <div style={{ position: 'absolute', left: 640, top: 150 }}>
          <Chart W={640} H={600} past={PAST.slice(-8)} live={live} strike={STRIKE} lo={STRIKE - 0.1} hi={STRIKE + 0.16} liveScale={1.6} strikeLabel="STRIKE" />
        </div>
        <div style={{ position: 'absolute', left: 700, top: 800 }}><Timer text={`0:${String(Math.max(1, Math.round(60 * (1 - u)))).padStart(2, '0')}`} drain={u} size={90} label="1M CANDLE" /></div>
        <Slate text={winning ? "S07 IT'S HIS · READY" : 'S06 THE MINUTE RUNS · READY'} />
      </AbsoluteFill>
    );
  }
  // ---------- S08 the reversal (the riser, the sub cuts): the body collapses through the strike; his last grin
  if (t < D.close) {
    const u = candleU(t);
    const live = liveFrom(path, u);
    const grin = t > D.close - 0.32;
    if (grin) return (<AbsoluteFill style={{ background: SUMI.bg }}><Rampage zoom={1.6} sx={960} sy={520} /><Slate text="S08b LAST GRIN · READY" /></AbsoluteFill>);
    return (
      <AbsoluteFill style={{ background: SUMI.bg }}>
        <div style={{ position: 'absolute', left: 260, top: 60 }}>
          <Chart W={1400} H={960} past={PAST.slice(-5)} live={live} strike={STRIKE} lo={STRIKE - 0.1} hi={STRIKE + 0.15} liveScale={1.3} strikeLabel="STRIKE" />
        </div>
        {u > 0.93 && <Label size={52} weight={800} color={DOWN} style={{ position: 'absolute', right: 110, top: 80 }}>CLOSED DOWN</Label>}
        <Slate text="S08 THE REVERSAL · READY (UI rebuild)" />
      </AbsoluteFill>
    );
  }
  // ---------- S09 silence: the match cut to disbelief; then her eyes
  if (t < D.strike) {
    if (t < D.calm) {
      const zc = 1.6, zd = (zc * ART.rampageCard.faceW) / ART.disbelief.faceW;
      const push = easeInOut(k(t, D.close + 0.15, D.calm));
      return (
        <AbsoluteFill style={{ background: PAPER.bg }}>
          <Paper />
          <Shot src={ART.disbelief.src} w={1500} h={2000} fx={lerp(ART.disbelief.face[0], ART.disbelief.eyes[0], push)} fy={lerp(ART.disbelief.face[1], ART.disbelief.eyes[1], push)} zoom={zd * lerp(1, 1.5, push)} sx={960} sy={520} />
          <div style={{ position: 'absolute', right: 110, top: 820, opacity: 1 - k(t, D.close + 0.4, D.close + 0.5) }}><Moment size={110} color={DOWN}>▼ DOWN</Moment></div>
          <Slate text="S09 DISBELIEF (silence) · READY (approved HD pose)" />
        </AbsoluteFill>
      );
    }
    return (<AbsoluteFill style={{ background: SUMI.bg }}><DM zoom={3.2} fx={ART.dmCard.eyes[0]} fy={ART.dmCard.eyes[1]} /><Slate text="S09b HER EYES · READY" /></AbsoluteFill>);
  }
  // ---------- S10 the lunge
  if (t < D.hit) {
    const u = k(t, D.strike, D.hit);
    return (
      <AbsoluteFill style={{ background: PAPER.bg }}>
        <Paper />
        <Shot src={ART.attack.matte} w={1500} h={2000} fx={ART.attack.face[0]} fy={ART.attack.face[1]} zoom={lerp(0.75, 0.95, easeIn(u))} sx={lerp(1300, 1000, u)} sy={420} rot={-6} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ position: 'absolute', left: 0, top: 150 + i * 150, width: 1920, height: 3, background: PAPER.ink, opacity: 0.25, transform: `translateX(${(1 - u) * 400 - 200}px)` }} />
        ))}
        <Slate text="S10 THE LUNGE · READY (approved attack pose)" />
      </AbsoluteFill>
    );
  }
  // ---------- S11 THE HIT and the defeat
  if (t < V.reveal) {
    const f = Math.floor((t - D.hit) * T.fps);
    if (f === 0) return <AbsoluteFill style={{ background: '#fff8ef' }} />;
    const neg = f <= 2;
    const fly = easeOut(k(t, D.hit + 0.2, V.reveal));
    const grey = k(t, D.pulses[0] - 0.4, D.pulses[0]);
    const sh = shake(t, D.hit, 18, 0.65);
    const st = stamp(t, D.pulses[1] - 0.02);
    return (
      <AbsoluteFill style={{ background: PAPER.bg, filter: neg ? 'invert(1)' : undefined, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <Paper />
        <Shot src={ART.hit.src} w={1086} h={1448} fx={ART.hit.chest[0]} fy={ART.hit.chest[1]} zoom={lerp(0.85, 0.45, fly)} sx={lerp(760, 520, fly)} sy={lerp(560, 470, fly)} rot={lerp(0, -14, fly)} filter={`grayscale(${grey})`} opacity={1 - 0.4 * fly} />
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: 1 - 0.6 * k(t, D.hit + 0.15, D.hit + 0.6) }}>
          <path d="M 1700 180 Q 1100 520 380 760" stroke={SUMI.red} strokeWidth={lerp(46, 26, k(t, D.hit, D.hit + 0.4))} fill="none" strokeLinecap="round" />
        </svg>
        <Shot src={ART.attack.matte} w={1500} h={2000} fx={ART.attack.face[0]} fy={ART.attack.face[1]} zoom={0.7} sx={1560} sy={330} rot={-4} />
        {t >= D.pulses[1] - 0.5 && <div style={{ position: 'absolute', left: 330, top: 120, transform: `scale(${st.s}) rotate(${st.r}deg)`, opacity: st.o }}><Seal glyph={KANJI.loss} size={140} color={PAPER.out} ink={PAPER.bg} /></div>}
        <Slate text="S11 THE HIT / DEFEAT · READY (approved hit pose + matte)" />
      </AbsoluteFill>
    );
  }
  // ---------- S12 the victory: the ink clears to the approved victory pose; 勝 and the payout
  const w = fade(t, V.reveal, V.reveal + 0.12, 99, 100);
  const push = easeInOut(k(t, V.reveal, V.pullStart));
  const r = rise(t, V.payout);
  return (
    <AbsoluteFill style={{ background: PAPER.bg }}>
      <Paper />
      <Shot src={ART.victory.src} w={1672} h={941} fx={836} fy={470} zoom={1.1483 * lerp(1.0, 1.035, push)} opacity={w} />
      <div style={{ position: 'absolute', left: 1240, top: 300, opacity: r.o, transform: `translateY(${r.y}px)` }}>
        <Seal glyph={KANJI.win} size={130} />
        <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 30, letterSpacing: '0.2em', color: PAPER.ink, marginTop: 30 }}>{DUEL.her}</div>
        <div style={{ fontFamily: DELA, fontSize: 104, color: '#15804a', textShadow: '0 0 24px rgba(61,220,132,0.35)' }}>+{DUEL.payout} USDC</div>
      </div>
      <Slate text="S12 THE VICTORY · READY (approved victory pose)" />
    </AbsoluteFill>
  );
};
