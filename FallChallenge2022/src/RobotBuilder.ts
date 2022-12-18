/* eslint-disable class-methods-use-this */
import { Action, SpawnAction } from "./Actions";
import { debug } from "./helpers";
import {
  myBlocks,
  myMatter,
  myRobots,
  notMyBlocks,
  opponentRobots,
  Owner,
  side,
} from "./State";

export class RobotBuilder {
  action() {
    debug("RobotBuilder action");
    const actions: Action[] = [];

    const blocksToSpawn = myBlocks.filter((block) => block.canSpawn);
    blocksToSpawn.sort((a, b) => {
      let minAToEmpty = Infinity;
      let minBToEmpty = Infinity;
      let nearestABlockOwner = Owner.NONE;
      let nearestBBlockOwner = Owner.NONE;
      let distanceToNearestOpponentA = Infinity;
      let distanceToNearestOpponentB = Infinity;
      for (const emptyBlock of notMyBlocks) {
        const distanceA = a.distanceToBlock(emptyBlock);
        const distanceB = b.distanceToBlock(emptyBlock);
        if (distanceA < minAToEmpty) {
          minAToEmpty = distanceA;
          nearestABlockOwner = emptyBlock.owner;
          const [nearestOpponentA] = opponentRobots.sort(
            (opponentA, opponentB) =>
              opponentA.distanceToBlock(a) - opponentB.distanceToBlock(a)
          );
          distanceToNearestOpponentA = nearestOpponentA
            ? nearestOpponentA.distanceToBlock(a)
            : Infinity;
        }
        if (distanceB < minBToEmpty) {
          minBToEmpty = distanceB;
          nearestBBlockOwner = emptyBlock.owner;
          const [nearestOpponentB] = opponentRobots.sort(
            (opponentA, opponentB) =>
              opponentA.distanceToBlock(b) - opponentB.distanceToBlock(b)
          );
          distanceToNearestOpponentB = nearestOpponentB
            ? nearestOpponentB.distanceToBlock(b)
            : Infinity;
        }
      }

      const interrestingANeighbors = a.neighbors.filter(
        (block) => block.owner !== Owner.ME
      ).length;
      const interrestingBNeighbors = b.neighbors.filter(
        (block) => block.owner !== Owner.ME
      ).length;

      // Ordre de priorité
      // - distance à une casse qui ne m'appartient pas
      // - à distance égale, on prend une case ennemie
      // - à case ennemie égale, on prend celle qui est le plus proche des ennemies
      // - à distance égale des ennemies, on prend celui qui a le plus de voisins
      // - à nombre de voisins égals, on prend celle qui a le moins d'unité sur la case
      if (minAToEmpty !== minBToEmpty) return minAToEmpty - minBToEmpty;
      if (nearestABlockOwner !== nearestBBlockOwner)
        return nearestBBlockOwner - nearestABlockOwner;
      if (distanceToNearestOpponentA !== distanceToNearestOpponentB)
        return distanceToNearestOpponentA - distanceToNearestOpponentB;
      if (interrestingANeighbors !== interrestingBNeighbors)
        return interrestingBNeighbors - interrestingANeighbors;
      return a.units - b.units;
    });

    let blockToSpawnIndex = 0;
    let predictedMatter = myMatter;
    while (predictedMatter >= 10 && blockToSpawnIndex < blocksToSpawn.length) {
      const blockToSpawn = blocksToSpawn[blockToSpawnIndex];
      actions.push(
        new SpawnAction(1, blockToSpawn.position.x, blockToSpawn.position.y)
      );
      blockToSpawnIndex += 1;
      predictedMatter -= 10;
    }

    debug("RobotBuilder spawns", actions.length);

    return actions;
  }
}

export const robotBuilder = new RobotBuilder();
