/* eslint-disable class-methods-use-this */
import { Action, MoveAction, SpawnAction } from "./Actions";
import { computeBlockDistance, debug } from "./helpers";
import { myRobots, opponentRobots } from "./State";

export class RobotManager {
  action() {
    debug("RobotManager action");
    const actions: Action[] = [];
    // const opponentRobotsToKill: Block[] = JSON.parse(
    //   JSON.stringify(opponentRobots)
    // );
    // Half of the robots attacks and half of the robots visits
    const visiters = myRobots.slice(0, Math.floor(myRobots.length / 2));

    for (const robot of myRobots) {
      // This robot will try to get more grass

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
            1,
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
