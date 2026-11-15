// 0:14.4-0:16.4 the last one standing (Perma-Bull, YOU, in 2.5D), and 0:16.4-0:19.2 the paper end card.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { CharacterShot, IMPACT_HOUSE, type ShotSpec } from '../../../../yochi-2p5d/remotion/src/lib';
import { BAND, MONO, PAPER, UP_PAPER } from '../lib/brand';
import { H, SAFE, Slam, W, useT } from '../lib/frame';
import { InkField } from '../lib/InkField';
import { clamp, riseK, shakeAt, stampK } from '../lib/motion';
import { FPS, PAYOUT, T, sec } from '../data';
import type { Status } from '../Film';

export const Hero: React.FC<{ status: Status }> = ({ status }) => {
  // on Elysium the stake is HYPE (owner, 15 Nov 2026); everywhere else USDC
  const unit = status === 'elysium' ? 'HYPE' : 'USDC';
  const Hh = T.hero;
  const t = useT(Hh.start);
  const spec: ShotSpec = {
    character: 'starter-perma-bull', format: '9:16', fps: FPS, durationInFrames: sec(Hh.end) - sec(Hh.start),
    camera: { push: [1.0, 1.09], truck: [-16, 8], toTarget: 0.4 },
    ambient: { breath: 0.006, sway: 0.3 }, light: { pool: 0.1, shadow: 0.24 }, atmosphere: { dust: 110, ink: 20, bokeh: 5 },
    impact: { frame: Math.round((Hh.seal - Hh.start) * FPS), ...IMPACT_HOUSE, seal: { glyph: '勝', at: [0.8, 0.4], size: 230 }, burst: true },
  };
  const band = clamp((t - Hh.title + 0.06) / 0.14);
  const rise = riseK(t, Hh.seal + 0.12);
  return (
    <AbsoluteFill style={{ background: PAPER.bg, overflow: 'hidden' }}>
      <CharacterShot spec={spec} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1160, height: 570, background: BAND, boxShadow: '0 0 0 4px #16130f, 0 -10px 50px rgba(0,0,0,0.35)', transform: `scaleY(${band})`, transformOrigin: '50% 0%' }}>
        <Slam t={t} t0={Hh.title} y={34} size={116} color={PAPER.ink}>LAST ONE</Slam>
        <Slam t={t} t0={Hh.title + 0.1} y={160} size={116} color={PAPER.ink}>STANDING</Slam>
        {rise.a > 0 && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: 300 + rise.y, opacity: rise.a, textAlign: 'center', whiteSpace: 'nowrap' }}>
            <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: 100, color: UP_PAPER, textShadow: '0 0 18px rgba(61,220,132,0.35)' }}>+{PAYOUT}</span>
            <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: 46, color: UP_PAPER, marginLeft: 16, letterSpacing: '0.08em' }}>{unit}</span>
          </div>
        )}
        <Slam t={t} t0={Hh.seal + 0.3} y={448} size={34} font="mono" color={PAPER.muted} from={1.1}>OUTLASTED 9 · 7 ROUNDS</Slam>
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
  const st = stampK(t, E.seal);
  const sh = shakeAt(t, [{ t: E.seal + 0.07, px: 6, dur: 0.38 }]);
  const S = STATUS[status];
  return (
    <AbsoluteFill style={{ background: PAPER.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <InkField W={W} H={H} t={t} flood={0} />
        {st.a > 0 && (
          <Img src={staticFile('logo/yochi-seal-paper.svg')} style={{ position: 'absolute', left: W / 2 - 150, top: 400, width: 300, height: 300, transform: `scale(${st.s}) rotate(${st.r}deg)`, opacity: st.a, filter: 'drop-shadow(0 8px 14px rgba(22,19,15,0.25))' }} />
        )}
      </div>
      <Slam t={t} t0={E.seal + 0.18} y={750} size={150} color={PAPER.ink}>YOCHI</Slam>
      <Slam t={t} t0={E.start + 0.04} y={990} size={88} color={PAPER.ink}>BATTLE ROYALE</Slam>
      <Slam t={t} t0={E.start + 0.2} y={1120} size={56} font="mono" color={PAPER.ink} from={1.15}>UP TO 10 PLAYERS</Slam>
      <Slam t={t} t0={E.start + 0.32} y={1194} size={56} font="mono" color={PAPER.ink} from={1.15}>ONE SURVIVOR</Slam>
      <Slam t={t} t0={E.seal + 0.36} y={1380} size={68} font="mono" color={PAPER.ink} tracking="0.04em" from={1.1}>{S.url}</Slam>
      {S.line && <Slam t={t} t0={E.seal + 0.5} y={1482} size={44} font="mono" color={PAPER.redText} from={1.1}>{S.line}</Slam>}
      <Slam t={t} t0={E.seal + 0.5} y={H - SAFE.y - 70} size={28} font="mono" color={PAPER.muted} from={1}>18+ · REAL-MONEY GAMEPLAY · PLAY RESPONSIBLY</Slam>
    </AbsoluteFill>
  );
};
