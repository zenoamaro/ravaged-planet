import {createCanvas, drawRect, clipCanvas} from './gfx.js';

export function createTerrain(width, height) {
  const terrain = createCanvas(width, height);
  generateTerrain(terrain, width, height);
  return terrain;
}

export function generateTerrain(ctx, width, height) {
  drawRect(ctx, 0, height-80, width, 80, 'burlywood');
}

export function isTerrain(ctx, x, y) {
  const imageData = ctx.getImageData(x, y, 1, 1);
  return imageData.data[3] > 0;
}

export function clipTerrain(ctx, fn) {
  return clipCanvas(ctx, fn);
}
