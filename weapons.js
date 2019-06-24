import {drawCircle} from './gfx.js';

export function drawExplosion(ctx, x, y, r) {
  const color = 255 - (16 * (r % 16));
  drawCircle(ctx, x, y, r, `rgb(${color}, 0, 0)`);
}
