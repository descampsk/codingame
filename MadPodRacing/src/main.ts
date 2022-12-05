import { Point } from "@mathigon/euclid";

const checkpoints: Point[] = [];
let nextCheckpointIndex = 1;

// game loop
// eslint-disable-next-line no-constant-condition
while (true) {
  const hasUsedBoost = false;

  let inputs = readline().split(" ");
  const x = parseInt(inputs[0], 10);
  const y = parseInt(inputs[1], 10);
  const myPosition = new Point(x, y);

  if (!checkpoints.length) {
    checkpoints.push(myPosition);
  }
  console.error(checkpoints);

  const nextCheckpointX = parseInt(inputs[2], 10); // x position of the next check point
  const nextCheckpointY = parseInt(inputs[3], 10); // y position of the next check point
  const nextCheckpoint = new Point(nextCheckpointX, nextCheckpointY);
  if (checkpoints[0].equals(nextCheckpoint)) {
    nextCheckpointIndex = 0;
  } else if (!checkpoints[checkpoints.length - 1].equals(nextCheckpoint)) {
    checkpoints.push(nextCheckpoint);
    nextCheckpointIndex += 1;
  } else if (
    checkpoints[nextCheckpointIndex] &&
    nextCheckpoint.equals(checkpoints[nextCheckpointIndex])
  ) {
    nextCheckpointIndex += 1;
  }
  console.error("NextCheckPointIndex", nextCheckpointIndex);

  const nextCheckpointDist = parseInt(inputs[4], 10); // distance to the next checkpoint
  const nextCheckpointAngle = parseInt(inputs[5], 10); // angle between your pod orientation and the direction of the next checkpoint
  inputs = readline().split(" ");
  const opponentX = parseInt(inputs[0], 10);
  const opponentY = parseInt(inputs[1], 10);

  // Write an action using console.log()
  // To debug: console.error('Debug messages...');

  console.error(nextCheckpointDist);
  // console.error(opponentX);
  // console.error(opponentY);

  let thrust: number | "BOOST" = 0;
  if (
    nextCheckpointDist >= 10000 &&
    nextCheckpointAngle === 0 &&
    !hasUsedBoost
  ) {
    thrust = "BOOST";
  } else if (nextCheckpointDist < 3000) {
    thrust = 50;
  } else {
    thrust = nextCheckpointAngle > 90 || nextCheckpointAngle < -90 ? 0 : 100;
  }

  // if (checkpoints[nextCheckpointIndex]) {
  // }

  // You have to output the target position
  // followed by the power (0 <= thrust <= 100)
  // i.e.: "x y thrust"
  console.log(`${nextCheckpointX} ${nextCheckpointY} ${thrust}`);
}
