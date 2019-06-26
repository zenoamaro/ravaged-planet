import {createCanvas, drawRect, clipCanvas} from './gfx.js';
import {coords2index} from './math.js';

let cachedImageData;

function cacheImageData(ctx) {
  const {width, height} = ctx.canvas;
  cachedImageData = ctx.getImageData(0, 0, width, height);
}

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
  cacheImageData(ctx);
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

  cacheImageData(ctx);
}

export function isTerrain(ctx, x, y) {
  const index = coords2index(ctx.canvas.width, x, y) * 4;
  return cachedImageData.data[index+3] > 0;
}

export function closestLand(ctx, x, y) {
  const {width, height} = ctx.canvas;
  for (let i=y; i<height; i++) {
    const index = coords2index(width, x, i) * 4;
    if (cachedImageData.data[index+3] !== 0) return i;
  }
  return height-1;
}

export function landHeight(ctx, x) {
  const {width, height} = ctx.canvas;
  for (let i=height-1; i>=0; i--) {
    const index = coords2index(width, x, i) * 4;
    if (cachedImageData.data[index+3] === 0) return i;
  }
}

export function clipTerrain(ctx, fn) {
  clipCanvas(ctx, fn);
  cacheImageData(ctx);
}
