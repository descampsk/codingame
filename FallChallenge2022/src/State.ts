import { Point } from "@mathigon/euclid";

export const turn = 0;

export let width = 0;
export let height = 0;
export let visiblePelletCount = 0;
export enum Block {
  Floor = " ",
  Wall = "#",
  Bullet = ".",
}

export const map: Record<string, Block> = {};

export type Bullet = {
  position: Point;
  value: number;
};
export const bullets: Record<string, Bullet> = {};

export let myScore = 0;
export let enemyScore = 0;

export let visiblePacCount = 0;

export type Pac = {
  id: number;
  position: Point;
  type: string;
  speedTurnsLeft: number;
  abilityCooldown: number;
};
export const myPacs: Record<number, Pac> = {};
export const enemyPacs: Record<number, Pac> = {};

export const getMap = () => {
  [width, height] = readline()
    .split(" ")
    .map((value) => Number.parseInt(value, 10));
  for (let i = 0; i < height; i++) {
    const row: string = readline(); // one line of the grid: space " " is floor, pound "#" is wall
    for (let j = 0; j < row.length; j++) {
      map[`${j},${i}`] = row[j] as Block;
    }
  }
};

export const setBlockMap = (x: number, y: number, block: Block) => {
  map[`${x},${y}`] = block;
};

export const getBlock = (x: number, y: number) => map[`${x},${y}`];

export const readInputs = () => {
  const scores: string[] = readline().split(" ");
  myScore = parseInt(scores[0], 10);
  enemyScore = parseInt(scores[1], 10);
  visiblePacCount = parseInt(readline(), 10); // all your pacs and enemy pacs in sight
  for (let i = 0; i < visiblePacCount; i++) {
    const inputs: string[] = readline().split(" ");
    const id: number = parseInt(inputs[0], 10); // pac number (unique within a team)
    const mine: boolean = inputs[1] !== "0"; // true if this pac is yours
    const x: number = parseInt(inputs[2], 10); // position in the grid
    const y: number = parseInt(inputs[3], 10); // position in the grid
    const type: string = inputs[4]; // unused in wood leagues
    const speedTurnsLeft: number = parseInt(inputs[5], 10); // unused in wood leagues
    const abilityCooldown: number = parseInt(inputs[6], 10); // unused in wood leagues
    if (mine) {
      myPacs[id] = {
        id,
        position: new Point(x, y),
        type,
        speedTurnsLeft,
        abilityCooldown,
      };
    } else {
      enemyPacs[id] = {
        id,
        position: new Point(x, y),
        type,
        speedTurnsLeft,
        abilityCooldown,
      };
    }
  }
  visiblePelletCount = parseInt(readline()); // all pellets in sight
  for (let i = 0; i < visiblePelletCount; i++) {
    const inputs: string[] = readline().split(" ");
    const x: number = parseInt(inputs[0]);
    const y: number = parseInt(inputs[1]);
    const value: number = parseInt(inputs[2]); // amount of points this pellet is worth
    setBlockMap(x, y, Block.Bullet);
    bullets[`${x},${y}`] = {
      position: new Point(x, y),
      value,
    };
  }
};

export const refresh = () => {
  readInputs();
};
