import { IA } from "./IA";
import { GameState } from "./State";

const state = new GameState();
const ia = new IA(state);

// game loop
// eslint-disable-next-line no-constant-condition
while (true) {
  state.readInputs();

  // console.error(state.checkpoints);

  ia.doDiscovery();

  console.error("NextCheckPointIndex", state.nextCheckpointIndex);
  console.error(state.nextCheckpointDist);

  const { x, y, thrust } = ia.computeDestination();
  console.error(x, y, thrust);

  console.log(`${x} ${y} ${thrust}`);
}
