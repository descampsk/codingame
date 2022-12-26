/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Action, MoveAction } from "./Actions";
import { Block } from "./Block";
import { computeManhattanDistance, debug, minBy } from "./helpers";
import {
  debugTime,
  map,
  myRobots,
  myStartPosition,
  opponentStartPosition,
  Owner,
} from "./State";

export class ExtensionManager {
  public separation: Block[] = [];

  private SHOULD_DEBUG = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private debug(...data: any[]) {
    if (this.SHOULD_DEBUG) debug("[ExpensionManager]", ...data);
  }

  computeSeparation() {
    if (this.separation.length) return;
    const start = new Date();

    const distances: { value: number; owner: Owner }[][] = new Array(map.length)
      .fill(null)
      .map(() =>
        new Array(map[0].length).fill({
          value: Infinity,
          owner: Owner.NONE,
        })
      );
    const startingBlocks = [
      [myStartPosition.y, myStartPosition.x],
      [opponentStartPosition.y, opponentStartPosition.x],
    ];
    distances[myStartPosition.y][myStartPosition.x] = {
      value: 0,
      owner: Owner.ME,
    };
    distances[opponentStartPosition.y][opponentStartPosition.x] = {
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
              const oldValue = distances[xToUpdate][yToUpdate].value;
              const newValue = 1 + distances[x][y].value;
              if (newValue < oldValue) {
                distances[xToUpdate][yToUpdate] = {
                  value: newValue,
                  owner: distances[x][y].owner,
                };
                nextBlocks.push([xToUpdate, yToUpdate, newValue]);
                visited[xToUpdate][yToUpdate] = 1;
              }
            } else if (
              1 + distances[x][y].value ===
                distances[xToUpdate][yToUpdate].value &&
              distances[xToUpdate][yToUpdate].owner !== distances[x][y].owner &&
              distances[x][y].owner !== Owner.BOTH
            ) {
              distances[xToUpdate][yToUpdate].owner = Owner.BOTH;
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

    for (let i = 0; i < distances.length; i++) {
      for (let j = 0; j < distances[i].length; j++) {
        const distance = distances[i][j];
        if (distance.owner === Owner.BOTH) {
          bothOwnerBlocks.push(map[i][j]);
        }
        if (distance.value === Infinity) continue;
        const { neighbors } = map[i][j];
        for (const neighbor of neighbors) {
          if (
            distances[i][j].owner === Owner.ME &&
            distances[neighbor.y][neighbor.x].owner === Owner.OPPONENT
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
    this.separation.push(...separationMap.values());

    this.debug(
      "Separation",
      this.separation.map((block) => [block.x, block.y])
    );

    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug("computeSeparation time: %dms", end);
  }

  moveToSeparation() {
    const actions: Action[] = [];
    const robots = myRobots.filter((robot) => !robot.hasMoved);
    const remainingSeparation = this.separation.filter(
      (block) => block.owner === Owner.NONE && block.canMove
    );

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
          const distance = robot.distanceToBlock(destination);
          if (
            distance < minDistance ||
            (distance === minDistance &&
              computeManhattanDistance(bestRobot, opponentStartPosition) <
                computeManhattanDistance(robot, opponentStartPosition))
          ) {
            minDistance = distance;
            bestDestination = destination;
            bestDestinationIndex = indexDestination;
            bestRobotIndex = indexRobot;
            bestRobot = robot;
          }
        }
      }

      this.debug(
        `BestRobot ${bestRobot.x},${bestRobot.y} go to ${bestDestination.x},${bestDestination.y} at ${minDistance} blocks`
      );

      robots.splice(bestRobotIndex, 1);
      bestRobot.hasMoved = true;
      remainingSeparation.splice(bestDestinationIndex, 1);
      const yDirection =
        (bestDestination.y - bestRobot.y) /
        Math.abs(bestDestination.y - bestRobot.y);
      if (
        bestDestination.y !== bestRobot.y &&
        map[bestRobot.y + yDirection][bestRobot.x].canMove &&
        map[bestRobot.y + yDirection][bestRobot.x].distanceToBlock(
          bestDestination
        ) ===
          bestRobot.distanceToBlock(bestDestination) - 1
      ) {
        actions.push(
          new MoveAction(
            1,
            bestRobot.x,
            bestRobot.y,
            bestRobot.x,
            bestRobot.y + yDirection
          )
        );
      } else {
        actions.push(
          new MoveAction(
            1,
            bestRobot.x,
            bestRobot.y,
            bestDestination.x,
            bestDestination.y
          )
        );
      }
    }
    return actions;
  }
}

export const expensionManager = new ExtensionManager();
