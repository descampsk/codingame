/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-loop-func */
/* eslint-disable class-methods-use-this */
import { Action, MoveAction } from "./Actions";
import { Block } from "./Block";
import { ClassLogger } from "./ClassLogger";
import { computeManhattanDistance, debug, debugTime } from "./helpers";
import {
  Owner,
  side,
  myStartPosition,
  opponentStartPosition,
  myBlocks,
  map,
} from "./State";

export class RobotManager extends ClassLogger {
  public robotsToMove: Block[] = [];

  naiveMethod() {
    const start = new Date();
    const actions: Action[] = [];

    const robotsToMove = myBlocks
      .filter((block) => block.units > 0 && block.hasMoved < block.units)
      .flatMap((robot) => robot.getOneRobotPerUnit());

    for (const robot of robotsToMove) {
      const nearestEmptyBlocks = robot.neighbors
        .filter((block) => {
          const { willBecomeGrass } = block;
          if (willBecomeGrass === Infinity) return true;
          return willBecomeGrass > 1;
        })
        .sort((a, b) => {
          const potentielRadius =
            robot.island?.owner === Owner.ME ? Infinity : 5;
          const potentielA = a.getPotentiel(potentielRadius);
          const potentielB = b.getPotentiel(potentielRadius);

          if (robot.initialOwner === Owner.OPPONENT) {
            if (a.owner !== b.owner) {
              if (a.owner === Owner.NONE) return -1;
              if (a.owner === Owner.ME) return 1;
              if (a.owner === Owner.OPPONENT) {
                if (b.owner === Owner.NONE) return 1;
                if (b.owner === Owner.ME) return -1;
              }
            }
            return potentielB - potentielA;
          }

          if (potentielA !== potentielB) return potentielB - potentielA;
          return side * (b.x - a.x);
        });

      this.debug(
        `Robot ${robot.x},${robot.y} neighors potentiel`,
        nearestEmptyBlocks.map((block) => [
          block.x,
          block.y,
          block.getPotentiel(5),
        ])
      );

      const nearestEmptyBlock = nearestEmptyBlocks[0];

      if (nearestEmptyBlock) {
        this.debug(
          `Robot ${robot.x},${robot.y} will go to ${nearestEmptyBlock.x},${nearestEmptyBlock.y}`
        );
        actions.push(new MoveAction(1, robot, nearestEmptyBlock));
      }
    }
    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`naiveMethod time: ${end} ms`);
    return actions;
  }

  action() {
    const actions = this.naiveMethod();
    return actions;
  }
}

export const robotManager = new RobotManager();
