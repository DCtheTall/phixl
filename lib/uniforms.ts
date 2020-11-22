/**
 * @fileoverview Shader uniforms module.
 */

import {Matrix, Matrix4, identity3, identity4, identity2, isPowerOfTwo, translate} from './math';

enum UniformType {
  BOOLEAN = 'boolean',
  FLOAT = 'float',
  INTEGER = 'integer',
  VECTOR = 'vector',
  MATRIX = 'matrix',
  TEXTURE = 'texture',
}

export type UniformData = number | Float32List | TexImageSource;

export interface Uniform<Data extends UniformData> {
  send: (gl: WebGLRenderingContext, program: WebGLProgram) => void;
  set: (data: Data) => void;
}

type NumberUniformType =
  UniformType.BOOLEAN | UniformType.FLOAT | UniformType.INTEGER;

class UniformBase<Data> {
  constructor(
    protected readonly type: UniformType,
    protected readonly name: string,
    protected data?: Data,
  ) {}

  set(data: Data) {
    this.data = data;
  }

  static checkType<Data>(u: UniformBase<Data>, wantType: UniformType) {
    if (u.type !== wantType) {
      throw new TypeError(
        `Expected uniform with type ${wantType} got type ${u.type}`);
    }
  }

  static data<Data>(u: UniformBase<Data>) {
    return u.data;
  }
}

class NumberUniform extends UniformBase<number> implements Uniform<number> {
  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    if (isNaN(this.data)) {
      throw TypeError(`Data for ${this.type} uniform should be a number`);
    }
    const loc = gl.getUniformLocation(program, this.name);
    switch (this.type) {
      case UniformType.BOOLEAN:
        gl.uniform1i(loc, this.data);
        break;
      case UniformType.FLOAT:
        gl.uniform1f(loc, this.data);
        break;
      case UniformType.INTEGER:
        gl.uniform1i(loc, this.data);
        break;
    }
  }
}

type UniformBuilder = (name: string, data?: UniformData) => Uniform<UniformData>;

/**
 * Create a builder function for each type of numeric uniform.
 */
const numberUniform = (type: NumberUniformType): UniformBuilder =>
  (name: string, data?: number) => new NumberUniform(type, name, data);

export const BooleanUniform = numberUniform(UniformType.BOOLEAN);

export const FloatUniform = numberUniform(UniformType.FLOAT);

export const IntegerUniform = numberUniform(UniformType.INTEGER);

type SequenceUniformType = UniformType.VECTOR | UniformType.MATRIX;

class SequenceUniform extends UniformBase<Float32List>
  implements Uniform<Float32List> {
  constructor(
    type: SequenceUniformType,
    name: string,
    protected readonly dimension: number,
    data?: Float32List,
  ) {
    super(type, name, data);
  }

  private validateData() {
    if (this.type == UniformType.VECTOR) {
      if (this.data.length != this.dimension) {
        throw new TypeError(
            `Dimension mismatch for a ${this.type}${this.dimension} uniform`);
      }
    } else {
      if (this.data.length != this.dimension ** 2) {
        throw new TypeError(
            `Dimension mismatch for a ${this.type}${this.dimension} uniform`);
      }
    }
  }

  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    this.validateData();
    const loc = gl.getUniformLocation(program, this.name);
      if (this.type == UniformType.VECTOR) {
        switch (this.dimension) {
          case 2:
            gl.uniform2fv(loc, this.data);
          case 3:
            gl.uniform3fv(loc, this.data);
          case 4:
            gl.uniform4fv(loc, this.data);
        }
      } else {
        switch (this.dimension) {
          case 2:
            gl.uniformMatrix2fv(loc, false, this.data);
          case 3:
            gl.uniformMatrix3fv(loc, false, this.data);
          case 4:
            gl.uniformMatrix4fv(loc, false, this.data);
        }
      }
  }

  set(data: Float32List) {
    this.data = data;
    this.validateData();
  }

  static checkDimension(u: SequenceUniform, wantDimension: number) {
    if (u.dimension != wantDimension) {
      throw new TypeError();
    }
  }
}

/**
 * Creates builder functions for vector and matrix uniforms.
 */
const uniform =
  (type: SequenceUniformType, dimension: number): UniformBuilder =>
    (name: string, data?: Float32List) =>
      new SequenceUniform(type, name, dimension, data);

export const Vec2Uniform = uniform(UniformType.VECTOR, 2);

export const Vec3Uniform = uniform(UniformType.VECTOR, 3);

export const Vec4Uniform = uniform(UniformType.VECTOR, 4);

export const Mat2Uniform = uniform(UniformType.MATRIX, 2);

export const Mat3Uniform = uniform(UniformType.MATRIX, 3);

export const Mat4Uniform = uniform(UniformType.MATRIX, 4);

/**
 * Creates a uniform builder for a matrix uniform originally set to identity.
 */
const matrixUniform = (dimension: number, identity?: Matrix) =>
  (name: string) => uniform(UniformType.MATRIX, dimension)(name, identity);

export const IdentityMat2Uniform = matrixUniform(2, identity2());

export const IdentityMat3Uniform = matrixUniform(3, identity3());

export const IdentityMat4Uniform = matrixUniform(4, identity4());

export const Translate = (x: number, y: number, z: number) =>
  (u: SequenceUniform) => {
    UniformBase.checkType(u, UniformType.MATRIX);
    SequenceUniform.checkDimension(u, 4);
    u.set(translate(UniformBase.data(u) as Matrix4, x, y, z))
    return u;
  };

/**
 * Keep track of the number of textures for each different WebGLProgram.
 */
const textureRegistry = new WeakMap<WebGLProgram, number>();

class Texture2DUniformImpl extends UniformBase<TexImageSource>
  implements Uniform<TexImageSource> {
  send(gl: WebGLRenderingContext, program: WebGLProgram) {
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
      gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.data);

    if (isPowerOfTwo(this.data.width) && isPowerOfTwo(this.data.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    gl.activeTexture(gl.TEXTURE0 + addr);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  }
}

/**
 * A builder for a 2D texture uniform.
 */
export const Texture2DUniform: UniformBuilder =
  (name: string, data?: TexImageSource) =>
    new Texture2DUniformImpl(UniformType.TEXTURE, name, data);
