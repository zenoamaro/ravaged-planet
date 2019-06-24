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
    const h = Math.round(120 + 30 * Math.sin(x/25));
    drawRect(ctx, x, height-h, 1, h, 'burlywood');
  }
}

export function collapseTerrain(ctx, ox, r) {
  const {height} = ctx.canvas;
  const width = r * 2 + 10;
  const left = ox-r-5;
  const imageData = ctx.getImageData(left, 0, width, height);

  for (let x=0; x<width; x++) {
    let land = 0;
    for (let y=0; y<height; y++) {
      const index = y*width*4 + x*4 +3;
      if (imageData.data[index] > 0) land++;
    }

    ctx.clearRect(left+x, 0, 1, height);
    drawRect(ctx, left+x, height-land, 1, land, 'burlywood');
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
