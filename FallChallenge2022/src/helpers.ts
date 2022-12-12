import { Point } from "@mathigon/euclid";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debug = (...data: any[]) => {
  console.error(...data);
};

export const computeBlockDistance = (
  blockA: { position: Point },
  blockB: { position: Point }
) => Point.distance(blockA.position, blockB.position);
