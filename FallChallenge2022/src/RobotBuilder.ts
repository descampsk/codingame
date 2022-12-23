/* eslint-disable class-methods-use-this */
import { Action, SpawnAction } from "./Actions";
import { Block } from "./Block";
import { debug } from "./helpers";
import {
  dangerousOpponentRobots,
  debugTime,
  emptyBlocks,
  height,
  map,
  myBlocks,
  myMatter,
  myRobots,
  notMyBlocks,
  opponentRobots,
  Owner,
  turn,
  width,
} from "./State";

export class RobotBuilder {
  public isExtensionDone = false;

  checkExtensionDone() {
    if (this.isExtensionDone) {
      debug("Extension is done");
      return true;
    }
    debug("Extension in progress");
    for (const robot of myRobots) {
      for (const neighbor of robot.neighbors) {
        if (neighbor.owner === Owner.OPPONENT && neighbor.units > 0) {
          this.isExtensionDone = true;
          return true;
        }
      }
    }
    for (let i = 0; i < height; i++) {
      if (!map[i].find((block) => block.owner === Owner.ME)) return false;
    }
    this.isExtensionDone = true;
    return true;
  }

  computeExpensionSpawn() {
    const start = new Date();
    const expensionRadius = 5;
    const possibleSpawns = myBlocks.filter(
      (block) =>
        block.canSpawn &&
        block.canMove &&
        block.neighbors.find((a) => a.owner !== Owner.ME) &&
        block.units < 2
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
    const end = new Date().getTime() - start.getTime();
    if (debugTime) debug("computeExpensionSpawn time: %dms", end);
    return possibleSpawns;
  }

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
      let nearestABlockOwner = Owner.NONE;
      let nearestBBlockOwner = Owner.NONE;
      for (const emptyBlock of notMyBlocks) {
        const distanceA = a.distanceToBlock(emptyBlock);
        const distanceB = b.distanceToBlock(emptyBlock);
        if (distanceA < minAToEmpty) {
          minAToEmpty = distanceA;
          nearestABlockOwner = emptyBlock.owner;
        }
        if (distanceB < minBToEmpty) {
          minBToEmpty = distanceB;
          nearestBBlockOwner = emptyBlock.owner;
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
      if (nearestABlockOwner !== nearestBBlockOwner)
        return nearestBBlockOwner - nearestABlockOwner;
      if (
        distanceToNearestOpponentA !== distanceToNearestOpponentB &&
        (distanceToNearestOpponentA === 1 || distanceToNearestOpponentB === 1)
      )
        return distanceToNearestOpponentA - distanceToNearestOpponentB;
      if (interrestingANeighbors !== interrestingBNeighbors)
        return interrestingBNeighbors - interrestingANeighbors;
      if (a.units !== b.units) return a.units - b.units;
      return potentielB - potentielA;
    });
    return blocksToSpawn;
  }

  computeDefensiveSpawn() {
    debug("computeDefensiveSpawn");
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
    // if (dangerousOpponentRobots.length)
    //   blocksToSpawn = this.computeDefensiveSpawn();
    // else
    // if (!this.checkExtensionDone())
    //   blocksToSpawn = this.computeExpensionSpawn();
    blocksToSpawn = this.computeNormalSpawn();

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
