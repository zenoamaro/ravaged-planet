import {H, MAX_BULLET_SOUND_FREQUENCY, MAX_WIND, MIN_BULLET_SOUND_FREQUENCY, PLAYER_COLORS, PLAYER_INITIAL_POWER, REDUCTION_FACTOR, W, Z, PROJECTILE_ITERATIONS_PER_FRAME, PROJECTILE_ITERATION_PROGRESS, PLAYER_MAX_ENERGY, PLAYER_ENERGY_POWER_MULTIPLIER, FALL_DAMAGE_FACTOR, FALL_DAMAGE_HEIGHT, PLAYER_WEAPON_CHANGE_DELAY} from './constants.js';
import {createCanvas, drawLine, drawRect, drawText, loop} from './gfx.js';
import {key} from './input.js';
import {clamp, deg2rad, parable, randomInt, vec, wrap} from './math.js';
import {createSky} from './sky.js';
import {audio, createOsc, playTickSound} from './sound.js';
import {collapseTerrain, createTerrain, isTerrain, landHeight, closestLand} from './terrain.js';
import {WEAPON_TYPES, EXPLOSION_TYPES, DEATH_SPECS} from './weapons.js';
import {sample} from './utils.js';
import {AI_TYPES} from './ai.js';


let state = 'start-turn';
const players = [];
let currentPlayer = 0;
let projectile = null;
let prevProjectile = null;
let explosion = null;
let wind = 0;
let fadeCount = 0;
let lastWeaponChangeTime = 0;

// Init layers
const sky = createSky(W, H);
const terrain = createTerrain(W, H);
const projectiles = createCanvas(W, H);
const foreground = createCanvas(W, H);

for (let c of [sky, terrain, projectiles, foreground]) {
  c.canvas.style.width = `${W * Z}px`;
  c.canvas.style.height = `${H * Z}px`;
  document.body.appendChild(c.canvas);
}

// Init players
let i=0;
for (let color of PLAYER_COLORS) {
  const x = Math.round(50 + (W-100) / 5 * i);
  const a = x > W/2 ? 45 : 180-45;
  players.push({
    x, y: landHeight(terrain, x)+1, a,
    p: PLAYER_INITIAL_POWER, c: color,
    weapons: [
      {type: 'baby-missile', ammo:Infinity},
      {type: 'missile', ammo:5},
      {type: 'baby-nuke', ammo:3},
      {type: 'nuke', ammo:1},
      {type: 'dirt', ammo:3},
      {type: 'large-dirt', ammo:1},
    ],
    currentWeapon: 0,
    energy: PLAYER_MAX_ENERGY,
    ai: i !== 0 ? 'moron' : undefined,
    fallHeight: 0,
  });
  i++;
}

function update() {
  if (state === 'start-turn') {
    wind = randomInt(-MAX_WIND, +MAX_WIND);
    state = 'aim';
  }

  else if (state === 'aim') {
    const player = players[currentPlayer];
    const {x, y, a, p, energy} = player;
    const maxPower = energy * PLAYER_ENERGY_POWER_MULTIPLIER;
    let shoot;

    if (player.ai) {
      let ai = AI_TYPES[player.ai];
      const plan = ai.decide();
      const a = player.a = wrap(0, plan.a, 180);
      const p = player.p = wrap(0, plan.p, maxPower);
      shoot = {a, p};
    }

    else if (key('ArrowLeft')) {
      player.a = wrap(0, a -1, 180);
      if (a % 2 === 0) playTickSound();
    } else if (key('ArrowRight')) {
      player.a = wrap(0, a +1, 180);
      if (a % 2 === 0) playTickSound();
    } else if (key('ArrowUp')) {
      player.p = clamp(0, p +2, maxPower);
      if (p < maxPower && p % 4 === 0) playTickSound();
    } else if (key('ArrowDown')) {
      player.p = clamp(0, p -2, maxPower);
      if (p > 0 && p % 4 === 0) playTickSound();
    } else if (key('Tab')) {
      if (Date.now() - lastWeaponChangeTime < PLAYER_WEAPON_CHANGE_DELAY) return;
      player.currentWeapon = wrap(0, player.currentWeapon+1, player.weapons.length);
      lastWeaponChangeTime = Date.now();
      playTickSound();
    } else if (key(' ')) {
      shoot = {a, p};
    }

    if (shoot) {
      const {a, p} = shoot;
      const [px, py] = vec(x, y-3, a+180, 5);

      const weaponType = player.weapons[player.currentWeapon];
      weaponType.ammo -= 1;

      projectile = prevProjectile = {
        osc: createOsc(),
        player: player,
        weaponTypeId: weaponType.type,
        ox:px, oy:py, a, p,
        x:px, y:py, t: 0,
      };

      projectile.osc.start();
      state = 'fire';
    }
  }

  else if (state === 'fire') {
    prevProjectile = {...projectile};

    if (++fadeCount % 3 === 0) {
      fadeProjectiles(2);
      fadeCount = 0;
    }

    for (let i=0; i<PROJECTILE_ITERATIONS_PER_FRAME; i++) {
      const {weaponTypeId, ox, oy, a, p, t} = projectile;
      const weapon = WEAPON_TYPES.find(x => x.id === weaponTypeId);
      const [x, y] = parable(t, ox, oy, deg2rad(180+a), p/REDUCTION_FACTOR, wind/REDUCTION_FACTOR);
      const f = (1-(1/H*y)) * (MAX_BULLET_SOUND_FREQUENCY-MIN_BULLET_SOUND_FREQUENCY) + MIN_BULLET_SOUND_FREQUENCY;
      projectile.t += PROJECTILE_ITERATION_PROGRESS;
      projectile.x = Math.ceil(x);
      projectile.y = Math.floor(y);
      projectile.osc.frequency.setValueAtTime(f, audio.currentTime);

      if (y > H || isTerrain(terrain, projectile.x, projectile.y)) {
        projectile.osc.stop();
        const explosionSpec = weapon.explosion;
        const explosionType = EXPLOSION_TYPES[explosionSpec.type];
        explosion = explosionType.create(explosionSpec, projectile.x, projectile.y);
        state = 'explosion';
        return;
      }
    }
  }

  else if (state === 'explosion') {
    const explosionType = EXPLOSION_TYPES[explosion.type];

    if (!explosionType.update(explosion)) {
      explosionType.clip(explosion, terrain);
      explosionType.stop(explosion);
      for (let player of players) if (!player.dead) {
        player.energy -= explosionType.damage(explosion, player) || 0;
      }
      explosion = null;
      state = 'land-collapse';
    }
  }

  else if (state === 'land-collapse') {
    const target = explosion ||projectile;
    if (target) {
      collapseTerrain(terrain, target.x, 100); // FIXME: Hardcoded radius
    }
    state = 'land-players';
  }

  else if (state === 'land-players') {
    let stable = true;
    for (let player of players) {
      if (player.dead) continue;
      const y = closestLand(terrain, player.x, player.y);
      if (player.y !== y) {
        stable = false;
        player.y++;
        if (player.fallHeight++ >= FALL_DAMAGE_HEIGHT) {
          player.energy -= FALL_DAMAGE_FACTOR;
        }
      }
    }
    if (stable) state = 'destroy-players';
  }

  else if (state === 'destroy-players') {
    const dyingPlayer = players.find(x => x.energy<=0 && !x.dead);
    if (!dyingPlayer) {state = 'end-turn'; return}

    const {x, y} = dyingPlayer;
    const explosionSpec = sample(DEATH_SPECS);
    const explosionType = EXPLOSION_TYPES[explosionSpec.type];
    explosion = explosionType.create(explosionSpec, x, y);
    dyingPlayer.dead = true;
    state = 'explosion';
  }

  else if (state === 'end-turn') {
    const player = players[currentPlayer];

    const weaponType = player.weapons[player.currentWeapon];
    if (weaponType.ammo <= 0) {
      player.weapons = player.weapons.filter(x => x !== weaponType);
    }

    player.currentWeapon = wrap(0, player.currentWeapon, player.weapons.length);
    player.fallHeight = 0;

    let nextPlayer;

    for (let p=0; p<players.length; p++) {
      const i = wrap(0, currentPlayer+p+1, players.length);
      if (!players[i].dead) {nextPlayer = i; break}
    }

    if (nextPlayer == null) return state = 'game-over';
    else if (nextPlayer === currentPlayer) return state = 'player-win';
    else currentPlayer = nextPlayer;

    projectile = null;
    state = 'start-turn';
  }

  else if (state === 'player-win') {
    //
  }

  else if (state === 'game-over') {
    //
  }

  else {
    throw new Error(`Invalid state, ${state}`);
  }
}

function draw() {
  foreground.clearRect(0, 0, W, H);
  if (projectile) drawProjectile();
  for (let tank of players) drawPlayer(tank);
  if (explosion) drawExplosions();
  drawStatus();
}

function drawPlayer(player) {
  const {x, y, a, c, dead} = player;
  if (dead) return;
  const [px, py] = vec(x, y-3, a+180, 3);
  drawLine(foreground, x, y-3, Math.round(px), Math.round(py), c);
  drawRect(foreground, x-3, y-2, 6, 3, c);
}

function drawProjectile() {
  const {x, y, player} = projectile;
  drawLine(projectiles, prevProjectile.x, prevProjectile.y, x, y, player.c);
}

function fadeProjectiles(amount) {
  // TODO: Very expensive, optimize
  const data = projectiles.getImageData(0, 0, W, H);
  for (let i=0; i<data.data.length; i+=4) data.data[i+3] -= amount;
  projectiles.clearRect(0, 0, W, H);
  projectiles.putImageData(data, 0, 0);
}

function drawExplosions() {
  const explosionType = EXPLOSION_TYPES[explosion.type];
  explosionType.draw(explosion, foreground);
}

function drawStatus() {
  if (state === 'player-win') {
    const player = players[currentPlayer];
    drawText(foreground, `Player ${currentPlayer+1} wins!`, 8, 8, player.c, 'left');
    return;
  }

  else if (state === 'game-over') {
    drawText(foreground, `EVERYBODY IS DEAD`, 8, 8, 'white', 'left');
    return;
  }

  const player = players[currentPlayer];
  const {currentWeapon} = player;
  const weaponType = player.weapons[currentWeapon];
  const weapon = WEAPON_TYPES.find(x => x.id === weaponType.type);
  drawText(foreground, `NRG:${player.energy}  AIM:${player.a}  PWR:${player.p}  ${clamp(0, weaponType.ammo, 99)} ${weapon.name}`, 8, 8, player.c, 'left');
  drawText(foreground, `WIND: ${wind<=0?'<':''}${Math.abs(wind)}${wind>=0?'>':''}`, W-8, 8, 'white', 'right');
}

loop(() => {
  update();
  draw();
});
