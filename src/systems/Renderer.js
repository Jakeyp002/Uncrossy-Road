import { COLORS, VEHICLES, WORLD } from "../config.js";
import { getViewTransform } from "../utils.js";

export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.game = game;
    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.assets = {
      crackedEgg: new Image()
    };
    this.assets.crackedEgg.src = "./assets/cracked-egg-sprite.svg?v=3.1";
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.floor(rect.width * this.dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * this.dpr));
  }

  render() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = COLORS.grassDark;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const { scale, offsetX, offsetY } = getViewTransform(this.canvas.width, this.canvas.height, WORLD);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

    const shake = this.game.effects.getShakeOffset();
    ctx.save();
    ctx.translate(shake.x, shake.y);
    this.drawGrass(ctx);
    this.drawRoad(ctx);
    this.drawActors(ctx);
    this.drawEffects(ctx);
    this.drawWaveOverlay(ctx);
    this.drawBreakBanner(ctx);
    ctx.restore();

    if (this.game.mode === "playing") {
      this.drawAimHint(ctx);
    }
  }

  captureCurrentView() {
    const photoCanvas = document.createElement("canvas");
    photoCanvas.width = 1280;
    photoCanvas.height = 720;
    const ctx = photoCanvas.getContext("2d");
    const { scale, offsetX, offsetY } = getViewTransform(photoCanvas.width, photoCanvas.height, WORLD);
    ctx.fillStyle = COLORS.grassDark;
    ctx.fillRect(0, 0, photoCanvas.width, photoCanvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    this.drawGrass(ctx);
    this.drawRoad(ctx);
    this.drawActors(ctx);
    this.drawEffects(ctx);
    return photoCanvas.toDataURL("image/png");
  }

  captureTutorialShot(sceneId) {
    const photoCanvas = document.createElement("canvas");
    photoCanvas.width = 720;
    photoCanvas.height = 420;
    const ctx = photoCanvas.getContext("2d");
    const { scale, offsetX, offsetY } = getViewTransform(photoCanvas.width, photoCanvas.height, WORLD);
    const scene = this.buildTutorialScene(sceneId);
    const game = this.game;
    const originalState = {
      mode: game.mode,
      hoveredLane: game.lanes.hoveredLane,
      selectedVehicle: game.selectedVehicle,
      vehicleDirection: game.vehicleDirection,
      chickenItems: game.chickens.items,
      projectiles: game.chickens.projectiles,
      vehicleItems: game.vehicles.items,
      decals: game.effects.decals,
      particles: game.effects.particles,
      popups: game.effects.popups,
      laneBursts: game.effects.laneBursts
    };

    try {
      game.mode = "playing";
      game.lanes.hoveredLane = scene.hoveredLane ?? null;
      game.selectedVehicle = scene.selectedVehicle ?? game.selectedVehicle;
      game.vehicleDirection = scene.vehicleDirection ?? 1;
      game.chickens.items = scene.chickens;
      game.chickens.projectiles = scene.projectiles ?? [];
      game.vehicles.items = scene.vehicles;
      game.effects.decals = [];
      game.effects.particles = [];
      game.effects.popups = [];
      game.effects.laneBursts = [];

      ctx.fillStyle = COLORS.grassDark;
      ctx.fillRect(0, 0, photoCanvas.width, photoCanvas.height);
      ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
      this.drawGrass(ctx);
      this.drawRoad(ctx);
      this.drawActors(ctx);
      if (scene.showAim) {
        this.drawAimHint(ctx);
      }
    } finally {
      game.mode = originalState.mode;
      game.lanes.hoveredLane = originalState.hoveredLane;
      game.selectedVehicle = originalState.selectedVehicle;
      game.vehicleDirection = originalState.vehicleDirection;
      game.chickens.items = originalState.chickenItems;
      game.chickens.projectiles = originalState.projectiles;
      game.vehicles.items = originalState.vehicleItems;
      game.effects.decals = originalState.decals;
      game.effects.particles = originalState.particles;
      game.effects.popups = originalState.popups;
      game.effects.laneBursts = originalState.laneBursts;
    }

    return photoCanvas.toDataURL("image/png");
  }

  captureGameOverShot() {
    return this.captureTutorialShot("scene-gameover");
  }

  captureChickenPortrait(typeId) {
    const portraitCanvas = document.createElement("canvas");
    portraitCanvas.width = 280;
    portraitCanvas.height = 180;
    const ctx = portraitCanvas.getContext("2d");
    const chickenType = this.game.chickenTypes[typeId];
    const chicken = {
      id: `portrait-${typeId}`,
      typeId,
      x: 142,
      y: 104,
      radius: chickenType.radius,
      wobble: 0.65,
      wobbleSpeed: 8,
      squash: 0,
      maxHp: chickenType.hp,
      hp: chickenType.hp,
      reward: chickenType.reward,
      shieldTier: typeId === "runner" ? 1 : 0,
      eggCooldown: 0,
      crackTimer: 0,
      dead: false,
      escaped: false
    };

    ctx.fillStyle = COLORS.grass;
    ctx.fillRect(0, 0, portraitCanvas.width, portraitCanvas.height);
    ctx.fillStyle = typeId === "doomscroller" ? COLORS.roadLight : COLORS.road;
    ctx.fillRect(0, 104, portraitCanvas.width, 76);
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(22, 128, portraitCanvas.width - 44, 8);
    ctx.fillRect(42, 146, portraitCanvas.width - 84, 6);

    ctx.save();
    if (typeId === "doomscroller") {
      this.drawDoomscroller(ctx, chicken, chickenType);
    } else if (typeId === "mother") {
      this.drawMotherChicken(ctx, chicken, chickenType);
    } else {
      this.drawChicken(ctx, chicken);
    }
    ctx.restore();

    return portraitCanvas.toDataURL("image/png");
  }

  buildTutorialScene(sceneId) {
    const laneY = (index) => this.game.lanes.lanes[index]?.centerY ?? 0;
    const chicken = (typeId, x, laneIndex, extra = {}) => ({
      id: `shot-${sceneId}-${typeId}-${x}-${laneIndex}`,
      typeId,
      x,
      y: laneY(laneIndex),
      radius: this.game.chickenTypes[typeId].radius,
      wobble: extra.wobble ?? 0.8,
      wobbleSpeed: 8,
      squash: 0,
      maxHp: extra.maxHp ?? this.game.chickenTypes[typeId].hp,
      hp: extra.hp ?? this.game.chickenTypes[typeId].hp,
      reward: this.game.chickenTypes[typeId].reward,
      shieldTier: extra.shieldTier ?? 0,
      crackTimer: extra.crackTimer ?? 0,
      freezeTimer: extra.freezeTimer ?? 0,
      dead: false,
      escaped: false,
      eggCooldown: extra.eggCooldown ?? 0
    });
    const vehicle = (type, x, laneIndex, extra = {}) => ({
      id: `shot-${sceneId}-${type}-${x}-${laneIndex}`,
      type,
      x,
      y: extra.y ?? laneY(laneIndex),
      direction: extra.direction ?? 1,
      laneIndex,
      laneSpan: extra.laneSpan ?? (VEHICLES[type].laneSpan ?? 1),
      length: extra.length ?? VEHICLES[type].length,
      height: extra.height ?? VEHICLES[type].height,
      damage: VEHICLES[type].damage,
      bob: extra.bob ?? 0.45,
      destroyed: false,
      swerveTimer: 0,
      swerveDuration: 0.28,
      swerveFromY: extra.y ?? laneY(laneIndex),
      swerveToY: extra.y ?? laneY(laneIndex),
      hitIds: new Set()
    });
    const egg = (x, y, vx = 0, vy = 0) => ({ x, y, vx, vy, radius: 18, life: 3 });

    const scenes = {
      "scene-controls": {
        hoveredLane: 3,
        selectedVehicle: "truck",
        vehicleDirection: 1,
        showAim: true,
        vehicles: [vehicle("truck", 370, 3)],
        chickens: [chicken("runner", 790, 3), chicken("dart", 950, 1)]
      },
      "scene-shop": {
        hoveredLane: null,
        selectedVehicle: "car",
        vehicleDirection: -1,
        vehicles: [vehicle("car", 280, 2), vehicle("bus", 910, 5, { direction: -1 })],
        chickens: [chicken("runner", 790, 2), chicken("tough", 560, 5, { hp: 2, maxHp: 2 })]
      },
      "scene-vehicles": {
        hoveredLane: null,
        selectedVehicle: "roadblock",
        vehicleDirection: 1,
        vehicles: [
          vehicle("car", 180, 1),
          vehicle("truck", 350, 2),
          vehicle("bus", 560, 3),
          vehicle("plow", 820, 5, { height: this.game.lanes.getLaneGroup(this.game.lanes.lanes[4], 2).height - 6, y: this.game.lanes.getLaneGroup(this.game.lanes.lanes[4], 2).centerY, laneIndex: 4, laneSpan: 2 }),
          vehicle("roadblock", 1080, 4, { height: VEHICLES.roadblock.height, y: this.game.lanes.getLaneGroup(this.game.lanes.lanes[4], 4).centerY, laneIndex: 4, laneSpan: 4 })
        ],
        chickens: []
      },
      "scene-enemies": {
        hoveredLane: null,
        selectedVehicle: "bus",
        vehicleDirection: 1,
        vehicles: [vehicle("bus", 260, 6)],
        chickens: [
          chicken("runner", 780, 1, { shieldTier: 1 }),
          chicken("eggsplode", 835, 2),
          chicken("mud", 910, 2),
          chicken("doomscroller", 680, 3),
          chicken("mother", 870, 4, { hp: 2, maxHp: 2 }),
          chicken("boss", 1040, 6, { hp: 20, maxHp: 20 })
        ],
        projectiles: [egg(760, laneY(4) - 50)]
      },
      "scene-strategy": {
        hoveredLane: 5,
        selectedVehicle: "plow",
        vehicleDirection: -1,
        showAim: true,
        vehicles: [vehicle("plow", 890, 4, { direction: -1, height: this.game.lanes.getLaneGroup(this.game.lanes.lanes[4], 2).height - 6, y: this.game.lanes.getLaneGroup(this.game.lanes.lanes[4], 2).centerY, laneIndex: 4, laneSpan: 2 })],
        chickens: [
          chicken("runner", 710, 2, { shieldTier: 1 }),
          chicken("tough", 830, 4, { hp: 2, maxHp: 2 }),
          chicken("jumper", 960, 5),
          chicken("mud", 1030, 5)
        ]
      },
      "scene-gameover": {
        hoveredLane: null,
        selectedVehicle: "bus",
        vehicleDirection: 1,
        vehicles: [
          vehicle("bus", 300, 4),
          vehicle("car", 620, 2),
          vehicle("truck", 900, 5, { direction: -1 })
        ],
        chickens: [
          chicken("runner", 470, 4, { shieldTier: 1 }),
          chicken("tough", 690, 3, { hp: 2, maxHp: 2 }),
          chicken("mother", 1040, 5, { hp: 2, maxHp: 2 }),
          chicken("doomscroller", 820, 1)
        ],
        projectiles: [egg(965, laneY(5) - 52)]
      }
    };

    return scenes[sceneId] ?? scenes["scene-controls"];
  }

  drawGrass(ctx) {
    ctx.fillStyle = COLORS.grass;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    ctx.fillStyle = COLORS.grassLight;
    for (let y = 24; y < WORLD.height; y += 64) {
      for (let x = (y / 64) % 2 === 0 ? 12 : 44; x < WORLD.width; x += 92) {
        ctx.fillRect(x, y, 26, 8);
        ctx.fillRect(x + 8, y - 8, 8, 24);
      }
    }

    const props = [
      [74, 94, "#3dbf6e"],
      [122, 618, "#39d96a"],
      [1134, 91, "#3dbf6e"],
      [1190, 633, "#39d96a"],
      [1020, 68, "#b5e85a"],
      [270, 642, "#b5e85a"]
    ];
    for (const [x, y, color] of props) {
      this.drawTree(ctx, x, y, color);
    }
  }

  drawTree(ctx, x, y, color) {
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    ctx.fillRect(x - 18, y + 21, 42, 12);
    this.block(ctx, x - 6, y + 12, 12, 30, 8, "#8b6f42");
    this.block(ctx, x - 28, y - 12, 54, 34, 10, color);
    this.block(ctx, x - 14, y - 34, 38, 30, 10, "#7ae25f");
  }

  drawRoad(ctx) {
    const roadTop = WORLD.roadTop - 11;
    const roadHeight = WORLD.roadBottom - WORLD.roadTop + 22;
    const overdraw = 620;
    const roadX = -overdraw;
    const roadW = WORLD.width + overdraw * 2;

    const slant = 34;
    ctx.fillStyle = "#d9fff0";
    this.slantRect(ctx, roadX, roadTop - 18, roadW, 14, slant);
    this.slantRect(ctx, roadX, roadTop + roadHeight + 4, roadW, 14, slant);

    for (let x = roadX; x < WORLD.width + overdraw; x += 58) {
      ctx.fillStyle = Math.floor(x / 58) % 2 === 0 ? COLORS.curb : COLORS.curbStripe;
      this.slantRect(ctx, x, roadTop - 18, 58, 14, slant);
      this.slantRect(ctx, x, roadTop + roadHeight + 4, 58, 14, slant);
    }

    ctx.fillStyle = COLORS.roadDark;
    this.slantRect(ctx, roadX, roadTop, roadW, roadHeight, slant);

    for (const lane of this.game.lanes.lanes) {
      const isMud = this.game.upgrades.isMudLane(lane.index);
      ctx.fillStyle = isMud ? COLORS.mud : lane.index % 2 === 0 ? COLORS.road : COLORS.roadLight;
      this.slantRect(ctx, roadX, lane.y, roadW, lane.height, slant);

      if (isMud) {
        this.drawMudLane(ctx, lane, roadX, roadW);
      }

      if (this.game.lanes.hoveredLane === lane.index && this.game.mode === "playing") {
        ctx.fillStyle = "rgba(255, 242, 107, 0.26)";
        this.slantRect(ctx, roadX, lane.y, roadW, lane.height, slant);
      }

      if (lane.lockTimer > 0) {
        ctx.fillStyle = "rgba(233, 71, 66, 0.46)";
        this.slantRect(ctx, roadX, lane.y, roadW, lane.height, slant);
        ctx.fillStyle = "#fff8df";
        ctx.font = "900 13px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let x = roadX + 120; x < WORLD.width + overdraw; x += 280) {
          ctx.fillText(`COOLDOWN ${lane.lockTimer.toFixed(1)}s`, x, lane.centerY);
        }
      }

      ctx.fillStyle = "rgba(22, 33, 31, 0.18)";
      this.slantRect(ctx, roadX, lane.y + lane.height - 4, roadW, 4, slant);

      if (!isMud) {
        ctx.fillStyle = COLORS.laneLine;
        for (let x = roadX + 38; x < WORLD.width + overdraw; x += 112) {
          ctx.fillRect(x, lane.y + lane.height - 8, 54, 5);
        }
      }

      ctx.globalAlpha = 0.26;
      ctx.fillStyle = isMud ? "#fff7c0" : "#ffffff";
      const arrowDirection = this.game.vehicleDirection;
      const startX = arrowDirection > 0 ? roadX + 56 : WORLD.width + overdraw - 56;
      for (let x = startX; arrowDirection > 0 ? x < WORLD.width + overdraw : x > roadX; x += arrowDirection * 230) {
        this.arrow(ctx, x, lane.centerY, arrowDirection);
      }
      ctx.globalAlpha = 1;
    }

    this.drawBarbedWire(ctx, roadX, roadW);
  }

  slantRect(ctx, x, y, w, h, slant) {
    ctx.beginPath();
    ctx.moveTo(x + slant, y);
    ctx.lineTo(x + w + slant, y);
    ctx.lineTo(x + w - slant, y + h);
    ctx.lineTo(x - slant, y + h);
    ctx.closePath();
    ctx.fill();
  }

  drawBarbedWire(ctx, roadX, roadW) {
    const lane = this.game.lanes.lanes[WORLD.laneCount - 1];
    if (!lane) return;
    const stocked = this.game.upgrades.stats.barbedWire > 0;
    ctx.save();
    ctx.globalAlpha = stocked ? 1 : 0.28;
    ctx.strokeStyle = stocked ? "#17201f" : "#e94742";
    ctx.lineWidth = 3;
    const y = lane.y + 8;
    ctx.beginPath();
    ctx.moveTo(roadX, y);
    ctx.lineTo(roadX + roadW, y);
    ctx.moveTo(roadX, y + 10);
    ctx.lineTo(roadX + roadW, y + 10);
    ctx.stroke();
    ctx.fillStyle = stocked ? "#fff8df" : "#e94742";
    for (let x = roadX + 18; x < WORLD.width + 620; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, y - 5);
      ctx.lineTo(x + 11, y + 5);
      ctx.lineTo(x, y + 15);
      ctx.lineTo(x - 11, y + 5);
      ctx.closePath();
      ctx.fill();
    }
    if (stocked) {
      ctx.fillStyle = "#17201f";
      ctx.font = "900 12px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let x = roadX + 120; x < WORLD.width + 620; x += 280) {
        ctx.fillText(`WIRE ${this.game.upgrades.stats.barbedWire}/${WORLD.barbedWireHits}`, x, y + 23);
      }
    }
    ctx.restore();
  }

  drawMudLane(ctx, lane, roadX, roadW) {
    ctx.fillStyle = COLORS.mudDark;
    ctx.fillRect(roadX, lane.y + 7, roadW, 9);
    ctx.fillRect(roadX, lane.y + lane.height - 13, roadW, 7);

    for (let x = roadX + 18; x < WORLD.width + 620; x += 86) {
      ctx.fillStyle = x % 172 === 0 ? COLORS.mudLight : COLORS.mudDark;
      ctx.fillRect(x, lane.centerY - 10 + ((x / 86) % 3) * 4, 46, 12);
      ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
      ctx.fillRect(x + 6, lane.centerY - 7 + ((x / 86) % 3) * 4, 22, 3);
    }

    ctx.fillStyle = "#fff26b";
    ctx.font = "900 13px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let x = roadX + 140; x < WORLD.width + 620; x += 300) {
      ctx.fillText(`MUD ${this.game.upgrades.getMudSlowMultiplier().toFixed(2)}x`, x, lane.centerY);
    }
  }

  drawActors(ctx) {
    const actors = [
      ...this.game.chickens.items.map((item) => ({ kind: "chicken", item, y: item.y })),
      ...this.game.chickens.projectiles.map((item) => ({ kind: "egg", item, y: item.y })),
      ...this.game.vehicles.items.map((item) => ({ kind: "vehicle", item, y: item.y + 18 }))
    ];
    actors.sort((a, b) => a.y - b.y);
    for (const actor of actors) {
      if (actor.kind === "chicken") this.drawChicken(ctx, actor.item);
      if (actor.kind === "egg") this.drawEgg(ctx, actor.item);
      if (actor.kind === "vehicle") this.drawVehicle(ctx, actor.item);
    }
  }

  drawChicken(ctx, chicken) {
    const type = this.game.chickenTypes[chicken.typeId];
    if (type.id === "doomscroller") {
      this.drawDoomscroller(ctx, chicken, type);
      return;
    }
    if (type.id === "mother") {
      this.drawMotherChicken(ctx, chicken, type);
      return;
    }
    const hop = Math.abs(Math.sin(chicken.wobble * 1.7)) * 5;
    const sizeScale = chicken.radius / 15;
    const squashX = 1 + chicken.squash * 0.32;
    const squashY = 1 - chicken.squash * 0.24;
    ctx.save();
    ctx.translate(chicken.x, chicken.y - hop);
    ctx.scale(squashX * sizeScale, squashY * sizeScale);

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(-17, 18 + hop, 34, 9);
    const palette = this.getChickenPalette(type, chicken);
    this.block(ctx, -17, -14, 34, 31, 8, palette.body);
    this.block(ctx, 9, -28, 22, 21, 7, palette.head);

    if (type.explodeOnDeath) {
      ctx.fillStyle = "#fff8df";
      ctx.fillRect(-28, -22, 12, 16);
      ctx.fillStyle = "#f3c23b";
      ctx.fillRect(-24, -16, 4, 7);
      ctx.fillStyle = "#ff8b3d";
      ctx.fillRect(-30, -26, 5, 4);
      ctx.fillRect(-19, -27, 5, 4);
    }

    if (type.jumpsMud) {
      ctx.fillStyle = "#5cb9ff";
      ctx.fillRect(-22, -30, 11, 7);
      ctx.fillRect(-26, -23, 15, 5);
      ctx.fillRect(-9, 23, 4, 18);
      ctx.fillRect(10, 23, 4, 18);
    }

    if (type.ignoresMud) {
      ctx.fillStyle = "#5b5335";
      ctx.fillRect(-22, -3, 10, 9);
      ctx.fillRect(2, 5, 11, 8);
      ctx.fillRect(15, -26, 7, 6);
    }

    if (type.oneTapImmune) {
      ctx.fillStyle = "#fff26b";
      ctx.fillRect(-7, -45, 8, 10);
      ctx.fillRect(3, -50, 8, 15);
      ctx.fillRect(13, -45, 8, 10);
      ctx.fillStyle = "#17201f";
      ctx.fillRect(-9, -36, 34, 5);
    }

    ctx.fillStyle = palette.accent;
    ctx.fillRect(14, -38, 9, 8);
    ctx.fillRect(22, -35, 7, 7);

    ctx.fillStyle = "#ffb13d";
    ctx.beginPath();
    ctx.moveTo(31, -20);
    ctx.lineTo(43, -15);
    ctx.lineTo(31, -10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#17201f";
    ctx.fillRect(22, -21, 4, 4);

    ctx.fillStyle = "#ffd45f";
    ctx.fillRect(-10, 18, 5, 12);
    ctx.fillRect(7, 18, 5, 12);
    ctx.fillRect(-15, 29, 12, 4);
    ctx.fillRect(3, 29, 12, 4);

    if (chicken.maxHp > 1 && chicken.hp > 0) {
      ctx.fillStyle = "#17201f";
      ctx.fillRect(-22, -28, 38, 6);
      ctx.fillStyle = type.oneTapImmune ? "#ffdf65" : "#39d96a";
      ctx.fillRect(-20, -26, (34 * chicken.hp) / chicken.maxHp, 2);
    }
    this.drawChickenCracks(ctx, chicken);
    this.drawFreezeOverlay(ctx, chicken);
    ctx.restore();
  }

  drawDoomscroller(ctx, chicken, type) {
    const step = Math.abs(Math.sin(chicken.wobble * 1.8)) * 3;
    ctx.save();
    ctx.translate(chicken.x, chicken.y - step * 0.25);
    ctx.scale(1 + chicken.squash * 0.18, 1 - chicken.squash * 0.14);

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(-14, 24, 30, 8);

    ctx.fillStyle = "#5f3e2c";
    ctx.fillRect(-8, -30, 16, 8);
    const frozen = chicken.freezeTimer > 0;
    this.block(ctx, -6, -26, 12, 12, 5, frozen ? "#dff7ff" : type.color);
    this.block(ctx, -9, -12, 18, 27, 6, frozen ? "#f3fdff" : "#f7f5ff");

    ctx.fillStyle = type.accent;
    ctx.fillRect(-11, -8, 4, 18);
    ctx.fillRect(7, -8, 4, 18);

    ctx.fillStyle = "#44608b";
    ctx.fillRect(-9, 15, 7, 12);
    ctx.fillRect(2, 15, 7, 12);

    ctx.fillStyle = "#17201f";
    ctx.fillRect(-7, 27, 4, 10);
    ctx.fillRect(3, 27, 4, 10);

    this.block(ctx, 11, -4, 10, 16, 4, "#101820");
    ctx.fillStyle = "#39d9cc";
    ctx.fillRect(13, -1, 5, 9);
    ctx.fillStyle = "#ff4f8a";
    ctx.fillRect(18, -1, 1.5, 9);
    this.drawFreezeOverlay(ctx, chicken, 0.72);
    ctx.restore();
  }

  drawMotherChicken(ctx, chicken, type) {
    const hop = Math.abs(Math.sin(chicken.wobble * 1.5)) * 3;
    const sizeScale = chicken.radius / 16;
    ctx.save();
    ctx.translate(chicken.x, chicken.y - hop);
    ctx.scale(sizeScale, sizeScale);
    const palette = this.getChickenPalette(type, chicken);

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(-19, 19 + hop, 38, 8);
    this.block(ctx, -18, -10, 36, 28, 8, palette.body);
    this.block(ctx, 8, -23, 18, 17, 6, palette.head);
    ctx.fillStyle = "#7c5837";
    ctx.fillRect(-23, -6, 8, 9);
    ctx.fillRect(-27, 1, 10, 7);
    ctx.fillRect(-12, -28, 8, 8);
    ctx.fillStyle = "#ffb13d";
    ctx.beginPath();
    ctx.moveTo(26, -14);
    ctx.lineTo(38, -10);
    ctx.lineTo(26, -6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#17201f";
    ctx.fillRect(18, -14, 4, 4);
    ctx.fillStyle = "#ffd45f";
    ctx.fillRect(-8, 18, 5, 10);
    ctx.fillRect(6, 18, 5, 10);
    if (chicken.eggCooldown < 1.2) {
      ctx.fillStyle = "#fff8df";
      ctx.fillRect(24, 0, 14, 18);
      ctx.fillStyle = "#f3c23b";
      ctx.fillRect(28, 5, 6, 8);
    }
    this.drawChickenCracks(ctx, chicken, 0.9);
    this.drawFreezeOverlay(ctx, chicken, 0.9);
    ctx.restore();
  }

  drawEgg(ctx, projectile) {
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(projectile.life * 2.2);
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    ctx.fillRect(-18, 18, 36, 10);
    ctx.fillStyle = "#fffef7";
    ctx.fillRect(-14, -20, 28, 40);
    ctx.fillStyle = "#f3c23b";
    ctx.fillRect(-6, -8, 12, 16);
    ctx.fillStyle = "#fff1b8";
    ctx.fillRect(-3, -14, 6, 8);
    ctx.restore();
  }

  drawVehicle(ctx, vehicle) {
    const config = VEHICLES[vehicle.type];
    const w = vehicle.length;
    const h = vehicle.height;
    const dir = vehicle.direction;
    const bounce = Math.sin(vehicle.bob) * 1.5;

    ctx.save();
    ctx.translate(vehicle.x, vehicle.y + bounce);
    if (vehicle.type === "roadblock") {
      ctx.rotate((Math.PI / 2) * dir);
    } else {
      ctx.scale(dir, 1);
    }
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(-w * 0.48, h * 0.34, w * 0.96, 12);
    this.drawToyVehicle(ctx, vehicle, config, w, h);
    ctx.restore();
  }

  drawToyVehicle(ctx, vehicle, config, w, h) {
    if (vehicle.type === "roadblock") {
      this.drawEagleVehicle(ctx, config, w, h);
      return;
    }
    const bodyH = h * 0.62;
    const bodyY = -bodyH * 0.5;
    const depth = Math.min(18, h * 0.28);
    this.isoBox(ctx, -w * 0.5, bodyY, w, bodyH, depth, config.color);

    const cabinW = vehicle.type === "bus" ? w * 0.72 : vehicle.type === "truck" ? w * 0.32 : w * 0.42;
    const cabinX = vehicle.type === "truck" ? w * 0.08 : -cabinW * 0.35;
    const cabinH = h * 0.38;
    this.isoBox(ctx, cabinX, bodyY - cabinH * 0.72, cabinW, cabinH, depth * 0.72, "#f3fbff");

    ctx.fillStyle = config.accent;
    if (vehicle.type === "bus") {
      for (let i = 0; i < 5; i += 1) ctx.fillRect(-w * 0.34 + i * w * 0.14, bodyY + 7, w * 0.08, bodyH * 0.28);
    } else if (vehicle.type === "plow") {
      this.isoBox(ctx, w * 0.28, bodyY - 4, w * 0.2, bodyH + 8, depth * 0.6, "#5cb9ff");
    }
    const wheelY = bodyY + bodyH + depth * 0.22;
    this.wheel(ctx, -w * 0.34, wheelY, h);
    this.wheel(ctx, w * 0.25, wheelY, h);
  }

  drawEagleVehicle(ctx, config, w, h) {
    this.isoBox(ctx, -w * 0.09, -h * 0.18, w * 0.18, h * 0.44, 10, config.color);
    this.isoBox(ctx, -w * 0.52, -h * 0.08, w * 0.42, h * 0.13, 8, this.shade(config.color, -4));
    this.isoBox(ctx, w * 0.1, -h * 0.08, w * 0.42, h * 0.13, 8, this.shade(config.color, -4));
    this.isoBox(ctx, -w * 0.08, -h * 0.36, w * 0.16, h * 0.18, 8, config.accent);
    this.isoBox(ctx, -w * 0.07, h * 0.18, w * 0.14, h * 0.2, 8, config.accent);
    ctx.fillStyle = "#f1c450";
    ctx.fillRect(-w * 0.03, h * 0.35, w * 0.06, h * 0.14);
    ctx.fillRect(w * 0.02, -h * 0.38, w * 0.05, h * 0.09);
    ctx.fillStyle = "#17201f";
    ctx.fillRect(w * 0.01, -h * 0.27, w * 0.03, h * 0.05);
  }

  wheel(ctx, x, y, h) {
    const size = Math.max(8, Math.min(18, h * 0.28));
    ctx.fillStyle = "#17201f";
    ctx.fillRect(x, y, size * 1.35, size);
    ctx.fillStyle = "#d9fff0";
    ctx.fillRect(x + size * 0.35, y + size * 0.3, size * 0.45, size * 0.35);
  }

  isoBox(ctx, x, y, w, h, depth, color) {
    ctx.fillStyle = this.shade(color, -46);
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w + depth, y + h + depth);
    ctx.lineTo(x + depth, y + h + depth);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.shade(color, -28);
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w + depth, y + depth);
    ctx.lineTo(x + w + depth, y + h + depth);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.24)";
    ctx.fillRect(x + 5, y + 5, Math.max(0, w - 10), 5);
  }

  drawEffects(ctx) {
    for (const burst of this.game.effects.laneBursts) {
      const alpha = Math.max(0, burst.life / 0.22);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#fff26b";
      const x = burst.direction > 0 ? 22 : WORLD.width - 92;
      this.arrow(ctx, x, burst.y, burst.direction, 42);
      ctx.restore();
    }

    for (const decal of this.game.effects.decals) {
      ctx.save();
      ctx.translate(decal.x, decal.y);
      ctx.rotate(decal.spin);
      ctx.globalAlpha = Math.min(0.9, decal.life / 1.4);
      if (decal.type === "phone") {
        ctx.fillStyle = decal.color;
        ctx.fillRect(-decal.size * 0.42, -decal.size * 0.72, decal.size * 0.84, decal.size * 1.44);
        ctx.fillStyle = decal.accent;
        ctx.fillRect(-decal.size * 0.22, -decal.size * 0.38, decal.size * 0.44, decal.size * 0.72);
        ctx.fillStyle = "#ff4f8a";
        ctx.fillRect(-decal.size * 0.08, -decal.size * 0.3, decal.size * 0.16, decal.size * 0.12);
      } else if (decal.type === "crackedEgg") {
        this.drawCrackedEggDecal(ctx, decal);
      } else if (decal.type === "yolk") {
        ctx.fillStyle = decal.accent;
        ctx.fillRect(-decal.size * 0.82, -decal.size * 0.22, decal.size * 1.64, decal.size * 0.44);
        ctx.fillStyle = decal.color;
        ctx.fillRect(-decal.size * 0.28, -decal.size * 0.28, decal.size * 0.56, decal.size * 0.56);
      } else if (decal.type === "shell") {
        ctx.fillStyle = decal.color;
        ctx.fillRect(-decal.size * 0.6, -decal.size * 0.2, decal.size * 0.44, decal.size * 0.26);
        ctx.fillRect(decal.size * 0.12, -decal.size * 0.12, decal.size * 0.42, decal.size * 0.22);
        ctx.fillStyle = decal.accent;
        ctx.fillRect(-decal.size * 0.1, decal.size * 0.04, decal.size * 0.18, decal.size * 0.12);
      } else if (decal.type === "mud") {
        ctx.fillStyle = decal.color;
        ctx.fillRect(-decal.size * 0.7, -decal.size * 0.24, decal.size * 1.4, decal.size * 0.48);
        ctx.fillStyle = decal.accent;
        ctx.fillRect(-decal.size * 0.16, -decal.size * 0.38, decal.size * 0.32, decal.size * 0.18);
      } else if (decal.type === "feather") {
        ctx.fillStyle = decal.color;
        ctx.fillRect(-decal.size * 0.1, -decal.size * 0.62, decal.size * 0.2, decal.size * 1.24);
        ctx.fillRect(-decal.size * 0.44, -decal.size * 0.16, decal.size * 0.88, decal.size * 0.18);
      } else {
        ctx.fillStyle = decal.color;
        ctx.fillRect(-decal.size * 0.8, -decal.size * 0.26, decal.size * 1.6, decal.size * 0.52);
        ctx.fillStyle = decal.accent;
        ctx.fillRect(-decal.size * 0.18, -decal.size * 0.14, decal.size * 0.36, decal.size * 0.28);
      }
      ctx.restore();
    }

    for (const particle of this.game.effects.particles) {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.spin);
      ctx.globalAlpha = Math.max(0, particle.life / 0.75);
      if (particle.shape === "phone") {
        ctx.fillStyle = "#101820";
        ctx.fillRect(-particle.size * 0.4, -particle.size * 0.65, particle.size * 0.8, particle.size * 1.3);
        ctx.fillStyle = "#39d9cc";
        ctx.fillRect(-particle.size * 0.24, -particle.size * 0.42, particle.size * 0.2, particle.size * 0.72);
        ctx.fillStyle = "#ff4f8a";
        ctx.fillRect(0, -particle.size * 0.42, particle.size * 0.2, particle.size * 0.72);
      } else if (particle.shape === "yolk") {
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size * 0.7, -particle.size * 0.35, particle.size * 1.4, particle.size * 0.7);
      } else if (particle.shape === "shell") {
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size * 0.5, -particle.size * 0.55, particle.size, particle.size * 0.45);
      } else if (particle.shape === "shard") {
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size * 0.45, -particle.size * 0.2, particle.size * 0.9, particle.size * 0.4);
      } else if (particle.shape === "crack") {
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = Math.max(2, particle.size * 0.16);
        ctx.beginPath();
        ctx.moveTo(-particle.size * 0.35, -particle.size * 0.4);
        ctx.lineTo(0, -particle.size * 0.08);
        ctx.lineTo(-particle.size * 0.12, particle.size * 0.1);
        ctx.lineTo(particle.size * 0.3, particle.size * 0.42);
        ctx.stroke();
      } else {
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size * 0.5, -particle.size * 0.25, particle.size, particle.size * 0.5);
      }
      ctx.restore();
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const popup of this.game.effects.popups) {
      ctx.save();
      ctx.translate(popup.x, popup.y);
      ctx.scale(popup.scale, popup.scale);
      ctx.globalAlpha = Math.min(1, popup.life / 0.18);
      ctx.font = "900 24px Inter, system-ui, sans-serif";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#17201f";
      ctx.strokeText(popup.text, 0, 0);
      ctx.fillStyle = popup.color;
      ctx.fillText(popup.text, 0, 0);
      ctx.restore();
    }
  }

  drawCrackedEggDecal(ctx, decal) {
    const sprite = this.assets.crackedEgg;
    const width = decal.size * 4.4;
    const height = decal.size * 2.42;
    if (sprite.complete && sprite.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, -width * 0.5, -height * 0.58, width, height);
      return;
    }

    ctx.fillStyle = "#fffdf0";
    ctx.fillRect(-decal.size * 0.78, -decal.size * 0.28, decal.size * 1.56, decal.size * 0.56);
    ctx.fillStyle = "#ffd93b";
    ctx.fillRect(-decal.size * 0.24, -decal.size * 0.16, decal.size * 0.48, decal.size * 0.36);
  }

  drawWaveOverlay(ctx) {
    const warning = this.game.spawner.getWarningState(this.game.runTime);
    if (!warning) return;

    const roadTop = WORLD.roadTop - 20;
    const roadHeight = WORLD.roadBottom - WORLD.roadTop + 40;
    const stripeWidth = 96;
    const alpha =
      warning.mode === "active"
        ? 0.24
        : 0.08 + (warning.progress ?? 0) * 0.12 + Math.sin(performance.now() * 0.015) * 0.02;
    const baseColor = warning.mode === "active" ? "#ff7a38" : "#e94742";

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, roadTop, WORLD.width, roadHeight);

    ctx.globalAlpha = alpha * 0.85;
    for (let x = -120; x < WORLD.width + 180; x += stripeWidth) {
      ctx.save();
      ctx.translate(x + (warning.mode === "active" ? performance.now() * 0.03 : 0), roadTop);
      ctx.rotate(-0.45);
      ctx.fillStyle = "#fff26b";
      ctx.fillRect(0, 0, 30, roadHeight * 1.8);
      ctx.restore();
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = "#17201f";
    ctx.fillRect(WORLD.width * 0.5 - 212, roadTop + 14, 424, 76);
    ctx.strokeStyle = "#fff26b";
    ctx.lineWidth = 4;
    ctx.strokeRect(WORLD.width * 0.5 - 212, roadTop + 14, 424, 76);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff8df";
    ctx.font = "900 28px Inter, system-ui, sans-serif";
    ctx.fillText(
      warning.mode === "active" ? `${warning.label.toUpperCase()}  ${warning.seconds}s` : `${(warning.text ?? `${warning.label} incoming`).toUpperCase()}  ${warning.seconds}`,
      WORLD.width * 0.5,
      roadTop + 44
    );
    ctx.font = "900 18px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#fff26b";
    ctx.fillText(
      warning.mode === "active" ? warning.text ?? "Mud closed. Blitz in progress." : "Light red flash. Mud is about to close.",
      WORLD.width * 0.5,
      roadTop + 72
    );
    ctx.restore();
  }

  drawBreakBanner(ctx) {
    const breakInfo = this.game.getBreakInfo();
    if (!breakInfo.active) return;
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#fff26b";
    ctx.fillRect(0, WORLD.roadTop - 18, WORLD.width, WORLD.roadBottom - WORLD.roadTop + 36);
    ctx.restore();
  }

  drawAimHint(ctx) {
    const lane = this.game.lanes.hoveredLane === null ? null : this.game.lanes.lanes[this.game.lanes.hoveredLane];
    if (!lane) return;
    const vehicle = VEHICLES[this.game.selectedVehicle];
    const placement = (vehicle.laneSpan ?? 1) > 1 ? this.game.lanes.getLaneGroup(lane, vehicle.laneSpan) : lane;
    if (!placement) return;
    ctx.save();
    ctx.globalAlpha = 0.74;
    ctx.fillStyle = this.game.lanes.isPlacementLocked(placement) ? "#e94742" : vehicle.color;
    const x = placement.direction > 0 ? 22 : WORLD.width - 22;
    const height = (vehicle.laneSpan ?? 1) > 1 ? placement.height - 10 : 28;
    ctx.fillRect(x - 18, placement.centerY - height * 0.5, 36, height);
    ctx.restore();
  }

  arrow(ctx, x, y, direction, size = 28) {
    ctx.beginPath();
    ctx.moveTo(x + direction * size, y);
    ctx.lineTo(x, y - size * 0.5);
    ctx.lineTo(x, y - size * 0.2);
    ctx.lineTo(x - direction * size * 0.65, y - size * 0.2);
    ctx.lineTo(x - direction * size * 0.65, y + size * 0.2);
    ctx.lineTo(x, y + size * 0.2);
    ctx.lineTo(x, y + size * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  block(ctx, x, y, w, h, depth, color) {
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(x + depth * 0.65, y + depth * 0.85, w, h);

    ctx.fillStyle = this.shade(color, -26);
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w + depth, y + depth);
    ctx.lineTo(x + w + depth, y + h + depth);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.shade(color, -42);
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w + depth, y + h + depth);
    ctx.lineTo(x + depth, y + h + depth);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(x + 4, y + 4, Math.max(0, w - 8), 5);
  }

  shade(hex, amount) {
    const value = hex.replace("#", "");
    const n = parseInt(value, 16);
    const r = Math.max(0, Math.min(255, (n >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
    const b = Math.max(0, Math.min(255, (n & 255) + amount));
    return `rgb(${r}, ${g}, ${b})`;
  }

  getChickenPalette(type, chicken) {
    if (chicken.freezeTimer > 0) {
      return { body: "#dff7ff", head: "#f3fdff", accent: "#5cb9ff" };
    }
    if (type.rainbow) {
      const phase = chicken.wobble * 0.9;
      const rainbow = [
        { body: "#ff637d", head: "#ffb3c1", accent: "#7f1d1d" },
        { body: "#ffb347", head: "#ffe0a3", accent: "#92400e" },
        { body: "#fff26b", head: "#fff9b3", accent: "#8a6d1d" },
        { body: "#39d96a", head: "#9df0b5", accent: "#166534" },
        { body: "#4fb8ff", head: "#b8e3ff", accent: "#1d4ed8" },
        { body: "#a66cff", head: "#ddc2ff", accent: "#6d28d9" }
      ];
      return rainbow[Math.floor((phase % (Math.PI * 2)) / ((Math.PI * 2) / rainbow.length))] ?? rainbow[0];
    }
    if (!chicken.shieldTier) {
      return { body: type.color, head: type.color, accent: type.accent };
    }
    const tiers = [
      { body: "#39d96a", head: "#7ef1a2", accent: "#166534" },
      { body: "#4fb8ff", head: "#9ddcff", accent: "#1d4ed8" },
      { body: "#a66cff", head: "#d5b5ff", accent: "#6d28d9" },
      { body: "#e94742", head: "#ff9a96", accent: "#7f1d1d" }
    ];
    return tiers[chicken.shieldTier - 1] ?? { body: type.color, head: type.color, accent: type.accent };
  }

  drawFreezeOverlay(ctx, chicken, scale = 1) {
    if (!chicken.freezeTimer || chicken.freezeTimer <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(0.72, 0.22 + chicken.freezeTimer / 6);
    ctx.strokeStyle = "#f3fdff";
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(-23 * scale, -33 * scale, 57 * scale, 55 * scale);
    ctx.fillStyle = "rgba(243, 253, 255, 0.55)";
    ctx.fillRect(-18 * scale, -28 * scale, 10 * scale, 5 * scale);
    ctx.fillRect(6 * scale, -32 * scale, 14 * scale, 5 * scale);
    ctx.fillRect(-3 * scale, 12 * scale, 20 * scale, 4 * scale);
    ctx.restore();
  }

  drawChickenCracks(ctx, chicken, scale = 1) {
    if (!chicken.crackTimer || chicken.crackTimer <= 0) return;
    const alpha = Math.min(1, chicken.crackTimer / 0.4);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#fff8df";
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    ctx.moveTo(-6 * scale, -20 * scale);
    ctx.lineTo(1 * scale, -8 * scale);
    ctx.lineTo(-3 * scale, 0);
    ctx.moveTo(4 * scale, -16 * scale);
    ctx.lineTo(10 * scale, -6 * scale);
    ctx.lineTo(6 * scale, 6 * scale);
    ctx.stroke();
    ctx.restore();
  }
}
