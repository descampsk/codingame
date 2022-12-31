import { Block } from "../Block";
import { Owner } from "../State";
import { dijtstraAlgorithm } from "../djikstra";

describe("dijtstraAlgorithm", () => {
  let grid: Block[][] = [];
  beforeEach(() => {
    grid = [];
    for (let i = 0; i < 4; i++) {
      const row = [];
      for (let j = 0; j < 4; j++) {
        row.push(new Block(j, i, 2, Owner.NONE, 0, false, true, true, false));
      }
      grid.push(row);
    }
    grid.flat().forEach((block) => block.updateNeighbors(grid));
  });

  it("should compute correctly without obstacles", () => {
    const distances = dijtstraAlgorithm(grid, [[0, 0]]);
    console.log(distances); // affichera un tableau 2D contenant les distances de Manhattan de chaque case à l'origine
    expect(distances).toEqual([
      [0, 1, 2, 3],
      [1, 2, 3, 4],
      [2, 3, 4, 5],
      [3, 4, 5, 6],
    ]);
  });

  it("should compute correctly with obstacles", () => {
    grid[1][2].scrapAmount = 0;
    grid[2][1].recycler = true;
    const distances = dijtstraAlgorithm(grid, [[0, 0]]);
    console.log(distances); // affichera un tableau 2D contenant les distances de Manhattan de chaque case à l'origine
    expect(distances).toEqual([
      [0, 1, 2, 3],
      [1, 2, Infinity, 4],
      [2, Infinity, 6, 5],
      [3, 4, 5, 6],
    ]);
  });

  it("should compute correctly with different beginning position", () => {
    grid[1][2].scrapAmount = 0;
    grid[2][1].recycler = true;
    const distances = dijtstraAlgorithm(grid, [[0, 2]]);
    console.log(distances); // affichera un tableau 2D contenant les distances de Manhattan de chaque case à l'origine
    expect(distances).toEqual([
      [2, 1, 0, 1],
      [3, 2, Infinity, 2],
      [4, Infinity, 4, 3],
      [5, 6, 5, 4],
    ]);
  });

  it("should compute correctly with two starting positions", () => {
    grid[1][2].scrapAmount = 0;
    grid[2][1].recycler = true;
    const distances = dijtstraAlgorithm(grid, [
      [1, 1],
      [2, 2],
    ]);
    console.log(distances); // affichera un tableau 2D contenant les distances de Manhattan de chaque case à l'origine
    expect(distances).toEqual([
      [2, 1, 2, 3],
      [1, 0, Infinity, 2],
      [2, Infinity, 0, 1],
      [3, 2, 1, 2],
    ]);
  });
});
