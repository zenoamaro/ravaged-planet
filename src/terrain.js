import {clipCanvas, drawCircle, drawRect} from './gfx.js';
import {clamp, coords2index, random, randomInt} from './math.js';
import {sample} from './utils.js';

let cachedImageData;

function cacheImageData(ctx) {
  const {width, height} = ctx.canvas;
  cachedImageData = ctx.getImageData(0, 0, width, height);
}

export function generateTerrain(ctx, type) {
  const generator = type? TERRAIN_TYPES[type] : sample(Object.values(TERRAIN_TYPES));
  const {width, height} = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  generator(ctx);
}

const TERRAIN_TYPES = {
  mountain(ctx) {
    ctx.color = sample(['palegreen', 'white']); // FIXME
    const {width, height} = ctx.canvas;
    const stepCount = 8;
    const stepSize = width / stepCount;

    let cy = random(.3, .7) * height;
    let dy = 0;

    for (let x=0; x<width; x++) {
      if (x % stepSize === 0) dy = ((random(.3, .7) * height) - cy) / stepSize;
      if (x % (stepSize/16) === 0) dy = dy - random(-1, 1);
      const ty = clamp(0, cy+dy, height-1);
      const wy = clamp(70, ty, height-70-1);
      cy = wy + (ty-wy) * 0.5;
      drawRect(ctx, x, cy, 1, height-cy, ctx.color);
    }

    cacheImageData(ctx);
  },

  sand(ctx) {
    ctx.color = 'wheat';
    const {width, height} = ctx.canvas;
    const stepCount = 16;
    const stepSize = width / stepCount;

    for (let s=0; s<=stepCount; s++) {
      drawCircle(ctx, s*stepSize, height, randomInt(stepSize, stepSize*2), ctx.color);
      if (s % 3 === 0) drawCircle(ctx, s*stepSize, 0, randomInt(0, stepSize*4), ctx.color);
    }

    cacheImageData(ctx);
    collapseTerrain(ctx);
  }
};

export function collapseTerrain(ctx, ) {
  const {width, height} = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, width, height);

  for (let x=0; x<width; x++) {
    let land = 0;
    for (let y=0; y<height; y++) {
      const index = y*width*4 + x*4 +3;
      if (imageData.data[index] > 0) land++;
    }

    ctx.clearRect(0+x, 0, 1, height);
    drawRect(ctx, 0+x, height-land, 1, land, ctx.color);
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
