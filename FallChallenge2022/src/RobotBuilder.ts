/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable class-methods-use-this */
import { Action, SpawnAction } from "./Actions";
import { Block } from "./Block";
import { computeManhattanDistance, debug, minBy } from "./helpers";
import {
  debugTime,
  map,
  myBlocks,
  myMatter,
  myStartPosition,
  notMyBlocks,
  opponentRobots,
  Owner,
  side,
} from "./State";

export class RobotBuilder {
  private SHOULD_DEBUG = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private debug(...data: any[]) {
    if (this.SHOULD_DEBUG) debug("[RobotBuilder]", ...data);
  }

  computeDefensiveSpawn() {
    const start = new Date();

    const actions: SpawnAction[] = [];
    // On sort sur les cases qui sont le plus proche de mon départ car ce sont celles à défendre en premier
    const blocksToSpawn = myBlocks
      .filter(
        (block) =>
          block.canSpawn &&
          (block.island?.owner !== Owner.ME || !block.island?.hasRobot) &&
          block.willBecomeGrass > 1 &&
          block.neighbors.find((a) => a.owner !== Owner.ME)
      )
      .sort(
        (a, b) =>
          computeManhattanDistance(a, myStartPosition) -
          computeManhattanDistance(b, myStartPosition)
      );
    for (const block of blocksToSpawn) {
      for (const robot of opponentRobots) {
        // debug(
        //   "BlockUnits",
        //   [block.x, block.y],
        //   block.units,
        //   myMatter,
        //   [robot.x, robot.y],
        //   robot.units
        // );
        if (
          side * (robot.x - block.x) === 1 &&
          robot.y === block.y &&
          robot.units - block.units > 0
        ) {
          if (myMatter >= 10 * (robot.units - block.units)) {
            this.debug(
              `DefenseSpawn of ${robot.units - block.units} on ${block.x},${
                block.y
              }`
            );
            actions.push(new SpawnAction(robot.units - block.units, block));
          } else {
            this.debug(
              `Wont defend on ${block.x},${block.y} because we cant build of ${
                robot.units - block.units
              } units`
            );
            block.canSpawn = false;
          }
        }
      }
    }
    this.debug(
      "computeDefensiveSpawn",
      actions.length,
      actions.map((action) => [action.block.x, action.block.y])
    );
    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`computeDefensiveSpawn time: ${end} ms`);
    return actions;
  }

  computeNormalSpawn() {
    const start = new Date();
    // On spawn que si le block adjacent a au moins un voisin vide ou ennemi
    const blocksToSpawn = myBlocks.filter(
      (block) =>
        block.canSpawn &&
        (block.island?.owner !== Owner.ME || !block.island?.hasRobot) &&
        block.willBecomeGrass > 1 &&
        block.neighbors.find((a) => a.owner !== Owner.ME)
    );
    this.debug(
      "possibleSpawn",
      blocksToSpawn.length,
      blocksToSpawn.map((block) => [block.x, block.y])
    );
    blocksToSpawn.sort((a, b) => {
      let minAToNone = Infinity;
      let minBToNone = Infinity;
      let minAToOpponent = Infinity;
      let minBToOpponent = Infinity;
      for (const emptyBlock of notMyBlocks) {
        const distanceA = a.distanceToBlock(emptyBlock);
        const distanceB = b.distanceToBlock(emptyBlock);
        if (emptyBlock.owner === Owner.OPPONENT) {
          if (distanceA < minAToOpponent) {
            minAToOpponent = distanceA;
          }
          if (distanceB < minBToOpponent) {
            minBToOpponent = distanceB;
          }
        } else {
          if (distanceA < minAToNone) {
            minAToNone = distanceA;
          }
          if (distanceB < minBToNone) {
            minBToNone = distanceB;
          }
        }
      }

      const potentielRadius = 5;
      const potentielA = a.getPotentiel(potentielRadius);
      const potentielB = b.getPotentiel(potentielRadius);

      // Ordre de priorité
      // - distance à une case ennemie
      // - distance à une case vide
      // - on prend le meilleur potentiel
      // - on prend celle qui a le moins d'unité sur la case
      // - on prend celui qui est le plus de l'autre côté
      if (minAToOpponent !== minBToOpponent)
        return minAToOpponent - minBToOpponent;
      if (minAToOpponent === Infinity && minAToNone !== minBToNone)
        return minAToNone - minBToNone;
      if (potentielA !== potentielB) return potentielB - potentielA;
      if (a.units !== b.units) return a.units - b.units;
      return side * (b.x - a.x);
    });
    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`computeNormalSpawn time: ${end} ms`);
    return blocksToSpawn;
  }

  action() {
    const actions: Action[] = this.computeDefensiveSpawn();
    const blocksToSpawn: Block[] = this.computeNormalSpawn();

    let blockToSpawnIndex = 0;
    while (myMatter >= 10 && blocksToSpawn[blockToSpawnIndex]) {
      const blockToSpawn = blocksToSpawn[blockToSpawnIndex];
      actions.push(new SpawnAction(1, blockToSpawn));
      blockToSpawnIndex += 1;
      if (blockToSpawnIndex === blocksToSpawn.length) blockToSpawnIndex = 0;
    }

    this.debug("Spawns", actions.length);

    return actions;
  }
}

export const robotBuilder = new RobotBuilder();
