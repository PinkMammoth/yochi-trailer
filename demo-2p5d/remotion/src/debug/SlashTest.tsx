import React, { useLayoutEffect, useRef } from 'react';
import { useCurrentFrame } from 'remotion';
import { drawSlash } from '../shared/slash';
export const SlashTest: React.FC = () => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { const c = ref.current!.getContext('2d')!; c.clearRect(0,0,1920,1080); drawSlash(c, f); }, [f]);
  return <div style={{background:'#f2ece0',width:1920,height:1080}}><canvas ref={ref} width={1920} height={1080}/></div>;
};
