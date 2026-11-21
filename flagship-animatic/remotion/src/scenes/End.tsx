// The end card: the final slam (bar 144) floods back to paper, the Yochi seal stamps on the track's last stab and
// the card holds on the track's own decay.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { DELA, Label, MONO, PAPER, Paper, Slate, ZEN } from '../lib/brand';
import { k, rise, shake, stamp } from '../lib/motion';
import { T } from '../data';

const P = T.payoff;
export const EndCard: React.FC<{ t: number; variant: string }> = ({ t }) => {
  const st = stamp(t, P.stab);
  const sh = shake(t, P.stab);
  const w = rise(t, P.stab + 0.25);
  const tag = rise(t, P.stab + 0.6);
  const url = rise(t, P.stab + 0.95);
  const flood = k(t, P.finalSlam, P.finalSlam + 0.4);
  return (
    <AbsoluteFill style={{ background: '#0f0d0b' }}>
      <AbsoluteFill style={{ WebkitMaskImage: `radial-gradient(circle at 50% 45%, black ${flood * 140}%, transparent ${flood * 140 + 6}%)`, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <Paper />
        <div style={{ position: 'absolute', left: 960 - 130, top: 170, width: 260, height: 260, transform: `scale(${st.s}) rotate(${st.r}deg)`, opacity: st.o }}>
          <Img src={staticFile('logo/yochi-seal-paper.svg')} style={{ width: 260, height: 260 }} />
        </div>
        <div style={{ position: 'absolute', width: 1920, top: 470, textAlign: 'center', fontFamily: DELA, fontSize: 150, color: PAPER.ink, opacity: w.o, transform: `translateY(${w.y}px)` }}>YOCHI</div>
        <div style={{ position: 'absolute', width: 1920, top: 665, textAlign: 'center', fontFamily: ZEN, fontWeight: 900, fontSize: 64, color: PAPER.ink, opacity: tag.o, transform: `translateY(${tag.y}px)` }}>Call it right. Take the pool.</div>
        <div style={{ position: 'absolute', width: 1920, top: 790, textAlign: 'center', fontFamily: MONO, fontWeight: 800, fontSize: 56, letterSpacing: '0.12em', color: PAPER.redText, opacity: url.o, transform: `translateY(${url.y}px)` }}>yochigg.xyz</div>
        <Label size={26} color={PAPER.muted} style={{ position: 'absolute', width: 1920, textAlign: 'center', top: 900, opacity: url.o }}>DUELS · FREE FOR ALL · BATTLE ROYALE</Label>
        {/* PLACEHOLDER copy: the real-money line awaits counsel's wording (OPEN_DECISIONS #11) */}
        <div style={{ position: 'absolute', width: 1920, top: 960, textAlign: 'center', fontFamily: MONO, fontSize: 22, color: '#0b7d86', opacity: url.o }}>[PLACEHOLDER LEGAL LINE] Real USDC. You can lose your stake.</div>
      </AbsoluteFill>
      <Slate text="S23 END CARD · READY (kit seal, fonts) · legal line TBC" />
    </AbsoluteFill>
  );
};
