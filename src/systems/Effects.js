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

  eggSmash(x, y, brokeVehicle = false) {
    this.shake(brokeVehicle ? 13 : 9);
    this.popups.push({
      x,
      y: y - 30,
      text: brokeVehicle ? "SPLAT!" : "SWERVE!",
      color: brokeVehicle ? "#fff26b" : "#fff8df",
      life: 0.85,
      scale: 1
    });

    for (let i = 0; i < 22; i += 1) {
      this.particles.push({
        x: x + rand(-10, 10),
        y: y + rand(-8, 8),
        vx: rand(-190, 190),
        vy: rand(-240, -40),
        size: rand(8, 18),
        life: rand(0.45, 1),
        color: i % 3 === 0 ? "#fff8df" : "#f3c23b",
        shape: i % 5 === 0 ? "shell" : "yolk",
        spin: rand(0, Math.PI * 2),
        spinSpeed: rand(-7, 7)
      });
    }

    if (brokeVehicle) {
      for (let i = 0; i < 10; i += 1) {
        this.particles.push({
          x: x + rand(-14, 14),
          y: y + rand(-10, 10),
          vx: rand(-220, 220),
          vy: rand(-220, -60),
          size: rand(10, 18),
          life: rand(0.35, 0.75),
          color: i % 2 === 0 ? "#3b434d" : "#9aa3aa",
          shape: "shard",
          spin: rand(0, Math.PI * 2),
          spinSpeed: rand(-9, 9)
        });
      }
    }
  }

  bombBurst(x, y) {
    this.shake(14);
    this.popups.push({
      x,
      y: y - 24,
      text: "EGGSPLODE!",
      color: "#ff8b3d",
      life: 0.8,
      scale: 1
    });

    for (let i = 0; i < 26; i += 1) {
      this.particles.push({
        x: x + rand(-12, 12),
        y: y + rand(-12, 12),
        vx: rand(-240, 240),
        vy: rand(-250, -30),
        size: rand(7, 15),
        life: rand(0.35, 0.9),
        color: i % 3 === 0 ? "#ff8b3d" : i % 2 === 0 ? "#fff8df" : "#f3c23b",
        shape: i % 4 === 0 ? "shell" : "yolk",
        spin: rand(0, Math.PI * 2),
        spinSpeed: rand(-9, 9)
      });
    }
  }

  shieldBreak(x, y, remainingTier) {
    const palette = ["#fff7da", "#39d96a", "#4fb8ff", "#a66cff", "#e94742"];
    const color = palette[Math.max(0, Math.min(palette.length - 1, remainingTier + 1))];
    this.shake(remainingTier === 0 ? 9 : 6);
    this.popups.push({
      x,
      y: y - 26,
      text: remainingTier > 0 ? "CRACK!" : "POP!",
      color,
      life: 0.75,
      scale: 1
    });

    for (let i = 0; i < 14; i += 1) {
      this.particles.push({
        x: x + rand(-8, 8),
        y: y + rand(-8, 8),
        vx: rand(-180, 180),
        vy: rand(-220, -50),
        size: rand(4, 10),
        life: rand(0.35, 0.7),
        color,
        shape: "crack",
        spin: rand(0, Math.PI * 2),
        spinSpeed: rand(-8, 8)
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
