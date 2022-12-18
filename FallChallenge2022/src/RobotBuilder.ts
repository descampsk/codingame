/* eslint-disable class-methods-use-this */
import { Action, SpawnAction } from "./Actions";
import { computeManhattanDistance, debug } from "./helpers";
import { myBlocks, myMatter, notMyBlocks, side } from "./State";

export class RobotBuilder {
  action() {
    debug("RobotBuilder action");
    const actions: Action[] = [];

    const blocksToSpawn = myBlocks.filter((block) => block.canSpawn);
    blocksToSpawn.sort((a, b) => {
      let minAToEmpty = 100000;
      let minBToEmpty = 100000;
      for (const emptyBlock of notMyBlocks) {
        const distanceA = computeManhattanDistance(a, emptyBlock);
        const distanceB = computeManhattanDistance(b, emptyBlock);
        if (distanceA < minAToEmpty) minAToEmpty = distanceA;
        if (distanceB < minBToEmpty) minBToEmpty = distanceB;
      }
      if (minAToEmpty === minBToEmpty && a.units === b.units)
        return side * (b.position.x - a.position.x);
      if (minAToEmpty === minBToEmpty) return a.units - b.units;
      return minAToEmpty - minBToEmpty;
    });

    let blockToSpawnIndex = 0;
    let predictedMatter = myMatter;
    while (predictedMatter >= 20 && blockToSpawnIndex < blocksToSpawn.length) {
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
