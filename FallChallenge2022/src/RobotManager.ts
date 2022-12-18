/* eslint-disable no-loop-func */
/* eslint-disable class-methods-use-this */
import { Action, MoveAction } from "./Actions";
import { computeManhattanDistance, debug } from "./helpers";
import { Block, myRobots, notMyBlocks } from "./State";

export class RobotManager {
  action() {
    debug("RobotManager action");
    const actions: Action[] = [];

    const targets: Block[] = [];

    for (const robot of myRobots) {
      const nearestEmptyBlocks = notMyBlocks.sort(
        (a, b) =>
          computeManhattanDistance(a, robot) -
          computeManhattanDistance(b, robot)
      );
      let i = 0;
      while (
        i < nearestEmptyBlocks.length &&
        targets.find((target) =>
          target.position.equals(nearestEmptyBlocks[i].position)
        )
      ) {
        i += 1;
      }

      if (i < nearestEmptyBlocks.length) {
        const nearestEmptyBlock = nearestEmptyBlocks[i];
        targets.push(nearestEmptyBlock);
        actions.push(
          new MoveAction(
            robot.units,
            robot.position.x,
            robot.position.y,
            nearestEmptyBlock.position.x,
            nearestEmptyBlock.position.y
          )
        );
      }
    }
    return actions;
  }
}

export const robotManager = new RobotManager();
