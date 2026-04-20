import { WORLD } from "../config.js";

export class LaneManager {
  constructor() {
    this.lanes = Array.from({ length: WORLD.laneCount }, (_, index) => {
      const y = WORLD.roadTop + index * (WORLD.laneHeight + WORLD.laneGap);
      return {
        index,
        y,
        centerY: y + WORLD.laneHeight * 0.5,
        height: WORLD.laneHeight,
        direction: index % 2 === 0 ? 1 : -1,
        isMud: WORLD.mudLaneIndices.includes(index),
        deployStreak: 0,
        lockTimer: 0
      };
    });
    this.hoveredLane = null;
  }

  reset() {
    for (const lane of this.lanes) {
      lane.deployStreak = 0;
      lane.lockTimer = 0;
    }
    this.hoveredLane = null;
  }

  update(dt) {
    for (const lane of this.lanes) {
      lane.lockTimer = Math.max(0, lane.lockTimer - dt);
      if (lane.lockTimer <= 0 && lane.deployStreak > WORLD.laneDeployLimit) {
        lane.deployStreak = 0;
      }
    }
  }

  getLaneAt(y) {
    return this.lanes.find((lane) => y >= lane.y && y <= lane.y + lane.height) ?? null;
  }

  getLanePair(lane) {
    const pairStart = Math.floor(lane.index / 2) * 2;
    const first = this.lanes[pairStart];
    const second = this.lanes[pairStart + 1];
    if (!first || !second) return null;
    const pairIndex = pairStart / 2;
    return {
      index: pairStart,
      pairIndex,
      y: first.y,
      centerY: (first.centerY + second.centerY) * 0.5,
      height: second.y + second.height - first.y,
      direction: pairIndex % 2 === 0 ? 1 : -1,
      lanes: [first.index, second.index]
    };
  }

  getPlacementLanes(placement) {
    if (!placement) return [];
    if (placement.lanes) return placement.lanes.map((index) => this.lanes[index]).filter(Boolean);
    return [this.lanes[placement.index]].filter(Boolean);
  }

  isPlacementLocked(placement) {
    return this.getPlacementLanes(placement).some((lane) => lane.lockTimer > 0);
  }

  recordDeploy(placement) {
    const used = this.getPlacementLanes(placement);
    for (const lane of this.lanes) {
      if (!used.includes(lane)) {
        lane.deployStreak = 0;
      }
    }

    for (const lane of used) {
      lane.deployStreak += 1;
      if (lane.deployStreak > WORLD.laneDeployLimit) {
        lane.lockTimer = WORLD.laneLockSeconds;
      }
    }
  }

  setHoverFromPoint(point) {
    const lane = point ? this.getLaneAt(point.y) : null;
    this.hoveredLane = lane ? lane.index : null;
  }
}
