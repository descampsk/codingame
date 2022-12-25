/* eslint-disable class-methods-use-this */
import { Action, SpawnAction } from "./Actions";
import { Block } from "./Block";
import { debug } from "./helpers";
import {
  myBlocks,
  myMatter,
  notMyBlocks,
  opponentRobots,
  Owner,
  side,
} from "./State";

export class RobotBuilder {
  computeNormalSpawn() {
    const blocksToSpawn = myBlocks.filter(
      (block) =>
        block.canSpawn &&
        (block.island?.owner !== Owner.ME || !block.island?.hasRobot) &&
        block.willBecomeGrass > 1 &&
        block.neighbors.find((a) => a.owner !== Owner.ME)
    );
    debug("possibleSpawn", blocksToSpawn.length);
    blocksToSpawn.sort((a, b) => {
      let minAToEmpty = Infinity;
      let minBToEmpty = Infinity;
      let nearestABlock = a;
      let nearestBBlock = b;
      for (const emptyBlock of notMyBlocks) {
        const distanceA = a.distanceToBlock(emptyBlock);
        const distanceB = b.distanceToBlock(emptyBlock);
        if (distanceA < minAToEmpty) {
          minAToEmpty = distanceA;
          nearestABlock = emptyBlock;
        }
        if (distanceB < minBToEmpty) {
          minBToEmpty = distanceB;
          nearestBBlock = emptyBlock;
        }
      }

      const distanceToNearestOpponentA = opponentRobots.reduce(
        (distance, opponent) => {
          const newDistance = a.distanceToBlock(opponent);
          return newDistance < distance ? newDistance : distance;
        },
        Infinity
      );
      const distanceToNearestOpponentB = opponentRobots.reduce(
        (distance, opponent) => {
          const newDistance = b.distanceToBlock(opponent);
          return newDistance < distance ? newDistance : distance;
        },
        Infinity
      );

      const interrestingANeighbors = a.neighbors.filter(
        (block) => block.owner !== Owner.ME
      ).length;
      const interrestingBNeighbors = b.neighbors.filter(
        (block) => block.owner !== Owner.ME
      ).length;

      const potentielRadius = 5;
      const potentielA = a.getPotentiel(potentielRadius);
      const potentielB = b.getPotentiel(potentielRadius);

      // Ordre de priorité
      // - distance à une casse qui ne m'appartient pas
      // - à distance égale, on prend une case ennemie
      // - à case ennemie égale, on prend celle qui est le plus proche des ennemies
      // - à distance égale des ennemies, on prend celui qui a le plus de voisins
      // - à nombre de voisins égals, on prend celle qui a le moins d'unité sur la case
      // - à nombre d'unités égale, on prend celui qui a le meilleur potentiel
      if (minAToEmpty !== minBToEmpty) return minAToEmpty - minBToEmpty;
      if (nearestABlock.owner !== nearestBBlock.owner)
        return nearestABlock.compareOwner(nearestBBlock);
      if (
        distanceToNearestOpponentA !== distanceToNearestOpponentB &&
        (distanceToNearestOpponentA === 1 || distanceToNearestOpponentB === 1)
      )
        return distanceToNearestOpponentA - distanceToNearestOpponentB;
      if (interrestingANeighbors !== interrestingBNeighbors)
        return interrestingBNeighbors - interrestingANeighbors;
      if (potentielA !== potentielB) return potentielB - potentielA;
      if (a.units !== b.units) return a.units - b.units;
      return side * (b.x - a.x);
    });
    return blocksToSpawn;
  }

  action() {
    const actions: Action[] = [];
    const blocksToSpawn: Block[] = this.computeNormalSpawn();

    let blockToSpawnIndex = 0;
    let predictedMatter = myMatter;
    while (predictedMatter >= 10 && blocksToSpawn[blockToSpawnIndex]) {
      const blockToSpawn = blocksToSpawn[blockToSpawnIndex];
      actions.push(new SpawnAction(1, blockToSpawn.x, blockToSpawn.y));
      blockToSpawnIndex += 1;
      if (blockToSpawnIndex === blocksToSpawn.length) blockToSpawnIndex = 0;
      predictedMatter -= 10;
    }

    debug("RobotBuilder spawns", actions.length);

    return actions;
  }
}

export const robotBuilder = new RobotBuilder();
