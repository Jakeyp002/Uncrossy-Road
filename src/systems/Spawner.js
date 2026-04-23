export class Spawner {
  constructor() {
    this.reset();
  }

  reset() {
    this.timer = 0.15;
    this.burstTimer = 8;
    this.waveBurstTimer = 0.45;
    this.burstQueue = [];
    this.bossSpawned = false;
    this.warningWaves = [
      {
        start: 225,
        end: 235,
        label: "Blitz",
        warningText: "Blitz incoming",
        activeText: "Mud closed. Blitz in progress.",
        weights: { dart: 0.16, tough: 0.54, runner: 0.3 },
        intervalScale: 0.78,
        burstCount: 2,
        burstSpacing: 0.12,
        burstCycle: 0.95,
        reward: 75,
        heraldSpawned: false
      }
    ];
    this.nextWarningWave = 0;
    this.activeWave = null;
    this.heraldWave = null;
    this.waveEndAnnounced = false;
  }

  updateEvents(runTime, chickens, upgrades, effects) {
    const events = { completedWave: null, heraldKilledWave: null };
    const difficulty = this.getDifficulty(runTime);
    if (!this.bossSpawned && runTime >= 150) {
      this.bossSpawned = true;
      this.burstQueue = [];
      this.timer = 2.2;
      chickens.clearForBoss();
      upgrades.setMudClosed(false);
      this.activeWave = null;
      this.heraldWave = null;
      chickens.spawn("boss", difficulty, {
        x: 640,
        vx: 0
      });
      effects.flashText("BOSS CHICKEN", 640, 146, "#ffdf65");
      return events;
    }

    if (this.activeWave && runTime >= this.activeWave.end) {
      upgrades.setMudClosed(false);
      events.completedWave = this.activeWave;
      if (!this.waveEndAnnounced) {
        effects.flashText("Mud reopened", 640, 182, "#39d9cc");
        this.waveEndAnnounced = true;
      }
      this.activeWave = null;
    }

    const nextWave = this.warningWaves[this.nextWarningWave];
    if (nextWave && !nextWave.heraldSpawned && runTime >= nextWave.start - 5 && runTime < nextWave.start) {
      nextWave.heraldSpawned = true;
      this.heraldWave = nextWave;
      this.burstQueue = [];
      this.timer = 0.4;
      chickens.clearForHerald();
      const lane = Math.floor(chickens.items.length % 2) + 3;
      const laneY = 112 + lane * (58 + 5) + 58 * 0.5;
      chickens.spawn("blitz", difficulty, {
        ...chickens.getSpawnModifiers("blitz", runTime),
        x: 640,
        y: laneY,
        vx: 0,
        vy: 0
      });
    }

    if (this.heraldWave && !this.heraldWave.countdownStarted && chickens.consumeKilledType("blitz")) {
      this.heraldWave.countdownStarted = true;
      this.heraldWave.start = runTime + 5;
      this.heraldWave.end = this.heraldWave.start + 10;
      events.heraldKilledWave = this.heraldWave;
      effects.flashText("Blitz incoming", 640, 124, "#fff26b");
      effects.flashText("5 second countdown started.", 640, 160, "#ff4f8a");
    }

    if (!this.activeWave && nextWave && runTime >= nextWave.start && runTime < nextWave.end) {
      chickens.clearType("blitz");
      this.activeWave = nextWave;
      this.heraldWave = null;
      this.nextWarningWave += 1;
      this.waveBurstTimer = 0.12;
      this.waveEndAnnounced = false;
      upgrades.setMudClosed(true);
      effects.flashText(nextWave.warningText ?? "Blitz incoming", 640, 124, "#ffdf65");
      effects.flashText(nextWave.activeText ?? "Mud closed. Blitz in progress.", 640, 160, "#e94742");
    }

    return events;
  }

  update(dt, runTime, chickens) {
    if (this.heraldWave && !this.activeWave) return;
    const difficulty = this.getDifficulty(runTime);
    const waveActive = this.isWarningWaveActive(runTime);

    const interval = waveActive
      ? Math.max(0.24, (1.35 - difficulty * 0.04) * (this.activeWave?.intervalScale ?? 0.42))
      : Math.max(0.48, 1.35 - difficulty * 0.04);
    this.timer -= dt;
    while (this.timer <= 0) {
      this.spawnEntry(chickens, difficulty, runTime, waveActive);
      this.timer += interval * (0.75 + Math.random() * 0.55);
    }

    if (waveActive) {
      this.waveBurstTimer -= dt;
      if (this.waveBurstTimer <= 0) {
        const count = (this.activeWave?.burstCount ?? 3) + Math.min(2, Math.floor(difficulty / 6));
        const spacing = this.activeWave?.burstSpacing ?? 0.08;
        for (let i = 0; i < count; i += 1) {
          this.burstQueue.push({ delay: i * spacing, difficulty, waveActive: true });
        }
        this.waveBurstTimer = this.activeWave?.burstCycle ?? 0.6;
      }
    } else {
      this.burstTimer -= dt;
      if (this.burstTimer <= 0) {
        const count = Math.min(4, 1 + Math.floor(difficulty / 5));
        for (let i = 0; i < count; i += 1) {
          this.burstQueue.push({ delay: i * 0.09, difficulty, waveActive: false });
        }
        this.burstTimer = Math.max(6, 12 - difficulty * 0.25);
      }
    }

    for (const queued of this.burstQueue) {
      queued.delay -= dt;
      if (queued.delay <= 0) {
        this.spawnEntry(chickens, queued.difficulty, runTime, queued.waveActive);
        queued.done = true;
      }
    }
    this.burstQueue = this.burstQueue.filter((queued) => !queued.done);
  }

  getDifficulty(runTime) {
    return Math.min(14, runTime / 45);
  }

  isWarningWaveActive(runTime) {
    return Boolean(this.activeWave && runTime < this.activeWave.end);
  }

  blocksBreak(runTime, chickens) {
    return this.isWarningWaveActive(runTime) || Boolean(this.heraldWave) || chickens.hasBossActive();
  }

  getPhaseLabel(runTime, chickens) {
    if (this.isWarningWaveActive(runTime)) return "Wave";
    if (this.getWarningState(runTime)) return "Alert";
    if (chickens.hasBossActive()) return "Boss";
    return "Jam";
  }

  getWarningState(runTime) {
    if (this.isWarningWaveActive(runTime)) {
      return {
        mode: "active",
        seconds: Math.ceil(this.activeWave.end - runTime),
        label: this.activeWave.label,
        text: this.activeWave.activeText
      };
    }

    if (this.heraldWave) {
      if (!this.heraldWave.countdownStarted) return null;
      const countdownTarget = this.heraldWave.countdownStarted ? this.heraldWave.start : this.heraldWave.start;
      return {
        mode: "warning",
        seconds: Math.max(1, Math.ceil(countdownTarget - runTime)),
        label: this.heraldWave.label,
        text: this.heraldWave.countdownStarted ? "Blitz chicken down. Blitz incoming." : "Kill the blitz chicken to start it.",
        progress: this.heraldWave.countdownStarted ? 0.9 : 0.5
      };
    }

    const nextWave = this.warningWaves[this.nextWarningWave];
    if (!nextWave) return null;
    const warningLead = 5;
    if (runTime >= nextWave.start - warningLead && runTime < nextWave.start) {
      return {
        mode: "warning",
        seconds: Math.ceil(nextWave.start - runTime),
        label: nextWave.label,
        text: nextWave.heraldSpawned ? "Blitz chicken started it." : nextWave.warningText,
        progress: 1 - (nextWave.start - runTime) / warningLead
      };
    }
    return null;
  }

  pickChickenType(difficulty, runTime, waveActive = false) {
    if (waveActive) {
      const weights = this.activeWave?.weights ?? { dart: 0.38, tough: 0.42, runner: 0.2 };
      const waveRoll = Math.random();
      if (waveRoll < (weights.dart ?? 0)) return "dart";
      if (waveRoll < (weights.dart ?? 0) + (weights.tough ?? 0)) return "tough";
      return "runner";
    }

    const eggsplodeChance = runTime >= 30 ? 0.05 : 0;
    const cashChance = runTime >= 30 ? 0.025 : 0;
    const dartChance = Math.min(0.14, difficulty * 0.014);
    const toughChance = Math.min(0.13, Math.max(0, difficulty - 1.8) * 0.014);
    const mudChance = runTime >= 240 ? Math.min(0.07, (runTime - 240) / 3600) : 0;
    const jumperChance = runTime >= 180 ? 0.018 : 0;
    const doomChance = runTime >= 120 ? Math.min(0.16, 1 / 15 + (runTime - 120) * 0.00033) : 0;
    const motherPairChance = runTime >= 180 ? 0.055 : 0;
    const roll = Math.random();
    if (roll < eggsplodeChance) return "eggsplode";
    if (roll < eggsplodeChance + cashChance) return "cash";
    if (roll < eggsplodeChance + cashChance + doomChance) return "doomscroller";
    if (roll < eggsplodeChance + cashChance + doomChance + jumperChance) return "jumper";
    if (roll < eggsplodeChance + cashChance + doomChance + jumperChance + mudChance) return "mud";
    if (roll < eggsplodeChance + cashChance + doomChance + jumperChance + mudChance + motherPairChance) return "motherPair";
    if (roll < eggsplodeChance + cashChance + doomChance + jumperChance + mudChance + motherPairChance + toughChance) return "tough";
    if (roll < eggsplodeChance + cashChance + doomChance + jumperChance + mudChance + motherPairChance + toughChance + dartChance) return "dart";
    return "runner";
  }

  spawnEntry(chickens, difficulty, runTime, waveActive = false) {
    const typeId = this.pickChickenType(difficulty, runTime, waveActive);
    if (typeId === "motherPair") {
      chickens.spawnMotherPair(difficulty, runTime);
      return;
    }
    const modifiers = chickens.getSpawnModifiers(typeId, runTime);
    if (waveActive && modifiers.shieldTier > 1) {
      modifiers.shieldTier = 1;
    }
    chickens.spawn(typeId, difficulty, modifiers);
  }
}
