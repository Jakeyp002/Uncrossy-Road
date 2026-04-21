import { COLORS } from "../config.js";
import { rand } from "../utils.js";

export class Effects {
  constructor() {
    this.particles = [];
    this.popups = [];
    this.shakeTime = 0;
    this.shakeStrength = 0;
    this.laneBursts = [];
  }

  reset() {
    this.particles = [];
    this.popups = [];
    this.shakeTime = 0;
    this.shakeStrength = 0;
    this.laneBursts = [];
  }

  update(dt) {
    this.shakeTime = Math.max(0, this.shakeTime - dt);

    for (const particle of this.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 520 * dt;
      particle.spin += particle.spinSpeed * dt;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);

    for (const popup of this.popups) {
      popup.life -= dt;
      popup.y -= 58 * dt;
      popup.scale = 1 + Math.sin(Math.max(0, popup.life) * 12) * 0.05;
    }
    this.popups = this.popups.filter((popup) => popup.life > 0);

    for (const burst of this.laneBursts) {
      burst.life -= dt;
    }
    this.laneBursts = this.laneBursts.filter((burst) => burst.life > 0);
  }

  splat(x, y, amount, combo) {
    this.shake(5 + Math.min(10, combo));
    this.popups.push({
      x,
      y: y - 24,
      text: combo > 1 ? `+$${amount}  x${combo}` : `+$${amount}`,
      color: combo > 2 ? COLORS.cash : COLORS.white,
      life: 0.75,
      scale: 1
    });

    for (let i = 0; i < 18; i += 1) {
      this.particles.push({
        x: x + rand(-10, 10),
        y: y + rand(-8, 8),
        vx: rand(-175, 175),
        vy: rand(-270, -70),
        size: rand(4, 9),
        life: rand(0.38, 0.75),
        color: i % 4 === 0 ? COLORS.splat : COLORS.feather,
        spin: rand(0, Math.PI * 2),
        spinSpeed: rand(-7, 7)
      });
    }
  }

  doomscrollCrash(x, y, amount) {
    this.shake(9);
    this.popups.push({
      x,
      y: y - 28,
      text: `-$${amount}`,
      color: COLORS.warning,
      life: 0.95,
      scale: 1
    });

    for (let i = 0; i < 8; i += 1) {
      this.particles.push({
        x: x + rand(-8, 8),
        y: y + rand(-10, 5),
        vx: rand(-110, 110),
        vy: rand(-210, -80),
        size: rand(8, 12),
        life: rand(0.45, 0.8),
        color: i % 2 === 0 ? "#101820" : "#39d9cc",
        shape: i % 2 === 0 ? "phone" : "spark",
        spin: rand(0, Math.PI * 2),
        spinSpeed: rand(-7, 7)
      });
    }
  }

  deploy(lane) {
    this.laneBursts.push({
      y: lane.centerY,
      direction: lane.direction,
      life: 0.22
    });
  }

  escape(x, y) {
    this.shake(8);
    this.flashText("ESCAPE!", x, y - 35, COLORS.warning);
  }

  flashText(text, x, y, color = COLORS.white) {
    this.popups.push({ x, y, text, color, life: 0.95, scale: 1 });
  }

  shake(strength) {
    this.shakeTime = 0.2;
    this.shakeStrength = Math.max(this.shakeStrength, strength);
  }

  getShakeOffset() {
    if (this.shakeTime <= 0) {
      this.shakeStrength = 0;
      return { x: 0, y: 0 };
    }
    const fade = this.shakeTime / 0.2;
    return {
      x: rand(-this.shakeStrength, this.shakeStrength) * fade,
      y: rand(-this.shakeStrength, this.shakeStrength) * fade
    };
  }
}
