import { WORLD } from "../config.js";

export class Economy {
  constructor() {
    this.reset();
  }

  reset() {
    this.cash = WORLD.startCash;
    this.totalEarned = 0;
    this.splats = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.bestCombo = 0;
    this.lastInterest = 0;
    this.comboBonusExtra = 0;
  }

  update(dt) {
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer <= 0) {
      this.combo = 0;
    }
  }

  canAfford(amount) {
    return this.cash >= amount;
  }

  spend(amount) {
    if (!this.canAfford(amount)) return false;
    this.cash -= amount;
    return true;
  }

  penalize(amount) {
    const loss = Math.max(0, Math.min(this.cash, amount));
    this.cash -= loss;
    return loss;
  }

  earnSplat(baseReward, bonusPerSplat) {
    if (this.comboTimer > 0) {
      this.combo += 1;
    } else {
      this.combo = 1;
    }
    this.comboTimer = WORLD.comboWindow;
    this.bestCombo = Math.max(this.bestCombo, this.combo);

    const comboBonus = Math.floor(Math.max(0, this.combo - 1) * (1.25 + this.comboBonusExtra));
    const amount = baseReward + bonusPerSplat + comboBonus;
    this.cash += amount;
    this.totalEarned += amount;
    this.splats += 1;
    return { amount, combo: this.combo };
  }

  applyInterest(multiplier = 1, flatBonus = 0) {
    const amount = Math.floor((this.cash / 5) * multiplier) + flatBonus;
    this.cash += amount;
    this.totalEarned += amount;
    this.lastInterest = amount;
    return amount;
  }
}
