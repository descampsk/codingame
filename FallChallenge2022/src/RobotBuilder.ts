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
      let minAToEmpty = 100000;
      let minBToEmpty = 100000;
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
      // Ordre de priorité
      // - distance à une casse qui ne m'appartient pas
      // - à distance égale, on prend une case ennemie
      // - à case ennemie égale, on prend celle où y a le plus d'unité ennemies à côté - TODO
      // - à nombre d'ennemies égale, on prend celle qui a le moins d'unité
      // - à unité égale on prend celle qui est le plus de l'autre côté du début
      if (minAToEmpty !== minBToEmpty) return minAToEmpty - minBToEmpty;
      if (nearestABlockOwner !== nearestBBlockOwner)
        return nearestBBlockOwner - nearestABlockOwner;
      // TODO - checker le nombre d'unités proche
      if (a.units !== b.units) return a.units - b.units;
      return side * (b.position.x - a.position.x);
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
