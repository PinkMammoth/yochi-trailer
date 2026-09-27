import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.setContent(`<canvas id=c width=1920 height=1080></canvas><canvas id=g width=1920 height=1080></canvas>`);
const info = await page.evaluate(() => {
  const g = document.getElementById('g').getContext('webgl2', { preserveDrawingBuffer: true });
  if (!g) return 'no webgl2';
  const dbg = g.getExtension('WEBGL_debug_renderer_info');
  return { renderer: dbg ? g.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER), maxTex: g.getParameter(g.MAX_TEXTURE_SIZE), floatRT: !!g.getExtension('EXT_color_buffer_float') };
});
console.log('webgl2:', info);
// Canvas2D draw benchmark + readback speed
const t0 = Date.now();
const r = await page.evaluate(() => {
  const c = document.getElementById('c'); const x = c.getContext('2d');
  const s = performance.now();
  for (let f = 0; f < 10; f++) {
    x.fillStyle = '#07060c'; x.fillRect(0, 0, 1920, 1080);
    for (let i = 0; i < 3000; i++) { x.beginPath(); x.arc((i * 37) % 1920, (i * 91) % 1080, 6, 0, 7); x.fillStyle = i % 2 ? '#39ff14' : '#ff3860'; x.fill(); }
    x.getImageData(0, 0, 1, 1);
  }
  const drawMs = (performance.now() - s) / 10;
  const s2 = performance.now();
  const d = x.getImageData(0, 0, 1920, 1080);
  const readMs = performance.now() - s2;
  return { drawMs, readMs, len: d.data.length };
});
console.log('canvas2d 3000 arcs/frame ms:', r.drawMs.toFixed(1), ' getImageData ms:', r.readMs.toFixed(1));
const s3 = Date.now();
for (let i = 0; i < 5; i++) await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 } });
console.log('png screenshot ms:', (Date.now() - s3) / 5);
await browser.close();
