import {createCanvas, drawRect, clipCanvas, plot} from './gfx.js';
import {randomInt} from './math.js';

export function createTerrain(width, height) {
  const terrain = createCanvas(width, height);
  generateTerrain(terrain);
  return terrain;
}

export function generateTerrain(ctx) {
  const {width, height} = ctx.canvas;
  for (let x=0; x<width; x++) {
    const h = Math.round(80 + 30 * Math.sin(x/25));
    drawRect(ctx, x, height-h, 1, h, 'burlywood');
  }
}

export function isTerrain(ctx, x, y) {
  const imageData = ctx.getImageData(x, y, 1, 1);
  return imageData.data[3] > 0;
}

export function landHeight(ctx, x) {
  const {height} = ctx.canvas;
  const imageData = ctx.getImageData(x, 0, 1, height);
  for (let y=height-1; y>=0; y--) {
    if (imageData.data[y*4+3] === 0) return y;
  }
}

export function clipTerrain(ctx, fn) {
  return clipCanvas(ctx, fn);
}
