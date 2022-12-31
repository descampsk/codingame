/* eslint-disable no-use-before-define */
/**
 * Reads a line from an input
 * @return {string} the read line
 */
// COPY PASTE FROM HERE INTO THE CODINGAME IDE

/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
declare function readline(): string;

enum Owner {
  BOTH = -2,
  NONE = -1,
  ME = 1,
  OPPONENT = 0,
}

interface Action {
  output: () => string;
}

class MoveAction implements Action {
  constructor(
    public amount: number,
    public origin: Block,
    public destination: Block
  ) {}

  output() {
    return `MOVE ${this.amount} ${this.origin.x} ${this.origin.y} ${this.destination.x} ${this.destination.y}`;
  }
}

class BuildAction implements Action {
  constructor(private block: Block) {}

  output() {
    const { x, y } = this.block;
    return `BUILD ${x} ${y}`;
  }
}

class SpawnAction implements Action {
  constructor(private amount: number, public block: Block) {}

  output() {
    const { x, y } = this.block;
    return `SPAWN ${this.amount} ${x} ${y}`;
  }
}

type WaitAction = {
  wait: boolean;
};

class Block {
  constructor(
    public x: number,
    public y: number,
    public scrapAmount: number,
    public owner: Owner,
    public units: number,
    public recycler: boolean,
    public canBuild: boolean,
    public canSpawn: boolean,
    public inRangeOfRecycler: boolean
  ) {}

  equals(block: Block) {
    return block && this.x === block.x && this.y === block.y;
  }

  update({
    scrapAmount,
    owner,
    units,
    recycler,
    canBuild,
    canSpawn,
    inRangeOfRecycler,
  }: {
    scrapAmount: number;
    owner: Owner;
    units: number;
    recycler: boolean;
    canBuild: boolean;
    canSpawn: boolean;
    inRangeOfRecycler: boolean;
  }) {
    this.scrapAmount = scrapAmount;
    this.owner = owner;
    this.units = units;
    this.recycler = recycler;
    this.canBuild = canBuild;
    this.canSpawn = canSpawn;
    this.inRangeOfRecycler = inRangeOfRecycler;
  }

  static computeManhattanDistance(blockA: Block, blockB: Block) {
    return Math.abs(blockA.x - blockB.x) + Math.abs(blockA.y - blockB.y);
  }
}

class State {
  turn = 0;

  width = 0;

  height = 0;

  myMatter = 0;

  oppMatter = 0;

  map: Block[][] = [];

  createMap(width: number, height: number) {
    const map: Block[][] = [];
    for (let i = 0; i < height; i++) {
      const blocks: Block[] = [];
      for (let j = 0; j < width; j++) {
        blocks.push(
          new Block(j, i, 0, Owner.NONE, 0, false, false, false, false)
        );
      }
      map.push(blocks);
    }
    this.map = map;
    return map;
  }

  readMapInput() {
    const line = readline();
    const [width, height] = line
      .split(" ")
      .map((value) => Number.parseInt(value, 10));
    this.height = height;
    this.width = width;
    this.createMap(width, height);
  }

  parseLineToMap(line: string, i: number, j: number) {
    const inputs = line.split(" ");
    const scrapAmount = parseInt(inputs[0]);
    const owner = parseInt(inputs[1]); // 1 = me, 0 = foe, -1 = neutral
    const units = parseInt(inputs[2]);
    const recycler = parseInt(inputs[3]) > 0;
    const canBuild = parseInt(inputs[4]) > 0;
    const canSpawn = parseInt(inputs[5]) > 0;
    const inRangeOfRecycler = parseInt(inputs[6]) > 0;
    this.map[i][j].update({
      scrapAmount,
      owner,
      units,
      recycler,
      canBuild,
      canSpawn,
      inRangeOfRecycler,
    });
  }

  readInputs() {
    const mattersLine = readline();
    const matters = mattersLine.split(" ");
    this.myMatter = parseInt(matters[0]);
    this.oppMatter = parseInt(matters[1]);
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        const line = readline();
        this.parseLineToMap(line, i, j);
      }
    }
  }
}

class RecyclerBuilder {
  action(map: Block[][]) {
    const possibleRecyclers = map.flat().filter((block) => block.canBuild);
    if (possibleRecyclers.length) {
      return [new BuildAction(possibleRecyclers[0])];
    }
    return [];
  }
}

class RobotBuilder {
  action(map: Block[][]) {
    const possibleSpawns = map.flat().filter((block) => block.canSpawn);
    if (possibleSpawns.length) {
      return [new SpawnAction(1, possibleSpawns[0])];
    }
    return [];
  }
}

class RobotManager {
  action(map: Block[][]) {
    const actions: Action[] = [];
    const myRobots = map
      .flat()
      .filter((robot) => robot.units > 0 && robot.owner === Owner.ME);
    for (const robot of myRobots) {
      const destinationY = Math.floor(Math.random() * map.length);
      const destinationX = Math.floor(Math.random() * map[0].length);
      actions.push(
        new MoveAction(
          1,
          map[robot.y][robot.x],
          map[destinationY][destinationX]
        )
      );
    }
    return actions;
  }
}

export class IA {
  actions: Action[] = [];

  constructor(
    private state: State,
    private recyclerBuilder: RecyclerBuilder,
    private robotManager: RobotManager,
    private robotBuilder: RobotBuilder
  ) {}

  chooseAction() {
    const recyclerActions = this.recyclerBuilder.action(this.state.map);
    const robotActions = this.robotManager.action(this.state.map);
    const robotBuilderActions = this.robotBuilder.action(this.state.map);
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

const state = new State();
const recyclerBuilder = new RecyclerBuilder();
const robotManager = new RobotManager();
const robotBuilder = new RobotBuilder();
const ia = new IA(state, recyclerBuilder, robotManager, robotBuilder);

state.readMapInput();

// game loop
// eslint-disable-next-line no-constant-condition
while (true) {
  state.readInputs();
  ia.chooseAction();
  ia.endTurn();
}
