// The default production component: one painted character, brought to life in 2.5D, in 16:9 or 9:16.
//
//   <CharacterShot spec={{ character: 'untouchable', format: '9:16', durationInFrames: 150,
//                          impact: { frame: 96, ...IMPACT_DRAMATIC, slash: {...}, seal: {...}, burst: true } }} />
//
// What it is for: bringing an illustration to life (breath, sway, parallax, push, world light, atmosphere,
// one impact). What it is NOT for: choreography. For dynamic sequences cut between shots (Remotion <Series>),
// swap to other paintings, use the 'silhouette' / 'grey' variants, camera moves and impact frames.
import React, { useLayoutEffect, useState } from 'react';
import { AbsoluteFill, Img, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { tokens } from './brand';
import { PlateCompositor } from './PlateCompositor';
import { Atmosphere, Grade } from './Atmosphere';
import { Seal } from './Seal';
import { drawSlash, slashCenter } from './slash';
import { framingFor, shotState, type CharacterMeta, type ShotSpec, type ShotState, type SlashSpec } from './shot';

// Yuji Syuku for seal glyphs (kanji only), loaded once.
let fontPromise: Promise<void> | null = null;
function useGlyphFont() {
  const [h] = useState(() => delayRender('glyph font'));
  useLayoutEffect(() => {
    fontPromise ??= new FontFace('YujiSyuku', `url(${staticFile('fonts/YujiSyuku-Regular.ttf')})`).load().then((ff) => {
      (document.fonts as unknown as { add: (f: FontFace) => void }).add(ff);
    });
    fontPromise.then(() => continueRender(h));
  }, [h]);
}

const metaCache = new Map<string, Promise<CharacterMeta>>();
export function useCharacter(id: string): CharacterMeta | null {
  const [meta, setMeta] = useState<CharacterMeta | null>(null);
  const [h] = useState(() => delayRender('character ' + id));
  useLayoutEffect(() => {
    if (!metaCache.has(id)) metaCache.set(id, fetch(staticFile(`characters/${id}/meta.json`)).then((r) => r.json()));
    metaCache.get(id)!.then((m) => {
      setMeta(m);
      continueRender(h);
    });
  }, [id, h]);
  return meta;
}

/** Overlays shared by every 2.5D shot (also used over Blender passes): atmosphere + burst, seal, grade. */
export const ShotOverlays: React.FC<{ spec: ShotSpec; state: ShotState; meta: CharacterMeta; motes?: boolean; clean?: boolean }> = ({ spec, state, meta, motes = true, clean }) => {
  const ground = spec.ground ?? 'paper';
  const im = spec.impact;
  const slash = im && im.slash ? im.slash : null;
  if (clean) return null;
  return (
    <>
      {slash && !(slash.behind ?? true) && <SlashFront spec={spec} state={state} />}
      <Atmosphere spec={spec} state={state} ground={ground} showMotes={motes} faceAt={meta.head} burstFrom={im?.burst ? (slash ? [slash.from, slash.to] : [[0.5, 0.5], [0.5, 0.5]]) : undefined} />
      {im && im.seal && <Seal spec={im.seal} hitFrame={im.frame} W={state.W} H={state.H} ground={ground} shake={[state.cam.shakeX, state.cam.shakeY]} />}
      {spec.grade !== false && <Grade W={state.W} H={state.H} vignette={spec.grade?.vignette} grain={spec.grade?.grain} />}
    </>
  );
};

/** 'auto' slash tone follows the character: sumi ink where its ground is vermilion. */
export const resolveSlash = (slash: SlashSpec, meta: CharacterMeta, format: ShotSpec['format']): SlashSpec => {
  const tone = slash.tone === 'auto' || slash.tone === undefined ? meta.slashTone ?? 'red' : slash.tone;
  const routed = slash.route === 'auto' ? meta.slash?.[format] : undefined;
  return routed ? { ...slash, tone, from: routed.from, to: routed.to, behind: routed.behind } : { ...slash, tone };
};

const SlashFront: React.FC<{ spec: ShotSpec; state: ShotState }> = ({ spec, state }) => {
  const f = useCurrentFrame();
  const ref = React.useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.clearRect(0, 0, state.W, state.H);
    ctx.save();
    ctx.translate(state.W / 2 + state.cam.shakeX, state.H / 2 + state.cam.shakeY);
    ctx.rotate((state.cam.shakeRot * Math.PI) / 180);
    ctx.translate(-state.W / 2, -state.H / 2);
    drawSlash(ctx, spec.impact!.slash as never, f, spec.impact!.frame, state.W, state.H, spec.ground ?? 'paper');
    ctx.restore();
  });
  return <canvas ref={ref} width={state.W} height={state.H} style={{ position: 'absolute', inset: 0 }} />;
};

export const CharacterShot: React.FC<{ spec: ShotSpec; clean?: boolean }> = ({ spec, clean }) => {
  useGlyphFont();
  const meta = useCharacter(spec.character);
  const f = useCurrentFrame();
  const ground = spec.ground ?? 'paper';
  if (!meta) return <AbsoluteFill style={{ background: tokens(ground).bg }} />;
  const state = shotState(spec, meta, f);
  const im = spec.impact;
  const slash = im && im.slash ? resolveSlash(im.slash, meta, spec.format) : null;
  const behind = slash && (slash.behind ?? true) && !clean ? slash : null;
  const spec2: ShotSpec = im && slash ? { ...spec, impact: { ...im, slash } } : spec;
  return (
    <AbsoluteFill style={{ background: tokens(ground).bg }}>
      <PlateCompositor
        meta={meta}
        state={state}
        ground={ground}
        drawBehind={behind ? (ctx) => drawSlash(ctx, behind, f, im!.frame, state.W, state.H, ground) : undefined}
        shockCenter={slash ? slashCenter(slash) : [0.5, 0.5]}
        framing0={framingFor(meta, spec.format, spec.framing).center}
      />
      <ShotOverlays spec={spec2} state={state} meta={meta} clean={clean} />
      {/* card format: the card's own frame, static, over the living painting (the plate rect, 1:1) */}
      {spec.format === 'card' && (
        <Img src={staticFile(`characters/${meta.id}/frame.png`)} style={{ position: 'absolute', inset: 0, width: state.W, height: state.H }} />
      )}
    </AbsoluteFill>
  );
};

/**
 * The Blender path, for the occasional shot that genuinely benefits from physical depth, light or camera
 * movement. Blender (yochi-2p5d/blender/build_shot.py) renders `back` and `front` RGBA passes from the same
 * ShotSpec; this stacks back -> slash -> front and adds the same overlays, so a Blender shot cuts seamlessly
 * with CharacterShot shots.
 */
export const BlenderPasses: React.FC<{ spec: ShotSpec; passes: string }> = ({ spec, passes }) => {
  useGlyphFont();
  const meta = useCharacter(spec.character);
  const f = useCurrentFrame();
  const ground = spec.ground ?? 'paper';
  if (!meta) return <AbsoluteFill style={{ background: tokens(ground).bg }} />;
  const state = shotState(spec, meta, f);
  const im = spec.impact;
  const slash = im && im.slash ? im.slash : null;
  const pad = String(f).padStart(4, '0');
  return (
    <AbsoluteFill style={{ background: tokens(ground).bg }}>
      <AbsoluteFill style={{ filter: state.impact.inkFrame ? 'grayscale(1) contrast(40) invert(1) sepia(0.12)' : undefined }}>
        <Img src={staticFile(`${passes}/back/${pad}.png`)} style={{ position: 'absolute', inset: 0, width: state.W, height: state.H }} />
        {slash && (slash.behind ?? true) && <SlashFront spec={spec} state={state} />}
        <Img src={staticFile(`${passes}/front/${pad}.png`)} style={{ position: 'absolute', inset: 0, width: state.W, height: state.H }} />
        <AbsoluteFill style={{ background: '#fff8ea', opacity: state.impact.flash * 0.35 }} />
      </AbsoluteFill>
      <ShotOverlays spec={{ ...spec, impact: im && slash && (slash.behind ?? true) ? { ...im, slash: { ...slash, behind: true } } : im }} state={state} meta={meta} motes={false} />
    </AbsoluteFill>
  );
};
