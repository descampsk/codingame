/* eslint-disable class-methods-use-this */
import { BuildAction } from "./Actions";
import { Block } from "./Block";
import { computeManhattanDistance, debug } from "./helpers";
import { Island } from "./Island";
import {
  dangerousOpponentRobots,
  height,
  map,
  myBlocks,
  myMatter,
  myRecyclers,
  myRobots,
  opponentBlocks,
  opponentRecyclers,
  opponentRobots,
  Owner,
  setMyMatter,
  turn,
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

  isAhead() {
    return (
      myBlocks.length >= opponentBlocks.length &&
      myRecyclers.length >= opponentRecyclers.length &&
      myRobots.length >= opponentRobots.length
    );
  }

  computeTotalGain(block: Block) {
    const nearCoordinates = [[-1, 0], [1, 0], [0, 1], [0 - 1]];
    const { scrapAmount } = block;
    let total = scrapAmount;
    for (const nearCoordinate of nearCoordinates) {
      const [x, y] = nearCoordinate;
      const nearBlockX = block.x + x;
      const nearBlockY = block.y + y;
      if (
        nearBlockX >= 0 &&
        nearBlockX < width &&
        nearBlockY >= 0 &&
        nearBlockY < height
      ) {
        const nearBlock = map[block.y + y][block.x + x];
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
    const possibleRecyclers = myBlocks
      .filter(
        (block) =>
          block.canBuild &&
          !this.isNearOfARecycler(block) &&
          this.computeTotalGain(block) > 20 &&
          block.island?.owner !== Owner.ME
      )
      .sort((a, b) => {
        const gainA = this.computeTotalGain(a);
        const gainB = this.computeTotalGain(b);
        if (gainA !== gainB) return gainB - gainA;
        return a.neighbors.length - b.neighbors.length;
      });
    if (possibleRecyclers.length) {
      const recycler = possibleRecyclers[0];
      if (recycler && turn % 2 === 0) {
        actions.push(new BuildAction(recycler.x, recycler.y));
        myRecyclers.push(recycler);
        setMyMatter(myMatter - 10);
      }
    }
    return actions;
  }
}

export const recyclerBuilder = new RecyclerBuilder();
