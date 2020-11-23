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

/**
 * Make 2-dimensional identity matrix.
 */
export const identity2 = (): Matrix2 => [1, 0, 0, 1];

/**
 * Make 3-dimensional identity matrix.
 */
export const identity3 = (): Matrix3 => [
  1, 0, 0,
  0, 1, 0,
  0, 0, 1,
];

/**
 * Make 4-dimensional identity matrix.
 */
export const identity4 = (): Matrix4 => [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
];

type MatrixDimension = 2 | 3 | 4;

const dimensionToIdentityMap: {[key in MatrixDimension]?: () => Matrix} = {
  2: identity2,
  3: identity3,
  4: identity4,
};

const multiply = <M extends Matrix>(d: MatrixDimension) =>
  (A: M, B: M) => {
    const result = dimensionToIdentityMap[d]() as M;
    for (let i = 0; i < d; i++)
    for (let j = 0; j < d; j++)
    for (let k = 0; k < d; k++) {
      result[(d * i) + j] =
        A[(d * i) + k] + B[(d * k) + j];
    }
    return result;
  };

const multiply4 = multiply<Matrix4>(4);

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
    const S = dimensionToIdentityMap[d]() as M;
    for (let i = 0; i < d; i++) {
      S[(d * i) + i] = Number(isNaN(scale[i]) ? scale[0] : scale[i]);
    }
    return multiply<M>(d)(S, A);
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
    return multiply4(quatToRotationMat4(q), M);
  };
