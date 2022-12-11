import { computeSiteDistance } from "./helper";
import { GameState, Owner } from "./State";

export class BarrackBuilder {
  private state: GameState;

  private bestBarrackToBuildId: number | null = null;

  constructor(state: GameState) {
    this.state = state;
  }

  shouldDoAction() {
    const { myKnightBarracks } = this.state;
    return myKnightBarracks.length < 1;
  }

  chooseBestBarrackToBuild() {
    console.error("chooseBestBarrackToBuild");
    const { nearestSitesEmpty, queen, side } = this.state;
    const nearestSiteDistance = computeSiteDistance(
      nearestSitesEmpty[0],
      queen
    );
    const possibleBarracks = nearestSitesEmpty
      .filter(
        (site) => computeSiteDistance(site, queen) < nearestSiteDistance + 200
      )
      .sort((a, b) => (a.position.x - b.position.x) * side);
    console.error(
      "chooseBestBarrackToBuild",
      possibleBarracks.map(({ id }) => id)
    );
    this.bestBarrackToBuildId = possibleBarracks[0].id;
    return possibleBarracks[0];
  }

  action() {
    const { sites } = this.state;
    console.error("BarrackBuilder action");
    if (this.bestBarrackToBuildId) {
      console.error("bestBarrackToBuildId already choosen");
      console.log(`BUILD ${this.bestBarrackToBuildId} BARRACKS-KNIGHT`);
    } else {
      const { id } = this.chooseBestBarrackToBuild();
      console.log(`BUILD ${id} BARRACKS-KNIGHT`);
    }
    if (
      this.bestBarrackToBuildId &&
      sites[this.bestBarrackToBuildId].owner === Owner.ALLY
    ) {
      this.bestBarrackToBuildId = null;
    }
  }
}
