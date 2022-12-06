import { Line, Point } from "@mathigon/euclid";
import { GameState } from "./State";

export class IA {
  private state: GameState;

  public hasUsedBoost = false;

  public turn = 1;

  constructor(state: GameState) {
    this.state = state;
  }

  doDiscovery() {
    if (this.turn > 1) {
      return;
    }

    if (!this.state.checkpoints.length) {
      this.state.checkpoints.push(this.state.nextCheckpoint);
      this.state.nextCheckpointIndex = 0;
    }
    if (
      !this.state.nextCheckpoint.equals(
        this.state.checkpoints[this.state.checkpoints.length - 1]
      ) &&
      !this.state.nextCheckpoint.equals(this.state.checkpoints[0])
    ) {
      this.state.checkpoints.push(this.state.nextCheckpoint);
      this.state.nextCheckpointIndex += 1;
    }
    if (
      this.state.checkpoints.length > 1 &&
      this.state.nextCheckpoint.equals(this.state.checkpoints[0])
    ) {
      this.state.nextCheckpointIndex = 0;
      this.turn += 1;
    }
  }

  computeDestination() {
    this.state.nextCheckpointIndex = this.state.checkpoints.findIndex((point) =>
      point.equals(this.state.nextCheckpoint)
    );

    const {
      nextCheckpointDist,
      nextCheckpointAngle,
      speed,
      nextCheckpointIndex,
    } = this.state;

    let thrust: number | "BOOST" = 0;
    if (
      nextCheckpointDist >= 4000 &&
      nextCheckpointAngle === 0 &&
      !this.hasUsedBoost
    ) {
      thrust = "BOOST";
      this.hasUsedBoost = true;
    } else {
      const absNextCheckpointAngle = Math.abs(nextCheckpointAngle);
      thrust = Math.round(100 - (10 / 15) * absNextCheckpointAngle);
      thrust = thrust < 20 ? 20 : thrust;
    }

    const distanceToSlow = 3000 + speed;
    if (
      thrust !== "BOOST" &&
      speed > 300 &&
      nextCheckpointDist < distanceToSlow
    ) {
      thrust *= 0.7 + (3 * nextCheckpointDist) / (10 * distanceToSlow);
    }

    const bigSlowDistance = 1500;
    const angleTooHigh = 10;
    if (
      nextCheckpointDist < bigSlowDistance &&
      Math.abs(nextCheckpointAngle) > angleTooHigh
    ) {
      thrust = 20;
    }

    if (this.turn === 1) {
      return {
        x: this.state.nextCheckpoint.x,
        y: this.state.nextCheckpoint.y,
        thrust: thrust === "BOOST" ? "BOOST" : Math.round(thrust),
      };
    }

    let { x } = this.state.nextCheckpoint;
    let { y } = this.state.nextCheckpoint;
    const afterNextCheckPointIndex =
      this.state.nextCheckpointIndex === this.state.checkpoints.length - 1
        ? 0
        : this.state.nextCheckpointIndex + 1;
    const afterNextCheckPoint =
      this.state.checkpoints[afterNextCheckPointIndex];
    console.error("afterNextCheckPointIndex", afterNextCheckPointIndex);
    if (
      this.state.nextCheckpointDist < 1000 &&
      speed > 100 &&
      (this.turn !== 3 || afterNextCheckPointIndex === 0)
    ) {
      console.error("Going to afterNextCheckPoint");
      x = afterNextCheckPoint.x;
      y = afterNextCheckPoint.y;
    }
    // } else {
    //   const line = new Line(this.state.nextCheckpoint, afterNextCheckPoint);
    //   const destination = line.at(
    //     -100 / Point.distance(this.state.nextCheckpoint, afterNextCheckPoint)
    //   );
    //   console.error("destination", destination);
    //   x = Math.round(destination.x);
    //   y = Math.round(destination.y);
    // }
    return {
      x,
      y,
      thrust: thrust === "BOOST" ? "BOOST" : Math.round(thrust),
    };
  }
}
