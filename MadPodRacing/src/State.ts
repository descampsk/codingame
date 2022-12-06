import { Point } from "@mathigon/euclid";
import { getInputs } from "./inputs";

export class GameState {
  public oldPosition: Point = new Point(0, 0);

  public myPosition: Point = new Point(0, 0);

  public speed = 0;

  public nextCheckpoint: Point = new Point(0, 0);

  public nextCheckpointAngle = 0;

  public nextCheckpointDist = 0;

  public opponentPosition: Point = new Point(0, 0);

  public checkpoints: Point[] = [];

  public nextCheckpointIndex = 0;

  readInputs() {
    const {
      myPosition,
      nextCheckpoint,
      nextCheckpointAngle,
      nextCheckpointDist,
      opponentPosition,
    } = getInputs();
    this.oldPosition = new Point(this.myPosition.x, this.myPosition.y);
    this.myPosition = myPosition;
    // console.error("MyPosition", myPosition);
    this.speed = Point.distance(this.oldPosition, this.myPosition);
    this.nextCheckpoint = nextCheckpoint;
    this.nextCheckpointAngle = nextCheckpointAngle;
    this.nextCheckpointDist = nextCheckpointDist;
    this.opponentPosition = opponentPosition;

    console.error(
      "Speed",
      this.speed,
      "nextCheckpointAngle",
      nextCheckpointAngle,
      "nextCheckpointDist",
      nextCheckpointDist
    );
  }
}
