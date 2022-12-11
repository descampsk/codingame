import { Point } from "@mathigon/euclid";

export const computeSiteDistance = (
  siteA: { position: Point },
  siteB: { position: Point }
) => Point.distance(siteA.position, siteB.position);
