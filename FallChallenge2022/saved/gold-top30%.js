// src/djikstra.ts
const dijtstraAlgorithm = (map2, startingBlocks) => {
  const start = new Date();
  const distances = new Array(map2.length)
    .fill(Infinity)
    .map(() => new Array(map2[0].length).fill(Infinity));
  startingBlocks.forEach(([x, y]) => {
    distances[x][y] = 0;
  });
  const visited = new Array(map2.length)
    .fill(0)
    .map(() => new Array(map2[0].length).fill(0));
  const nextBlocks = Array.from(startingBlocks);
  let currentBlock = nextBlocks.pop();
  while (currentBlock) {
    const [x, y] = currentBlock;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const xToUpdate = x + i;
        const yToUpdate = y + j;
        if (
          (i !== 0 || j !== 0) &&
          Math.abs(i) !== Math.abs(j) &&
          xToUpdate >= 0 &&
          xToUpdate < map2.length &&
          yToUpdate >= 0 &&
          yToUpdate < map2[0].length &&
          !visited[xToUpdate][yToUpdate] &&
          map2[xToUpdate][yToUpdate].canMove
        ) {
          const newValue = 1 + distances[x][y];
          if (newValue < distances[xToUpdate][yToUpdate]) {
            distances[xToUpdate][yToUpdate] = newValue;
            nextBlocks.push([xToUpdate, yToUpdate, newValue]);
            visited[xToUpdate][yToUpdate] = 1;
          }
        }
      }
    }
    nextBlocks.sort((a, b) => a[2] - b[2]);
    [currentBlock] = nextBlocks;
    nextBlocks.shift();
  }
  const end = new Date().getTime() - start.getTime();
  if (debugTime) debug("dijtstraAlgorithm time: %dms", end);
  return distances;
};

// src/Block.ts
const Block = class {
  constructor(
    x,
    y,
    scrapAmount,
    owner,
    units,
    recycler,
    canBuild,
    canSpawn,
    inRangeOfRecycler
  ) {
    this.x = x;
    this.y = y;
    this.scrapAmount = scrapAmount;
    this.owner = owner;
    this.units = units;
    this.recycler = recycler;
    this.canBuild = canBuild;
    this.canSpawn = canSpawn;
    this.inRangeOfRecycler = inRangeOfRecycler;
    this.djikstraMap = [];
    this.island = null;
    this.neighbors = [];
    this.neighborsWithRecycler = [];
    this.hasMoved = false;
    this.potentiel = null;
  }

  equals(block) {
    return this.x === block.x && this.y === block.y;
  }

  get canMove() {
    return !this.recycler && this.scrapAmount > 0;
  }

  get isGrass() {
    return this.scrapAmount === 0;
  }

  get willBecomeGrass() {
    let totalRecycler = 0;
    const { x, y } = this;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (
          x + j >= 0 &&
          y + i >= 0 &&
          x + j < width &&
          y + i < height &&
          Math.abs(i) !== Math.abs(j)
        ) {
          const block = map[y + i][x + j];
          if (block.recycler) {
            totalRecycler += 1;
          }
        }
      }
    }
    return totalRecycler === 0
      ? Infinity
      : Math.ceil(this.scrapAmount / totalRecycler);
  }

  get isDangerousRobotOpponent() {
    if (this.owner !== 0 /* OPPONENT */ || this.units === 0) return false;
    const { x, y } = this;
    let ownerBlockDifference = 0;
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        if (x + j > 0 && y + i >= 0 && x + j < width && y + i < height) {
          const block = map[y + i][x + j];
          if (block.owner === 1 /* ME */) ownerBlockDifference += 1;
          if (block.owner === 0 /* OPPONENT */) ownerBlockDifference -= 1;
        }
      }
    }
    return ownerBlockDifference > 3;
  }

  updateNeighbors() {
    this.neighbors = [];
    this.neighborsWithRecycler = [];
    const { x, y } = this;
    if (x > 0) {
      if (map[y][x - 1].canMove) this.neighbors.push(map[y][x - 1]);
      if (map[y][x - 1].recycler)
        this.neighborsWithRecycler.push(map[y][x - 1]);
    }
    if (x < map[0].length - 1) {
      if (map[y][x + 1].canMove) this.neighbors.push(map[y][x + 1]);
      if (map[y][x + 1].recycler)
        this.neighborsWithRecycler.push(map[y][x + 1]);
    }
    if (y > 0) {
      if (map[y - 1][x].canMove) this.neighbors.push(map[y - 1][x]);
      if (map[y - 1][x].recycler)
        this.neighborsWithRecycler.push(map[y - 1][x]);
    }
    if (y < map.length - 1) {
      if (map[y + 1][x].canMove) this.neighbors.push(map[y + 1][x]);
      if (map[y + 1][x].recycler)
        this.neighborsWithRecycler.push(map[y + 1][x]);
    }
  }

  update({
    scrapAmount,
    owner,
    units,
    recycler,
    canBuild,
    canSpawn,
    inRangeOfRecycler,
  }) {
    this.scrapAmount = scrapAmount;
    this.owner = owner;
    this.units = units;
    this.recycler = recycler;
    this.canBuild = canBuild;
    this.canSpawn = canSpawn;
    this.inRangeOfRecycler = inRangeOfRecycler;
    this.island = null;
    this.djikstraMap = [];
    this.potentiel = null;
    this.hasMoved = false;
  }

  distanceToBlock(block) {
    if (!block) return Infinity;
    const { x, y } = block;
    if (!this.djikstraMap.length) {
      this.djikstraMap = dijtstraAlgorithm(map, [[this.y, this.x]]);
    }
    return this.djikstraMap[y][x];
  }

  getPotentiel(radius) {
    if (this.potentiel) return this.potentiel;
    this.potentiel = 0;
    for (let i = 0; i < notMyBlocks.length; i++) {
      const block = notMyBlocks[i];
      let distance = this.distanceToBlock(block);
      if (distance === 0) distance = 0.5;
      if (distance <= radius) {
        if (block.owner === 0 /* OPPONENT */) this.potentiel += 2 / distance;
        else if (block.owner === -1 /* NONE */) this.potentiel += 1 / distance;
      }
    }
    return this.potentiel;
  }

  compareOwner(block) {
    if (this.owner === block.owner) return 0;
    if (this.owner === 1 /* ME */) {
      return 1;
    }
    if (this.owner === -1 /* NONE */) {
      if (block.owner === 0 /* OPPONENT */) return 1;
      if (block.owner === 1 /* ME */) return -1;
    }
    if (this.owner === 0 /* OPPONENT */) {
      return -1;
    }
    return 0;
  }
};

// src/Actions.ts
const MoveAction = class {
  constructor(amount, fromX, fromY, toX, toY) {
    this.amount = amount;
    this.fromX = fromX;
    this.fromY = fromY;
    this.toX = toX;
    this.toY = toY;
  }

  output() {
    return `MOVE ${this.amount} ${this.fromX} ${this.fromY} ${this.toX} ${this.toY}`;
  }
};
const BuildAction = class {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  output() {
    return `BUILD ${this.x} ${this.y}`;
  }
};
const SpawnAction = class {
  constructor(amount, x, y) {
    this.amount = amount;
    this.x = x;
    this.y = y;
  }

  output() {
    return `SPAWN ${this.amount} ${this.x} ${this.y}`;
  }
};
const MessageAction = class {
  constructor(message) {
    this.message = message;
  }

  output() {
    return `MESSAGE ${this.message}`;
  }
};

// src/ExpensionManager.ts
const ExtensionManager = class {
  constructor() {
    this.separation = [];
  }

  computeSeparation() {
    if (this.separation.length) return;
    const start = new Date();
    const distances = new Array(map.length).fill(null).map(() =>
      new Array(map[0].length).fill({
        value: Infinity,
        owner: -1 /* NONE */,
      })
    );
    const startingBlocks = [
      [myStartPosition.y, myStartPosition.x],
      [opponentStartPosition.y, opponentStartPosition.x],
    ];
    distances[myStartPosition.y][myStartPosition.x] = {
      value: 0,
      owner: 1 /* ME */,
    };
    distances[opponentStartPosition.y][opponentStartPosition.x] = {
      value: 0,
      owner: 0 /* OPPONENT */,
    };
    const visited = new Array(map.length)
      .fill(0)
      .map(() => new Array(map[0].length).fill(0));
    const nextBlocks = Array.from(startingBlocks);
    let currentBlock = nextBlocks.pop();
    while (currentBlock) {
      const [x, y] = currentBlock;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const xToUpdate = x + i;
          const yToUpdate = y + j;
          if (
            (i !== 0 || j !== 0) &&
            Math.abs(i) !== Math.abs(j) &&
            xToUpdate >= 0 &&
            xToUpdate < map.length &&
            yToUpdate >= 0 &&
            yToUpdate < map[0].length &&
            map[xToUpdate][yToUpdate].canMove
          ) {
            if (!visited[xToUpdate][yToUpdate]) {
              const oldValue = distances[xToUpdate][yToUpdate].value;
              const newValue = 1 + distances[x][y].value;
              if (newValue < oldValue) {
                distances[xToUpdate][yToUpdate] = {
                  value: newValue,
                  owner: distances[x][y].owner,
                };
                nextBlocks.push([xToUpdate, yToUpdate, newValue]);
                visited[xToUpdate][yToUpdate] = 1;
              }
            } else if (
              1 + distances[x][y].value ===
                distances[xToUpdate][yToUpdate].value &&
              distances[xToUpdate][yToUpdate].owner !== distances[x][y].owner &&
              distances[x][y].owner !== -2 /* BOTH */
            ) {
              distances[xToUpdate][yToUpdate].owner = -2 /* BOTH */;
            }
          }
        }
      }
      nextBlocks.sort((a, b) => a[2] - b[2]);
      [currentBlock] = nextBlocks;
      nextBlocks.shift();
    }
    const bothOwnerBlocks = [];
    const wall = [];
    for (let i = 0; i < distances.length; i++) {
      for (let j = 0; j < distances[i].length; j++) {
        const distance = distances[i][j];
        if (distance.owner === -2 /* BOTH */) {
          bothOwnerBlocks.push(map[i][j]);
        }
        if (distance.value === Infinity) continue;
        const { neighbors } = map[i][j];
        for (const neighbor of neighbors) {
          if (
            distances[i][j].owner === 1 /* ME */ &&
            distances[neighbor.y][neighbor.x].owner === 0 /* OPPONENT */
          )
            wall.push(map[i][j]);
        }
      }
    }
    this.separation.splice(0);
    if (bothOwnerBlocks.length) this.separation.push(...bothOwnerBlocks);
    else this.separation.push(...wall);
    const end = new Date().getTime() - start.getTime();
    if (debugTime) debug("computeSeparation time: %dms", end);
  }

  moveToSeparation() {
    const actions = [];
    const robots = myRobots.filter((robot) => !robot.hasMoved);
    const remainingSeparation = this.separation.filter(
      (block) => block.owner === -1 /* NONE */ && block.canMove
    );
    while (robots.length && remainingSeparation.length) {
      let bestDestination = remainingSeparation[0];
      let bestDestinationIndex = 0;
      let minDistance = Infinity;
      let bestRobot = robots[0];
      let bestRobotIndex = 0;
      for (const [
        indexDestination,
        destination,
      ] of remainingSeparation.entries()) {
        const { min: robotMin, index: robotIndex } = minBy(robots, (robot) =>
          robot.distanceToBlock(destination)
        );
        if (robotMin && robotIndex !== null) {
          const distance = robotMin.distanceToBlock(destination);
          if (distance < minDistance) {
            minDistance = distance;
            bestDestination = destination;
            bestDestinationIndex = indexDestination;
            bestRobotIndex = robotIndex;
            bestRobot = robotMin;
          }
        }
      }
      robots.splice(bestRobotIndex, 1);
      bestRobot.hasMoved = true;
      remainingSeparation.splice(bestDestinationIndex, 1);
      const yDirection =
        (bestDestination.y - bestRobot.y) /
        Math.abs(bestDestination.y - bestRobot.y);
      if (
        bestDestination.y !== bestRobot.y &&
        map[bestRobot.y + yDirection][bestRobot.x].distanceToBlock(
          bestDestination
        ) ===
          bestRobot.distanceToBlock(bestDestination) - 1
      ) {
        actions.push(
          new MoveAction(
            1,
            bestRobot.x,
            bestRobot.y,
            bestRobot.x,
            bestRobot.y + yDirection
          )
        );
      } else {
        actions.push(
          new MoveAction(
            1,
            bestRobot.x,
            bestRobot.y,
            bestDestination.x,
            bestDestination.y
          )
        );
      }
    }
    return actions;
  }
};
const expensionManager = new ExtensionManager();

// src/Island.ts
var Island = class {
  constructor() {
    this.blocks = [];
  }

  get size() {
    return this.blocks.length;
  }

  get hasRobot() {
    for (const block of this.blocks) {
      if (block.units > 0) return true;
    }
    return false;
  }

  get owner() {
    const hasMineBlock =
      this.blocks.findIndex(
        (block) => block.owner === 1 /* ME */ && block.canSpawn
      ) >= 0;
    const hasOpponentBlock =
      this.blocks.findIndex(
        (block) => block.owner === 0 /* OPPONENT */ && block.units > 0
      ) >= 0;
    if (hasMineBlock && hasOpponentBlock) return -2 /* BOTH */;
    if (hasMineBlock) return 1 /* ME */;
    if (hasOpponentBlock) return 0 /* OPPONENT */;
    return -1 /* NONE */;
  }

  static createIsland(start) {
    const island = new Island();
    const nextBlocks = [start];
    while (nextBlocks.length) {
      const nextBlock = nextBlocks.pop();
      island.blocks.push(nextBlock);
      nextBlock.island = island;
      const neighbors = nextBlock.neighbors.filter(
        (neighbor) => !neighbor.island
      );
      if (neighbors.length) nextBlocks.push(...neighbors);
    }
    return island;
  }

  static findIslands() {
    const start = new Date();
    let blockWithoutIsland = blocks.find(
      (block) => !block.island && block.canMove
    );
    const islands2 = [];
    while (blockWithoutIsland) {
      const island = Island.createIsland(blockWithoutIsland);
      islands2.push(island);
      blockWithoutIsland = blocks.find(
        (block) => !block.island && block.canMove
      );
    }
    const end = new Date().getTime() - start.getTime();
    if (debugTime) debug("findIslands time: %dms", end);
    return islands2;
  }
};

// src/State.ts
const DEBUG = false;
var debugTime = false;
let turn = 0;
var width = 0;
var height = 0;
let myMatter = 0;
const setMyMatter = (newMatter) => {
  myMatter = newMatter;
};
let oppMatter = 0;
let side = 0; /* UNKNOWN */
var map = [];
let startPositionFound = false;
var myStartPosition = new Block(
  0,
  0,
  0,
  -1 /* NONE */,
  0,
  false,
  false,
  false,
  false
);
var opponentStartPosition = new Block(
  0,
  0,
  0,
  -1 /* NONE */,
  0,
  false,
  false,
  false,
  false
);
var blocks = [];
let emptyBlocks = [];
let islands = [];
let myBlocks = [];
var notMyBlocks = [];
let opponentBlocks = [];
var myRobots = [];
let opponentRobots = [];
let dangerousOpponentRobots = [];
let myRecyclers = [];
let opponentRecyclers = [];
const createMap = (width3, height2) => {
  const map2 = [];
  for (let i = 0; i < height2; i++) {
    const blocks2 = [];
    for (let j = 0; j < width3; j++) {
      blocks2.push(
        new Block(j, i, 0, -1 /* NONE */, 0, false, false, false, false)
      );
    }
    map2.push(blocks2);
  }
  return map2;
};
const readMapInput = () => {
  const line = readline();
  [width, height] = line.split(" ").map((value) => Number.parseInt(value, 10));
  map.push(...createMap(width, height));
};
const parseLineToMap = (line, i, j, mapToUpdate) => {
  const inputs = line.split(" ");
  const scrapAmount = parseInt(inputs[0]);
  const owner = parseInt(inputs[1]);
  const units = parseInt(inputs[2]);
  const recycler = parseInt(inputs[3]) > 0;
  const canBuild = parseInt(inputs[4]) > 0;
  const canSpawn = parseInt(inputs[5]) > 0;
  const inRangeOfRecycler = parseInt(inputs[6]) > 0;
  mapToUpdate[i][j].update({
    scrapAmount,
    owner,
    units,
    recycler,
    canBuild,
    canSpawn,
    inRangeOfRecycler,
  });
};
const readInputs = () => {
  const start = new Date();
  const mattersLine = readline();
  const matters = mattersLine.split(" ");
  myMatter = parseInt(matters[0]);
  oppMatter = parseInt(matters[1]);
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const line = readline();
      parseLineToMap(line, i, j, map);
    }
  }
  const end = new Date().getTime() - start.getTime();
  if (debugTime) debug("readInputs time: %dms", end);
};
const computeData = () => {
  const start = new Date();
  blocks = map.flat();
  myBlocks = [];
  notMyBlocks = [];
  opponentBlocks = [];
  emptyBlocks = [];
  myRobots = [];
  opponentRobots = [];
  dangerousOpponentRobots = [];
  myRecyclers = [];
  opponentRecyclers = [];
  blocks.forEach((block) => {
    block.updateNeighbors();
    if (block.owner === 1 /* ME */) myBlocks.push(block);
    if (block.owner !== 1 /* ME */ && block.canMove) notMyBlocks.push(block);
    if (block.owner === 0 /* OPPONENT */) opponentBlocks.push(block);
    if (block.owner === -1 /* NONE */) emptyBlocks.push(block);
    if (block.owner === 1 /* ME */ && block.units) {
      for (let i = 0; i < block.units; i++) myRobots.push(block);
    }
    if (block.owner === 0 /* OPPONENT */ && block.units)
      opponentRobots.push(block);
    if (block.owner === 1 /* ME */ && block.recycler) myRecyclers.push(block);
    if (block.owner === 0 /* OPPONENT */ && block.recycler)
      opponentRecyclers.push(block);
    if (block.isDangerousRobotOpponent) dangerousOpponentRobots.push(block);
  });
  if (side === 0 /* UNKNOWN */)
    side = myRobots[0].x < width / 2 ? 1 /* LEFT */ : -1 /* RIGHT */;
  const end = new Date().getTime() - start.getTime();
  if (debugTime) debug("computeData time: %dms", end);
};
const computeStartPosition = (forceReset = false) => {
  const start = new Date();
  if (startPositionFound && !forceReset) return;
  myStartPosition = myRobots[0].neighbors.find((block) => {
    for (const robot of myRobots) {
      if (!robot.neighbors.find((neighbor) => neighbor.equals(block)))
        return false;
    }
    return true;
  });
  opponentStartPosition = opponentRobots[0].neighbors.find((block) => {
    for (const robot of opponentRobots) {
      if (!robot.neighbors.find((neighbor) => neighbor.equals(block)))
        return false;
    }
    return true;
  });
  startPositionFound = true;
  const end = new Date().getTime() - start.getTime();
  if (debugTime) debug("computeStartPosition time: %dms", end);
};
const refresh = () => {
  turn += 1;
  readInputs();
  computeData();
  computeStartPosition();
  islands = Island.findIslands();
  expensionManager.computeSeparation();
};

// src/helpers.ts
var debug = (...data) => {
  if (DEBUG) console.error(...data);
};
function minBy(array, callback) {
  let min = Infinity;
  let minObj = null;
  let minIndex = null;
  for (const [index, a] of array.entries()) {
    const val = callback(a);
    if (val < min) {
      min = val;
      minObj = a;
      minIndex = index;
    }
  }
  return { min: minObj, index: minIndex };
}
const computeManhattanDistance = (blockA, blockB) =>
  Math.abs(blockA.x - blockB.x) + Math.abs(blockA.y - blockB.y);

// src/RecyclerBuilder.ts
const RecyclerBuilder = class {
  isNearOfARecycler(block) {
    for (const recycler of myRecyclers) {
      if (computeManhattanDistance(recycler, block) < 3) {
        return true;
      }
    }
    return false;
  }

  isAhead() {
    return (
      myBlocks.length >= opponentBlocks.length &&
      myRecyclers.length >= opponentRecyclers.length &&
      myRobots.length >= opponentRobots.length
    );
  }

  computeGains(block) {
    const nearCoordinates = [[-1, 0], [1, 0], [0, 1], [0 - 1]];
    const { scrapAmount } = block;
    let total = scrapAmount;
    for (const nearCoordinate of nearCoordinates) {
      const [x, y] = nearCoordinate;
      const nearBlockX = block.x + x;
      const nearBlockY = block.y + y;
      if (
        nearBlockX >= 0 &&
        nearBlockX < width &&
        nearBlockY >= 0 &&
        nearBlockY < height
      ) {
        const nearBlock = map[block.y + y][block.x + x];
        total +=
          nearBlock.scrapAmount > scrapAmount
            ? scrapAmount
            : nearBlock.scrapAmount;
      }
    }
    return {
      gains: total,
      gainsPerTurn: total / scrapAmount,
    };
  }

  buildNaiveRecycler() {
    const actions = [];
    const possibleRecyclers = myBlocks
      .filter((block) => {
        let _a;
        return (
          block.canBuild &&
          !this.isNearOfARecycler(block) &&
          this.computeGains(block).gains > 20 &&
          ((_a = block.island) == null ? void 0 : _a.owner) !== 1 /* ME */
        );
      })
      .sort((a, b) => {
        const { gains: gainA, gainsPerTurn: gainsPerTurnA } =
          this.computeGains(a);
        const { gains: gainB, gainsPerTurn: gainsPerTurnB } =
          this.computeGains(b);
        if (gainsPerTurnA !== gainsPerTurnB)
          return gainsPerTurnB - gainsPerTurnA;
        return gainB - gainA;
      });
    if (possibleRecyclers.length) {
      const recycler = possibleRecyclers[0];
      if (
        recycler &&
        turn % 2 === 0 &&
        (myRobots.length < 10 ||
          myRobots.length <= opponentRobots.length + 5) &&
        myMatter < 50
      ) {
        actions.push(new BuildAction(recycler.x, recycler.y));
        myRecyclers.push(recycler);
        setMyMatter(myMatter - 10);
      }
    }
    debug("buildNaiveRecycler: ", actions.length);
    return actions;
  }

  buildDefensive() {
    const start = new Date();
    const actions = [];
    const possibleRecyclers = myBlocks.filter((block) => block.canBuild);
    for (const block of possibleRecyclers) {
      for (const robot of opponentRobots) {
        if (
          ((Math.abs(robot.x - block.x) === 1 && robot.y === block.y) ||
            (Math.abs(robot.y - block.y) === 1 && robot.x === block.x)) &&
          myMatter >= 10 &&
          robot.units > 1
        ) {
          actions.push(new BuildAction(block.x, block.y));
          myRecyclers.push(block);
          setMyMatter(myMatter - 10);
          break;
        }
      }
    }
    const end = new Date().getTime() - start.getTime();
    if (debugTime) debug("buildDefensive time: %dms", end);
    return actions;
  }

  action() {
    const defensiveActions = this.buildDefensive();
    if (defensiveActions.length) {
      debug("defensiveBuild: ", defensiveActions.length);
      return defensiveActions;
    }
    const notGrassBlocks = blocks.filter((block) => !block.isGrass);
    if (
      notGrassBlocks.length >= 80 ||
      opponentRecyclers.length > myRecyclers.length
    )
      return this.buildNaiveRecycler();
    return [];
  }
};
const recyclerBuilder = new RecyclerBuilder();

// src/RobotBuilder.ts
const RobotBuilder = class {
  constructor() {
    this.isExtensionDone = false;
  }

  checkExtensionDone() {
    if (this.isExtensionDone) {
      debug("Extension is done");
      return true;
    }
    debug("Extension in progress");
    for (const robot of myRobots) {
      for (const neighbor of robot.neighbors) {
        if (neighbor.owner === 0 /* OPPONENT */ && neighbor.units > 0) {
          this.isExtensionDone = true;
          return true;
        }
      }
    }
    for (let i = 0; i < height; i++) {
      if (!map[i].find((block) => block.owner === 1 /* ME */)) return false;
    }
    this.isExtensionDone = true;
    return true;
  }

  computeExpensionSpawn() {
    const start = new Date();
    const expensionRadius = 5;
    const possibleSpawns = myBlocks.filter(
      (block) =>
        block.canSpawn &&
        block.canMove &&
        block.neighbors.find((a) => a.owner !== 1 /* ME */) &&
        block.units < 2
    );
    possibleSpawns.sort((a, b) => {
      const blocksAToExpand = emptyBlocks.filter(
        (block) => a.distanceToBlock(block) <= expensionRadius
      );
      const blocksBToExpand = emptyBlocks.filter(
        (block) => b.distanceToBlock(block) <= expensionRadius
      );
      return blocksBToExpand.length - blocksAToExpand.length;
    });
    debug("ExpensionSpawn:", possibleSpawns.length);
    const end = new Date().getTime() - start.getTime();
    if (debugTime) debug("computeExpensionSpawn time: %dms", end);
    return possibleSpawns;
  }

  computeNormalSpawn() {
    const blocksToSpawn = myBlocks.filter((block) => {
      let _a;
      let _b;
      return (
        block.canSpawn &&
        (((_a = block.island) == null ? void 0 : _a.owner) !== 1 /* ME */ ||
          !((_b = block.island) == null ? void 0 : _b.hasRobot)) &&
        block.willBecomeGrass > 1 &&
        block.neighbors.find((a) => a.owner !== 1 /* ME */)
      );
    });
    debug("possibleSpawn", blocksToSpawn.length);
    blocksToSpawn.sort((a, b) => {
      let minAToEmpty = Infinity;
      let minBToEmpty = Infinity;
      let nearestABlockOwner = -1; /* NONE */
      let nearestBBlockOwner = -1; /* NONE */
      for (const emptyBlock of notMyBlocks) {
        const distanceA = a.distanceToBlock(emptyBlock);
        const distanceB = b.distanceToBlock(emptyBlock);
        if (distanceA < minAToEmpty) {
          minAToEmpty = distanceA;
          nearestABlockOwner = emptyBlock.owner;
        }
        if (distanceB < minBToEmpty) {
          minBToEmpty = distanceB;
          nearestBBlockOwner = emptyBlock.owner;
        }
      }
      const distanceToNearestOpponentA = opponentRobots.reduce(
        (distance, opponent) => {
          const newDistance = a.distanceToBlock(opponent);
          return newDistance < distance ? newDistance : distance;
        },
        Infinity
      );
      const distanceToNearestOpponentB = opponentRobots.reduce(
        (distance, opponent) => {
          const newDistance = b.distanceToBlock(opponent);
          return newDistance < distance ? newDistance : distance;
        },
        Infinity
      );
      const interrestingANeighbors = a.neighbors.filter(
        (block) => block.owner !== 1 /* ME */
      ).length;
      const interrestingBNeighbors = b.neighbors.filter(
        (block) => block.owner !== 1 /* ME */
      ).length;
      const potentielRadius = 5;
      const potentielA = a.getPotentiel(potentielRadius);
      const potentielB = b.getPotentiel(potentielRadius);
      if (minAToEmpty !== minBToEmpty) return minAToEmpty - minBToEmpty;
      if (nearestABlockOwner !== nearestBBlockOwner)
        return nearestBBlockOwner - nearestABlockOwner;
      if (
        distanceToNearestOpponentA !== distanceToNearestOpponentB &&
        (distanceToNearestOpponentA === 1 || distanceToNearestOpponentB === 1)
      )
        return distanceToNearestOpponentA - distanceToNearestOpponentB;
      if (interrestingANeighbors !== interrestingBNeighbors)
        return interrestingBNeighbors - interrestingANeighbors;
      if (a.units !== b.units) return a.units - b.units;
      return potentielB - potentielA;
    });
    return blocksToSpawn;
  }

  computeDefensiveSpawn() {
    debug("computeDefensiveSpawn");
    const blocksToSpawn = [];
    for (const robot of dangerousOpponentRobots) {
      for (const neighbor of robot.neighbors.filter(
        (block) => block.canSpawn
      )) {
        blocksToSpawn.push(neighbor);
      }
    }
    return blocksToSpawn;
  }

  action() {
    const actions = [];
    let blocksToSpawn = [];
    blocksToSpawn = this.computeNormalSpawn();
    let blockToSpawnIndex = 0;
    let predictedMatter = myMatter;
    while (predictedMatter >= 10 && blocksToSpawn[blockToSpawnIndex]) {
      const blockToSpawn = blocksToSpawn[blockToSpawnIndex];
      actions.push(new SpawnAction(1, blockToSpawn.x, blockToSpawn.y));
      blockToSpawnIndex += 1;
      if (blockToSpawnIndex === blocksToSpawn.length) blockToSpawnIndex = 0;
      predictedMatter -= 10;
    }
    debug("RobotBuilder spawns", actions.length);
    return actions;
  }
};
const robotBuilder = new RobotBuilder();

// src/RobotManager.ts
const RobotManager = class {
  constructor() {
    this.robotsToMove = [];
  }

  naiveMethod() {
    const start = new Date();
    debug("RobotManager - naive mode");
    const actions = [];
    const targets = [];
    for (const robot of this.robotsToMove.filter(
      (robot2) => !robot2.hasMoved
    )) {
      const nearestEmptyBlocks = robot.neighbors
        .sort((a, b) => {
          let _a;
          const potentielRadius =
            ((_a = robot.island) == null ? void 0 : _a.owner) === 1 /* ME */
              ? Infinity
              : 5;
          const potentielA = a.getPotentiel(potentielRadius);
          const potentielB = b.getPotentiel(potentielRadius);
          const distanceToMyStartA = computeManhattanDistance(
            a,
            myStartPosition
          );
          const distanceToMyStartB = computeManhattanDistance(
            b,
            myStartPosition
          );
          const distanceToOpponentStartA = computeManhattanDistance(
            a,
            opponentStartPosition
          );
          const distanceToOpponentStartB = computeManhattanDistance(
            b,
            opponentStartPosition
          );
          if (a.owner !== b.owner) return a.compareOwner(b);
          if (a.owner === 0 /* OPPONENT */ || b.owner === 0 /* OPPONENT */)
            return (
              (b.owner === 0 /* OPPONENT */ ? b.units : 0) -
              (a.owner === 0 /* OPPONENT */ ? a.units : 0)
            );
          if (potentielA !== potentielB) return potentielB - potentielA;
          return side * (b.x - a.x);
        })
        .filter((block) => {
          const { willBecomeGrass } = block;
          if (willBecomeGrass === Infinity) return true;
          return willBecomeGrass > robot.distanceToBlock(block);
        });
      let i = 0;
      while (
        i < nearestEmptyBlocks.length &&
        targets.find(
          (target) =>
            target.equals(nearestEmptyBlocks[i]) &&
            nearestEmptyBlocks[i].owner !== 0 /* OPPONENT */
        )
      ) {
        i += 1;
      }
      const nearestEmptyBlock =
        i < nearestEmptyBlocks.length
          ? nearestEmptyBlocks[i]
          : nearestEmptyBlocks[0];
      if (nearestEmptyBlock) {
        if (
          robot.distanceToBlock(nearestEmptyBlock) === 1 &&
          nearestEmptyBlock.owner === -1 /* NONE */
        )
          targets.push(nearestEmptyBlock);
        actions.push(
          new MoveAction(
            1,
            robot.x,
            robot.y,
            nearestEmptyBlock.x,
            nearestEmptyBlock.y
          )
        );
      }
    }
    const end = new Date().getTime() - start.getTime();
    if (debugTime) debug("RobotManager naive method time: %dms", end);
    return actions;
  }

  expandMethod() {
    debug("RobotManager - expand mode");
    const actions = [];
    const targetX = Math.floor(width / 2);
    const targets = blocks.filter(
      (block) =>
        block.x === targetX && block.canMove && block.owner !== 1 /* ME */
    );
    const robotsToExtend = this.robotsToMove.filter(
      (robot) => side * (robot.x - targetX) < 0
    );
    do {
      const target = targets.shift();
      const { min: robot, index } = minBy(robotsToExtend, (robot2) =>
        robot2.distanceToBlock(target)
      );
      if (robot && index !== null) {
        const { x, y } = robot;
        const { y: targetY } = target;
        debug("MOVE", x, y, targetX, targetY);
        actions.push(new MoveAction(1, x, y, targetX, targetY));
        robotsToExtend.splice(index, 1);
        robot.hasMoved = true;
      }
    } while (targets.length && robotsToExtend.length);
    return actions;
  }

  action() {
    this.robotsToMove = Array.from(myRobots);
    const actions = [...this.naiveMethod()];
    return actions;
  }
};
const robotManager = new RobotManager();

// src/IA.ts
const IA = class {
  constructor() {
    this.actions = [];
  }

  chooseAction() {
    const recyclerActions = recyclerBuilder.action();
    const moveToSeparationActions = expensionManager.moveToSeparation();
    const robotActions = robotManager.action();
    const robotBuilderActions = robotBuilder.action();
    this.actions = [
      ...recyclerActions,
      ...moveToSeparationActions,
      ...robotActions,
      ...robotBuilderActions,
    ];
  }

  computePredictedScore() {
    const myUselessScore = myBlocks.filter(
      (block) => block.willBecomeGrass < Infinity
    ).length;
    const opponentUselessScore = opponentBlocks.filter(
      (block) => block.willBecomeGrass < Infinity
    ).length;
    const mySecureScored = blocks.filter((block) => {
      let _a;
      return ((_a = block.island) == null ? void 0 : _a.owner) === 1 /* ME */;
    }).length;
    const opponentSecuredScore = blocks.filter((block) => {
      let _a;
      return (
        ((_a = block.island) == null ? void 0 : _a.owner) === 0 /* OPPONENT */
      );
    }).length;
    const contestedBlocks = blocks.filter((block) => {
      let _a;
      return (
        ((_a = block.island) == null ? void 0 : _a.owner) === -2 /* BOTH */
      );
    });
    let myContestedScore = 0;
    contestedBlocks.forEach((block) => {
      const myDistanceToBlock = myRobots.reduce((minDistance, robot) => {
        const distance = robot.distanceToBlock(block);
        return minDistance < distance ? minDistance : distance;
      }, Infinity);
      const opponentDistanceToBlock = opponentRobots.reduce(
        (minDistance, robot) => {
          const distance = robot.distanceToBlock(block);
          return minDistance < distance ? minDistance : distance;
        },
        Infinity
      );
      const diff = myDistanceToBlock - opponentDistanceToBlock;
      if (diff < -10) myContestedScore += 1;
      else if (diff > 10) myContestedScore += 0;
      else {
        myContestedScore += 0.5 * (1 - diff / 10);
      }
    });
    myContestedScore = Math.round(myContestedScore);
    const opponentContestedScore = contestedBlocks.length - myContestedScore;
    const myPredictedScore = mySecureScored + myContestedScore - myUselessScore;
    const opponentPredictedScore =
      opponentSecuredScore + opponentContestedScore - opponentUselessScore;
    return {
      myPredictedScore,
      opponentPredictedScore,
      mySecureScored,
      opponentSecuredScore,
      myUselessScore,
      opponentUselessScore,
      myContestedScore,
      opponentContestedScore,
    };
  }

  showScorePrediction() {
    const {
      myPredictedScore,
      opponentPredictedScore,
      mySecureScored,
      opponentSecuredScore,
      myContestedScore,
      myUselessScore,
      opponentContestedScore,
      opponentUselessScore,
    } = this.computePredictedScore();
    let winRatio = 0;
    if (
      mySecureScored - myUselessScore - myContestedScore >
      opponentSecuredScore - opponentUselessScore + opponentContestedScore
    ) {
      winRatio = 100;
    }
    const myRealSecuredScore = mySecureScored - myUselessScore;
    const opponentRealSecuredScore =
      opponentSecuredScore - opponentUselessScore;
    const advantage = myRealSecuredScore - opponentRealSecuredScore;
    if (advantage > 0) {
      winRatio = Math.round(
        ((advantage + myContestedScore) * 100) /
          (advantage + myContestedScore + opponentContestedScore)
      );
    } else {
      winRatio = Math.round(
        100 -
          ((opponentContestedScore - advantage) * 100) /
            (myContestedScore + opponentContestedScore - advantage)
      );
    }
    const loseRatio = 100 - winRatio;
    return new MessageAction(
      `W: ${winRatio} - L: ${loseRatio} - ${myPredictedScore} vs ${opponentPredictedScore}`
    );
  }

  endTurn() {
    if (this.actions.length) {
      console.log(this.actions.map((action) => action.output()).join(";"));
    } else {
      console.log("WAIT");
    }
  }
};
const ia = new IA();

// src/main.ts
readMapInput();
while (true) {
  const start = new Date();
  refresh();
  ia.chooseAction();
  ia.endTurn();
  const end = new Date().getTime() - start.getTime();
  if (debugTime) debug("Execution time: %dms", end);
  debug(`############# End of Turn #############`);
}
