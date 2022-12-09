import { Point } from "@mathigon/euclid";
import { bigBullets, bullets, myPacs, Pac } from "./State";

const move = (pac: Pac, destination: Point) => {
  console.log(`MOVE ${pac.id} ${destination.x} ${destination.y}`);
};

export const doAction = () => {
  if (bigBullets.length) {
    if (myPacs[0].position.equals(bigBullets[0].position)) {
      move(myPacs[0], new Point(0, 0));
    } else {
      move(myPacs[0], bigBullets[0].position);
    }
  } else {
    move(myPacs[0], new Point(0, 0));
  }
};
