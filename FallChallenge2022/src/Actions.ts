/* eslint-disable max-classes-per-file */
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
  x: number;

  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  output() {
    return `BUILD ${this.x} ${this.y}`;
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
