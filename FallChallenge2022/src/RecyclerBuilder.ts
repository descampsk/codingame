/* eslint-disable class-methods-use-this */
import { Heapq } from "ts-heapq";
import { Action, BuildAction } from "./Actions";
import { Block } from "./Block";
import { Island } from "./Island";
import { computeManhattanDistance, debug, debugTime } from "./helpers";
import {
  blocks,
  islands,
  map,
  myBlocks,
  myMatter,
  myRecyclers,
  myRobots,
  myStartPosition,
  opponentRecyclers,
  opponentRobots,
  Owner,
  side,
  turn,
} from "./State";
import { ia } from "./IA";
import { ClassLogger } from "./ClassLogger";

export class RecyclerBuilder extends ClassLogger {
  private hasBuildLastRound = false;

  public bestRecyclers: Block[] = [];

  computeIncomes() {
    let myIncome = 0;
    let opponentIncome = 0;
    for (const recycler of myRecyclers) {
      this.debug("Gains", recycler.computeGains(Owner.ME));
      myIncome += recycler.computeGains(Owner.ME).gains;
    }
    for (const recycler of opponentRecyclers) {
      opponentIncome += recycler.computeGains(Owner.OPPONENT).gains;
    }

    this.debug("Incomes", { myIncome, opponentIncome });
    return {
      myIncome,
      opponentIncome,
    };
  }

  findBestRecyclers(map: Block[][]) {
    if (this.bestRecyclers.length) return;

    this.bestRecyclers = map
      .flat()
      .filter(
        (block) =>
          block.initialOwner === Owner.ME && block.computeGains().gains > 20
      );
    this.bestRecyclers.sort((a, b) => {
      const { gainsPerGrassCreated: gainsPerGrassCreatedA } = a.computeGains();
      const { gainsPerGrassCreated: gainsPerGrassCreatedB } = b.computeGains();
      return gainsPerGrassCreatedB - gainsPerGrassCreatedA;
    });
    this.debug(
      "BestRecyclers",
      this.bestRecyclers
        .slice(0, 10)
        .map((block) => [block.x, block.y, block.computeGains()])
    );
  }

  willCreateNewIsland(block: Block) {
    const copyMap = Block.createCopyOfMap(map);
    copyMap[block.y][block.x].recycler = true;
    const flapMap = copyMap.flat();
    const recyclers = flapMap.filter((block) => block.recycler);
    for (const recycler of recyclers) {
      for (const neighbor of recycler.neighbors) {
        if (neighbor.scrapAmount <= recycler.scrapAmount) {
          copyMap[neighbor.y][neighbor.x].scrapAmount = 0;
        }
      }
    }
    flapMap.forEach((block) => block.updateNeighbors(copyMap));
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
    const possibleRecyclers = myBlocks.filter(
      (block) =>
        block.canBuild &&
        block.computeGains().gains > 20 &&
        (block.island?.owner !== Owner.ME || ia.turnsWithSameScore > 10)
    );
    const bestRecyclers: Heapq<Block> = new Heapq<Block>([], (a, b) => {
      const { gainsPerGrassCreated: gainsPerGrassCreatedA } = a.computeGains();
      const { gainsPerGrassCreated: gainsPerGrassCreatedB } = b.computeGains();
      const aIsSeparation = a.isOnSeparation;
      const bIsSeparation = b.isOnSeparation;
      if (aIsSeparation && !bIsSeparation) return true;
      if (bIsSeparation && !aIsSeparation) return false;
      if (a.initialOwner !== b.initialOwner) {
        if (a.initialOwner === Owner.OPPONENT) return true;
        if (b.initialOwner === Owner.OPPONENT) return false;
      }

      return gainsPerGrassCreatedB < gainsPerGrassCreatedA;
    });
    for (const recycler of possibleRecyclers) {
      bestRecyclers.push(recycler);
    }

    while (bestRecyclers.length()) {
      const recycler = bestRecyclers.pop();
      if (!this.willCreateNewIsland(recycler)) {
        this.hasBuildLastRound = true;
        actions.push(new BuildAction(recycler));
        break;
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
            [Owner.BOTH || Owner.OPPONENT].includes(block.initialOwner) ||
            opponentRecyclers.length > myRecyclers.length
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
    this.findBestRecyclers(map);

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
