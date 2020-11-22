/**
 * @fileoverview Math module contains utility methods.
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

export type Matrix4 = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
];

export type Matrix = Matrix2 | Matrix3 | Matrix4;

export const identity2 = (): Matrix2 => [1, 0, 0, 1];

export const identity3 = (): Matrix3 => [
  1, 0, 0,
  0, 1, 0,
  0, 0, 1,
];

export const identity4 = (): Matrix4 => [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
];

export const translate =
  (m: Matrix4, x: number, y: number, z: number): Matrix4 => [
    m[0],  m[1],  m[2],  m[3] + x,
    m[4],  m[5],  m[6],  m[7] + y,
    m[8],  m[9],  m[10], m[11] + z,
    m[12], m[13], m[14], m[15],
  ];
