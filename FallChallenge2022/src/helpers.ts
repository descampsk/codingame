import { Point } from "@mathigon/euclid";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debug = (...data: any[]) => {
  console.error(...data);
};

export const computeManhattanDistance = (
  blockA: { position: Point },
  blockB: { position: Point }
) =>
  Math.abs(blockA.position.x - blockB.position.x) +
  Math.abs(blockA.position.y - blockB.position.y);
