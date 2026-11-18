// V2 0:17.7-0:20.6 (the outro's ritardando) the last one standing takes the pool, and 0:20.6-0:23.6 the end card,
// whose seal lands on the track's final stab.
//   hero      Perma-Bull (YOU) in 2.5D. LAST ONE STANDING / TAKES THE POOL with the 勝 seal on the beat; then the payout,
//             one line per beat: POOL 100 USDC, -5 USDC 5% RAKE, +95 USDC rising green (the real Battle Royale rule:
//             10 x 10 USDC in, the last one standing takes the pool less the 5% rake: real-br-picking.png / real-br-win.png)
//   end card  paper: the seal, YOCHI, BATTLE ROYALE, UP TO 10 PLAYERS · ONE SURVIVOR, the URL, responsible play
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { CharacterShot, IMPACT_HOUSE, type ShotSpec } from '../../../../../yochi-2p5d/remotion/src/lib';
import { BAND, MONO, PAPER, UP_PAPER } from '../lib/brand';
import { Slam, pick, useFmt, useT } from '../lib/frame';
import { InkField } from '../lib/InkField';
import { clamp, riseK, shakeAt, stampK } from '../lib/motion';
import { FPS, PAYOUT, POT, T, sec } from '../data';
import type { Status } from '../Film';

export const Hero: React.FC<{ status: Status }> = ({ status }) => {
  const Hh = T.hero;
  const t = useT(Hh.start);
  const { fmt, land, W, H, safe } = useFmt();
  // on Elysium the stake is HYPE (owner, 15 Nov 2026); everywhere else USDC
  const unit = status === 'elysium' ? 'HYPE' : 'USDC';
  const spec: ShotSpec = {
    character: 'starter-perma-bull', format: land ? '16:9' : '9:16', fps: FPS, durationInFrames: sec(Hh.end) - sec(Hh.start),
    camera: land ? { push: [1.0, 1.07], truck: [-20, 6], toTarget: 0.3 } : { push: [1.0, 1.09], truck: [-16, 8], toTarget: 0.4 },
    ambient: { breath: 0.006, sway: 0.3 }, light: { pool: 0.1, shadow: 0.24 }, atmosphere: { dust: 110, ink: 20, bokeh: 5 },
    impact: { frame: Math.round((Hh.seal - Hh.start) * FPS), ...IMPACT_HOUSE, seal: { glyph: '勝', at: land ? [0.885, 0.17] : [0.8, 0.4], size: land ? 180 : 230 }, burst: true },
  };
  const open = clamp((t - Hh.start) / 0.12);
  const rise = riseK(t, Hh.win);
  // the panel: right side in 16:9, the lower band in 9:16
  const P = pick(fmt,
    { box: { left: 1180, top: 0, width: W - 1180, height: H } as React.CSSProperties, cx: 342, cw: 604, y: [330, 422, 540, 650, 712, 772], s: [82, 82, 44, 42, 34, 112] },
    { box: { left: 0, top: 1130, width: W, height: 640 } as React.CSSProperties, cx: W / 2, cw: W, y: [26, 146, 278, 352, 410, 462], s: [116, 116, 50, 38, 32, 112] });
  return (
    <AbsoluteFill style={{ background: PAPER.bg, overflow: 'hidden' }}>
      <CharacterShot spec={spec} />
      <div style={{ position: 'absolute', ...P.box, background: BAND, boxShadow: '0 0 0 4px #16130f, 0 0 50px rgba(0,0,0,0.35)', transform: land ? `scaleX(${open})` : `scaleY(${open})`, transformOrigin: land ? '100% 50%' : '50% 0%' }}>
        <Slam t={t} t0={Hh.title} y={P.y[0]} size={P.s[0]} color={PAPER.ink} cx={P.cx} cw={P.cw}>LAST ONE</Slam>
        <Slam t={t} t0={Hh.title + 0.12} y={P.y[1]} size={P.s[1]} color={PAPER.ink} cx={P.cx} cw={P.cw}>STANDING</Slam>
        <Slam t={t} t0={Hh.seal} y={P.y[2]} size={P.s[2]} font="mono" color={PAPER.redText} cx={P.cx} cw={P.cw} from={1.2}>TAKES THE POOL</Slam>
        <Slam t={t} t0={Hh.pool} y={P.y[3]} size={P.s[3]} font="mono" color={PAPER.ink} cx={P.cx} cw={P.cw} tracking="0.08em" from={1.15}>POOL {POT} {unit}</Slam>
        <Slam t={t} t0={Hh.rake} y={P.y[4]} size={P.s[4]} font="mono" color={PAPER.out} cx={P.cx} cw={P.cw} tracking="0.08em" from={1.15}>−{POT - PAYOUT} {unit} · 5% RAKE</Slam>
        {rise.a > 0 && (
          <div style={{ position: 'absolute', left: P.cx - P.cw / 2, width: P.cw, top: P.y[5] + rise.y, opacity: rise.a, textAlign: 'center', whiteSpace: 'nowrap' }}>
            <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: P.s[5], color: UP_PAPER, textShadow: '0 0 18px rgba(61,220,132,0.35)' }}>+{PAYOUT}</span>
            <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: P.s[5] * 0.44, color: UP_PAPER, marginLeft: 14, letterSpacing: '0.08em' }}>{unit}</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const STATUS: Record<Status, { line?: string; url: string }> = {
  none: { url: 'yochigg.xyz' },
  'coming-soon': { line: 'COMING SOON', url: 'yochigg.xyz' },
  testnet: { line: 'LIVE ON TESTNET', url: 'testnet.yochigg.xyz' },
  elysium: { line: 'NOW LIVE ON ELYSIUM', url: 'yochigg.xyz' },
};

export const EndCard: React.FC<{ status: Status }> = ({ status }) => {
  const E = T.endcard;
  const t = useT(E.start);
  const { fmt, W, H, safe } = useFmt();
  const st = stampK(t, E.seal);
  const sh = shakeAt(t, [{ t: E.seal + 0.07, px: 6, dur: 0.38 }]);
  const S = STATUS[status];
  const L = pick(fmt,
    { seal: { y: 150, s: 250 }, yochi: [430, 128], br: [590, 80], sub: [702, 42], url: [806, 60], status: [900, 38], resp: [H - safe.y - 44, 24], one: true },
    { seal: { y: 400, s: 300 }, yochi: [750, 150], br: [990, 88], sub: [1120, 56], url: [1380, 68], status: [1482, 44], resp: [H - safe.y - 70, 28], one: false });
  return (
    <AbsoluteFill style={{ background: PAPER.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <InkField W={W} H={H} t={t} flood={0} />
        {st.a > 0 && (
          <Img src={staticFile('logo/yochi-seal-paper.svg')} style={{ position: 'absolute', left: W / 2 - L.seal.s / 2, top: L.seal.y, width: L.seal.s, height: L.seal.s, transform: `scale(${st.s}) rotate(${st.r}deg)`, opacity: st.a, filter: 'drop-shadow(0 8px 14px rgba(22,19,15,0.25))' }} />
        )}
      </div>
      <Slam t={t} t0={E.seal + 0.2} y={L.yochi[0]} size={L.yochi[1]} color={PAPER.ink}>YOCHI</Slam>
      <Slam t={t} t0={E.seal + 0.37} y={L.br[0]} size={L.br[1]} color={PAPER.ink}>BATTLE ROYALE</Slam>
      {L.one ? (
        <Slam t={t} t0={E.seal + 0.55} y={L.sub[0]} size={L.sub[1]} font="mono" color={PAPER.ink} from={1.15}>UP TO 10 PLAYERS · ONE SURVIVOR</Slam>
      ) : (
        <>
          <Slam t={t} t0={E.seal + 0.55} y={L.sub[0]} size={L.sub[1]} font="mono" color={PAPER.ink} from={1.15}>UP TO 10 PLAYERS</Slam>
          <Slam t={t} t0={E.seal + 0.65} y={L.sub[0] + 74} size={L.sub[1]} font="mono" color={PAPER.ink} from={1.15}>ONE SURVIVOR</Slam>
        </>
      )}
      <Slam t={t} t0={E.seal + 0.74} y={L.url[0]} size={L.url[1]} font="mono" color={PAPER.ink} tracking="0.04em" from={1.1}>{S.url}</Slam>
      {S.line && <Slam t={t} t0={E.seal + 0.85} y={L.status[0]} size={L.status[1]} font="mono" color={PAPER.redText} from={1.1}>{S.line}</Slam>}
      <Slam t={t} t0={E.seal + 0.85} y={L.resp[0]} size={L.resp[1]} font="mono" color={PAPER.muted} from={1}>18+ · REAL-MONEY GAMEPLAY · PLAY RESPONSIBLY</Slam>
    </AbsoluteFill>
  );
};
