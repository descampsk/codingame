/* eslint-disable class-methods-use-this */
import { Action } from "./Actions";
import { recyclerBuilder } from "./RecyclerBuilder";
import { robotBuilder } from "./RobotBuilder";
import { robotManager } from "./RobotManager";

export class IA {
  actions: Action[] = [];

  chooseAction() {
    const recyclerActions = recyclerBuilder.action();
    const robotActions = robotManager.action();
    const robotBuilderActions = robotBuilder.action();
    this.actions = [
      ...recyclerActions,
      ...robotActions,
      ...robotBuilderActions,
    ];
  }

  endTurn() {
    if (this.actions.length) {
      console.log(this.actions.map((action) => action.output()).join(";"));
    } else {
      console.log("WAIT");
    }
  }
}

export const ia = new IA();
