import { IA } from "./IA";
import { GameState } from "./State";

const state = new GameState();
state.getSites();

const ia = new IA(state);

// game loop
// eslint-disable-next-line no-constant-condition
while (true) {
  state.refresh();

  ia.checkSide();
  // ia.checkRush();
  ia.doGoldAndWait();
}
