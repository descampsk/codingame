import { debug } from "./helpers";
import { ia } from "./IA";
import { debugTime, getMap, refresh } from "./State";

getMap();

// game loop
// eslint-disable-next-line no-constant-condition
while (true) {
  const start = new Date();
  refresh();
  ia.chooseAction();
  ia.endTurn();
  const end = new Date().getTime() - start.getTime();
  if (debugTime) debug("Execution time: %dms", end);
  debug(`############# End of Turn #############`);
}
