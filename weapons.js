import {drawCircle} from './gfx.js';

export function drawExplosion(ctx, x, y, r) {
  drawCircle(ctx, x, y, r, 'white');
}
