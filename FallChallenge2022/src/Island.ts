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
    const hasMineRobot =
      this.blocks.findIndex(
        (block) => block.owner === Owner.ME && block.units > 0
      ) >= 0;
    const hasOpponentRobot =
      this.blocks.findIndex(
        (block) => block.owner === Owner.OPPONENT && block.units > 0
      ) >= 0;
    if (hasMineRobot && hasOpponentRobot) return Owner.BOTH;
    if (hasMineRobot) return Owner.ME;
    if (hasOpponentRobot) return Owner.OPPONENT;
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

  static findIslands() {
    let blockWithoutIsland = blocks.find(
      (block) => !block.island && block.canMove
    );
    const islands: Island[] = [];
    while (blockWithoutIsland) {
      const island = Island.createIsland(blockWithoutIsland);
      islands.push(island);
      blockWithoutIsland = blocks.find(
        (block) => !block.island && block.canMove
      );
    }
    return islands;
  }
}
