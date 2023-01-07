/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable class-methods-use-this */
import { Action, BuildAction, MoveAction, SpawnAction } from "./Actions";
import { Block } from "./Block";
import { ClassLogger } from "./ClassLogger";
import { recyclerBuilder } from "./RecyclerBuilder";
import {
  Owner,
  myMatter,
  myRecyclers,
  myStartPosition,
  opponentRecyclers,
  opponentRobots,
  side,
} from "./State";
import { computeManhattanDistance, debugTime } from "./helpers";

export class DefenseManager extends ClassLogger {
  private findDangeroursRobots() {
    const dangerousRobots: { dangerousRobot: Block; blockToDefend: Block }[] =
      [];
    for (const dangerousRobot of opponentRobots) {
      const blockToDefend = dangerousRobot.neighbors
        .filter(
          (block) =>
            block.owner !== Owner.OPPONENT &&
            [Owner.ME, Owner.BOTH].includes(block.initialOwner)
        )
        .sort(
          (a, b) =>
            computeManhattanDistance(a, myStartPosition) -
            computeManhattanDistance(b, myStartPosition)
        )[0];
      if (blockToDefend) {
        dangerousRobots.push({ dangerousRobot, blockToDefend });
      }
    }
    dangerousRobots.sort((a, b) => {
      return (
        computeManhattanDistance(a.blockToDefend, myStartPosition) -
        computeManhattanDistance(b.blockToDefend, myStartPosition)
      );
    });
    this.debug(
      "DangerousRobots",
      dangerousRobots.map((danger) => ({
        robot: [danger.dangerousRobot.x, danger.dangerousRobot.y],
        blockToDefend: [danger.blockToDefend.x, danger.blockToDefend.y],
      }))
    );
    return dangerousRobots;
  }

  private builDefensiveRecycler(dangerousRobot: Block, blockToDefend: Block) {
    const { gains, grassCreated } = blockToDefend.computeGains();
    if (
      dangerousRobot.units > 1 ||
      (gains > 20 &&
        recyclerBuilder.myGrassCreated + grassCreated <=
          recyclerBuilder.opponentGrassCreated) ||
      [Owner.BOTH || Owner.OPPONENT].includes(blockToDefend.initialOwner)
    ) {
      this.debug(
        `Building a recycler on ${blockToDefend.x},${blockToDefend.y} to defend`
      );
      return new BuildAction(blockToDefend);
    }
    this.debug(
      `We wont building a recycler on ${blockToDefend.x},${blockToDefend.y} to defend`
    );
    if (myMatter < 20) recyclerBuilder.hasBuildLastRound = true;
    return null;
  }

  computeDefense() {
    const start = new Date();
    const actions: Action[] = [];
    const dangerousRobots = this.findDangeroursRobots();
    const defendedBlocks: Set<Block> = new Set();
    while (dangerousRobots.length) {
      const { dangerousRobot, blockToDefend } = dangerousRobots.shift()!;
      const unitsToHave = dangerousRobot.units;
      this.debug(
        `Trying to defend of an attack from ${dangerousRobot.x},${dangerousRobot.y} with ${unitsToHave} robots`
      );
      defendedBlocks.add(blockToDefend);
      if (blockToDefend.canBuild) {
        const action = this.builDefensiveRecycler(
          dangerousRobot,
          blockToDefend
        );
        if (action) {
          actions.push(action);
          continue;
        }
      }
      const neighborsWithUnits = blockToDefend.neighbors
        .filter((block) => block.owner === Owner.ME && block.units > 0)
        .sort((a, b) => b.units - a.units);
      const unitsInRange = neighborsWithUnits.reduce(
        (total, neighbor) => total + neighbor.units,
        0
      );
      const possibleSpawns =
        blockToDefend.owner === Owner.ME ? Math.floor(myMatter / 10) : 0;
      const isDefensePossible =
        unitsToHave - blockToDefend.units - unitsInRange - possibleSpawns <= 0;
      if (isDefensePossible) {
        this.debug(
          `Defense on ${blockToDefend.x},${blockToDefend.y} is possible`,
          {
            unitsToHave,
            blockToDefendUnits: blockToDefend.units,
            unitsInRange,
            myMatter,
          }
        );
        let unitsToDefend = 0;
        while (
          myMatter >= 10 &&
          unitsToHave > unitsToDefend &&
          blockToDefend.canSpawn
        ) {
          unitsToDefend += 1;
          this.debug(
            `Spawning a unit in ${blockToDefend.x},${blockToDefend.y} to defend. We have now ${unitsToDefend} units to defend.`
          );
          actions.push(new SpawnAction(1, blockToDefend));
        }
        if (unitsToHave > unitsToDefend) {
          const robotsToLetInPlace =
            blockToDefend.units >= unitsToHave - unitsToDefend
              ? unitsToHave - unitsToDefend
              : blockToDefend.units;
          unitsToDefend += robotsToLetInPlace;
          this.debug(
            `Letting ${robotsToLetInPlace} robots in place in ${blockToDefend.x},${blockToDefend.y} to defend. We have now ${unitsToDefend} units to defend.`
          );
          blockToDefend.hasMoved += robotsToLetInPlace;
        }
        if (unitsToDefend >= unitsToHave) continue;
        for (const neighbor of neighborsWithUnits) {
          const robotsToMove =
            neighbor.units >= unitsToHave - unitsToDefend
              ? unitsToHave - unitsToDefend
              : neighbor.units;
          unitsToDefend += robotsToMove;
          this.debug(
            `Moving ${robotsToMove} robots from ${neighbor.x},${neighbor.y} to ${blockToDefend.x},${blockToDefend.y} to defend. We have now ${unitsToDefend} units to defend.`
          );
          actions.push(new MoveAction(robotsToMove, neighbor, blockToDefend));
          if (unitsToDefend >= unitsToHave) break;
        }
      } else {
        this.debug(
          `Defense on ${blockToDefend.x},${blockToDefend.y} is not possible. We let the block to the opponent`,
          {
            unitsToHave,
            blockToDefendUnits: blockToDefend.units,
            unitsInRange,
            myMatter,
          }
        );
      }
    }
    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`computeDefense time: ${end}ms`);
    return actions;
  }
}

export const defenseManager = new DefenseManager();
