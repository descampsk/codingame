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

  private getRemainingSeparation() {
    const remainingSeparation = this.separation.filter(
      (block) =>
        // units = 0 because an other unit could move there to defend and update the block units
        block.owner === Owner.NONE &&
        block.canMove &&
        block.units === 0 &&
        block.island?.owner === Owner.BOTH
    );
    this.debug(
      "RemainingSeparation",
      remainingSeparation.map((block) => [block.x, block.y])
    );
    return remainingSeparation;
  }

  private computeMunkres(
    remainingSeparation: Block[],
    robots: Block[],
    blocksToSpawn: Block[]
  ) {
    const distanceFromSeparationToBlock: number[][] = [];
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

      // On rajoute les spawns ici
      const minDistanceToSpawn =
        minBy(blocksToSpawn, (block) => separation.distanceToBlock(block))
          .value! + 1.1;

      const spawnMatter = recyclerBuilder.hasBuildLastRound
        ? myMatter
        : myMatter - 10;

      for (let i = 0; i < Math.floor(spawnMatter / 10); i++) {
        row.push(minDistanceToSpawn);
      }

      distanceFromSeparationToBlock.push(row);
    }
    this.debug("distanceFromSeparationToRobot", distanceFromSeparationToBlock);
    const bestRobotAndSpawnsForDestination = munkres(
      distanceFromSeparationToBlock
    ) as number[][];
    this.debug(
      "bestRobotAndSpawnsForDestination",
      bestRobotAndSpawnsForDestination
    );
    return { bestRobotAndSpawnsForDestination, distanceFromSeparationToBlock };
  }

  moveAndBuildToSeparation() {
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

    const remainingSeparation = this.getRemainingSeparation();

    if (
      this.isExpansionDone ||
      !remainingSeparation.length ||
      myRobots.length < 4
    ) {
      this.isExpansionDone = true;
      return actions;
    }

    const blocksToSpawn = myBlocks.filter(
      (block) =>
        block.canSpawn &&
        (block.island?.owner !== Owner.ME || !block.island?.hasRobot) &&
        block.willBecomeGrass > 1 &&
        block.neighbors.find((a) => a.owner !== Owner.ME)
    );

    this.debug(
      "blocksToSpawn",
      blocksToSpawn.map((block) => [block.x, block.y])
    );

    const { bestRobotAndSpawnsForDestination, distanceFromSeparationToBlock } =
      this.computeMunkres(remainingSeparation, robots, blocksToSpawn);

    for (let i = 0; i < bestRobotAndSpawnsForDestination.length; i++) {
      const [destinationIndex, robotOrSpawnIndex] =
        bestRobotAndSpawnsForDestination[i];
      const distance =
        distanceFromSeparationToBlock[destinationIndex][robotOrSpawnIndex];
      const destination = remainingSeparation[destinationIndex];
      // Si l'index est inférieur à la taille de la liste des robots, alors c'est bien un robot sinon c'est un spawn
      if (robotOrSpawnIndex < robots.length) {
        const robot = robots[robotOrSpawnIndex];

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
      } else {
        // On est dans le cas d'un spawn
        const spawn = blocksToSpawn
          .filter((block) => {
            this.debug(
              "Spawn",
              [block.x, block.y],
              destination.distanceToBlock(block),
              distance,
              distance - 1.1,
              destination.distanceToBlock(block) + 1.1 === distance
            );
            return destination.distanceToBlock(block) + 1.1 === distance;
          })
          .sort((a, b) => side * (a.x - b.x))[0];
        if (spawn) {
          this.debug(
            `We will spawn a robot on ${spawn.x},${spawn.y} should go to ${destination.x},${destination.y} with a distance of ${distance}`
          );
          actions.push(new SpawnAction(1, spawn));
        } else {
          this.debug(
            `We didn't find a block to spawn to go to ${destination.x},${destination.y} with a distance of ${distance}`
          );
        }
      }
    }

    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`moveAndBuildToSeparation time: ${end}ms`);
    return actions;
  }
}

export const expensionManager = new ExpansionManager();
