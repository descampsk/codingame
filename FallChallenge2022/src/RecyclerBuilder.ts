/* eslint-disable class-methods-use-this */
import { Action, BuildAction } from "./Actions";
import { Block } from "./Block";
import { computeManhattanDistance, debug } from "./helpers";
import { Island } from "./Island";
import {
  dangerousOpponentRobots,
  debugTime,
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

  computeGains(block: Block) {
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
    return {
      gains: total,
      gainsPerTurn: total / scrapAmount,
    };
  }

  buildNaiveRecycler() {
    const actions: BuildAction[] = [];
    const possibleRecyclers = myBlocks
      .filter(
        (block) =>
          block.canBuild &&
          !this.isNearOfARecycler(block) &&
          this.computeGains(block).gains > 20 &&
          block.island?.owner !== Owner.ME
      )
      .sort((a, b) => {
        const { gains: gainA, gainsPerTurn: gainsPerTurnA } =
          this.computeGains(a);
        const { gains: gainB, gainsPerTurn: gainsPerTurnB } =
          this.computeGains(b);
        if (gainsPerTurnA !== gainsPerTurnB)
          return gainsPerTurnB - gainsPerTurnA;
        return gainB - gainA;
      });
    if (possibleRecyclers.length) {
      const recycler = possibleRecyclers[0];
      if (
        recycler &&
        turn % 2 === 0 &&
        (myRobots.length < 10 ||
          myRobots.length <= opponentRobots.length + 5) &&
        myMatter < 50
      ) {
        actions.push(new BuildAction(recycler.x, recycler.y));
        myRecyclers.push(recycler);
        setMyMatter(myMatter - 10);
      }
    }
    return actions;
  }

  buildDefensive() {
    const start = new Date();

    const actions: Action[] = [];
    const possibleRecyclers = myBlocks.filter((block) => block.canBuild);
    for (const block of possibleRecyclers) {
      for (const robot of opponentRobots) {
        if (
          ((Math.abs(robot.x - block.x) === 1 && robot.y === block.y) ||
            (Math.abs(robot.y - block.y) === 1 && robot.x === block.x)) &&
          myMatter >= 10 &&
          robot.units > 1
        ) {
          actions.push(new BuildAction(block.x, block.y));
          myRecyclers.push(block);
          setMyMatter(myMatter - 10);
          break;
        }
      }
    }
    const end = new Date().getTime() - start.getTime();
    if (debugTime) debug("buildDefensive time: %dms", end);
    return actions;
  }

  action() {
    const defensiveActions = this.buildDefensive();
    if (defensiveActions.length) {
      debug("defensiveBuild: ", defensiveActions.length);
      return defensiveActions;
    }
    return this.buildNaiveRecycler();
  }
}

export const recyclerBuilder = new RecyclerBuilder();
