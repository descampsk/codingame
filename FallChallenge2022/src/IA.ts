/* eslint-disable class-methods-use-this */
import { Action, MessageAction } from "./Actions";
import { defenseManager } from "./DefenseManager";
import { expensionManager } from "./ExpansionManager";
import { debug } from "./helpers";
import { recyclerBuilder } from "./RecyclerBuilder";
import { robotBuilder } from "./RobotBuilder";
import { robotManager } from "./RobotManager";
import {
  blocks,
  myBlocks,
  myRobots,
  opponentBlocks,
  opponentRobots,
  Owner,
} from "./State";

export class IA {
  actions: Action[] = [];

  lastScore: { mine: number; opponent: number } = { mine: 0, opponent: 0 };

  turnsWithSameScore = 0;

  lastActions: Action[] = [];

  turnsWithSameActions = 0;

  chooseAction() {
    const defenseActions = defenseManager.computeDefense();
    const recyclerActions = recyclerBuilder.action();
    const moveToSeparationActions = expensionManager.moveAndBuildToSeparation();
    const robotActions = robotManager.action();
    const robotBuilderActions = robotBuilder.action();
    this.actions = [
      ...defenseActions,
      ...recyclerActions,
      ...moveToSeparationActions,
      ...robotActions,
      ...robotBuilderActions,
      //   this.showScorePrediction(),
    ];
  }

  computePredictedScore() {
    const myUselessScore = myBlocks.filter(
      (block) => block.willBecomeGrass < Infinity
    ).length;
    const opponentUselessScore = opponentBlocks.filter(
      (block) => block.willBecomeGrass < Infinity
    ).length;

    const mySecureScored = blocks.filter(
      (block) => block.island?.owner === Owner.ME
    ).length;
    const opponentSecuredScore = blocks.filter(
      (block) => block.island?.owner === Owner.OPPONENT
    ).length;

    const contestedBlocks = blocks.filter(
      (block) => block.island?.owner === Owner.BOTH
    );
    let myContestedScore = 0;
    contestedBlocks.forEach((block) => {
      const myDistanceToBlock = myRobots.reduce((minDistance, robot) => {
        const distance = robot.distanceToBlock(block);
        return minDistance < distance ? minDistance : distance;
      }, Infinity);
      const opponentDistanceToBlock = opponentRobots.reduce(
        (minDistance, robot) => {
          const distance = robot.distanceToBlock(block);
          return minDistance < distance ? minDistance : distance;
        },
        Infinity
      );
      const diff = myDistanceToBlock - opponentDistanceToBlock;
      if (diff < -10) myContestedScore += 1;
      else if (diff > 10) myContestedScore += 0;
      else {
        myContestedScore += 0.5 * (1 - diff / 10);
      }
    });
    myContestedScore = Math.round(myContestedScore);
    const opponentContestedScore = contestedBlocks.length - myContestedScore;

    const myPredictedScore = mySecureScored + myContestedScore - myUselessScore;
    const opponentPredictedScore =
      opponentSecuredScore + opponentContestedScore - opponentUselessScore;

    return {
      myPredictedScore,
      opponentPredictedScore,
      mySecureScored,
      opponentSecuredScore,
      myUselessScore,
      opponentUselessScore,
      myContestedScore,
      opponentContestedScore,
    };
  }

  showScorePrediction() {
    const {
      myPredictedScore,
      opponentPredictedScore,
      mySecureScored,
      opponentSecuredScore,
      myContestedScore,
      myUselessScore,
      opponentContestedScore,
      opponentUselessScore,
    } = this.computePredictedScore();

    let winRatio = 0;
    if (
      mySecureScored - myUselessScore - myContestedScore >
      opponentSecuredScore - opponentUselessScore + opponentContestedScore
    ) {
      winRatio = 100;
    }

    const myRealSecuredScore = mySecureScored - myUselessScore;
    const opponentRealSecuredScore =
      opponentSecuredScore - opponentUselessScore;

    const advantage = myRealSecuredScore - opponentRealSecuredScore;
    if (advantage > 0) {
      winRatio = Math.round(
        ((advantage + myContestedScore) * 100) /
          (advantage + myContestedScore + opponentContestedScore)
      );
    } else {
      winRatio = Math.round(
        100 -
          ((opponentContestedScore - advantage) * 100) /
            (myContestedScore + opponentContestedScore - advantage)
      );
    }
    const loseRatio = 100 - winRatio;
    return new MessageAction(
      `W: ${winRatio} - L: ${loseRatio} - ${myPredictedScore} vs ${opponentPredictedScore}`
    );
  }

  checkSameActions() {
    if (this.actions.length !== this.lastActions.length) {
      this.turnsWithSameActions = 0;
      return;
    }
    for (let i = 0; i < this.actions.length; i++) {
      if (!this.actions[i].equals(this.lastActions[i])) {
        this.turnsWithSameActions = 0;
        return;
      }
    }
    this.turnsWithSameActions += 1;
  }

  checkSameScore() {
    const { mine, opponent } = this.lastScore;
    if (mine === myBlocks.length && opponent === opponentBlocks.length) {
      this.turnsWithSameScore += 1;
    } else {
      this.lastScore.mine = myBlocks.length;
      this.lastScore.opponent = opponentBlocks.length;
      this.turnsWithSameScore = 0;
    }
  }

  endTurn() {
    this.checkSameScore();
    debug("turnsWithSameScore", this.turnsWithSameScore);
    if (this.actions.length) {
      this.lastActions = Array.from(this.actions);
      console.log(this.actions.map((action) => action.output()).join(";"));
    } else {
      console.log("WAIT");
    }
  }
}

export const ia = new IA();
