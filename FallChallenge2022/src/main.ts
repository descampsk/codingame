import { ia } from "./IA";
import { getMap, refresh } from "./State";

getMap();

// game loop
// eslint-disable-next-line no-constant-condition
while (true) {
  refresh();

  ia.chooseAction();
  ia.endTurn();
}
