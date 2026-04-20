import { UPGRADES, VEHICLES } from "../config.js";
import { formatTime } from "../utils.js";

const UPGRADE_ICONS = {
  cheapCars: "CAR",
  truckCooldown: "SPD",
  longBus: "BUS",
  plowTune: "PLW",
  bonusCash: "$+",
  interestBoost: "%+",
  comboLedger: "X+",
  breakGrant: "PAY",
  mudDepth: "MUD",
  extraMud: "M+",
  safeCurbs: "HP",
  restockWire: "WR"
};

export class UI {
  constructor(game) {
    this.game = game;
    this.cash = document.querySelector("#cash");
    this.escapes = document.querySelector("#escapes");
    this.combo = document.querySelector("#combo");
    this.time = document.querySelector("#time");
    this.phase = document.querySelector("#phase");
    this.vehicleButtons = document.querySelector("#vehicleButtons");
    this.upgradeButtons = document.querySelector("#upgradeButtons");
    this.shopPanel = document.querySelector("#shopPanel");
    this.interest = document.querySelector("#interest");
    this.shopTimer = document.querySelector("#shopTimer");
    this.shopInfo = document.querySelector("#shopInfo");
    this.overlay = document.querySelector("#overlay");
    this.startButton = document.querySelector("#startButton");
    this.guideButton = document.querySelector("#guideButton");
    this.activeInfoUpgrade = null;
    this.renderButtons();
    this.startButton.addEventListener("click", () => this.game.startRun());
    this.guideButton.addEventListener("click", () => {
      window.location.href = "./guide.html";
    });
  }

  renderButtons() {
    this.vehicleButtons.innerHTML = "";
    for (const vehicle of Object.values(VEHICLES)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `vehicle-button rarity-${vehicle.rarity ?? "common"}`;
      button.dataset.vehicle = vehicle.id;
      button.innerHTML = `
        <span class="vehicle-icon vehicle-icon-${vehicle.id}"><span></span></span>
        <span class="button-main"></span>
        <span class="button-sub"></span>
      `;
      button.addEventListener("click", () => this.game.selectVehicle(vehicle.id));
      this.vehicleButtons.appendChild(button);
    }

    this.upgradeButtons.innerHTML = "";
    const categories = ["Vehicles", "Economy", "Map"];
    for (const category of categories) {
      const upgrades = UPGRADES.filter((upgrade) => (upgrade.category ?? "Run") === category);
      if (upgrades.length > 0) {
        const heading = document.createElement("div");
        heading.className = "shop-category";
        heading.textContent = category;
        this.upgradeButtons.appendChild(heading);
      }
      for (const upgrade of upgrades) {
        const tile = document.createElement("div");
        tile.className = `upgrade-tile upgrade-${upgrade.id} upgrade-category-${(upgrade.category ?? "run").toLowerCase()}`;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "upgrade-buy";
        button.dataset.upgrade = upgrade.id;
        button.title = upgrade.title;
        button.innerHTML = `
          <span class="upgrade-icon">${UPGRADE_ICONS[upgrade.id] ?? "UP"}</span>
          <span class="upgrade-price"></span>
        `;
        button.addEventListener("click", () => this.game.buyUpgrade(upgrade));
        tile.appendChild(button);

        const info = document.createElement("button");
        info.type = "button";
        info.className = "info-button";
        info.textContent = "i";
        info.title = upgrade.title;
        info.addEventListener("click", () => this.showUpgradeInfo(upgrade));
        tile.appendChild(info);

        this.upgradeButtons.appendChild(tile);
      }
    }
  }

  update() {
    const game = this.game;
    this.cash.textContent = `$${game.economy.cash}`;
    this.escapes.textContent = `${game.chickens.escaped} / ${game.getEscapeLimit()}`;
    this.combo.textContent = `x${Math.max(1, game.economy.combo || 1)}`;
    this.time.textContent = formatTime(game.runTime);
    const breakInfo = game.getBreakInfo();
    this.phase.textContent = breakInfo.active ? `Shop ${breakInfo.remaining}s` : "Jam";
    this.shopPanel.classList.toggle("visible", breakInfo.active && game.mode === "playing");
    this.interest.textContent = `Interest +$${game.economy.lastInterest}`;
    this.shopTimer.textContent = `${breakInfo.remaining || 15}s`;

    for (const button of this.vehicleButtons.querySelectorAll("button")) {
      const type = button.dataset.vehicle;
      const vehicle = VEHICLES[type];
      const cost = game.upgrades.getVehicleCost(type);
      const cooldown = game.vehicles.cooldowns[type];
      const main = button.querySelector(".button-main");
      const sub = button.querySelector(".button-sub");
      button.classList.toggle("selected", game.selectedVehicle === type);
      const usedUp = vehicle.maxUses && game.vehicles.uses[type] >= vehicle.maxUses;
      button.title = `${vehicle.name} - key ${vehicle.key}`;
      button.disabled = game.mode !== "playing" || breakInfo.active || !game.economy.canAfford(cost) || cooldown > 0 || usedUp;
      main.textContent = `$${cost}`;
      if (usedUp) {
        sub.textContent = "Used";
      } else if (cooldown > 0) {
        sub.textContent = `${cooldown.toFixed(1)}s`;
      } else {
        const uses = vehicle.maxUses ? ` ${vehicle.maxUses - game.vehicles.uses[type]}/${vehicle.maxUses}` : "";
        sub.textContent = `$${cost}${uses}`;
      }
    }

    for (const button of this.upgradeButtons.querySelectorAll("button[data-upgrade]")) {
      const upgrade = UPGRADES.find((item) => item.id === button.dataset.upgrade);
      const level = game.upgrades.levels[upgrade.id];
      const price = button.querySelector(".upgrade-price");
      const capped = level >= upgrade.maxLevel;
      const cost = game.upgrades.getUpgradeCost(upgrade);
      const canBuy = game.upgrades.canBuy(upgrade);
      button.disabled = game.mode !== "playing" || !breakInfo.active || !canBuy;
      if (upgrade.id === "restockWire" && game.upgrades.stats.barbedWire > 0) {
        price.textContent = "Stocked";
      } else if (capped) {
        price.textContent = upgrade.instant ? "Used" : "Maxed";
      } else {
        price.textContent = `$${cost}`;
      }
    }
  }

  showStart() {
    this.overlay.classList.add("visible");
    this.overlay.querySelector("h1").textContent = "Uncrossy Road";
    this.overlay.querySelector(".tagline").textContent =
      "Send toy traffic into the lanes. Mud roads slow the flock. Shop breaks last 15 seconds.";
    this.startButton.textContent = "Start Run";
    this.guideButton.hidden = true;
    this.overlay.querySelector(".small").textContent =
      "Fast runs. No saved upgrades. No mercy from poultry.";
    this.setChickenDex([]);
  }

  showGameOver() {
    this.overlay.classList.add("visible");
    this.overlay.querySelector("h1").textContent = "Run Over";
    this.overlay.querySelector(".tagline").textContent =
      `${this.game.economy.splats} splats, best combo x${this.game.economy.bestCombo}, survived ${formatTime(this.game.runTime)}.`;
    this.startButton.textContent = "Try Again";
    this.guideButton.hidden = false;
    this.overlay.querySelector(".small").textContent =
      "Cash and run upgrades are gone. The next jam starts fresh.";
    this.setChickenDex(this.game.getUnlockedChickenInfo());
  }

  hideOverlay() {
    this.overlay.classList.remove("visible");
  }

  setChickenDex(chickens) {
    const dex = document.querySelector("#chickenDex");
    if (!dex) return;
    dex.hidden = chickens.length === 0;
    dex.innerHTML = chickens
      .map(
        (chicken) =>
          `<article class="dex-card"><strong>${chicken.name}</strong><span>${chicken.description}</span></article>`
      )
      .join("");
  }

  showUpgradeInfo(upgrade) {
    this.activeInfoUpgrade = upgrade.id;
    this.shopInfo.textContent = `${upgrade.title}: ${upgrade.text}`;
  }
}
