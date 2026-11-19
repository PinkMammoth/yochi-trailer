// V2 0:17.7-0:20.6 (the outro's ritardando) the last one standing takes the pool, and 0:20.6-0:23.6 the end card,
// whose seal lands on the track's final stab.
//   hero      Perma-Bull (YOU) in 2.5D. LAST ONE STANDING / TAKES THE POOL with the 勝 seal on the beat; then the payout,
//             one line per beat: POOL 100 USDC, -5 USDC 5% RAKE, +95 USDC rising green (the real Battle Royale rule:
//             10 x 10 USDC in, the last one standing takes the pool less the 5% rake: real-br-picking.png / real-br-win.png)
//   end card  paper: the seal, YOCHI, BATTLE ROYALE, UP TO 10 PLAYERS · ONE SURVIVOR, the URL, responsible play
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { CharacterShot, IMPACT_HOUSE, Seal, type ShotSpec } from '../../../../../yochi-2p5d/remotion/src/lib';
import { BAND, MONO, PAPER, UP_PAPER } from '../lib/brand';
import { Canvas2D, Slam, pick, useFmt, useT } from '../lib/frame';
import { splatter } from '../lib/brush';
import { InkField } from '../lib/InkField';
import { clamp, easeOut, lerp, shakeAt, slamK, stampK } from '../lib/motion';
import { FPS, PAYOUT, T, sec } from '../data';
import type { Currency, Status } from '../Film';

export const Hero: React.FC<{ currency: Currency }> = ({ currency }) => {
  const Hh = T.hero;
  const t = useT(Hh.start);
  const { fmt, land, W, H } = useFmt();
  // the collateral is a prop (default USDC, the live HyperEVM version); the amount comes from data.ts
  const unit = currency;
  const winF = Math.round((Hh.win - Hh.start) * FPS);
  // V4: the shot's one impact is the payout on drop 2 (punch, shake, light, burst), with a slow lean-in across the
  // run-up as anticipation; the reveal itself is a camera slam (below)
  const spec: ShotSpec = {
    character: 'starter-perma-bull', format: land ? '16:9' : '9:16', fps: FPS, durationInFrames: sec(Hh.end) - sec(Hh.start),
    camera: land ? { push: [1.0, 1.08], truck: [-20, 6], toTarget: 0.35 } : { push: [1.0, 1.1], truck: [-16, 8], toTarget: 0.45 },
    ambient: { breath: 0.008, sway: 0.4 }, light: { pool: 0.14, shadow: 0.26 }, atmosphere: { dust: 160, ink: 28, bokeh: 7, wind: 1.3 },
    impact: { frame: winF, ...IMPACT_HOUSE, shake: 12, shakeDuration: 0.5, punch: 0.07, flash: 0.35, anticipation: winF - 10, seal: false, burst: true },
  };
  // the reveal: a camera slam (1.12 -> 1.0 in 0.3 s) and one paper-white frame
  const rev = easeOut(clamp((t - Hh.start) / 0.3));
  const revFlash = t - Hh.start < 1 / FPS ? 0.8 : 0;
  const open = clamp((t - Hh.start) / 0.12);
  // the payout: +95 slams in on drop 2 and holds; the panel shakes with it; the fresh win amount glows
  const win = slamK(t, Hh.win, 1.6, 0.14);
  const sh = shakeAt(t, [{ t: Hh.win, px: 10, dur: 0.45 }, { t: Hh.hit, px: 6, dur: 0.3 }]);
  const glow = t >= Hh.win ? 0.35 + 0.65 * Math.exp(-(t - Hh.win) * 3) : 0;
  const P = pick(fmt,
    { box: { left: 1180, top: 0, width: W - 1180, height: H } as React.CSSProperties, cx: 342, cw: 604, pw: 740, ph: H, y: [300, 392, 512, 612], s: [82, 82, 44, 190] },
    { box: { left: 0, top: 1130, width: W, height: 640 } as React.CSSProperties, cx: W / 2, cw: W, pw: W, ph: 640, y: [26, 146, 278, 360], s: [116, 116, 50, 180] });
  return (
    <AbsoluteFill style={{ background: PAPER.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px) scale(${lerp(1.12, 1, rev)})`, transformOrigin: land ? '35% 40%' : '50% 30%' }}>
        {/* 16:9: the shot slides 260 px left so the face clears the panel */}
        <div style={{ position: 'absolute', left: land ? -260 : 0, top: 0, width: W, height: H }}><CharacterShot spec={spec} /></div>
        {!land && <Seal spec={{ glyph: '勝', at: [0.8, 0.4], size: 230 }} hitFrame={Math.round((Hh.seal - Hh.start) * FPS)} W={W} H={H} ground="paper" shake={[0, 0]} />}
      </div>
      <div style={{ position: 'absolute', ...P.box, background: BAND, boxShadow: '0 0 0 4px #16130f, 0 0 50px rgba(0,0,0,0.35)', transform: `translate(${sh.x * 0.6}px, ${sh.y * 0.6}px) ${land ? `scaleX(${open})` : `scaleY(${open})`}`, transformOrigin: land ? '100% 50%' : '50% 0%' }}>
        {land && <Seal spec={{ glyph: '勝', at: [0.465, 0.13], size: 250 }} hitFrame={Math.round((Hh.seal - Hh.start) * FPS)} W={740} H={H} ground="paper" shake={[0, 0]} />}
        {/* ink thrown off the win as it lands (behind the type, kept to the number's own area) */}
        <div style={{ position: 'absolute', left: 0, top: P.y[3] - P.s[3] * 0.08, width: P.pw, height: P.s[3] * 1.4, overflow: 'hidden' }}>
          <Canvas2D draw={(ctx) => splatter(ctx, P.cx, P.s[3] * 0.62, P.s[3] * 0.95, clamp((t - Hh.win) / 0.25), 'rgba(22,19,15,0.6)', 951, 36)} />
        </div>
        <Slam t={t} t0={Hh.title} y={P.y[0]} size={P.s[0]} color={PAPER.ink} cx={P.cx} cw={P.cw}>LAST ONE</Slam>
        <Slam t={t} t0={Hh.title + 0.12} y={P.y[1]} size={P.s[1]} color={PAPER.ink} cx={P.cx} cw={P.cw}>STANDING</Slam>
        <Slam t={t} t0={Hh.seal} y={P.y[2]} size={P.s[2]} font="mono" color={PAPER.redText} cx={P.cx} cw={P.cw} from={1.2}>TAKES THE POOL</Slam>
        {win.a > 0 && (
          <div style={{ position: 'absolute', left: P.cx - P.cw / 2, width: P.cw, top: P.y[3], textAlign: 'center', whiteSpace: 'nowrap', transform: `scale(${win.s})` }}>
            <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: P.s[3], lineHeight: 1, color: UP_PAPER, textShadow: `0 0 ${24 + 30 * glow}px rgba(61,220,132,${0.25 + 0.4 * glow})` }}>+{PAYOUT}</span>
            <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: P.s[3] * 0.32, color: UP_PAPER, marginLeft: 16, letterSpacing: '0.08em' }}>{unit}</span>
          </div>
        )}
      </div>
      {revFlash > 0 && <AbsoluteFill style={{ background: '#fff8ea', opacity: revFlash }} />}
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
  const sh = shakeAt(t, [{ t: E.seal + 0.07, px: 9, dur: 0.42 }]);
  const inkP = clamp((t - (E.seal + 0.07)) / 0.22);
  const S = STATUS[status];
  const L = pick(fmt,
    { seal: { y: 150, s: 250 }, yochi: [430, 128], br: [590, 80], sub: [702, 42], url: [806, 60], status: [900, 38], resp: [H - safe.y - 44, 24], one: true },
    { seal: { y: 400, s: 300 }, yochi: [750, 150], br: [990, 88], sub: [1120, 56], url: [1380, 68], status: [1482, 44], resp: [H - safe.y - 70, 28], one: false });
  return (
    <AbsoluteFill style={{ background: PAPER.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <InkField W={W} H={H} t={t} flood={0} />
        {/* the stamp's ink: a small splatter where the seal lands (the house stamp recipe) */}
        <Canvas2D draw={(ctx) => splatter(ctx, W / 2, L.seal.y + L.seal.s / 2, L.seal.s * 0.85, inkP, 'rgba(22,19,15,0.5)', 4242, 26)} />
        {st.a > 0 && (
          <Img src={staticFile('logo/yochi-seal-paper.svg')} style={{ position: 'absolute', left: W / 2 - L.seal.s / 2, top: L.seal.y, width: L.seal.s, height: L.seal.s, transform: `scale(${st.s}) rotate(${st.r}deg)`, opacity: st.a, filter: 'drop-shadow(0 8px 14px rgba(22,19,15,0.25))' }} />
        )}
      </div>
      <Slam t={t} t0={E.seal + 0.1} y={L.yochi[0]} size={L.yochi[1]} color={PAPER.ink}>YOCHI</Slam>
      <Slam t={t} t0={E.start} y={L.br[0]} size={L.br[1]} color={PAPER.ink}>BATTLE ROYALE</Slam>
      {L.one ? (
        <Slam t={t} t0={E.start + 0.17} y={L.sub[0]} size={L.sub[1]} font="mono" color={PAPER.ink} from={1.15}>UP TO 10 PLAYERS · ONE SURVIVOR</Slam>
      ) : (
        <>
          <Slam t={t} t0={E.start + 0.17} y={L.sub[0]} size={L.sub[1]} font="mono" color={PAPER.ink} from={1.15}>UP TO 10 PLAYERS</Slam>
          <Slam t={t} t0={E.start + 0.27} y={L.sub[0] + 74} size={L.sub[1]} font="mono" color={PAPER.ink} from={1.15}>ONE SURVIVOR</Slam>
        </>
      )}
      <Slam t={t} t0={E.seal + 0.4} y={L.url[0]} size={L.url[1]} font="mono" color={PAPER.ink} tracking="0.04em" from={1.1}>{S.url}</Slam>
      {S.line && <Slam t={t} t0={E.seal + 0.55} y={L.status[0]} size={L.status[1]} font="mono" color={PAPER.redText} from={1.1}>{S.line}</Slam>}
      <Slam t={t} t0={E.seal + 0.55} y={L.resp[0]} size={L.resp[1]} font="mono" color={PAPER.muted} from={1}>18+ · REAL-MONEY GAMEPLAY · PLAY RESPONSIBLY</Slam>
    </AbsoluteFill>
  );
};
