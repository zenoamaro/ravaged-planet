import {key} from './input.js';
import {createTerrain, clipTerrain, isTerrain, landHeight} from './terrain.js';
import {createCanvas, drawCircle, drawLine, plot, drawParagraph, loop, drawText, drawRect} from './gfx.js';
import {wrap, clamp, parable, deg2rad, vec} from './math.js';
import {drawExplosion, WEAPONS} from './weapons.js';

const W = 384; const H = 240; const Z = 3;

let state = 'aim';
const players = [];
let currentPlayer = 0;
let projectile = null;

// Init canvas
const fb = createCanvas(W, H);
fb.canvas.style.width = `${W * Z}px`;
fb.canvas.style.height = `${H * Z}px`;
document.body.appendChild(fb.canvas);

// Init terrain
const terrain = createTerrain(W, H);

// Init projectiles
const projectiles = createCanvas(W, H);

// Init players
players.push({x:100, y:landHeight(terrain, 100), a:0, p:100, c:'red', weapon:WEAPONS[0]});
players.push({x:220, y:landHeight(terrain, 220), a:0, p:100, c:'blue', weapon:WEAPONS[1]});

function update() {
  if (state === 'aim') {
    const player = players[currentPlayer];
    const {x, y, a, p} = player;

    if (key('ArrowLeft')) {
      player.a = wrap(0, a -1, 180);
    } else if (key('ArrowRight')) {
      player.a = wrap(0, a +1, 180);
    } else if (key('ArrowUp')) {
      player.p = clamp(100, p +5, 1000);
    } else if (key('ArrowDown')) {
      player.p = clamp(100, p -5, 1000);
    } else if (key(' ')) {
      state = 'fire';
      fadeProjectiles();
      const [px, py] = vec(x, y-3, a+180, 3);
      projectile = {
        player: player,
        weapon: player.weapon,
        ox:px, oy:py, a, p,
        x:0, y:0, t: 0,
      };
    }
  }

  else if (state === 'fire') {
    for (let i=0; i<10; i++) {
      const {weapon, ox, oy, a, p, t} = projectile;
      const [x, y] = parable(t, ox, oy, deg2rad(180+a), p/10, 9.8);
      projectile.t += 0.01;
      projectile.x = Math.round(x);
      projectile.y = Math.round(y);

      if (y > H || isTerrain(terrain, x, y)) {
        clipTerrain(terrain, (ctx) => drawExplosion(ctx, projectile.x, projectile.y, weapon.xr));
        currentPlayer = wrap(0, currentPlayer+1, players.length);
        projectile = null;
        state = 'aim';
        return;
      }
    }
  }
}

function draw() {
  fb.clearRect(0, 0, W, H);
  fb.drawImage(terrain.canvas, 0, 0);
  if (projectile) drawProjectile();
  fb.drawImage(projectiles.canvas, 0, 0);
  for (let tank of players) drawPlayer(tank);
  drawStatus();
}

function drawPlayer(player) {
  const {x, y, a, c} = player;
  const [px, py] = vec(x, y-3, a+180, 3);
  drawLine(fb, x, y-3, Math.round(px), Math.round(py), c);
  drawRect(fb, x-3, y-2, 6, 3, c);
}

function drawProjectile() {
  const {x, y, player} = projectile;
  plot(projectiles, x, y, player.c);
}

function fadeProjectiles() {
  const imageData = projectiles.getImageData(0, 0, W, H);
  for (let i=0; i<imageData.data.length; i+=4) imageData.data[i+3] -= 25;
  projectiles.clearRect(0, 0, W, H);
  projectiles.putImageData(imageData, 0, 0);
}

function drawStatus() {
  const player = players[currentPlayer];
  const {weapon} = player;
  drawText(fb, `AIM=${player.a}  PWR=${player.p}`, 8, 8, player.c, 'left');
  drawText(fb, `${weapon.name}`, W-8, 8, player.c, 'right');
}

loop(() => {
  update();
  draw();
});
