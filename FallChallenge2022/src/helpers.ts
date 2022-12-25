import { readFileSync } from "fs";
import { Block } from "./Block";
import { DEBUG } from "./State";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debug = (...data: any[]) => {
  if (DEBUG) console.error(...data);
};

export function minBy<T>(
  array: Array<T>,
  callback: (value: T) => number
): { min: T | null; index: number | null } {
  let min = Infinity;
  let minObj = null;
  let minIndex = null;
  for (const [index, a] of array.entries()) {
    const val = callback(a);
    if (val < min) {
      min = val;
      minObj = a;
      minIndex = index;
    }
  }
  return { min: minObj, index: minIndex };
}

export const computeManhattanDistance = (blockA: Block, blockB: Block) =>
  Math.abs(blockA.x - blockB.x) + Math.abs(blockA.y - blockB.y);

export const readTestFile = (fileName: string): string[] => {
  const file = readFileSync(fileName, "utf-8");
  return file.split(/\r?\n/);
};
