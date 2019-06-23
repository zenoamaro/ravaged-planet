import {createCanvas, drawRect, clipCanvas, plot} from './gfx.js';
import {randomInt} from './math.js';

export function createSky(width, height) {
  const ctx = createCanvas(width, height);
  generateSky(ctx);
  return ctx;
}

export function generateSky(ctx) {
  const {width, height} = ctx.canvas;
  const [r, g, b] = [70*0.6, 130*0.6, 180*0.6];

  for (let y=0; y<height; y++) {
    const darken = 1 - (1/height*y);
    const [dr, dg, db] = [r*darken, g*darken, b*darken];
    drawRect(ctx, 0, y, width, 1, `rgb(${dr},${dg},${db})`);
  }
}
