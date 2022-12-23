/* eslint-disable class-methods-use-this */
import { Action, SpawnAction } from "./Actions";
import { Block } from "./Block";
import { debug } from "./helpers";
import {
  dangerousOpponentRobots,
  emptyBlocks,
  myBlocks,
  myMatter,
  notMyBlocks,
  opponentRobots,
  Owner,
  turn,
  width,
} from "./State";

export class RobotBuilder {
  computeExpensionSpawn() {
    const expensionRadius = 5;
    const possibleSpawns = myBlocks.filter(
      (block) => block.canSpawn && block.canMove
    );
    possibleSpawns.sort((a, b) => {
      const blocksAToExpand = emptyBlocks.filter(
        (block) => a.distanceToBlock(block) <= expensionRadius
      );
      const blocksBToExpand = emptyBlocks.filter(
        (block) => b.distanceToBlock(block) <= expensionRadius
      );

      return blocksBToExpand.length - blocksAToExpand.length;
    });
    debug("ExpensionSpawn:", possibleSpawns.length);
    return possibleSpawns;
  }

  computeNormalSpawn() {
    const blocksToSpawn = myBlocks.filter(
      (block) =>
        block.canSpawn &&
        (block.island?.owner !== Owner.ME || !block.island?.hasRobot)
    );
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
              a.distanceToBlock(opponentA) - a.distanceToBlock(opponentB)
          );
          distanceToNearestOpponentA = nearestOpponentA
            ? a.distanceToBlock(nearestOpponentA)
            : Infinity;
        }
        if (distanceB < minBToEmpty) {
          minBToEmpty = distanceB;
          nearestBBlockOwner = emptyBlock.owner;
          const [nearestOpponentB] = opponentRobots.sort(
            (opponentA, opponentB) =>
              b.distanceToBlock(opponentA) - b.distanceToBlock(opponentB)
          );
          distanceToNearestOpponentB = nearestOpponentB
            ? b.distanceToBlock(nearestOpponentB)
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
    return blocksToSpawn;
  }

  computeDefensiveSpawn() {
    const blocksToSpawn: Block[] = [];

    for (const robot of dangerousOpponentRobots) {
      for (const neighbor of robot.neighbors.filter(
        (block) => block.canSpawn
      )) {
        blocksToSpawn.push(neighbor);
      }
    }

    return blocksToSpawn;
  }

  action() {
    const actions: Action[] = [];

    // Ordre de priorité
    let blocksToSpawn: Block[] = [];
    if (turn < width / 2 - 3) blocksToSpawn = this.computeExpensionSpawn();
    else if (dangerousOpponentRobots.length)
      blocksToSpawn = this.computeDefensiveSpawn();
    else blocksToSpawn = this.computeNormalSpawn();

    let blockToSpawnIndex = 0;
    let predictedMatter = myMatter;
    while (predictedMatter >= 10 && blockToSpawnIndex < blocksToSpawn.length) {
      const blockToSpawn = blocksToSpawn[blockToSpawnIndex];
      actions.push(new SpawnAction(1, blockToSpawn.x, blockToSpawn.y));
      blockToSpawnIndex += 1;
      predictedMatter -= 10;
    }

    debug("RobotBuilder spawns", actions.length);

    return actions;
  }
}

export const robotBuilder = new RobotBuilder();
