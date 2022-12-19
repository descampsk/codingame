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
    const possibleRecyclers = myBlocks.filter(
      (block) =>
        block.canBuild &&
        !this.isNearOfARecycler(block) &&
        this.computeTotalGain(block) > 20 &&
        block.island?.owner !== Owner.ME &&
        !this.isAhead()
      // !dangerousOpponentRobots.length
    );
    if (possibleRecyclers.length) {
      let createBadIsland = false;
      let recycler = possibleRecyclers[0];
      do {
        createBadIsland = false;
        recycler.recycler = true;
        for (const neighbor of recycler.neighbors) {
          const island = Island.createIsland(neighbor);
          if (island.owner === Owner.NONE) {
            debug("island: ", neighbor.position, island.owner, island.size);
            createBadIsland = true;
            break;
          }
        }
        recycler.recycler = false;
        recycler = possibleRecyclers.shift() as Block;
      } while (possibleRecyclers.length && createBadIsland === true);

      if (recycler) {
        actions.push(new BuildAction(recycler.position.x, recycler.position.y));
        myRecyclers.push(recycler);
        setMyMatter(myMatter - 10);
      }
    }
    return actions;
  }
}

export const recyclerBuilder = new RecyclerBuilder();
