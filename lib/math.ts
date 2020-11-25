/**
 * @fileoverview Math module contains utility methods.
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

export const identity = (dim: MatrixDimension): Matrix => {
  switch (dim) {
    case 2:
      return [1, 0, 0, 1];
    case 3:
      return [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
      ];
    case 4:
      return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
      ];
    default:
      throw TypeError(
        `Expected dimension to be 2, 3, 4, got ${dim}`);
  }
}

const multiply = <M extends Matrix>(d: MatrixDimension) =>
  (A: M, B: M) => {
    const result = identity(d) as M;
    for (let i = 0; i < d; i++)
    for (let j = 0; j < d; j++) {
      result[(d * i) + j] = 0;
      for (let k = 0; k < d; k++) {
        result[(d * i) + j] +=
          A[(d * i) + k] * B[(d * k) + j];
      }
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

const scale = <M extends Matrix>(d: MatrixDimension) =>
  (A: M, ...scale: number[]) => {
    const S = identity(d) as M;
    for (let i = 0; i < d; i++) {
      S[(d * i) + i] = Number(isNaN(scale[i]) ? scale[0] : scale[i]);
    }
    let m = multiply<M>(d)(S, A);
    console.log(S, A, m);
    return m;
  };

/**
 * Scale the diagonal values of a 4D matrix.
 */
export const scale4 = scale<Matrix4>(4);

type Quaternion = [number, number, number, number];

const quatToRotationMat4 = (q: Quaternion): Matrix4 => [
  // first column
  1 - (2 * ((q[2] ** 2) + (q[3] ** 2))),
  2 * ((q[1] * q[2]) + (q[3] * q[0])),
  2 * ((q[1] * q[3]) - (q[2] * q[0])),
  0,
  // second column
  2 * ((q[1] * q[2]) - (q[3] * q[0])),
  1 - (2 * ((q[1] ** 2) + (q[3] ** 2))),
  2 * ((q[2] * q[3]) + (q[1] * q[0])),
  0,
  // third column
  2 * ((q[1] * q[3]) + (q[2] * q[0])),
  2 * ((q[2] * q[3]) - (q[1] * q[0])),
  1 - (2 * ((q[1] ** 2) + (q[2] ** 2))),
  0,
  // fourth column
  0, 0, 0, 1,
];

const normalize3 = (v: Vector3): Vector3 => {
  const len = Math.hypot(...v);
  if (!len) {
    throw new Error('Cannot normalize a vector with no length');
  }
  return [v[0] / len, v[1] / len, v[2] / len];
};

/**
 * Apply a 3D rotation of theta radians around the given axis
 * to a 4D matrix.
 */
export const rotate4 =
  (M: Matrix4, theta: number, ...axis: Vector3): Matrix4 => {
    axis = normalize3(axis);
    const s = Math.sin(theta / 2);
    const q: Quaternion = [
      Math.cos(theta / 2),
      axis[0] * s,
      axis[1] * s,
      axis[2] * s,
    ];
    return multiply(4)(quatToRotationMat4(q), M) as Matrix4;
  };

const subtract3 = (a: Vector3, b: Vector3): Vector3 =>
  [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

const dot3 = (a: Vector3, b: Vector3): number =>
  (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);

const cross = (a: Vector3, b: Vector3): Vector3 => [
  (a[1] * b[2]) - (a[2] * b[1]),
  (a[0] * b[2]) - (a[2] * b[0]),
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
    let z = subtract3(eye, at);
    let count = 0;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(z[i]) < epsilon) count++;
    }
    if (count === 3) return identity(4) as Matrix4;
    z = normalize3(z);

    let x: Vector3;
    try {
      x = normalize3(cross(up, z));
    } catch (ok) {
      x = [0, 0, 0];
    }

    let y: Vector3;
    try {
      y = normalize3(cross(z, x));
    } catch (ok) {
      y = [0, 0, 0];
    }

    return [
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -dot3(x, eye), -dot3(y, eye), -dot3(z, eye), 1,
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
