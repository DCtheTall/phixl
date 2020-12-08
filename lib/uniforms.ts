/**
 * @fileoverview Shader uniforms module.
 */

import {
  UniformType,
  Viewport,
  cubeTexure,
  isVideo,
  newTextureOffset,
  renderBuffer,
  send2DTexture,
  sendBytesUniform,
  sendMatrixUniform,
  sendVectorUniform,
  texture2d,
  texture2DFromFramebuffer,
  sendCubeTexture,
} from './gl';
import {
  Cube,
  Matrix,
  Matrix4,
  Vector3,
  Vector4,
  identity,
  inverse,
  isCube,
  lookAt,
  perspective,
  rotate,
  scale,
  transpose,
  translate,
} from './math';

type IsOrReturns<T> = T | (() => T);

type CubeTexSource = Cube<TexImageSource>

/**
 * Types of data that uniforms accept.
 */
export type UniformData = number | Float32List | TexImageSource | CubeTexSource;

export abstract class Uniform<Data extends UniformData> {
  constructor(
    protected readonly type: UniformType,
    public readonly name: string,
    protected dataOrCb?: IsOrReturns<Data>,
  ) {}

  static checkType(u: Uniform<UniformData>, wantType: UniformType) {
    if (u.type !== wantType) {
      throw new TypeError(
        `Expected uniform with type ${wantType} got type ${u.type}`);
    }
  }

  set(dataOrCb: IsOrReturns<Data>) {
    this.dataOrCb = dataOrCb;
    return this;
  }

  data() {
    if (typeof this.dataOrCb === 'function') {
      return (this.dataOrCb as () => Data)();
    }
    return this.dataOrCb;
  }

  // virtual
  send(gl: WebGLRenderingContext, program: WebGLProgram) {}
}

type BytesUniformType =
  UniformType.BOOLEAN | UniformType.FLOAT | UniformType.INTEGER;

class BytesUniform extends Uniform<number> {
  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    if (isNaN(this.data())) {
      throw TypeError(`Data for ${this.type} uniform should be a number`);
    }
    sendBytesUniform(gl, program, this.name, this.type, this.data());
  }
}

/**
 * Create a builder function for each type of numeric uniform.
 */
const bytesUniform = (type: BytesUniformType) =>
  (name: string, data?: IsOrReturns<number>) =>
    new BytesUniform(type, name, data);

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

class SequenceUniform extends Uniform<Float32List> {
  constructor(
    type: SequenceUniformType,
    name: string,
    public readonly dimension: number,
    dataOrCb?: IsOrReturns<Float32List>,
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

  set(dataOrCb: IsOrReturns<Float32List>) {
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

type SequenceUniformBuilder =
  (name: string, data?: IsOrReturns<Float32List>) => SequenceUniform;

/**
 * Creates builder functions for vector and matrix uniforms.
 */
const sequenceUniform =
  (type: SequenceUniformType, dimension: number): SequenceUniformBuilder =>
    (name: string, data?: IsOrReturns<Float32List>) =>
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
  (dimension: number, identity?: Matrix): SequenceUniformBuilder =>
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
    Uniform.checkType(u, UniformType.MATRIX);
    SequenceUniform.checkDimension(u, 4);
    return u.set(translate(u.data() as Matrix4, x, y, z));
  };

/**
 * Create a transform on a Mat4Uniform that applies a scale
 * transformation. Takes 1, 3 or 4 arguments.
 */
export const Scale = (...args: number[]) => (u: SequenceUniform) => {
  Uniform.checkType(u, UniformType.MATRIX);
  return u.set(scale(u.data() as Matrix4, ...args));
};

/**
 * Create a transform on a Mat4Uniform that applies a
 * 3D rotation of theta radians around the given axis.
 */
export const Rotate = (theta: number, ...axis: Vector3) =>
  (u: SequenceUniform) => {
    Uniform.checkType(u, UniformType.MATRIX);
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
  Uniform.checkType(modelMat, UniformType.MATRIX);
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

/**
 * Possible types to use as texture data sources.
 */
export type TextureData = TexImageSource | CubeTexSource;

interface TextureBuffers {
  frameBuffers: WebGLFramebuffer[];
  renderBuffers: WebGLFramebuffer[];
}

export class TextureUniform<Data extends TextureData> extends Uniform<Data> {
  protected offset: number;
  protected texture: WebGLTexture;
  protected textureBuffers: TextureBuffers;

  protected shouldBuildTexture() {
    return !this.textureBuffers // Not a texture whose source is a framebuffer.
      && this.dataOrCb // Has data. TODO caching?
      && (!this.texture || isVideo(this.data()));
  }

  // virtual
  prepare(gl: WebGLRenderingContext, program: WebGLProgram) {}

  // virtual
  buffers(gl: WebGLRenderingContext, viewport: Viewport): TextureBuffers {
    return null;
  }
}

/**
 * Tests if a uniform is for a texture.
 */
export const isTextureUniform =
  (u: Uniform<UniformData>): u is TextureUniform<TextureData> =>
    u instanceof TextureUniform;

class Texture2DUniformImpl extends TextureUniform<TexImageSource>
  implements TextureUniform<TexImageSource> {

  set(dataOrCb: IsOrReturns<TexImageSource>) {
    this.dataOrCb = dataOrCb;
    this.texture = undefined;
    return this;
  }

  prepare(gl: WebGLRenderingContext, program: WebGLProgram) {
    if (isNaN(this.offset)) {
      this.offset = newTextureOffset(program, this.name);
    }
    if (this.shouldBuildTexture()) {
      this.texture = texture2d(gl, this.data());
    }
  }

  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    send2DTexture(gl, program, this.name, this.offset, this.texture);
  }

  buffers(gl: WebGLRenderingContext, viewport: Viewport): TextureBuffers {
    if (this.textureBuffers) return this.textureBuffers;
    const frameBuffer = gl.createFramebuffer();
    const width = viewport[2] - viewport[0];
    const height = viewport[3] - viewport[1];
    this.textureBuffers = {
      frameBuffers: [frameBuffer],
      renderBuffers: [renderBuffer(gl, frameBuffer, width, height)],
    };
    this.texture = texture2DFromFramebuffer(gl, frameBuffer, width, height);
    return this.textureBuffers;
  }
}

/**
 * Sends a 2D texture uniform to a shader.
 */
export const Texture2DUniform =
  (name: string, data?: IsOrReturns<TexImageSource>) =>
    new Texture2DUniformImpl(UniformType.TEXTURE, name, data);

class CubeTextureImpl extends TextureUniform<CubeTexSource> {
  private validateData() {
    if (!isCube(this.data())) {
      throw new Error(
        'You must provide an object with "posx", "negx", "posy", "negy", ' +
        '"posz", and "negz" keys');
    }
  }

  set(dataOrCb: IsOrReturns<CubeTexSource>) {
    this.dataOrCb = dataOrCb;
    this.validateData();
    this.texture = undefined;
    return this;
  }

  prepare(gl: WebGLRenderingContext, program: WebGLProgram) {
    if (isNaN(this.offset)) {
      this.offset = newTextureOffset(program, this.name);
    }
    if (this.shouldBuildTexture()) {
      this.texture = cubeTexure(gl, this.data());
    }
  }

  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    sendCubeTexture(gl, program, this.name, this.offset, this.texture);
  }
  
  buffers(gl: WebGLRenderingContext, viewport: Viewport): TextureBuffers {
    throw new Error('not implemented');
  }
}

export const CubeTextureUniform =
  (name: string, data?: IsOrReturns<CubeTexSource>) =>
    new CubeTextureImpl(UniformType.TEXTURE, name, data);
