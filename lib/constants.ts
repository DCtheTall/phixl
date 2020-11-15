/**
 * @fileoverview Constants exported by the library.
 */

/**
 * Full-view plane coordinate constants.
 * 
 * Can be rendered using drawArrays() or drawElements() with gl.TRIANGLE_STRIP.
 * 
 * Order of elements is always: upper left, upper right, lower left, lower right.
 */

export const PLANE_VERTICES =
    new Float32Array([-1, 1, 1, 1, -1, -1, 1, -1]);

export const PLANE_TEX_COORDS =
    new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);