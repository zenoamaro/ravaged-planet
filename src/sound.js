import {SOUND_MUSIC_VOLUME, SOUND_SFX_VOLUME} from './constants.js';

// @ts-ignore
export const audio = new (window.AudioContext || window.webkitAudioContext)();
export const volume = createGain(1);
volume.connect(audio.destination);

export const music = createCompressor();
export const musicGain = createGain(SOUND_MUSIC_VOLUME);
music.connect(musicGain);
musicGain.connect(volume);

export const sfx = createCompressor();
export const sfxGain = createGain(SOUND_SFX_VOLUME);
sfx.connect(sfxGain);
sfxGain.connect(volume);

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

export function createGain(amount) {
  const gain = audio.createGain();
  gain.gain.setValueAtTime(amount, audio.currentTime);
  return gain;
}

export function createCompressor() {
  let compressor = audio.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-30, audio.currentTime);
  compressor.knee.setValueAtTime(40, audio.currentTime);
  compressor.ratio.setValueAtTime(12, audio.currentTime);
  compressor.attack.setValueAtTime(0, audio.currentTime);
  compressor.release.setValueAtTime(0.25, audio.currentTime);
  return compressor;
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
