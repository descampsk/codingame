import type { Block } from "./Block";
import { debug } from "./helpers";
import { debugTime } from "./State";

export const dijtstraAlgorithm = (
  map: Block[][],
  startX: number,
  startY: number
) => {
  const start = new Date();

  const distances: number[][] = new Array(map.length)
    .fill(Infinity)
    .map(() => new Array(map[0].length).fill(Infinity));
  distances[startX][startY] = 0;

  const visited: number[][] = new Array(map.length)
    .fill(0)
    .map(() => new Array(map[0].length).fill(0));

  const nextBlocks: number[][] = [];
  let currentBlock = [startX, startY];
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
          !visited[xToUpdate][yToUpdate] &&
          map[xToUpdate][yToUpdate].canMove &&
          // Performance optimisation as we never try to move 10 blocks away
          distances[x][y] < 10
        ) {
          const newValue = 1 + distances[x][y];
          if (newValue < distances[xToUpdate][yToUpdate]) {
            distances[xToUpdate][yToUpdate] = newValue;
            nextBlocks.push([xToUpdate, yToUpdate, newValue]);
            visited[xToUpdate][yToUpdate] = 1;
          }
        }
      }
    }
    nextBlocks.sort((a, b) => a[2] - b[2]);
    [currentBlock] = nextBlocks;
    nextBlocks.shift();
  }
  const end = new Date().getTime() - start.getTime();
  if (debugTime) debug("dijtstraAlgorithm time: %dms", end);
  return distances;
};
