/* eslint-disable max-classes-per-file */
import { Block } from "./Block";
import { myMatter, myRecyclers, setMyMatter } from "./State";

export interface Action {
  output: () => string;
}

export class MoveAction implements Action {
  amount: number;

  fromX: number;

  fromY: number;

  toX: number;

  toY: number;

  constructor(
    amount: number,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) {
    this.amount = amount;
    this.fromX = fromX;
    this.fromY = fromY;
    this.toX = toX;
    this.toY = toY;
  }

  output() {
    return `MOVE ${this.amount} ${this.fromX} ${this.fromY} ${this.toX} ${this.toY}`;
  }
}

export class BuildAction implements Action {
  constructor(private block: Block) {
    this.block.canSpawn = false;
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
  amount: number;

  x: number;

  y: number;

  constructor(amount: number, x: number, y: number) {
    this.amount = amount;
    this.x = x;
    this.y = y;
  }

  output() {
    return `SPAWN ${this.amount} ${this.x} ${this.y}`;
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
