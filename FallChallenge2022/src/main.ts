import { expensionManager } from "./ExpansionManager";
import { debug, debugTime } from "./helpers";
import { ia } from "./IA";
import { readInputs, readMapInput, refresh } from "./State";

readMapInput();

// game loop
// eslint-disable-next-line no-constant-condition
while (true) {
  readInputs();
  const start = new Date();
  refresh();
  expensionManager.computeSeparation();
  expensionManager.computeDjikstraMap();
  ia.chooseAction();
  ia.endTurn();
  const end = new Date().getTime() - start.getTime();
  if (debugTime) {
    debug(`Execution time: ${end}ms`);
  }
  debug(`############# End of Turn #############`);
}
