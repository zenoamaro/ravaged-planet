import {drawCircle} from './gfx.js';

export const WEAPONS = [
  {id:'baby-missile', name:'Baby Missile', xr:5},
  {id:'missile', name:'Missile', xr:10},
];

export function drawExplosion(ctx, x, y, r) {
  drawCircle(ctx, x, y, r, 'white');
}
