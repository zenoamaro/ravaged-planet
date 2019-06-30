// @ts-ignore
export const audio = new (window.AudioContext || window.webkitAudioContext)();

export const music = audio.createGain(audio);
music.gain.setValueAtTime(0.4, audio.currentTime);
music.connect(audio.destination);

export const sfx = audio.createGain(audio);
sfx.gain.setValueAtTime(0.05, audio.currentTime);
sfx.connect(audio.destination);

export async function createAudioLoop(src) {
  const file = await fetch(src);
  const buffer = await file.arrayBuffer();
  const source = audio.createBufferSource();
  audio.decodeAudioData(buffer, (buffer) => {
    source.buffer = buffer;
    source.connect(music);
    source.loop = true;
    source.start(0);
  })
}

export function createOsc() {
  const osc = audio.createOscillator();
  osc.type = 'triangle';
  osc.connect(sfx);
  return osc;
}

export function playTickSound() {
  const osc = createOsc();
  osc.frequency.setValueAtTime(440, audio.currentTime);
  osc.frequency.setValueAtTime(0, audio.currentTime + 0.005);
  osc.start();
  osc.stop(audio.currentTime + 0.005);
}

function clickInit() {
  const osc = createOsc();
  osc.start();
  osc.stop();
  document.removeEventListener('keydown', clickInit);
}

document.addEventListener('keydown', clickInit);
