import { VEHICLES, WORLD } from "../config.js";
import { rectsOverlap } from "../utils.js";

export class VehicleSystem {
  constructor(economy, effects, audio, upgrades, lanes) {
    this.economy = economy;
    this.effects = effects;
    this.audio = audio;
    this.upgrades = upgrades;
    this.lanes = lanes;
    this.reset();
  }

  reset() {
    this.items = [];
    this.cooldowns = Object.fromEntries(Object.keys(VEHICLES).map((key) => [key, 0]));
    this.uses = Object.fromEntries(Object.keys(VEHICLES).map((key) => [key, 0]));
    this.nextId = 1;
  }

  update(dt, chickens) {
    for (const key of Object.keys(this.cooldowns)) {
      this.cooldowns[key] = Math.max(0, this.cooldowns[key] - dt);
    }

    for (const vehicle of this.items) {
      vehicle.x += vehicle.vx * dt;
      vehicle.bob += dt * 10;

      const vehicleBox = this.getBounds(vehicle);
      for (const chicken of chickens.items) {
        if (chicken.dead || vehicle.hitIds.has(chicken.id)) continue;
        if (rectsOverlap(vehicleBox, chickens.getAliveBounds(chicken))) {
          vehicle.hitIds.add(chicken.id);
          const chickenType = chickens.getType(chicken);
          const damage =
            chickenType.oneTapImmune && vehicle.damage >= chicken.maxHp
              ? Math.max(1, Math.floor(chicken.maxHp * 0.2))
              : vehicle.damage;
          chickens.hit(chicken, damage);
        }
      }
    }

    this.items = this.items.filter((vehicle) => {
      if (vehicle.direction > 0) return vehicle.x < WORLD.width + vehicle.length + 80;
      return vehicle.x > -vehicle.length - 80;
    });
  }

  canDeploy(type) {
    const config = VEHICLES[type];
    return (
      this.cooldowns[type] <= 0 &&
      (!config.maxUses || this.uses[type] < config.maxUses) &&
      this.economy.canAfford(this.upgrades.getVehicleCost(type))
    );
  }

  deploy(type, lane, directionOverride = null) {
    const config = VEHICLES[type];
    const placement = config.laneSpan === 2 ? this.lanes.getLanePair(lane) : lane;
    if (!placement) {
      this.audio.denied();
      this.effects.flashText("Needs two lanes", 640, 88, "#e94742");
      return false;
    }
    if (this.lanes.isPlacementLocked(placement)) {
      this.audio.denied();
      this.effects.flashText("Lane cooling", 640, 88, "#e94742");
      return false;
    }
    const cost = this.upgrades.getVehicleCost(type);
    if (this.cooldowns[type] > 0) {
      this.audio.denied();
      this.effects.flashText("Cooling down", 640, 88, "#e94742");
      return false;
    }
    if (config.maxUses && this.uses[type] >= config.maxUses) {
      this.audio.denied();
      this.effects.flashText("Run limit", 640, 88, "#e94742");
      return false;
    }
    if (!this.economy.spend(cost)) {
      this.audio.denied();
      this.effects.flashText("Need cash", 640, 88, "#e94742");
      return false;
    }

    const length = this.upgrades.getVehicleLength(type);
    const height = config.laneSpan === 2 ? placement.height - 6 : this.upgrades.getVehicleHeight(type);
    const direction = directionOverride ?? placement.direction;
    const x = direction > 0 ? -length - 28 : WORLD.width + length + 28;
    this.items.push({
      id: this.nextId,
      type,
      x,
      y: placement.centerY,
      vx: config.speed * direction,
      direction,
      laneIndex: placement.index,
      laneSpan: config.laneSpan ?? 1,
      length,
      height,
      damage: config.damage,
      hitIds: new Set(),
      bob: 0
    });
    this.nextId += 1;
    this.uses[type] += 1;
    this.cooldowns[type] = this.upgrades.getVehicleCooldown(type);
    this.lanes.recordDeploy(placement);
    this.effects.deploy(placement);
    this.audio.deploy(type);
    return true;
  }

  getBounds(vehicle) {
    return {
      x: vehicle.x - vehicle.length * 0.5,
      y: vehicle.y - vehicle.height * 0.5,
      w: vehicle.length,
      h: vehicle.height
    };
  }
}
