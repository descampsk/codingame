/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Block } from "./Block";
import { expensionManager } from "./ExpensionManager";
import { debug } from "./helpers";
import { Island } from "./Island";

export const DEBUG = false;

export const debugTime = false;

export let turn = 0;

export let width = 0;
export let height = 0;

export let myMatter = 0;
export const setMyMatter = (newMatter: number) => {
  myMatter = newMatter;
};

export let oppMatter = 0;

export enum Side {
  LEFT = 1,
  RIGHT = -1,
  UNKNOWN = 0,
}

export enum Owner {
  BOTH = -2,
  NONE = -1,
  ME = 1,
  OPPONENT = 0,
}

export let side: Side = Side.UNKNOWN;
export const map: Block[][] = [];

export let startPositionFound = false;
export let myStartPosition: Block = new Block(
  0,
  0,
  0,
  Owner.NONE,
  0,
  false,
  false,
  false,
  false
);
export let opponentStartPosition: Block = new Block(
  0,
  0,
  0,
  Owner.NONE,
  0,
  false,
  false,
  false,
  false
);

export const separation: Block[] = [];

export let blocks: Block[] = [];
export let emptyBlocks: Block[] = [];

export let islands: Island[] = [];

export let myBlocks: Block[] = [];
export let notMyBlocks: Block[] = [];
export let opponentBlocks: Block[] = [];

export let myRobots: Block[] = [];
export let opponentRobots: Block[] = [];

export const myRobotsDistanceMap: Record<string, number[][]> = {};

export let myRecyclers: Block[] = [];
export let opponentRecyclers: Block[] = [];

export const createMap = (width: number, height: number) => {
  const map: Block[][] = [];
  for (let i = 0; i < height; i++) {
    const blocks: Block[] = [];
    for (let j = 0; j < width; j++) {
      blocks.push(
        new Block(j, i, 0, Owner.NONE, 0, false, false, false, false)
      );
    }
    map.push(blocks);
  }
  return map;
};

export const readMapInput = () => {
  const line = readline();
  //   debug(line);
  [width, height] = line.split(" ").map((value) => Number.parseInt(value, 10));
  map.push(...createMap(width, height));
};

export const parseLineToMap = (
  line: string,
  i: number,
  j: number,
  mapToUpdate: Block[][]
) => {
  const inputs = line.split(" ");
  const scrapAmount = parseInt(inputs[0]);
  const owner = parseInt(inputs[1]); // 1 = me, 0 = foe, -1 = neutral
  const units = parseInt(inputs[2]);
  const recycler = parseInt(inputs[3]) > 0;
  const canBuild = parseInt(inputs[4]) > 0;
  const canSpawn = parseInt(inputs[5]) > 0;
  const inRangeOfRecycler = parseInt(inputs[6]) > 0;
  mapToUpdate[i][j].update({
    scrapAmount,
    owner,
    units,
    recycler,
    canBuild,
    canSpawn,
    inRangeOfRecycler,
  });
};

export const readInputs = () => {
  const start = new Date();
  const mattersLine = readline();
  //   debug(mattersLine);
  const matters = mattersLine.split(" ");
  myMatter = parseInt(matters[0]);
  oppMatter = parseInt(matters[1]);
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const line = readline();
      //   debug(line);
      parseLineToMap(line, i, j, map);
    }
  }
  const end = new Date().getTime() - start.getTime();
  if (debugTime) debug("readInputs time: %dms", end);
};

export const computeData = () => {
  const start = new Date();
  blocks = map.flat();
  myBlocks = [];
  notMyBlocks = [];
  opponentBlocks = [];
  emptyBlocks = [];
  myRobots = [];
  opponentRobots = [];
  myRecyclers = [];
  opponentRecyclers = [];

  blocks.forEach((block) => {
    block.updateNeighbors();
    if (block.owner === Owner.ME) myBlocks.push(block);
    if (block.owner !== Owner.ME && block.canMove) notMyBlocks.push(block);
    if (block.owner === Owner.OPPONENT) opponentBlocks.push(block);
    if (block.owner === Owner.NONE) emptyBlocks.push(block);
    if (block.owner === Owner.ME && block.units) {
      for (let i = 0; i < block.units; i++) myRobots.push(block);
    }
    if (block.owner === Owner.OPPONENT && block.units)
      opponentRobots.push(block);
    if (block.owner === Owner.ME && block.recycler) myRecyclers.push(block);
    if (block.owner === Owner.OPPONENT && block.recycler)
      opponentRecyclers.push(block);
  });

  if (side === Side.UNKNOWN)
    side = myRobots[0].x < width / 2 ? Side.LEFT : Side.RIGHT;

  const end = new Date().getTime() - start.getTime();
  if (debugTime) debug("computeData time: %dms", end);
};

export const computeStartPosition = (forceReset = false) => {
  const start = new Date();
  if (startPositionFound && !forceReset) return;

  // La case départ est celle en commun pour tous les robots

  myStartPosition = myRobots[0].neighbors.find((block) => {
    for (const robot of myRobots) {
      if (!robot.neighbors.find((neighbor) => neighbor.equals(block)))
        return false;
    }
    return true;
  })!;

  opponentStartPosition = opponentRobots[0].neighbors.find((block) => {
    for (const robot of opponentRobots) {
      if (!robot.neighbors.find((neighbor) => neighbor.equals(block)))
        return false;
    }
    return true;
  })!;

  startPositionFound = true;
  const end = new Date().getTime() - start.getTime();
  if (debugTime) debug("computeStartPosition time: %dms", end);
};

export const refresh = () => {
  turn += 1;
  readInputs();

  computeData();

  computeStartPosition();

  //   debug("WillBcomeGrass", map[3][6].willBecomeGrass);

  //   debug("Block:", map[6][2].getPotentiel(5));
  //   debug("Block:", map[6][1].getPotentiel(5));
  //   debug("Block:", map[5][2].getPotentiel(5));
  //   debug("Block:", map[5][1].getPotentiel(5));

  islands = Island.findIslands();

  expensionManager.computeSeparation();
  //   debug("Island:", islands.length);
  //   debug("Block:", map[4][4].neighbors);
  //   debug("Island:", map[1][6].neighbors);
};
