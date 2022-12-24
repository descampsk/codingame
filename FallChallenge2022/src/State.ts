/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Block } from "./Block";
import { debug } from "./helpers";
import { Island } from "./Island";
import { findSymmetryAxis } from "./symetrie";

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

export let blocks: Block[] = [];
export let emptyBlocks: Block[] = [];

export let islands: Island[] = [];

export let myBlocks: Block[] = [];
export let notMyBlocks: Block[] = [];
export let opponentBlocks: Block[] = [];

export let myRobots: Block[] = [];
export let opponentRobots: Block[] = [];
export let dangerousOpponentRobots: Block[] = [];

export const myRobotsDistanceMap: Record<string, number[][]> = {};

export let myRecyclers: Block[] = [];
export let opponentRecyclers: Block[] = [];

export const getMap = () => {
  [width, height] = readline()
    .split(" ")
    .map((value) => Number.parseInt(value, 10));
  for (let i = 0; i < height; i++) {
    const blocks: Block[] = [];
    for (let j = 0; j < width; j++) {
      blocks.push(
        new Block(j, i, 0, Owner.NONE, 0, false, false, false, false)
      );
    }
    map.push(blocks);
  }
};

export const readInputs = () => {
  const start = new Date();
  const matters = readline().split(" ");
  myMatter = parseInt(matters[0]);
  oppMatter = parseInt(matters[1]);
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const inputs = readline().split(" ");
      const scrapAmount = parseInt(inputs[0]);
      const owner = parseInt(inputs[1]); // 1 = me, 0 = foe, -1 = neutral
      const units = parseInt(inputs[2]);
      const recycler = parseInt(inputs[3]) > 0;
      const canBuild = parseInt(inputs[4]) > 0;
      const canSpawn = parseInt(inputs[5]) > 0;
      const inRangeOfRecycler = parseInt(inputs[6]) > 0;
      map[i][j].update({
        scrapAmount,
        owner,
        units,
        recycler,
        canBuild,
        canSpawn,
        inRangeOfRecycler,
      });
    }
  }
  const end = new Date().getTime() - start.getTime();
  if (debugTime) debug("readInputs time: %dms", end);
};

const computeData = () => {
  const start = new Date();
  blocks = map.flat();
  myBlocks = [];
  notMyBlocks = [];
  opponentBlocks = [];
  emptyBlocks = [];
  myRobots = [];
  opponentRobots = [];
  dangerousOpponentRobots = [];
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
    if (block.isDangerousRobotOpponent) dangerousOpponentRobots.push(block);
  });

  if (side === Side.UNKNOWN)
    side = myRobots[0].x < width / 2 ? Side.LEFT : Side.RIGHT;

  const end = new Date().getTime() - start.getTime();
  if (debugTime) debug("computeData time: %dms", end);
};

const computeStartPosition = () => {
  if (startPositionFound) return;

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
};

export const refresh = () => {
  turn += 1;
  readInputs();

  computeData();

  computeStartPosition();

  //   const symetrie = findSymmetryAxis(map, "central");
  //   console.log(symetrie);

  //   debug("WillBcomeGrass", map[3][6].willBecomeGrass);

  //   debug("Block:", map[6][2].getPotentiel(5));
  //   debug("Block:", map[6][1].getPotentiel(5));
  //   debug("Block:", map[5][2].getPotentiel(5));
  //   debug("Block:", map[5][1].getPotentiel(5));

  islands = Island.findIslands();
  //   debug("Island:", islands.length);
  //   debug("Block:", map[4][4].neighbors);
  //   debug("Island:", map[1][6].neighbors);
};
