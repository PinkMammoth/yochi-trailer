// ACT III + IV (recommended): FREE FOR ALL. One shared 5-minute candle, two sides, any stake, one pool.
// Entries land in the pick window (picks close before the candle opens); the side that's right splits the pool
// less the 5% rake, pro rata to stake, so many players win at once and each wins a different amount.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import castJson from '../../../assets/cast/cast.json';
import { BAND, DELA, DOWN, KANJI, Label, Moment, MONO, PAPER, Placeholder, Seal, Slate, SUMI, Sumi, UP, YUJI, ZEN } from '../lib/brand';
import { clamp, easeIn, easeInOut, easeOut, fade, k, lerp, rise, shake, slam, stamp } from '../lib/motion';
import { Chart, Shot, fmtClock, liveFrom, rnd } from '../lib/ui';
import { ART, FFA, FFA_POOL, T, mult, profit, usd, type Entrant } from '../data';

const A = T.act2;
const P = T.payoff;
const CAST = castJson as Record<string, { paint: number[]; head: number[] }>;
const ENTRY_LEN = 2 * T.beat;
const STRIKE = 41.79;
// the 5-minute candle: UP leads, the accent (bar 92) drops it through the strike, it claws back, closes just above
const price = (u: number) =>
  STRIKE + 0.05 * Math.sin(u * 7) * (1 - u) + (u < 0.48 ? 0.06 * easeOut(u / 0.48) : 0.06 - 0.16 * easeOut(k(u, 0.48, 0.58)) + 0.125 * easeInOut(k(u, 0.6, 1)));
const candleU = (t: number) => k(t, A.candleOpen, P.close);

const UPS = FFA.entrants.filter((e) => e.side === 'UP');
const DOWNS = FFA.entrants.filter((e) => e.side === 'DOWN');
const entryAt = (e: Entrant) => A.entries[FFA.entrants.indexOf(e)];
const slot = (e: Entrant) => {
  const list = e.side === 'UP' ? UPS : DOWNS;
  const i = list.indexOf(e);
  return e.side === 'UP' ? { x: 130 + i * 118, y: 1075, h: 360 } : { x: 1790 - i * 130, y: 1075, h: 360 };
};
/** Pool by side over the pick window: other players already in, the named entrants landing on their beats. */
const sideTotal = (t: number, side: 'UP' | 'DOWN') => {
  const final = side === 'UP' ? FFA.upTotal : FFA.downTotal;
  const named = FFA.entrants.filter((e) => e.side === side);
  const namedSum = named.reduce((a, e) => a + e.stake, 0);
  const crowd = (final - namedSum) * lerp(0.25, 1, easeInOut(k(t, A.start, A.lock)));
  return Math.round(crowd + named.filter((e) => t >= entryAt(e)).reduce((a, e) => a + e.stake, 0));
};

/** A painted figure from the house cut-outs, bottom-anchored at (x, y), h px tall. */
const Fig: React.FC<{ id: string; x: number; y: number; h: number; flip?: boolean; filter?: string; opacity?: number }> = ({ id, x, y, h, flip, filter, opacity = 1 }) => {
  const [pw, ph] = CAST[id]?.paint ?? [1392, 1828];
  const w = (h * pw) / ph;
  return <Img src={staticFile(`cast/${id}-fig.webp`)} style={{ position: 'absolute', left: x - w / 2, top: y - h, height: h, width: w, filter, opacity, transform: flip ? 'scaleX(-1)' : undefined }} />;
};
/** Crowd: background competitors as ink silhouettes (an allowed operation), rows receding up the frame. */
const CROWD = ['bloodsport', 'deadeye', 'untouchable', 'ronin', 'final-three', 'high-roller-v2', 'cold-blooded', 'starter-doomer', 'starter-fomo-v2', 'starter-lucky-fool',
  'took-the-pool', 'grudge-settled', 'last-legend', 'in-the-green', 'hundred-trials', 'bughunter', 'starter-night-shift', 'starter-degenerate', 'starter-paper-hands', 'starter-strategist-v3'];
const Crowd: React.FC<{ side: 'UP' | 'DOWN'; fill: number; lit: number; grey: number }> = ({ side, fill, lit, grey }) => {
  const rows = [{ y: 610, h: 140, n: 11 }, { y: 700, h: 190, n: 9 }, { y: 820, h: 250, n: 7 }];
  const out: React.ReactNode[] = [];
  let c = 0;
  rows.forEach((r, ri) => {
    for (let i = 0; i < r.n; i++) {
      c++;
      if (rnd(c * 7 + (side === 'UP' ? 1 : 2)) > fill) continue;
      const x0 = side === 'UP' ? 60 : 1100, span = 760;
      const x = x0 + (span * (i + 0.5)) / r.n + 30 * rnd(c);
      const b = lerp(0.12, 0.3, lit) * (1 - grey * 0.3);
      out.push(<Fig key={`${ri}-${i}`} id={CROWD[(c * 3 + ri) % CROWD.length]} x={x} y={r.y} h={r.h} filter={`brightness(${b}) saturate(0)`} opacity={0.9} />);
    }
  });
  return <>{out}</>;
};

const Band: React.FC<{ t: number; locked: boolean; live: boolean; up: number; down: number }> = ({ t, locked, live, up, down }) => {
  const pool = up + down;
  const mu = (pool * (1 - FFA.rake)) / up, md = (pool * (1 - FFA.rake)) / down;
  const clock = live ? fmtClock(300 * (1 - candleU(t))) : fmtClock(Math.max(0, 12 * (1 - k(t, A.start, A.lock))));
  return (
    <div style={{ position: 'absolute', left: 96, right: 96, top: 54, height: 190, background: BAND, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 36, top: 26 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 22 }}><Moment size={78} color={PAPER.ink}>▲ UP</Moment><span style={{ fontFamily: MONO, fontWeight: 800, fontSize: 52, color: '#15804a' }}>{mu.toFixed(2)}x</span></div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: '0.15em', color: PAPER.muted, marginTop: 14 }}>{usd(up).replace('.00', '')} USDC</div>
      </div>
      <div style={{ position: 'absolute', right: 36, top: 26, textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 22, justifyContent: 'flex-end' }}><span style={{ fontFamily: MONO, fontWeight: 800, fontSize: 52, color: '#c2304d' }}>{md.toFixed(2)}x</span><Moment size={78} color={PAPER.ink}>DOWN ▼</Moment></div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: '0.15em', color: PAPER.muted, marginTop: 14 }}>{usd(down).replace('.00', '')} USDC</div>
      </div>
      <div style={{ position: 'absolute', left: 864 - 96 - 120, top: -20, width: 430, height: 230, background: SUMI.red, transform: 'skewX(-18deg)' }} />
      <div style={{ position: 'absolute', left: 864 - 96 - 140, width: 470, top: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#140f0c' }}>
        <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 22, letterSpacing: '0.2em' }}>{live ? 'LIVE · 5M CANDLE' : locked ? 'PICKS LOCKED' : 'PICKS CLOSE'}</div>
        <div style={{ fontFamily: DELA, fontSize: 70, lineHeight: 1.1 }}>{clock}</div>
        <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 26, letterSpacing: '0.12em' }}>POOL {usd(pool).replace('.00', '')}</div>
      </div>
    </div>
  );
};

/** The field: two sides, the strike across it as the front line, the live candle in the middle. */
const Field: React.FC<{ t: number; grey?: 'UP' | 'DOWN' | null; cam?: number }> = ({ t, grey = null, cam = 0 }) => {
  const fill = lerp(0.35, 1, easeInOut(k(t, A.start, A.lock)));
  const u = candleU(t);
  const live = t >= A.candleOpen;
  const lc = live ? liveFrom(price, u) : null;
  const lead = lc ? (lc.c >= STRIKE ? 'UP' : 'DOWN') : null;
  const g = (s: 'UP' | 'DOWN') => (grey === s ? 1 : 0);
  const sh = shake(t, P.close, 14, 0.6);
  return (
    <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${1 + cam})`, transformOrigin: '50% 60%' }}>
      <Sumi />
      <div style={{ position: 'absolute', inset: 0, filter: g('UP') ? 'grayscale(1) brightness(0.6)' : undefined }}><Crowd side="UP" fill={fill} lit={lead === 'UP' ? 1 : 0} grey={g('UP')} /></div>
      <div style={{ position: 'absolute', inset: 0, filter: g('DOWN') ? 'grayscale(1) brightness(0.6)' : undefined }}><Crowd side="DOWN" fill={fill} lit={lead === 'DOWN' ? 1 : 0} grey={g('DOWN')} /></div>
      {/* the front line: the strike drawn across the whole field */}
      {live && <div style={{ position: 'absolute', left: 0, right: 0, top: 690, height: 0, borderTop: `3px dashed ${SUMI.ink}`, opacity: 0.6 }} />}
      {lc && (
        <div style={{ position: 'absolute', left: 860, top: 330 }}>
          <Chart W={200} H={720} past={[]} live={lc} strike={STRIKE} lo={STRIKE - 0.14} hi={STRIKE + 0.14} liveScale={2.2} grid={false} />
        </div>
      )}
      {FFA.entrants.filter((e) => t >= entryAt(e) + ENTRY_LEN).map((e) => {
        const s = slot(e);
        const lost = grey === e.side;
        return <Fig key={e.id} id={e.id} x={s.x} y={s.y} h={s.h} filter={lost ? 'grayscale(1) brightness(0.7)' : undefined} />;
      })}
      {t >= A.lock && t < P.close &&
        FFA.entrants.map((e, i) => {
          const s = slot(e);
          const st = stamp(t, A.lock + 0.03 * i);
          return <div key={e.id} style={{ position: 'absolute', left: s.x - 30, top: s.y - s.h - 10, transform: `scale(${st.s}) rotate(${st.r}deg)`, opacity: st.o }}><Seal glyph={KANJI.lock} size={60} /></div>;
        })}
    </AbsoluteFill>
  );
};

/** One entrant landing: their painting slams in on their side with the stake; the house slam. */
const EntrySlam: React.FC<{ e: Entrant; t: number }> = ({ e, t }) => {
  const at = entryAt(e);
  const s = slam(t, at);
  const up = e.side === 'UP';
  const hero = e.id === 'duel-master';
  const big = hero ? 900 : 780;
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `scale(${s.s})`, transformOrigin: up ? '30% 70%' : '70% 70%' }}>
      <AbsoluteFill style={{ background: 'rgba(15,13,11,0.55)' }} />
      <Fig id={e.id} x={up ? 560 : 1360} y={1100} h={big} />
      <div style={{ position: 'absolute', top: 380, [up ? 'left' : 'right']: up ? 980 : 980, textAlign: up ? 'left' : 'right' } as React.CSSProperties}>
        <Label size={34} color={SUMI.muted}>{e.handle}</Label>
        <Moment size={110} color={up ? UP : DOWN} style={{ marginTop: 10 }}>{up ? '▲ UP' : '▼ DOWN'}</Moment>
        <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 64, color: SUMI.ink, marginTop: 14 }}>{e.stake} USDC</div>
      </div>
    </div>
  );
};

const Insert: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => (
  <AbsoluteFill style={{ background: SUMI.bg }}>{children}<Slate text={label} /></AbsoluteFill>
);

export const FFAAct: React.FC<{ t: number }> = ({ t }) => {
  const flood = k(t, A.start, A.start + 0.4); // the ink drop floods paper into sumi as the round begins
  const up = t < A.lock ? sideTotal(t, 'UP') : FFA.upTotal;
  const down = t < A.lock ? sideTotal(t, 'DOWN') : FFA.downTotal;
  const locked = t >= A.lock, live = t >= A.candleOpen;
  const u = candleU(t);
  const lc = liveFrom(price, u);
  // ------------------------------------------------ the tension inserts (the lighter section, bars 88-95)
  if (t >= A.tension + 2 * 1.3638 && t < A.tension + 3 * 1.3638) {
    return (
      <Insert label="S19b HER, COMPOSED · READY (kit card) · IF IT CLOSED NOW">
        <Shot src={ART.dmCard.src} w={1536} h={2048} fx={ART.dmCard.face[0]} fy={ART.dmCard.face[1]} zoom={1.25 + 0.05 * k(t, A.tension + 2.7, A.tension + 4.1)} sx={700} sy={520} />
        <div style={{ position: 'absolute', right: 110, top: 700, textAlign: 'right' }}>
          <Label size={30} color={SUMI.muted}>mira · 25 USDC ▲ UP</Label>
          <Label size={30} color={SUMI.muted} style={{ marginTop: 18 }}>IF IT CLOSED NOW</Label>
          <div style={{ fontFamily: DELA, fontSize: 90, color: lc.c >= STRIKE ? UP : SUMI.out, marginTop: 8 }}>{lc.c >= STRIKE ? `+${usd(profit(25, 'UP'))}` : '−25.00'}</div>
        </div>
      </Insert>
    );
  }
  if (t >= A.tension + 3 * 1.3638 && t < A.accent) {
    return (
      <Insert label="S19c HIGH ROLLER · ADAPTABLE (house cut-out; her card flips the chip)">
        <Fig id="high-roller-v2" x={760} y={1180} h={1250} />
        <div style={{ position: 'absolute', right: 120, top: 420, textAlign: 'right' }}>
          <Label size={30} color={SUMI.muted}>high_roll · ▲ UP</Label>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 80, color: SUMI.ink }}>100 USDC</div>
        </div>
      </Insert>
    );
  }
  if (t >= A.accent && t < A.accent + 1.3638) {
    return (
      <Insert label="S19d RAMPAGE IS BACK (on DOWN) · READY (kit card) · price under the strike">
        <Shot src={ART.rampageCard.src} w={1536} h={2048} fx={ART.rampageCard.face[0]} fy={ART.rampageCard.face[1]} zoom={1.5} sx={1150} sy={500} />
        <div style={{ position: 'absolute', left: 110, top: 690 }}>
          <Label size={30} color={SUMI.muted}>brick · 50 USDC</Label>
          <Moment size={150} color={DOWN} style={{ marginTop: 8 }}>▼ DOWN</Moment>
        </div>
      </Insert>
    );
  }
  if (t >= A.lastBar && t < P.close) {
    // bar 95: the last second. Her eyes | the candle on the strike | his grin
    return (
      <AbsoluteFill style={{ background: SUMI.bg }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 620, height: 1080, overflow: 'hidden' }}>
          <Shot src={ART.dmCard.src} w={1536} h={2048} fx={ART.dmCard.eyes[0]} fy={ART.dmCard.eyes[1]} zoom={2.2} sx={310} sy={540} />
        </div>
        <div style={{ position: 'absolute', left: 1300, top: 0, width: 620, height: 1080, overflow: 'hidden' }}>
          <Shot src={ART.rampageCard.src} w={1536} h={2048} fx={ART.rampageCard.face[0]} fy={ART.rampageCard.face[1]} zoom={1.9} sx={310} sy={560} />
        </div>
        <div style={{ position: 'absolute', left: 860, top: 160 }}><Chart W={200} H={720} past={[]} live={lc} strike={STRIKE} lo={STRIKE - 0.14} hi={STRIKE + 0.14} liveScale={2.2} grid={false} /></div>
        <div style={{ position: 'absolute', left: 620, width: 680, top: 900, textAlign: 'center', fontFamily: DELA, fontSize: 110, color: SUMI.ink }}>0:01</div>
        <Slate text="S19f THE LAST SECOND · READY" />
      </AbsoluteFill>
    );
  }
  // ------------------------------------------------ the payoff (outro slam, bar 136)
  if (t >= P.close) {
    const f = Math.floor((t - P.close) * T.fps);
    if (f === 0) return <AbsoluteFill style={{ background: '#fff8ef' }} />;
    const greyIn = k(t, P.close, P.close + 0.5);
    // the callback: his disbelief, grey, again
    if (t >= P.close + 0.55 && t < P.hits[0]) {
      return (
        <AbsoluteFill style={{ background: PAPER.bg }}>
          <Shot src={ART.disbelief.src} w={1500} h={2000} fx={ART.disbelief.face[0]} fy={ART.disbelief.face[1]} zoom={1.7} sx={960} sy={540} filter="grayscale(1)" />
          <div style={{ position: 'absolute', left: 140, top: 140 }}><Seal glyph={KANJI.loss} size={130} color={PAPER.out} ink={PAPER.bg} /></div>
          <Label size={40} color={PAPER.out} style={{ position: 'absolute', left: 140, top: 300 }}>brick −50</Label>
          <Slate text="S21 RAMPAGE, AGAIN (grey) · READY (approved disbelief pose)" />
        </AbsoluteFill>
      );
    }
    const breath = k(t, P.breath, P.finalSlam);
    const st = stamp(t, P.hits[1]);
    const payouts: [Entrant, number][] = [[FFA.entrants[10], P.hits[2]], [FFA.entrants[0], P.hits[3]], [FFA.entrants[2], P.hits[4]], [FFA.entrants[6], P.hits[5]]];
    const sup = rise(t, P.hits[6], 0.6);
    return (
      <AbsoluteFill>
        <Field t={t} grey={greyIn > 0.5 ? 'DOWN' : null} cam={-0.12 * easeInOut(breath)} />
        <Band t={t} locked live up={FFA.upTotal} down={FFA.downTotal} />
        <div style={{ position: 'absolute', left: 0, width: 1920, top: 270, textAlign: 'center', opacity: fade(t, P.close, P.close + 0.05, P.hits[1] - 0.3, P.hits[1]) }}>
          <Moment size={150} color={UP}>CLOSED UP</Moment>
        </div>
        {t >= P.hits[1] - 0.5 && t < P.hits[6] && (
          <div style={{ position: 'absolute', left: 0, width: 1920, top: 280, display: 'flex', justifyContent: 'center', opacity: 1 - k(t, P.hits[6] - 0.25, P.hits[6]) }}>
            <div style={{ transform: `scale(${st.s}) rotate(${st.r}deg)`, opacity: st.o, background: SUMI.red, color: '#140f0c', fontFamily: DELA, fontSize: 120, padding: '6px 34px', borderRadius: 18 }}>CALLED IT</div>
          </div>
        )}
        {/* winners (UP, left) take different amounts from one pool; losers (DOWN, right) lose their stakes, grey */}
        {payouts.map(([e, at], i) => {
          const r = rise(t, at);
          return t >= at ? (
            <div key={e.id} style={{ position: 'absolute', left: 110, top: 470 + i * 112 + r.y, opacity: r.o * (1 - k(t, P.finalSlam - 1.2, P.finalSlam - 0.6)), background: 'rgba(15,13,11,0.72)', padding: '4px 16px' }}>
              <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, color: SUMI.ink, letterSpacing: '0.1em' }}>{e.handle} · {e.stake} → </span>
              <span style={{ fontFamily: DELA, fontSize: e.id === 'duel-master' ? 70 : 56, color: UP, textShadow: '0 0 18px rgba(61,220,132,0.4)' }}>+{usd(profit(e.stake, 'UP'))}</span>
            </div>
          ) : null;
        })}
        {DOWNS.slice(0, 3).map((e, i) => {
          const r = rise(t, P.hits[2] + i * 0.34);
          return t >= P.hits[2] ? (
            <div key={e.id} style={{ position: 'absolute', right: 110, top: 470 + i * 100 + r.y, opacity: r.o * (1 - k(t, P.finalSlam - 1.2, P.finalSlam - 0.6)), textAlign: 'right', background: 'rgba(15,13,11,0.72)', padding: '4px 16px' }}>
              <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, color: SUMI.out, letterSpacing: '0.1em' }}>{e.handle} </span>
              <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: 44, color: SUMI.out }}>−{e.stake}.00</span>
            </div>
          ) : null;
        })}
        {t >= P.hits[6] && (
          <div style={{ position: 'absolute', left: 0, width: 1920, top: 300, textAlign: 'center', opacity: sup.o * (1 - k(t, P.finalSlam - 0.6, P.finalSlam - 0.2)), transform: `translateY(${sup.y}px)` }}>
            <span style={{ fontFamily: ZEN, fontWeight: 900, fontSize: 72, color: SUMI.ink, background: 'rgba(15,13,11,0.75)', padding: '8px 28px' }}>The side that’s right splits the pool.</span>
          </div>
        )}
        <Slate text={t < P.breath ? 'S20-21 THE CLOSE / PAYOUTS · ADAPTABLE (crowd = NEW-HI B04)' : 'S22 THE BREATH: the field, winners lit · ADAPTABLE'} />
      </AbsoluteFill>
    );
  }
  // ------------------------------------------------ the field, entries, lock, the live candle
  const entering = FFA.entrants.find((e) => t >= entryAt(e) && t < entryAt(e) + ENTRY_LEN);
  const push = live ? 0.06 * easeInOut(k(t, A.candleOpen, A.lastBar)) : 0;
  return (
    <AbsoluteFill>
      <Field t={t} cam={push} />
      <Band t={t} locked={locked} live={live} up={up} down={down} />
      {entering && <EntrySlam e={entering} t={t} />}
      {/* the ink flood (sumi drop over the paper world) */}
      {flood < 1 && (
        <AbsoluteFill style={{ background: PAPER.bg, WebkitMaskImage: `radial-gradient(circle at 50% 55%, transparent ${flood * 140}%, black ${flood * 140 + 6}%)` }} />
      )}
      {t >= A.lock && t < A.lock + 1.0 && <Label size={52} weight={800} color={SUMI.ink} style={{ position: 'absolute', width: 1920, textAlign: 'center', top: 300 }}>PICKS LOCKED</Label>}
      {live && t < A.candleOpen + 1.0 && <Label size={52} weight={800} color={SUMI.ink} style={{ position: 'absolute', width: 1920, textAlign: 'center', top: 300 }}>THE CANDLE OPENS</Label>}
      <Slate text={entering ? `S15-16 ENTRY ${FFA.entrants.indexOf(entering) + 1}/11 ${entering.name} · ADAPTABLE (fig) · NEW-HI entry poses B03` : live ? 'S18-19 THE 5M CANDLE · ADAPTABLE (crowd = NEW-HI B04)' : locked ? 'S17 PICKS LOCK · ADAPTABLE' : 'S15 THE FIELD FILLS · ADAPTABLE'} />
      {t < A.start + 2.2 && <Placeholder id="B04" what="CROWD PLATE: hundreds of players on two sides (ink silhouettes stand in)" style={{ left: 600, top: 960, width: 720, height: 80 }} />}
    </AbsoluteFill>
  );
};
