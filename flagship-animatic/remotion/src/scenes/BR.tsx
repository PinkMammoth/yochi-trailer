// ACT III + IV (alternative): BATTLE ROYALE. Ten seats, 10 USDC each, two lives each, one-minute candles.
// A wrong pick costs a life (not the seat); the field narrows to the final two; last one standing takes 95.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import castJson from '../../../assets/cast/cast.json';
import { BAND, DELA, DOWN, KANJI, Label, Moment, MONO, PAPER, Placeholder, Seal, Slate, SUMI, Sumi, UP, YUJI, ZEN } from '../lib/brand';
import { easeInOut, easeOut, fade, k, lerp, rise, shake, slam, stamp } from '../lib/motion';
import { Chart, Shot, VersusBand, fmtClock, liveFrom } from '../lib/ui';
import { ART, BR, T, B } from '../data';

const A = T.act2;
const P = T.payoff;
const CAST = castJson as Record<string, { paint: number[]; head: number[] }>;
const ROUND_CLOSE = [B(82), B(84), B(86), B(87) + 0.68];
const STRIKE = 41.79;

const livesAt = (t: number) => {
  let lives = BR.seats.map(() => 2), round = 0;
  ROUND_CLOSE.forEach((c, i) => { if (t >= c) { lives = BR.rounds[i].lives; round = i + 1; } });
  return { lives, round };
};

/** A seat tile: a head-and-shoulders crop of the house cut-out, with its 命 lives. */
const Seat: React.FC<{ id: string; handle: string; lives: number; x: number; y: number; w: number; h: number; justOut: boolean }> = ({ id, handle, lives, x, y, w, h, justOut }) => {
  const c = CAST[id] ?? { paint: [1392, 1828], head: [700, 400] };
  const z = (w * 1.3) / c.paint[0];
  const out = lives === 0;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden', background: SUMI.s1, border: `3px solid ${out ? 'rgba(239,231,216,0.12)' : 'rgba(239,231,216,0.3)'}` }}>
      <Img src={staticFile(`cast/${id}-fig.webp`)} style={{ position: 'absolute', width: c.paint[0] * z, left: w / 2 - c.head[0] * z, top: h * 0.42 - c.head[1] * z, filter: out ? 'grayscale(1) brightness(0.55)' : undefined }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 64, background: 'linear-gradient(0deg, rgba(15,13,11,0.95), rgba(15,13,11,0))' }} />
      <div style={{ position: 'absolute', left: 14, bottom: 12, fontFamily: MONO, fontWeight: 800, fontSize: 24, color: out ? SUMI.out : SUMI.ink, letterSpacing: '0.08em' }}>{handle}</div>
      <div style={{ position: 'absolute', right: 10, bottom: 10, display: 'flex', gap: 6 }}>
        {[0, 1].map((i) => (
          <div key={i} style={{ width: 34, height: 34, borderRadius: 6, background: i < lives ? SUMI.red : 'rgba(239,231,216,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: YUJI, fontSize: 24, color: '#140f0c' }}>命</span>
          </div>
        ))}
      </div>
      {out && <div style={{ position: 'absolute', right: 12, top: 12, opacity: justOut ? 1 : 0.8 }}><Seal glyph={KANJI.loss} size={70} color={SUMI.out} ink={SUMI.bg} /></div>}
    </div>
  );
};

export const BRAct: React.FC<{ t: number }> = ({ t }) => {
  const flood = k(t, A.start, A.start + 0.4);
  const { lives, round } = livesAt(t);
  const alive = lives.filter((l) => l > 0).length;
  // ---------------------------------------------- the final two (lighter section, bars 88-95) and the payoff
  if (t >= A.tension) {
    const u = k(t, A.candleOpen + 1.36, P.close);
    const path = (q: number) => STRIKE + 0.04 * Math.sin(q * 9) - 0.05 * Math.sin(q * 3.1) + 0.06 * easeInOut(k(q, 0.85, 1));
    const lc = liveFrom(path, u);
    const closed = t >= P.close;
    if (closed) {
      const f = Math.floor((t - P.close) * T.fps);
      if (f === 0) return <AbsoluteFill style={{ background: '#fff8ef' }} />;
      const st = stamp(t, P.hits[1]);
      const r = rise(t, P.hits[3]);
      const hit = t < P.hits[0] + 0.3;
      return (
        <AbsoluteFill style={{ background: PAPER.bg }}>
          {hit ? (
            <>
              <AbsoluteFill style={{ background: SUMI.bg }} />
              <Placeholder id="B07" what="BLOODSPORT DEFEAT: knocked back by the close (hit reaction, same costume, screen left-to-right recoil)" style={{ left: 260, top: 160, width: 1400, height: 760 }} />
              <Moment size={150} color={UP} style={{ position: 'absolute', width: 1920, textAlign: 'center', top: 40 }}>CLOSED UP</Moment>
            </>
          ) : (
            <>
              <Shot src={ART.victory.src} w={1672} h={941} fx={836} fy={470} zoom={1.1483} />
              <div style={{ position: 'absolute', left: 1180, top: 210, transform: `scale(${st.s}) rotate(${st.r}deg)`, opacity: st.o }}><Seal glyph={KANJI.win} size={130} /></div>
              <div style={{ position: 'absolute', left: 1180, top: 400, opacity: r.o, transform: `translateY(${r.y}px)` }}>
                <Label size={30} color={PAPER.ink}>LAST ONE STANDING · mira</Label>
                <div style={{ fontFamily: DELA, fontSize: 120, color: '#15804a', textShadow: '0 0 24px rgba(61,220,132,0.35)' }}>+{BR.payout} USDC</div>
                <Label size={24} color={PAPER.muted} style={{ marginTop: 10 }}>10 × 10 USDC · 5% RAKE</Label>
              </div>
              <Placeholder id="B08" what="(optional) a second victory: Duel Master, BR win pose. The duel's victory art repeats here." dark style={{ left: 110, top: 900, width: 900, height: 100 }} />
            </>
          )}
          <Slate text={hit ? 'S20b THE CLOSE · NEW-ESSENTIAL B07' : 'S21b LAST ONE STANDING · READY (victory pose re-used)'} />
        </AbsoluteFill>
      );
    }
    const pickAt = A.tension + 1.36;
    return (
      <AbsoluteFill style={{ background: SUMI.bg }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 760, height: 1080, overflow: 'hidden' }}>
          <Shot src={ART.dmCard.src} w={1536} h={2048} fx={ART.dmCard.face[0]} fy={ART.dmCard.face[1]} zoom={1.2} sx={380} sy={500} />
        </div>
        <div style={{ position: 'absolute', left: 1160, top: 0, width: 760, height: 1080, overflow: 'hidden' }}>
          <Img src={staticFile('cast/bloodsport-fig.webp')} style={{ position: 'absolute', left: -230, top: 40, height: 1300 }} />
        </div>
        <VersusBand y={60} h={170} left={<Moment size={62} color={PAPER.ink}>FINAL TWO</Moment>} right={<Moment size={62} color={PAPER.ink}>LAST LIFE EACH</Moment>}
          centre={<span style={{ fontFamily: YUJI, fontSize: 120, color: '#140f0c' }}>{KANJI.vs}</span>} />
        {t >= pickAt && <Moment size={120} color={UP} style={{ position: 'absolute', left: 110, top: 840 }}>▲ UP</Moment>}
        {t >= pickAt + 0.34 && <Moment size={120} color={DOWN} style={{ position: 'absolute', right: 110, top: 840 }}>▼ DOWN</Moment>}
        <div style={{ position: 'absolute', left: 860, top: 300 }}><Chart W={200} H={520} past={[]} live={lc} strike={STRIKE} lo={STRIKE - 0.12} hi={STRIKE + 0.12} liveScale={2.2} grid={false} /></div>
        <div style={{ position: 'absolute', left: 760, width: 400, top: 860, textAlign: 'center', fontFamily: DELA, fontSize: 100, color: SUMI.ink }}>{fmtClock(Math.max(1, 60 * (1 - u)))}</div>
        <Slate text="S19 BR FINAL TWO · READY (kit card) + ADAPTABLE (Bloodsport fig)" />
      </AbsoluteFill>
    );
  }
  // ---------------------------------------------- ten seats, rounds 1-4
  const closing = ROUND_CLOSE.findIndex((c) => t >= c - 0.68 && t < c + 0.2);
  const just = ROUND_CLOSE.findIndex((c) => t >= c && t < c + 1.2);
  const intro = t < B(82) - 0.68;
  const sh = shake(t, ROUND_CLOSE[Math.max(0, just)], just >= 0 ? 8 : 0);
  const v = slam(t, A.start + 0.4);
  return (
    <AbsoluteFill>
      <Sumi />
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <div style={{ position: 'absolute', left: 96, right: 96, top: 54, height: 160, background: BAND }}>
          <div style={{ position: 'absolute', left: 36, top: 30 }}>
            <Label size={22} color={PAPER.muted}>STILL IN</Label>
            <Moment size={78} color={PAPER.ink}>{alive}/10</Moment>
          </div>
          <div style={{ position: 'absolute', left: 864 - 96 - 90, top: -20, width: 360, height: 200, background: SUMI.red, transform: 'skewX(-18deg)' }} />
          <div style={{ position: 'absolute', left: 864 - 96 - 110, width: 400, top: 20, textAlign: 'center', color: '#140f0c' }}>
            <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 22, letterSpacing: '0.2em' }}>ROUND</div>
            <div style={{ fontFamily: DELA, fontSize: 80, lineHeight: 1 }}>{Math.min(4, round + 1)}</div>
            <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 18, letterSpacing: '0.2em' }}>OF 20 MAX</div>
          </div>
          <div style={{ position: 'absolute', right: 36, top: 26, textAlign: 'right' }}>
            <Label size={22} color={PAPER.muted}>LAST ONE STANDING TAKES</Label>
            <Moment size={74} color="#15804a">95 USDC</Moment>
            <Label size={18} color={PAPER.muted} style={{ marginTop: 6 }}>10 × 10 USDC ENTRY · 5% RAKE</Label>
          </div>
        </div>
        {BR.seats.map((s, i) => (
          <Seat key={s.id} id={s.id} handle={s.handle} lives={lives[i]} x={96 + (i % 5) * 352} y={260 + Math.floor(i / 5) * 400} w={330} h={380} justOut={just >= 0} />
        ))}
        {intro && (
          <div style={{ position: 'absolute', left: 0, width: 1920, top: 560, textAlign: 'center', transform: `scale(${v.s})`, opacity: v.o }}>
            <span style={{ fontFamily: DELA, fontSize: 96, color: SUMI.ink, background: 'rgba(15,13,11,0.85)', padding: '6px 30px' }}>10 PLAYERS · 2 LIVES EACH</span>
          </div>
        )}
        {closing >= 0 && t < ROUND_CLOSE[closing] + 0.2 && (
          <div style={{ position: 'absolute', left: 0, width: 1920, top: 560, textAlign: 'center' }}>
            <span style={{ fontFamily: DELA, fontSize: 110, color: BR.rounds[closing].close === 'UP' ? UP : DOWN, background: 'rgba(15,13,11,0.85)', padding: '6px 30px' }}>CLOSED {BR.rounds[closing].close}</span>
          </div>
        )}
        {just === 0 && t > ROUND_CLOSE[0] + 0.2 && (
          <div style={{ position: 'absolute', left: 0, width: 1920, top: 590, textAlign: 'center' }}>
            <span style={{ fontFamily: DELA, fontSize: 80, color: SUMI.ink, background: 'rgba(15,13,11,0.85)', padding: '6px 30px' }}>4 LOSE A LIFE · NOBODY’S OUT</span>
          </div>
        )}
        {just >= 1 && t > ROUND_CLOSE[just] + 0.2 && (
          <Placeholder id={`B06`} what={`HIT REACTIONS for the knock-outs (round ${just + 1}): one per eliminated principal, as THE LAST STAND's hit pose`} style={{ left: 560, top: 500, width: 800, height: 160 }} />
        )}
      </div>
      {flood < 1 && <AbsoluteFill style={{ background: PAPER.bg, WebkitMaskImage: `radial-gradient(circle at 50% 55%, transparent ${flood * 140}%, black ${flood * 140 + 6}%)` }} />}
      <Slate text={`S15-18 BR ROUNDS (round ${Math.min(4, round + 1)}) · ADAPTABLE (house cut-outs) · NEW B06 hit reactions`} />
    </AbsoluteFill>
  );
};
