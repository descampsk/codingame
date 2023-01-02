/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable class-methods-use-this */
import { Action, SpawnAction } from "./Actions";
import { Block } from "./Block";
import { ClassLogger } from "./ClassLogger";
import { computeManhattanDistance, debug, debugTime, minBy } from "./helpers";
import {
  map,
  myBlocks,
  myMatter,
  myStartPosition,
  notMyBlocks,
  opponentRobots,
  Owner,
  side,
} from "./State";

export class RobotBuilder extends ClassLogger {
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
    const sortingCriteria: Map<
      Block,
      {
        minToOpponent: number;
        minToNone: number;
        potential: number;
        neighborRobots: number;
      }
    > = new Map();
    for (const block of blocksToSpawn) {
      let minToNone = Infinity;
      let minToOpponent = Infinity;
      const { neighbors } = block;
      let neighborRobots = 0;
      for (const neighbor of neighbors) {
        if (neighbor.owner === Owner.ME) neighborRobots += neighbor.units;
        if (neighbor.owner === Owner.OPPONENT) minToOpponent = 1;
        if (neighbor.owner === Owner.NONE) minToNone = 1;
      }
      if (minToOpponent === Infinity) {
        for (const emptyBlock of notMyBlocks) {
          const distance = block.distanceToBlock(emptyBlock);
          if (emptyBlock.owner === Owner.OPPONENT) {
            if (distance < minToOpponent) {
              minToOpponent = distance;
            }
          } else if (distance < minToNone) {
            minToNone = distance;
          }
        }
      }
      const potentialRadius = 5;
      const potential = block.getPotentiel(potentialRadius);
      sortingCriteria.set(block, {
        minToNone,
        minToOpponent,
        potential,
        neighborRobots,
      });
    }
    blocksToSpawn.sort((a, b) => {
      const {
        minToNone: minToNoneA,
        minToOpponent: minToOpponentA,
        potential: potentialA,
        neighborRobots: neighborRobotsA,
      } = sortingCriteria.get(a)!;
      const {
        minToNone: minToNoneB,
        minToOpponent: minToOpponentB,
        potential: potentialB,
        neighborRobots: neighborRobotsB,
      } = sortingCriteria.get(b)!;

      // Ordre de priorité
      // - distance à une case ennemie
      // - distance à une case vide
      // - on prend le meilleur potentiel
      // - on prend celle qui a le moins d'unité sur la case
      // - on prend celui qui est le plus de l'autre côté
      if (minToOpponentA !== minToOpponentB)
        return minToOpponentA - minToOpponentB;
      if (minToOpponentA === Infinity && minToNoneA !== minToNoneB)
        return minToNoneA - minToNoneB;
      if (
        potentialA !== potentialB &&
        neighborRobotsA <= 3 &&
        neighborRobotsB <= 3
      )
        return potentialB - potentialA;
      if (neighborRobotsA !== neighborRobotsB)
        return neighborRobotsA - neighborRobotsB;
      return side * (b.x - a.x);
    });
    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`computeNormalSpawn time: ${end} ms`);
    return blocksToSpawn.slice(0, 3);
  }

  action() {
    const actions: Action[] = []; // this.computeDefensiveSpawn();
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
