/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-loop-func */
/* eslint-disable class-methods-use-this */
import { Action, MoveAction } from "./Actions";
import { Block } from "./Block";
import { computeManhattanDistance, debug, minBy } from "./helpers";
import {
  myRobots,
  notMyBlocks,
  Owner,
  side,
  width,
  blocks,
  debugTime,
  myStartPosition,
  opponentStartPosition,
} from "./State";

export class RobotManager {
  public robotsToMove: Block[] = [];

  naiveMethod() {
    const start = new Date();

    debug("RobotManager - naive mode");
    const actions: Action[] = [];
    const targets: Block[] = [];

    for (const robot of this.robotsToMove.filter((robot) => !robot.hasMoved)) {
      //   debug("Block", robot.x, robot.y, robot.neighbors.length);
      const nearestEmptyBlocks = robot.neighbors
        .sort((a, b) => {
          const potentielRadius = 5;
          const potentielA = a.getPotentiel(potentielRadius);
          const potentielB = b.getPotentiel(potentielRadius);

          //   debug("potentielA", a.x, a.y, potentielA);
          //   debug("potentielB", b.x, b.y, potentielB);

          const distanceToMyStartA = computeManhattanDistance(
            a,
            myStartPosition
          );
          const distanceToMyStartB = computeManhattanDistance(
            b,
            myStartPosition
          );

          const distanceToOpponentStartA = computeManhattanDistance(
            a,
            opponentStartPosition
          );
          const distanceToOpponentStartB = computeManhattanDistance(
            b,
            opponentStartPosition
          );

          // Ordre de priorité
          // - si case ennemie, on tue les robots en premier
          // - ennemie avant vide
          // - qui a le meilleur potentiel
          // - le plus éloigné de notre position de départ
          if (a.owner !== b.owner) return a.compareOwner(b);
          if (a.owner === Owner.OPPONENT || b.owner === Owner.OPPONENT)
            return (
              (b.owner === Owner.OPPONENT ? b.units : 0) -
              (a.owner === Owner.OPPONENT ? a.units : 0)
            );
          if (potentielA !== potentielB) return potentielB - potentielA;
          return side * (b.x - a.x);
        })
        .filter((block) => {
          const { willBecomeGrass } = block;
          if (willBecomeGrass === Infinity) return true;
          return willBecomeGrass > robot.distanceToBlock(block);
        });

      //   debug(nearestEmptyBlocks.slice(0, 2));
      let i = 0;
      while (
        i < nearestEmptyBlocks.length &&
        targets.find(
          (target) =>
            target.equals(nearestEmptyBlocks[i]) &&
            nearestEmptyBlocks[i].owner !== Owner.OPPONENT
        )
      ) {
        i += 1;
      }

      const nearestEmptyBlock =
        i < nearestEmptyBlocks.length
          ? nearestEmptyBlocks[i]
          : nearestEmptyBlocks[0];

      if (nearestEmptyBlock) {
        if (
          robot.distanceToBlock(nearestEmptyBlock) === 1 &&
          nearestEmptyBlock.owner === Owner.NONE
        )
          targets.push(nearestEmptyBlock);

        actions.push(
          new MoveAction(
            1,
            robot.x,
            robot.y,
            nearestEmptyBlock.x,
            nearestEmptyBlock.y
          )
        );
      }
    }
    const end = new Date().getTime() - start.getTime();
    if (debugTime) debug("RobotManager naive method time: %dms", end);
    return actions;
  }

  expandMethod() {
    debug("RobotManager - expand mode");
    const actions: Action[] = [];
    const targetX = Math.floor(width / 2);
    const targets = blocks.filter(
      (block) =>
        block.x === targetX && block.canMove && block.owner !== Owner.ME
    );
    const robotsToExtend = this.robotsToMove.filter(
      (robot) => side * (robot.x - targetX) < 0
    );
    do {
      const target = targets.shift()!;
      const { min: robot, index } = minBy(robotsToExtend, (robot) =>
        robot.distanceToBlock(target)
      );
      if (robot && index !== null) {
        const { x, y } = robot;
        const { y: targetY } = target;
        debug("MOVE", x, y, targetX, targetY);
        actions.push(new MoveAction(1, x, y, targetX, targetY));
        robotsToExtend.splice(index, 1);
        robot.hasMoved = true;
      }
    } while (targets.length && robotsToExtend.length);

    // while (targets.length && myMatter >= 10) {
    //   const target = targets.pop()!;
    //   const { min: nearestBlock } = minBy(myBlocks, (block) =>
    //     block.distanceToBlock(target)
    //   );
    //   if (nearestBlock) {
    //     const { x, y } = nearestBlock;
    //     actions.push(new SpawnAction(1, x, y));
    //     setMyMatter(myMatter - 10);
    //   }
    // }

    return actions;
  }

  action() {
    this.robotsToMove = Array.from(myRobots);
    const actions = [...this.naiveMethod()];
    return actions;
  }
}

export const robotManager = new RobotManager();
