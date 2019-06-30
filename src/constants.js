export const W = 640;
export const H = 400;
export const Z = 2;

export const SKY_COLORS = [
  {from:[42, 78, 108], to:[0, 0, 0]},
  {from:[82, 120, 187], to:[201, 218, 236]},
  {from:[94, 171, 184], to:[225, 172, 139]},
  {from:[49, 76, 148], to:[242, 171, 85]},
  {from:[51, 89, 135], to:[163, 198, 220]},
  {from:[105, 95, 108], to:[223, 183, 110]},
];

export const MAX_PLAYERS = 6;

export const PLAYER_COLORS = [
  ['tomato', 'darkred'],
  ['royalblue', 'darkblue'],
  ['greenyellow', 'green'],
  ['gold', 'peru'],
  ['hotpink', 'mediumvioletred'],
  ['blueviolet', 'indigo'],
];

export const PLAYER_STARTING_WEAPONS = [
  {type: 'babyMissile', ammo:Infinity},
  {type: 'missile', ammo:5},
  {type: 'babyNuke', ammo:3},
  {type: 'nuke', ammo:1},
  {type: 'smallDirt', ammo:5},
  {type: 'dirt', ammo:3},
  {type: 'largeDirt', ammo:1},
  {type: 'smallDigBomb', ammo:5},
  {type: 'digBomb', ammo:3},
  {type: 'largeDigBomb', ammo:1},
  {type: 'tracer', ammo:Infinity},
]

export const WEAPON_TYPES = [
  {id:'tracer', name:'Tracer', explosion:{type:'tracer'}},
  {id:'babyMissile', name:'Baby Missile', explosion:{type:'blast', r:5}},
  {id:'missile', name:'Missile', explosion:{type:'blast', r:20}},
  {id:'babyNuke', name:'Baby Nuke', explosion:{type:'blast', r:50}},
  {id:'nuke', name:'Nuke', explosion:{type:'blast', r:100}},
  {id:'smallDirt', name:'Small Dirt', explosion:{type:'dirt', r:25}},
  {id:'dirt', name:'Dirt', explosion:{type:'dirt', r:50}},
  {id:'largeDirt', name:'Ton of Dirt', explosion:{type:'dirt', r:75}},
  {id:'smallDigBomb', name:'Small Dig Bomb', explosion:{type:'digBomb', r:25}},
  {id:'digBomb', name:'Dig Bomb', explosion:{type:'digBomb', r:50}},
  {id:'largeDigBomb', name:'Large Dig Bomb', explosion:{type:'digBomb', r:75}},
];

export const DEATH_SPECS = [
  {type: 'blast', r: 15},
  {type: 'blast', r: 30},
  {type: 'blast', r: 60},
  {type: 'dirt', r: 25},
  {type: 'dirt', r: 50},
  {type: 'dirt', r: 75},
  {type: 'digBomb', r: 25},
  {type: 'digBomb', r: 50},
  {type: 'digBomb', r: 75},
  {type: 'dirtCone', r: 50},
  {type: 'dirtCone', r: 100},
  {type: 'dirtCone', r: 150},
];

export const MAX_WIND = 25;
export const DEFAULT_KEYPRESS_DELAY = 150;

export const PLAYER_MAX_ENERGY = 100;
export const PLAYER_ENERGY_POWER_MULTIPLIER = 10;
export const PLAYER_INITIAL_POWER = 300;
export const PLAYER_FALL_DAMAGE_HEIGHT = 50;
export const PLAYER_FALL_DAMAGE_FACTOR = 3;
export const PLAYER_EXPLOSION_PARTICLE_POWER = 500;
export const PLAYER_TANK_BOUNDING_RADIUS = 3;
export const PLAYER_ANGLE_INCREMENT = 1;
export const PLAYER_ANGLE_FAST_INCREMENT = 3;
export const PLAYER_POWER_INCREMENT = 1;
export const PLAYER_POWER_FAST_INCREMENT = 10;
export const PLAYER_ANGLE_TICK_SOUND_INTERVAL = 2;
export const PLAYER_POWER_TICK_SOUND_INTERVAL = 2;

export const PROJECTILE_POWER_REDUCTION_FACTOR = 10;
export const PROJECTILE_WIND_REDUCTION_FACTOR = 10;
export const PROJECTILE_ITERATIONS_PER_FRAME = 30;
export const PROJECTILE_ITERATION_PROGRESS = 0.01;
export const PROJECTILE_MIN_SOUND_FREQUENCY = 220;
export const PROJECTILE_MAX_SOUND_FREQUENCY = 2200;
export const TRAJECTORY_FADE_SPEED = 0.6;
export const TRAJECTORY_FLOAT_SPEED = 0.01;

export const PARTICLE_AMOUNT = 30;
export const PARTICLE_MIN_POWER_FACTOR = 0.4;
export const PARTICLE_MAX_POWER_FACTOR = 1;
export const PARTICLE_MIN_LIFETIME = 5;
export const PARTICLE_TIME_FACTOR = 13;
export const PARTICLE_POWER_REDUCTION_FACTOR = 15;
export const PARTICLE_WIND_REDUCTION_FACTOR = 3;
export const PARTICLE_FADE_AMOUNT = 1;

export const MAX_EXPLOSION_SHAKE_FACTOR = 60;
export const EXPLOSION_SHAKE_REDUCTION_FACTOR = 7;

export const FONT_WIDTH = 3;
export const FONT_HEIGHT = 5;
