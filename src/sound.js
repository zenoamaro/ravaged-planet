import {SOUND_MUSIC_VOLUME, SOUND_SFX_VOLUME} from './constants.js';

// @ts-ignore
export const audio = new (window.AudioContext || window.webkitAudioContext)();

export const music = audio.createGain(audio);
music.gain.setValueAtTime(SOUND_MUSIC_VOLUME, audio.currentTime);
music.connect(audio.destination);

export const sfx = audio.createGain(audio);
sfx.gain.setValueAtTime(SOUND_SFX_VOLUME, audio.currentTime);
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

export function createOsc(type='triangle') {
  const osc = audio.createOscillator();
  osc.type = type;
  osc.connect(sfx);
  return osc;
}

export function playTickSound() {
  const osc = createOsc('triangle');
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
