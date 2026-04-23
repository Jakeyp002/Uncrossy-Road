import { UPGRADES, VEHICLES, WORLD } from "../config.js";

export class UpgradeSystem {
  constructor(economy, effects, audio) {
    this.economy = economy;
    this.effects = effects;
    this.audio = audio;
    this.reset();
  }

  reset() {
    this.mudClosed = false;
    this.levels = Object.fromEntries(UPGRADES.map((upgrade) => [upgrade.id, 0]));
    this.stats = {
      carCostMultiplier: 1,
      truckDamageBonus: 0,
      busLengthMultiplier: 1,
      plowCooldownMultiplier: 1,
      mudSlowMultiplier: WORLD.mudSlowMultiplier,
      extraMudLanes: 0,
      escapeBonus: 0,
      bonusCash: 0,
      interestMultiplier: 1,
      breakGrant: 0,
      barbedWire: WORLD.barbedWireHits,
      unlockedVehicles: {
        car: true,
        truck: false,
        bus: false,
        plow: false,
        roadblock: false
      },
      evolvedVehicles: {
        truck: false,
        bus: false,
        plow: false,
        roadblock: false
      }
    };
  }

  update() {}

  getVehicleCost(type) {
    const base = VEHICLES[type].cost;
    if (type === "car") {
      return Math.max(3, Math.round(base * this.stats.carCostMultiplier));
    }
    return base;
  }

  getVehicleCooldown(type) {
    const base = VEHICLES[type].cooldown;
    if (type === "plow") {
      return base * this.stats.plowCooldownMultiplier;
    }
    return base;
  }

  getVehicleDamage(type) {
    const damage = VEHICLES[type].damage + (type === "truck" ? this.stats.truckDamageBonus : 0);
    if (type === "truck" && this.isVehicleEvolved("truck")) {
      return Math.max(3, damage);
    }
    return damage;
  }

  getVehicleLength(type) {
    const base = VEHICLES[type].length;
    if (type === "bus") {
      return base * this.stats.busLengthMultiplier;
    }
    return base;
  }

  getVehicleHeight(type) {
    return VEHICLES[type].height;
  }

  getMudSlowMultiplier() {
    return this.stats.mudSlowMultiplier;
  }

  getEscapeLimit() {
    return WORLD.escapeLimit + this.stats.escapeBonus;
  }

  setMudClosed(closed) {
    this.mudClosed = closed;
  }

  isMudLane(index) {
    if (this.mudClosed) return false;
    if (WORLD.mudLaneIndices.includes(index)) return true;
    return WORLD.extraMudLaneIndices.slice(0, this.stats.extraMudLanes).includes(index);
  }

  getUpgradeCost(upgrade) {
    const level = this.levels[upgrade.id];
    if (upgrade.category === "Evolution") return upgrade.baseCost;
    const multiplier = upgrade.category === "Economy" ? 2 : 1.5;
    return Math.round(upgrade.baseCost * Math.pow(multiplier, level + 1));
  }

  isVehicleUnlocked(type) {
    return Boolean(this.stats.unlockedVehicles[type]);
  }

  isVehicleEvolved(type) {
    return Boolean(this.stats.evolvedVehicles[type]);
  }

  canBuy(upgrade) {
    if (upgrade.id === "restockWire" && this.stats.barbedWire > 0) return false;
    if (upgrade.requiresVehicle && !this.isVehicleUnlocked(upgrade.requiresVehicle)) return false;
    return this.levels[upgrade.id] < upgrade.maxLevel && this.economy.canAfford(this.getUpgradeCost(upgrade));
  }

  buy(upgrade, chickens) {
    if (!this.canBuy(upgrade)) {
      this.audio.denied();
      this.effects.flashText("Need cash", 640, 92, "#e94742");
      return false;
    }

    const cost = this.getUpgradeCost(upgrade);
    this.economy.spend(cost);
    this.levels[upgrade.id] += 1;
    this.audio.buy();
    this.effects.flashText(upgrade.title, 640, 92, "#32ca63");

    if (upgrade.id === "cheapCars") this.stats.carCostMultiplier *= 0.7;
    if (upgrade.id === "truckCooldown") this.stats.truckDamageBonus += 1;
    if (upgrade.id === "longBus") this.stats.busLengthMultiplier *= 1.32;
    if (upgrade.id === "bonusCash") this.stats.bonusCash += 1;
    if (upgrade.id === "interestBoost") this.stats.interestMultiplier += 0.25;
    if (upgrade.id === "comboLedger") this.economy.comboBonusExtra += 1;
    if (upgrade.id === "breakGrant") this.stats.breakGrant += 8;
    if (upgrade.id === "mudDepth") this.stats.mudSlowMultiplier = Math.max(0.1, this.stats.mudSlowMultiplier - 0.05);
    if (upgrade.id === "extraMud") this.stats.extraMudLanes += 1;
    if (upgrade.id === "safeCurbs") this.stats.escapeBonus += 2;
    if (upgrade.id === "restockWire") this.stats.barbedWire = WORLD.barbedWireHits;
    if (upgrade.id === "plowTune") this.stats.plowCooldownMultiplier *= 0.65;
    if (upgrade.unlocksVehicle) this.stats.unlockedVehicles[upgrade.unlocksVehicle] = true;
    if (upgrade.id === "truckEvo") this.stats.evolvedVehicles.truck = true;
    if (upgrade.id === "busEvo") this.stats.evolvedVehicles.bus = true;
    if (upgrade.id === "plowEvo") this.stats.evolvedVehicles.plow = true;
    if (upgrade.id === "roadblockEvo") this.stats.evolvedVehicles.roadblock = true;

    return true;
  }
}
