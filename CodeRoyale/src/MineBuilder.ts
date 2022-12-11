import { computeSiteDistance } from "./helper";
import { GameState, Owner, Site, Structure } from "./State";

export class MineBuilder {
  private state: GameState;

  constructor(state: GameState) {
    this.state = state;
  }

  shouldDoAction() {
    const { myMines } = this.state;
    for (const mine of myMines) {
      if (!MineBuilder.isMineFullyUpgrade(mine)) {
        return true;
      }
    }
    return myMines.length < 2;
  }

  static isMineFullyUpgrade(mine: Site) {
    return mine.maxMineSize === mine.cooldown || mine.maxMineSize === -1;
  }

  chooseBestMineToBuild() {
    const { nearestSites, queen, nearestSitesEmpty, myTowers, side } =
      this.state;
    const nearestToQueenSitesEmpty = nearestSites.filter((site) => {
      if (computeSiteDistance(site, queen) > 500 || site.gold < 50)
        return false;

      if (site.owner === Owner.NONE) return true;

      if (
        site.owner === Owner.ALLY &&
        site.structure === Structure.TOWER &&
        myTowers.length > 3
      ) {
        const towers = myTowers.sort(
          (a, b) => (b.position.x - a.position.x) * side
        );
        const possibleTowerIds = towers
          .slice(0, towers.length - 3)
          .map(({ id }) => id);
        if (possibleTowerIds.includes(site.id)) return true;
      }

      return false;
    });
    const possibleMines = (
      nearestToQueenSitesEmpty.length
        ? nearestToQueenSitesEmpty
        : nearestSitesEmpty
    )
      .slice(0, 2)
      .sort((a, b) => b.maxMineSize - a.maxMineSize);
    console.error(
      "chooseBestMineToBuild",
      possibleMines.map(({ id }) => id)
    );
    return possibleMines[0];
  }

  action() {
    console.error("MineBuilder action");
    const { myMines } = this.state;
    if (myMines.length && !MineBuilder.isMineFullyUpgrade(myMines[0])) {
      console.error("Upgrading mine");
      console.log(`BUILD ${myMines[0].id} MINE`);
    } else {
      const { id } = this.chooseBestMineToBuild();
      console.error("buildMine");
      console.log(`BUILD ${id} MINE`);
    }
  }
}
