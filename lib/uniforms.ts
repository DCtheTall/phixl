/**
 * @fileoverview Shader uniforms module.
 */

import {Matrix, identity3, identity4, identity2, isPowerOfTwo, translate} from './math';

enum UniformType {
  BOOLEAN = 'boolean',
  FLOAT = 'float',
  INTEGER = 'integer',
  VECTOR = 'vector',
  MATRIX = 'matrix',
}

export type Uniform =
  (gl: WebGLRenderingContext, program: WebGLProgram) => void;

type UniformBuilder<Data> = (name: string, data?: Data) => Uniform;

type NumberUniformType =
  UniformType.BOOLEAN | UniformType.FLOAT | UniformType.INTEGER;

/**
 * Create a builder function for each type of numeric uniform.
 */
const numberUniform = (type: NumberUniformType): UniformBuilder<number> =>
  (name: string, data: number) =>
    (gl: WebGLRenderingContext, program: WebGLProgram) => {
      if (isNaN(data)) {
        throw TypeError(`Data for ${type} uniform should be a number`);
      }
      const loc = gl.getUniformLocation(program, name);
      switch (type) {
        case UniformType.BOOLEAN:
          gl.uniform1i(loc, data);
          break;
        case UniformType.FLOAT:
          gl.uniform1f(loc, data);
          break;
        case UniformType.INTEGER:
          gl.uniform1i(loc, data);
          break;
      }
    };

export const BooleanUniform = numberUniform(UniformType.BOOLEAN);

export const FloatUniform = numberUniform(UniformType.FLOAT);

export const IntegerUniform = numberUniform(UniformType.INTEGER);

/**
 * Creates builder functions for vector and matrix uniforms.
 */
const uniform = (type: UniformType, dimension: number): UniformBuilder<Float32List> =>
  (name: string, data: Float32List) =>
    (gl: WebGLRenderingContext, program: WebGLProgram) => {
      const loc = gl.getUniformLocation(program, name);
      if (type == UniformType.VECTOR) {
        if (data.length != dimension) {
          throw new TypeError(
              `Dimension mismatch for a ${type}${dimension} uniform`);
        }
        switch (dimension) {
          case 2:
            gl.uniform2fv(loc, data);
          case 3:
            gl.uniform3fv(loc, data);
          case 4:
            gl.uniform4fv(loc, data);
        }
      } else {
        if (data.length != dimension ** 2) {
          throw new TypeError(
              `Dimension mismatch for a ${type}${dimension} uniform`);
        }
        switch (dimension) {
          case 2:
            gl.uniformMatrix2fv(loc, false, data);
          case 3:
            gl.uniformMatrix3fv(loc, false, data);
          case 4:
            gl.uniformMatrix4fv(loc, false, data);
        }
      }
    };

export const Vec2Uniform = uniform(UniformType.VECTOR, 2);

export const Vec3Uniform = uniform(UniformType.VECTOR, 3);

export const Vec4Uniform = uniform(UniformType.VECTOR, 4);

export const Mat2Uniform = uniform(UniformType.MATRIX, 2);

export const Mat3Uniform = uniform(UniformType.MATRIX, 3);

export const Mat4Uniform = uniform(UniformType.MATRIX, 4);

const matrixUniform = (dimension: number, identity: Matrix) =>
  (name: string) => uniform(UniformType.MATRIX, dimension)(name, identity);

export const IdentityMat2Uniform = matrixUniform(2, identity2());

export const IdentityMat3Uniform = matrixUniform(3, identity3());

export const IdentityMat4Uniform = matrixUniform(4, identity4());

/**
 * Keep track of the number of textures for each different WebGLProgram.
 */
const textureRegistry = new WeakMap<WebGLProgram, number>();

/**
 * A builder for a 2D texture uniform.
 */
export const Texture2DUniform: UniformBuilder<TexImageSource> =
  (name: string, data: TexImageSource) =>
      (gl: WebGLRenderingContext, program: WebGLProgram) => {
        // Get the next available texture address.
        const addr = textureRegistry.get(program) || 0;
        if (addr === 32) {
          throw new Error('Already at maximum number of textures for this program');
        }
        // Set the next available address in the map.
        textureRegistry.set(program, addr + 1);

        const texture = gl.createTexture();
        const loc = gl.getUniformLocation(program, name);
        gl.uniform1i(loc, addr);

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);

        if (isPowerOfTwo(data.width) && isPowerOfTwo(data.height)) {
          gl.generateMipmap(gl.TEXTURE_2D);
        } else {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }

        gl.activeTexture(gl.TEXTURE0 + addr);
        gl.bindTexture(gl.TEXTURE_2D, texture);
      };
