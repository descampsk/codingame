import { Heapq } from "ts-heapq";
import type { Block } from "./Block";
import { debug, debugTime } from "./helpers";

export const dijtstraAlgorithm = (
  map: Block[][],
  startingBlocks: number[][],
  maxTime = 8
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
    const block = map[x][y];
    for (const neighor of block.neighbors) {
      const xToUpdate = neighor.y;
      const yToUpdate = neighor.x;
      if (
        !hasVisited.has(`${xToUpdate},${yToUpdate}`) &&
        map[xToUpdate][yToUpdate].canMove // &&
        // Performance optimisation as we never try to move 10 blocks away
        // distances[x][y] < depth
      ) {
        const newValue = 1 + distances[x][y];
        if (newValue < distances[xToUpdate][yToUpdate]) {
          distances[xToUpdate][yToUpdate] = newValue;
          nextBlocks.push([xToUpdate, yToUpdate, newValue]);
          hasVisited.add(`${xToUpdate},${yToUpdate}`);
        }
      }
    }
    currentBlock = nextBlocks.length() ? nextBlocks.pop() : null;
    const currentTime = new Date().getTime() - start.getTime();
    if (currentTime > maxTime) {
      debug(
        `dijtstraAlgorithm for ${startingBlocks[0][1]},${startingBlocks[0][0]} was cut because time: ${currentTime}ms higher than 5ms`
      );
      return distances;
    }
  }
  const end = new Date().getTime() - start.getTime();
  if (debugTime)
    debug(
      `dijtstraAlgorithm for ${startingBlocks[0][1]},${startingBlocks[0][0]} - time: ${end}ms`
    );
  return distances;
};
