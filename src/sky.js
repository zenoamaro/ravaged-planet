import {createCanvas, drawRect, clipCanvas, plot} from './gfx.js';
import {randomInt, gradient} from './math.js';
import {SKY_COLORS} from './constants.js';
import {sample} from './utils.js';

export function createSky(width, height) {
  const ctx = createCanvas(width, height);
  generateSky(ctx);
  return ctx;
}

export function generateSky(ctx) {
  const {width, height} = ctx.canvas;
  const {from, to} = sample(SKY_COLORS);

  for (let y=0; y<height; y++) {
    const f = y / height;
    const r = gradient(from[0], to[0], f);
    const g = gradient(from[1], to[1], f);
    const b = gradient(from[2], to[2], f);
    drawRect(ctx, 0, y, width, 1, `rgb(${r},${g},${b})`);
  }
}
