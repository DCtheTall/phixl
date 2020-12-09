/**
 * @fileoverview Math module contains utility methods.
 * 
 * All exported functions from this module should be pure functions.
 */

/**
 * Returns if a number is a power of two.
 */
export const isPowerOfTwo = (n: number) => ((n & (n - 1)) === 0);

/**
 * A 3-dimensional vector type as a number array.
 */
export type Vector3 = [number, number, number];

/**
 * A 4-dimensional vector type as a number array.
 */
export type Vector4 = [number, number, number, number];

type Vector = Vector3 | Vector4;

type Matrix2 = [
  number, number,
  number, number,
];

type Matrix3 = [
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

type MatrixDimension = 2 | 3 | 4;

const dimension = (mat: Matrix) => Math.sqrt(mat.length) as MatrixDimension;

const zeros = (dim: MatrixDimension): Matrix =>
  [...Array(dim ** 2)].map(() => 0) as Matrix;

export const identity = (dim: MatrixDimension): Matrix => {
  const M: Matrix = zeros(dim);
  for (let i = 0; i < dim; i++) {
    M[(i * dim) + i] = 1;
  }
  return M;
}

const multiply = <M extends Matrix>(A: M, B: M) => {
  const d = dimension(A);
  if (d !== dimension(B)) {
    throw new Error('Cannot multiply matrices with a different dimension');
  }
  const result = zeros(d) as M;
  for (let i = 0; i < d; i++)
  for (let j = 0; j < d; j++)
  for (let k = 0; k < d; k++) {
    result[(d * i) + j] += A[(d * i) + k] * B[(d * k) + j];
  }
  return result;
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
 * 
 * If you're applying the transform to a 4D matrix
 * and less than 4 numbers are supplied, then it
 * will not scale the 4th diagonal element.
 */
export const scale = <M extends Matrix>(A: M, ...args: number[]) => {
  if (!args.length) {
    throw new Error('You must provide at least one number to scale a matrix');
  }
  const d = dimension(A);
  if (d === 4 && args.length === 2) {
    throw new Error(
      'You must provide 1, 3, or 4 arguments to scale for a 4D matrix');
  }
  const S = identity(d) as M;
  for (let i = 0; i < d; i++) {
    if (i === 3 && scale.length === 3) {
      S[(d * i) + i] = 1;
    } else {
      S[(d * i) + i] = Number(isNaN(args[i]) ? args[0] : args[i]);
    }
  }
  return multiply<M>(S, A);
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

const normalize = <V extends Vector>(v: V): V => {
  const len = Math.hypot(...v);
  if (!len) {
    throw new Error('Cannot normalize a vector with no length');
  }
  return v.map(x => x / len) as V;
};

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
    const d = dimension(A);
    if (d === 2) return rotate2(A as Matrix2, theta) as M;
    if (axis.length < 3) {
      throw new Error(
        `Expected 3 arguments for the axis of rotation, got: ${axis.length}`);
    }
    axis = axis.slice(0, 3) as Vector3;
    axis = normalize(axis);
    const s = Math.sin(theta / 2);
    const q: Quaternion = [
      Math.cos(theta / 2),
      axis[0] * s,
      axis[1] * s,
      axis[2] * s,
    ];
    const R = quatToRotationMat(q);
    if (d === 3) return multiply(R, A as Matrix3) as M;
    const R4: Matrix4 = [
      R[0], R[1], R[2], 0,
      R[3], R[4], R[5], 0,
      R[6], R[7], R[8], 0,
      0, 0, 0, 1,
    ];
    return multiply(R4, A as Matrix4) as M;
  };

const subtract = <V extends Vector>(a: V, b: V): V =>
  a.map((cur, i) => cur - b[i]) as V;

const dot = <V extends Vector>(a: V, b: V): number =>
  a.reduce((acc, cur, i) => acc + (cur * b[i]), 0);

const cross = (a: Vector3, b: Vector3): Vector3 => [
  (a[1] * b[2]) - (a[2] * b[1]),
  (a[2] * b[0]) - (a[0] * b[2]),
  (a[0] * b[1]) - (a[1] * b[0]),
];

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

const cofactor = <M extends Matrix>(A: M, p: number, q: number): M => {
  const dim = dimension(A);
  const out = zeros(dim - 1 as MatrixDimension) as M;
  let i = 0;
  let j = 0;
  for (let row = 0; row < dim; row++)
  for (let col = 0; col < dim; col++) {
    if (row === p || col === q) continue;
    out[(i * (dim - 1)) + j] = A[(row * dim) + col];
    j++;
    if (j === dim - 1) {
      j = 0;
      i++;
    }
  }
  return out;
};

const determinant = <M extends Matrix>(A: M): number => {
  const dim = dimension(A);
  if (dim === 2) return A[0] * A[3] - A[1] * A[2];
  let result = 0;
  let sign = 1;
  for (let row = 0; row < dim; row++) {
    if (A[row * dim] === 0) continue;
    result += sign * A[row * dim] * determinant(cofactor(A, row, 0));
    sign = -sign;
  }
  return result;
};

const adjoint = <M extends Matrix>(A: M): M => {
  const d = dimension(A);
  const out = zeros(d) as M;
  for (let i = 0; i < d; i++)
  for (let j = 0; j < d; j++) {
    const sign = (i + j) % 2 ? -1 : 1;
    // The adjoint is the transpose of the cofactor matrix.
    out[(j * d) + i] = sign * determinant(cofactor(A, i, j)); 
  }
  return out;
}

/**
 * Compute the inverse of a given matrix.
 * Throws an error if the matrix is singular, i.e. det(A) = 0.
 */
export const inverse = <M extends Matrix>(A: M): M => {
  const det = determinant(A);
  if (!det) {
    throw new Error('Cannot take the determinant of a singular matrix');
  }
  const adj = adjoint(A) as M;
  const d = dimension(A);
  const out = zeros(d) as M;
  for (let i = 0; i < d; i++)
  for (let j = 0; j < d; j++) {
    // inv(A) = adj(A) / det(A)
    out[(i * d) + j] = adj[(i * d) + j] / det;
  }
  return out;
}

/**
 * Compute the transpose of a matrix.
 */
export const transpose = <M extends Matrix>(A: M): M => {
  const d = dimension(A);
  const T = zeros(d) as M;
  for (let i = 0; i < d; i++)
  for (let j = 0; j < d; j++) {
    T[(j * d) + i] = A[(i * d) + j];
  }
  return T;
}

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

export const isCube = <T>(obj: any): obj is Cube<T> => {
  return Boolean(obj) && cubeFaces().every(k => obj[k] !== undefined);
};
