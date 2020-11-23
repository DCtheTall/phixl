/**
 * @fileoverview Math module contains utility methods.
 */

/**
 * Returns if a number is a power of two.
 */
export const isPowerOfTwo = (n: number) => ((n & (n - 1)) === 0);

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

/**
 * Apply a 3D transmation to a 4-dimensional matrix, M.
 */
export const translate =
  (M: Matrix4, x: number, y: number, z: number): Matrix4 => [
    M[0],  M[1],  M[2],  M[3]  + x,
    M[4],  M[5],  M[6],  M[7]  + y,
    M[8],  M[9],  M[10], M[11] + z,
    M[12], M[13], M[14], M[15],
  ];
