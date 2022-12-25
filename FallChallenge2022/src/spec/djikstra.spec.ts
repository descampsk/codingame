import { Block } from "../Block";
import { dijtstraAlgorithm } from "../djikstra";

describe("dijtstraAlgorithm", () => {
  const canMove = { canMove: true };
  const cantMove = { canMove: false };

  it("should compute correctly without obstacles", () => {
    const grid = [
      [canMove, canMove, canMove, canMove],
      [canMove, canMove, canMove, canMove],
      [canMove, canMove, canMove, canMove],
      [canMove, canMove, canMove, canMove],
    ] as Block[][];
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
    const grid = [
      [canMove, canMove, canMove, canMove],
      [canMove, canMove, cantMove, canMove],
      [canMove, cantMove, canMove, canMove],
      [canMove, canMove, canMove, canMove],
    ] as Block[][];
    const distances = dijtstraAlgorithm(grid, [[0, 0]]);
    console.log(distances); // affichera un tableau 2D contenant les distances de Manhattan de chaque case à l'origine
    expect(distances).toEqual([
      [0, 1, 2, 3],
      [1, 2, Infinity, 4],
      [2, Infinity, 6, 5],
      [3, 4, 5, 6],
    ]);
  });
});
