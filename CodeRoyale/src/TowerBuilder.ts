import { computeSiteDistance } from "./helper";
import { GameState, Owner, Site, Structure } from "./State";

export class TowerBuilder {
  private state: GameState;

  constructor(state: GameState) {
    this.state = state;
  }

  shouldDoAction() {
    const { myTowers } = this.state;
    return myTowers.length < 4 || this.canHealTower();
  }

  getTowersToHeal() {
    const { myTowers } = this.state;
    const towersToHeal = myTowers.slice(0, 3).filter((tower) => {
      if (!TowerBuilder.isTowerFullUpgraded(tower, 700)) {
        return true;
      }
      return false;
    });
    return towersToHeal;
  }

  canHealTower() {
    return this.getTowersToHeal().length;
  }

  hasAtLeastTwoNearSites(site: Site, range = 300) {
    const { nearestSites } = this.state;
    let total = 0;
    const neighbors = [];
    for (const neighbor of nearestSites) {
      if (
        computeSiteDistance(neighbor, site) < range &&
        (neighbor.owner === Owner.NONE ||
          (neighbor.structure === Structure.TOWER &&
            neighbor.owner === Owner.ALLY))
      ) {
        total += 1;
        const { id, owner, structure } = neighbor;
        neighbors.push({ id, owner, structure });
      }
    }
    // console.error("hasAtLeastTwoNearSites", site.id, total, neighbors);
    return total > 2;
  }

  chooseBestTowerToBuild() {
    console.error("chooseBestTowerToBuild");
    const { nearestSitesEmpty, ennemyKnights, queen, myTowers } = this.state;
    const nearestEnnemyKnight = ennemyKnights[0];
    const siteFarAwayFromEnnemies = nearestSitesEmpty.filter((site) => {
      if (!myTowers.length && (site.position.y < 200 || site.position.y > 800))
        return false;
      if (
        nearestEnnemyKnight &&
        computeSiteDistance(site, queen) >
          computeSiteDistance(site, nearestEnnemyKnight)
      )
        return false;
      if (this.hasAtLeastTwoNearSites(site)) return true;
      return false;
    });
    console.error(
      "siteFarAwayFromEnnemies",
      siteFarAwayFromEnnemies.map(({ id }) => id)
    );
    return siteFarAwayFromEnnemies[0];
  }

  static isTowerFullUpgraded(tower: Site, health = 700) {
    return tower.cooldown > health;
  }

  canTowerShoot(tower: Site) {
    const { ennemyKnights } = this.state;
    for (const knight of ennemyKnights) {
      if (computeSiteDistance(tower, knight) <= tower.unit + tower.radius) {
        return true;
      }
    }
    return false;
  }

  action() {
    const { myTowers, nearestSitesEmpty, queen } = this.state;
    console.error("TowerBuilder action");
    const nearestTower = myTowers[0];
    const bestTowerToBuild = this.chooseBestTowerToBuild();
    const towerToBuild = bestTowerToBuild ?? nearestSitesEmpty[0];
    if (!nearestTower) {
      console.error("Building first tower");
      console.log(`BUILD ${towerToBuild.id} TOWER`);
    } else if (this.canHealTower() && !this.canTowerShoot(nearestTower)) {
      console.error("Upgrading tower");
      const towerToHeal = this.getTowersToHeal()[0];
      console.log(`BUILD ${towerToHeal.id} TOWER`);
    } else if (
      computeSiteDistance(queen, towerToBuild) < 600 &&
      myTowers.length < 4
    ) {
      console.error("Building tower as it is not too far away");
      console.log(`BUILD ${towerToBuild.id} TOWER`);
    } else if (myTowers.length) {
      console.error("Healing tower as not too bad action");
      console.log(`BUILD ${myTowers[0].id} TOWER`);
    } else {
      console.error("Waiting as nothing interesting is possible");
      console.log("WAIT");
    }
  }
}
