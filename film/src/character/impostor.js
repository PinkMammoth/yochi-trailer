// Crowd impostors: the real character, pre-rendered once into sprite atlases (base + emissive),
// then stamped with drawImage. Small crowd members cost a drawImage instead of a raymarch.
//
// atlas = new ImpostorAtlas({ cell, variants: [...], yaws: n, render(Rcell, v, yaw, x, y, scale) })
// atlas.build()                      (once)
// atlas.draw(R, variantIndex, yaw, x, y, scale, alpha)   (x, y = screen position of the anchor)

export class ImpostorAtlas {
  constructor({ cell = 112, variants, yaws = 12, render, scale }) {
    this.cell = cell; this.variants = variants; this.yaws = yaws; this.render = render;
    this.scale = scale;   // px per model unit inside a cell
    const cols = yaws, rows = variants.length;
    const mk = () => { const c = document.createElement('canvas'); c.width = cols * cell; c.height = rows * cell; return c; };
    this.base = mk(); this.glow = mk();
    this.bctx = this.base.getContext('2d'); this.gctx = this.glow.getContext('2d');
    this.built = false;
  }
  build() {
    const { cell } = this;
    // the renderer composites into R.b / R.g: point them at the atlas (transparent backgrounds)
    const R = { S: 1, b: this.bctx, g: this.gctx, W: this.base.width, H: this.base.height };
    for (let v = 0; v < this.variants.length; v++) {
      for (let k = 0; k < this.yaws; k++) {
        const yaw = (k / this.yaws) * Math.PI * 2;
        const x0 = k * cell, y0 = v * cell;
        this.bctx.save(); this.gctx.save();
        this.bctx.beginPath(); this.bctx.rect(x0, y0, cell, cell); this.bctx.clip();
        this.gctx.beginPath(); this.gctx.rect(x0, y0, cell, cell); this.gctx.clip();
        this.render(R, this.variants[v], yaw, x0 + cell / 2, y0 + cell - 2, this.scale, [x0, y0, x0 + cell, y0 + cell]);
        this.bctx.restore(); this.gctx.restore();
      }
    }
    this.built = true;
    return this;
  }
  yawIndex(yaw) {
    const t = ((yaw / (Math.PI * 2)) % 1 + 1) % 1;
    return Math.round(t * this.yaws) % this.yaws;
  }
  // x, y: screen position of the model anchor; scale: px per model unit on screen
  draw(R, v, yaw, x, y, scale, alpha = 1) {
    const k = this.yawIndex(yaw), c = this.cell, f = scale / this.scale;
    const dw = c * f, dh = c * f;
    const dx = x - dw / 2, dy = y - (c - 2) * f;
    for (const [ctx, src] of [[R.b, this.base], [R.g, this.glow]]) {
      if (alpha < 1) { ctx.save(); ctx.globalAlpha = alpha; }
      ctx.drawImage(src, k * c, v * c, c, c, dx, dy, dw, dh);
      if (alpha < 1) ctx.restore();
    }
  }
}
