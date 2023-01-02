/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-loop-func */
/* eslint-disable class-methods-use-this */
import { Action, MoveAction } from "./Actions";
import { Block } from "./Block";
import { ClassLogger } from "./ClassLogger";
import { computeManhattanDistance, debug, debugTime } from "./helpers";
import {
  myRobots,
  Owner,
  side,
  myStartPosition,
  opponentRobots,
  myMatter,
  opponentStartPosition,
  myBlocks,
} from "./State";

export class RobotManager extends ClassLogger {
  public robotsToMove: Block[] = [];

  naiveMethod() {
    const start = new Date();
    const actions: Action[] = [];

    const robotsToMove = myBlocks
      .filter((block) => block.units > 0 && block.hasMoved < block.units)
      .flatMap((robot) => robot.getOneRobotPerUnit());

    for (const robot of robotsToMove.filter((robot) => !robot.hasMoved)) {
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

          const distanceToMyStartA = myStartPosition.distanceToBlock(a);
          const distanceToMyStartB = myStartPosition.distanceToBlock(b);
          const distanceToOpponentStartA =
            opponentStartPosition.distanceToBlock(a);
          const distanceToOpponentStartB =
            opponentStartPosition.distanceToBlock(b);
          const isNearerOfMyStartA =
            distanceToMyStartA <= distanceToOpponentStartA;
          const isNearerOfMyStartB =
            distanceToMyStartB <= distanceToOpponentStartB;

          // Ordre de priorité
          // - si case ennemie, on tue les robots en premier si mon robot est plus proche de mon point de départ que celui de l'ennemie
          // - qui a le meilleur potentiel
          // - le plus éloigné de notre position de départ
          if (
            isNearerOfMyStartA &&
            isNearerOfMyStartB &&
            ((a.owner === Owner.OPPONENT && a.units > 0) ||
              (b.owner === Owner.OPPONENT && b.units > 0))
          )
            return (
              (b.owner === Owner.OPPONENT ? b.units : 0) -
              (a.owner === Owner.OPPONENT ? a.units : 0)
            );

          if (potentielA !== potentielB) return potentielB - potentielA;
          return side * (b.x - a.x);
        });

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
