/* eslint-disable class-methods-use-this */
import { Action, BuildAction } from "./Actions";
import { Block } from "./Block";
import { expensionManager } from "./ExpensionManager";
import { Island } from "./Island";
import { computeManhattanDistance, debug } from "./helpers";
import {
  blocks,
  debugTime,
  height,
  islands,
  map,
  myBlocks,
  myMatter,
  myRecyclers,
  myRobots,
  myStartPosition,
  opponentBlocks,
  opponentRecyclers,
  opponentRobots,
  Owner,
  side,
  turn,
  width,
} from "./State";
import { ia } from "./IA";

export class RecyclerBuilder {
  private hasBuildLastRound = false;

  private SHOULD_DEBUG = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private debug(...data: any[]) {
    if (this.SHOULD_DEBUG) debug("[RecyclerBuilder]", ...data);
  }

  isNearOfARecycler(block: Block) {
    for (const recycler of myRecyclers) {
      if (computeManhattanDistance(recycler, block) < 3) {
        return true;
      }
    }
    return false;
  }

  computeGains(block: Block) {
    const nearCoordinates = [
      [-1, 0],
      [1, 0],
      [0, 1],
      [0, -1],
    ];
    const { scrapAmount } = block;
    let total = scrapAmount;
    let grassCreated = 1;
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
        if (nearBlock.scrapAmount <= scrapAmount) grassCreated += 1;
      }
    }
    // debug("computeTotalGain", total, block.position);
    return {
      gains: total,
      gainsPerTurn: total / scrapAmount,
      grassCreated,
    };
  }

  willCreateNewIsland(block: Block) {
    const copyMap = Block.createCopyOfMap(map);
    copyMap[block.y][block.x].recycler = true;
    for (const neighbor of block.neighbors) {
      if (neighbor.scrapAmount <= block.scrapAmount) {
        copyMap[neighbor.y][neighbor.x].scrapAmount = 0;
      }
    }
    copyMap.flat().forEach((block) => block.updateNeighbors(copyMap));
    const newIslands = Island.findIslands(copyMap);
    if (newIslands.length === islands.length) {
      this.debug(
        `Recycler on ${block.x},${block.y} will not create a new island`,
        {
          newIslands: newIslands.map((i) => [i.blocks[0].x, i.blocks[0].y]),
          islands: islands.map((i) => [i.blocks[0].x, i.blocks[0].y]),
        }
      );
      return false;
    }

    for (const island of newIslands) {
      if (
        island.owner === Owner.NONE &&
        !islands.find(
          (i) => i.blocks[0].equals(island.blocks[0]) && i.size === island.size
        )
      ) {
        this.debug(
          `Recycler on ${block.x},${block.y} will create a new island without block we own`,
          {
            island: {
              owner: island.owner,
              origin: `${island.blocks[0].x},${island.blocks[0].y}`,
              size: island.size,
            },
            newIslands: newIslands.map((i) => ({
              owner: i.owner,
              origin: `${i.blocks[0].x},${i.blocks[0].y}`,
              size: i.size,
            })),
            islands: islands.map((i) => ({
              owner: i.owner,
              origin: `${i.blocks[0].x},${i.blocks[0].y}`,
              size: i.size,
            })),
          }
        );
        return true;
      }
    }
    this.debug(
      `Recycler on ${block.x},${block.y} will create a new island but we can spawn on it`,
      {
        newIslands: newIslands.map((i) => ({
          owner: i.owner,
          origin: `${i.blocks[0].x},${i.blocks[0].y}`,
          size: i.size,
        })),
        islands: islands.map((i) => ({
          owner: i.owner,
          origin: `${i.blocks[0].x},${i.blocks[0].y}`,
          size: i.size,
        })),
      }
    );
    return false;
  }

  shouldBuildNaiveRecycler() {
    const notGrassBlocks = blocks.filter((block) => !block.isGrass);
    const should =
      turn > 2 &&
      !this.hasBuildLastRound &&
      (notGrassBlocks.length >= 80 ||
        opponentRecyclers.length > myRecyclers.length ||
        ia.turnsWithSameScore > 10) &&
      (myRobots.length < 10 || myRobots.length <= opponentRobots.length + 5) &&
      // Lost 100 seats in the Leaderboard if I remove this condition
      myMatter < 40;
    this.debug("shouldBuildNaiveRecycler", should, {
      turn,
      hasBuildLastRound: this.hasBuildLastRound,
      notGrassBlocks: notGrassBlocks.length,
      opponentRecyclers: opponentRecyclers.length,
      myRecyclers: myRecyclers.length,
      myRobots: myRobots.length,
      opponentRobots: opponentRobots.length,
      myMatter,
    });
    return should;
  }

  buildNaiveRecycler() {
    const actions: BuildAction[] = [];
    const possibleRecyclers = myBlocks
      .filter(
        (block) =>
          block.canBuild &&
          !this.isNearOfARecycler(block) &&
          this.computeGains(block).gains > 20 &&
          (block.island?.owner !== Owner.ME || ia.turnsWithSameScore > 10)
      )
      .sort((a, b) => {
        const {
          gains: gainA,
          gainsPerTurn: gainsPerTurnA,
          grassCreated: grassCreatedA,
        } = this.computeGains(a);
        const {
          gains: gainB,
          gainsPerTurn: gainsPerTurnB,
          grassCreated: grassCreatedB,
        } = this.computeGains(b);
        const aIsSeparation = a.isOnSeparation;
        const bIsSeparation = b.isOnSeparation;
        if (aIsSeparation && !bIsSeparation) return -1;
        if (bIsSeparation && !aIsSeparation) return 1;
        if (a.initialOwner !== b.initialOwner) {
          if (a.initialOwner === Owner.OPPONENT) return -1;
          if (b.initialOwner === Owner.OPPONENT) return 1;
        }
        if (grassCreatedA !== grassCreatedB)
          return grassCreatedA - grassCreatedB;
        if (gainsPerTurnA !== gainsPerTurnB)
          return gainsPerTurnB - gainsPerTurnA;

        return gainB - gainA;
      });

    if (possibleRecyclers.length) {
      for (const recycler of possibleRecyclers) {
        if (!this.willCreateNewIsland(recycler)) {
          this.hasBuildLastRound = true;
          actions.push(new BuildAction(recycler));
          break;
        }
      }
    }
    debug("buildNaiveRecycler: ", actions.length);
    return actions;
  }

  buildDefensive() {
    const start = new Date();

    const actions: Action[] = [];
    const possibleRecyclers = myBlocks
      .filter((block) => block.canBuild)
      .sort(
        (a, b) =>
          computeManhattanDistance(a, myStartPosition) -
          computeManhattanDistance(b, myStartPosition)
      );
    for (const block of possibleRecyclers) {
      for (const robot of opponentRobots) {
        if (
          side * (robot.x - block.x) === 1 &&
          robot.y === block.y &&
          myMatter >= 10
        ) {
          if (
            robot.units > 1 ||
            [Owner.BOTH || Owner.OPPONENT].includes(block.initialOwner)
          )
            actions.push(new BuildAction(block));
          else if (myMatter < 20) this.hasBuildLastRound = true;
          break;
        }
      }
    }
    // Because we already created some recyclers we need to remove new recyclers.
    const newPossiblesRecyclers = possibleRecyclers.filter(
      (block) => block.canBuild
    );
    for (const block of newPossiblesRecyclers) {
      for (const robot of opponentRobots) {
        if (
          Math.abs(robot.y - block.y) === 1 &&
          robot.x === block.x &&
          myMatter >= 10
        ) {
          if (
            robot.units > 1 ||
            [Owner.BOTH || Owner.OPPONENT].includes(block.initialOwner)
          )
            actions.push(new BuildAction(block));
          else this.hasBuildLastRound = true;
          break;
        }
      }
    }
    const end = new Date().getTime() - start.getTime();
    if (debugTime) debug("buildDefensive time: %dms", end);
    return actions;
  }

  action() {
    const start = new Date();
    const defensiveActions = this.buildDefensive();
    if (defensiveActions.length) {
      this.debug("defensiveBuild: ", defensiveActions.length);
      const end = new Date().getTime() - start.getTime();
      if (debugTime) this.debug(`action time: ${end} ms`);
      return defensiveActions;
    }

    if (this.shouldBuildNaiveRecycler()) {
      const actions = this.buildNaiveRecycler();
      const end = new Date().getTime() - start.getTime();
      if (debugTime) this.debug(`action time: ${end} ms`);
      return actions;
    }
    this.hasBuildLastRound = false;

    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`action time: ${end} ms`);
    return [];
  }
}

export const recyclerBuilder = new RecyclerBuilder();
