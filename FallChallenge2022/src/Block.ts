/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-useless-constructor */
import { expensionManager } from "./ExpansionManager";
import { dijtstraAlgorithm } from "./djikstra";
import { computeManhattanDistance, minBy } from "./helpers";
import { Island } from "./Island";
import {
  height,
  map,
  myRecyclers,
  opponentRecyclers,
  Owner,
  width,
} from "./State";

export class Block {
  public djikstraMap: number[][] = [];

  public island: Island | null = null;

  // eslint-disable-next-line no-use-before-define
  public neighbors: Block[] = [];

  // eslint-disable-next-line no-use-before-define
  public neighborsWithRecycler: Block[] = [];

  public hasMoved = 0;

  private potentiel: number | null = null;

  private gains: {
    gains: number;
    gainsPerTurn: number;
    grassCreated: number;
    gainsPerGrassCreated: number;
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
    this.hasMoved = 0;
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

  getOneRobotPerUnit() {
    const robots: Block[] = [];
    for (let i = 0; i < this.units - this.hasMoved; i++) {
      robots.push(this);
    }
    return robots;
  }

  getPotentiel(radius: number) {
    if (this.potentiel) return this.potentiel;
    this.potentiel = 0;
    const hasVisited: Set<Block> = new Set();
    hasVisited.add(this);

    let nextBlocks: Block[] = [this];
    for (let i = 0; i <= radius; i++) {
      const currentBlocks = Array.from(nextBlocks);
      nextBlocks = [];
      const distance = i === 0 ? 0.5 : i;
      while (currentBlocks.length) {
        const currentBlock = currentBlocks.pop()!;
        if (currentBlock.owner === Owner.OPPONENT)
          this.potentiel += 2 / distance;
        else if (currentBlock.owner === Owner.NONE)
          this.potentiel += 1 / distance;
        for (const neighbor of currentBlock.neighbors) {
          if (!hasVisited.has(neighbor) && neighbor.canMove) {
            hasVisited.add(neighbor);
            nextBlocks.push(neighbor);
          }
        }
      }
      if (!nextBlocks.length) {
        return this.potentiel;
      }
    }
    return this.potentiel;
  }

  resetPotentiel() {
    this.potentiel = null;
  }

  isNearOfARecycler(owner: Owner) {
    const recyclers = owner === Owner.ME ? myRecyclers : opponentRecyclers;
    for (const recycler of recyclers.filter((block) => !block.equals(this))) {
      if (computeManhattanDistance(recycler, this) < 3) {
        return true;
      }
    }
    return false;
  }

  computeGains(owner = Owner.ME) {
    if (this.gains) return this.gains;
    const { scrapAmount } = this;
    let total = scrapAmount;
    let grassCreated = 1;
    for (const block of this.neighbors) {
      if (!this.isNearOfARecycler(owner)) {
        total +=
          block.scrapAmount > scrapAmount ? scrapAmount : block.scrapAmount;
      }

      if (block.scrapAmount <= scrapAmount && !this.isNearOfARecycler(owner))
        grassCreated += 1;
    }
    this.gains = {
      gains: total,
      gainsPerTurn: total / scrapAmount,
      grassCreated,
      gainsPerGrassCreated: total / grassCreated,
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
