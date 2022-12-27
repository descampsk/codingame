/* eslint-disable no-useless-constructor */
import { dijtstraAlgorithm } from "./djikstra";
import { computeManhattanDistance, debug } from "./helpers";
import { Island } from "./Island";
import { height, map, notMyBlocks, Owner, width } from "./State";

export class Block {
  public djikstraMap: number[][] = [];

  public island: Island | null = null;

  // eslint-disable-next-line no-use-before-define
  public neighbors: Block[] = [];

  // eslint-disable-next-line no-use-before-define
  public neighborsWithRecycler: Block[] = [];

  public hasMoved = false;

  private potentiel: number | null = null;

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
    return this.x === block.x && this.y === block.y;
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

  updateNeighbors() {
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
}
