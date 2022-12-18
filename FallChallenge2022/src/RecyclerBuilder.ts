/* eslint-disable class-methods-use-this */
import { BuildAction } from "./Actions";
import { computeManhattanDistance, debug } from "./helpers";
import {
  Block,
  blocks,
  height,
  map,
  myBlocks,
  myRecyclers,
  width,
} from "./State";

export class RecyclerBuilder {
  isNearOfARecycler(block: Block) {
    for (const recycler of myRecyclers) {
      if (computeManhattanDistance(recycler, block) < 3) {
        return true;
      }
    }
    return false;
  }

  computeTotalGain(block: Block) {
    const nearCoordinates = [[-1, 0], [1, 0], [0, 1], [0 - 1]];
    const { scrapAmount } = block;
    let total = scrapAmount;
    for (const nearCoordinate of nearCoordinates) {
      const [x, y] = nearCoordinate;
      const nearBlockX = block.position.x + x;
      const nearBlockY = block.position.y + y;
      if (
        nearBlockX >= 0 &&
        nearBlockX < width &&
        nearBlockY >= 0 &&
        nearBlockY < height
      ) {
        const nearBlock = map[block.position.y + y][block.position.x + x];
        total +=
          nearBlock.scrapAmount > scrapAmount
            ? scrapAmount
            : nearBlock.scrapAmount;
      }
    }
    // debug("computeTotalGain", total, block.position);
    return total;
  }

  action() {
    const actions: BuildAction[] = [];
    debug("RecyclerBuilder action");
    for (const block of myBlocks) {
      if (
        block.canBuild &&
        !this.isNearOfARecycler(block) &&
        this.computeTotalGain(block) > 15
      ) {
        actions.push(new BuildAction(block.position.x, block.position.y));
        myRecyclers.push(block);
      }
    }
    return actions;
  }
}

export const recyclerBuilder = new RecyclerBuilder();
