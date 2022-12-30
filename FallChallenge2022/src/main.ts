import { expensionManager } from "./ExpensionManager";
import { debug } from "./helpers";
import { ia } from "./IA";
import { debugTime, readInputs, readMapInput, refresh } from "./State";

readMapInput();

// game loop
// eslint-disable-next-line no-constant-condition
while (true) {
  readInputs();
  const start = new Date();
  refresh();
  expensionManager.computeSeparation();
  ia.chooseAction();
  ia.endTurn();
  const end = new Date().getTime() - start.getTime();
  if (debugTime) {
    debug(`Execution time: ${end}ms`);
  }
  debug(`############# End of Turn #############`);
}
