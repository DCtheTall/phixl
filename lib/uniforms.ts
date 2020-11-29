/**
 * @fileoverview Shader uniforms module.
 */

import {
  UniformType,
  newTextureAddress,
  send2DTexture,
  sendBytesUniform,
  sendMatrixUniform,
  sendVectorUniform,
  texture2d,
} from './gl';
import {
  Matrix,
  Matrix4,
  Vector3,
  Vector4,
  identity,
  inverse,
  lookAt,
  perspective,
  rotate,
  scale,
  transpose,
  translate,
} from './math';

type IsOrReturns<T> = T | (() => T);

type UniformSource = number | Float32List | TexImageSource;

/**
 * Different data types we send to shaders in uniforms.
 */
export type UniformData = IsOrReturns<UniformSource>;

/**
 * Interface for abstraction for sending uniforms to shaders.
 */
export interface Uniform<Data extends UniformData> {
  /**
   * Send the data to the shader.
   */
  send: (gl: WebGLRenderingContext, program: WebGLProgram) => void;

  /**
   * Set the data that it sends to the shader.
   */
  set: (data: Data) => Uniform<Data>;

  /**
   * Get the current data for this uniform.
   */
  get: () => Data;
}

type BytesUniformType =
  UniformType.BOOLEAN | UniformType.FLOAT | UniformType.INTEGER;

class UniformBase<Data> {
  constructor(
    protected readonly type: UniformType,
    public readonly name: string,
    protected data?: Data,
  ) {}

  set(data: Data) {
    this.data = data;
    return this;
  }

  get() {
    if (typeof this.data === 'function') return this.data();
    return this.data;
  }

  static checkType<Data>(u: UniformBase<Data>, wantType: UniformType) {
    if (u.type !== wantType) {
      throw new TypeError(
        `Expected uniform with type ${wantType} got type ${u.type}`);
    }
  }
}

class BytesUniform extends UniformBase<number> implements Uniform<number> {
  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    if (isNaN(this.get())) {
      throw TypeError(`Data for ${this.type} uniform should be a number`);
    }
    sendBytesUniform(gl, program, this.name, this.type, this.get());
  }
}

type UniformBuilder = (name: string, data?: UniformData) => Uniform<UniformData>;

/**
 * Create a builder function for each type of numeric uniform.
 */
const bytesUniform = (type: BytesUniformType): UniformBuilder =>
  (name: string, data?: number) => new BytesUniform(type, name, data);

/**
 * Send a boolean uniform to a shader.
 */
export const BooleanUniform = bytesUniform(UniformType.BOOLEAN);

/**
 * Send a float uniform to a shader.
 */
export const FloatUniform = bytesUniform(UniformType.FLOAT);

/**
 * Send a integer uniform to a shader.
 */
export const IntegerUniform = bytesUniform(UniformType.INTEGER);

type SequenceUniformType = UniformType.VECTOR | UniformType.MATRIX;

type SequenceUniformData = IsOrReturns<Float32List>;

class SequenceUniform extends UniformBase<SequenceUniformData>
  implements Uniform<SequenceUniformData> {
  constructor(
    type: SequenceUniformType,
    name: string,
    public readonly dimension: number,
    data?: Float32List,
  ) {
    super(type, name, data);
  }

  private validateData() {
    if (this.type == UniformType.VECTOR) {
      if (this.get().length != this.dimension) {
        throw new TypeError(
          `Dimension mismatch for a ${this.type}${this.dimension} uniform`);
      }
    } else {
      if (this.get().length != this.dimension ** 2) {
        throw new TypeError(
          `Dimension mismatch for a ${this.type}${this.dimension} uniform`);
      }
    }
  }

  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    this.validateData();
    if (this.type === UniformType.VECTOR) {
      sendVectorUniform(gl, program, this.name, this.dimension, this.get());
    } else {
      sendMatrixUniform(gl, program, this.name, this.dimension, this.get());
    }
  }

  set(data: SequenceUniformData) {
    this.data = data;
    this.validateData();
    return this;
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
const sequenceUniform =
  (type: SequenceUniformType, dimension: number): UniformBuilder =>
    (name: string, data?: Float32List) =>
      new SequenceUniform(type, name, dimension, data);

/**
 * Sends a 2-dimensional vector to a shader.
 */
export const Vec2Uniform = sequenceUniform(UniformType.VECTOR, 2);

/**
 * Sends a 3-dimensional vector to a shader.
 */
export const Vec3Uniform = sequenceUniform(UniformType.VECTOR, 3);

/**
 * Sends a 4-dimensional vector to a shader.
 */
export const Vec4Uniform = sequenceUniform(UniformType.VECTOR, 4);

/**
 * Sends a 2-dimensional matrix to a shader.
 */
export const Mat2Uniform = sequenceUniform(UniformType.MATRIX, 2);

/**
 * Sends a 3-dimensional matrix to a shader.
 */
export const Mat3Uniform = sequenceUniform(UniformType.MATRIX, 3);

/**
 * Sends a 4-dimensional matrix to a shader.
 */
export const Mat4Uniform = sequenceUniform(UniformType.MATRIX, 4);

const matrixUniform =
  (dimension: number, identity?: Matrix) =>
    (name: string) =>
      sequenceUniform(UniformType.MATRIX, dimension)(name, identity);

/**
 * Sends a 2-dimensional identity matrix to a shader.
 */
export const IdentityMat2Uniform = matrixUniform(2, identity(2));

/**
 * Sends a 3-dimensional identity matrix to a shader.
 */
export const IdentityMat3Uniform = matrixUniform(3, identity(3));

/**
 * Sends a 4-dimensional identity matrix to a shader.
 */
export const IdentityMat4Uniform = matrixUniform(4, identity(4));

/**
 * Create a transform on a Mat4Uniform that applies a 3D translation
 * to a 4D matrix.
 */
export const Translate = (x: number, y: number, z: number) =>
  (u: SequenceUniform): SequenceUniform => {
    UniformBase.checkType(u, UniformType.MATRIX);
    SequenceUniform.checkDimension(u, 4);
    return u.set(translate(u.get() as Matrix4, x, y, z));
  };

/**
 * Create a transform on a Mat4Uniform that applies a scale
 * transformation. Takes 1, 3 or 4 arguments.
 */
export const Scale = (...args: number[]) => (u: SequenceUniform) => {
  UniformBase.checkType(u, UniformType.MATRIX);
  return u.set(scale(u.get() as Matrix4, ...args));
};

/**
 * Create a transform on a Mat4Uniform that applies a
 * 3D rotation of theta radians around the given axis.
 *
 * TODO handle other dimensions.
 */
export const Rotate = (theta: number, ...axis: Vector3) =>
  (u: SequenceUniform) => {
    UniformBase.checkType(u, UniformType.MATRIX);
    SequenceUniform.checkDimension(u, 4);
    return u.set(rotate(u.get() as Matrix4, theta, ...axis));
  };

interface ModelMatOptions {
  scale?: number | Vector3;
  rotate?: Vector4,
  translate?: Vector3,
}

/**
 * Sends a model matrix to a shader as a uniform that applies
 * a scale, rotation, and translation (in that order).
 */
export const ModelMatUniform = (name: string, opts: ModelMatOptions = {}): SequenceUniform => {
  let u = IdentityMat4Uniform(name) as SequenceUniform;
  if (opts.scale) {
    if (typeof opts.scale === 'number') {
      u = Scale(opts.scale)(u);
    } else {
      u = Scale(...opts.scale)(u);
    }
  }
  if (opts.translate) u = Translate(...opts.translate)(u);
  if (opts.rotate) u = Rotate(...opts.rotate)(u);
  return u;
};

/**
 * Sends the resulting normal matrix for a given
 * model matrix to a shader.
 * 
 * If M is the value of the model matrix uniform, then
 * the normal matrix uniform will receive
 */
export const NormalMatUniform = (name: string, modelMat: SequenceUniform) => {
  UniformBase.checkType(modelMat, UniformType.MATRIX);
  SequenceUniform.checkDimension(modelMat, 4);
  return sequenceUniform(UniformType.MATRIX, 4)(
    name,
    () => transpose(inverse(modelMat.get() as Matrix4)),
  ) as SequenceUniform;
};

/**
 * Sends a view matrix uniform for the given
 * eye, at, and up vectors.
 */
export const ViewMatUniform =
  (name: string, eye: Vector3, at: Vector3, up: Vector3) =>
    sequenceUniform(UniformType.MATRIX, 4)(name, lookAt(eye, at, up));

/**
 * Sends a perspective 4D matrix uniform.
 */
export const PerspectiveMatUniform =
  (name: string, fovy: number, aspect: number, near: number,
   far: number | null) =>
     sequenceUniform(UniformType.MATRIX, 4)(
       name, perspective(fovy, aspect, near, far));

class Texture2DUniformImpl extends UniformBase<TexImageSource>
  implements Uniform<TexImageSource> {
  private address: number;
  private texture: WebGLTexture;

  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    if (this.texture) {
      send2DTexture(gl, program, this.address, this.texture);
    } else {
      this.address = newTextureAddress(program);
      this.texture = texture2d(gl, this.get());
      send2DTexture(gl, program, this.address, this.texture);
    }
  }
}

/**
 * Sends a 2D texture uniform to a shader.
 */
export const Texture2DUniform: UniformBuilder =
  (name: string, data?: TexImageSource) =>
    new Texture2DUniformImpl(UniformType.TEXTURE, name, data);
