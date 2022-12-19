// src/helpers.ts
const debug = (...data) => {
  console.error(...data);
};
const computeManhattanDistance = (blockA, blockB) =>
  Math.abs(blockA.position.x - blockB.position.x) +
  Math.abs(blockA.position.y - blockB.position.y);

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

// node_modules/@mathigon/core/dist/index.esm.js
function uid(n = 10) {
  return Math.random().toString(36).substr(2, n);
}
function repeat(value, n) {
  return new Array(n).fill(value);
}
function repeat2D(value, x, y) {
  const result = [];
  for (let i = 0; i < x; ++i) {
    result.push(repeat(value, y));
  }
  return result;
}
function tabulate2D(fn, x, y) {
  const result = [];
  for (let i = 0; i < x; ++i) {
    const row = [];
    for (let j = 0; j < y; ++j) {
      row.push(fn(i, j));
    }
    result.push(row);
  }
  return result;
}
function list(a, b, step = 1) {
  const arr = [];
  if (b === void 0 && a >= 0) {
    for (let i = 0; i < a; i += step) arr.push(i);
  } else if (b === void 0) {
    for (let i = 0; i > a; i -= step) arr.push(i);
  } else if (a <= b) {
    for (let i = a; i <= b; i += step) arr.push(i);
  } else {
    for (let i = a; i >= b; i -= step) arr.push(i);
  }
  return arr;
}
function total(array) {
  return array.reduce((t, v) => t + v, 0);
}
var Itarray = class {
  constructor(...values) {
    this.values = values;
  }

  map(fn) {
    const { values } = this;
    return new Itarray(
      (function* () {
        let i = 0;
        for (const row of values) {
          for (const v of row) {
            yield fn(v, i);
            i += 1;
          }
        }
      })()
    );
  }

  every(fn) {
    let i = 0;
    for (const row of this.values) {
      for (const v of row) {
        if (!fn(v, i)) return false;
        i += 1;
      }
    }
    return true;
  }

  some(fn) {
    let i = 0;
    for (const row of this.values) {
      for (const v of row) {
        if (fn(v, i)) return true;
        i += 1;
      }
    }
    return false;
  }

  slice(from, to) {
    const { values } = this;
    return new Itarray(
      (function* () {
        let i = 0;
        for (const row of values) {
          for (const v of row) {
            if (i < from || (to !== void 0 && i > from + to)) continue;
            yield v;
            i += 1;
          }
        }
      })()
    );
  }

  filter(fn) {
    const { values } = this;
    return new Itarray(
      (function* () {
        let i = 0;
        for (const row of values) {
          for (const v of row) {
            if (fn(v, i)) yield v;
            i += 1;
          }
        }
      })()
    );
  }

  concat(newValues) {
    this.values.push(newValues);
  }

  [Symbol.iterator]() {
    const { values } = this;
    return (function* () {
      for (const row of values) {
        for (const v of row) {
          yield v;
        }
      }
    })();
  }

  static make(fn, max) {
    return new Itarray(
      (function* () {
        let i = 0;
        while (max === void 0 || i < max) {
          yield fn(i);
          i += 1;
        }
      })()
    );
  }
};

// node_modules/@mathigon/fermat/dist/index.esm.js
const __defProp = Object.defineProperty;
const __export = (target, all) => {
  for (const name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
const PRECISION = 1e-6;
function nearlyEquals(a, b, t = PRECISION) {
  if (isNaN(a) || isNaN(b)) return false;
  return Math.abs(a - b) < t;
}
function roundTo(n, increment = 1) {
  return Math.round(n / increment) * increment;
}
function clamp(x, min = -Infinity, max = Infinity) {
  return Math.min(max, Math.max(min, x));
}
function lerp(a, b, t = 0.5) {
  return a + (b - a) * t;
}
function square(x) {
  return x * x;
}
function mod(a, m) {
  return ((a % m) + m) % m;
}
const matrix_exports = {};
__export(matrix_exports, {
  determinant: () => determinant,
  fill: () => fill,
  identity: () => identity,
  inverse: () => inverse,
  product: () => product,
  reflection: () => reflection,
  rotation: () => rotation,
  scalarProduct: () => scalarProduct,
  shear: () => shear,
  sum: () => sum,
  transpose: () => transpose,
});
function fill(value, x, y) {
  return repeat2D(value, x, y);
}
function identity(n = 2) {
  const x = fill(0, n, n);
  for (let i = 0; i < n; ++i) x[i][i] = 1;
  return x;
}
function rotation(angle) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  return [
    [cos, -sin],
    [sin, cos],
  ];
}
function shear(lambda) {
  return [
    [1, lambda],
    [0, 1],
  ];
}
function reflection(angle) {
  const sin = Math.sin(2 * angle);
  const cos = Math.cos(2 * angle);
  return [
    [cos, sin],
    [sin, -cos],
  ];
}
function sum(...matrices) {
  const [M1, ...rest] = matrices;
  const M2 = rest.length > 1 ? sum(...rest) : rest[0];
  if (M1.length !== M2.length || M1[0].length !== M2[0].length) {
    throw new Error("Matrix sizes don\u2019t match");
  }
  const S = [];
  for (let i = 0; i < M1.length; ++i) {
    const row = [];
    for (let j = 0; j < M1[i].length; ++j) {
      row.push(M1[i][j] + M2[i][j]);
    }
    S.push(row);
  }
  return S;
}
function scalarProduct(M, v) {
  return M.map((row) => row.map((x) => x * v));
}
function product(...matrices) {
  const [M1, ...rest] = matrices;
  const M2 = rest.length > 1 ? product(...rest) : rest[0];
  if (M1[0].length !== M2.length) {
    throw new Error("Matrix sizes don\u2019t match.");
  }
  const P2 = [];
  for (let i = 0; i < M1.length; ++i) {
    const row = [];
    for (let j = 0; j < M2[0].length; ++j) {
      let value = 0;
      for (let k = 0; k < M2.length; ++k) {
        value += M1[i][k] * M2[k][j];
      }
      row.push(value);
    }
    P2.push(row);
  }
  return P2;
}
function transpose(M) {
  const T = [];
  for (let j = 0; j < M[0].length; ++j) {
    const row = [];
    for (let i = 0; i < M.length; ++i) {
      row.push(M[i][j]);
    }
    T.push(row);
  }
  return T;
}
function determinant(M) {
  if (M.length !== M[0].length) throw new Error("Not a square matrix.");
  const n = M.length;
  if (n === 1) return M[0][0];
  if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
  let det = 0;
  for (let j = 0; j < n; ++j) {
    let diagLeft = M[0][j];
    let diagRight = M[0][j];
    for (let i = 1; i < n; ++i) {
      diagRight *= M[i][(j + i) % n];
      diagLeft *= M[i][(j - i + n) % n];
    }
    det += diagRight - diagLeft;
  }
  return det;
}
function inverse(M) {
  const n = M.length;
  if (n !== M[0].length) throw new Error("Not a square matrix.");
  const I = identity(n);
  const C = tabulate2D((x, y) => M[x][y], n, n);
  for (let i = 0; i < n; ++i) {
    let e = C[i][i];
    if (nearlyEquals(e, 0)) {
      for (let ii = i + 1; ii < n; ++ii) {
        if (C[ii][i] !== 0) {
          for (let j = 0; j < n; ++j) {
            [C[ii][j], C[i][j]] = [C[i][j], C[ii][j]];
            [I[ii][j], I[i][j]] = [I[i][j], I[ii][j]];
          }
          break;
        }
      }
      e = C[i][i];
      if (nearlyEquals(e, 0)) throw new Error("Matrix not invertible.");
    }
    for (let j = 0; j < n; ++j) {
      C[i][j] = C[i][j] / e;
      I[i][j] = I[i][j] / e;
    }
    for (let ii = 0; ii < n; ++ii) {
      if (ii === i) continue;
      const f = C[ii][i];
      for (let j = 0; j < n; ++j) {
        C[ii][j] -= f * C[i][j];
        I[ii][j] -= f * I[i][j];
      }
    }
  }
  return I;
}
const random_exports = {};
__export(random_exports, {
  bernoulli: () => bernoulli,
  binomial: () => binomial2,
  cauchy: () => cauchy,
  chiCDF: () => chiCDF,
  exponential: () => exponential,
  find: () => find,
  geometric: () => geometric,
  integer: () => integer,
  integrate: () => integrate,
  normal: () => normal,
  normalPDF: () => normalPDF,
  poisson: () => poisson,
  shuffle: () => shuffle,
  smart: () => smart,
  uniform: () => uniform,
  weighted: () => weighted,
});
function shuffle(a) {
  a = a.slice(0);
  for (let i = a.length - 1; i > 0; --i) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function integer(a, b) {
  const start = b === void 0 ? 0 : a;
  const length = b === void 0 ? a : b - a + 1;
  return start + Math.floor(length * Math.random());
}
function weighted(weights) {
  const x = Math.random() * total(weights);
  let cum = 0;
  return weights.findIndex((w) => (cum += w) >= x);
}
function find(items) {
  return items[Math.floor(items.length * Math.random())];
}
const SMART_RANDOM_CACHE = /* @__PURE__ */ new Map();
function smart(n, id) {
  if (!id) id = uid();
  if (!SMART_RANDOM_CACHE.has(id)) SMART_RANDOM_CACHE.set(id, repeat(1, n));
  const cache = SMART_RANDOM_CACHE.get(id);
  const x = weighted(cache.map((x2) => x2 * x2));
  cache[x] -= 1;
  if (cache[x] <= 0)
    SMART_RANDOM_CACHE.set(
      id,
      cache.map((x2) => x2 + 1)
    );
  return x;
}
function bernoulli(p = 0.5) {
  return Math.random() < p ? 1 : 0;
}
function binomial2(n = 1, p = 0.5) {
  let t = 0;
  for (let i = 0; i < n; ++i) t += bernoulli(p);
  return t;
}
function poisson(l = 1) {
  if (l <= 0) return 0;
  const L = Math.exp(-l);
  let p = 1;
  let k = 0;
  for (; p > L; ++k) p *= Math.random();
  return k - 1;
}
function uniform(a = 0, b = 1) {
  return a + (b - a) * Math.random();
}
function normal(m = 0, v = 1) {
  const u1 = Math.random();
  const u2 = Math.random();
  const rand = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return rand * Math.sqrt(v) + m;
}
function exponential(l = 1) {
  return l <= 0 ? 0 : -Math.log(Math.random()) / l;
}
function geometric(p = 0.5) {
  if (p <= 0 || p > 1) return void 0;
  return Math.floor(Math.log(Math.random()) / Math.log(1 - p));
}
function cauchy() {
  let rr;
  let v1;
  let v2;
  do {
    v1 = 2 * Math.random() - 1;
    v2 = 2 * Math.random() - 1;
    rr = v1 * v1 + v2 * v2;
  } while (rr >= 1);
  return v1 / v2;
}
function normalPDF(x, m = 1, v = 0) {
  return Math.exp(-((x - m) ** 2) / (2 * v)) / Math.sqrt(2 * Math.PI * v);
}
const G = 7;
const P = [
  0.9999999999998099, 676.5203681218851, -1259.1392167224028, 771.3234287776531,
  -176.6150291621406, 12.507343278686905, -0.13857109526572012,
  9984369578019572e-21, 15056327351493116e-23,
];
function gamma(z) {
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  z -= 1;
  let x = P[0];
  for (let i = 1; i < G + 2; i++) x += P[i] / (z + i);
  const t = z + G + 0.5;
  return Math.sqrt(2 * Math.PI) * t ** (z + 0.5) * Math.exp(-t) * x;
}
function integrate(fn, xMin, xMax, dx = 1) {
  let result = 0;
  for (let x = xMin; x < xMax; x += dx) {
    result += fn(x) * dx || 0;
  }
  return result;
}
function chiCDF(chi, deg) {
  const int = integrate((t) => t ** ((deg - 2) / 2) * Math.exp(-t / 2), 0, chi);
  return 1 - int / 2 ** (deg / 2) / gamma(deg / 2);
}
const regression_exports = {};
__export(regression_exports, {
  bestPolynomial: () => bestPolynomial,
  coefficient: () => coefficient,
  exponential: () => exponential2,
  linear: () => linear,
  logarithmic: () => logarithmic,
  polynomial: () => polynomial2,
  power: () => power,
});
function evaluatePolynomial(regression, x) {
  let xs = 1;
  let t = regression[0];
  for (let i = 1; i < regression.length; ++i) {
    xs *= x;
    t += xs * regression[i];
  }
  return t;
}
function linear(data, throughOrigin = false) {
  let sX = 0;
  let sY = 0;
  let sXX = 0;
  let sXY = 0;
  const len = data.length;
  for (let n = 0; n < len; n++) {
    sX += data[n][0];
    sY += data[n][1];
    sXX += data[n][0] * data[n][0];
    sXY += data[n][0] * data[n][1];
  }
  if (throughOrigin) {
    const gradient2 = sXY / sXX;
    return [0, gradient2];
  }
  const gradient = (len * sXY - sX * sY) / (len * sXX - sX * sX);
  const intercept = sY / len - (gradient * sX) / len;
  return [intercept, gradient];
}
function exponential2(data) {
  const sum2 = [0, 0, 0, 0, 0, 0];
  for (const d of data) {
    sum2[0] += d[0];
    sum2[1] += d[1];
    sum2[2] += d[0] * d[0] * d[1];
    sum2[3] += d[1] * Math.log(d[1]);
    sum2[4] += d[0] * d[1] * Math.log(d[1]);
    sum2[5] += d[0] * d[1];
  }
  const denominator = sum2[1] * sum2[2] - sum2[5] * sum2[5];
  const a = Math.exp((sum2[2] * sum2[3] - sum2[5] * sum2[4]) / denominator);
  const b = (sum2[1] * sum2[4] - sum2[5] * sum2[3]) / denominator;
  return [a, b];
}
function logarithmic(data) {
  const sum2 = [0, 0, 0, 0];
  const len = data.length;
  for (const d of data) {
    sum2[0] += Math.log(d[0]);
    sum2[1] += d[1] * Math.log(d[0]);
    sum2[2] += d[1];
    sum2[3] += Math.log(d[0]) ** 2;
  }
  const b =
    (len * sum2[1] - sum2[2] * sum2[0]) / (len * sum2[3] - sum2[0] * sum2[0]);
  const a = (sum2[2] - b * sum2[0]) / len;
  return [a, b];
}
function power(data) {
  const sum2 = [0, 0, 0, 0];
  const len = data.length;
  for (const d of data) {
    sum2[0] += Math.log(d[0]);
    sum2[1] += Math.log(d[1]) * Math.log(d[0]);
    sum2[2] += Math.log(d[1]);
    sum2[3] += Math.log(d[0]) ** 2;
  }
  const b =
    (len * sum2[1] - sum2[2] * sum2[0]) / (len * sum2[3] - sum2[0] * sum2[0]);
  const a = Math.exp((sum2[2] - b * sum2[0]) / len);
  return [a, b];
}
function polynomial2(data, order = 2) {
  const X = data.map((d) => list(order + 1).map((p) => d[0] ** p));
  const XT = transpose(X);
  const y = data.map((d) => [d[1]]);
  const XTX = product(XT, X);
  const inv = inverse(XTX);
  const r = product(inv, XT, y);
  return r.map((x) => x[0]);
}
function coefficient(data, fn) {
  const total4 = data.reduce((sum2, d) => sum2 + d[1], 0);
  const mean2 = total4 / data.length;
  const ssyy = data.reduce((sum2, d) => sum2 + (d[1] - mean2) ** 2, 0);
  const sse = data.reduce((sum2, d) => sum2 + (d[1] - fn(d[0])) ** 2, 0);
  return 1 - sse / ssyy;
}
function bestPolynomial(data, threshold = 0.85, maxOrder = 8) {
  if (data.length <= 1) return void 0;
  for (let i = 1; i < maxOrder; ++i) {
    const reg = polynomial2(data, i);
    const fn = (x) => evaluatePolynomial(reg, x);
    const coeff = coefficient(data, fn);
    if (coeff >= threshold) return { order: i, coefficients: reg, fn };
  }
  return void 0;
}

// node_modules/@mathigon/euclid/dist/index.esm.js
const TWO_PI = 2 * Math.PI;
function rad(p, c) {
  const a = Math.atan2(p.y - (c ? c.y : 0), p.x - (c ? c.x : 0));
  return mod(a, TWO_PI);
}
var Point = class {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.type = "point";
  }

  get unitVector() {
    if (nearlyEquals(this.length, 0)) return new Point(1, 0);
    return this.scale(1 / this.length);
  }

  get length() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  get inverse() {
    return new Point(-this.x, -this.y);
  }

  get flip() {
    return new Point(this.y, this.x);
  }

  get perpendicular() {
    return new Point(-this.y, this.x);
  }

  get array() {
    return [this.x, this.y];
  }

  distanceFromLine(l) {
    return Point.distance(this, l.project(this));
  }

  clamp(bounds, padding = 0) {
    const x = clamp(this.x, bounds.xMin + padding, bounds.xMax - padding);
    const y = clamp(this.y, bounds.yMin + padding, bounds.yMax - padding);
    return new Point(x, y);
  }

  changeCoordinates(originCoords, targetCoords) {
    const x =
      targetCoords.xMin +
      ((this.x - originCoords.xMin) / originCoords.dx) * targetCoords.dx;
    const y =
      targetCoords.yMin +
      ((this.y - originCoords.yMin) / originCoords.dy) * targetCoords.dy;
    return new Point(x, y);
  }

  add(p) {
    return Point.sum(this, p);
  }

  subtract(p) {
    return Point.difference(this, p);
  }

  round(inc = 1) {
    return new Point(roundTo(this.x, inc), roundTo(this.y, inc));
  }

  floor() {
    return new Point(Math.floor(this.x), Math.floor(this.y));
  }

  mod(x, y = x) {
    return new Point(this.x % x, this.y % y);
  }

  angle(c = ORIGIN) {
    return rad(this, c);
  }

  snap(p, tolerance = 5) {
    if (nearlyEquals(this.x, p.x, tolerance)) return new Point(p.x, this.y);
    if (nearlyEquals(this.y, p.y, tolerance)) return new Point(this.x, p.y);
    return this;
  }

  static average(...points) {
    const x = total(points.map((p) => p.x)) / points.length;
    const y = total(points.map((p) => p.y)) / points.length;
    return new Point(x, y);
  }

  static dot(p1, p2) {
    return p1.x * p2.x + p1.y * p2.y;
  }

  static sum(p1, p2) {
    return new Point(p1.x + p2.x, p1.y + p2.y);
  }

  static difference(p1, p2) {
    return new Point(p1.x - p2.x, p1.y - p2.y);
  }

  static distance(p1, p2) {
    return Math.sqrt(square(p1.x - p2.x) + square(p1.y - p2.y));
  }

  static manhattan(p1, p2) {
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
  }

  static interpolate(p1, p2, t = 0.5) {
    return new Point(lerp(p1.x, p2.x, t), lerp(p1.y, p2.y, t));
  }

  static interpolateList(points, t = 0.5) {
    const n = points.length - 1;
    const a = Math.floor(clamp(t, 0, 1) * n);
    return Point.interpolate(points[a], points[a + 1], n * t - a);
  }

  static fromPolar(angle, r = 1) {
    return new Point(r * Math.cos(angle), r * Math.sin(angle));
  }

  static random(b) {
    const x = random_exports.uniform(b.xMin, b.xMax);
    const y = random_exports.uniform(b.yMin, b.yMax);
    return new Point(x, y);
  }

  static equals(p1, p2, precision) {
    return (
      nearlyEquals(p1.x, p2.x, precision) && nearlyEquals(p1.y, p2.y, precision)
    );
  }

  static colinear(p1, p2, p3, tolerance) {
    const dx1 = p1.x - p2.x;
    const dy1 = p1.y - p2.y;
    const dx2 = p2.x - p3.x;
    const dy2 = p2.y - p3.y;
    return nearlyEquals(dx1 * dy2, dx2 * dy1, tolerance);
  }

  transform(m) {
    const x = m[0][0] * this.x + m[0][1] * this.y + m[0][2];
    const y = m[1][0] * this.x + m[1][1] * this.y + m[1][2];
    return new Point(x, y);
  }

  rotate(angle, c = ORIGIN) {
    if (nearlyEquals(angle, 0)) return this;
    const x0 = this.x - c.x;
    const y0 = this.y - c.y;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = x0 * cos - y0 * sin + c.x;
    const y = x0 * sin + y0 * cos + c.y;
    return new Point(x, y);
  }

  reflect(l) {
    const v = l.p2.x - l.p1.x;
    const w = l.p2.y - l.p1.y;
    const x0 = this.x - l.p1.x;
    const y0 = this.y - l.p1.y;
    const mu = (v * y0 - w * x0) / (v * v + w * w);
    const x = this.x + 2 * mu * w;
    const y = this.y - 2 * mu * v;
    return new Point(x, y);
  }

  scale(sx, sy = sx) {
    return new Point(this.x * sx, this.y * sy);
  }

  shift(x, y = x) {
    return new Point(this.x + x, this.y + y);
  }

  translate(p) {
    return this.shift(p.x, p.y);
  }

  equals(other, precision) {
    return Point.equals(this, other, precision);
  }

  toString() {
    return `point(${this.x},${this.y})`;
  }
};
var ORIGIN = new Point(0, 0);
const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

// src/Block.ts
const Block = class {
  constructor(
    position,
    scrapAmount,
    owner,
    units,
    recycler,
    canBuild,
    canSpawn,
    inRangeOfRecycler
  ) {
    this.position = position;
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
    this.isGrassInXTurn = 0;
  }

  get canMove() {
    return !this.recycler && this.scrapAmount > 0;
  }

  get isGrass() {
    return this.scrapAmount === 0;
  }

  get willBecomeGrass() {
    let grassInXTurn = this.scrapAmount;
    let totalRecycler = 0;
    const { x, y } = this.position;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (x + j > 0 && y + i >= 0 && x + j < width && y + i < height) {
          const block = map[y + i][x + j];
          if (block.recycler) {
            grassInXTurn -= block.scrapAmount;
            totalRecycler += 1;
          }
        }
      }
    }
    return grassInXTurn > 0
      ? Infinity
      : Math.round(grassInXTurn / totalRecycler);
  }

  get isDangerousRobotOpponent() {
    if (this.owner !== 0 /* OPPONENT */ || this.units === 0) return false;
    const { x, y } = this.position;
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
    const { x, y } = this.position;
    if (x > 0 && map[y][x - 1].canMove) this.neighbors.push(map[y][x - 1]);
    if (x < map[0].length - 1 && map[y][x + 1].canMove)
      this.neighbors.push(map[y][x + 1]);
    if (y > 0 && map[y - 1][x].canMove) this.neighbors.push(map[y - 1][x]);
    if (y < map.length - 1 && map[y + 1][x].canMove)
      this.neighbors.push(map[y + 1][x]);
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
  }

  distanceToBlock(block) {
    const { x, y } = block.position;
    return this.djikstraMap[y][x];
  }
};

// src/djikstra.ts
const dijtstraAlgorithm = (map2, startX, startY) => {
  const distances = new Array(map2.length)
    .fill(Infinity)
    .map(() => new Array(map2[0].length).fill(Infinity));
  distances[startX][startY] = 0;
  const visited = new Array(map2.length)
    .fill(0)
    .map(() => new Array(map2[0].length).fill(0));
  const nextBlocks = [];
  let currentBlock = [startX, startY];
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
  return distances;
};

// src/Island.ts
var Island = class {
  constructor() {
    this.blocks = [];
  }

  get size() {
    return this.blocks.length;
  }

  get owner() {
    const hasMineBlock =
      this.blocks.findIndex((block) => block.owner === 1 /* ME */) >= 0;
    const hasOpponentBlock =
      this.blocks.findIndex((block) => block.owner === 0 /* OPPONENT */) >= 0;
    if (hasMineBlock && hasOpponentBlock) return -1 /* NONE */;
    if (hasMineBlock) return 1 /* ME */;
    if (hasOpponentBlock) return 0 /* OPPONENT */;
    return -1 /* NONE */;
  }

  static findIslands() {
    let blockWithoutIsland = blocks.find(
      (block) => !block.island && block.canMove
    );
    const islands2 = [];
    while (blockWithoutIsland) {
      const island = new Island();
      const nextBlocks = [blockWithoutIsland];
      while (nextBlocks.length) {
        const nextBlock = nextBlocks.pop();
        island.blocks.push(nextBlock);
        nextBlock.island = island;
        const neighbors = nextBlock.neighbors.filter(
          (neighbor) => !neighbor.island
        );
        if (neighbors.length) nextBlocks.push(...neighbors);
      }
      islands2.push(island);
      blockWithoutIsland = blocks.find(
        (block) => !block.island && block.canMove
      );
    }
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
var blocks = [];
let emptyBlocks = [];
let islands = [];
let myBlocks = [];
let notMyBlocks = [];
let opponentBlocks = [];
let myRobots = [];
let opponentRobots = [];
let dangerousOpponentRobots = [];
let myRecyclers = [];
let opponentRecyclers = [];
const getMap = () => {
  [width, height] = readline()
    .split(" ")
    .map((value) => Number.parseInt(value, 10));
  for (let i = 0; i < height; i++) {
    const blocks2 = [];
    for (let j = 0; j < width; j++) {
      blocks2.push(
        new Block(
          new Point(j, i),
          0,
          -1 /* NONE */,
          0,
          false,
          false,
          false,
          false
        )
      );
    }
    map.push(blocks2);
  }
};
const readInputs = () => {
  const readInputsStart = new Date();
  const matters = readline().split(" ");
  myMatter = parseInt(matters[0]);
  oppMatter = parseInt(matters[1]);
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const inputs = readline().split(" ");
      const scrapAmount = parseInt(inputs[0]);
      const owner = parseInt(inputs[1]);
      const units = parseInt(inputs[2]);
      const recycler = parseInt(inputs[3]) > 0;
      const canBuild = parseInt(inputs[4]) > 0;
      const canSpawn = parseInt(inputs[5]) > 0;
      const inRangeOfRecycler = parseInt(inputs[6]) > 0;
      map[i][j].update({
        scrapAmount,
        owner,
        units,
        recycler,
        canBuild,
        canSpawn,
        inRangeOfRecycler,
      });
    }
  }
  const endReadInputs = new Date().getTime() - readInputsStart.getTime();
  debug("ReadInputs time: %dms", endReadInputs);
};
const computeData = () => {
  const computeDataStart = new Date();
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
    if (block.owner === 1 /* ME */ && block.units) myRobots.push(block);
    if (block.owner === 0 /* OPPONENT */ && block.units)
      opponentRobots.push(block);
    if (block.owner === 1 /* ME */ && block.recycler) myRecyclers.push(block);
    if (block.owner === 0 /* OPPONENT */ && block.recycler)
      opponentRecyclers.push(block);
    if (block.isDangerousRobotOpponent) dangerousOpponentRobots.push(block);
  });
  if (side === 0 /* UNKNOWN */)
    side = myRobots[0].position.x < width / 2 ? 1 /* LEFT */ : -1 /* RIGHT */;
  const computeDataEnd = new Date().getTime() - computeDataStart.getTime();
  debug("computeData time: %dms", computeDataEnd);
};
const computeDjikstraMap = () => {
  const computeDjikstraMapStart = new Date();
  const usefullBlocks = blocks.filter(
    (block) => block.canMove && block.owner === 1 /* ME */
  );
  usefullBlocks.forEach((block) => {
    block.djikstraMap = dijtstraAlgorithm(
      map,
      block.position.y,
      block.position.x
    );
  });
  const computeDjikstraMapEnd =
    new Date().getTime() - computeDjikstraMapStart.getTime();
  debug("computeDjikstraMap time: %dms", computeDjikstraMapEnd);
};
const refresh = () => {
  turn += 1;
  readInputs();
  debug(`############# Turn ${turn} #############`);
  computeData();
  computeDjikstraMap();
  islands = Island.findIslands();
  debug(
    "dangerousOpponentRobots",
    dangerousOpponentRobots.map((robot) => robot.position)
  );
};

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

  computeTotalGain(block) {
    const nearCoordinates = [[-1, 0], [1, 0], [0, 1], [0 - 1]];
    const { scrapAmount } = block;
    let total2 = scrapAmount;
    for (const nearCoordinate of nearCoordinates) {
      const [x, y] = nearCoordinate;
      const nearBlockX = block.position.x + x;
      const nearBlockY = block.position.y + y;
      if (
        nearBlockX >= 0 &&
        nearBlockX < width &&
        nearBlockY >= 0 &&
        nearBlockY < height
      ) {
        const nearBlock = map[block.position.y + y][block.position.x + x];
        total2 +=
          nearBlock.scrapAmount > scrapAmount
            ? scrapAmount
            : nearBlock.scrapAmount;
      }
    }
    return total2;
  }

  action() {
    const actions = [];
    debug("RecyclerBuilder action");
    const possibleRecyclers = myBlocks.filter((block) => {
      let _a;
      return (
        block.canBuild &&
        !this.isNearOfARecycler(block) &&
        this.computeTotalGain(block) > 20 &&
        ((_a = block.island) == null ? void 0 : _a.owner) !== 1 /* ME */ &&
        !this.isAhead()
      );
    });
    if (possibleRecyclers.length) {
      const recycler = possibleRecyclers[0];
      actions.push(new BuildAction(recycler.position.x, recycler.position.y));
      myRecyclers.push(recycler);
      setMyMatter(myMatter - 10);
    }
    return actions;
  }
};
const recyclerBuilder = new RecyclerBuilder();

// src/RobotBuilder.ts
const RobotBuilder = class {
  computeNormalSpawn() {
    const blocksToSpawn = myBlocks.filter((block) => {
      let _a;
      return (
        block.canSpawn &&
        ((_a = block.island) == null ? void 0 : _a.owner) !== 1 /* ME */
      );
    });
    blocksToSpawn.sort((a, b) => {
      let minAToEmpty = Infinity;
      let minBToEmpty = Infinity;
      let nearestABlockOwner = -1; /* NONE */
      let nearestBBlockOwner = -1; /* NONE */
      let distanceToNearestOpponentA = Infinity;
      let distanceToNearestOpponentB = Infinity;
      for (const emptyBlock of notMyBlocks) {
        const distanceA = a.distanceToBlock(emptyBlock);
        const distanceB = b.distanceToBlock(emptyBlock);
        if (distanceA < minAToEmpty) {
          minAToEmpty = distanceA;
          nearestABlockOwner = emptyBlock.owner;
          const [nearestOpponentA] = opponentRobots.sort(
            (opponentA, opponentB) =>
              a.distanceToBlock(opponentA) - a.distanceToBlock(opponentB)
          );
          distanceToNearestOpponentA = nearestOpponentA
            ? a.distanceToBlock(nearestOpponentA)
            : Infinity;
        }
        if (distanceB < minBToEmpty) {
          minBToEmpty = distanceB;
          nearestBBlockOwner = emptyBlock.owner;
          const [nearestOpponentB] = opponentRobots.sort(
            (opponentA, opponentB) =>
              b.distanceToBlock(opponentA) - b.distanceToBlock(opponentB)
          );
          distanceToNearestOpponentB = nearestOpponentB
            ? b.distanceToBlock(nearestOpponentB)
            : Infinity;
        }
      }
      const interrestingANeighbors = a.neighbors.filter(
        (block) => block.owner !== 1 /* ME */
      ).length;
      const interrestingBNeighbors = b.neighbors.filter(
        (block) => block.owner !== 1 /* ME */
      ).length;
      if (minAToEmpty !== minBToEmpty) return minAToEmpty - minBToEmpty;
      if (nearestABlockOwner !== nearestBBlockOwner)
        return nearestBBlockOwner - nearestABlockOwner;
      if (distanceToNearestOpponentA !== distanceToNearestOpponentB)
        return distanceToNearestOpponentA - distanceToNearestOpponentB;
      if (interrestingANeighbors !== interrestingBNeighbors)
        return interrestingBNeighbors - interrestingANeighbors;
      return a.units - b.units;
    });
    return blocksToSpawn;
  }

  computeDefensiveSpawn() {
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
    debug("RobotBuilder action");
    const actions = [];
    const blocksToSpawn = !dangerousOpponentRobots.length
      ? this.computeNormalSpawn()
      : this.computeDefensiveSpawn();
    let blockToSpawnIndex = 0;
    let predictedMatter = myMatter;
    while (predictedMatter >= 10 && blockToSpawnIndex < blocksToSpawn.length) {
      const blockToSpawn = blocksToSpawn[blockToSpawnIndex];
      actions.push(
        new SpawnAction(1, blockToSpawn.position.x, blockToSpawn.position.y)
      );
      blockToSpawnIndex += 1;
      predictedMatter -= 10;
    }
    debug("RobotBuilder spawns", actions.length);
    return actions;
  }
};
const robotBuilder = new RobotBuilder();

// src/RobotManager.ts
const RobotManager = class {
  action() {
    debug("RobotManager action");
    const actions = [];
    const targets = [];
    for (const robot of myRobots) {
      const nearestEmptyBlocks = notMyBlocks
        .sort((a, b) => {
          const distanceA = robot.distanceToBlock(a);
          const distanceB = robot.distanceToBlock(b);
          if (distanceA === distanceB && a.owner === b.owner)
            return side * (b.position.x - a.position.x);
          if (distanceA === distanceB) return b.owner - a.owner;
          return distanceA - distanceB;
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
            target.position.equals(nearestEmptyBlocks[i].position) &&
            nearestEmptyBlocks[i].owner !== 0 /* OPPONENT */
        )
      ) {
        i += 1;
      }
      const nearestEmptyBlock =
        i < nearestEmptyBlocks.length
          ? nearestEmptyBlocks[i]
          : nearestEmptyBlocks[0];
      if (robot.distanceToBlock(nearestEmptyBlock) === 1)
        targets.push(nearestEmptyBlock);
      actions.push(
        new MoveAction(
          1,
          robot.position.x,
          robot.position.y,
          nearestEmptyBlock.position.x,
          nearestEmptyBlock.position.y
        )
      );
    }
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
};
const ia = new IA();

// src/main.ts
getMap();
while (true) {
  const start = new Date();
  refresh();
  ia.chooseAction();
  ia.endTurn();
  const end = new Date().getTime() - start.getTime();
  debug("Execution time: %dms", end);
  debug(`############# End of Turn #############`);
}
