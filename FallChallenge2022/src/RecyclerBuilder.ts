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
import { expensionManager } from "./ExpansionManager";

export class RecyclerBuilder extends ClassLogger {
  public hasBuildLastRound = false;

  public bestRecyclers: Block[] = [];

  opponentGrassCreated = 0;

  myGrassCreated = 0;

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

  computeGrassCreated() {
    this.opponentGrassCreated = 0;
    this.myGrassCreated = 0;
    for (let i = 0; i < map.length; i++) {
      for (let j = 0; j < map[0].length; j++) {
        const block = map[i][j];
        if (
          block.recycler ||
          block.scrapAmount === 0 ||
          block.willBecomeGrass < Infinity
        ) {
          const { owner } = expensionManager.mapOwner[i][j];
          if (owner === Owner.OPPONENT) {
            this.opponentGrassCreated += 1;
          }
          if (owner === Owner.ME) {
            this.myGrassCreated += 1;
          }
        }
      }
    }
  }

  findBestRecyclers(map: Block[][]) {
    if (this.bestRecyclers.length) return;

    this.bestRecyclers = map
      .flat()
      .filter(
        (block) =>
          block.initialOwner === Owner.ME &&
          block.computeGains().gains > 20 &&
          block.distanceToSeparation <= myStartPosition.distanceToSeparation
      );
    this.bestRecyclers.sort((a, b) => {
      const { gainsPerGrassCreated: gainsPerGrassCreatedA } = a.computeGains();
      const { gainsPerGrassCreated: gainsPerGrassCreatedB } = b.computeGains();
      return gainsPerGrassCreatedB - gainsPerGrassCreatedA;
    });
    this.debug(
      "BestRecyclers",
      this.bestRecyclers.map((block) => [
        block.x,
        block.y,
        block.computeGains(),
      ])
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
        island.blocks[0].initialOwner === Owner.ME &&
        island.size > 1 &&
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
      myMatter >= 10 &&
      (!this.hasBuildLastRound ||
        this.myGrassCreated + 3 < this.opponentGrassCreated) &&
      (notGrassBlocks.length >= 100 ||
        opponentRecyclers.length > myRecyclers.length ||
        ia.turnsWithSameScore > 10 ||
        !!myBlocks.find((block) => block.initialOwner === Owner.OPPONENT)) &&
      // Lost 100 seats in the Leaderboard if I remove this condition
      myMatter < 40;
    this.debug("shouldBuildNaiveRecycler", should, {
      turn,
      myGrassCreated: this.myGrassCreated,
      opponentGrassCreated: this.opponentGrassCreated,
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

  buildWinRecycler() {
    const myBlockBorders = myBlocks.filter(
      (block) =>
        block.canBuild &&
        block.neighbors.find((neighbor) => neighbor.owner === Owner.OPPONENT)
    );
    if (myBlockBorders.length * 10 > myMatter && myBlockBorders.length > 3) {
      this.debug("We don't have enough matters to build win recyclers");
      return [];
    }

    const copyMap = Block.createCopyOfMap(map);
    for (const block of myBlockBorders) {
      copyMap[block.y][block.x].recycler = true;
    }

    const flapMap = copyMap.flat();
    flapMap.forEach((block) => block.updateNeighbors(copyMap));
    const newIslands = Island.findIslands(copyMap);
    let myScore = 0;
    let opponentScore = 0;
    for (const island of newIslands) {
      if (island.owner === Owner.BOTH) {
        this.debug(
          "An island is contested. Then no win recycler is possible",
          myBlockBorders.map((block) => [block.x, block.y])
        );
        return [];
      }
      if (island.owner === Owner.ME) {
        for (const block of island.blocks) {
          if (block.scrapAmount > 0 && block.willBecomeGrass === Infinity)
            myScore += 1;
        }
      }
      if (island.owner === Owner.OPPONENT) {
        for (const block of island.blocks) {
          if (block.scrapAmount > 0 && block.willBecomeGrass === Infinity)
            opponentScore += 1;
        }
      }
    }

    if (myScore >= opponentScore) {
      this.debug(
        "A win recycler has been found",
        myBlockBorders.map((block) => [block.x, block.y]),
        myScore,
        opponentScore,
        newIslands.map((island) => ({
          owner: island.owner,
          origin: [island.blocks[0].x, island.blocks[0].y],
          size: island.size,
          blocks: island.blocks.map((block) => `${block.x},${block.y}`),
        }))
      );
      if (myBlockBorders.length * 10 > myMatter) {
        this.debug("We don't have enough matters to build win recyclers");
        return [];
      }
      this.hasBuildLastRound = true;
      return myBlockBorders.map((block) => new BuildAction(block));
    }
    this.debug(
      "A lose recycler has been found. So we won't build it",
      myScore,
      opponentScore,
      myBlockBorders.map((block) => [block.x, block.y])
    );
    return [];
  }

  buildNaiveRecycler() {
    const actions: BuildAction[] = [];

    const possibleBlocksOnMySide = myBlocks.filter(
      (block) =>
        block.canBuild &&
        block.initialOwner === Owner.ME &&
        (turn < 5 ||
          this.myGrassCreated + block.computeGains().grassCreated + 1 <
            this.opponentGrassCreated) &&
        block.computeGains().gains > 20 &&
        block.computeGains().gainsPerTurn >= 3 &&
        (block.island?.owner !== Owner.ME || ia.turnsWithSameScore > 10)
    );
    const possibleBlocksOnOpponentSide = myBlocks.filter(
      (block) =>
        block.canBuild &&
        [Owner.BOTH, Owner.OPPONENT].includes(block.initialOwner)
    );
    const possibleRecyclers = [
      ...possibleBlocksOnMySide,
      ...possibleBlocksOnOpponentSide,
    ];
    const bestRecyclers: Heapq<Block> = new Heapq<Block>([], (a, b) => {
      const { gainsPerGrassCreated: gainsPerGrassCreatedA } = a.computeGains();
      const { gainsPerGrassCreated: gainsPerGrassCreatedB } = b.computeGains();
      return gainsPerGrassCreatedB < gainsPerGrassCreatedA;
    });
    for (const recycler of possibleRecyclers) {
      bestRecyclers.push(recycler);
    }

    this.debug(
      "BestRecyclers found",
      bestRecyclers.heap.map((block) => [block.x, block.y])
    );

    while (bestRecyclers.length()) {
      const recycler = bestRecyclers.pop();
      if (!this.willCreateNewIsland(recycler)) {
        this.hasBuildLastRound = true;
        ia.turnsWithSameScore = 0;
        actions.push(new BuildAction(recycler));
        break;
      }
    }
    debug("buildNaiveRecycler: ", actions.length);
    return actions;
  }

  action() {
    this.findBestRecyclers(map);
    const start = new Date();
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
