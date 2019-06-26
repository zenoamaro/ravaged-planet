import {splitWords} from './utils.js';
import {parable} from './math.js';

export function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = width; canvas.height = height
  return ctx;
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = (e) => resolve(img);
    // @ts-ignore
    img.onerror = (e) => reject(e.error);
    img.src = src;
  });
}

export function clipCanvas(ctx, fn) {
  ctx.globalCompositeOperation = 'destination-out';
  fn(ctx);
  ctx.globalCompositeOperation = 'source-over';
}

export function plot(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

export function drawLine(ctx, x1, y1, x2, y2, color) {
  const steep = Math.abs(y2 - y1) > Math.abs(x2 - x1);
  if (steep) [x1, y1, x2, y2] = [y1, x1, y2, x2];
  if (x1 > x2) [x1, y1, x2, y2] = [x2, y2, x1, y1];

  const dX = (x2 - x1);
  const dY = Math.abs(y2 - y1);
  const ystep = (y1 < y2 ? 1 : -1);

  let err = (dX / 2);
  let y = y1;
  for (let x = x1; x <= x2; ++x) {
      if (steep) plot(ctx, y, x, color); else plot(ctx, x, y, color);
      err = err - dY; if (err < 0) { y += ystep; err += dX }
  }
}

export function drawRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

export function strokeRect(ctx, x, y, w, h, color) {
  if (w === 1 || h === 1) return drawRect(x, y, w, h, color);
  ctx.lineWidth = 1;
  ctx.strokeStyle = color;
  ctx.strokeRect(x+0.5, y+0.5, w-1, h-1);
}

export function drawCircle(ctx, x, y, r, color) {
  for (let cy = -r; cy <= r; cy++) {
    for (let cx = -r; cx <= r; cx++) {
      if (cx*cx + cy*cy <= r*r + r*0.85) {
        plot(ctx, x+cx, y+cy, color);
      }
    }
  }
}

export function plotParable(ctx, x, y, a, v, g) {
  for (let t=0; t<1000; t+=0.01) {
    const [fx, fy] = parable(t, x, y, a, v, g);
    plot(ctx, (fx), (fy), 'white');
  }
}

/** @param align {CanvasTextAlign} */
/** @param baseline {CanvasTextBaseline} */
export function drawText(ctx, text, x, y, color, align='left', baseline='top') {
  ctx.font = '5px text';
  ctx.textBaseline = baseline;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.strokeStyle = 'black';
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

export function drawParagraph(ctx, text, x, y, w, h, color) {
  let tx = 0;
  let ty = 0;
  // FIXME: Handle unbreakable words longer than width
  const words = splitWords(text);
  for (let word of words) {
    const wordLength = word.length * 4;
    if (word === '\n') { tx = 0; ty += 6; continue }
    else if (tx + wordLength > w) { tx = 0; ty += 6 }
    if (ty+6 > h) return;
    for (let char of word) {
      drawText(ctx, char, x+tx, y+ty, color);
      tx += 4;
    }
  }
}

export function loop(fn) {
  (function looped() {
    fn();
    requestAnimationFrame(looped);
  })();
}
