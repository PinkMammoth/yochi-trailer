// Implementation B: Blender-assisted 2.5D, composited in Remotion.
// Blender (demo-2p5d/blender/build_scene.py) renders two RGBA passes per frame from the same
// timeline: `back` (depth-displaced background + far ink motes) and `front` (the bas-relief
// figure on its armature/wind rig, lit by a moving sun, + near motes with real DOF).
// Remotion stacks back -> ink slash -> front, then the shared burst, seal and grade.
import React, { useLayoutEffect, useRef } from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { H, IMPACT, W, camera, light } from '../shared/timeline';
import { drawSlash } from '../shared/slash';

const pad = (n: number) => String(n).padStart(4, '0');

const SlashLayer: React.FC = () => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    const cam = camera(f);
    ctx.save();
    // the plates shake through Blender's lens shift; the slash shakes with them
    ctx.translate(W / 2 + cam.shakeX, H / 2 + cam.shakeY);
    ctx.rotate((cam.shakeRot * Math.PI) / 180);
    ctx.translate(-W / 2, -H / 2);
    drawSlash(ctx, f);
    ctx.restore();
  }, [f]);
  return <canvas ref={ref} width={W} height={H} style={{ position: 'absolute', inset: 0 }} />;
};

export const BlenderShot: React.FC = () => {
  const f = useCurrentFrame();
  const inkFrame = f === IMPACT || f === IMPACT + 1;
  const flash = light(f).flash;
  return (
    <AbsoluteFill
      style={{
        // manga impact frame: threshold to ink and invert (A does the same in its shader)
        filter: inkFrame ? 'grayscale(1) contrast(40) invert(1) sepia(0.12)' : undefined,
      }}
    >
      <Img src={staticFile(`blender/back/${pad(f)}.png`)} style={{ position: 'absolute', inset: 0, width: W, height: H }} />
      <SlashLayer />
      <Img src={staticFile(`blender/front/${pad(f)}.png`)} style={{ position: 'absolute', inset: 0, width: W, height: H }} />
      <AbsoluteFill style={{ background: '#fff8ea', opacity: flash * 0.35 }} />
    </AbsoluteFill>
  );
};
