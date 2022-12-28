/* eslint-disable max-classes-per-file */
import { Block } from "./Block";
import { map, myMatter, myRecyclers, setMyMatter } from "./State";
import { debug } from "./helpers";

export interface Action {
  output: () => string;
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
}

export class SpawnAction implements Action {
  constructor(private amount: number, public block: Block) {
    this.block.units += amount;
    setMyMatter(myMatter - 10 * amount);

    this.amount = amount;
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

  output() {
    return `MESSAGE ${this.message}`;
  }
}
