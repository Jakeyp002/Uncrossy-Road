export class Spawner {
  constructor() {
    this.reset();
  }

  reset() {
    this.timer = 0.15;
    this.burstTimer = 8;
    this.burstQueue = [];
    this.bossSpawned = false;
  }

  update(dt, runTime, chickens) {
    const difficulty = this.getDifficulty(runTime);
    if (!this.bossSpawned && runTime >= 150) {
      this.bossSpawned = true;
      this.burstQueue = [];
      this.timer = 2.2;
      chickens.clearForBoss();
      chickens.spawn("boss", difficulty);
      return;
    }

    const interval = Math.max(0.48, 1.35 - difficulty * 0.04);
    this.timer -= dt;
    while (this.timer <= 0) {
      this.spawnEntry(chickens, difficulty, runTime);
      this.timer += interval * (0.75 + Math.random() * 0.55);
    }

    this.burstTimer -= dt;
    if (this.burstTimer <= 0) {
      const count = Math.min(4, 1 + Math.floor(difficulty / 5));
      for (let i = 0; i < count; i += 1) {
        this.burstQueue.push({ delay: i * 0.09, difficulty });
      }
      this.burstTimer = Math.max(6, 12 - difficulty * 0.25);
    }

    for (const queued of this.burstQueue) {
      queued.delay -= dt;
      if (queued.delay <= 0) {
        this.spawnEntry(chickens, queued.difficulty, runTime);
        queued.done = true;
      }
    }
    this.burstQueue = this.burstQueue.filter((queued) => !queued.done);
  }

  getDifficulty(runTime) {
    return Math.min(14, runTime / 45);
  }

  pickChickenType(difficulty, runTime) {
    const dartChance = Math.min(0.18, difficulty * 0.018);
    const toughChance = Math.min(0.13, Math.max(0, difficulty - 1.8) * 0.014);
    const mudChance = runTime >= 240 ? Math.min(0.07, (runTime - 240) / 3600) : 0;
    const jumperChance = runTime >= 180 ? 0.018 : 0;
    const doomChance = runTime >= 120 ? 1 / 12 : 0;
    const motherPairChance = runTime >= 180 ? 0.055 : 0;
    const roll = Math.random();
    if (roll < doomChance) return "doomscroller";
    if (roll < doomChance + jumperChance) return "jumper";
    if (roll < doomChance + jumperChance + mudChance) return "mud";
    if (roll < doomChance + jumperChance + mudChance + motherPairChance) return "motherPair";
    if (roll < doomChance + jumperChance + mudChance + motherPairChance + toughChance) return "tough";
    if (roll < doomChance + jumperChance + mudChance + motherPairChance + toughChance + dartChance) return "dart";
    return "runner";
  }

  spawnEntry(chickens, difficulty, runTime) {
    const typeId = this.pickChickenType(difficulty, runTime);
    if (typeId === "motherPair") {
      chickens.spawnMotherPair(difficulty, runTime);
      return;
    }
    chickens.spawn(typeId, difficulty, chickens.getSpawnModifiers(typeId, runTime));
  }
}
