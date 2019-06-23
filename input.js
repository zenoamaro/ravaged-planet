const input = {};

document.addEventListener('keydown', ({key}) => input[key] = true);
document.addEventListener('keyup', ({key}) => input[key] = false);
export function key(key) {return input[key]}
