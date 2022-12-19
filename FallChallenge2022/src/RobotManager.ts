/* eslint-disable no-loop-func */
/* eslint-disable class-methods-use-this */
import { Action, MoveAction } from "./Actions";
import { Block } from "./Block";
import { debug } from "./helpers";
import { myRobots, notMyBlocks, Owner, side } from "./State";

export class RobotManager {
  action() {
    debug("RobotManager action");
    const actions: Action[] = [];

    const targets: Block[] = [];

    for (const robot of myRobots) {
      const nearestEmptyBlocks = notMyBlocks
        .sort((a, b) => {
          const distanceA = robot.distanceToBlock(a);
          const distanceB = robot.distanceToBlock(b);
          if (distanceA === distanceB && a.owner === b.owner)
            return side * (b.position.x - a.position.x);
          if (distanceA === distanceB) return b.owner - a.owner;
          return distanceA - distanceB;
        })
        .filter((block) => {
          const { willBecomeGrass } = block;
          if (willBecomeGrass === Infinity) return true;
          return willBecomeGrass > robot.distanceToBlock(block);
        });
      let i = 0;
      while (
        i < nearestEmptyBlocks.length &&
        targets.find(
          (target) =>
            target.position.equals(nearestEmptyBlocks[i].position) &&
            nearestEmptyBlocks[i].owner !== Owner.OPPONENT
        )
      ) {
        i += 1;
      }

      const nearestEmptyBlock =
        i < nearestEmptyBlocks.length
          ? nearestEmptyBlocks[i]
          : nearestEmptyBlocks[0];

      if (robot.distanceToBlock(nearestEmptyBlock) === 1)
        targets.push(nearestEmptyBlock);
      actions.push(
        new MoveAction(
          1,
          robot.position.x,
          robot.position.y,
          nearestEmptyBlock.position.x,
          nearestEmptyBlock.position.y
        )
      );
    }
    return actions;
  }
}

export const robotManager = new RobotManager();
