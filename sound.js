// @ts-ignore
export const audio = new (window.AudioContext || window.webkitAudioContext)();
export const gain = audio.createGain(audio);
gain.gain.setValueAtTime(0.05, audio.currentTime);
gain.connect(audio.destination);

export function createOsc() {
  const osc = audio.createOscillator();
  osc.type = 'square';
  osc.connect(gain);
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
