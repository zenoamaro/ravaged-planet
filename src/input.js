import {DEFAULT_KEYPRESS_DELAY} from './constants.js';

const input = {};
let lastKeypressTime = 0;

document.addEventListener('keydown', (e) => {input[e.key] = true; e.preventDefault()});
document.addEventListener('keyup', (e) => {input[e.key] = false; e.preventDefault()});

export function key(key) {
  return input[key]
}

export function afterKeyDelay(amount=DEFAULT_KEYPRESS_DELAY) {
  const now = Date.now();
  if (now - lastKeypressTime >= amount) {
    lastKeypressTime = now;
    return true;
  }
}
