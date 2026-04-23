import { worldFromPointer } from "../utils.js";

export class Input {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.point = null;
    this.mobilePointer = null;
    canvas.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    canvas.addEventListener("pointermove", (event) => this.onPointerMove(event));
    canvas.addEventListener("pointerup", (event) => this.onPointerUp(event));
    canvas.addEventListener("pointercancel", () => this.onPointerCancel());
    canvas.addEventListener("pointerleave", () => this.onPointerLeave());
    window.addEventListener("keydown", (event) => this.onKeyDown(event));
  }

  onPointerDown(event) {
    this.game.audio.resume();
    const point = worldFromPointer(event, this.canvas, this.game.world);
    const lane = this.game.lanes.getLaneAt(point.y);
    if (this.usesPhoneControls() && lane) {
      this.mobilePointer = {
        id: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        lane
      };
      this.canvas.setPointerCapture?.(event.pointerId);
      this.game.lanes.setHoverFromPoint(point);
      return;
    }
    if (lane) {
      this.game.deploySelected(lane);
    }
  }

  onPointerMove(event) {
    this.point = worldFromPointer(event, this.canvas, this.game.world);
    this.game.lanes.setHoverFromPoint(this.point);
  }

  onPointerUp(event) {
    if (!this.mobilePointer || this.mobilePointer.id !== event.pointerId) return;
    const pointer = this.mobilePointer;
    this.mobilePointer = null;
    this.canvas.releasePointerCapture?.(event.pointerId);
    const direction = this.getMobileDirection(pointer, event);
    this.game.setVehicleDirection(direction);
    this.game.deploySelected(pointer.lane);
  }

  onPointerCancel() {
    this.mobilePointer = null;
  }

  onPointerLeave() {
    if (this.mobilePointer) return;
    this.point = null;
    this.game.lanes.setHoverFromPoint(null);
  }

  usesPhoneControls() {
    return document.body.classList.contains("phone-ui");
  }

  getMobileDirection(pointer, event) {
    const swipeX = event.clientX - pointer.startClientX;
    const swipeY = event.clientY - pointer.startClientY;
    if (Math.abs(swipeX) > 28 && Math.abs(swipeX) > Math.abs(swipeY) * 1.15) {
      return swipeX > 0 ? 1 : -1;
    }
    const bounds = this.canvas.getBoundingClientRect();
    const tapX = pointer.startClientX - bounds.left;
    return tapX < bounds.width * 0.5 ? 1 : -1;
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
