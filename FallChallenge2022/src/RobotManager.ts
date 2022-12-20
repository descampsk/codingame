/* eslint-disable no-loop-func */
/* eslint-disable class-methods-use-this */
import { Action, MoveAction } from "./Actions";
import { Block } from "./Block";
import { debug } from "./helpers";
import { height, map, myRobots, notMyBlocks, Owner, side } from "./State";

export class RobotManager {
  action() {
    debug("RobotManager action");
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

    for (const robot of myRobots) {
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
          return side * (b.position.x - a.position.x);
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
