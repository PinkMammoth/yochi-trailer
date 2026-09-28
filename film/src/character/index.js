// The Yochi competitor: public API.
//
//   drawCompetitor(R, o)   draw one competitor into the film's layers (R.b base, R.g emissive)
//
// The character is a signed-distance model raymarched in WebGL2 and toon-shaded in the film's
// lighting language (key, thin cyan rim, softbox reflections, crease highlights), composited into
// the same two layers the rest of the film uses, so bloom, grade and grain treat it like any other
// element. Crowds use ImpostorAtlas (pre-rendered sprites) below ~50 px per unit.
import { renderer } from './renderer.js';
import { face } from './face.js';
import { solve, BONES, HEAD_OFS } from './rig.js';
import { BODY } from './body.glsl.js';
import { CAST, PICK } from './cast.js';

export { CAST, CRESTS, SHELLS, YOCHI, PICK } from './cast.js';
export { POSES, blendPose, solve, HEAD_H, HEAD_OFS } from './rig.js';
export { face, commitGlyph, GLYPHS, composeLayers, GRID_W, GRID_H } from './face.js';
export { ImpostorAtlas } from './impostor.js';
export { renderer } from './renderer.js';

// AABB of a posed skeleton: joint pivots and limb ends padded for flesh, the head as a sphere
// (crests reach further; the antenna furthest).
export function poseBox(rig, crest = 0) {
  const pts = [];
  for (const [name] of BONES) {
    pts.push(rig.joint(name));
    if (name.startsWith('hand')) pts.push(rig.joint(name, [0, -0.45, 0]));
    if (name.startsWith('foot')) pts.push(rig.joint(name, [0, -0.22, 0.5]), rig.joint(name, [0, -0.22, -0.2]));
  }
  const hc = rig.joint('head', [0, HEAD_OFS, 0]);
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (const p of pts) for (let i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], p[i] - 0.3); mx[i] = Math.max(mx[i], p[i] + 0.3); }
  const hr = crest === 3 ? 1.02 : crest ? 0.8 : 0.62;
  for (let i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], hc[i] - hr); mx[i] = Math.max(mx[i], hc[i] + hr); }
  mn[1] = Math.max(mn[1], -0.05);
  return [mn, mx];
}

/**
 * o: {
 *   x, y       stage position (px) of the anchor;  scale: stage px per model unit (helmet heights)
 *   anchor     'feet' (default) | 'head' | 'chest' | [x, y, z] model point
 *   yaw, elev, fov, roll     view (yaw > 0 turns the face toward screen right)
 *   pose       a POSES name or pose object;  cast: a CAST entry (or your own)
 *   call       +1 up / -1 down / 0 uncommitted: sets the default glyph and the pick colour
 *   glyph, led visor glyph (GLYPHS name or a draw fn) and LED colour, when acting
 *   pick       status colour (cheek slits, taillight, harness knot); pickI, ledI, accentI intensities
 *   lights, fog, fogCol, ss (supersampling 1..4), clip, mirror {y, alpha}, box
 * }
 * Returns the drawn screen rect and the camera, or null when off screen.
 */
export function drawCompetitor(R, o) {
  const { call = 1, glyph, cast = CAST.you, pose = 'neutral', anchor = 'feet', ...rest } = o;
  const led = o.led || PICK.of(call);
  const rig = solve(pose);
  const po = rig.pose;
  const A = Array.isArray(anchor) ? anchor
    : anchor === 'head' ? rig.joint('head', [0, HEAD_OFS, 0])
    : anchor === 'chest' ? rig.joint('chest', [0, 0.3, 0]) : [0, 0, 0];
  const fist = po.fist || [0.3, 0.3], point = po.point || [0, 0];
  return renderer().draw(R, {
    model: BODY, box: poseBox(rig, cast.crest || 0), ss: 2, elev: 0.04, fov: 0.2,
    pick: o.pick || led, face: typeof glyph === 'object' ? glyph : face(glyph || PICK.glyph(call), led),
    ...cast,
    uniforms: (gl, u) => {
      gl.uniformMatrix4fv(u.uBone, false, rig.inv);
      if (u.uHeadC) gl.uniform3fv(u.uHeadC, rig.joint('head', [0, HEAD_OFS, 0]));
      if (u.uLimbA) {
        const a = [rig.joint('uarmL'), rig.joint('uarmR'), rig.joint('thighL'), rig.joint('thighR')];
        const m = [rig.joint('farmL'), rig.joint('farmR'), rig.joint('shinL'), rig.joint('shinR')];
        const b = [rig.joint('handL', [0, -0.34, 0]), rig.joint('handR', [0, -0.34, 0]), rig.joint('footL', [0, -0.12, 0.18]), rig.joint('footR', [0, -0.12, 0.18])];
        gl.uniform3fv(u.uLimbA, a.flat()); gl.uniform3fv(u.uLimbM, m.flat()); gl.uniform3fv(u.uLimbB, b.flat());
      }
      if (u.uFist) gl.uniform2f(u.uFist, fist[0], fist[1]);
      if (u.uPoint) gl.uniform2f(u.uPoint, point[0], point[1]);
    },
    ...rest,
    anchor: A,
  });
}
