const __create = Object.create;
const __defProp = Object.defineProperty;
const __getOwnPropDesc = Object.getOwnPropertyDescriptor;
const __getOwnPropNames = Object.getOwnPropertyNames;
const __getProtoOf = Object.getPrototypeOf;
const __hasOwnProp = Object.prototype.hasOwnProperty;
const __commonJS = (cb, mod) =>
  function __require() {
    return (
      mod ||
        (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod),
      mod.exports
    );
  };
const __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === "object") || typeof from === "function") {
    for (const key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
const __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, "default", { value: mod, enumerable: true })
      : target,
    mod
  )
);

// node_modules/munkres-js/munkres.js
const require_munkres = __commonJS({
  "node_modules/munkres-js/munkres.js": function (exports, module2) {
    const MAX_SIZE =
      parseInt(Number.MAX_SAFE_INTEGER / 2) || (1 << 26) * (1 << 26);
    const DEFAULT_PAD_VALUE = 0;
    function Munkres() {
      this.C = null;
      this.row_covered = [];
      this.col_covered = [];
      this.n = 0;
      this.Z0_r = 0;
      this.Z0_c = 0;
      this.marked = null;
      this.path = null;
    }
    Munkres.prototype.pad_matrix = function (matrix, pad_value) {
      pad_value = pad_value || DEFAULT_PAD_VALUE;
      let max_columns = 0;
      let total_rows = matrix.length;
      let i;
      for (i = 0; i < total_rows; ++i)
        if (matrix[i].length > max_columns) max_columns = matrix[i].length;
      total_rows = max_columns > total_rows ? max_columns : total_rows;
      const new_matrix = [];
      for (i = 0; i < total_rows; ++i) {
        const row = matrix[i] || [];
        const new_row = row.slice();
        while (total_rows > new_row.length) new_row.push(pad_value);
        new_matrix.push(new_row);
      }
      return new_matrix;
    };
    Munkres.prototype.compute = function (cost_matrix, options) {
      options = options || {};
      options.padValue = options.padValue || DEFAULT_PAD_VALUE;
      this.C = this.pad_matrix(cost_matrix, options.padValue);
      this.n = this.C.length;
      this.original_length = cost_matrix.length;
      this.original_width = cost_matrix[0].length;
      const nfalseArray = [];
      while (nfalseArray.length < this.n) nfalseArray.push(false);
      this.row_covered = nfalseArray.slice();
      this.col_covered = nfalseArray.slice();
      this.Z0_r = 0;
      this.Z0_c = 0;
      this.path = this.__make_matrix(this.n * 2, 0);
      this.marked = this.__make_matrix(this.n, 0);
      let step = 1;
      const steps = {
        1: this.__step1,
        2: this.__step2,
        3: this.__step3,
        4: this.__step4,
        5: this.__step5,
        6: this.__step6,
      };
      while (true) {
        const func = steps[step];
        if (!func) break;
        step = func.apply(this);
      }
      const results = [];
      for (let i = 0; i < this.original_length; ++i)
        for (let j = 0; j < this.original_width; ++j)
          if (this.marked[i][j] == 1) results.push([i, j]);
      return results;
    };
    Munkres.prototype.__make_matrix = function (n, val) {
      const matrix = [];
      for (let i = 0; i < n; ++i) {
        matrix[i] = [];
        for (let j = 0; j < n; ++j) matrix[i][j] = val;
      }
      return matrix;
    };
    Munkres.prototype.__step1 = function () {
      for (let i = 0; i < this.n; ++i) {
        const minval = Math.min.apply(Math, this.C[i]);
        for (let j = 0; j < this.n; ++j) this.C[i][j] -= minval;
      }
      return 2;
    };
    Munkres.prototype.__step2 = function () {
      for (let i = 0; i < this.n; ++i) {
        for (let j = 0; j < this.n; ++j) {
          if (
            this.C[i][j] === 0 &&
            !this.col_covered[j] &&
            !this.row_covered[i]
          ) {
            this.marked[i][j] = 1;
            this.col_covered[j] = true;
            this.row_covered[i] = true;
            break;
          }
        }
      }
      this.__clear_covers();
      return 3;
    };
    Munkres.prototype.__step3 = function () {
      let count = 0;
      for (let i = 0; i < this.n; ++i) {
        for (let j = 0; j < this.n; ++j) {
          if (this.marked[i][j] == 1 && this.col_covered[j] == false) {
            this.col_covered[j] = true;
            ++count;
          }
        }
      }
      return count >= this.n ? 7 : 4;
    };
    Munkres.prototype.__step4 = function () {
      const done = false;
      let row = -1;
      let col = -1;
      let star_col = -1;
      while (!done) {
        const z = this.__find_a_zero();
        row = z[0];
        col = z[1];
        if (row < 0) return 6;
        this.marked[row][col] = 2;
        star_col = this.__find_star_in_row(row);
        if (star_col >= 0) {
          col = star_col;
          this.row_covered[row] = true;
          this.col_covered[col] = false;
        } else {
          this.Z0_r = row;
          this.Z0_c = col;
          return 5;
        }
      }
    };
    Munkres.prototype.__step5 = function () {
      let count = 0;
      this.path[count][0] = this.Z0_r;
      this.path[count][1] = this.Z0_c;
      let done = false;
      while (!done) {
        const row = this.__find_star_in_col(this.path[count][1]);
        if (row >= 0) {
          count++;
          this.path[count][0] = row;
          this.path[count][1] = this.path[count - 1][1];
        } else {
          done = true;
        }
        if (!done) {
          const col = this.__find_prime_in_row(this.path[count][0]);
          count++;
          this.path[count][0] = this.path[count - 1][0];
          this.path[count][1] = col;
        }
      }
      this.__convert_path(this.path, count);
      this.__clear_covers();
      this.__erase_primes();
      return 3;
    };
    Munkres.prototype.__step6 = function () {
      const minval = this.__find_smallest();
      for (let i = 0; i < this.n; ++i) {
        for (let j = 0; j < this.n; ++j) {
          if (this.row_covered[i]) this.C[i][j] += minval;
          if (!this.col_covered[j]) this.C[i][j] -= minval;
        }
      }
      return 4;
    };
    Munkres.prototype.__find_smallest = function () {
      let minval = MAX_SIZE;
      for (let i = 0; i < this.n; ++i)
        for (let j = 0; j < this.n; ++j)
          if (!this.row_covered[i] && !this.col_covered[j]) {
            if (minval > this.C[i][j]) minval = this.C[i][j];
          }
      return minval;
    };
    Munkres.prototype.__find_a_zero = function () {
      for (let i = 0; i < this.n; ++i)
        for (let j = 0; j < this.n; ++j)
          if (
            this.C[i][j] === 0 &&
            !this.row_covered[i] &&
            !this.col_covered[j]
          )
            return [i, j];
      return [-1, -1];
    };
    Munkres.prototype.__find_star_in_row = function (row) {
      for (let j = 0; j < this.n; ++j) if (this.marked[row][j] == 1) return j;
      return -1;
    };
    Munkres.prototype.__find_star_in_col = function (col) {
      for (let i = 0; i < this.n; ++i) if (this.marked[i][col] == 1) return i;
      return -1;
    };
    Munkres.prototype.__find_prime_in_row = function (row) {
      for (let j = 0; j < this.n; ++j) if (this.marked[row][j] == 2) return j;
      return -1;
    };
    Munkres.prototype.__convert_path = function (path, count) {
      for (let i = 0; i <= count; ++i)
        this.marked[path[i][0]][path[i][1]] =
          this.marked[path[i][0]][path[i][1]] == 1 ? 0 : 1;
    };
    Munkres.prototype.__clear_covers = function () {
      for (let i = 0; i < this.n; ++i) {
        this.row_covered[i] = false;
        this.col_covered[i] = false;
      }
    };
    Munkres.prototype.__erase_primes = function () {
      for (let i = 0; i < this.n; ++i)
        for (let j = 0; j < this.n; ++j)
          if (this.marked[i][j] == 2) this.marked[i][j] = 0;
    };
    function make_cost_matrix(profit_matrix, inversion_function) {
      let i;
      let j;
      if (!inversion_function) {
        let maximum = -1 / 0;
        for (i = 0; i < profit_matrix.length; ++i)
          for (j = 0; j < profit_matrix[i].length; ++j)
            if (profit_matrix[i][j] > maximum) maximum = profit_matrix[i][j];
        inversion_function = function (x) {
          return maximum - x;
        };
      }
      const cost_matrix = [];
      for (i = 0; i < profit_matrix.length; ++i) {
        const row = profit_matrix[i];
        cost_matrix[i] = [];
        for (j = 0; j < row.length; ++j)
          cost_matrix[i][j] = inversion_function(profit_matrix[i][j]);
      }
      return cost_matrix;
    }
    function format_matrix(matrix) {
      const columnWidths = [];
      let i;
      let j;
      for (i = 0; i < matrix.length; ++i) {
        for (j = 0; j < matrix[i].length; ++j) {
          const entryWidth = String(matrix[i][j]).length;
          if (!columnWidths[j] || entryWidth >= columnWidths[j])
            columnWidths[j] = entryWidth;
        }
      }
      let formatted = "";
      for (i = 0; i < matrix.length; ++i) {
        for (j = 0; j < matrix[i].length; ++j) {
          let s = String(matrix[i][j]);
          while (s.length < columnWidths[j]) s = ` ${s}`;
          formatted += s;
          if (j != matrix[i].length - 1) formatted += " ";
        }
        if (i != matrix[i].length - 1) formatted += "\n";
      }
      return formatted;
    }
    function computeMunkres(cost_matrix, options) {
      const m = new Munkres();
      return m.compute(cost_matrix, options);
    }
    computeMunkres.version = "1.2.2";
    computeMunkres.format_matrix = format_matrix;
    computeMunkres.make_cost_matrix = make_cost_matrix;
    computeMunkres.Munkres = Munkres;
    if (typeof module2 !== "undefined" && module2.exports) {
      module2.exports = computeMunkres;
    }
  },
});

// node_modules/ts-heapq/dist/heapq.js
const require_heapq = __commonJS({
  "node_modules/ts-heapq/dist/heapq.js": function (exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    const Heapq3 = (function () {
      function Heapq4(heap, comparator) {
        if (heap === void 0) {
          heap = [];
        }
        if (comparator === void 0) {
          comparator = function (a, b) {
            return a < b;
          };
        }
        this.heap = heap;
        this.comparator = comparator;
        this.heapify();
      }
      Heapq4.prototype.push = function (item) {
        this.heap.push(item);
        this.siftdown(0, this.heap.length - 1);
      };
      Heapq4.prototype.pop = function () {
        const last = this.heap.pop();
        if (!last) {
          throw new Error("Heap is empty");
        }
        if (!this.heap.length) {
          return last;
        }
        const returnItem = this.heap[0];
        this.heap[0] = last;
        this.siftup(0);
        return returnItem;
      };
      Heapq4.prototype.replace = function (item) {
        const returnItem = this.heap[0];
        this.heap[0] = item;
        this.siftup(0);
        return item;
      };
      Heapq4.prototype.pushPop = function (item) {
        let _a;
        if (this.heap.length && this.comparator(this.heap[0], item)) {
          (_a = [this.heap[0], item]), (item = _a[0]), (this.heap[0] = _a[1]);
          this.siftup(0);
        }
        return item;
      };
      Heapq4.prototype.top = function () {
        return this.heap[0];
      };
      Heapq4.prototype.length = function () {
        return this.heap.length;
      };
      Heapq4.prototype.heapify = function () {
        const n = this.heap.length;
        for (let i = n / 2; i >= 0; i--) {
          this.siftup(i);
        }
      };
      Heapq4.prototype.siftdown = function (startPos, pos) {
        const newItem = this.heap[pos];
        if (!newItem) {
          return;
        }
        while (pos > startPos) {
          const parentPos = (pos - 1) >> 1;
          const parent_1 = this.heap[parentPos];
          if (this.comparator(newItem, parent_1)) {
            this.heap[pos] = parent_1;
            pos = parentPos;
            continue;
          }
          break;
        }
        this.heap[pos] = newItem;
      };
      Heapq4.prototype.siftup = function (pos) {
        const endPos = this.heap.length;
        const startPos = pos;
        const newItem = this.heap[pos];
        if (!newItem) {
          return;
        }
        let childPos = 2 * pos + 1;
        while (childPos < endPos) {
          const rightPos = childPos + 1;
          if (
            rightPos < endPos &&
            !this.comparator(this.heap[childPos], this.heap[rightPos])
          ) {
            childPos = rightPos;
          }
          this.heap[pos] = this.heap[childPos];
          pos = childPos;
          childPos = 2 * pos + 1;
        }
        this.heap[pos] = newItem;
        this.siftdown(startPos, pos);
      };
      return Heapq4;
    })();
    exports.Heapq = Heapq3;
  },
});

// node_modules/ts-heapq/dist/utils.js
const require_utils = __commonJS({
  "node_modules/ts-heapq/dist/utils.js": function (exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    const heapq_1 = require_heapq();
    function merge(comparator) {
      const iterables = [];
      for (let _i = 1; _i < arguments.length; _i++) {
        iterables[_i - 1] = arguments[_i];
      }
      const list = [];
      for (let _a = 0, iterables_1 = iterables; _a < iterables_1.length; _a++) {
        const iter = iterables_1[_a];
        list.push.apply(list, iter);
      }
      return new heapq_1.Heapq(
        list,
        comparator ||
          function (a, b) {
            return a < b;
          }
      );
    }
    exports.merge = merge;
  },
});

// node_modules/ts-heapq/dist/index.js
const require_dist = __commonJS({
  "node_modules/ts-heapq/dist/index.js": function (exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    const heapq_1 = require_heapq();
    exports.Heapq = heapq_1.Heapq;
    const utils = require_utils();
    exports.utils = utils;
  },
});

// src/ExpansionManager.ts
const import_munkres_js = __toESM(require_munkres());

// src/djikstra.ts
const import_ts_heapq = __toESM(require_dist());

// src/helpers.ts
const debugTime = false;
const DEBUG = false;
const debug = (...data) => {
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
  return { min: minObj, index: minIndex, value: min };
}
function maxBy(array, callback) {
  let maxValue = -1 * Infinity;
  let maxObj = null;
  let maxIndex = null;
  for (const [index, a] of array.entries()) {
    const val = callback(a);
    if (val > maxValue) {
      maxValue = val;
      maxObj = a;
      maxIndex = index;
    }
  }
  return { maxObj, maxValue, maxIndex };
}
const computeManhattanDistance = (blockA, blockB) =>
  Math.abs(blockA.x - blockB.x) + Math.abs(blockA.y - blockB.y);

// src/djikstra.ts
const dijtstraAlgorithm = (map6, startingBlocks, maxTime = 8) => {
  const start = new Date();
  const hasVisited = /* @__PURE__ */ new Set();
  const distances = new Array(map6.length)
    .fill(Infinity)
    .map(() => new Array(map6[0].length).fill(Infinity));
  startingBlocks.forEach(([x, y]) => {
    distances[x][y] = 0;
    hasVisited.add(`${x},${y}`);
  });
  const nextBlocks = new import_ts_heapq.Heapq(
    Array.from(startingBlocks),
    (a, b) => a[2] < b[2]
  );
  let currentBlock = nextBlocks.pop();
  while (currentBlock) {
    const [x, y] = currentBlock;
    const block = map6[x][y];
    for (const neighor of block.neighbors) {
      const xToUpdate = neighor.y;
      const yToUpdate = neighor.x;
      if (
        !hasVisited.has(`${xToUpdate},${yToUpdate}`) &&
        map6[xToUpdate][yToUpdate].canMove
      ) {
        const newValue = 1 + distances[x][y];
        if (newValue < distances[xToUpdate][yToUpdate]) {
          distances[xToUpdate][yToUpdate] = newValue;
          nextBlocks.push([xToUpdate, yToUpdate, newValue]);
          hasVisited.add(`${xToUpdate},${yToUpdate}`);
        }
      }
    }
    currentBlock = nextBlocks.length() ? nextBlocks.pop() : null;
    const currentTime = new Date().getTime() - start.getTime();
    if (currentTime > maxTime) {
      debug(
        `dijtstraAlgorithm for ${startingBlocks[0][1]},${startingBlocks[0][0]} was cut because time: ${currentTime}ms higher than 5ms`
      );
      return distances;
    }
  }
  const end = new Date().getTime() - start.getTime();
  if (debugTime)
    debug(
      `dijtstraAlgorithm for ${startingBlocks[0][1]},${startingBlocks[0][0]} - time: ${end}ms`
    );
  return distances;
};

// src/Block.ts
var Block = class {
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
    this.hasMoved = 0;
    this.potentiel = null;
    this.nearestOpponent = null;
    this.nearestOpponentDistance = Infinity;
    this.gains = null;
  }

  equals(block) {
    return block && this.x === block.x && this.y === block.y;
  }

  static clone(block) {
    return new Block(
      block.x,
      block.y,
      block.scrapAmount,
      block.owner,
      block.units,
      block.recycler,
      block.canBuild,
      block.canSpawn,
      block.inRangeOfRecycler
    );
  }

  get canMove() {
    return !this.recycler && this.scrapAmount > 0;
  }

  get isGrass() {
    return this.scrapAmount === 0;
  }

  get willBecomeGrass() {
    const { neighborsWithRecycler } = this;
    let grassInXTurn = Infinity;
    for (const neighbor of neighborsWithRecycler) {
      if (neighbor.recycler && this.scrapAmount <= neighbor.scrapAmount) {
        if (this.scrapAmount < grassInXTurn) grassInXTurn = this.scrapAmount;
      }
    }
    return grassInXTurn;
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

  updateNeighbors(map6) {
    this.neighbors = [];
    this.neighborsWithRecycler = [];
    const { x, y } = this;
    if (x > 0) {
      if (map6[y][x - 1].canMove) this.neighbors.push(map6[y][x - 1]);
      if (map6[y][x - 1].recycler)
        this.neighborsWithRecycler.push(map6[y][x - 1]);
    }
    if (x < map6[0].length - 1) {
      if (map6[y][x + 1].canMove) this.neighbors.push(map6[y][x + 1]);
      if (map6[y][x + 1].recycler)
        this.neighborsWithRecycler.push(map6[y][x + 1]);
    }
    if (y > 0) {
      if (map6[y - 1][x].canMove) this.neighbors.push(map6[y - 1][x]);
      if (map6[y - 1][x].recycler)
        this.neighborsWithRecycler.push(map6[y - 1][x]);
    }
    if (y < map6.length - 1) {
      if (map6[y + 1][x].canMove) this.neighbors.push(map6[y + 1][x]);
      if (map6[y + 1][x].recycler)
        this.neighborsWithRecycler.push(map6[y + 1][x]);
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
    this.gains = null;
    this.hasMoved = 0;
    this.nearestOpponent = null;
    this.nearestOpponentDistance = Infinity;
  }

  distanceToBlock(block) {
    if (!block) return Infinity;
    const { x, y } = block;
    if (this.djikstraMap.length) {
      return this.djikstraMap[y][x];
    }
    if (block.djikstraMap.length) {
      return block.djikstraMap[this.y][this.x];
    }
    this.djikstraMap = dijtstraAlgorithm(map, [[this.y, this.x]]);
    return this.djikstraMap[y][x];
  }

  get distanceToSeparation() {
    const { separation } = expensionManager;
    const distance = minBy(separation, (block) =>
      this.distanceToBlock(block)
    ).value;
    return distance !== null ? distance : Infinity;
  }

  get manathanDistanceToSeparation() {
    const { separation } = expensionManager;
    const distance = minBy(separation, (block) =>
      computeManhattanDistance(block, this)
    ).value;
    return distance !== null ? distance : Infinity;
  }

  get isOnSeparation() {
    return !!expensionManager.separation.find((block) => block.equals(this));
  }

  get initialOwner() {
    return expensionManager.mapOwner[this.y][this.x].owner;
  }

  getOneRobotPerUnit() {
    const robots = [];
    for (let i = 0; i < this.units - this.hasMoved; i++) {
      robots.push(this);
    }
    return robots;
  }

  findNearestOpponent(owner = 0 /* OPPONENT */, maxDistance = Infinity) {
    if (this.nearestOpponent)
      return {
        nearestOpponent: this.nearestOpponent,
        nearestOpponentDistance: this.nearestOpponentDistance,
      };
    const hasVisited = /* @__PURE__ */ new Set();
    hasVisited.add(this);
    let distance = 0;
    let nextBlocks = [this];
    while (
      !this.nearestOpponent &&
      nextBlocks.length &&
      distance < maxDistance
    ) {
      const currentBlocks = Array.from(nextBlocks);
      nextBlocks = [];
      while (currentBlocks.length) {
        const currentBlock = currentBlocks.pop();
        if (currentBlock.owner === owner) {
          this.nearestOpponent = currentBlock;
          this.nearestOpponentDistance = distance;
          break;
        }
        for (const neighbor of currentBlock.neighbors) {
          if (!hasVisited.has(neighbor) && neighbor.canMove) {
            hasVisited.add(neighbor);
            nextBlocks.push(neighbor);
          }
        }
      }
      distance += 1;
    }
    return {
      nearestOpponent: this.nearestOpponent,
      nearestOpponentDistance: this.nearestOpponentDistance,
    };
  }

  getPotentiel(radius) {
    if (this.potentiel) return this.potentiel;
    this.potentiel = 0;
    const hasVisited = /* @__PURE__ */ new Set();
    hasVisited.add(this);
    const opponentPotentiel = (initialOwner) =>
      initialOwner === 1 /* ME */ && radius !== Infinity ? 3 : 1;
    const nonePotentiel = (initialOwner) =>
      initialOwner === 1 /* ME */ || radius === Infinity ? 1 : 3;
    let nextBlocks = [this];
    for (let i = 0; i <= radius; i++) {
      const currentBlocks = Array.from(nextBlocks);
      nextBlocks = [];
      const distance = i === 0 ? 0.5 : i;
      while (currentBlocks.length) {
        const currentBlock = currentBlocks.pop();
        if (currentBlock.owner === 0 /* OPPONENT */)
          this.potentiel +=
            opponentPotentiel(currentBlock.initialOwner) / distance;
        else if (currentBlock.owner === -1 /* NONE */) {
          if (currentBlock.y === 0 || currentBlock.y === height - 1) {
            this.potentiel += 2 / distance;
          }
          this.potentiel += nonePotentiel(currentBlock.initialOwner) / distance;
        }
        for (const neighbor of currentBlock.neighbors) {
          if (!hasVisited.has(neighbor) && neighbor.canMove) {
            hasVisited.add(neighbor);
            nextBlocks.push(neighbor);
          }
        }
      }
      if (!nextBlocks.length) {
        return this.potentiel;
      }
    }
    return this.potentiel;
  }

  resetPotentiel() {
    this.potentiel = null;
  }

  isNearOfARecycler(owner) {
    const recyclers = owner === 1 /* ME */ ? myRecyclers : opponentRecyclers;
    for (const recycler of recyclers.filter((block) => !block.equals(this))) {
      if (computeManhattanDistance(recycler, this) < 3) {
        return true;
      }
    }
    return false;
  }

  computeGains(owner = 1 /* ME */) {
    if (this.gains) return this.gains;
    const { scrapAmount } = this;
    let total = scrapAmount;
    let grassCreated = 1;
    for (const block of this.neighbors) {
      if (!this.isNearOfARecycler(owner)) {
        total +=
          block.scrapAmount > scrapAmount ? scrapAmount : block.scrapAmount;
      }
      if (block.scrapAmount <= scrapAmount && !this.isNearOfARecycler(owner)) {
        if (block.initialOwner === 1 /* ME */) {
          grassCreated += 1;
        } else if (block.initialOwner === 0 /* OPPONENT */) {
          grassCreated -= 1;
        }
      }
    }
    this.gains = {
      gains: total,
      gainsPerTurn: total / scrapAmount,
      grassCreated,
      gainsPerGrassCreated: total / grassCreated,
    };
    return this.gains;
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

  static createCopyOfMap(map6) {
    const copy = [];
    for (let i = 0; i < map6.length; i++) {
      const blocks3 = [];
      for (let j = 0; j < map6[i].length; j++) {
        blocks3.push(Block.clone(map6[i][j]));
      }
      copy.push(blocks3);
    }
    for (let i = 0; i < map6.length; i++) {
      for (let j = 0; j < map6[i].length; j++) {
        copy[i][j].updateNeighbors(copy);
      }
    }
    return copy;
  }
};

// src/ClassLogger.ts
const SHOULD_DEBUG = {
  DefenseManager: false,
  RecyclerBuilder: true,
  Island: false,
  RobotBuilder: false,
  ExpansionManager: false,
  RobotManager: false,
};
const ClassLogger = class {
  debug(...data) {
    const className = this.constructor.name;
    if (SHOULD_DEBUG[className]) debug(`[${className}]`, ...data);
  }
};

// src/Island.ts
var Island = class extends ClassLogger {
  constructor() {
    super(...arguments);
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
      this.blocks.findIndex((block) => block.owner === 0 /* OPPONENT */) >= 0;
    if (hasMineBlock && hasOpponentBlock) return -2 /* BOTH */;
    if (hasMineBlock) return 1 /* ME */;
    if (hasOpponentBlock) return 0 /* OPPONENT */;
    return -1 /* NONE */;
  }

  static createIsland(start) {
    const island = new Island();
    const nextBlocks = [start];
    start.island = island;
    while (nextBlocks.length) {
      const nextBlock = nextBlocks.pop();
      island.blocks.push(nextBlock);
      const neighbors = nextBlock.neighbors.filter(
        (neighbor) => !neighbor.island
      );
      for (const neighbor of neighbors) {
        neighbor.island = island;
        nextBlocks.push(neighbor);
      }
    }
    return island;
  }

  static findIslands(map6) {
    const start = new Date();
    const flapMap = map6.flat();
    let blockWithoutIsland = flapMap.find(
      (block) => !block.island && block.canMove
    );
    const islands2 = [];
    while (blockWithoutIsland) {
      const island = Island.createIsland(blockWithoutIsland);
      islands2.push(island);
      blockWithoutIsland = flapMap.find(
        (block) => !block.island && block.canMove
      );
    }
    debug(
      "[Islands]",
      islands2.length,
      islands2.map((island) => ({
        size: island.size,
        owner: island.owner,
        origin: [island.blocks[0].x, island.blocks[0].y],
      }))
    );
    const end = new Date().getTime() - start.getTime();
    if (debugTime) debug("findIslands time: %dms", end);
    return islands2;
  }
};

// src/State.ts
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
let myStartPosition = {};
let opponentStartPosition = {};
let hasOneBlockedTransformedIntoGrassOrRecycler = false;
let blocks = [];
let islands = [];
let myBlocks = [];
let notMyBlocks = [];
let opponentBlocks = [];
let myRobots = [];
let opponentRobots = [];
var myRecyclers = [];
var opponentRecyclers = [];
const createMap = (width2, height2) => {
  const map6 = [];
  for (let i = 0; i < height2; i++) {
    const blocks3 = [];
    for (let j = 0; j < width2; j++) {
      blocks3.push(
        new Block(j, i, 0, -1 /* NONE */, 0, false, false, false, false)
      );
    }
    map6.push(blocks3);
  }
  return map6;
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
  hasOneBlockedTransformedIntoGrassOrRecycler = false;
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
  myRobots = [];
  opponentRobots = [];
  myRecyclers = [];
  opponentRecyclers = [];
  blocks.forEach((block) => {
    block.updateNeighbors(map);
    if (block.owner === 1 /* ME */) myBlocks.push(block);
    if (block.owner !== 1 /* ME */ && block.canMove) notMyBlocks.push(block);
    if (block.owner === 0 /* OPPONENT */) opponentBlocks.push(block);
    if (block.owner === 1 /* ME */ && block.units) {
      for (let i = 0; i < block.units; i++) myRobots.push(block);
    }
    if (block.owner === 0 /* OPPONENT */ && block.units)
      opponentRobots.push(block);
    if (block.owner === 1 /* ME */ && block.recycler) myRecyclers.push(block);
    if (block.owner === 0 /* OPPONENT */ && block.recycler)
      opponentRecyclers.push(block);
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
  computeData();
  computeStartPosition();
  islands = Island.findIslands(map);
};

// src/Actions.ts
const MoveAction = class {
  constructor(amount, origin, destination) {
    this.amount = amount;
    this.origin = origin;
    this.destination = destination;
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
    if (this.destination.owner === -1 /* NONE */) {
      this.destination.units += this.amount;
    }
    if (this.destination.owner === 1 /* ME */) {
      this.destination.canBuild = false;
    }
  }

  equals(action) {
    const { amount, origin, destination } = action;
    return (
      this.amount === amount &&
      this.origin.equals(origin) &&
      this.destination.equals(destination)
    );
  }

  output() {
    let actionStr = `MOVE ${this.amount} ${this.origin.x} ${this.origin.y} ${this.destination.x} ${this.destination.y}`;
    if (
      this.destination.owner !== 0 /* OPPONENT */ ||
      this.destination.units !== 0
    )
      return actionStr;
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
};
const BuildAction = class {
  constructor(block) {
    this.block = block;
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

  equals(action) {
    const { block } = action;
    return this.block.equals(block);
  }
};
const SpawnAction = class {
  constructor(amount, block) {
    this.amount = amount;
    this.block = block;
    this.block.units += amount;
    this.block.hasMoved += amount;
    setMyMatter(myMatter - 10 * amount);
    this.amount = amount;
  }

  equals(action) {
    const { block, amount } = action;
    return this.block.equals(block) && this.amount === amount;
  }

  output() {
    const { x, y } = this.block;
    return `SPAWN ${this.amount} ${x} ${y}`;
  }
};
const MessageAction = class {
  constructor(message) {
    this.message = message;
  }

  equals() {
    return true;
  }

  output() {
    return `MESSAGE ${this.message}`;
  }
};

// src/RecyclerBuilder.ts
const import_ts_heapq2 = __toESM(require_dist());

// src/DefenseManager.ts
const DefenseManager = class extends ClassLogger {
  findDangeroursRobots() {
    const dangerousRobots = [];
    for (const dangerousRobot of opponentRobots.filter(
      (robot) =>
        robot.findNearestOpponent(1 /* ME */, 4).nearestOpponentDistance < 3
    )) {
      const blockToDefends = dangerousRobot.neighbors.filter(
        (block) =>
          block.owner !== 0 /* OPPONENT */ &&
          block.canMove &&
          block.willBecomeGrass > 1
      );
      if (blockToDefends.length) {
        for (const blockToDefend of blockToDefends) {
          dangerousRobots.push({ dangerousRobot, blockToDefend });
        }
      }
    }
    dangerousRobots.sort((a, b) => {
      if (a.blockToDefend.owner !== b.blockToDefend.owner) {
        if (a.blockToDefend.owner === -1 /* NONE */) return -1;
        if (b.blockToDefend.owner === -1 /* NONE */) return 1;
      }
      if (a.blockToDefend.units !== b.blockToDefend.units)
        return a.blockToDefend.units - b.blockToDefend.units;
      const neighborsWithUnitsA = a.blockToDefend.neighbors.reduce(
        (total, block) =>
          block.owner === 1 /* ME */ ? total + block.units : total,
        0
      );
      const neighborsWithUnitsB = b.blockToDefend.neighbors.reduce(
        (total, block) =>
          block.owner === 1 /* ME */ ? total + block.units : total,
        0
      );
      if (neighborsWithUnitsA !== neighborsWithUnitsB)
        return neighborsWithUnitsA - neighborsWithUnitsB;
      return (
        computeManhattanDistance(a.blockToDefend, myStartPosition) -
        computeManhattanDistance(b.blockToDefend, myStartPosition)
      );
    });
    this.debug(
      "DangerousRobots",
      dangerousRobots.map((danger) => ({
        robot: [danger.dangerousRobot.x, danger.dangerousRobot.y],
        blockToDefend: [danger.blockToDefend.x, danger.blockToDefend.y],
      }))
    );
    return dangerousRobots;
  }

  builDefensiveRecycler(dangerousRobot, blockToDefend, remainingBlockToDefend) {
    const { gains, grassCreated } = blockToDefend.computeGains();
    const { myGrassCreated, opponentGrassCreated } = recyclerBuilder;
    if (
      (dangerousRobot.units > 1 &&
        (remainingBlockToDefend > 1 ||
          myMatter >= dangerousRobot.units / 10)) ||
      ((gains > 20 ||
        [-2 /* BOTH */ || 0 /* OPPONENT */].includes(
          blockToDefend.initialOwner
        )) &&
        recyclerBuilder.myGrassCreated + grassCreated <=
          recyclerBuilder.opponentGrassCreated)
    ) {
      this.debug(
        `Building a recycler on ${blockToDefend.x},${blockToDefend.y} to defend`
      );
      recyclerBuilder.hasBuildLastRound = true;
      return new BuildAction(blockToDefend);
    }
    this.debug(
      `We wont building a recycler on ${blockToDefend.x},${blockToDefend.y} to defend`,
      {
        dangerousRobot: dangerousRobot.units,
        remainingBlockToDefend,
        myMatter,
        gains,
        grassCreated,
        myGrassCreated,
        opponentGrassCreated,
        initialOwner: blockToDefend.initialOwner,
      }
    );
    return null;
  }

  computeDefense() {
    const start = new Date();
    const actions = [];
    const dangerousRobots = this.findDangeroursRobots();
    const defendedBlocks = /* @__PURE__ */ new Set();
    while (dangerousRobots.length) {
      const { dangerousRobot, blockToDefend } = dangerousRobots.shift();
      const unitsToHave = dangerousRobot.units;
      this.debug(
        `Trying to defend of an attack from ${dangerousRobot.x},${dangerousRobot.y} with ${unitsToHave} robots`
      );
      defendedBlocks.add(blockToDefend);
      const neighborsWithUnits = blockToDefend.neighbors
        .filter((block) => block.owner === 1 /* ME */ && block.units > 0)
        .sort((a, b) => b.units - a.units);
      const unitsInRange = neighborsWithUnits.reduce(
        (total, neighbor) => total + neighbor.units,
        0
      );
      if (blockToDefend.canBuild && myMatter >= 10) {
        const action = this.builDefensiveRecycler(
          dangerousRobot,
          blockToDefend,
          dangerousRobots.length
        );
        if (action) {
          actions.push(action);
          continue;
        }
      }
      if (
        [0 /* OPPONENT */, -2 /* BOTH */].includes(blockToDefend.initialOwner)
      ) {
        this.debug("Wont defend anymore as we prefer to attack");
        continue;
      }
      const possibleSpawns =
        blockToDefend.owner === 1 /* ME */ ? Math.floor(myMatter / 10) : 0;
      const unitToStay =
        blockToDefend.initialOwner === 1 /* ME */ ? blockToDefend.units : 0;
      const isDefensePossible =
        unitsToHave - unitToStay - unitsInRange - possibleSpawns <= 0;
      if (isDefensePossible) {
        this.debug(
          `Defense on ${blockToDefend.x},${blockToDefend.y} is possible`,
          {
            unitsToHave,
            blockToDefendUnits: blockToDefend.units,
            unitsInRange,
            myMatter,
          }
        );
        let unitsToDefend = 0;
        while (
          myMatter >= 10 &&
          unitsToHave > unitsToDefend &&
          blockToDefend.canSpawn
        ) {
          unitsToDefend += 1;
          this.debug(
            `Spawning a unit in ${blockToDefend.x},${blockToDefend.y} to defend. We have now ${unitsToDefend} units to defend.`
          );
          actions.push(new SpawnAction(1, blockToDefend));
        }
        if (
          unitsToHave > unitsToDefend &&
          blockToDefend.initialOwner === 1 /* ME */
        ) {
          const robotsToLetInPlace =
            blockToDefend.units >= unitsToHave - unitsToDefend
              ? unitsToHave - unitsToDefend
              : blockToDefend.units;
          unitsToDefend += robotsToLetInPlace;
          this.debug(
            `Letting ${robotsToLetInPlace} robots in place in ${blockToDefend.x},${blockToDefend.y} to defend. We have now ${unitsToDefend} units to defend.`
          );
          blockToDefend.hasMoved += robotsToLetInPlace;
        }
        if (unitsToDefend >= unitsToHave) continue;
        for (const neighbor of neighborsWithUnits) {
          const robotsToMove =
            neighbor.units >= unitsToHave - unitsToDefend
              ? unitsToHave - unitsToDefend
              : neighbor.units;
          unitsToDefend += robotsToMove;
          this.debug(
            `Moving ${robotsToMove} robots from ${neighbor.x},${neighbor.y} to ${blockToDefend.x},${blockToDefend.y} to defend. We have now ${unitsToDefend} units to defend.`
          );
          actions.push(new MoveAction(robotsToMove, neighbor, blockToDefend));
          if (unitsToDefend >= unitsToHave) break;
        }
      } else {
        this.debug(
          `Defense on ${blockToDefend.x},${blockToDefend.y} is not possible. We let the block to the opponent`,
          {
            unitsToHave,
            blockToDefendUnits: blockToDefend.units,
            unitsInRange,
            myMatter,
          }
        );
      }
    }
    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`computeDefense time: ${end}ms`);
    return actions;
  }
};
const defenseManager = new DefenseManager();

// src/RobotBuilder.ts
const RobotBuilder = class extends ClassLogger {
  computeDefensiveSpawn() {
    const start = new Date();
    const actions = [];
    const blocksToSpawn = myBlocks
      .filter((block) => {
        let _a;
        let _b;
        return (
          block.canSpawn &&
          (((_a = block.island) == null ? void 0 : _a.owner) !== 1 /* ME */ ||
            !((_b = block.island) == null ? void 0 : _b.hasRobot)) &&
          block.willBecomeGrass > 1 &&
          block.neighbors.find((a) => a.owner !== 1 /* ME */)
        );
      })
      .sort(
        (a, b) =>
          computeManhattanDistance(a, myStartPosition) -
          computeManhattanDistance(b, myStartPosition)
      );
    for (const block of blocksToSpawn) {
      for (const robot of opponentRobots) {
        if (
          side * (robot.x - block.x) === 1 &&
          robot.y === block.y &&
          robot.units - block.units > 0
        ) {
          if (myMatter >= 10 * (robot.units - block.units)) {
            this.debug(
              `DefenseSpawn of ${robot.units - block.units} on ${block.x},${
                block.y
              }`
            );
            actions.push(new SpawnAction(robot.units - block.units, block));
          } else {
            this.debug(
              `Wont defend on ${block.x},${block.y} because we cant build of ${
                robot.units - block.units
              } units`
            );
            block.canSpawn = false;
          }
        }
      }
    }
    this.debug(
      "computeDefensiveSpawn",
      actions.length,
      actions.map((action) => [action.block.x, action.block.y])
    );
    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`computeDefensiveSpawn time: ${end} ms`);
    return actions;
  }

  computeNormalSpawn() {
    const start = new Date();
    const possibleBlocks = myBlocks
      .filter((block) => {
        let _a;
        let _b;
        return (
          block.canSpawn &&
          (((_a = block.island) == null ? void 0 : _a.owner) !== 1 /* ME */ ||
            !((_b = block.island) == null ? void 0 : _b.hasRobot)) &&
          block.willBecomeGrass > 1 &&
          block.neighbors.find((a) => a.owner !== 1 /* ME */)
        );
      })
      .sort((a, b) => side * (b.x - a.x));
    const blocksToSpawn = [];
    const blockInThisLine = /* @__PURE__ */ new Set();
    for (const block of possibleBlocks) {
      if (!blockInThisLine.has(block.y)) {
        blocksToSpawn.push(block);
        blockInThisLine.add(block.y);
      }
    }
    this.debug(
      "possibleSpawn",
      blocksToSpawn.length,
      blocksToSpawn.map((block) => [block.x, block.y])
    );
    const sortingCriteria = /* @__PURE__ */ new Map();
    for (const block of blocksToSpawn) {
      let minToNone = Infinity;
      let minToOpponent = Infinity;
      const { neighbors } = block;
      let neighborRobots = 0;
      for (const neighbor of neighbors) {
        if (neighbor.owner === 1 /* ME */) neighborRobots += neighbor.units;
        if (neighbor.owner === 0 /* OPPONENT */) minToOpponent = 1;
        if (neighbor.owner === -1 /* NONE */) minToNone = 1;
      }
      if (minToOpponent === Infinity) {
        for (const emptyBlock of notMyBlocks) {
          const distance = block.distanceToBlock(emptyBlock);
          if (emptyBlock.owner === 0 /* OPPONENT */) {
            if (distance < minToOpponent) {
              minToOpponent = distance;
            }
          } else if (distance < minToNone) {
            minToNone = distance;
          }
        }
      }
      const potentialRadius = 5;
      const potential = block.getPotentiel(potentialRadius);
      sortingCriteria.set(block, {
        minToNone,
        minToOpponent,
        potential,
        neighborRobots,
      });
    }
    blocksToSpawn.sort((a, b) => {
      const {
        minToNone: minToNoneA,
        minToOpponent: minToOpponentA,
        potential: potentialA,
        neighborRobots: neighborRobotsA,
      } = sortingCriteria.get(a);
      const {
        minToNone: minToNoneB,
        minToOpponent: minToOpponentB,
        potential: potentialB,
        neighborRobots: neighborRobotsB,
      } = sortingCriteria.get(b);
      if (minToOpponentA !== minToOpponentB)
        return minToOpponentA - minToOpponentB;
      if (minToOpponentA === Infinity && minToNoneA !== minToNoneB)
        return minToNoneA - minToNoneB;
      if (
        potentialA !== potentialB &&
        neighborRobotsA <= 3 &&
        neighborRobotsB <= 3
      )
        return potentialB - potentialA;
      if (neighborRobotsA !== neighborRobotsB)
        return neighborRobotsA - neighborRobotsB;
      return side * (b.x - a.x);
    });
    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`computeNormalSpawn time: ${end} ms`);
    return blocksToSpawn.slice(0, 3);
  }

  action() {
    const actions = [];
    const blocksToSpawn = this.computeNormalSpawn();
    let blockToSpawnIndex = 0;
    while (myMatter >= 10 && blocksToSpawn[blockToSpawnIndex]) {
      const blockToSpawn = blocksToSpawn[blockToSpawnIndex];
      actions.push(new SpawnAction(1, blockToSpawn));
      blockToSpawnIndex += 1;
      if (blockToSpawnIndex === blocksToSpawn.length) blockToSpawnIndex = 0;
    }
    this.debug("Spawns", actions.length);
    return actions;
  }
};
const robotBuilder = new RobotBuilder();

// src/RobotManager.ts
const RobotManager = class extends ClassLogger {
  constructor() {
    super(...arguments);
    this.robotsToMove = [];
  }

  naiveMethod() {
    const start = new Date();
    const actions = [];
    const robotsToMove = myBlocks
      .filter((block) => block.units > 0 && block.hasMoved < block.units)
      .flatMap((robot) => robot.getOneRobotPerUnit());
    for (const robot of robotsToMove) {
      const nearestEmptyBlocks = robot.neighbors
        .filter((block) => {
          const { willBecomeGrass } = block;
          if (willBecomeGrass === Infinity) return true;
          return willBecomeGrass > 1;
        })
        .sort((a, b) => {
          let _a;
          const potentielRadius =
            ((_a = robot.island) == null ? void 0 : _a.owner) === 1 /* ME */
              ? Infinity
              : 5;
          const potentielA = a.getPotentiel(potentielRadius);
          const potentielB = b.getPotentiel(potentielRadius);
          if (
            potentielRadius !== Infinity &&
            (a.distanceToSeparation > 3 || b.distanceToSeparation > 4)
          ) {
            return a.distanceToSeparation - b.distanceToSeparation;
          }
          if (robot.initialOwner === 0 /* OPPONENT */) {
            if (a.owner !== b.owner) {
              if (a.owner === -1 /* NONE */) return -1;
              if (a.owner === 1 /* ME */) return 1;
              if (a.owner === 0 /* OPPONENT */) {
                if (b.owner === -1 /* NONE */) return 1;
                if (b.owner === 1 /* ME */) return -1;
              }
            }
            return potentielB - potentielA;
          }
          if (potentielA !== potentielB) return potentielB - potentielA;
          return side * (b.x - a.x);
        });
      this.debug(
        `Robot ${robot.x},${robot.y} neighors potentiel`,
        nearestEmptyBlocks.map((block) => [
          block.x,
          block.y,
          block.getPotentiel(5),
        ])
      );
      const nearestEmptyBlock = nearestEmptyBlocks[0];
      if (nearestEmptyBlock) {
        this.debug(
          `Robot ${robot.x},${robot.y} will go to ${nearestEmptyBlock.x},${nearestEmptyBlock.y}`
        );
        actions.push(new MoveAction(1, robot, nearestEmptyBlock));
      }
    }
    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`naiveMethod time: ${end} ms`);
    return actions;
  }

  action() {
    const actions = this.naiveMethod();
    return actions;
  }
};
const robotManager = new RobotManager();

// src/IA.ts
const IA = class {
  constructor() {
    this.actions = [];
    this.lastScore = { mine: 0, opponent: 0 };
    this.turnsWithSameScore = 0;
    this.lastActions = [];
    this.turnsWithSameActions = 0;
  }

  chooseAction() {
    recyclerBuilder.computeGrassCreated();
    const winRecyclers = recyclerBuilder.buildWinRecycler();
    const defenseActions = defenseManager.computeDefense();
    const moveToSeparationActions = expensionManager.moveAndBuildToSeparation();
    const robotActions = robotManager.action();
    const recyclerActions = recyclerBuilder.action();
    const robotBuilderActions = robotBuilder.action();
    this.actions = [
      ...winRecyclers,
      ...defenseActions,
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

  checkSameActions() {
    if (this.actions.length !== this.lastActions.length) {
      this.turnsWithSameActions = 0;
      return;
    }
    for (let i = 0; i < this.actions.length; i++) {
      if (!this.actions[i].equals(this.lastActions[i])) {
        this.turnsWithSameActions = 0;
        return;
      }
    }
    this.turnsWithSameActions += 1;
  }

  checkSameScore() {
    const { mine, opponent } = this.lastScore;
    if (mine === myBlocks.length && opponent === opponentBlocks.length) {
      this.turnsWithSameScore += 1;
    } else {
      this.lastScore.mine = myBlocks.length;
      this.lastScore.opponent = opponentBlocks.length;
      this.turnsWithSameScore = 0;
    }
  }

  endTurn() {
    this.checkSameScore();
    debug("turnsWithSameScore", this.turnsWithSameScore);
    if (this.actions.length) {
      this.lastActions = Array.from(this.actions);
      console.log(this.actions.map((action) => action.output()).join(";"));
    } else {
      console.log("WAIT");
    }
  }
};
const ia = new IA();

// src/RecyclerBuilder.ts
const RecyclerBuilder = class extends ClassLogger {
  constructor() {
    super(...arguments);
    this.hasBuildLastRound = false;
    this.bestRecyclers = [];
    this.opponentGrassCreated = 0;
    this.myGrassCreated = 0;
  }

  computeIncomes() {
    let myIncome = 0;
    let opponentIncome = 0;
    for (const recycler of myRecyclers) {
      this.debug("Gains", recycler.computeGains(1 /* ME */));
      myIncome += recycler.computeGains(1 /* ME */).gains;
    }
    for (const recycler of opponentRecyclers) {
      opponentIncome += recycler.computeGains(0 /* OPPONENT */).gains;
    }
    this.debug("Incomes", { myIncome, opponentIncome });
    return {
      myIncome,
      opponentIncome,
    };
  }

  computeGrassCreated() {
    this.opponentGrassCreated = 0;
    this.myGrassCreated = 0;
    for (let i = 0; i < map.length; i++) {
      for (let j = 0; j < map[0].length; j++) {
        const block = map[i][j];
        if (
          block.recycler ||
          block.scrapAmount === 0 ||
          block.willBecomeGrass < Infinity
        ) {
          const { owner } = expensionManager.mapOwner[i][j];
          if (owner === 0 /* OPPONENT */) {
            this.opponentGrassCreated += 1;
          }
          if (owner === 1 /* ME */) {
            this.myGrassCreated += 1;
          }
        }
      }
    }
  }

  findBestRecyclers(map6) {
    if (this.bestRecyclers.length) return;
    this.bestRecyclers = map6
      .flat()
      .filter(
        (block) =>
          block.initialOwner === 1 /* ME */ &&
          block.computeGains().gains > 20 &&
          block.distanceToSeparation <= myStartPosition.distanceToSeparation
      );
    this.bestRecyclers.sort((a, b) => {
      const { gainsPerGrassCreated: gainsPerGrassCreatedA } = a.computeGains();
      const { gainsPerGrassCreated: gainsPerGrassCreatedB } = b.computeGains();
      return gainsPerGrassCreatedB - gainsPerGrassCreatedA;
    });
    this.debug(
      "BestRecyclers",
      this.bestRecyclers.map((block) => [
        block.x,
        block.y,
        block.computeGains(),
      ])
    );
  }

  willCreateNewIsland(block) {
    const copyMap = Block.createCopyOfMap(map);
    copyMap[block.y][block.x].recycler = true;
    const flapMap = copyMap.flat();
    const recyclers = flapMap.filter((block2) => block2.recycler);
    for (const recycler of recyclers) {
      for (const neighbor of recycler.neighbors) {
        if (neighbor.scrapAmount <= recycler.scrapAmount) {
          copyMap[neighbor.y][neighbor.x].scrapAmount = 0;
        }
      }
    }
    flapMap.forEach((block2) => block2.updateNeighbors(copyMap));
    const newIslands = Island.findIslands(copyMap);
    if (newIslands.length === islands.length) {
      this.debug(
        `Recycler on ${block.x},${block.y} will not create a new island`,
        {
          newIslands: newIslands.map((i) => [i.blocks[0].x, i.blocks[0].y]),
          islands: islands.map((i) => [i.blocks[0].x, i.blocks[0].y]),
        }
      );
      return false;
    }
    for (const island of newIslands) {
      if (
        island.owner === -1 /* NONE */ &&
        island.blocks[0].initialOwner === 1 /* ME */ &&
        island.size > 1 &&
        !islands.find(
          (i) => i.blocks[0].equals(island.blocks[0]) && i.size === island.size
        )
      ) {
        this.debug(
          `Recycler on ${block.x},${block.y} will create a new island without block we own`,
          {
            island: {
              owner: island.owner,
              origin: `${island.blocks[0].x},${island.blocks[0].y}`,
              size: island.size,
            },
            newIslands: newIslands.map((i) => ({
              owner: i.owner,
              origin: `${i.blocks[0].x},${i.blocks[0].y}`,
              size: i.size,
            })),
            islands: islands.map((i) => ({
              owner: i.owner,
              origin: `${i.blocks[0].x},${i.blocks[0].y}`,
              size: i.size,
            })),
          }
        );
        return true;
      }
    }
    this.debug(
      `Recycler on ${block.x},${block.y} will create a new island but we can spawn on it`,
      {
        newIslands: newIslands.map((i) => ({
          owner: i.owner,
          origin: `${i.blocks[0].x},${i.blocks[0].y}`,
          size: i.size,
        })),
        islands: islands.map((i) => ({
          owner: i.owner,
          origin: `${i.blocks[0].x},${i.blocks[0].y}`,
          size: i.size,
        })),
      }
    );
    return false;
  }

  shouldBuildNaiveRecycler() {
    const notGrassBlocks = blocks.filter((block) => !block.isGrass);
    const should =
      myMatter >= 10 &&
      (!this.hasBuildLastRound ||
        this.myGrassCreated + 3 < this.opponentGrassCreated) &&
      (notGrassBlocks.length >= 100 ||
        opponentRecyclers.length > myRecyclers.length ||
        ia.turnsWithSameScore > 10 ||
        !!myBlocks.find((block) => block.initialOwner === 0 /* OPPONENT */)) &&
      myMatter < 40;
    this.debug("shouldBuildNaiveRecycler", should, {
      turn,
      myGrassCreated: this.myGrassCreated,
      opponentGrassCreated: this.opponentGrassCreated,
      hasBuildLastRound: this.hasBuildLastRound,
      notGrassBlocks: notGrassBlocks.length,
      opponentRecyclers: opponentRecyclers.length,
      myRecyclers: myRecyclers.length,
      myRobots: myRobots.length,
      opponentRobots: opponentRobots.length,
      myMatter,
    });
    return should;
  }

  buildWinRecycler() {
    const myBlockBorders = myBlocks.filter(
      (block) =>
        block.canBuild &&
        block.neighbors.find((neighbor) => neighbor.owner === 0 /* OPPONENT */)
    );
    if (myBlockBorders.length * 10 > myMatter && myBlockBorders.length > 3) {
      this.debug("We don't have enough matters to build win recyclers");
      return [];
    }
    const copyMap = Block.createCopyOfMap(map);
    for (const block of myBlockBorders) {
      copyMap[block.y][block.x].recycler = true;
    }
    const flapMap = copyMap.flat();
    flapMap.forEach((block) => block.updateNeighbors(copyMap));
    const newIslands = Island.findIslands(copyMap);
    let myScore = 0;
    let opponentScore = 0;
    for (const island of newIslands) {
      if (island.owner === -2 /* BOTH */) {
        this.debug(
          "An island is contested. Then no win recycler is possible",
          myBlockBorders.map((block) => [block.x, block.y])
        );
        return [];
      }
      if (island.owner === 1 /* ME */) {
        for (const block of island.blocks) {
          if (block.scrapAmount > 0 && block.willBecomeGrass === Infinity)
            myScore += 1;
        }
      }
      if (island.owner === 0 /* OPPONENT */) {
        for (const block of island.blocks) {
          if (block.scrapAmount > 0 && block.willBecomeGrass === Infinity)
            opponentScore += 1;
        }
      }
    }
    if (myScore >= opponentScore) {
      this.debug(
        "A win recycler has been found",
        myBlockBorders.map((block) => [block.x, block.y]),
        myScore,
        opponentScore,
        newIslands.map((island) => ({
          owner: island.owner,
          origin: [island.blocks[0].x, island.blocks[0].y],
          size: island.size,
          blocks: island.blocks.map((block) => `${block.x},${block.y}`),
        }))
      );
      if (myBlockBorders.length * 10 > myMatter) {
        this.debug("We don't have enough matters to build win recyclers");
        return [];
      }
      this.hasBuildLastRound = true;
      return myBlockBorders.map((block) => new BuildAction(block));
    }
    this.debug(
      "A lose recycler has been found. So we won't build it",
      myScore,
      opponentScore,
      myBlockBorders.map((block) => [block.x, block.y])
    );
    return [];
  }

  buildNaiveRecycler() {
    const actions = [];
    const possibleBlocksOnMySide = myBlocks.filter((block) => {
      let _a;
      return (
        block.canBuild &&
        block.initialOwner === 1 /* ME */ &&
        (turn < 5 ||
          this.myGrassCreated + block.computeGains().grassCreated + 1 <
            this.opponentGrassCreated) &&
        block.computeGains().gains > 20 &&
        block.computeGains().gainsPerTurn >= 3 &&
        (((_a = block.island) == null ? void 0 : _a.owner) !== 1 /* ME */ ||
          ia.turnsWithSameScore > 10)
      );
    });
    const possibleBlocksOnOpponentSide = myBlocks.filter(
      (block) =>
        block.canBuild &&
        [-2 /* BOTH */, 0 /* OPPONENT */].includes(block.initialOwner)
    );
    const possibleRecyclers = [
      ...possibleBlocksOnMySide,
      ...possibleBlocksOnOpponentSide,
    ];
    const bestRecyclers = new import_ts_heapq2.Heapq([], (a, b) => {
      const { gainsPerGrassCreated: gainsPerGrassCreatedA } = a.computeGains();
      const { gainsPerGrassCreated: gainsPerGrassCreatedB } = b.computeGains();
      return gainsPerGrassCreatedB < gainsPerGrassCreatedA;
    });
    for (const recycler of possibleRecyclers) {
      bestRecyclers.push(recycler);
    }
    this.debug(
      "BestRecyclers found",
      bestRecyclers.heap.map((block) => [block.x, block.y])
    );
    while (bestRecyclers.length()) {
      const recycler = bestRecyclers.pop();
      if (!this.willCreateNewIsland(recycler)) {
        this.hasBuildLastRound = true;
        ia.turnsWithSameScore = 0;
        actions.push(new BuildAction(recycler));
        break;
      }
    }
    debug("buildNaiveRecycler: ", actions.length);
    return actions;
  }

  action() {
    this.findBestRecyclers(map);
    const start = new Date();
    if (this.shouldBuildNaiveRecycler()) {
      const actions = this.buildNaiveRecycler();
      const end2 = new Date().getTime() - start.getTime();
      if (debugTime) this.debug(`action time: ${end2} ms`);
      return actions;
    }
    this.hasBuildLastRound = false;
    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`action time: ${end} ms`);
    return [];
  }
};
var recyclerBuilder = new RecyclerBuilder();

// src/ExpansionManager.ts
const ExpansionManager = class extends ClassLogger {
  constructor() {
    super(...arguments);
    this.separation = [];
    this.djikstraMap = /* @__PURE__ */ new Map();
    this.mapOwner = [];
    this.isExpansionDone = false;
  }

  computeSeparation() {
    if (this.separation.length) return;
    const start = new Date();
    this.mapOwner = new Array(map.length).fill(null).map(() =>
      new Array(map[0].length).fill({
        value: Infinity,
        owner: -1 /* NONE */,
      })
    );
    const startingBlocks = [
      [myStartPosition.y, myStartPosition.x],
      [opponentStartPosition.y, opponentStartPosition.x],
    ];
    this.mapOwner[myStartPosition.y][myStartPosition.x] = {
      value: 0,
      owner: 1 /* ME */,
    };
    this.mapOwner[opponentStartPosition.y][opponentStartPosition.x] = {
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
              const oldValue = this.mapOwner[xToUpdate][yToUpdate].value;
              const newValue = 1 + this.mapOwner[x][y].value;
              if (newValue < oldValue) {
                this.mapOwner[xToUpdate][yToUpdate] = {
                  value: newValue,
                  owner: this.mapOwner[x][y].owner,
                };
                nextBlocks.push([xToUpdate, yToUpdate, newValue]);
                visited[xToUpdate][yToUpdate] = 1;
              }
            } else if (
              1 + this.mapOwner[x][y].value ===
                this.mapOwner[xToUpdate][yToUpdate].value &&
              this.mapOwner[xToUpdate][yToUpdate].owner !==
                this.mapOwner[x][y].owner &&
              this.mapOwner[x][y].owner !== -2 /* BOTH */
            ) {
              this.mapOwner[xToUpdate][yToUpdate].owner = -2 /* BOTH */;
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
    for (let i = 0; i < this.mapOwner.length; i++) {
      for (let j = 0; j < this.mapOwner[i].length; j++) {
        const distance = this.mapOwner[i][j];
        if (distance.owner === -2 /* BOTH */) {
          bothOwnerBlocks.push(map[i][j]);
        }
        if (distance.value === Infinity) continue;
        const { neighbors } = map[i][j];
        for (const neighbor of neighbors) {
          if (
            this.mapOwner[i][j].owner === 1 /* ME */ &&
            this.mapOwner[neighbor.y][neighbor.x].owner === 0 /* OPPONENT */
          )
            wall.push(map[i][j]);
        }
      }
    }
    this.separation.splice(0);
    if (bothOwnerBlocks.length) this.separation.push(...bothOwnerBlocks);
    else this.separation.push(...wall);
    const separationMap = /* @__PURE__ */ new Map();
    for (const block of this.separation) {
      separationMap.set(`${block.x},${block.y}`, block);
    }
    this.separation.splice(0);
    this.separation.push(
      ...Array.from(separationMap.values()).filter(
        (block) => block.neighbors.length > 1
      )
    );
    this.debug(
      "Separation",
      this.separation.map((block) => [
        block.x,
        block.y,
        this.mapOwner[block.y][block.x],
      ])
    );
    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug("computeSeparation time: %dms", end);
  }

  computeDjikstraMap() {
    if (this.djikstraMap.size) return;
    for (const block of this.separation) {
      const djikstra = dijtstraAlgorithm(map, [[block.y, block.x]], Infinity);
      this.djikstraMap.set(block, djikstra);
    }
  }

  getDistanceFromBlockToSeparation(block, separation) {
    return this.djikstraMap.get(separation)[block.y][block.x];
  }

  moveAndBuildToSeparation() {
    const start = new Date();
    const actions = [];
    const remainingSeparation = this.separation.filter((block) => {
      let _a;
      return (
        block.owner === -1 /* NONE */ &&
        block.canMove &&
        block.units === 0 &&
        ((_a = block.island) == null ? void 0 : _a.owner) === -2 /* BOTH */
      );
    });
    this.debug(
      "RemainingSeparation",
      remainingSeparation.map((block) => [block.x, block.y])
    );
    if (
      this.isExpansionDone ||
      !remainingSeparation.length ||
      myRobots.length < 4
    ) {
      this.isExpansionDone = true;
      return actions;
    }
    actions.push(
      ...this.moveToSeparationV2(remainingSeparation),
      ...this.buildToSeparation(remainingSeparation)
    );
    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`moveAndBuildToSeparation time: ${end}ms`);
    return actions;
  }

  buildToSeparation(remainingSeparation) {
    const start = new Date();
    const actions = [];
    this.debug(
      "RemainingSeparationAfterMove",
      remainingSeparation.map((block) => [block.x, block.y])
    );
    const minMatters = recyclerBuilder.hasBuildLastRound ? 10 : 20;
    if (remainingSeparation.length) {
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
      while (remainingSeparation.length && myMatter >= minMatters) {
        let bestDestination = remainingSeparation[0];
        let bestDestinationIndex = 0;
        let minDistance = Infinity;
        let bestBlockToSpawn = myBlocks[0];
        for (const [
          indexDestination,
          destination,
        ] of remainingSeparation.entries()) {
          for (const block of blocksToSpawn) {
            const distance = this.getDistanceFromBlockToSeparation(
              block,
              destination
            );
            if (distance < minDistance) {
              minDistance = distance;
              bestDestination = destination;
              bestDestinationIndex = indexDestination;
              bestBlockToSpawn = block;
            }
            if (
              distance === minDistance &&
              side * (block.x - bestBlockToSpawn.x) < 0
            ) {
              minDistance = distance;
              bestDestination = destination;
              bestDestinationIndex = indexDestination;
              bestBlockToSpawn = block;
            }
          }
        }
        this.debug(
          `BestBlock to spawn ${bestBlockToSpawn.x},${bestBlockToSpawn.y} go to ${bestDestination.x},${bestDestination.y} at ${minDistance} blocks`
        );
        remainingSeparation.splice(bestDestinationIndex, 1);
        actions.push(new SpawnAction(1, bestBlockToSpawn));
      }
    }
    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`buildToSeparation time: ${end}ms`);
    return actions;
  }

  moveToSeparationV2(remainingSeparation) {
    const start = new Date();
    const actions = [];
    const robots = myBlocks
      .filter(
        (block) =>
          block.units > 0 &&
          block.hasMoved < block.units &&
          block.distanceToSeparation > 0
      )
      .flatMap((robot) => robot.getOneRobotPerUnit())
      .filter((robot) => {
        const { nearestOpponentDistance } = robot.findNearestOpponent();
        const { distanceToSeparation } = robot;
        return distanceToSeparation < nearestOpponentDistance;
      });
    this.debug(
      "AvailableRobots",
      robots.map((robot) => [robot.x, robot.y])
    );
    if (!remainingSeparation.length || !robots.length) {
      return actions;
    }
    const distanceFromSeparationToRobot = [];
    for (const [indexSeparation, separation] of remainingSeparation.entries()) {
      const row = [];
      for (const robot of robots) {
        const distance = this.getDistanceFromBlockToSeparation(
          robot,
          separation
        );
        const neighborsNone = robot.neighbors.filter(
          (block) =>
            block.owner === -1 /* NONE */ &&
            this.getDistanceFromBlockToSeparation(block, separation) ===
              distance - 1
        );
        const neighborsMe = robot.neighbors.filter(
          (block) =>
            block.owner === 1 /* ME */ &&
            this.getDistanceFromBlockToSeparation(block, separation) ===
              distance - 1
        );
        if (!neighborsNone.length && neighborsMe.length) row.push(distance + 1);
        else if (
          indexSeparation === 0 ||
          indexSeparation === remainingSeparation.length - 1
        )
          row.push(distance - 1.1);
        else if (robot.distanceToSeparation === distance)
          row.push(distance - 0.1);
        else row.push(distance);
      }
      distanceFromSeparationToRobot.push(row);
    }
    this.debug("distanceFromSeparationToRobot", distanceFromSeparationToRobot);
    const bestRobotsForDestination = (0, import_munkres_js.default)(
      distanceFromSeparationToRobot
    );
    this.debug("bestRobotsForDestination", bestRobotsForDestination);
    const originalDestination = remainingSeparation.slice(0);
    for (let i = 0; i < bestRobotsForDestination.length; i++) {
      const [destinationIndex, robotIndex] = bestRobotsForDestination[i];
      const destination = originalDestination[destinationIndex];
      const indexToDelete = remainingSeparation.findIndex((block) =>
        block.equals(destination)
      );
      remainingSeparation.splice(indexToDelete, 1);
      const robot = robots[robotIndex];
      const distance =
        distanceFromSeparationToRobot[destinationIndex][robotIndex];
      const { nearestOpponentDistance } = robot.findNearestOpponent();
      if (nearestOpponentDistance + 2 < distance) {
        this.debug(
          `Robot ${robot.x},${robot.y} wont go to ${destination.x},${destination.y} with a distance of ${distance} because it higher than ${nearestOpponentDistance} + 2`
        );
      } else {
        this.debug(
          `Robot ${robot.x},${robot.y} should go to ${destination.x},${destination.y} with a distance of ${distance}`
        );
        actions.push(new MoveAction(1, robot, destination));
      }
    }
    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`moveToSeparationV2 time: ${end}ms`);
    return actions;
  }

  moveToSeparation(remainingSeparation) {
    const start = new Date();
    const actions = [];
    const robots = myBlocks
      .filter((block) => block.units > 0 && block.hasMoved < block.units)
      .flatMap((robot) => robot.getOneRobotPerUnit());
    const maxDistanceFromStartToSeparation = maxBy(this.separation, (block) =>
      myStartPosition.distanceToBlock(block)
    ).maxValue;
    const manhattanDistanceToMyStart = /* @__PURE__ */ new Map();
    for (const destination of remainingSeparation) {
      manhattanDistanceToMyStart.set(
        destination,
        computeManhattanDistance(destination, myStartPosition)
      );
    }
    const minDistanceToMyBlocksMap = /* @__PURE__ */ new Map();
    const myBlockBorders = myBlocks.filter((block) =>
      block.neighbors.find((neighbor) => neighbor.owner === -1 /* NONE */)
    );
    for (const separation of remainingSeparation) {
      const min = minBy(myBlockBorders, (block) =>
        this.getDistanceFromBlockToSeparation(block, separation)
      ).value;
      minDistanceToMyBlocksMap.set(separation, min);
    }
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
        for (const [indexRobot, robot] of robots.entries()) {
          const distance = this.getDistanceFromBlockToSeparation(
            robot,
            destination
          );
          if (
            distance < minDistance ||
            (distance === minDistance &&
              manhattanDistanceToMyStart.get(bestDestination) <
                manhattanDistanceToMyStart.get(destination))
          ) {
            minDistance = distance;
            bestDestination = destination;
            bestDestinationIndex = indexDestination;
            bestRobotIndex = indexRobot;
            bestRobot = robot;
          }
        }
      }
      robots.splice(bestRobotIndex, 1);
      if (minDistance - 5 > maxDistanceFromStartToSeparation - turn) {
        this.debug(
          `BestRobot ${bestRobot.x},${bestRobot.y} should go to ${bestDestination.x},${bestDestination.y} at ${minDistance} blocks but it is higher than ${maxDistanceFromStartToSeparation} - ${turn} + 5 so we prefer to find an other robot.`
        );
        continue;
      }
      const minDistanceToMyBlocks =
        minDistanceToMyBlocksMap.get(bestDestination);
      if (minDistance > minDistanceToMyBlocks + 2) {
        this.debug(
          `BestRobot ${bestRobot.x},${bestRobot.y} should go to ${bestDestination.x},${bestDestination.y} at ${minDistance} blocks but it is higher than ${minDistanceToMyBlocks} so we prefer to find an other robot.`
        );
        continue;
      }
      this.debug(
        `BestRobot ${bestRobot.x},${bestRobot.y} go to ${bestDestination.x},${bestDestination.y} at ${minDistance} blocks`
      );
      remainingSeparation.splice(bestDestinationIndex, 1);
      actions.push(new MoveAction(1, bestRobot, bestDestination));
    }
    const end = new Date().getTime() - start.getTime();
    if (debugTime) this.debug(`moveToSeparation time: ${end}ms`);
    return actions;
  }
};
var expensionManager = new ExpansionManager();

// src/main.ts
readMapInput();
while (true) {
  readInputs();
  const start = new Date();
  refresh();
  expensionManager.computeSeparation();
  expensionManager.computeDjikstraMap();
  ia.chooseAction();
  ia.endTurn();
  const end = new Date().getTime() - start.getTime();
  if (debugTime) {
    debug(`Execution time: ${end}ms`);
  }
  debug(`############# End of Turn #############`);
}
