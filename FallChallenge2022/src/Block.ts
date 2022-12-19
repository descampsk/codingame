/* eslint-disable no-useless-constructor */
import { Point } from "@mathigon/euclid";
import { Island } from "./Island";
import { height, map, Owner, width } from "./State";

export class Block {
  public djikstraMap: number[][] = [];

  public island: Island | null = null;

  // eslint-disable-next-line no-use-before-define
  public neighbors: Block[] = [];

  public isGrassInXTurn = 0;

  constructor(
    public position: Point,
    public scrapAmount: number,
    public owner: Owner,
    public units: number,
    public recycler: boolean,
    public canBuild: boolean,
    public canSpawn: boolean,
    public inRangeOfRecycler: boolean
  ) {}

  public get canMove(): boolean {
    return !this.recycler && this.scrapAmount > 0;
  }

  public get isDangerousRobotOpponent(): boolean {
    if (this.owner !== Owner.OPPONENT || this.units === 0) return false;

    const { x, y } = this.position;
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
    const { x, y } = this.position;
    if (x > 0 && map[y][x - 1].canMove) this.neighbors.push(map[y][x - 1]);
    if (x < map[0].length - 1 && map[y][x + 1].canMove)
      this.neighbors.push(map[y][x + 1]);
    if (y > 0 && map[y - 1][x].canMove) this.neighbors.push(map[y - 1][x]);
    if (y < map.length - 1 && map[y + 1][x].canMove)
      this.neighbors.push(map[y + 1][x]);
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
  }

  distanceToBlock(block: Block) {
    const { x, y } = block.position;
    return this.djikstraMap[y][x];
  }
}
