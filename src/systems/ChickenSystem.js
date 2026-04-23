import { CHICKENS, WORLD } from "../config.js";
import { rand, rectsOverlap } from "../utils.js";

export class ChickenSystem {
  constructor(economy, effects, audio, upgrades) {
    this.economy = economy;
    this.effects = effects;
    this.audio = audio;
    this.upgrades = upgrades;
    this.reset();
  }

  reset() {
    this.items = [];
    this.projectiles = [];
    this.escaped = 0;
    this.nextId = 1;
    this.seenTypes = new Set();
    this.killedTypes = [];
  }

  getSpawnModifiers(typeId, runTime) {
    return {
      shieldTier: this.rollShieldTier(typeId, runTime)
    };
  }

  rollShieldTier(typeId, runTime) {
    const type = CHICKENS[typeId];
    if (!type || typeId !== "runner") return 0;
    if (runTime < 30) return 0;

    let shieldChance = 0.08;
    let weights = [1];
    if (runTime < 60) {
      shieldChance = 0.08 + ((runTime - 30) / 30) * 0.05;
      weights = [1];
    } else if (runTime < 120) {
      shieldChance = 0.14 + ((runTime - 60) / 60) * 0.08;
      weights = [0.82, 0.18];
    } else if (runTime < 150) {
      shieldChance = 0.24 + ((runTime - 120) / 30) * 0.07;
      weights = [0.74, 0.21, 0.05];
    } else if (runTime < 180) {
      const bossRamp = (runTime - 150) / 30;
      shieldChance = 0.55 + bossRamp * 0.35;
      weights = [0.55, 0.32, 0.13];
    } else {
      const late = runTime - 180;
      shieldChance = Math.min(0.98, 0.9 + 0.08 * (1 - Math.exp(-late / 45)));
      weights = [0.42, 0.32, 0.19, 0.07];
    }
    if (Math.random() >= shieldChance) return 0;

    const rarityRoll = Math.random();
    let threshold = 0;
    for (let index = 0; index < weights.length; index += 1) {
      threshold += weights[index];
      if (rarityRoll <= threshold) return index + 1;
    }
    return weights.length;
  }

  spawn(typeId, difficulty = 0, options = {}) {
    const type = CHICKENS[typeId];
    this.seenTypes.add(typeId);
    const sidePadding = 78;
    const chicken = {
      id: this.nextId,
      typeId,
      x: options.x ?? rand(sidePadding, WORLD.width - sidePadding),
      y: options.y ?? -28,
      baseX: 0,
      vx: options.vx ?? rand(-18, 18),
      vy: options.vy ?? type.speed + difficulty * 12 + rand(-12, 18),
      radius: type.radius,
      hp: type.hp,
      maxHp: type.hp,
      reward: type.reward,
      wobble: rand(0, Math.PI * 2),
      wobbleSpeed: rand(6, 10),
      panic: rand(0.6, 1.25),
      dead: false,
      escaped: false,
      squash: 0,
      eggCooldown: type.eggCooldown ?? 0,
      shieldTier: options.shieldTier ?? 0,
      crackTimer: 0,
      freezeTimer: 0
    };
    chicken.baseX = chicken.x;
    this.nextId += 1;
    this.items.push(chicken);
    return chicken;
  }

  spawnMotherPair(difficulty = 0, runTime = 0) {
    const leader = this.spawn("tough", difficulty, this.getSpawnModifiers("tough", runTime));
    const motherSpeed = CHICKENS.mother.speed + difficulty * 10;
    this.spawn("mother", difficulty, {
      x: leader.x - 24,
      y: leader.y - 52,
      vy: motherSpeed,
      vx: leader.vx - 5,
      shieldTier: this.rollShieldTier("mother", runTime)
    });
    this.spawn("mother", difficulty, {
      x: leader.x + 24,
      y: leader.y - 98,
      vy: motherSpeed,
      vx: leader.vx + 5,
      shieldTier: this.rollShieldTier("mother", runTime)
    });
  }

  clearForBoss() {
    if (this.items.length === 0 && this.projectiles.length === 0) return;
    this.items = [];
    this.projectiles = [];
    this.effects.shake(10);
    this.effects.flashText("BOSS CLEARS ROAD", WORLD.width * 0.5, WORLD.roadTop + 28, "#ffdf65");
  }

  clearForHerald() {
    if (this.items.length === 0 && this.projectiles.length === 0) return;
    this.items = [];
    this.projectiles = [];
    this.effects.shake(8);
  }

  clearType(typeId) {
    this.items = this.items.filter((chicken) => chicken.typeId !== typeId);
  }

  update(dt, difficulty, vehicles) {
    for (const chicken of this.items) {
      if (chicken.dead) continue;
      chicken.wobble += chicken.wobbleSpeed * dt;
      chicken.squash = Math.max(0, chicken.squash - dt * 8);
      chicken.crackTimer = Math.max(0, chicken.crackTimer - dt);
      chicken.freezeTimer = Math.max(0, chicken.freezeTimer - dt);
      if (chicken.freezeTimer > 0) {
        this.checkBarbedWire(chicken);
        continue;
      }
      const zig = Math.sin(chicken.wobble) * 16 * chicken.panic;
      chicken.x += (chicken.vx + zig) * dt;
      const surfaceMultiplier = this.getSurfaceMultiplier(chicken);
      const type = CHICKENS[chicken.typeId];
      const speedMultiplier = type.speedMultiplier ?? 1;
      chicken.y += (chicken.vy + difficulty * 1.4) * speedMultiplier * surfaceMultiplier * dt;
      this.updateAttacks(chicken, dt, vehicles);
      this.checkBarbedWire(chicken);

      if (chicken.x < 36 || chicken.x > WORLD.width - 36) {
        chicken.vx *= -0.8;
        chicken.x = Math.max(36, Math.min(WORLD.width - 36, chicken.x));
      }

      if (chicken.y > WORLD.height + 42 && !chicken.escaped) {
        chicken.escaped = true;
        const type = CHICKENS[chicken.typeId];
        const escapeDamage = type.escapeDamage ?? 1;
        this.escaped += escapeDamage;
        if (type.rewardOnEscape) {
          this.economy.cash += type.rewardOnEscape;
          this.economy.totalEarned += type.rewardOnEscape;
          this.effects.flashText(`SAFE +$${type.rewardOnEscape}`, chicken.x, WORLD.height - 104, "#39d96a");
        }
        if (escapeDamage > 0) {
          this.effects.escape(chicken.x, WORLD.height - 36);
        }
        if (escapeDamage > 1) {
          this.effects.flashText(`-${escapeDamage} ESCAPES`, chicken.x, WORLD.height - 72, "#e94742");
        }
        if (escapeDamage > 0) {
          this.audio.escape();
        }
      }
    }

    for (const projectile of this.projectiles) {
      projectile.life -= dt;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.vy += 220 * dt;

      if (!vehicles) continue;
      const projectileBox = {
        x: projectile.x - projectile.radius,
        y: projectile.y - projectile.radius,
        w: projectile.radius * 2,
        h: projectile.radius * 2
      };
      for (const vehicle of vehicles.items) {
        if (vehicle.destroyed) continue;
        if (!rectsOverlap(projectileBox, vehicles.getBounds(vehicle))) continue;
        if (vehicles.handleEggHit(vehicle, projectile.x, projectile.y)) {
          projectile.life = 0;
          break;
        }
      }
    }

    this.items = this.items.filter((chicken) => !chicken.dead && !chicken.escaped);
    this.projectiles = this.projectiles.filter(
      (projectile) =>
        projectile.life > 0 &&
        projectile.y < WORLD.height + 90 &&
        projectile.x > -80 &&
        projectile.x < WORLD.width + 80
    );
  }

  updateAttacks(chicken, dt, vehicles) {
    const type = CHICKENS[chicken.typeId];
    if (type.id !== "mother" || !vehicles) return;
    chicken.eggCooldown = Math.max(0, chicken.eggCooldown - dt);
    if (chicken.eggCooldown > 0) return;

    const target = vehicles.items.find((vehicle) => !vehicle.destroyed);
    if (!target) return;
    chicken.eggCooldown = WORLD.motherEggCooldown;
    const dx = target.x - chicken.x;
    const dy = target.y - chicken.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    this.projectiles.push({
      x: chicken.x,
      y: chicken.y - 8,
      vx: (dx / distance) * 175,
      vy: 205 + Math.max(0, dy) * 0.34,
      radius: 18,
      life: 4
    });
    this.effects.flashText("MEGA EGG!", chicken.x, chicken.y - 34, "#fff8df");
  }

  hit(chicken, damage, source = "vehicle", vehicle = null, vehicles = null, options = {}) {
    if (chicken.dead) return;
    if (chicken.shieldTier > 0) {
      const crackedTier = chicken.shieldTier;
      const shieldDamage = options.pureShieldDamage ? Math.max(1, damage) : 1;
      chicken.shieldTier = Math.max(0, chicken.shieldTier - shieldDamage);
      chicken.squash = 1;
      chicken.crackTimer = 0.4;
      this.economy.cash += crackedTier;
      this.economy.totalEarned += crackedTier;
      this.effects.flashText(`+$${crackedTier}`, chicken.x, chicken.y - 48, "#32ca63");
      this.effects.shieldBreak(chicken.x, chicken.y, chicken.shieldTier);
      return;
    }
    chicken.hp -= damage;
    chicken.squash = 1;
    if (chicken.hp <= 0) {
      this.splat(chicken, 0, source, vehicle, vehicles);
    }
  }

  getType(chicken) {
    return CHICKENS[chicken.typeId];
  }

  freeze(chicken, seconds = 3) {
    if (!chicken || chicken.dead || chicken.escaped) return;
    chicken.freezeTimer = Math.max(chicken.freezeTimer ?? 0, seconds);
    chicken.squash = 0.8;
    this.effects.flashText("FROZEN", chicken.x, chicken.y - 42, "#dff7ff");
  }

  carryOff(chicken) {
    if (!chicken || chicken.dead || chicken.escaped) return;
    chicken.dead = true;
    this.killedTypes.push(chicken.typeId);
    const payout = this.economy.earnSplat(chicken.reward, this.upgrades.stats.bonusCash);
    this.effects.flashText("SNATCHED!", chicken.x, chicken.y - 46, "#fff26b");
    this.effects.splat(chicken.x, chicken.y, payout.amount, payout.combo, chicken.typeId);
    this.audio.splat(payout.combo);
  }

  splat(chicken, extraDamage = 0, source = "vehicle", vehicle = null, vehicles = null) {
    if (chicken.dead) return;
    const type = CHICKENS[chicken.typeId];
    if (type.penaltyOnHit && source === "vehicle") {
      chicken.dead = true;
      const loss = this.economy.penalize(type.penaltyOnHit);
      this.effects.doomscrollCrash(chicken.x, chicken.y, loss || type.penaltyOnHit);
      this.audio.denied();
      return;
    }
    if (type.oneTapImmune && source !== "vehicle") {
      chicken.hp = Math.max(1, chicken.hp - Math.min(3, Math.max(1, extraDamage)));
      chicken.squash = 1;
      this.effects.flashText("BOSS RESISTS", chicken.x, chicken.y - 42, "#ffdf65");
      return;
    }
    chicken.hp -= extraDamage;
    chicken.dead = true;
    this.killedTypes.push(type.id);
    if (type.explodeOnDeath && source === "vehicle") {
      if (vehicle && vehicles) {
        vehicles.destroyVehicle(vehicle, chicken.x, chicken.y, "explode");
      }
      this.economy.combo = 0;
      this.economy.comboTimer = 0;
      this.effects.flashText("CHAIN BROKEN", chicken.x, chicken.y - 52, "#ff8b3d");
      this.effects.bombBurst(chicken.x, chicken.y);
    }
    const reward = source === "roadblock" ? Math.max(6, Math.round(chicken.reward * 0.65)) : chicken.reward;
    const payout = this.economy.earnSplat(reward, this.upgrades.stats.bonusCash);
    this.effects.splat(chicken.x, chicken.y, payout.amount, payout.combo, chicken.typeId);
    this.audio.splat(payout.combo);
  }

  getAliveBounds(chicken) {
    return {
      x: chicken.x - chicken.radius,
      y: chicken.y - chicken.radius,
      w: chicken.radius * 2,
      h: chicken.radius * 2
    };
  }

  hasBossActive() {
    return this.items.some((chicken) => chicken.typeId === "boss" && !chicken.dead && !chicken.escaped);
  }

  hasTypeActive(typeId) {
    return this.items.some((chicken) => chicken.typeId === typeId && !chicken.dead && !chicken.escaped);
  }

  consumeKilledType(typeId) {
    const index = this.killedTypes.indexOf(typeId);
    if (index === -1) return false;
    this.killedTypes.splice(index, 1);
    return true;
  }

  getSurfaceMultiplier(chicken) {
    const type = CHICKENS[chicken.typeId];
    if (type.ignoresMud || type.jumpsMud) return 1;

    for (let index = 0; index < WORLD.laneCount; index += 1) {
      const top = WORLD.roadTop + index * (WORLD.laneHeight + WORLD.laneGap);
      if (chicken.y >= top - 4 && chicken.y <= top + WORLD.laneHeight + 4 && this.upgrades.isMudLane(index)) {
        return this.upgrades.getMudSlowMultiplier();
      }
    }
    return 1;
  }

  isMudY(y) {
    for (let index = 0; index < WORLD.laneCount; index += 1) {
      const top = WORLD.roadTop + index * (WORLD.laneHeight + WORLD.laneGap);
      if (y >= top - 4 && y <= top + WORLD.laneHeight + 4) {
        return this.upgrades.isMudLane(index);
      }
    }
    return false;
  }

  checkBarbedWire(chicken) {
    if (this.upgrades.stats.barbedWire <= 0 || chicken.dead) return;
    const finalLaneTop = WORLD.roadTop + (WORLD.laneCount - 1) * (WORLD.laneHeight + WORLD.laneGap);
    const type = CHICKENS[chicken.typeId];
    if (type.penaltyOnHit || type.escapeDamage === 0) return;
    if (chicken.y < finalLaneTop || chicken.y > finalLaneTop + WORLD.laneHeight) return;
    if (chicken.shieldTier > 0) {
      const crackedTier = chicken.shieldTier;
      this.upgrades.stats.barbedWire = Math.max(0, this.upgrades.stats.barbedWire - 1);
      chicken.shieldTier = Math.max(0, chicken.shieldTier - 1);
      chicken.squash = 1;
      chicken.crackTimer = 0.4;
      this.economy.cash += crackedTier;
      this.economy.totalEarned += crackedTier;
      this.effects.flashText(`+$${crackedTier}`, chicken.x, chicken.y - 48, "#32ca63");
      this.effects.shieldBreak(chicken.x, chicken.y, chicken.shieldTier);
      const text = this.upgrades.stats.barbedWire > 0 ? `WIRE ${this.upgrades.stats.barbedWire} LEFT` : "WIRE BREAK";
      this.effects.flashText(text, chicken.x, chicken.y - 36, "#e94742");
      return;
    }
    if (chicken.hp > 1 || type.oneTapImmune) return;
    this.upgrades.stats.barbedWire = Math.max(0, this.upgrades.stats.barbedWire - 1);
    this.splat(chicken, 0, "wire");
    const text = this.upgrades.stats.barbedWire > 0 ? `WIRE ${this.upgrades.stats.barbedWire} LEFT` : "WIRE BREAK";
    this.effects.flashText(text, chicken.x, chicken.y - 36, "#e94742");
  }
}
