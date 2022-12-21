/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-loop-func */
/* eslint-disable class-methods-use-this */
import { Action, MoveAction, SpawnAction } from "./Actions";
import { Block } from "./Block";
import { debug, minBy } from "./helpers";
import {
  height,
  map,
  myRobots,
  notMyBlocks,
  Owner,
  side,
  width,
  blocks,
  myMatter,
  myBlocks,
  setMyMatter,
} from "./State";

export class RobotManager {
  public robotsToMove: Block[] = [];

  naiveMethod() {
    debug("RobotManager - naive mode");
    const actions: Action[] = [];
    const targets: Block[] = [];

    // UpRobot va aller tout en haut et downRobot tout en bas jusqu'à ce qu'on ait au moins une case sur toutes les lignes
    // To improve
    // if (!map[0].find((block) => block.owner === Owner.ME)) {
    //   const upRobot = myRobots.sort((a, b) => {
    //     if (a.position.y !== b.position.y) return a.position.y - b.position.y;
    //     return side * (b.position.x - a.position.x);
    //   })[0];
    //   const { x, y } = upRobot.position;
    //   targets.push(map[y - 1][x]);
    //   actions.push(new MoveAction(1, x, y, x, y - 1));
    // }
    // if (!map[height - 1].find((block) => block.owner === Owner.ME)) {
    //   const downRobot = myRobots.sort((a, b) => {
    //     if (a.position.y !== b.position.y) return b.position.y - a.position.y;
    //     return side * (b.position.x - a.position.x);
    //   })[0];
    //   const { x, y } = downRobot.position;
    //   targets.push(map[y + 1][x]);
    //   actions.push(new MoveAction(1, x, y, x, y + 1));
    // }

    for (const robot of this.robotsToMove.filter((robot) => !robot.hasMoved)) {
      const nearestEmptyBlocks = notMyBlocks
        .sort((a, b) => {
          const distanceA = robot.distanceToBlock(a);
          const distanceB = robot.distanceToBlock(b);

          // Ordre de priorité
          // - block le plus proche
          // - ennemie avant vide
          // - le plus éloigné de notre position de départ
          if (distanceA !== distanceB) return distanceA - distanceB;
          if (a.owner !== b.owner) return b.owner - a.owner;
          return side * (b.x - a.x);
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

      if (robot.distanceToBlock(nearestEmptyBlock) === 1)
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
    return actions;
  }

  //   shouldExpand() {
  //     const targetX = Math.floor(width / 2);
  //     const targets = blocks.filter(
  //       (block) =>
  //         block.position.x === targetX &&
  //         block.owner === Owner.NONE &&
  //         block.canMove
  //     );
  //     debug("Expansion:", targets.length, height);
  //     return targets.length > height / 3;
  //   }

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

    while (targets.length && myMatter >= 10) {
      const target = targets.pop()!;
      const { min: nearestBlock } = minBy(myBlocks, (block) =>
        block.distanceToBlock(target)
      );
      if (nearestBlock) {
        const { x, y } = nearestBlock;
        actions.push(new SpawnAction(1, x, y));
        setMyMatter(myMatter - 10);
      }
    }

    return actions;
  }

  action() {
    this.robotsToMove = Array.from(myRobots);
    const actions = [...this.naiveMethod()];
    return actions;
  }
}

export const robotManager = new RobotManager();
