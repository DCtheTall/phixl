/**
 * @fileoverview Math module contains utility methods.
 * 
 * All exported functions from this module should be pure functions.
 */

/**
 * Returns if a number is a power of two.
 */
export const isPowerOfTwo = (n: number): boolean => ((n & (n - 1)) === 0);

/**
 * A 3-dimensional vector type as a number array.
 */
export type Vector3 = [number, number, number];

/**
 * Checks if an object is a Vector3.
 */
export const isVector3 = (obj: unknown): obj is Vector3 =>
  Array.isArray(obj) && obj.length === 3 && obj.every(x => !isNaN(x));

/**
 * A 4-dimensional vector type as a number array.
 */
export type Vector4 = [number, number, number, number];

type Vector = Vector3 | Vector4;

const normalize = <V extends Vector>(v: V): V => {
  const len = Math.hypot(...v);
  if (!len) {
    throw new Error('Cannot normalize a vector with no length');
  }
  return v.map(x => x / len) as V;
};

/**
 * Add two vectors.
 */
export const add = <V extends Vector>(a: V, b: V): V =>
  a.map((cur, i) => cur + b[i]) as V;

const subtract = <V extends Vector>(a: V, b: V): V =>
  a.map((cur, i) => cur - b[i]) as V;

const dot = <V extends Vector>(a: V, b: V): number =>
  a.reduce((acc, cur, i) => acc + (cur * b[i]), 0);

const cross = (a: Vector3, b: Vector3): Vector3 => [
  (a[1] * b[2]) - (a[2] * b[1]),
  (a[2] * b[0]) - (a[0] * b[2]),
  (a[0] * b[1]) - (a[1] * b[0]),
];

type Matrix2 = [
  number, number,
  number, number,
];

/**
 * 3-dimensional matrix as a 9 element array.
 */
export type Matrix3 = [
  number, number, number,
  number, number, number,
  number, number, number,
];

/**
 * 4-dimensional matrix as a 16 element array.
 */
export type Matrix4 = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
];

/**
 * Matrix type.
 */
export type Matrix = Matrix2 | Matrix3 | Matrix4;

/**
 * Possible dimensions for vectors and matrices.
 */
export type Dimension = 2 | 3 | 4;

const matDimension = (arr: Matrix) => Math.sqrt(arr.length) as Dimension;

const vecDimension = (arr: Vector) => arr.length as Dimension;

const zeros = (dim: Dimension) =>
  [...Array(dim ** 2)].map(() => 0) as Matrix;

const zeroVector = (dim: Dimension) =>
  [...Array(dim)].map(() => 0) as Vector;

/**
 * Initialize an identity matrix with the provided dimension.
 */
export const identity = (dim: Dimension): Matrix => {
  const M: Matrix = zeros(dim);
  for (let i = 0; i < dim; i++) {
    M[(i * dim) + i] = 1;
  }
  return M;
}

const multiplyM = <M extends Matrix>(A: M, B: M, d: Dimension): M => {
  const result = zeros(d) as M;
  for (let i = 0; i < d; i++)
  for (let j = 0; j < d; j++)
  for (let k = 0; k < d; k++) {
    result[(d * i) + j] += A[(d * i) + k] * B[(d * k) + j];
  }
  return result;
};

const multiplyMv =
  <M extends Matrix, V extends Vector>(A: M, b: V, d: Dimension): V => {
    const result = zeroVector(d) as V;
    for (let i = 0; i < d; i++)
    for (let j = 0; j < d; j++) {
      result[i] += A[(i * d) + j] * b[j];
    }
    return result;
  };

/**
 * Can be used for matrix-matrix and matrix-vector multiplication.
 */
export const multiply =
  <M extends Matrix, V extends Vector>(A: M, B: M | V): M | V => {
    const d = matDimension(A);
    if (d !== matDimension(B as M)) {
      if (d !== vecDimension(B as V)) {
        throw new Error('Cannot multiply, incompatible dimensions');
      }
      return multiplyMv(A, B as V, d);
    }
    return multiplyM(A, B as M, d);
  };

/**
 * Apply a 3D transmation to a 4-dimensional matrix, M.
 */
export const translate =
  (M: Matrix4, x: number, y: number, z: number): Matrix4 => {
    const result = M.slice(0, 16) as Matrix4;
    result[12] += x;
    result[13] += y;
    result[14] += z;
    return result;
  };

/**
 * Apply a scale transformation to a matrix.
 */
export const scale = <M extends Matrix>(A: M, ...args: number[]): M => {
  if (!args.length) {
    throw new Error('You must provide at least one number to scale a matrix');
  }
  const d = matDimension(A);
  if (d === 4 && args.length === 2) {
    throw new Error(
      'You must provide 1, 3, or 4 arguments to scale for a 4D matrix');
  }
  const S = identity(d) as M;
  for (let i = 0; i < d; i++) {
    if (i === 3 && scale.length < 4) {
      S[(d * i) + i] = 1;
    } else {
      S[(d * i) + i] = Number(isNaN(args[i]) ? args[0] : args[i]);
    }
  }
  return multiply(S, A) as M;
};

type Quaternion = [number, number, number, number];

const quatToRotationMat = (q: Quaternion): Matrix3 => [
  // first column
  1 - (2 * ((q[2] ** 2) + (q[3] ** 2))),
  2 * ((q[1] * q[2]) + (q[3] * q[0])),
  2 * ((q[1] * q[3]) - (q[2] * q[0])),
  // second column
  2 * ((q[1] * q[2]) - (q[3] * q[0])),
  1 - (2 * ((q[1] ** 2) + (q[3] ** 2))),
  2 * ((q[2] * q[3]) + (q[1] * q[0])),
  // third column
  2 * ((q[1] * q[3]) + (q[2] * q[0])),
  2 * ((q[2] * q[3]) - (q[1] * q[0])),
  1 - (2 * ((q[1] ** 2) + (q[2] ** 2))),
];

const rotate2 = (M: Matrix2, theta: number): Matrix2 => {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return multiply([c, s, c, -s], M);
};

/**
 * Apply a 3D rotation of theta radians around the given axis
 * to a 4D matrix.
 */
export const rotate =
  <M extends Matrix>(A: M, theta: number, ...axis: Vector3): M => {
    if (isNaN(theta)) {
      throw new Error('Expected a number as a 2nd argument');
    }

    const d = matDimension(A);
    if (d === 2) return rotate2(A as Matrix2, theta) as M;

    axis = axis.slice(0, 3) as Vector3;
    if (!isVector3(axis)) {
      throw new Error('Expected numeric 3rd, 4th, and 5th argument');
    }
    axis = normalize(axis);

    const s = Math.sin(theta / 2);
    const q: Quaternion = [
      Math.cos(theta / 2),
      axis[0] * s,
      axis[1] * s,
      axis[2] * s,
    ];
    const R = quatToRotationMat(q);
    if (d === 3) return multiply(A as Matrix3, R) as M;

    const R4: Matrix4 = [
      R[0], R[1], R[2], 0,
      R[3], R[4], R[5], 0,
      R[6], R[7], R[8], 0,
      0, 0, 0, 1,
    ];
    return multiply(A as Matrix4, R4) as M;
  };

/**
 * Compute the 4D view matrix for a camera at
 * position "eye", looking at position "at", oriented
 * with "up" facing in the y+ direction.
 * 
 * Based on https://github/toji/gl-matrix
 */
export const lookAt =
  (eye: Vector3, at: Vector3, up: Vector3, epsilon=1e-6): Matrix4 => {
    let z = subtract(eye, at);
    let count = 0;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(z[i]) < epsilon) count++;
    }
    if (count === 3) return identity(4) as Matrix4;
    z = normalize(z);

    let x: Vector3;
    try {
      x = normalize(cross(up, z));
    } catch (ok) {
      x = [0, 0, 0];
    }

    let y: Vector3;
    try {
      y = normalize(cross(z, x));
    } catch (ok) {
      y = [0, 0, 0];
    }

    return [
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
    ];
  };


/**
 * Generate a 4D perspective matrix from
 * @param {fovy} vertical field of view (radians)
 * @param {aspect} width / height aspect ratio
 * @param {near} near bound of the frustum
 * @param {far} far bound of the frustum, can be Infinity or null
 */
export const perspective =
  (fovy: number, aspect: number, near: number, far: number | null): Matrix4 => {
    const f = 1.0 / Math.tan(fovy / 2);
    let out10: number;
    let out14: number;
    if (far !== null && far !== Infinity) {
      const nf = 1 / (near - far);
      out10 = (near + far) * nf;
      out14 = 2 * far * near * nf;
    } else {
      out10 = -1;
      out14 = -2 * near;
    }
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, out10, -1,
      0, 0, out14,  0,
    ];
  };

/**
 * Union type of all different faces for a cube.
 */
export type CubeFace = 'posx' | 'negx' | 'posy' | 'negy' | 'posz' | 'negz';

/**
 * Returns an array of all the cube face keys.
 */
export const cubeFaces = (): CubeFace[] =>
  ['posx', 'negx', 'posy', 'negy', 'posz', 'negz'];

/**
 * Cube type has properties for each cube face.
 */
export type Cube<T> = Record<CubeFace, T>;

/**
 * Can either be the type, T, or a Cube of T.
 */
export type CubeOr<T> = T | Cube<T>;

/**
 * Test if an object is a Cube.
 */
export const isCube = <T>(obj: any): obj is Cube<T> =>
  Boolean(obj) && cubeFaces().every(k => obj[k] !== undefined);

/**
 * Build a cube by iterating over each face and calling
 * a given callback.
 */
export const cube = <T>(buildFace: (cf: CubeFace) => T): Cube<T> => {
  const result: Partial<Cube<T>> = {};
  for (const cf of cubeFaces()) {
    result[cf] = buildFace(cf);
  }
  return result as Cube<T>;
};
