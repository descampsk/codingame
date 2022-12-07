import { Point } from "@mathigon/euclid";

export enum Structure {
  NONE = -1,
  MINE = 0,
  TOWER = 1,
  BARRACKS = 2,
}

export enum Owner {
  NONE = -1,
  ALLY = 0,
  ENNEMY = 1,
}

export enum UnitType {
  NONE = -2,
  QUEEN = -1,
  KNIGHT = 0,
  ARCHER = 1,
  GIANT = 2,
}

type Unit = {
  position: Point;
  type: UnitType;
  owner: Owner;
  health: number;
};

export type Site = {
  id: number;
  position: Point;
  radius: number;
  structure: Structure;
  owner: Owner;
  cooldown: number;
  unit: UnitType;
  gold: number;
  maxMineSize: number;
};

export class GameState {
  turn = 0;

  maxHigh = 1000;

  maxWight = 1920;

  numSites = 0;

  sites: Record<number, Site> = {};

  nearestSites: Site[] = [];

  nearestSitesEmpty: Site[] = [];

  mySites: Site[] = [];

  goldPerSite: Record<number, number> = {};

  myMines: Site[] = [];

  myNearestMines: Site[] = [];

  myTowers: Site[] = [];

  myArcherBarracks: Site[] = [];

  myKnightBarracks: Site[] = [];

  myGiantBarracks: Site[] = [];

  ennemySites: Site[] = [];

  ennemyKnightBarracks: Site[] = [];

  ennemyArcherBarracks: Site[] = [];

  ennemyTowers: Site[] = [];

  myUnits: Unit[] = [];

  myArchers: Unit[] = [];

  myKnights: Unit[] = [];

  myGiants: Unit[] = [];

  ennemyUnits: Unit[] = [];

  ennemyKnights: Unit[] = [];

  ennemyArchers: Unit[] = [];

  gold = 0;

  myIncome = 0;

  touchedSite = 0;

  queen: Unit = {
    position: new Point(0, 0),
    type: UnitType.QUEEN,
    owner: Owner.ALLY,
    health: 0,
  };

  units: Unit[] = [];

  /**
   * Ligne 1: un entier numSites, indiquant le nombre de sites de construction présents sur la carte.
   * Les numSites lignes suivantes : 4 entiers représentant l'identifiant siteId, les coordonnées x et y, et le rayon radius
   * d'un site de construction.
   */
  getSites() {
    this.numSites = parseInt(readline(), 10);
    for (let i = 0; i < this.numSites; i++) {
      const inputs = readline().split(" ");
      const siteId = parseInt(inputs[0], 10);
      const x = parseInt(inputs[1], 10);
      const y = parseInt(inputs[2], 10);
      const radius = parseInt(inputs[3], 10);
      this.sites[siteId] = {
        id: siteId,
        position: new Point(x, y),
        radius,
        structure: Structure.NONE,
        owner: Owner.NONE,
        cooldown: 0,
        unit: UnitType.NONE,
        gold: 0,
        maxMineSize: 0,
      };
    }
  }

  /**
   *
   */
  readInputs() {
    this.turn += 1;
    const [gold, touchedSite] = readline()
      .split(" ")
      .map((value) => parseInt(value, 10));
    this.gold = gold;
    this.touchedSite = touchedSite;

    for (let i = 0; i < this.numSites; i++) {
      const siteInput = readline().split(" ");
      const siteId = parseInt(siteInput[0], 10);
      const gold = parseInt(siteInput[1], 10);
      if (gold !== -1) {
        this.goldPerSite[siteId] = gold;
        this.sites[siteId].gold = gold;
      } else {
        this.sites[siteId].gold = this.goldPerSite[siteId] ?? gold;
      }
      this.sites[siteId].maxMineSize = parseInt(siteInput[2], 10);
      this.sites[siteId].structure = parseInt(siteInput[3], 10); // -1 = No structure, 2 = Barracks
      this.sites[siteId].owner = parseInt(siteInput[4], 10); // -1 = No structure, 0 = Friendly, 1 = Enemy
      this.sites[siteId].cooldown = parseInt(siteInput[5], 10);
      this.sites[siteId].unit = parseInt(siteInput[6], 10);
    }
    const numUnits = parseInt(readline(), 10);
    this.units = [];
    for (let i = 0; i < numUnits; i++) {
      const unitInput = readline().split(" ");
      const x = parseInt(unitInput[0], 10);
      const y = parseInt(unitInput[1], 10);
      const owner = parseInt(unitInput[2], 10);
      const type = parseInt(unitInput[3], 10); // -1 = QUEEN, 0 = KNIGHT, 1 = ARCHER
      const health = parseInt(unitInput[4], 10);
      this.units.push({
        position: new Point(x, y),
        health,
        type,
        owner,
      });
    }
    this.queen = this.units.find(
      (unit) => unit.type === UnitType.QUEEN && unit.owner === Owner.ALLY
    ) as Unit;
  }

  computeSitesInformation() {
    this.nearestSites = Object.values(this.sites).sort(
      (siteA, siteB) =>
        Point.distance(siteA.position, this.queen.position) -
        Point.distance(siteB.position, this.queen.position)
    );

    this.nearestSitesEmpty = this.nearestSites.filter(
      (site) => site.owner !== Owner.ALLY && site.structure !== Structure.TOWER
    );
  }

  computeBarracksInformation() {
    this.mySites = Object.values(this.sites).filter(
      (site) => site.owner === Owner.ALLY
    );
    this.myMines = this.mySites.filter(
      (site) => site.structure === Structure.MINE
    );
    this.myIncome = this.myMines.reduce(
      (previousIncome, site) => previousIncome + site.cooldown,
      0
    );
    this.myNearestMines = this.myMines
      .filter(
        (site) =>
          site.owner === Owner.ALLY &&
          site.structure === Structure.MINE &&
          Point.distance(site.position, this.queen.position) < 300
      )
      .sort(
        (siteA, siteB) =>
          Point.distance(siteA.position, this.queen.position) -
          Point.distance(siteB.position, this.queen.position)
      );
    this.myTowers = this.mySites
      .filter((site) => site.structure === Structure.TOWER)
      .sort(
        (siteA, siteB) =>
          Point.distance(siteA.position, this.queen.position) -
          Point.distance(siteB.position, this.queen.position)
      );
    this.myArcherBarracks = this.mySites.filter(
      (site) => site.unit === UnitType.ARCHER
    );
    this.myKnightBarracks = this.mySites.filter(
      (site) => site.unit === UnitType.KNIGHT
    );
    this.myGiantBarracks = this.mySites.filter(
      (site) => site.unit === UnitType.GIANT
    );
    this.ennemySites = Object.values(this.sites).filter(
      (site) => site.owner === Owner.ENNEMY
    );
    this.ennemyKnightBarracks = Object.values(this.ennemySites).filter(
      (site) => site.unit === UnitType.KNIGHT
    );
    this.ennemyArcherBarracks = Object.values(this.ennemySites).filter(
      (site) => site.unit === UnitType.ARCHER
    );
    this.ennemyTowers = this.ennemySites.filter(
      (site) => site.structure === Structure.TOWER
    );
  }

  computeUnitsInformation() {
    this.myUnits = Object.values(this.units).filter(
      (unit) => unit.owner === Owner.ALLY
    );
    this.myKnights = this.myUnits.filter(
      (unit) => unit.type === UnitType.KNIGHT
    );
    this.myArchers = this.myUnits.filter(
      (unit) => unit.type === UnitType.ARCHER
    );
    this.myGiants = this.myUnits.filter((unit) => unit.type === UnitType.GIANT);
    this.ennemyUnits = Object.values(this.units).filter(
      (unit) => unit.owner === Owner.ENNEMY
    );
    this.ennemyKnights = Object.values(this.ennemyUnits)
      .filter((unit) => unit.type === UnitType.KNIGHT)
      .sort(
        (siteA, siteB) =>
          Point.distance(siteA.position, this.queen.position) -
          Point.distance(siteB.position, this.queen.position)
      );
    this.ennemyArchers = Object.values(this.ennemyUnits).filter(
      (unit) => unit.type === UnitType.ARCHER
    );
  }

  refresh() {
    this.readInputs();
    this.computeBarracksInformation();
    this.computeUnitsInformation();
    this.computeSitesInformation();
  }
}
