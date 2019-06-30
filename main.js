import {H, PROJECTILE_MAX_SOUND_FREQUENCY, MAX_WIND, PROJECTILE_MIN_SOUND_FREQUENCY, PLAYER_COLORS, PLAYER_INITIAL_POWER, PROJECTILE_POWER_REDUCTION_FACTOR, W, Z, PROJECTILE_ITERATIONS_PER_FRAME, PROJECTILE_ITERATION_PROGRESS, PLAYER_MAX_ENERGY, PLAYER_ENERGY_POWER_MULTIPLIER, PLAYER_FALL_DAMAGE_FACTOR, PLAYER_FALL_DAMAGE_HEIGHT, PLAYER_WEAPON_CHANGE_DELAY, PARTICLE_AMOUNT, PROJECTILE_WIND_REDUCTION_FACTOR, PARTICLE_POWER_REDUCTION_FACTOR, PARTICLE_WIND_REDUCTION_FACTOR, PARTICLE_MIN_POWER_FACTOR, PARTICLE_MAX_POWER_FACTOR, PARTICLE_MIN_LIFETIME, PARTICLE_TIME_FACTOR, PLAYER_EXPLOSION_PARTICLE_POWER, EXPLOSION_SHAKE_REDUCTION_FACTOR, MAX_EXPLOSION_SHAKE_FACTOR, TRAJECTORY_FADE_SPEED, PARTICLE_FADE_AMOUNT, TRAJECTORY_FLOAT_SPEED, PLAYER_TANK_BOUNDING_RADIUS, PLAYER_STARTING_WEAPONS, WEAPON_TYPES, DEATH_SPECS} from './constants.js';
import {createCanvas, drawLine, drawRect, drawText, loop, plot, drawLineVirtual} from './gfx.js';
import {key} from './input.js';
import {clamp, deg2rad, parable, randomInt, vec, wrap, random, within} from './math.js';
import {createSky} from './sky.js';
import {audio, createOsc, playTickSound} from './sound.js';
import {collapseTerrain, createTerrain, isTerrain, landHeight, closestLand, clipTerrain} from './terrain.js';
import {EXPLOSION_TYPES} from './weapons.js';
import {sample} from './utils.js';
import {AI_TYPES} from './ai.js';


let idle = false;
let state = 'start-game';
const players = [];
let currentPlayer = 0;
let projectile = null;
let explosion = null;
let wind = 0;
let lastWeaponChangeTime = 0;
let particles = [];
let screenShake = 0;
let trajectories = [];

// Init layers
const sky = createSky(W, H);
const traces = createCanvas(W, H);
const terrain = createTerrain(W, H);
const foreground = createCanvas(W, H);

for (let c of [sky, traces, terrain, foreground]) {
  c.canvas.style.width = `${W * Z}px`;
  c.canvas.style.height = `${H * Z}px`;
  document.body.appendChild(c.canvas);
}

// Init players
let i=0;
for (let [color, borderColor] of PLAYER_COLORS) {
  const x = 50 + (W-100) / 5 * i;
  const y = landHeight(terrain, x) + 1;
  const a = x > W/2 ? 45 : 180-45;
  players.push({
    x, y, a,
    c: color, cb: borderColor,
    p: PLAYER_INITIAL_POWER,
    weapons: [...PLAYER_STARTING_WEAPONS],
    currentWeapon: 0,
    energy: PLAYER_MAX_ENERGY,
    ai: i !== 0 ? 'moron' : undefined,
    fallHeight: 0,
    dead: false,
  });
  clipTerrain(terrain, (ctx) => drawRect(ctx, x-4, 0, 8, y, ctx.color));
  i++;
}

function update() {
  idle = false;

  updateParticles();

  if (state === 'start-game') {
    wind = randomInt(-MAX_WIND, +MAX_WIND);
    state = 'start-turn';
  }

  else if (state === 'start-turn') {
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
    } else {
      idle = true;
    }

    if (shoot) {
      const {a, p} = shoot;
      const [px, py] = vec(x, y-3, a+180, 5);

      const weaponType = player.weapons[player.currentWeapon];
      weaponType.ammo -= 1;

      projectile = {
        osc: createOsc(),
        player: player,
        weaponTypeId: weaponType.type,
        ox:px, oy:py, a, p,
        x:px, y:py, t: 0,
        c: player.c
      };

      projectile.osc.start();
      state = 'shoot';
    }
  }

  else if (state === 'shoot') {
    const prevProjectile = {...projectile};

    for (let i=0; i<PROJECTILE_ITERATIONS_PER_FRAME; i++) {
      const {weaponTypeId, ox, oy, a, p, t} = projectile;
      const weapon = WEAPON_TYPES.find(x => x.id === weaponTypeId);
      const [x, y] = parable(
        t, ox, oy, deg2rad(180+a),
        p / PROJECTILE_POWER_REDUCTION_FACTOR,
        wind / PROJECTILE_WIND_REDUCTION_FACTOR,
      );
      const f = (
        (1 - (1 / H * y)) *
        (PROJECTILE_MAX_SOUND_FREQUENCY - PROJECTILE_MIN_SOUND_FREQUENCY) +
        PROJECTILE_MIN_SOUND_FREQUENCY
      );
      projectile.t += PROJECTILE_ITERATION_PROGRESS;
      projectile.x = x;
      projectile.y = y;
      projectile.osc.frequency.setValueAtTime(f, audio.currentTime);

      if (
        projectile.y > H ||
        isTank(projectile.x, projectile.y) ||
        isTerrain(terrain, projectile.x, projectile.y)
      ) {
        projectile.osc.stop();
        const explosionSpec = weapon.explosion;
        const explosionType = EXPLOSION_TYPES[explosionSpec.type];
        explosion = explosionType.create(explosionSpec, projectile.x, projectile.y);
        // @ts-ignore: canvas color hack
        createParticles(projectile.x, projectile.y, projectile.p, terrain.color);
        state = 'explosion';
        break;
      }
    }

    fadeTrajectories(TRAJECTORY_FADE_SPEED);

    let trajectory = drawLineVirtual(
      prevProjectile.x, prevProjectile.y,
      projectile.x, projectile.y,
      projectile.c,
    )

    trajectory = trajectory
      .slice(0, trajectory.length-1) // Cut last pixel to prevent overlap
      .map(x => ({...x, a:255}));    // Add alpha to all lines

    trajectories = [
      ...trajectories,
      ...trajectory,
    ];
  }

  else if (state === 'explosion') {
    const explosionType = EXPLOSION_TYPES[explosion.type];
    screenShake = (
      clamp(0, explosion.r, MAX_EXPLOSION_SHAKE_FACTOR) /
      EXPLOSION_SHAKE_REDUCTION_FACTOR
    );

    if (!explosionType.update(explosion)) {
      screenShake = 0;
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
    collapseTerrain(terrain);
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
        if (player.fallHeight++ >= PLAYER_FALL_DAMAGE_HEIGHT) {
          player.energy -= PLAYER_FALL_DAMAGE_FACTOR;
        }
      }
    }
    if (stable) state = 'destroy-players';
  }

  else if (state === 'destroy-players') {
    const dyingPlayer = players.find(x => x.energy<=0 && !x.dead);
    if (!dyingPlayer) {state = 'end-turn'; return}

    const {x, y, c} = dyingPlayer;
    const explosionSpec = sample(DEATH_SPECS);
    const explosionType = EXPLOSION_TYPES[explosionSpec.type];
    explosion = explosionType.create(explosionSpec, x, y);
    createParticles(x, y, PLAYER_EXPLOSION_PARTICLE_POWER, c);
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

function createParticles(x, y, p, c) {
  for (let i = 0; i < PARTICLE_AMOUNT; i++) {
    particles.push({
      t: 0,
      ox: x, x: x,
      oy: y, y: y,
      a: randomInt(0, 359),
      p: p * random(PARTICLE_MIN_POWER_FACTOR, PARTICLE_MAX_POWER_FACTOR),
      // @ts-ignore: canvas color hack
      c, alpha: 255,
    });
  }
}

function updateParticles() {
  for (let i=particles.length-1; i>=0; i--) {
    const particle = particles[i];

    if (
      particle.y > H ||
      particle.alpha <= 0 ||
      particle.t > PARTICLE_MIN_LIFETIME && isTerrain(terrain, particle.x, particle.y)
    ) {
      particles.splice(i, 1);
      continue;
    }

    const {ox, oy, t, a, p} = particle;

    const [tx, ty] = parable(
      t / PARTICLE_TIME_FACTOR,
      ox, oy, deg2rad(180+a),
      p / PARTICLE_POWER_REDUCTION_FACTOR,
      wind / PARTICLE_WIND_REDUCTION_FACTOR,
    );

    particle.t++;
    particle.x = tx;
    particle.y = ty;
    particle.alpha -= PARTICLE_FADE_AMOUNT;
  }
}

function isTank(x, y) {
  for (let player of players) {
    if (within(x, y, player.x, player.y, PLAYER_TANK_BOUNDING_RADIUS)) {
      return true;
    }
  }
}

function draw() {
  if (idle && particles.length===0) return;
  foreground.clearRect(0, 0, W, H);
  drawTrajectories();
  drawPlayers();
  drawProjectile();
  drawExplosions();
  drawParticles();
  drawStatus();
  drawScreenShake();
}

function drawPlayers() {
  for (let player of players) {
    const {x, y, a, c, cb, dead} = player;
    if (dead) continue;
    const [px, py] = vec(x, y-3, a+180, 3);
    drawLine(foreground, x-1, y-3, px-1, py, cb);
    drawLine(foreground, x+1, y-3, px+1, py, cb);
    drawLine(foreground, x, y-4, px, py-1, cb);
    drawRect(foreground, x-4, y-3, 8, 1, cb);
    drawRect(foreground, x-5, y-2, 10, 2, cb);
    drawRect(foreground, x-4, y-0, 8, 1, cb);
    drawRect(foreground, x-3, y+1, 6, 1, cb);
    drawLine(foreground, x, y-3, px, py, c);
    drawRect(foreground, x-4, y-2, 8, 2, c);
    drawRect(foreground, x-3, y-0, 6, 1, c);
  }
}

function drawTrajectories() {
  traces.clearRect(0, 0, W, H);
  for (let {x, y, c, a} of trajectories) {
    traces.globalAlpha = a / 255;
    plot(traces, x, y, c);
  }
  traces.globalAlpha = 1;
}

function drawProjectile() {
  if (!projectile) return;
  plot(foreground, clamp(0, projectile.x, W), clamp(0, projectile.y, H), 'white');
}

function fadeTrajectories(amount) {
  for (let i=trajectories.length-1; i>=0; i--) {
    const trajectory = trajectories[i];
    trajectory.a -= amount;
    trajectory.y -= TRAJECTORY_FLOAT_SPEED;

    if (
      trajectory.a <= 0 || trajectory.y <= 0 ||
      isTerrain(terrain, trajectory.x, trajectory.y)
    ) {
      trajectories.splice(i, 1);
    }
  }
}

function drawExplosions() {
  if (!explosion) return;
  const explosionType = EXPLOSION_TYPES[explosion.type];
  explosionType.draw(explosion, foreground, terrain);
}

function drawParticles() {
  for (let particle of particles) {
    foreground.globalAlpha = clamp(0, particle.alpha / 255, 255);
    plot(foreground, particle.x, particle.y, particle.c);
  }
  foreground.globalAlpha = 1;
}

function drawScreenShake() {
  const x = randomInt(-screenShake, screenShake);
  const y = randomInt(-screenShake, screenShake);
  for (let c of [sky, terrain, traces, foreground]) {
    c.canvas.style.transform = `translate(${x}px, ${y}px)`;
  }
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
