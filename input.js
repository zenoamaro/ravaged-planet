const input = {};

document.addEventListener('keydown', (e) => {input[e.key] = true; e.preventDefault()});
document.addEventListener('keyup', (e) => {input[e.key] = false; e.preventDefault()});
export function key(key) {return input[key]}
