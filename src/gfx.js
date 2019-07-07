import {splitWords} from './utils.js';
import {parable} from './math.js';
import {FONT_HEIGHT, FONT_WIDTH} from './constants.js';

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
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

export function drawLine(ctx, x1, y1, x2, y2, color, plotFn=plot) {
  x1 = Math.round(x1); y1 = Math.round(y1);
  x2 = Math.round(x2); y2 = Math.round(y2);

  const steep = Math.abs(y2 - y1) > Math.abs(x2 - x1);
  if (steep) [x1, y1, x2, y2] = [y1, x1, y2, x2];
  if (x1 > x2) [x1, y1, x2, y2] = [x2, y2, x1, y1];

  const dX = (x2 - x1);
  const dY = Math.abs(y2 - y1);
  const ystep = (y1 < y2 ? 1 : -1);

  let err = (dX / 2);
  let y = y1;
  for (let x = x1; x <= x2; ++x) {
      if (steep) plotFn(ctx, y, x, color); else plotFn(ctx, x, y, color);
      err = err - dY; if (err < 0) { y += ystep; err += dX }
  }
}

export function drawLineVirtual(x1, y1, x2, y2, color) {
  const points = [];
  drawLine(
    null, x1, y1, x2, y2, color,
    (ctx, x, y, c) => points.push({x, y, c})
  );
  return points;
}

export function checkLineWith(x1, y1, x2, y2, fn) {
  drawLine(
    null, x1, y1, x2, y2, null,
    (ctx, x, y, c) => fn(x, y)
  );
}

export function drawRect(ctx, x, y, w, h, color) {
  x = Math.round(x); y = Math.round(y);
  w = Math.round(w); h = Math.round(h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

export function strokeRect(ctx, x, y, w, h, color) {
  if (w === 1 || h === 1) return drawRect(x, y, w, h, color);
  x = Math.round(x); y = Math.round(y);
  w = Math.round(w); h = Math.round(h);
  ctx.lineWidth = 1;
  ctx.strokeStyle = color;
  ctx.strokeRect(x+0.5, y+0.5, w-1, h-1);
}

export function drawCircle(ctx, x, y, r, color) {
  x = Math.round(x);
  y = Math.round(y);
  r = Math.round(r);
  for (let cy = -r; cy <= r; cy++) {
    const w = Math.round(Math.sqrt(r*r - cy*cy));
    drawRect(ctx, x-w, y+cy, w*2, 1, color);
  }
}

export function strokeCircle(ctx, x, y, r, color) {
  x = Math.round(x);
  y = Math.round(y);
  r = Math.round(r);

  let prevPoint;
  for (let cy = -r; cy <= r; cy++) {
    const w = Math.round(Math.sqrt(r*r - cy*cy));
    if (!prevPoint) prevPoint = {cy, w};
    drawLine(ctx, x-prevPoint.w, y+prevPoint.cy, x-w, y+cy, color);
    drawLine(ctx, x+prevPoint.w, y+prevPoint.cy, x+w, y+cy, color);
    prevPoint = {cy, w};
  }
}

export function drawSemiCircle(ctx, x, y, r, color) {
  x = Math.round(x);
  y = Math.round(y);
  r = Math.round(r);
  for (let cy = -r; cy <= 0; cy++) {
    const w = Math.round(Math.sqrt(r*r - cy*cy));
    drawRect(ctx, x-w, y+cy, w*2, 1, color);
  }
}

/** @param align {CanvasTextAlign} */
/** @param baseline {CanvasTextBaseline} */
export function drawText(ctx, text, x, y, color, align='left', baseline='top') {
  x = Math.round(x); y = Math.round(y);
  ctx.font = '5px text';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = color;
  ctx.strokeStyle = 'black';
  const length = (text.length * FONT_WIDTH) + (text.length -1);
  const left = (
    align === 'right' ? x - length :
    align === 'center' ? x - Math.round(length /2) :
    x
  );
  const top = (
    baseline === 'bottom' ? y - FONT_HEIGHT :
    baseline === 'middle' ? y - Math.round(FONT_HEIGHT /2) :
    y
  );
  for (let i=0; i<text.length; i++) {
    ctx.strokeText(text[i], left + i*FONT_WIDTH + i, top);
    ctx.fillText(text[i], left + i*FONT_WIDTH + i, top);
  }
}

export function drawParagraph(ctx, text, x, y, w, h, color) {
  x = Math.round(x); y = Math.round(y);
  w = Math.round(w); h = Math.round(h);
  let tx = 0; let ty = 0;
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
