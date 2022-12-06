import { Circle, Point } from "@mathigon/euclid";
import { GameState, Owner, Structure, UnitType } from "./State";

enum Side {
  UP = -1,
  DOWN = 1,
  UNKNOWN = 0,
}

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

  checkRush() {
    const { nearestSites } = this.state;
    const maxMineSize = nearestSites
      .slice(0, 2)
      .reduce((income, site) => income + site.maxMineSize, 0);

    if (
      this.state.turn === 1 &&
      this.state.queen.health < 100 &&
      maxMineSize >= 4
    ) {
      this.isRushable = true;
    }
    console.error("isRushable", this.isRushable);
  }

  checkDangerQueen(dangerRadius = 10000) {
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
      console.error("DANGER", position, queenPosition);
      if (
        Point.distance(position, queenPosition) < dangerRadius &&
        ennemyKnights.length > 2
      ) {
        return true;
      }
    }
    return false;
  }

  doRush() {
    const {
      nearestSites,
      nearestSitesEmpty,
      myMines,
      myNearestMines,
      queen,
      myKnightBarracks,
      gold,
      myIncome,
      mySites,
      myTowers,
    } = this.state;

    if (!this.rushTrained) {
      const { id } = nearestSitesEmpty.filter(
        (site) =>
          (this.side === Side.DOWN && site.position.y > 550) ||
          (this.side === Side.UP && site.position.y < 450)
      )[0];
      if (
        myNearestMines.length &&
        myNearestMines[0].cooldown < myNearestMines[0].maxMineSize &&
        myIncome < 5
      ) {
        console.log(`BUILD ${myNearestMines[0].id} MINE`);
      } else if (myMines.length < 2 && myIncome < 4) {
        console.log(`BUILD ${id} MINE`);
      } else if (myKnightBarracks.length < 2) {
        console.log(`BUILD ${id} BARRACKS-KNIGHT`);
      } else {
        console.log(`BUILD ${id} TOWER`);
      }
    } else {
      const myNearestSites = nearestSites.filter(
        (site) =>
          site.owner !== Owner.ALLY && site.structure !== Structure.TOWER
      );
      console.log(`BUILD ${myNearestSites[0].id} TOWER`);
    }

    if (gold >= 160 && myKnightBarracks.length >= 2) {
      this.rushTrained = true;
      console.log(`TRAIN ${myKnightBarracks.map((site) => site.id).join(" ")}`);
    } else {
      console.log("TRAIN");
    }
  }

  doAction() {
    const {
      sites,
      queen,
      gold,
      turn,
      mySites,
      myMines,
      myArcherBarracks,
      myKnightBarracks,
      myGiantBarracks,
      ennemyKnightBarracks,
      ennemyArcherBarracks,
      ennemyTowers,
      ennemyKnights,
      myArchers,
      myGiants,
    } = this.state;
    const queenInDanger = this.checkDangerQueen();
    const nearestSites = Object.values(sites).sort(
      (siteA, siteB) =>
        Point.distance(siteA.position, queen.position) -
        Point.distance(siteB.position, queen.position)
    );

    let nearestSitesEmpty = nearestSites.filter(
      (site) => site.owner !== Owner.ALLY && site.structure !== Structure.TOWER
    );

    if (ennemyTowers.length >= 3 || queenInDanger) {
      nearestSitesEmpty = nearestSitesEmpty.filter(
        (site) =>
          (this.side === Side.UP && site.position.x <= 1920 / 2) ||
          (this.side === Side.DOWN && site.position.x >= 1920 / 2)
      );
    }

    const nearestSitesEmptyWithAlliesTower = nearestSites.filter(
      (site) =>
        (site.owner === Owner.ALLY && site.structure === Structure.TOWER) ||
        (site.owner === Owner.ENNEMY && site.structure !== Structure.TOWER) ||
        site.owner === Owner.NONE
    );
    const nearestMines = nearestSites.filter(
      (site) =>
        site.owner === Owner.ALLY &&
        site.structure === Structure.MINE &&
        Point.distance(site.position, queen.position) < 300
    );

    const nearestTowers = nearestSites.filter(
      (site) => site.owner === Owner.ALLY && site.structure === Structure.TOWER
    );

    const siteToBuild =
      nearestSitesEmptyWithAlliesTower[0] ?? nearestSitesEmpty[0];

    if (!siteToBuild) {
      console.error(
        "nearestSitesEmptyWithAlliesTower",
        nearestSitesEmptyWithAlliesTower
      );
      console.error("nearestSitesEmpty", nearestSitesEmpty);

      console.log("WAIT");
    } else if (queenInDanger) {
      const nearestSiteEmpty = nearestSitesEmpty[0];
      const nearestTower = nearestTowers.filter((tower) => tower.unit < 300)[0];
      if (
        nearestTower &&
        Point.distance(nearestTower.position, queen.position) <
          Point.distance(nearestSiteEmpty.position, queen.position)
      ) {
        console.log(`BUILD ${nearestTower.id} TOWER`);
      } else {
        console.log(`BUILD ${nearestSiteEmpty.id} TOWER`);
      }
    } else if (
      nearestMines.length &&
      nearestMines[0].cooldown < nearestMines[0].maxMineSize
    ) {
      console.log(`BUILD ${nearestMines[0].id} MINE`);
    } else if (ennemyKnightBarracks.length - myArcherBarracks.length > 1) {
      console.log(`BUILD ${siteToBuild.id} BARRACKS-ARCHER`);
    } else if (!myKnightBarracks.length || gold >= 300) {
      console.log(`BUILD ${siteToBuild.id} BARRACKS-KNIGHT`);
    } else if (ennemyTowers.length >= 2 && !myGiantBarracks.length) {
      console.log(`BUILD ${siteToBuild.id} BARRACKS-GIANT`);
    } else if (siteToBuild.maxMineSize >= 3 && siteToBuild.gold > 0) {
      console.log(`BUILD ${siteToBuild.id} MINE`);
    } else if (myArcherBarracks.length === 0) {
      console.log(`BUILD ${siteToBuild.id} BARRACKS-ARCHER`);
    } else if (siteToBuild.gold > 0) {
      console.log(`BUILD ${siteToBuild.id} MINE`);
    } else {
      console.log(`BUILD ${siteToBuild.id} TOWER`);
    }

    const barracksSiteIds = [];

    const giantSites = myGiantBarracks.map((site) => site.id);
    let possibleGiant = 0;
    let waitForGiant = false;
    if ((ennemyTowers.length - myGiants.length) / 2 > 1) {
      possibleGiant = Math.floor(this.state.gold / 140);
      if (!possibleGiant) waitForGiant = true;
      for (let i = 0; i < possibleGiant; i++) {
        barracksSiteIds.push(giantSites[i]);
      }
    }

    let possibleArchers = 0;
    let waitForArcher = false;
    const archerSiteIds = myArcherBarracks.map((site) => site.id);
    if (
      !waitForGiant &&
      archerSiteIds.length &&
      (ennemyKnights.length > myArchers.length ||
        (ennemyKnightBarracks.length >= 2 && myArchers.length <= 2))
    ) {
      possibleArchers = Math.floor((gold - possibleGiant * 140) / 100);
      if (!possibleArchers) waitForArcher = true;
      for (let i = 0; i < possibleArchers; i++) {
        barracksSiteIds.push(archerSiteIds[i]);
      }
    }
    const knightSiteIds = myKnightBarracks.map((site) => site.id);
    if (!waitForGiant && !waitForArcher && knightSiteIds.length) {
      const possibleKnights = Math.floor(
        (gold - 100 * possibleArchers - 140 * possibleGiant) / 80
      );
      for (let i = 0; i < possibleKnights; i++) {
        barracksSiteIds.push(knightSiteIds[i]);
      }
    }
    const definedBarracksSiteIds = barracksSiteIds.filter(
      (site) => site !== undefined
    );
    console.error("siteIds", barracksSiteIds);
    if (definedBarracksSiteIds.length) {
      console.log(`TRAIN ${definedBarracksSiteIds.join(" ")}`);
    } else {
      console.log("TRAIN");
    }
  }

  doDefensive() {
    const { nearestSites, myTowers, myKnightBarracks, ennemyKnights, queen } =
      this.state;

    // We remove towers too near from the ennemy Knights
    const mySafeTowers = myTowers.filter((tower) => {
      const circle = new Circle(tower.position, 300);
      const ennemyInRadius = ennemyKnights.reduce((total, ennemy) => {
        if (circle.contains(ennemy.position)) {
          return total + 1;
        }
        return total;
      }, 0);
      return ennemyInRadius < 3;
    });

    const nearestSitesWithoutTower = nearestSites.filter(
      (site) =>
        !(
          site.structure === Structure.BARRACKS &&
          site.owner === Owner.ENNEMY &&
          site.cooldown > 1
        ) &&
        site.structure !== Structure.TOWER &&
        (site.structure !== Structure.BARRACKS || !site.cooldown) &&
        (site.structure !== Structure.MINE ||
          (site.cooldown < 2 && site.maxMineSize < 2)) &&
        !(site.position.x < 1000 && this.side === Side.DOWN)
    );
    const nearestEnnemyKnight = ennemyKnights[0];
    const nearestEnnemyKnightDistance = nearestEnnemyKnight
      ? Point.distance(nearestEnnemyKnight.position, queen.position)
      : 2000;
    if (!myKnightBarracks.length && nearestSitesWithoutTower.length) {
      console.log(`BUILD ${nearestSitesWithoutTower[0].id} BARRACKS-KNIGHT`);
    } else if (
      myTowers.length &&
      myTowers[0].unit < 500 &&
      nearestEnnemyKnightDistance > 500
    ) {
      console.log(`BUILD ${myTowers[0].id} TOWER`);
    } else if (nearestSitesWithoutTower.length && myTowers.length < 3) {
      console.log(`BUILD ${nearestSitesWithoutTower[0].id} TOWER`);
    } else if (mySafeTowers.length) {
      if (
        nearestSitesWithoutTower.length &&
        Point.distance(mySafeTowers[0].position, queen.position) >
          Point.distance(nearestSitesWithoutTower[0].position, queen.position)
      ) {
        console.log(`BUILD ${nearestSitesWithoutTower[0].id} TOWER`);
      } else {
        const minHealthTower = mySafeTowers.sort(
          (a, b) => a.cooldown - b.cooldown
        );
        console.log(`BUILD ${minHealthTower[0].id} TOWER`);
      }
    } else if (nearestSitesWithoutTower.length) {
      console.log(`BUILD ${nearestSitesWithoutTower[0].id} TOWER`);
    } else {
      console.error("doDefensive waiting", nearestSitesWithoutTower, myTowers);
      console.log(`WAIT`);
    }
  }

  doBuildMines() {
    const { myNearestMines, nearestSitesEmpty, myKnightBarracks } = this.state;
    const possibleMines = nearestSitesEmpty.filter((site) => site.gold);
    if (
      myNearestMines.length &&
      myNearestMines[0].cooldown < myNearestMines[0].maxMineSize
    ) {
      console.log(`BUILD ${myNearestMines[0].id} MINE`);
    } else if (possibleMines.length && possibleMines[0].maxMineSize > 1) {
      console.log(`BUILD ${possibleMines[0].id} MINE`);
    } else if (!myKnightBarracks.length) {
      console.log(`BUILD ${possibleMines[0].id} BARRACKS-KNIGHT`);
    } else if (possibleMines.length) {
      console.log(`BUILD ${possibleMines[0].id} MINE`);
    } else {
      console.error(
        "doBuildMines waiting",
        myNearestMines.length,
        nearestSitesEmpty.length
      );
      console.log(`WAIT`);
    }
  }

  doMakeBarracks() {
    const { nearestSitesEmpty } = this.state;
    if (nearestSitesEmpty.length) {
      console.log(`BUILD ${nearestSitesEmpty[0].id} BARRACKS-KNIGHT`);
    } else {
      console.error("doMakeBarracks waiting", nearestSitesEmpty);
      console.log(`WAIT`);
    }
  }

  doGoldAndWait(maxIncome = 8, goldTurn = 50) {
    const { myIncome, turn, myKnightBarracks, gold } = this.state;
    if (this.checkDangerQueen()) {
      this.doDefensive();
    } else if (myIncome <= maxIncome && turn <= goldTurn) {
      this.doBuildMines();
    } else if (myKnightBarracks.length <= myIncome / 8) {
      this.doMakeBarracks();
    } else {
      this.doBuildMines();
    }

    if (myKnightBarracks.length) {
      if (myIncome >= 9 && gold > 200) {
        console.log(
          `TRAIN ${myKnightBarracks.map((site) => site.id).join(" ")}`
        );
      } else {
        console.log(
          `TRAIN ${myKnightBarracks.map((site) => site.id).join(" ")}`
        );
      }
    } else {
      console.log("TRAIN");
    }
  }
}
