import {H, MAX_BULLET_SOUND_FREQUENCY, MAX_WIND, MIN_BULLET_SOUND_FREQUENCY, PLAYER_COLORS, PLAYER_INITIAL_POWER, REDUCTION_FACTOR, W, Z, PROJECTILE_ITERATIONS_PER_FRAME, PROJECTILE_ITERATION_PROGRESS, PLAYER_MAX_ENERGY, PLAYER_ENERGY_POWER_MULTIPLIER} from './constants.js';
import {createCanvas, drawLine, drawRect, drawText, loop} from './gfx.js';
import {key} from './input.js';
import {clamp, deg2rad, parable, randomInt, vec, wrap} from './math.js';
import {createSky} from './sky.js';
import {audio, createOsc} from './sound.js';
import {clipTerrain, collapseTerrain, createTerrain, isTerrain, landHeight, closestLand} from './terrain.js';
import {drawExplosion, WEAPON_TYPES, EXPLOSION_TYPES} from './weapons.js';


let state = 'start-turn';
const players = [];
let currentPlayer = 0;
let projectile = null;
let prevProjectile = null;
let explosion = null;
let fadeCount = 0;
let wind = 0;

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
    weapon: WEAPON_TYPES[i % WEAPON_TYPES.length],
    energy: PLAYER_MAX_ENERGY,
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

    if (key('ArrowLeft')) {
      player.a = wrap(0, a -1, 180);
    } else if (key('ArrowRight')) {
      player.a = wrap(0, a +1, 180);
    } else if (key('ArrowUp')) {
      player.p = clamp(0, p +1, energy * PLAYER_ENERGY_POWER_MULTIPLIER);
    } else if (key('ArrowDown')) {
      player.p = clamp(0, p -1, energy * PLAYER_ENERGY_POWER_MULTIPLIER);
    } else if (key(' ')) {
      state = 'fire';
      const [px, py] = vec(x, y-3, a+180, 5);
      projectile = prevProjectile = {
        osc: createOsc(),
        player: player,
        weapon: player.weapon,
        ox:px, oy:py, a, p,
        x:px, y:py, t: 0,
      };
      projectile.osc.start();
    }
  }

  else if (state === 'fire') {
    prevProjectile = {...projectile};

    if (fadeCount++ === 1) {
      fadeProjectiles(1);
      fadeCount = 0;
    }

    for (let i=0; i<PROJECTILE_ITERATIONS_PER_FRAME; i++) {
      const {weapon, ox, oy, a, p, t} = projectile;
      const [x, y] = parable(t, ox, oy, deg2rad(180+a), p/REDUCTION_FACTOR, wind/REDUCTION_FACTOR);
      const f = (1-(1/H*y)) * (MAX_BULLET_SOUND_FREQUENCY-MIN_BULLET_SOUND_FREQUENCY) + MIN_BULLET_SOUND_FREQUENCY;
      projectile.t += PROJECTILE_ITERATION_PROGRESS;
      projectile.x = Math.ceil(x);
      projectile.y = Math.floor(y);
      projectile.osc.frequency.setValueAtTime(f, audio.currentTime);

      if (y > H || isTerrain(terrain, x, y)) {
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
    const {weapon} = projectile;
    const explosionType = EXPLOSION_TYPES[weapon.explosion.type];

    if (!explosionType.update(explosion)) {
      for (let player of players) {
        if (player.energy > 0) {
          player.energy -= explosionType.damage(explosion, player) || 0;
        }
      }
      explosion = null;
      state = 'land-collapse';
    }
  }

  else if (state === 'land-collapse') {
    collapseTerrain(terrain, projectile.x, 100); // FIXME: Hardcoded radius
    projectile = null;
    state = 'land-players';
  }

  else if (state === 'land-players') {
    let stable = true;
    for (let player of players) {
      const y = closestLand(terrain, player.x, player.y);
      if (player.y !== y) {
        player.y++;
        stable = false;
      }
    }
    if (stable) state = 'destroy-players';
  }

  else if (state === 'destroy-players') {
    state = 'end-turn';
  }

  else if (state === 'end-turn') {
    let i = 0;
    let player;

    do {
      currentPlayer = wrap(0, currentPlayer+1, players.length);
      player = players[currentPlayer];
      if (i++ === players.length) state = 'game-over';
    } while (player.energy <= 0)

    state = 'start-turn';
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
  const {x, y, a, c, energy} = player;
  if (energy <= 0) return;
  const [px, py] = vec(x, y-3, a+180, 3);
  drawLine(foreground, x, y-3, Math.round(px), Math.round(py), c);
  drawRect(foreground, x-3, y-2, 6, 3, c);
}

function drawProjectile() {
  const {x, y, player} = projectile;
  drawLine(projectiles, prevProjectile.x, prevProjectile.y, x, y, player.c);
}

function fadeProjectiles(amount) {
  const imageData = projectiles.getImageData(0, 0, W, H);
  for (let i=0; i<imageData.data.length; i+=4) imageData.data[i+3] -= amount;
  projectiles.clearRect(0, 0, W, H);
  projectiles.putImageData(imageData, 0, 0);
}

function drawExplosions() {
  const {weapon} = projectile;
  const explosionType = EXPLOSION_TYPES[weapon.explosion.type];
  explosionType.draw(explosion, foreground, terrain);
}

function drawStatus() {
  const player = players[currentPlayer];
  const {weapon} = player;
  drawText(foreground, `AIM:${player.a}  PWR:${player.p}  ${weapon.name}`, 8, 8, player.c, 'left');
  drawText(foreground, `WIND: ${wind<=0?'<':''}${Math.abs(wind)}${wind>=0?'>':''}`, W-8, 8, 'white', 'right');
}

loop(() => {
  update();
  draw();
});
