import { worldFromPointer } from "../utils.js";

export class Input {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.point = null;
    canvas.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    canvas.addEventListener("pointermove", (event) => this.onPointerMove(event));
    canvas.addEventListener("pointerleave", () => this.onPointerLeave());
    window.addEventListener("keydown", (event) => this.onKeyDown(event));
  }

  onPointerDown(event) {
    this.game.audio.resume();
    const point = worldFromPointer(event, this.canvas, this.game.world);
    const lane = this.game.lanes.getLaneAt(point.y);
    if (lane) {
      this.game.deploySelected(lane);
    }
  }

  onPointerMove(event) {
    this.point = worldFromPointer(event, this.canvas, this.game.world);
    this.game.lanes.setHoverFromPoint(this.point);
  }

  onPointerLeave() {
    this.point = null;
    this.game.lanes.setHoverFromPoint(null);
  }

  onKeyDown(event) {
    if (event.key === "1") this.game.selectVehicle("car");
    if (event.key === "2") this.game.selectVehicle("truck");
    if (event.key === "3") this.game.selectVehicle("bus");
    if (event.key === "4") this.game.selectVehicle("plow");
    if (event.key === "5") this.game.selectVehicle("roadblock");
    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
      event.preventDefault();
      this.game.selectLaneOffset(-1);
    }
    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
      event.preventDefault();
      this.game.selectLaneOffset(1);
    }
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      event.preventDefault();
      this.game.setVehicleDirection(-1);
    }
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      event.preventDefault();
      this.game.setVehicleDirection(1);
    }
    if (event.key === " ") {
      event.preventDefault();
      if (this.game.mode === "playing") this.game.deployKeyboardLane();
      else this.game.startRun();
    }
    if (event.key === "Enter") {
      if (this.game.mode !== "playing") this.game.startRun();
    }
  }
}
