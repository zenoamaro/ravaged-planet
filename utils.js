export function nextId() {
  // @ts-ignore
  const id = nextId.id || 0;
  // @ts-ignore
  nextId.id = id + 1;
  return id;
}

export function splitWords(text) {
  let words = [''];
  for (let char of text) {
    if ([' ', '\n'].includes(char)) words.push(char, '');
    else words[words.length-1] += char;
  }
  if (words[words.length-1] === '') words = words.slice(0, words.length-1);
  return words;
}
