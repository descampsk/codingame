/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
// @ts-expect-error NO types
import munkres from "munkres-js";
import { Action, MoveAction, SpawnAction } from "./Actions";
import { Block } from "./Block";
import { ClassLogger } from "./ClassLogger";
import { dijtstraAlgorithm } from "./djikstra";
import { computeManhattanDistance, debugTime, maxBy, minBy } from "./helpers";
import {
  blocks,
  map,
  myBlocks,
  myMatter,
  myRobots,
  myStartPosition,
  opponentStartPosition,
  Owner,
  side,
  turn,
} from "./State";
import { recyclerBuilder } from "./RecyclerBuilder";

export class ExpansionManager extends ClassLogger {
  public separation: Block[] = [];

  public djikstraMap: Map<Block, number[][]> = new Map();

  public mapOwner: { value: number; owner: Owner }[][] = [];

  public isExpansionDone = false;

  computeSeparation() {
    if (this.separation.length) return;
    const start = new Date();

    this.mapOwner = new Array(map.length).fill(null).map(() =>
      new Array(map[0].length).fill({
        value: Infinity,
        owner: Owner.NONE,
      })
    );
    const startingBlocks = [
      [myStartPosition.y, myStartPosition.x],
      [opponentStartPosition.y, opponentStartPosition.x],
    ];
    this.mapOwner[myStartPosition.y][myStartPosition.x] = {
      value: 0,
      owner: Owner.ME,
    };
    this.mapOwner[opponentStartPosition.y][opponentStartPosition.x] = {
      value: 0,
      owner: Owner.OPPONENT,
    };

    const visited: number[][] = new Array(map.length)
      .fill(0)
      .map(() => new Array(map[0].length).fill(0));

    const nextBlocks: number[][] = Array.from(startingBlocks);
    let currentBlock = nextBlocks.pop();
    while (currentBlock) {
      const [x, y] = currentBlock;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const xToUpdate = x + i;
          const yToUpdate = y + j;
          if (
            (i !== 0 || j !== 0) &&
            Math.abs(i) !== Math.abs(j) &&
            xToUpdate >= 0 &&
            xToUpdate < map.length &&
            yToUpdate >= 0 &&
            yToUpdate < map[0].length &&
            map[xToUpdate][yToUpdate].canMove
          ) {
            if (!visited[xToUpdate][yToUpdate]) {
              const oldValue = this.mapOwner[xToUpdate][yToUpdate].value;
              const newValue = 1 + this.mapOwner[x][y].value;
              if (newValue < oldValue) {
                this.mapOwner[xToUpdate][yToUpdate] = {
                  value: newValue,
                  owner: this.mapOwner[x][y].owner,
                };
                nextBlocks.push([xToUpdate, yToUpdate, newValue]);
                visited[xToUpdate][yToUpdate] = 1;
              }
            } else if (
              1 + this.mapOwner[x][y].value ===
                this.mapOwner[xToUpdate][yToUpdate].value &&
              this.mapOwner[xToUpdate][yToUpdate].owner !==
                this.mapOwner[x][y].owner &&
              this.mapOwner[x][y].owner !== Owner.BOTH
            ) {
              this.mapOwner[xToUpdate][yToUpdate].owner = Owner.BOTH;
            }
          }
        }
      }
      nextBlocks.sort((a, b) => a[2] - b[2]);
      [currentBlock] = nextBlocks;
      nextBlocks.shift();
    }

    const bothOwnerBlocks: Block[] = [];
    const wall: Block[] = [];

    for (let i = 0; i < this.mapOwner.length; i++) {
      for (let j = 0; j < this.mapOwner[i].length; j++) {
        const distance = this.mapOwner[i][j];
        if (distance.owner === Owner.BOTH) {
          bothOwnerBlocks.push(map[i][j]);
        }
        if (distance.value === Infinity) continue;
        const { neighbors } = map[i][j];
        for (const neighbor of neighbors) {
          if (
            this.mapOwner[i][j].owner === Owner.ME &&
            this.mapOwner[neighbor.y][neighbor.x].owner === Owner.OPPONENT
          )
            wall.push(map[i][j]);
        }
      }
    }

    this.separation.splice(0);
    if (bothOwnerBlocks.length) this.separation.push(...bothOwnerBlocks);
    else this.separation.push(...wall);

    // In some cases there are duplicated blocks in the array so we remove it
    const separationMap = new Map<string, Block>();
    for (const block of this.separation) {
      separationMap.set(`${block.x},${block.y}`, block);
    }
    this.separation.splice(0);
    this.separation.push(
      ...Array.from(separationMap.values()).filter(
        (block) => block.neighbors.length > 1
      )
    );

    this.debug(
      "Separation",
      this.separation.map((block) => [
        block.x,
        block.y,
        this.mapOwner[block.y][block.x],
      ])
    );

    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug("computeSeparation time: %dms", end);
  }

  computeDjikstraMap() {
    if (this.djikstraMap.size) return;
    for (const block of this.separation) {
      const djikstra = dijtstraAlgorithm(map, [[block.y, block.x]], Infinity);
      this.djikstraMap.set(block, djikstra);
    }
  }

  getDistanceFromBlockToSeparation(block: Block, separation: Block) {
    return this.djikstraMap.get(separation)![block.y][block.x];
  }

  moveAndBuildToSeparation() {
    const start = new Date();
    const actions: Action[] = [];
    const remainingSeparation = this.separation.filter(
      (block) =>
        // units = 0 because an other unit could move there to defend and update the block units
        block.owner === Owner.NONE &&
        block.canMove &&
        block.units === 0 &&
        block.island?.owner === Owner.BOTH
    );
    // .sort(
    //   (a, b) =>
    //     computeManhattanDistance(a, myStartPosition) -
    //     computeManhattanDistance(b, myStartPosition)
    // );
    this.debug(
      "RemainingSeparation",
      remainingSeparation.map((block) => [block.x, block.y])
    );
    if (
      this.isExpansionDone ||
      !remainingSeparation.length ||
      myRobots.length < 4
    ) {
      this.isExpansionDone = true;
      return actions;
    }
    actions.push(
      ...this.moveToSeparationV2(remainingSeparation),
      ...this.buildToSeparation(remainingSeparation)
    );
    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`moveAndBuildToSeparation time: ${end}ms`);
    return actions;
  }

  buildToSeparation(remainingSeparation: Block[]) {
    const start = new Date();
    const actions: Action[] = [];

    this.debug(
      "RemainingSeparationAfterMove",
      remainingSeparation.map((block) => [block.x, block.y])
    );

    const minMatters = recyclerBuilder.hasBuildLastRound ? 10 : 20;

    // On va créer des robots pour les destinations manquantes
    if (remainingSeparation.length) {
      const blocksToSpawn = myBlocks.filter(
        (block) =>
          block.canSpawn &&
          (block.island?.owner !== Owner.ME || !block.island?.hasRobot) &&
          block.willBecomeGrass > 1 &&
          block.neighbors.find((a) => a.owner !== Owner.ME)
      );
      while (remainingSeparation.length && myMatter >= minMatters) {
        let bestDestination = remainingSeparation[0];
        let bestDestinationIndex = 0;
        let minDistance = Infinity;
        let bestBlockToSpawn = myBlocks[0];
        for (const [
          indexDestination,
          destination,
        ] of remainingSeparation.entries()) {
          for (const block of blocksToSpawn) {
            const distance = this.getDistanceFromBlockToSeparation(
              block,
              destination
            );
            if (distance < minDistance) {
              minDistance = distance;
              bestDestination = destination;
              bestDestinationIndex = indexDestination;
              bestBlockToSpawn = block;
            }
            if (
              distance === minDistance &&
              side * (block.x - bestBlockToSpawn.x) < 0
            ) {
              minDistance = distance;
              bestDestination = destination;
              bestDestinationIndex = indexDestination;
              bestBlockToSpawn = block;
            }
          }
        }
        this.debug(
          `BestBlock to spawn ${bestBlockToSpawn.x},${bestBlockToSpawn.y} go to ${bestDestination.x},${bestDestination.y} at ${minDistance} blocks`
        );
        remainingSeparation.splice(bestDestinationIndex, 1);
        actions.push(new SpawnAction(1, bestBlockToSpawn));
      }
    }
    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`buildToSeparation time: ${end}ms`);
    return actions;
  }

  moveToSeparationV2(remainingSeparation: Block[]) {
    const start = new Date();
    const actions: Action[] = [];
    const robots = myBlocks
      .filter(
        (block) =>
          block.units > 0 &&
          block.hasMoved < block.units &&
          block.distanceToSeparation > 0
      )
      .flatMap((robot) => robot.getOneRobotPerUnit())
      .filter((robot) => {
        const { nearestOpponentDistance } = robot.findNearestOpponent();
        const { distanceToSeparation } = robot;
        return distanceToSeparation < nearestOpponentDistance;
      });

    this.debug(
      "AvailableRobots",
      robots.map((robot) => [robot.x, robot.y])
    );

    if (!remainingSeparation.length || !robots.length) {
      return actions;
    }

    const distanceFromSeparationToRobot: number[][] = [];
    for (const [indexSeparation, separation] of remainingSeparation.entries()) {
      const row = [];
      for (const robot of robots) {
        const distance = this.getDistanceFromBlockToSeparation(
          robot,
          separation
        );
        const neighborsNone = robot.neighbors.filter(
          (block) =>
            block.owner === Owner.NONE &&
            this.getDistanceFromBlockToSeparation(block, separation) ===
              distance - 1
        );
        const neighborsMe = robot.neighbors.filter(
          (block) =>
            block.owner === Owner.ME &&
            this.getDistanceFromBlockToSeparation(block, separation) ===
              distance - 1
        );
        if (!neighborsNone.length && neighborsMe.length) row.push(distance + 1);
        else if (
          indexSeparation === 0 ||
          indexSeparation === remainingSeparation.length - 1
        )
          row.push(distance - 1.1);
        else if (robot.distanceToSeparation === distance)
          row.push(distance - 0.1);
        else row.push(distance);
      }
      distanceFromSeparationToRobot.push(row);
    }
    this.debug("distanceFromSeparationToRobot", distanceFromSeparationToRobot);
    const bestRobotsForDestination = munkres(
      distanceFromSeparationToRobot
    ) as number[][];
    this.debug("bestRobotsForDestination", bestRobotsForDestination);
    const originalDestination = remainingSeparation.slice(0);
    for (let i = 0; i < bestRobotsForDestination.length; i++) {
      const [destinationIndex, robotIndex] = bestRobotsForDestination[i];
      const destination = originalDestination[destinationIndex];
      const indexToDelete = remainingSeparation.findIndex((block) =>
        block.equals(destination)
      );
      remainingSeparation.splice(indexToDelete, 1);
      const robot = robots[robotIndex];
      const distance =
        distanceFromSeparationToRobot[destinationIndex][robotIndex];
      const { nearestOpponentDistance } = robot.findNearestOpponent();
      if (nearestOpponentDistance + 2 < distance) {
        this.debug(
          `Robot ${robot.x},${robot.y} wont go to ${destination.x},${destination.y} with a distance of ${distance} because it higher than ${nearestOpponentDistance} + 2`
        );
      } else {
        this.debug(
          `Robot ${robot.x},${robot.y} should go to ${destination.x},${destination.y} with a distance of ${distance}`
        );
        actions.push(new MoveAction(1, robot, destination));
      }
    }

    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`moveToSeparationV2 time: ${end}ms`);
    return actions;
  }

  moveToSeparation(remainingSeparation: Block[]) {
    const start = new Date();
    const actions: Action[] = [];
    const robots = myBlocks
      .filter((block) => block.units > 0 && block.hasMoved < block.units)
      .flatMap((robot) => robot.getOneRobotPerUnit());
    const maxDistanceFromStartToSeparation = maxBy(this.separation, (block) =>
      myStartPosition.distanceToBlock(block)
    ).maxValue!;

    const manhattanDistanceToMyStart: Map<Block, number> = new Map();
    for (const destination of remainingSeparation) {
      manhattanDistanceToMyStart.set(
        destination,
        computeManhattanDistance(destination, myStartPosition)
      );
    }

    const minDistanceToMyBlocksMap: Map<Block, number> = new Map();
    const myBlockBorders = myBlocks.filter((block) =>
      block.neighbors.find((neighbor) => neighbor.owner === Owner.NONE)
    );
    for (const separation of remainingSeparation) {
      const min = minBy(myBlockBorders, (block) =>
        this.getDistanceFromBlockToSeparation(block, separation)
      ).value!;
      minDistanceToMyBlocksMap.set(separation, min);
    }

    while (robots.length && remainingSeparation.length) {
      let bestDestination = remainingSeparation[0];
      let bestDestinationIndex = 0;
      let minDistance = Infinity;
      let bestRobot = robots[0];
      let bestRobotIndex = 0;
      for (const [
        indexDestination,
        destination,
      ] of remainingSeparation.entries()) {
        for (const [indexRobot, robot] of robots.entries()) {
          const distance = this.getDistanceFromBlockToSeparation(
            robot,
            destination
          );
          if (
            distance < minDistance ||
            (distance === minDistance &&
              manhattanDistanceToMyStart.get(bestDestination)! <
                manhattanDistanceToMyStart.get(destination)!)
          ) {
            minDistance = distance;
            bestDestination = destination;
            bestDestinationIndex = indexDestination;
            bestRobotIndex = indexRobot;
            bestRobot = robot;
          }
        }
      }

      robots.splice(bestRobotIndex, 1);
      // Sometimes it s better to let this robot move because it try to go in a too far away block
      // We just remove it and let the expension robot builder create a new way in a better place
      if (minDistance - 5 > maxDistanceFromStartToSeparation - turn) {
        this.debug(
          `BestRobot ${bestRobot.x},${bestRobot.y} should go to ${bestDestination.x},${bestDestination.y} at ${minDistance} blocks but it is higher than ${maxDistanceFromStartToSeparation} - ${turn} + 5 so we prefer to find an other robot.`
        );
        continue;
      }
      const minDistanceToMyBlocks =
        minDistanceToMyBlocksMap.get(bestDestination)!;
      if (minDistance > minDistanceToMyBlocks + 2) {
        this.debug(
          `BestRobot ${bestRobot.x},${bestRobot.y} should go to ${bestDestination.x},${bestDestination.y} at ${minDistance} blocks but it is higher than ${minDistanceToMyBlocks} so we prefer to find an other robot.`
        );
        continue;
      }

      this.debug(
        `BestRobot ${bestRobot.x},${bestRobot.y} go to ${bestDestination.x},${bestDestination.y} at ${minDistance} blocks`
      );

      remainingSeparation.splice(bestDestinationIndex, 1);
      actions.push(new MoveAction(1, bestRobot, bestDestination));
    }

    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`moveToSeparation time: ${end}ms`);
    return actions;
  }
}

export const expensionManager = new ExpansionManager();
