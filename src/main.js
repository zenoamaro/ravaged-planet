import {AI_TYPES} from './ai.js';
import {DEATH_SPECS, EXPLOSION_SHAKE_REDUCTION_FACTOR, H, MAX_EXPLOSION_SHAKE_FACTOR, MAX_WIND, PARTICLE_AMOUNT, PARTICLE_FADE_AMOUNT, PARTICLE_MAX_POWER_FACTOR, PARTICLE_MIN_LIFETIME, PARTICLE_MIN_POWER_FACTOR, PARTICLE_POWER_REDUCTION_FACTOR, PARTICLE_TIME_FACTOR, PARTICLE_WIND_REDUCTION_FACTOR, PLAYER_ANGLE_FAST_INCREMENT, PLAYER_ANGLE_INCREMENT, PLAYER_ANGLE_TICK_SOUND_INTERVAL, PLAYER_COLORS, PLAYER_ENERGY_POWER_MULTIPLIER, PLAYER_EXPLOSION_PARTICLE_POWER, PLAYER_FALL_DAMAGE_FACTOR, PLAYER_FALL_DAMAGE_HEIGHT, PLAYER_INITIAL_POWER, PLAYER_MAX_ENERGY, PLAYER_POWER_FAST_INCREMENT, PLAYER_POWER_INCREMENT, PLAYER_POWER_TICK_SOUND_INTERVAL, PLAYER_STARTING_TOOLS, PLAYER_STARTING_WEAPONS, PLAYER_TANK_BOUNDING_RADIUS, PLAYER_TANK_Y_FOOTPRINT, TRAJECTORY_FADE_SPEED, TRAJECTORY_FLOAT_SPEED, W, WEAPON_TYPES, Z} from './constants.js';
import {createCanvas, drawLine, drawRect, drawSemiCircle, drawText, loop, plot} from './gfx.js';
import {afterKeyDelay, key} from './input.js';
import {clamp, deg2rad, distance, parable, random, randomInt, vec, wrap} from './math.js';
import {PROJECTILE_TYPES} from './projectiles.js';
import {generateSky} from './sky.js';
import {playTickSound} from './sound.js';
import {clipTerrain, closestLand, collapseTerrain, generateTerrain, isTerrain, landHeight} from './terrain.js';
import {sample} from './utils.js';
import {EXPLOSION_TYPES} from './weapons.js';


let state = 'start-game';
let players = [];
let currentPlayer = 0;
let projectiles = [];
let explosions = [];
let wind = 0;
let particles = [];
let screenShake = 0;
let trajectories = [];
let idle = false;
let winner;

// Music
// const music = createAudioLoop('assets/battle.mp3');

// Init layers
const sky = createCanvas(W, H);
const traces = createCanvas(W, H);
const terrain = createCanvas(W, H);
const foreground = createCanvas(W, H);

// Composited layer
const framebuffer = createCanvas(W, H);
framebuffer.canvas.style.width = `${W * Z}px`;
framebuffer.canvas.style.height = `${H * Z}px`;
document.body.appendChild(framebuffer.canvas);

function init() {
  state = 'start-game';
  players = [];
  currentPlayer = 0;
  projectiles = [];
  explosions = [];
  particles = [];
  screenShake = 0;
  trajectories = [];
  idle = false;
  winner = null;
  wind = randomInt(-MAX_WIND, +MAX_WIND);

  initLevel();
  initPlayers();
}

function initPlayers() {
  let i=0;
  for (let [color, borderColor] of PLAYER_COLORS) {
    const x = 50 + (W-100) / 5 * i;
    const y = landHeight(terrain, x) + 1;
    const a = x > W/2 ? 45 : 180-45;
    players.push({
      name: `Player ${i+1}`,
      x, y, a,
      c: color, cb: borderColor,
      p: PLAYER_INITIAL_POWER,
      tools: PLAYER_STARTING_TOOLS.map(x => ({...x})), // FIXME: Ghetto clone
      weapons: PLAYER_STARTING_WEAPONS.map(x => ({...x})), // FIXME: Ghetto clone
      currentWeapon: 0,
      energy: PLAYER_MAX_ENERGY,
      ai: i !== 0 ? sample(Object.keys(AI_TYPES)) : undefined,
      fallHeight: 0,
      dead: false,
    });
    clipTerrain(terrain, (ctx) => drawRect(ctx, x-4, 0, 8, y, ctx.color));
    i++;
  }
}

function initLevel() {
  generateSky(sky);
  generateTerrain(terrain);
}

function update() {
  idle = false;

  updateParticles();

  if (state === 'start-game') {
    init();
    state = 'start-turn';
  }

  else if (state === 'start-turn') {
    state = 'aim';
  }

  else if (state === 'aim') {
    const player = players[currentPlayer];
    const {x, y, a, p, weapons, energy} = player;
    const maxPower = energy * PLAYER_ENERGY_POWER_MULTIPLIER;
    player.p = clamp(0, player.p, maxPower);
    const isPrecise = key('Alt');
    const isFast = key('Shift');
    const isReverse = key('Shift');
    let shoot;

    if (player.ai) {
      let ai = AI_TYPES[player.ai];
      const plan = ai.decide(player);
      player.a = wrap(0, plan.a, 180);
      player.p = clamp(0, plan.p, maxPower);
      player.currentWeapon = clamp(0, plan.currentWeapon, weapons.length-1);
      shoot = true;
    }

    else if (key('ArrowLeft')) {
      if (isPrecise && !afterKeyDelay()) return;
      let incr = isFast ? PLAYER_ANGLE_FAST_INCREMENT : PLAYER_ANGLE_INCREMENT;
      player.a = wrap(0, a -incr, 180);
      if (isPrecise || isFast || a % PLAYER_ANGLE_TICK_SOUND_INTERVAL === 0) playTickSound();

    } else if (key('ArrowRight')) {
      if (isPrecise && !afterKeyDelay()) return;
      let incr = isFast ? PLAYER_ANGLE_FAST_INCREMENT : PLAYER_ANGLE_INCREMENT;
      player.a = wrap(0, a +incr, 180);
      if (isPrecise || isFast || a % PLAYER_ANGLE_TICK_SOUND_INTERVAL === 0) playTickSound();

    } else if (key('ArrowUp')) {
      if (isPrecise && !afterKeyDelay()) return;
      let incr = isFast ? PLAYER_POWER_FAST_INCREMENT : PLAYER_POWER_INCREMENT;
      player.p = clamp(0, p +incr, maxPower);
      if (p < maxPower && (isPrecise || isFast || p % PLAYER_POWER_TICK_SOUND_INTERVAL === 0)) playTickSound();

    } else if (key('ArrowDown')) {
      if (isPrecise && !afterKeyDelay()) return;
      let incr = isFast ? PLAYER_POWER_FAST_INCREMENT : PLAYER_POWER_INCREMENT;
      player.p = clamp(0, p -incr, maxPower);
      if (p > 0 && (isPrecise || isFast || p % PLAYER_POWER_TICK_SOUND_INTERVAL === 0)) playTickSound();

    } else if (key('Tab')) {
      if (!afterKeyDelay()) return;
      const dir = isReverse ? -1 : 1;
      player.currentWeapon = wrap(0, player.currentWeapon+dir, player.weapons.length-1);
      playTickSound();

    } else if (key(' ')) {
      if (!afterKeyDelay()) return;
      shoot = {a, p};

    } else {
      idle = true;
    }

    if (shoot) {
      const {a, p, weapons, currentWeapon} = player;
      const [px, py] = vec(x, y-3, a+180, 5);

      const weapon = weapons[currentWeapon];
      const {projectile} = WEAPON_TYPES[weapon.type];
      const projectileType = PROJECTILE_TYPES[projectile.type];
      weapon.ammo -= 1;

      projectileType.create(projectile, player, weapon, px, py, a, p, wind)
        .forEach(x => projectiles.push(x));

      state = 'shoot';
    }
  }

  else if (state === 'shoot') {
    for (let i=projectiles.length-1; i>=0; i--) {
      const projectile = projectiles[i];
      const projectileType = PROJECTILE_TYPES[projectile.type];
      if (projectileType.update(projectile, terrain, projectiles, trajectories, explosions)) continue;
      projectileType.stop(projectile);
      projectiles.splice(i, 1);
    }
    if (projectiles.length === 0) {
      state = 'explosions';
    }
  }

  else if (state === 'explosions') {
    for (let i=explosions.length-1; i>=0; i--) {
      const explosion = explosions[i];
      const explosionType = EXPLOSION_TYPES[explosion.type];
      screenShake = (
        clamp(0, explosion.r, MAX_EXPLOSION_SHAKE_FACTOR) /
        EXPLOSION_SHAKE_REDUCTION_FACTOR
      );

      if (explosionType.update(explosion)) continue;
      screenShake = 0;
      explosionType.clip(explosion, terrain);
      explosionType.stop(explosion);
      for (let player of players) if (!player.dead) {
        player.energy -= explosionType.damage(explosion, player) || 0;
      }
      explosions.splice(i, 1);
    }
    if (explosions.length === 0) {
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
          if (player.energy > 0 && player.parachute) continue;
          const parachute = player.tools.find(x => x.type === 'parachute');
          if (player.energy > 0 && parachute && parachute.ammo > 0) {
            player.parachute = parachute;
            parachute.ammo--;
            continue;
          }
          player.energy -= PLAYER_FALL_DAMAGE_FACTOR;
        }
      } else {
        player.parachute = null;
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
    explosions.push(explosionType.create(explosionSpec, x, y));
    createParticles(x, y, PLAYER_EXPLOSION_PARTICLE_POWER, c);
    dyingPlayer.dead = true;
    state = 'explosions';
  }

  else if (state === 'end-turn') {
    const alivePlayers = players.filter(x => !x.dead);

    if (alivePlayers.length === 0) {
      return state = 'game-over';
    } else if (alivePlayers.length === 1) {
      winner = alivePlayers[0];
      return state = 'player-win';
    }

    for (let player of players) {
      player.weapons = player.weapons.filter(x => x.ammo > 0);
      player.tools = player.tools.filter(x => x.ammo > 0);
      player.currentWeapon = wrap(0, player.currentWeapon, player.weapons.length-1);
      player.fallHeight = 0;
    }

    for (let p=0; p<players.length; p++) {
      const i = wrap(0, currentPlayer+p+1, players.length-1);
      if (!players[i].dead) {currentPlayer = i; break}
    }

    fadeTrajectories();
    state = 'start-turn';
  }

  else if (state === 'player-win') {
    if (key('Enter')) state = 'start-game';
    idle = true;
  }

  else if (state === 'game-over') {
    if (key('Enter')) state = 'start-game';
    idle = true;
  }

  else {
    throw new Error(`Invalid state, ${state}`);
  }
}

export function createParticles(x, y, p, c) {
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

export function isTank(x, y) {
  for (let player of players) {
    if (player.dead) continue;

    if (
      distance(x, y, player.x, player.y+PLAYER_TANK_Y_FOOTPRINT) <=
      PLAYER_TANK_BOUNDING_RADIUS
    ) {
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

  for (let c of [sky, traces, terrain, foreground]) {
    framebuffer.drawImage(c.canvas, 0, 0);
  }

  drawScreenShake();
}

function drawPlayers() {
  for (let player of players) {
    const {x, y, a, c, cb, energy, dead} = player;
    if (dead) continue;

    // Parachute
    if (player.parachute) {
      drawSemiCircle(foreground, x, y-15, 10, 'white');
      drawLine(foreground, x-10, y-15, x-2, y, 'white');
      drawLine(foreground, x-5,  y-15, x-1, y, 'white');
      drawLine(foreground, x,    y-15, x,   y, 'white');
      drawLine(foreground, x+5,  y-15, x+1, y, 'white');
      drawLine(foreground, x+10, y-15, x+2, y, 'white');
    }

    // Cannon
    const [px, py] = vec(x, y-3, a+180, 3);
    drawLine(foreground, x-1, y-3, px-1, py, cb);
    drawLine(foreground, x+1, y-3, px+1, py, cb);
    drawLine(foreground, x, y-4, px, py-1, cb);

    // Tank
    drawRect(foreground, x-4, y-3, 8, 1, cb);
    drawRect(foreground, x-5, y-2, 10, 2, cb);
    drawRect(foreground, x-4, y-0, 8, 1, cb);
    drawRect(foreground, x-3, y+1, 6, 1, cb);
    drawLine(foreground, x, y-3, px, py, c);
    drawRect(foreground, x-4, y-2, 8, 2, c);
    drawRect(foreground, x-3, y-0, 6, 1, c);

    // Damage
    const damage = clamp(0, 1 - energy/PLAYER_MAX_ENERGY, 1);
    foreground.globalAlpha = damage * 0.7;
    drawRect(foreground, x-4, y-2, 8, 2, cb);
    foreground.globalAlpha = damage;
    drawRect(foreground, x-3, y-0, 6, 1, cb);
    foreground.globalAlpha = 1;
  }
}

function drawTrajectories() {
  traces.clearRect(0, 0, W, H);
  for (let i=trajectories.length-1; i>=0; i--) {
    const trajectory = trajectories[i];
    const {x, y, c} = trajectory;
    traces.globalAlpha = trajectory.a / 255;
    plot(traces, x, y, c);
  }
  traces.globalAlpha = 1;
}

function fadeTrajectories() {
  for (let i=trajectories.length-1; i>=0; i--) {
    const trajectory = trajectories[i];
    trajectory.a -= TRAJECTORY_FADE_SPEED;
    trajectory.y -= TRAJECTORY_FLOAT_SPEED;
    if (trajectory.a <= 0 || trajectory.y <= 0) {
      trajectories.splice(i, 1);
    }
  }
}

function drawProjectile() {
  if (!projectiles.length) return;
  for (let projectile of projectiles) {
    plot(foreground, clamp(0, projectile.x, W-1), clamp(0, projectile.y, H-1), 'white');
  }
}

function drawExplosions() {
  if (!explosions.length) return;
  for (let explosion of explosions) {
    const explosionType = EXPLOSION_TYPES[explosion.type];
    explosionType.draw(explosion, foreground, terrain);
  }
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
  framebuffer.canvas.style.transform = `translate(${x}px, ${y}px)`;
}

function drawStatus() {
  if (state === 'player-win') {
    drawText(foreground, `${winner.name} wins!`, 8, 8, winner.c, 'left');
    drawText(foreground, `Press ENTER to play again`, W-8, 8, 'white', 'right');
    return;
  }

  else if (state === 'game-over') {
    drawText(foreground, `EVERYBODY IS DEAD`, 8, 8, 'white', 'left');
    drawText(foreground, `Press ENTER to play again`, W-8, 8, 'white', 'right');
    return;
  }

  const player = players[currentPlayer];
  const {currentWeapon} = player;
  const weapon = player.weapons[currentWeapon];
  const weaponType = WEAPON_TYPES[weapon.type];
  drawText(foreground, `${player.name}   NRG:${player.energy}   AIM:${player.a}   PWR:${player.p}   ${clamp(0, weapon.ammo, 99)} ${weaponType.name}`, 8, 8, player.c, 'left');
  drawText(foreground, `WIND: ${wind<=0?'<':''}${Math.abs(wind)}${wind>=0?'>':''}`, W-8, 8, 'white', 'right');
}

loop(() => {
  update();
  draw();
});
