export function index2coords(width, i) {
  i = Math.round(i);
  width = Math.round(width);
  return [i % width, i / width];
}

export function coords2index(width, x, y) {
  x = Math.round(x);
  y = Math.round(y);
  width = Math.round(width);
  return y * width + x;
}

export function random(min, max) {
  return min + Math.random() * (max-min);
}

export function randomInt(min, max) {
  return Math.round(random(min, max));
}

export function clamp(min, x, max) {
  return Math.max(min, Math.min(x, max));
}

export function wrap(min, x, max) {
  return ((x-min + max-min) % (max-min)) + min;
}

export function cycle(x, d) {
  return Math.floor(x / d);
}

export function within(x, y, tx, ty, r) {
  return Math.abs(x-tx) < r && Math.abs(y-ty) < r;
}

export function parable(t, x, y, a, v, w=0, g=9.8) {
  const fx = x + t*v * Math.cos(a) - 0.5 * -w * t*t;
  const fy = y + t*v * Math.sin(a) - 0.5 * -g * t*t;
  return [fx, fy];
}


export function vec(x, y, a, l) {
  a = a * Math.PI / 180;
  return [x+Math.cos(a)*l, y+Math.sin(a)*l];
}

export function deg2rad(a) { return a * Math.PI/180 }
export function rad2deg(a) { return a * 180/Math.PI }
