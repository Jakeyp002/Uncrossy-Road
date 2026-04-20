import { CHICKENS, WORLD } from "./config.js";
import { AudioSystem } from "./systems/AudioSystem.js";
import { ChickenSystem } from "./systems/ChickenSystem.js";
import { Economy } from "./systems/Economy.js";
import { Effects } from "./systems/Effects.js";
import { Input } from "./systems/Input.js";
import { LaneManager } from "./systems/LaneManager.js";
import { Renderer } from "./systems/Renderer.js";
import { Spawner } from "./systems/Spawner.js";
import { UI } from "./systems/UI.js";
import { UpgradeSystem } from "./systems/UpgradeSystem.js";
import { VehicleSystem } from "./systems/VehicleSystem.js";

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.world = WORLD;
    this.chickenTypes = CHICKENS;
    this.mode = "menu";
    this.runTime = 0;
    this.breakRemaining = 0;
    this.nextBreakAt = WORLD.playSecondsBeforeBreak;
    this.lastTime = performance.now();
    this.selectedVehicle = "car";
    this.selectedLaneIndex = 0;
    this.vehicleDirection = 1;

    this.audio = new AudioSystem();
    this.effects = new Effects();
    this.economy = new Economy();
    this.upgrades = new UpgradeSystem(this.economy, this.effects, this.audio);
    this.lanes = new LaneManager();
    this.chickens = new ChickenSystem(this.economy, this.effects, this.audio, this.upgrades);
    this.vehicles = new VehicleSystem(this.economy, this.effects, this.audio, this.upgrades, this.lanes);
    this.spawner = new Spawner();

    this.renderer = new Renderer(canvas, this);
    this.ui = new UI(this);
    this.input = new Input(canvas, this);
  }

  start() {
    this.ui.showStart();
    requestAnimationFrame((time) => this.frame(time));
  }

  startRun() {
    this.mode = "playing";
    this.runTime = 0;
    this.breakRemaining = 0;
    this.nextBreakAt = WORLD.playSecondsBeforeBreak;
    this.selectedVehicle = "car";
    this.effects.reset();
    this.economy.reset();
    this.upgrades.reset();
    this.lanes.reset();
    this.chickens.reset();
    this.vehicles.reset();
    this.spawner.reset();
    this.ui.hideOverlay();
    this.audio.start();
  }

  frame(time) {
    const dt = Math.min(0.05, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;
    this.update(dt);
    this.renderer.render();
    this.ui.update();
    requestAnimationFrame((next) => this.frame(next));
  }

  update(dt) {
    this.effects.update(dt);
    if (this.mode !== "playing") return;

    if (this.isBreakActive()) {
      this.breakRemaining = Math.max(0, this.breakRemaining - dt);
      return;
    }

    this.runTime += dt;
    if (this.runTime >= this.nextBreakAt) {
      this.startShopBreak();
      return;
    }

    this.economy.update(dt);
    this.lanes.update(dt);

    // System order keeps the loop readable: spawn, move traffic, resolve chickens, then check fail state.
    this.spawner.update(dt, this.runTime, this.chickens);
    this.vehicles.update(dt, this.chickens);
    this.upgrades.update(dt, this.chickens);
    this.chickens.update(dt, this.spawner.getDifficulty(this.runTime));

    if (this.chickens.escaped >= this.getEscapeLimit()) {
      this.endRun();
      return;
    }

  }

  selectVehicle(type) {
    this.selectedVehicle = type;
  }

  selectLaneOffset(offset) {
    const laneCount = this.lanes.lanes.length;
    this.selectedLaneIndex = (this.selectedLaneIndex + offset + laneCount) % laneCount;
    this.lanes.hoveredLane = this.selectedLaneIndex;
  }

  setVehicleDirection(direction) {
    this.vehicleDirection = direction;
  }

  deploySelected(lane) {
    if (this.mode !== "playing" || this.isBreakActive()) return;
    this.vehicles.deploy(this.selectedVehicle, lane, this.vehicleDirection);
  }

  deployKeyboardLane() {
    const lane = this.lanes.lanes[this.selectedLaneIndex];
    if (lane) this.deploySelected(lane);
  }

  buyUpgrade(upgrade) {
    if (this.mode !== "playing") return;
    this.upgrades.buy(upgrade, this.chickens);
  }

  endRun() {
    this.mode = "gameover";
    this.audio.gameOver();
    this.effects.shake(18);
    this.economy.cash = 0;
    this.upgrades.reset();
    this.ui.showGameOver();
  }

  getBreakInfo() {
    if (this.mode !== "playing") {
      return { active: false, remaining: 0 };
    }
    return {
      active: this.breakRemaining > 0,
      remaining: this.breakRemaining > 0 ? Math.ceil(this.breakRemaining) : Math.ceil(this.nextBreakAt - this.runTime)
    };
  }

  isBreakActive() {
    return this.getBreakInfo().active;
  }

  getEscapeLimit() {
    return this.upgrades.getEscapeLimit();
  }

  getUnlockedChickenInfo() {
    return [...this.chickens.seenTypes].map((typeId) => CHICKENS[typeId]).filter(Boolean);
  }

  recoverEscapes() {
    const previousEscapes = this.chickens.escaped;
    this.chickens.escaped = Math.max(0, this.chickens.escaped - WORLD.breakEscapeRecoveryTarget);
    const recovered = previousEscapes - this.chickens.escaped;
    if (recovered > 0) {
      this.effects.flashText(`Escapes +${recovered}`, WORLD.width * 0.5, 190, "#39d9cc");
    }
  }

  startShopBreak() {
    this.breakRemaining = WORLD.breakSeconds;
    this.nextBreakAt += WORLD.playSecondsBeforeBreak;
    const interest = this.economy.applyInterest(this.upgrades.stats.interestMultiplier, this.upgrades.stats.breakGrant);
    this.recoverEscapes();
    this.effects.flashText("Shop break!", WORLD.width * 0.5, 110, "#fff26b");
    if (interest > 0) {
      this.effects.flashText(`Interest +$${interest}`, WORLD.width * 0.5, 150, "#32ca63");
    }
    this.audio.buy();
  }
}
