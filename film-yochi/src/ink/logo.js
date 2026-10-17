// The Yochi mark (asset-pack/Yochi_logo.png), as traced for the brand (shared brand asset).
// Normalised: 1 unit = 1000px of the 3000px source, centred on its bounding box; height ~1.56 units.
export const LOGO_POLY = [[-0.9350, -0.4545], [-0.8725, -0.5585], [-0.1200, -0.1185], [-0.0605, -0.1550], [-0.0605, -0.2340], [-0.8063, -0.6757], [-0.7460, -0.7795], [0.0000, -0.3400], [0.7460, -0.7795], [0.8063, -0.6757], [0.0605, -0.2340], [0.0605, -0.1550], [0.1200, -0.1185], [0.8725, -0.5585], [0.9350, -0.4545], [0.1835, -0.0110], [0.1820, 0.7800], [0.0590, 0.7790], [0.0590, -0.0130], [0.0000, -0.0490], [-0.0590, -0.0130], [-0.0590, 0.7790], [-0.1820, 0.7800], [-0.1835, -0.0110]];

export function logoPath(c, x, y, h) {
  const s = h / 1.56;
  c.beginPath();
  LOGO_POLY.forEach(([px, py], i) => (i ? c.lineTo(x + px * s, y + py * s) : c.moveTo(x + px * s, y + py * s)));
  c.closePath();
}
// point-in-polygon on the mark (for scattering ink into it)
export function inLogo(px, py) {
  let inside = false;
  for (let i = 0, j = LOGO_POLY.length - 1; i < LOGO_POLY.length; j = i++) {
    const [xi, yi] = LOGO_POLY[i], [xj, yj] = LOGO_POLY[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
