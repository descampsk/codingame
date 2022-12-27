/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-loop-func */
/* eslint-disable class-methods-use-this */
import { Action, MoveAction } from "./Actions";
import { Block } from "./Block";
import { debug } from "./helpers";
import { myRobots, Owner, side, debugTime } from "./State";

export class RobotManager {
  public robotsToMove: Block[] = [];

  private SHOULD_DEBUG = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private debug(...data: any[]) {
    if (this.SHOULD_DEBUG) debug("[RobotManager]", ...data);
  }

  naiveMethod() {
    const start = new Date();
    const actions: Action[] = [];

    for (const robot of this.robotsToMove.filter((robot) => !robot.hasMoved)) {
      const nearestEmptyBlocks = robot.neighbors
        .sort((a, b) => {
          const potentielRadius =
            robot.island?.owner === Owner.ME ? Infinity : 5;
          const potentielA = a.getPotentiel(potentielRadius);
          const potentielB = b.getPotentiel(potentielRadius);

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

      const nearestEmptyBlock = nearestEmptyBlocks[0];

      if (nearestEmptyBlock) {
        actions.push(new MoveAction(1, robot, nearestEmptyBlock));
      }
    }
    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug("naiveMethod time: %dms", end);
    return actions;
  }

  action() {
    this.robotsToMove = Array.from(myRobots);
    const actions = [...this.naiveMethod()];
    return actions;
  }
}

export const robotManager = new RobotManager();
