/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { Block } from "./Block";
import { map, myMatter, myRecyclers, setMyMatter } from "./State";
import { debug } from "./helpers";

export interface Action {
  output: () => string;
  equals: (action: Action) => boolean;
}

export class MoveAction implements Action {
  constructor(
    public amount: number,
    public origin: Block,
    public destination: Block
  ) {
    this.origin.units -= this.amount;
    if (this.origin.owner === this.destination.owner)
      this.destination.units += this.amount;
  }

  equals(action: Action) {
    const { amount, origin, destination } = action as MoveAction;
    return (
      this.amount === amount &&
      this.origin.equals(origin) &&
      this.destination.equals(destination)
    );
  }

  output() {
    return `MOVE ${this.amount} ${this.origin.x} ${this.origin.y} ${this.destination.x} ${this.destination.y}`;
  }
}

export class BuildAction implements Action {
  constructor(private block: Block) {
    this.block.canSpawn = false;
    this.block.canBuild = false;
    this.block.recycler = true;
    myRecyclers.push(block);
    setMyMatter(myMatter - 10);
  }

  output() {
    const { x, y } = this.block;
    return `BUILD ${x} ${y}`;
  }

  equals(action: Action) {
    const { block } = action as BuildAction;
    return this.block.equals(block);
  }
}

export class SpawnAction implements Action {
  constructor(private amount: number, public block: Block) {
    this.block.units += amount;
    setMyMatter(myMatter - 10 * amount);

    this.amount = amount;
  }

  equals(action: Action) {
    const { block, amount } = action as SpawnAction;
    return this.block.equals(block) && this.amount === amount;
  }

  output() {
    const { x, y } = this.block;
    return `SPAWN ${this.amount} ${x} ${y}`;
  }
}

export type WaitAction = {
  wait: boolean;
};

export class MessageAction implements Action {
  // eslint-disable-next-line no-useless-constructor
  constructor(public message: string) {}

  equals() {
    return true;
  }

  output() {
    return `MESSAGE ${this.message}`;
  }
}
