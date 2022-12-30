import { Heapq } from "ts-heapq";
import type { Block } from "./Block";
import { debug } from "./helpers";
import { debugTime } from "./State";

export const dijtstraAlgorithm = (
  map: Block[][],
  startingBlocks: number[][]
) => {
  const start = new Date();

  const hasVisited = new Set<string>();
  const distances: number[][] = new Array(map.length)
    .fill(Infinity)
    .map(() => new Array(map[0].length).fill(Infinity));
  startingBlocks.forEach(([x, y]) => {
    distances[x][y] = 0;
    hasVisited.add(`${x},${y}`);
  });

  const nextBlocks: Heapq<number[]> = new Heapq<number[]>(
    Array.from(startingBlocks),
    (a, b) => a[2] < b[2]
  );
  let currentBlock: number[] | null = nextBlocks.pop();
  while (currentBlock) {
    const [x, y] = currentBlock;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const xToUpdate = x + i;
        const yToUpdate = y + j;
        if (
          (i !== 0 || j !== 0) &&
          Math.abs(i) !== Math.abs(j) &&
          xToUpdate >= 0 &&
          xToUpdate < map.length &&
          yToUpdate >= 0 &&
          yToUpdate < map[0].length &&
          !hasVisited.has(`${xToUpdate},${yToUpdate}`) &&
          map[xToUpdate][yToUpdate].canMove // &&
          // Performance optimisation as we never try to move 10 blocks away
          // distances[x][y] < 12
        ) {
          const newValue = 1 + distances[x][y];
          if (newValue < distances[xToUpdate][yToUpdate]) {
            distances[xToUpdate][yToUpdate] = newValue;
            nextBlocks.push([xToUpdate, yToUpdate, newValue]);
            hasVisited.add(`${xToUpdate},${yToUpdate}`);
          }
        }
      }
    }
    currentBlock = nextBlocks.length() ? nextBlocks.pop() : null;
  }
  const end = new Date().getTime() - start.getTime();
  if (debugTime) debug("dijtstraAlgorithm time: %dms", end);
  return distances;
};
