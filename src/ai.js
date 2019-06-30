import {PLAYER_MAX_ENERGY, PLAYER_INITIAL_POWER, PLAYER_ENERGY_POWER_MULTIPLIER} from './constants.js';
import {randomInt} from './math.js';

export const AI_TYPES = {

  moron: {
    decide() {
      return {
        a: randomInt(0, 180),
        p: randomInt(PLAYER_INITIAL_POWER, PLAYER_MAX_ENERGY*PLAYER_ENERGY_POWER_MULTIPLIER)}
    }
  },

};
