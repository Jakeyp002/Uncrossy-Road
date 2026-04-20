export const WORLD = {
  width: 1280,
  height: 720,
  roadTop: 112,
  laneCount: 8,
  laneHeight: 58,
  laneGap: 5,
  mudLaneIndices: [2, 5],
  extraMudLaneIndices: [3, 6],
  mudSlowMultiplier: 0.25,
  laneDeployLimit: 5,
  laneLockSeconds: 3,
  escapeLimit: 10,
  breakEscapeRecoveryTarget: 5,
  barbedWireHits: 3,
  startCash: 42,
  comboWindow: 0.85,
  playSecondsBeforeBreak: 30,
  breakSeconds: 15
};

WORLD.roadBottom = WORLD.roadTop + WORLD.laneCount * (WORLD.laneHeight + WORLD.laneGap) - WORLD.laneGap;

export const COLORS = {
  grass: "#75d463",
  grassDark: "#5db84f",
  grassLight: "#9eec76",
  road: "#626c76",
  roadDark: "#4d5660",
  roadLight: "#7d8790",
  curb: "#f4efe5",
  curbStripe: "#e94742",
  laneLine: "#ffe777",
  mud: "#766e48",
  mudDark: "#5b5335",
  mudLight: "#9b965e",
  ink: "#16211f",
  white: "#fff8df",
  feather: "#fffef1",
  splat: "#ff5952",
  cash: "#32ca63",
  warning: "#e94742"
};

export const VEHICLES = {
  car: {
    id: "car",
    key: "1",
    name: "Small Car",
    shortName: "Car",
    cost: 8,
    cooldown: 0.42,
    speed: 690,
    length: 78,
    height: 31,
    damage: 1,
    color: "#36d2d0",
    accent: "#fff26b",
    rarity: "common"
  },
  truck: {
    id: "truck",
    key: "2",
    name: "Truck",
    shortName: "Truck",
    cost: 10,
    cooldown: 0.78,
    speed: 475,
    length: 124,
    height: 42,
    damage: 2,
    color: "#f56f41",
    accent: "#f8faf7",
    rarity: "uncommon"
  },
  bus: {
    id: "bus",
    key: "3",
    name: "Bus",
    shortName: "Bus",
    cost: 15,
    cooldown: 1.35,
    speed: 365,
    length: 185,
    height: 50,
    damage: 3,
    color: "#ffcf32",
    accent: "#3dbf6e",
    rarity: "rare"
  },
  plow: {
    id: "plow",
    key: "4",
    name: "Snow Plow",
    shortName: "Plow",
    cost: 20,
    cooldown: 2.4,
    speed: 235,
    length: 162,
    height: 104,
    damage: 3,
    laneSpan: 2,
    color: "#dff7ff",
    accent: "#5cb9ff",
    rarity: "epic"
  },
  roadblock: {
    id: "roadblock",
    key: "5",
    name: "Roadblock Car",
    shortName: "Block",
    cost: 50,
    cooldown: 4,
    speed: 285,
    length: 220,
    height: 60,
    damage: 999,
    maxUses: 3,
    color: "#e94742",
    accent: "#fff8df",
    rarity: "legendary"
  }
};

export const CHICKENS = {
  runner: {
    id: "runner",
    name: "Chicken",
    description: "The basic bird. Straight runner, low health, shows up immediately.",
    hp: 1,
    radius: 15,
    speed: 118,
    reward: 6,
    color: "#fff7da",
    accent: "#e94742",
    chance: 1
  },
  dart: {
    id: "dart",
    name: "Darter",
    description: "Small and quick. It starts appearing as the run speeds up.",
    hp: 1,
    radius: 13,
    speed: 170,
    reward: 8,
    color: "#f4fff6",
    accent: "#39d96a",
    chance: 0
  },
  tough: {
    id: "tough",
    name: "Bruiser",
    description: "Chunkier chicken with 2 health. Slower, but it can survive weak hits.",
    hp: 2,
    radius: 19,
    speed: 105,
    reward: 12,
    color: "#ffe19a",
    accent: "#e94742",
    chance: 0
  },
  jumper: {
    id: "jumper",
    name: "Jumper",
    description: "Very rare after 3 minutes. Extremely slow, but it hops over mud instead of getting stuck.",
    hp: 1,
    radius: 16,
    speed: 72,
    reward: 11,
    color: "#dff7ff",
    accent: "#5cb9ff",
    jumpsMud: true,
    chance: 0
  },
  mud: {
    id: "mud",
    name: "Mud Chicken",
    description: "Rare after 4 minutes. It is completely immune to mud slowdown.",
    hp: 1,
    radius: 16,
    speed: 112,
    reward: 10,
    color: "#c3aa67",
    accent: "#7c5837",
    ignoresMud: true,
    chance: 0
  },
  boss: {
    id: "boss",
    name: "Boss Chicken",
    description: "Arrives at 2:30. It clears the road, has 20 health, ignores mud, ignores one-tap effects, crawls at one-eighth speed, and deals 5 escape damage.",
    hp: 20,
    radius: 31,
    speed: 118,
    reward: 48,
    color: "#ffdf65",
    accent: "#e94742",
    ignoresMud: true,
    oneTapImmune: true,
    speedMultiplier: 0.125,
    escapeDamage: 5,
    chance: 0
  }
};

export const UPGRADES = [
  {
    id: "cheapCars",
    category: "Vehicles",
    title: "Cheaper Cars",
    text: "-30% car cost",
    baseCost: 18,
    maxLevel: 3
  },
  {
    id: "truckCooldown",
    category: "Vehicles",
    title: "Truck Rush",
    text: "-30% truck cooldown",
    baseCost: 22,
    maxLevel: 3
  },
  {
    id: "longBus",
    category: "Vehicles",
    title: "Long Bus",
    text: "+32% bus length",
    baseCost: 24,
    maxLevel: 3
  },
  {
    id: "bonusCash",
    category: "Economy",
    title: "Loose Change",
    text: "+$1 per splat",
    baseCost: 18,
    maxLevel: 3
  },
  {
    id: "interestBoost",
    category: "Economy",
    title: "Better Interest",
    text: "+25% break interest",
    baseCost: 16,
    maxLevel: 3
  },
  {
    id: "comboLedger",
    category: "Economy",
    title: "Combo Ledger",
    text: "+$1 combo bonus",
    baseCost: 14,
    maxLevel: 3
  },
  {
    id: "breakGrant",
    category: "Economy",
    title: "Break Grant",
    text: "+$8 each break",
    baseCost: 20,
    maxLevel: 3
  },
  {
    id: "mudDepth",
    category: "Map",
    title: "Deeper Mud",
    text: "mud slows harder",
    baseCost: 30,
    maxLevel: 3
  },
  {
    id: "extraMud",
    category: "Map",
    title: "Mud Patch",
    text: "+1 muddy lane",
    baseCost: 40,
    maxLevel: 2
  },
  {
    id: "safeCurbs",
    category: "Map",
    title: "Safer Curbs",
    text: "+2 escape limit",
    baseCost: 44,
    maxLevel: 2
  },
  {
    id: "restockWire",
    category: "Map",
    title: "Restock Wire",
    text: "reload last-lane wire",
    baseCost: 18,
    maxLevel: 99,
    repeatable: true
  },
  {
    id: "plowTune",
    category: "Vehicles",
    title: "Plow Tune",
    text: "-35% plow cooldown",
    baseCost: 28,
    maxLevel: 3
  },
];
