/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-useless-constructor */
import { expensionManager } from "./ExpensionManager";
import { dijtstraAlgorithm } from "./djikstra";
import { computeManhattanDistance, minBy } from "./helpers";
import { Island } from "./Island";
import { height, map, myRecyclers, notMyBlocks, Owner, width } from "./State";

export class Block {
  public djikstraMap: number[][] = [];

  public island: Island | null = null;

  // eslint-disable-next-line no-use-before-define
  public neighbors: Block[] = [];

  // eslint-disable-next-line no-use-before-define
  public neighborsWithRecycler: Block[] = [];

  public hasMoved = false;

  private potentiel: number | null = null;

  private gains: {
    gains: number;
    gainsPerTurn: number;
    grassCreated: number;
  } | null = null;

  constructor(
    public x: number,
    public y: number,
    public scrapAmount: number,
    public owner: Owner,
    public units: number,
    public recycler: boolean,
    public canBuild: boolean,
    public canSpawn: boolean,
    public inRangeOfRecycler: boolean
  ) {}

  equals(block: Block) {
    return block && this.x === block.x && this.y === block.y;
  }

  static clone(block: Block) {
    return new Block(
      block.x,
      block.y,
      block.scrapAmount,
      block.owner,
      block.units,
      block.recycler,
      block.canBuild,
      block.canSpawn,
      block.inRangeOfRecycler
    );
  }

  public get canMove(): boolean {
    return !this.recycler && this.scrapAmount > 0;
  }

  public get isGrass(): boolean {
    return this.scrapAmount === 0;
  }

  public get willBecomeGrass(): number {
    let totalRecycler = 0;
    const { x, y } = this;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (
          x + j >= 0 &&
          y + i >= 0 &&
          x + j < width &&
          y + i < height &&
          Math.abs(i) !== Math.abs(j)
        ) {
          const block = map[y + i][x + j];
          if (block.recycler) {
            totalRecycler += 1;
          }
        }
      }
    }

    return totalRecycler === 0
      ? Infinity
      : Math.ceil(this.scrapAmount / totalRecycler);
  }

  public get isDangerousRobotOpponent(): boolean {
    if (this.owner !== Owner.OPPONENT || this.units === 0) return false;

    const { x, y } = this;
    let ownerBlockDifference = 0;
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        if (x + j > 0 && y + i >= 0 && x + j < width && y + i < height) {
          const block = map[y + i][x + j];
          if (block.owner === Owner.ME) ownerBlockDifference += 1;
          if (block.owner === Owner.OPPONENT) ownerBlockDifference -= 1;
        }
      }
    }

    return ownerBlockDifference > 3;
  }

  updateNeighbors(map: Block[][]) {
    this.neighbors = [];
    this.neighborsWithRecycler = [];
    const { x, y } = this;
    if (x > 0) {
      if (map[y][x - 1].canMove) this.neighbors.push(map[y][x - 1]);
      if (map[y][x - 1].recycler)
        this.neighborsWithRecycler.push(map[y][x - 1]);
    }
    if (x < map[0].length - 1) {
      if (map[y][x + 1].canMove) this.neighbors.push(map[y][x + 1]);
      if (map[y][x + 1].recycler)
        this.neighborsWithRecycler.push(map[y][x + 1]);
    }

    if (y > 0) {
      if (map[y - 1][x].canMove) this.neighbors.push(map[y - 1][x]);
      if (map[y - 1][x].recycler)
        this.neighborsWithRecycler.push(map[y - 1][x]);
    }

    if (y < map.length - 1) {
      if (map[y + 1][x].canMove) this.neighbors.push(map[y + 1][x]);
      if (map[y + 1][x].recycler)
        this.neighborsWithRecycler.push(map[y + 1][x]);
    }
  }

  update({
    scrapAmount,
    owner,
    units,
    recycler,
    canBuild,
    canSpawn,
    inRangeOfRecycler,
  }: {
    scrapAmount: number;
    owner: Owner;
    units: number;
    recycler: boolean;
    canBuild: boolean;
    canSpawn: boolean;
    inRangeOfRecycler: boolean;
  }) {
    this.scrapAmount = scrapAmount;
    this.owner = owner;
    this.units = units;
    this.recycler = recycler;
    this.canBuild = canBuild;
    this.canSpawn = canSpawn;
    this.inRangeOfRecycler = inRangeOfRecycler;
    this.island = null;
    this.djikstraMap = [];
    this.potentiel = null;
    this.gains = null;
    this.hasMoved = false;
  }

  distanceToBlock(block: Block) {
    if (!block) return Infinity;
    const { x, y } = block;

    if (this.djikstraMap.length) {
      return this.djikstraMap[y][x];
    }
    if (block.djikstraMap.length) {
      return block.djikstraMap[this.y][this.x];
    }
    this.djikstraMap = dijtstraAlgorithm(map, [[this.y, this.x]]);
    return this.djikstraMap[y][x];
  }

  public get distanceToSeparation() {
    const { separation } = expensionManager;
    const distance = minBy(separation, (block) =>
      this.distanceToBlock(block)
    ).value;
    return distance !== null ? distance : Infinity;
  }

  public get isOnSeparation() {
    return !!expensionManager.separation.find((block) => block.equals(this));
  }

  public get initialOwner() {
    return expensionManager.mapOwner[this.y][this.x].owner;
  }

  getPotentiel(radius: number) {
    if (this.potentiel) return this.potentiel;
    this.potentiel = 0;
    for (let i = 0; i < notMyBlocks.length; i++) {
      const block = notMyBlocks[i];
      let distance = this.distanceToBlock(block);
      if (distance === 0) distance = 0.5;
      if (distance <= radius) {
        if (block.owner === Owner.OPPONENT) this.potentiel += 2 / distance;
        else if (block.owner === Owner.NONE) this.potentiel += 1 / distance;
      }
    }
    return this.potentiel;
  }

  isNearOfARecycler() {
    for (const recycler of myRecyclers) {
      if (computeManhattanDistance(recycler, this) < 3) {
        return true;
      }
    }
    return false;
  }

  computeGains() {
    if (this.gains) return this.gains;
    const nearCoordinates = [
      [-1, 0],
      [1, 0],
      [0, 1],
      [0, -1],
    ];
    const { scrapAmount } = this;
    let total = scrapAmount;
    let grassCreated = 1;
    for (const nearCoordinate of nearCoordinates) {
      const [x, y] = nearCoordinate;
      const nearBlockX = this.x + x;
      const nearBlockY = this.y + y;
      if (
        nearBlockX >= 0 &&
        nearBlockX < width &&
        nearBlockY >= 0 &&
        nearBlockY < height
      ) {
        const nearBlock = map[this.y + y][this.x + x];
        if (!this.isNearOfARecycler()) {
          total +=
            nearBlock.scrapAmount > scrapAmount
              ? scrapAmount
              : nearBlock.scrapAmount;
        }

        if (nearBlock.scrapAmount <= scrapAmount && !this.isNearOfARecycler())
          grassCreated += 1;
      }
    }
    this.gains = {
      gains: total,
      gainsPerTurn: total / scrapAmount,
      grassCreated,
    };
    return this.gains;
  }

  /**
   * Should be called sort((a,b) => a.compareOwner(b))
   * @param block
   * @returns
   */
  compareOwner(block: Block) {
    if (this.owner === block.owner) return 0;
    if (this.owner === Owner.ME) {
      return 1;
    }
    if (this.owner === Owner.NONE) {
      if (block.owner === Owner.OPPONENT) return 1;
      if (block.owner === Owner.ME) return -1;
    }
    if (this.owner === Owner.OPPONENT) {
      return -1;
    }
    return 0;
  }

  static createCopyOfMap(map: Block[][]) {
    const copy: Block[][] = [];
    for (let i = 0; i < map.length; i++) {
      const blocks: Block[] = [];
      for (let j = 0; j < map[i].length; j++) {
        blocks.push(Block.clone(map[i][j]));
      }
      copy.push(blocks);
    }
    for (let i = 0; i < map.length; i++) {
      for (let j = 0; j < map[i].length; j++) {
        copy[i][j].updateNeighbors(copy);
      }
    }
    return copy;
  }
}
