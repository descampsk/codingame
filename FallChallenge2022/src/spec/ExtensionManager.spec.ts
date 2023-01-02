/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ExpansionManager } from "../ExpansionManager";
import { readTestFile } from "../helpers";
import {
  computeData,
  computeStartPosition,
  createMap,
  map,
  parseLineToMap,
} from "../State";

const prepareMap = (fileName: string) => {
  const lines = readTestFile(fileName);
  lines.pop();
  //   debug(line);
  const [width, height] = lines
    .shift()!
    .split(" ")
    .map((value) => Number.parseInt(value, 10));
  map.splice(0);
  map.push(...createMap(width, height));

  lines.shift();
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const line = lines.shift()!;
      parseLineToMap(line, i, j, map);
    }
  }
  computeData();
  computeStartPosition(true);
  return map;
};

describe("ExtensionManager", () => {
  describe("computeSeparation", () => {
    it.each([
      {
        fileName: "./src/maps/01.txt",
        expectedSeparation: [
          [7, 0],
          [7, 1],
          [7, 2],
          [7, 3],
          [7, 4],
          [7, 5],
          [7, 6],
        ],
      },
      {
        fileName: "./src/maps/02.txt",
        expectedSeparation: [
          [6, 0],
          [6, 1],
          [6, 2],
          [6, 3],
          [6, 4],
        ],
      },
      {
        fileName: "./src/maps/03.txt",
        expectedSeparation: [
          [6, 0],
          [6, 1],
          [6, 2],
          [6, 3],
          [6, 5],
          [6, 6],
        ],
      },
      {
        fileName: "./src/maps/1567014237252874200.txt",
        expectedSeparation: [
          [7, 0],
          [7, 1],
          [7, 2],
          [7, 3],
          [7, 4],
          [7, 5],
          [7, 6],
        ],
      },
    ])(
      "should get the right separation from the map $fileName",
      ({
        fileName,
        expectedSeparation,
      }: {
        fileName: string;
        expectedSeparation: number[][];
      }) => {
        prepareMap(fileName);
        const extensionManager = new ExpansionManager();
        extensionManager.computeSeparation();
        expect(
          extensionManager.separation.map((block) => [block.x, block.y])
        ).toEqual(expectedSeparation);
        extensionManager.moveToSeparation();
      }
    );
  });
});
