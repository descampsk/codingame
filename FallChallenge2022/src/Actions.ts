/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { Block } from "./Block";
import { Owner, map, myMatter, myRecyclers, setMyMatter } from "./State";
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
    const { neighbors } = origin;
    if (!neighbors.find((block) => block.equals(destination))) {
      const distance = destination.distanceToBlock(origin);
      const newDestination = neighbors
        .filter(
          (neighbor) => destination.distanceToBlock(neighbor) === distance - 1
        )
        .sort(
          (a, b) =>
            Math.abs(destination.y - a.y) - Math.abs(destination.y - b.y)
        )[0];
      if (newDestination) this.destination = newDestination;
    }

    this.origin.units -= this.amount;
    if (this.origin.owner === this.destination.owner) {
      this.destination.units += this.amount;
      this.destination.hasMoved += this.amount;
    }
    if (this.destination.owner === Owner.NONE) {
      this.destination.units += this.amount;
    }
    if (this.destination.owner === Owner.ME) {
      this.destination.canBuild = false;
    }
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
    let actionStr = `MOVE ${this.amount} ${this.origin.x} ${this.origin.y} ${this.destination.x} ${this.destination.y}`;
    if (
      this.destination.owner !== Owner.OPPONENT ||
      this.destination.units !== 0
    )
      return actionStr;

    // Fallback move if we move in a opponent neighbor without any unit
    const { neighbors } = this.origin;
    const index = neighbors.findIndex((block) =>
      block.equals(this.destination)
    );
    if (index > -1) {
      const fallBackDestinations = neighbors.slice(0);
      fallBackDestinations.splice(index, 1);
      const fallBackDestination = fallBackDestinations.sort(
        (a, b) => b.getPotentiel(5) - a.getPotentiel(5)
      )[0];
      if (fallBackDestination) {
        actionStr += `;MOVE ${this.amount} ${this.origin.x} ${this.origin.y} ${fallBackDestination.x} ${fallBackDestination.y}`;
      }
    }
    return actionStr;
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
    this.block.hasMoved += amount;
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
