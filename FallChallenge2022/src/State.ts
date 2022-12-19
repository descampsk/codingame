import { Point } from "@mathigon/euclid";
import { Block } from "./Block";
import { dijtstraAlgorithm } from "./djikstra";
import { debug } from "./helpers";
import { Island } from "./Island";

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
  NONE = -1,
  ME = 1,
  OPPONENT = 0,
}

export let side: Side = Side.UNKNOWN;
export const map: Block[][] = [];

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
        new Block(new Point(j, i), 0, Owner.NONE, 0, false, false, false, false)
      );
    }
    map.push(blocks);
  }
};

export const readInputs = () => {
  const readInputsStart = new Date();
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

  const endReadInputs = new Date().getTime() - readInputsStart.getTime();
  debug("ReadInputs time: %dms", endReadInputs);
};

const computeData = () => {
  const computeDataStart = new Date();
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
    if (block.owner === Owner.ME && block.units) myRobots.push(block);
    if (block.owner === Owner.OPPONENT && block.units)
      opponentRobots.push(block);
    if (block.owner === Owner.ME && block.recycler) myRecyclers.push(block);
    if (block.owner === Owner.OPPONENT && block.recycler)
      opponentRecyclers.push(block);
    if (block.isDangerousRobotOpponent) dangerousOpponentRobots.push(block);
  });

  if (side === Side.UNKNOWN)
    side = myRobots[0].position.x < width / 2 ? Side.LEFT : Side.RIGHT;

  const computeDataEnd = new Date().getTime() - computeDataStart.getTime();
  debug("computeData time: %dms", computeDataEnd);
};

const computeDjikstraMap = () => {
  const computeDjikstraMapStart = new Date();
  const usefullBlocks = blocks.filter(
    (block) => block.canMove && block.owner === Owner.ME
  );
  usefullBlocks.forEach((block) => {
    // eslint-disable-next-line no-param-reassign
    block.djikstraMap = dijtstraAlgorithm(
      map,
      block.position.y,
      block.position.x
    );
  });
  const computeDjikstraMapEnd =
    new Date().getTime() - computeDjikstraMapStart.getTime();
  debug("computeDjikstraMap time: %dms", computeDjikstraMapEnd);
};

export const refresh = () => {
  turn += 1;
  readInputs();
  debug(`############# Turn ${turn} #############`);

  computeData();

  computeDjikstraMap();

  islands = Island.findIslands();
  //   debug(
  //     "islands:",
  //     islands.length,
  //     islands.map((island) => island.blocks[0].position)
  //   );

  debug(
    "dangerousOpponentRobots",
    dangerousOpponentRobots.map((robot) => robot.position)
  );
};
