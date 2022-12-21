import { Point } from "@mathigon/euclid";
import { Block } from "./Block";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debug = (...data: any[]) => {
  console.error(...data);
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
