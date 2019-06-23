import {drawCircle} from './gfx.js';

export const WEAPONS = [
  {id:'baby-missile', name:'Baby Missile', xr:5},
  {id:'missile', name:'Missile', xr:10},
  {id:'baby-nuke', name:'Baby Nuke', xr:50},
  {id:'nuke', name:'Nuke', xr:100},
];

export function drawExplosion(ctx, x, y, r) {
  drawCircle(ctx, x, y, r, 'white');
}
