/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Owner, blocks, myBlocks, opponentBlocks } from "./State";
import { computeManhattanDistance, debug, debugTime, minBy } from "./helpers";

export class Score {
  public myScore = 0;

  public opponentScore = 0;

  public precision = 0;

  private SHOULD_DEBUG = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private debug(...data: any[]) {
    if (this.SHOULD_DEBUG) debug("[Score]", ...data);
  }

  computeScore() {
    const start = new Date();
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
    let opponentContestedScore = 0;
    for (const block of contestedBlocks) {
      const distanceToMineBlock = minBy(myBlocks, (a) =>
        computeManhattanDistance(a, block)
      ).value!;
      const distanceToOpponentBlock = minBy(opponentBlocks, (a) =>
        computeManhattanDistance(a, block)
      ).value!;
      if (distanceToMineBlock < distanceToOpponentBlock) myContestedScore += 1;
      if (distanceToMineBlock > distanceToOpponentBlock)
        opponentContestedScore += 1;
    }

    this.myScore = mySecureScored + myContestedScore - myUselessScore;
    this.opponentScore =
      opponentSecuredScore + opponentContestedScore - opponentUselessScore;

    this.precision =
      ((mySecureScored + opponentSecuredScore) * 100) /
      (mySecureScored +
        myContestedScore +
        opponentSecuredScore +
        opponentContestedScore);

    this.debug("Score", {
      precision: this.precision,
      myScore: this.myScore,
      opponentScore: this.opponentScore,
      myUselessScore,
      opponentUselessScore,
      mySecureScored,
      opponentSecuredScore,
      myContestedScore,
      opponentContestedScore,
    });

    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`computeScore time: ${end} ms`);
  }
}

export const score = new Score();
