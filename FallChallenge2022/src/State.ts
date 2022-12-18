import { Point } from "@mathigon/euclid";
import { debug } from "./helpers";

export const turn = 0;

export let width = 0;
export let height = 0;

export let myMatter = 0;
export let oppMatter = 0;

export enum Owner {
  NONE = -1,
  ME = 1,
  OPPONENT = 0,
}

export type Block = {
  position: Point;
  scrapAmount: number;
  owner: Owner;
  units: number;
  recycler: boolean;
  canBuild: boolean;
  canSpawn: boolean;
  inRangeOfRecycler: boolean;
};
export let map: Block[][] = [];

export let blocks: Block[] = [];
export let emptyBlocks: Block[] = [];

export let myBlocks: Block[] = [];
export let notMyBlocks: Block[] = [];
export let opponentBlocks: Block[] = [];

export let myRobots: Block[] = [];
export let opponentRobots: Block[] = [];

export let myRecyclers: Block[] = [];
export let opponentRecyclers: Block[] = [];

export const getMap = () => {
  [width, height] = readline()
    .split(" ")
    .map((value) => Number.parseInt(value, 10));
};

export const readInputs = () => {
  const matters = readline().split(" ");
  myMatter = parseInt(matters[0]);
  oppMatter = parseInt(matters[1]);
  map = [];
  for (let i = 0; i < height; i++) {
    const blocks: Block[] = [];
    for (let j = 0; j < width; j++) {
      const inputs = readline().split(" ");
      const scrapAmount = parseInt(inputs[0]);
      const owner = parseInt(inputs[1]); // 1 = me, 0 = foe, -1 = neutral
      const units = parseInt(inputs[2]);
      const recycler = parseInt(inputs[3]) > 0;
      const canBuild = parseInt(inputs[4]) > 0;
      const canSpawn = parseInt(inputs[5]) > 0;
      const inRangeOfRecycler = parseInt(inputs[6]) > 0;
      blocks.push({
        position: new Point(j, i),
        scrapAmount,
        owner,
        units,
        recycler,
        canBuild,
        canSpawn,
        inRangeOfRecycler,
      });
    }
    map.push(blocks);
  }
};

const computeData = () => {
  blocks = map.flat();
  myBlocks = blocks.filter((block) => block.owner === Owner.ME);
  notMyBlocks = blocks.filter(
    (block) => block.owner !== Owner.ME && block.scrapAmount > 0
  );
  opponentBlocks = blocks.filter((block) => block.owner === Owner.OPPONENT);
  emptyBlocks = blocks.filter((block) => block.owner === Owner.NONE);
  myRobots = myBlocks.filter((block) => block.units > 0);
  opponentRobots = opponentBlocks.filter((block) => block.units > 0);
  myRecyclers = myBlocks.filter((block) => block.recycler);
  opponentRecyclers = opponentBlocks.filter((block) => block.recycler);
};

export const refresh = () => {
  readInputs();
  computeData();
};
