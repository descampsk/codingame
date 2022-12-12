/* eslint-disable class-methods-use-this */
import { Action, MoveAction, SpawnAction } from "./Actions";
import { computeBlockDistance, debug } from "./helpers";
import { emptyBlocks, myRobots, opponentRobots } from "./State";

export class RobotManager {
  action() {
    debug("RobotManager action");
    const actions: Action[] = [];
    // const opponentRobotsToKill: Block[] = JSON.parse(
    //   JSON.stringify(opponentRobots)
    // );
    // Half of the robots attacks and half of the robots visits
    const visiters = myRobots.slice(0, Math.floor(myRobots.length / 2));
    const attackers = myRobots.slice(Math.floor(myRobots.length / 2));
    for (const visiter of visiters) {
      const nearestEmptyBlock = emptyBlocks.sort(
        (a, b) =>
          computeBlockDistance(a, visiter) - computeBlockDistance(b, visiter)
      )[0];
      if (nearestEmptyBlock) {
        actions.push(
          new MoveAction(
            visiter.units,
            visiter.position.x,
            visiter.position.y,
            nearestEmptyBlock.position.x,
            nearestEmptyBlock.position.y
          )
        );
      }
    }

    for (const robot of attackers) {
      const { position, units } = robot;
      const nearestOpponent = opponentRobots.sort(
        (a, b) =>
          computeBlockDistance(a, robot) - computeBlockDistance(b, robot)
      )[0];
      if (nearestOpponent) {
        if (
          units <= nearestOpponent.units &&
          computeBlockDistance(nearestOpponent, robot) <= 2
        ) {
          debug("Spawn robot");
          actions.push(
            new SpawnAction(nearestOpponent.units, position.x, position.y)
          );
        }
        debug("Move robot");
        actions.push(
          new MoveAction(
            robot.units,
            position.x,
            position.y,
            nearestOpponent?.position.x,
            nearestOpponent?.position.y
          )
        );
      }
    }
    return actions;
  }
}

export const robotManager = new RobotManager();
