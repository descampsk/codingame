/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-useless-constructor */
import { Block } from "./Block";
import { debug } from "./helpers";
import { blocks, Owner } from "./State";

export class Island {
  public blocks: Block[] = [];

  constructor() {}

  public get size() {
    return this.blocks.length;
  }

  public get owner(): Owner {
    const hasMineBlock =
      this.blocks.findIndex((block) => block.owner === Owner.ME) >= 0;
    const hasOpponentBlock =
      this.blocks.findIndex((block) => block.owner === Owner.OPPONENT) >= 0;
    if (hasMineBlock && hasOpponentBlock) return Owner.NONE;
    if (hasMineBlock) return Owner.ME;
    if (hasOpponentBlock) return Owner.OPPONENT;
    return Owner.NONE;
  }

  static findIslands() {
    let blockWithoutIsland = blocks.find(
      (block) => !block.island && block.canMove
    );
    const islands: Island[] = [];
    while (blockWithoutIsland) {
      const island = new Island();
      const nextBlocks = [blockWithoutIsland];
      while (nextBlocks.length) {
        const nextBlock = nextBlocks.pop()!;
        island.blocks.push(nextBlock);
        nextBlock.island = island;
        const neighbors = nextBlock.neighbors.filter(
          (neighbor) => !neighbor.island
        );
        if (neighbors.length) nextBlocks.push(...neighbors);
      }
      islands.push(island);
      blockWithoutIsland = blocks.find(
        (block) => !block.island && block.canMove
      );
    }
    return islands;
  }
}
