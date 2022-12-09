import { Circle, Line, Point } from "@mathigon/euclid";
import { GameState, Owner, Site, Structure, UnitType } from "./State";

enum Side {
  UP = -1,
  DOWN = 1,
  UNKNOWN = 0,
}

const computeSiteDistance = (
  siteA: { position: Point },
  siteB: { position: Point }
) => Point.distance(siteA.position, siteB.position);

const computeNearSite = (site: Site, sites: Site[]) => {
  const circle = new Circle(site.position, 400);
  return sites.reduce(
    (total, nearSite) => total + (circle.contains(nearSite.position) ? 1 : 0),
    -1
  );
};

export class IA {
  private state: GameState;

  isRushable = false;

  rushTrained = false;

  side: Side = Side.UNKNOWN;

  constructor(state: GameState) {
    this.state = state;
  }

  checkSide() {
    if (this.side === Side.UNKNOWN) {
      this.side = this.state.queen.position.x > 500 ? Side.DOWN : Side.UP;
    }
  }

  checkDangerQueen(dangerRadius = 1000) {
    const { queen, ennemyKnights, ennemyKnightBarracks } = this.state;
    for (const barrack of ennemyKnightBarracks) {
      if (
        Point.distance(barrack.position, queen.position) < 600 &&
        barrack.cooldown &&
        barrack.cooldown < 4
      ) {
        return true;
      }
    }
    for (const unit of ennemyKnights) {
      const { position } = unit;
      const queenPosition = queen.position;
      const distance = Point.distance(position, queenPosition);
      if (
        distance < dangerRadius &&
        (ennemyKnights.length > 2 ||
          computeSiteDistance(ennemyKnights[0], queen) < 200 ||
          queen.health < 25)
      ) {
        return true;
      }
    }
    return false;
  }

  isMinesOnTheWay(destination: Point) {
    const { myMines, queen } = this.state;
    const line = new Line(destination, queen.position);
    for (const mine of myMines) {
      console.error(mine.id, line.distanceSquared(mine.position));
      if (
        Math.sqrt(line.distanceSquared(mine.position)) < 100 &&
        computeSiteDistance(mine, queen) < 300
      ) {
        return true;
      }
    }
    return false;
  }

  isSafeFromTower(site: Site) {
    const { myTowers, ennemyTowers, queen, myKnights } = this.state;
    if (queen.health > 30) {
      for (const tower of myTowers) {
        if (Point.distance(site.position, tower.position) < tower.unit) {
          return true;
        }
      }
    }

    for (const tower of ennemyTowers) {
      let isKnightAtRange = false;
      for (const knight of myKnights) {
        if (computeSiteDistance(knight, tower) < tower.unit) {
          isKnightAtRange = true;
        }
      }
      if (computeSiteDistance(site, tower) < tower.unit && !isKnightAtRange) {
        return false;
      }
    }
    return true;
  }

  areMinesFullyUpgraded() {
    const { myMines } = this.state;
    for (const mine of myMines) {
      if (mine.cooldown !== mine.maxMineSize) {
        return false;
      }
    }
    return true;
  }

  canTowerShoot(tower: Site) {
    const { ennemyKnights } = this.state;
    for (const knight of ennemyKnights) {
      console.error(
        Point.distance(tower.position, knight.position),
        tower.unit
      );
      if (Point.distance(tower.position, knight.position) <= tower.unit) {
        return true;
      }
    }
    return false;
  }

  doDefensive() {
    const {
      nearestSites,
      myTowers,
      myKnightBarracks,
      ennemyKnightBarracks,
      ennemyKnights,
      queen,
      myIncome,
      gold,
      myMines,
    } = this.state;

    console.error("doDefensive");
    // We remove towers too near from the ennemy Knights
    // And with more than 700 health
    const mySafeTowers = myTowers.filter((tower) => {
      if (tower.cooldown > 700) {
        return false;
      }

      const circle = new Circle(tower.position, 300);
      const ennemyInRadius = ennemyKnights.reduce((total, ennemy) => {
        if (circle.contains(ennemy.position)) {
          return total + 1;
        }
        return total;
      }, 0);
      return (
        ennemyInRadius < 3 ||
        Point.distance(queen.position, tower.position) < 200
      );
    });

    const nearestSitesWithoutTower = nearestSites
      .filter(
        (site) =>
          !(
            site.structure === Structure.BARRACKS &&
            site.owner === Owner.ENNEMY &&
            site.cooldown > 1
          ) &&
          site.structure !== Structure.TOWER &&
          !(
            site.structure === Structure.BARRACKS &&
            (site.cooldown || myIncome > 0)
          ) &&
          (site.structure !== Structure.MINE ||
            (site.cooldown < 2 && site.maxMineSize < 2 && myMines.length > 3))
      )
      .filter((site) => {
        for (const knight of ennemyKnights) {
          const knightToTower = Point.distance(knight.position, site.position);
          const queenToTower = Point.distance(queen.position, site.position);
          if (
            knightToTower < queenToTower &&
            queenToTower > 200 &&
            knightToTower < 800 &&
            !(this.side === Side.DOWN && site.position.x > 1000)
          ) {
            return false;
          }
        }
        return true;
      });

    if (
      ennemyKnights.length &&
      computeSiteDistance(ennemyKnights[0], queen) < 200
    ) {
      console.error("Running away from ennemy");
      if (
        nearestSitesWithoutTower.length &&
        computeSiteDistance(nearestSitesWithoutTower[0], queen) < 300
        // Seems to work badly...
        // (this.side * queen.position.x <
        //   this.side * nearestSitesWithoutTower[0].position.x ||
        //   queen.health > 30)
      ) {
        console.error("Building tower because we are near from it");
        console.log(`BUILD ${nearestSitesWithoutTower[0].id} TOWER`);
      } else {
        console.error("Running");
        const ennemiesAround = ennemyKnights.reduce(
          (total, knight) =>
            total + (computeSiteDistance(knight, queen) < 100 ? 1 : 0),
          0
        );
        let target = new Point(0, 0);
        if (ennemiesAround < 3 || !ennemyKnightBarracks.length) {
          console.error("Running far away from the unit");
          const line = new Line(ennemyKnights[0].position, queen.position);
          target = line.at(5);
        } else {
          console.error("Running far away from the barrack");
          const line = new Line(
            ennemyKnightBarracks[0].position,
            queen.position
          );
          target = line.at(5);
        }

        // To avoid blocking on the wall
        let { x, y } = target;
        if (target.x > 1920) x = 1920 - 30;
        if (target.x < 0) x = 30;
        if (target.y > 1000) y = 1000 - 30;
        if (target.y < 0) y = 30;
        console.log(`MOVE ${Math.round(x)} ${Math.round(y)}`);
      }
    } else if (
      !myKnightBarracks.length &&
      nearestSitesWithoutTower.length &&
      gold > 80
    ) {
      console.error("Making barracks because attack is the best defense");
      this.doMakeBarracks();
    } else if (
      myTowers.length &&
      myTowers[0].cooldown < 700 &&
      (!this.canTowerShoot(myTowers[0]) || myTowers[0].cooldown < 700)
    ) {
      console.error("Upgrading tower");
      console.log(`BUILD ${myTowers[0].id} TOWER`);
    } else if (
      nearestSitesWithoutTower.length &&
      (ennemyKnights.length / 4 >= myTowers.length || !ennemyKnights.length)
    ) {
      console.error("Building new tower");
      console.log(`BUILD ${nearestSitesWithoutTower[0].id} TOWER`);
    } else if (mySafeTowers.length && myTowers.length >= 3) {
      console.error("Trying to heal existing towers");
      if (
        nearestSitesWithoutTower.length &&
        Point.distance(mySafeTowers[0].position, queen.position) >
          Point.distance(nearestSitesWithoutTower[0].position, queen.position)
      ) {
        console.error("Building new tower because no existing tower are safe");
        console.log(`BUILD ${nearestSitesWithoutTower[0].id} TOWER`);
      } else {
        console.error("Healing tower");
        const minHealthTower = mySafeTowers.sort(
          (a, b) => a.cooldown - b.cooldown
        );
        console.log(`BUILD ${minHealthTower[0].id} TOWER`);
      }
    } else if (nearestSitesWithoutTower.length) {
      console.error("Building tower as there is nothing else to do");
      console.error(mySafeTowers, myTowers);
      console.log(`BUILD ${nearestSitesWithoutTower[0].id} TOWER`);
    } else {
      console.error(
        "doDefensive waiting",
        nearestSitesWithoutTower,
        myTowers,
        mySafeTowers
      );
      console.log(`WAIT`);
    }
  }

  doBuildMines() {
    console.error("doBuildMines");
    const {
      myNearestMines,
      nearestSites,
      myKnightBarracks,
      myTowers,
      ennemyTowers,
      turn,
    } = this.state;
    const possibleMines = nearestSites
      .filter(
        (site) =>
          site.gold &&
          !(
            site.owner === Owner.ENNEMY && site.structure === Structure.TOWER
          ) &&
          !(site.owner === Owner.ALLY && site.structure === Structure.MINE) &&
          !(
            site.owner === Owner.ALLY &&
            site.structure === Structure.TOWER &&
            site.cooldown > 200
          ) &&
          !(
            site.owner === Owner.ALLY &&
            site.structure === Structure.BARRACKS &&
            turn < 50
          )
      )
      .filter((site) => {
        for (const tower of ennemyTowers) {
          if (Point.distance(site.position, tower.position) < tower.unit) {
            return false;
          }
        }
        return true;
      });

    const mineToBuild = possibleMines[0];

    if (
      myNearestMines.length &&
      myNearestMines[0].cooldown < myNearestMines[0].maxMineSize
    ) {
      console.error("Upgrading Mines");
      console.log(`BUILD ${myNearestMines[0].id} MINE`);
    } else if (mineToBuild && mineToBuild.maxMineSize > 1) {
      console.error(
        `Building Mines because it has a max size of ${mineToBuild.maxMineSize}`
      );
      console.log(`BUILD ${mineToBuild.id} MINE`);
      // } else if (!myKnightBarracks.length) {
      //   console.error("Building Barracks");
      //   console.log(`BUILD ${mineToBuild.id} BARRACKS-KNIGHT`);
    } else if (possibleMines.length) {
      console.error("Building Mines because it is the last option");
      console.log(`BUILD ${mineToBuild.id} MINE`);
    } else {
      console.error(
        "doBuildMines waiting",
        myNearestMines.length,
        possibleMines.length
      );
      console.log(`WAIT`);
    }
  }

  doMakeBarracks() {
    console.error("doMakeBarracks");
    const { nearestSitesEmpty, queen } = this.state;
    const possibleBarracks = nearestSitesEmpty.filter((site) =>
      this.isSafeFromTower(site)
    );
    if (possibleBarracks.length > 1) {
      if (
        Math.abs(
          computeSiteDistance(possibleBarracks[1], queen) -
            computeSiteDistance(possibleBarracks[0], queen)
        ) < 400 &&
        ((this.side === Side.UP &&
          possibleBarracks[1].position.x > possibleBarracks[0].position.x &&
          possibleBarracks[0].position.x < 400) ||
          (this.side === Side.DOWN &&
            possibleBarracks[1].position.x < possibleBarracks[0].position.x &&
            possibleBarracks[0].position.x > 1500))
      ) {
        console.error("Building a barrack a bit far away");
        console.log(`BUILD ${possibleBarracks[1].id} BARRACKS-KNIGHT`);
      } else {
        console.error(
          "Building a barrack because the second is too far away",
          computeSiteDistance(possibleBarracks[1], queen),
          computeSiteDistance(possibleBarracks[0], queen),
          possibleBarracks[1].id,
          possibleBarracks[0].id
        );
        console.log(`BUILD ${possibleBarracks[0].id} BARRACKS-KNIGHT`);
      }
    } else if (possibleBarracks.length) {
      console.error("Building a barrack");
      console.log(`BUILD ${possibleBarracks[0].id} BARRACKS-KNIGHT`);
    } else {
      console.error("doMakeBarracks waiting", possibleBarracks);
      console.log(`WAIT`);
    }
  }

  doGoldAndWait(maxIncome = 8) {
    const {
      myIncome,
      myKnightBarracks,
      queen,
      ennemyQueen,
      myTowers,
      myMines,
    } = this.state;
    if (this.checkDangerQueen()) {
      this.doDefensive();
    } else if (
      (myIncome <= maxIncome && myMines.length < 3) ||
      !this.areMinesFullyUpgraded()
    ) {
      this.doBuildMines();
    } else if (queen.health <= 10 || myTowers.length < 2) {
      this.doDefensive();
    } else if (myKnightBarracks.length <= myIncome / 8) {
      this.doMakeBarracks();
    } else {
      this.doBuildMines();
    }

    if (myKnightBarracks.length) {
      const barrackToTrain = myKnightBarracks.sort(
        (a, b) =>
          computeSiteDistance(a, ennemyQueen) -
          computeSiteDistance(b, ennemyQueen)
      )[0].id;
      console.log(`TRAIN ${barrackToTrain}`);
    } else {
      console.log("TRAIN");
    }
  }

  doTowerRush() {
    const {
      nearestSitesEmpty,
      myTowers,
      ennemyKnights,
      queen,
      myMines,
      myNearestMines,
      myKnightBarracks,
    } = this.state;
    const possibleMines = nearestSitesEmpty.filter((site) => site.gold > 0);
    const possibleTowers = nearestSitesEmpty.filter((site) => {
      if (this.side === Side.DOWN && site.position.x < 1200) {
        return true;
      }
      if (this.side === Side.UP && site.position.x > 700) {
        return true;
      }
      return false;
    });

    if (
      ennemyKnights.length &&
      computeSiteDistance(ennemyKnights[0], queen) < 200
    ) {
      console.error("Running away from ennemy");
      console.error(
        nearestSitesEmpty[0],
        computeSiteDistance(nearestSitesEmpty[0], queen)
      );
      if (
        nearestSitesEmpty.length &&
        computeSiteDistance(nearestSitesEmpty[0], queen) < 200
      ) {
        console.error("Building tower because we are near from it");
        console.log(`BUILD ${nearestSitesEmpty[0].id} TOWER`);
      } else {
        console.error("Running");
        const line = new Line(ennemyKnights[0].position, queen.position);
        const target = line.at(100);
        console.log(`MOVE ${Math.round(target.x)} ${Math.round(target.y)}`);
      }
    } else if (
      myNearestMines.length &&
      myNearestMines[0].cooldown < myNearestMines[0].maxMineSize
    ) {
      console.error("Upgrading mine");
      console.log(`BUILD ${myNearestMines[0].id} MINE`);
    } else if (!myMines.length && possibleMines.length) {
      console.error("Building mine because we have any");
      console.log(`BUILD ${possibleMines[0].id} MINE`);
    } else if (!myKnightBarracks.length) {
      console.error("Building Barrack because we have any");
      console.log(`BUILD ${nearestSitesEmpty[0].id} BARRACKS-KNIGHT`);
    } else if (myTowers.length && myTowers[0].cooldown < 700) {
      console.error("Upgrading tower");
      console.log(`BUILD ${myTowers[0].id} TOWER`);
    } else if (nearestSitesEmpty.length) {
      console.error("Building tower");
      console.log(`BUILD ${nearestSitesEmpty[0].id} TOWER`);
    } else {
      console.error("doDefensive waiting", possibleTowers, myTowers);
      console.log(`WAIT`);
    }

    if (myKnightBarracks.length) {
      console.log(`TRAIN ${myKnightBarracks.map((site) => site.id).join(" ")}`);
    } else {
      console.log("TRAIN");
    }
  }
}
