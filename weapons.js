import {drawCircle} from './gfx.js';
import {clipTerrain} from './terrain.js';
import {within, cycle} from './math.js';
import {createOsc, audio} from './sound.js';

export function drawExplosion(ctx, x, y, r) {
  const color = 255 - (16 * (r % 16));
  drawCircle(ctx, x, y, r, `rgb(${color}, 0, 0)`);
}

export const WEAPON_TYPES = [
  {id:'baby-missile', name:'Baby Missile', explosion:{type:'blast', r:5}},
  {id:'missile', name:'Missile', explosion:{type:'blast', r:10}},
  {id:'baby-nuke', name:'Baby Nuke', explosion:{type:'blast', r:50}},
  {id:'nuke', name:'Nuke', explosion:{type:'blast', r:100}},
  {id:'dirt', name:'Dirt', explosion:{type:'dirt', r:25}},
  {id:'large-dirt', name:'Ton of Dirt', explosion:{type:'dirt', r:75}},
];

export const EXPLOSION_TYPES = {
  blast: {
    create(spec, x, y) {
      const {r} = spec;
      const osc = createOsc();
      osc.start();
      return {type:'blast', x, y, r, cr:0, osc};
    },
    update(explosion) {
      return ++explosion.cr < explosion.r;
    },
    draw(explosion, foreground) {
      const {x, y, cr, osc} = explosion;
      const f = cycle(explosion.cr, 6) % 2 === 0 ? 220 : 440;
      osc.frequency.setValueAtTime(f, audio.currentTime);
      drawExplosion(foreground, x, y, cr);
    },
    stop(explosion) {
      const {osc} = explosion;
      osc.stop();
    },
    clip(explosion, terrain) {
      const {x, y, cr} = explosion;
      clipTerrain(terrain, (ctx) => drawExplosion(ctx, x, y, cr));
    },
    damage(explosion, player) {
      if (within(explosion.x, explosion.y, player.x, player.y, explosion.r)) {
        return 100;
      }
    }
  },
  dirt: {
    create(spec, x, y) {
      const {r} = spec;
      const osc = createOsc();
      osc.start();
      return {type:'dirt', x, y, r, cr:0, osc};
    },
    stop(explosion) {
      const {osc} = explosion;
      osc.stop();
    },
    update(explosion) {
      return ++explosion.cr < explosion.r;
    },
    draw(explosion, foreground) {
      const {x, y, cr, osc} = explosion;
      const f = explosion.cr % 2 === 0 ? 220 + explosion.cr : 0;
      osc.frequency.setValueAtTime(f, audio.currentTime);
      osc.frequency.setValueAtTime(0, audio.currentTime+1);
      drawExplosion(foreground, x, y, cr);
    },
    clip(explosion, terrain) {
      const {x, y, cr} = explosion;
      drawExplosion(terrain, x, y, cr);
    },
    damage(explosion, player) {}
  },
}
