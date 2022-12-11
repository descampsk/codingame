import { GoldIA } from "./GoldIA";
import { GameState } from "./State";

const state = new GameState();
state.getSites();

const ia = new GoldIA(state);

// game loop
// eslint-disable-next-line no-constant-condition
while (true) {
  state.refresh();

  ia.chooseAction();
}
