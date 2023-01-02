/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-useless-constructor */
import { Block } from "./Block";
import { ClassLogger } from "./ClassLogger";
import { debug, debugTime } from "./helpers";
import { Owner } from "./State";

export class Island extends ClassLogger {
  public blocks: Block[] = [];

  public get size() {
    return this.blocks.length;
  }

  public get hasRobot(): boolean {
    for (const block of this.blocks) {
      if (block.units > 0) return true;
    }
    return false;
  }

  public get owner(): Owner {
    const hasMineBlock =
      this.blocks.findIndex(
        (block) => block.owner === Owner.ME && block.canSpawn
      ) >= 0;
    const hasOpponentBlock =
      this.blocks.findIndex(
        (block) => block.owner === Owner.OPPONENT && block.units > 0
      ) >= 0;
    if (hasMineBlock && hasOpponentBlock) return Owner.BOTH;
    if (hasMineBlock) return Owner.ME;
    if (hasOpponentBlock) return Owner.OPPONENT;
    return Owner.NONE;
  }

  static createIsland(start: Block) {
    const island = new Island();
    const nextBlocks = [start];
    while (nextBlocks.length) {
      const nextBlock = nextBlocks.pop()!;
      island.blocks.push(nextBlock);
      nextBlock.island = island;
      const neighbors = nextBlock.neighbors.filter(
        (neighbor) => !neighbor.island
      );
      if (neighbors.length) nextBlocks.push(...neighbors);
    }
    return island;
  }

  static findIslands(map: Block[][]) {
    const start = new Date();

    const flapMap = map.flat();
    let blockWithoutIsland = flapMap.find(
      (block) => !block.island && block.canMove
    );
    const islands: Island[] = [];
    while (blockWithoutIsland) {
      const island = Island.createIsland(blockWithoutIsland);
      islands.push(island);
      blockWithoutIsland = flapMap.find(
        (block) => !block.island && block.canMove
      );
    }

    // debug(
    //   "[Islands]",
    //   islands.length,
    //   islands.map((island) => ({
    //     size: island.size,
    //     owner: island.owner,
    //     origin: [island.blocks[0].x, island.blocks[0].y],
    //   }))
    // );

    const end = new Date().getTime() - start.getTime();
    if (debugTime) debug("findIslands time: %dms", end);
    return islands;
  }
}
