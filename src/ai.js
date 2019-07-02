import {PLAYER_MAX_ENERGY, PLAYER_INITIAL_POWER, PLAYER_ENERGY_POWER_MULTIPLIER} from './constants.js';
import {randomInt} from './math.js';

export const AI_TYPES = {

  moron: {
    decide(player) {
      return {
        a: randomInt(0, 180),
        p: randomInt(225, PLAYER_MAX_ENERGY*PLAYER_ENERGY_POWER_MULTIPLIER),
        currentWeapon: player.currentWeapon,
      };
    },
  },

  chooser: {
    decide(player) {
      return {
        a: randomInt(0, 180),
        p: randomInt(225, PLAYER_MAX_ENERGY*PLAYER_ENERGY_POWER_MULTIPLIER),
        currentWeapon: randomInt(0, player.weapons.length-1),
      };
    },
  },

};
