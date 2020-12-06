/**
 * @fileoverview Shader uniforms module.
 */

import {
  UniformType,
  Viewport,
  newTextureOffset,
  renderBuffer,
  send2DTexture,
  sendBytesUniform,
  sendMatrixUniform,
  sendVectorUniform,
  texture2d,
  texture2DFromFramebuffer,
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

/**
 * Types of data that uniforms accept.
 */
export type UniformData = number | Float32List | TexImageSource;

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
  set: (dataOrCb: IsOrReturns<Data>) => Uniform<Data>;

  /**
   * Returns the current data for this uniform.
   */
  data: () => Data;
}

type BytesUniformType =
  UniformType.BOOLEAN | UniformType.FLOAT | UniformType.INTEGER;

class UniformBase<Data> {
  constructor(
    protected readonly type: UniformType,
    public readonly name: string,
    protected dataOrCb?: IsOrReturns<Data>,
  ) {}

  set(dataOrCb: Data) {
    this.dataOrCb = dataOrCb;
    return this;
  }

  data() {
    if (typeof this.dataOrCb === 'function') {
      return (this.dataOrCb as () => Data)();
    }
    return this.dataOrCb;
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
    if (isNaN(this.data())) {
      throw TypeError(`Data for ${this.type} uniform should be a number`);
    }
    sendBytesUniform(gl, program, this.name, this.type, this.data());
  }
}

type UniformBuilder = (name: string, data?: IsOrReturns<UniformData>) => Uniform<UniformData>;

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

type SequenceUniformData = Float32List;

class SequenceUniform extends UniformBase<SequenceUniformData>
  implements Uniform<SequenceUniformData> {
  constructor(
    type: SequenceUniformType,
    name: string,
    public readonly dimension: number,
    dataOrCb?: Float32List,
  ) {
    super(type, name, dataOrCb);
  }

  private validateData() {
    if (this.type == UniformType.VECTOR) {
      if (this.data().length != this.dimension) {
        throw new TypeError(
          `Dimension mismatch for a ${this.type}${this.dimension} uniform`);
      }
    } else {
      if (this.data().length != this.dimension ** 2) {
        throw new TypeError(
          `Dimension mismatch for a ${this.type}${this.dimension} uniform`);
      }
    }
  }

  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    this.validateData();
    if (this.type === UniformType.VECTOR) {
      sendVectorUniform(gl, program, this.name, this.dimension, this.data());
    } else {
      sendMatrixUniform(gl, program, this.name, this.dimension, this.data());
    }
  }

  set(dataOrCb: IsOrReturns<SequenceUniformData>) {
    this.dataOrCb = dataOrCb;
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
    return u.set(translate(u.data() as Matrix4, x, y, z));
  };

/**
 * Create a transform on a Mat4Uniform that applies a scale
 * transformation. Takes 1, 3 or 4 arguments.
 */
export const Scale = (...args: number[]) => (u: SequenceUniform) => {
  UniformBase.checkType(u, UniformType.MATRIX);
  return u.set(scale(u.data() as Matrix4, ...args));
};

/**
 * Create a transform on a Mat4Uniform that applies a
 * 3D rotation of theta radians around the given axis.
 */
export const Rotate = (theta: number, ...axis: Vector3) =>
  (u: SequenceUniform) => {
    UniformBase.checkType(u, UniformType.MATRIX);
    return u.set(rotate(u.data() as Matrix, theta, ...axis));
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
    () => transpose(inverse(modelMat.data() as Matrix4)),
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

interface TextureBuffers {
  frameBuffer: WebGLFramebuffer;
  renderBuffer: WebGLFramebuffer;
}

/**
 * Implementation of a texture 2D uniform.
*/
export class Texture2DUniformImpl extends UniformBase<TexImageSource>
  implements Uniform<TexImageSource> {
  private offset: number;
  public texture: WebGLTexture;
  private buffersCache: TextureBuffers;

  private shouldBuildTexture() {
    return !this.texture || this.data() instanceof HTMLVideoElement;
  }

  set(dataOrCb: IsOrReturns<TexImageSource>) {
    this.dataOrCb = dataOrCb;
    this.texture = undefined;
    return this;
  }

  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    if (isNaN(this.offset)) {
      this.offset = newTextureOffset(program);
    }
    if (this.shouldBuildTexture()) {
      this.texture = texture2d(gl, this.data());
    }
    send2DTexture(gl, program, this.offset, this.texture);
  }

  buffers(gl: WebGLRenderingContext, viewport: Viewport): TextureBuffers {
    if (this.buffersCache) return this.buffersCache;
    const frameBuffer = gl.createFramebuffer();
    const width = viewport[2] - viewport[0];
    const height = viewport[3] - viewport[1];
    this.buffersCache = {
      frameBuffer,
      renderBuffer: renderBuffer(gl, frameBuffer, width, height),
    };
    this.texture = texture2DFromFramebuffer(gl, frameBuffer, width, height);
    return this.buffersCache;
  }
}

/**
 * Tests if a uniform is for a texture.
 */
export const isTextureUniform =
  (u: Uniform<UniformData>): u is Texture2DUniformImpl =>
    u instanceof Texture2DUniformImpl;

// TODO cube textures

/**
 * Sends a 2D texture uniform to a shader.
 */
export const Texture2DUniform: UniformBuilder =
  (name: string, data?: TexImageSource) =>
    new Texture2DUniformImpl(UniformType.TEXTURE, name, data);
