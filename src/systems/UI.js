import { UPGRADES, VEHICLES } from "../config.js";
import { formatTime } from "../utils.js";

const UPGRADE_ICONS = {
  unlockTruck: "TRK",
  unlockBus: "BUS",
  unlockPlow: "PLW",
  unlockRoadblock: "EGL",
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

const TUTORIAL_CARDS = [
  {
    title: "Pick a lane, then fire.",
    body: "Use 1 to 5 or click the vehicle tray to choose a ride. Move the lane picker with WASD or the arrow keys, flip direction with left or right, then hit Space to deploy instantly.",
    tags: ["1-5 choose", "WASD / arrows move", "Space deploy", "Left / right flip"],
    scene: "scene-controls"
  },
  {
    title: "Breaks are where runs are won.",
    body: "Every 30 seconds the road pauses for a 15 second shop break. You gain interest, get escapes back up to 5 without going over the cap, and can buy the upgrades that keep the next wave manageable.",
    tags: ["15 second break", "interest pays out", "escapes refill up to 5", "shop before chaos"],
    scene: "scene-shop"
  },
  {
    title: "Every vehicle has a job.",
    body: "The blue car starts unlocked. Buy the truck, bus, plow, and eagle from the Vehicles shelf during breaks, then use Parts upgrades to tune them once they are online.",
    tags: ["Blue car starts", "Buy vehicles in shop", "Parts upgrade them", "Truck = heavy hit"],
    scene: "scene-vehicles"
  },
  {
    title: "Know the troublemakers.",
    body: "Darters sprint, bruisers soak hits, jumpers ignore mud, mud chickens stay fast in sludge, doomscrollers cost you cash when hit, mothers lob giant eggs, and shield birds can start showing up at 1:30 with color tiers that crack down one step at a time.",
    tags: ["Darter", "Bruiser", "Shield colors", "Doomscroller", "Mother hen", "Boss"],
    scene: "scene-enemies"
  },
  {
    title: "Play for flow, not panic.",
    body: "Mud lanes are your best stalling tool. Do not spam the same road until it locks red. Save your wide vehicles for stacked lanes, and try to splat in bursts so combos keep the cash flowing.",
    tags: ["Mud is tempo", "avoid lane lock", "save wide coverage", "combo for cash"],
    scene: "scene-strategy"
  }
];

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
    this.gameOverSplashView = document.querySelector("#gameOverSplashView");
    this.gameOverSplashCard = document.querySelector("#gameOverSplashCard");
    this.gameOverSplashImage = document.querySelector("#gameOverSplashImage");
    this.menuView = document.querySelector("#menuView");
    this.tutorialView = document.querySelector("#tutorialView");
    this.overlayTitle = document.querySelector("#overlayTitle");
    this.overlayTagline = document.querySelector("#overlayTagline");
    this.overlaySmall = document.querySelector("#overlaySmall");
    this.startButton = document.querySelector("#startButton");
    this.guideButton = document.querySelector("#guideButton");
    this.tutorialButton = document.querySelector("#tutorialButton");
    this.tutorialBackButton = document.querySelector("#tutorialBackButton");
    this.tutorialPrevButton = document.querySelector("#tutorialPrevButton");
    this.tutorialNextButton = document.querySelector("#tutorialNextButton");
    this.tutorialStartButton = document.querySelector("#tutorialStartButton");
    this.tutorialStep = document.querySelector("#tutorialStep");
    this.tutorialTitle = document.querySelector("#tutorialTitle");
    this.tutorialBody = document.querySelector("#tutorialBody");
    this.tutorialImage = document.querySelector("#tutorialImage");
    this.tutorialTags = document.querySelector("#tutorialTags");
    this.activeInfoUpgrade = null;
    this.tutorialIndex = 0;
    this.gameOverDexRevealed = false;
    this.renderButtons();
    this.startButton.addEventListener("click", () => this.game.startRun());
    this.tutorialStartButton.addEventListener("click", () => this.game.startRun());
    this.guideButton.addEventListener("click", () => {
      window.location.href = "./guide.html";
    });
    this.tutorialButton.addEventListener("click", () => this.showTutorial());
    this.tutorialBackButton.addEventListener("click", () => this.showMenu());
    this.tutorialPrevButton.addEventListener("click", () => this.stepTutorial(-1));
    this.tutorialNextButton.addEventListener("click", () => this.stepTutorial(1));
    this.gameOverSplashCard.addEventListener("click", () => this.revealGameOverDex());
    this.gameOverSplashCard.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.revealGameOverDex();
      }
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
        <span class="vehicle-timer" aria-hidden="true"></span>
        <span class="vehicle-icon vehicle-icon-${vehicle.id}"><span></span></span>
        <span class="button-main"></span>
        <span class="button-sub"></span>
      `;
      button.addEventListener("click", () => this.game.selectVehicle(vehicle.id));
      this.vehicleButtons.appendChild(button);
    }

    this.upgradeButtons.innerHTML = "";
    const categories = ["Vehicles", "Parts", "Economy", "Map"];
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
      const unlockUpgrade = UPGRADES.find((upgrade) => upgrade.unlocksVehicle === type);
      const unlocked = game.upgrades.isVehicleUnlocked(type);
      const cost = game.upgrades.getVehicleCost(type);
      const cooldown = game.vehicles.cooldowns[type];
      const main = button.querySelector(".button-main");
      const sub = button.querySelector(".button-sub");
      button.hidden = !unlocked;
      button.classList.toggle("selected", game.selectedVehicle === type);
      const usedUp = vehicle.maxUses && game.vehicles.uses[type] >= vehicle.maxUses;
      button.classList.toggle("locked", !unlocked);
      button.title = unlocked ? `${vehicle.name} - key ${vehicle.key}` : `${vehicle.name} - unlock in Vehicles`;
      button.disabled =
        !unlocked ||
        game.mode !== "playing" ||
        breakInfo.active ||
        !game.economy.canAfford(cost) ||
        cooldown > 0 ||
        usedUp;
      main.textContent = unlocked ? `$${cost}` : "LOCK";
      const rescueProgress = type === "car" ? game.getSafetyNetProgress() : 0;
      button.classList.toggle("rescue-loading", rescueProgress > 0);
      button.style.setProperty("--rescue-progress", `${rescueProgress}`);
      if (!unlocked) {
        sub.textContent = unlockUpgrade ? `Shop $${game.upgrades.getUpgradeCost(unlockUpgrade)}` : "Shop";
      } else if (usedUp) {
        sub.textContent = "Used";
      } else if (cooldown > 0) {
        sub.textContent = `${cooldown.toFixed(1)}s`;
      } else if (rescueProgress > 0) {
        sub.textContent = `${Math.max(1, Math.ceil(5 - game.rescueTimer))}s aid`;
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
    this.gameOverSplashView.hidden = true;
    this.showMenu();
    this.gameOverDexRevealed = false;
    this.overlayTitle.textContent = "Uncrossy Road";
    this.overlayTagline.textContent =
      "Send toy traffic into the lanes. Mud roads slow the flock. Shop breaks last 15 seconds.";
    this.overlaySmall.textContent =
      "Fast runs. No saved upgrades. No mercy from poultry.";
    this.startButton.textContent = "Start Run";
    this.setChickenDex([]);
  }

  showGameOver() {
    this.overlay.classList.add("visible");
    this.gameOverSplashView.hidden = false;
    this.menuView.hidden = true;
    this.tutorialView.hidden = true;
    this.gameOverDexRevealed = false;
    this.gameOverSplashImage.src = this.game.gameOverSnapshot ?? this.game.renderer.captureCurrentView();
    this.setChickenDex(this.game.getUnlockedChickenInfo(), false);
  }

  hideOverlay() {
    this.overlay.classList.remove("visible");
  }

  showMenu() {
    this.gameOverSplashView.hidden = true;
    this.menuView.hidden = false;
    this.tutorialView.hidden = true;
  }

  showTutorial() {
    this.menuView.hidden = true;
    this.tutorialView.hidden = false;
    this.renderTutorial();
  }

  stepTutorial(direction) {
    const total = TUTORIAL_CARDS.length;
    this.tutorialIndex = (this.tutorialIndex + direction + total) % total;
    this.renderTutorial();
  }

  renderTutorial() {
    const card = TUTORIAL_CARDS[this.tutorialIndex];
    this.tutorialStep.textContent = `Card ${this.tutorialIndex + 1} / ${TUTORIAL_CARDS.length}`;
    this.tutorialTitle.textContent = card.title;
    this.tutorialBody.textContent = card.body;
    if (!card.image) {
      card.image = this.game.renderer.captureTutorialShot(card.scene);
    }
    this.tutorialImage.src = card.image;
    this.tutorialImage.alt = `${card.title} tutorial snapshot`;
    this.tutorialTags.innerHTML = card.tags.map((tag) => `<span class="tutorial-tag">${tag}</span>`).join("");
  }

  revealGameOverDex() {
    if (this.game.mode !== "gameover" || this.gameOverDexRevealed) return;
    this.gameOverDexRevealed = true;
    this.gameOverSplashView.hidden = true;
    this.showMenu();
    this.overlayTitle.textContent = "Run Over";
    this.overlayTagline.textContent =
      `${this.game.economy.splats} splats, best combo x${this.game.economy.bestCombo}, survived ${formatTime(this.game.runTime)}.`;
    this.startButton.textContent = "Try Again";
    this.overlaySmall.textContent = "Cash and run upgrades are gone. Here are the birds you unlocked this run.";
    this.setChickenDex(this.game.getUnlockedChickenInfo(), true);
  }

  setChickenDex(chickens, reveal = false) {
    const dex = document.querySelector("#chickenDex");
    if (!dex) return;
    dex.hidden = chickens.length === 0 || !reveal;
    dex.innerHTML = chickens
      .map(
        (chicken) =>
          `<article class="dex-card"><img class="dex-photo-img" src="${this.game.renderer.captureChickenPortrait(chicken.id)}" alt="${chicken.name} portrait" /><strong>${chicken.name}</strong><span>${chicken.description}</span></article>`
      )
      .join("");
  }

  showUpgradeInfo(upgrade) {
    this.activeInfoUpgrade = upgrade.id;
    this.shopInfo.textContent = `${upgrade.title}: ${upgrade.text}`;
  }
}
