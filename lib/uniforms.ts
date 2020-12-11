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
  CubeOr,
  Matrix,
  Matrix4,
  Vector3,
  Vector4,
  cubeFaces,
  identity,
  inverse,
  isCube,
  isVector3,
  lookAt,
  perspective,
  rotate,
  scale,
  translate,
  transpose,
} from './math';

type IsOrReturns<T> = T | (() => T);

/**
 * Types of data that uniforms accept.
 */
export type UniformData = number | Float32List | CubeOr<TexImageSource>;

export abstract class Uniform<Data extends UniformData> {
  constructor(
    protected readonly type_: UniformType,
    public readonly name: string,
    protected dataOrCb_?: IsOrReturns<Data>,
  ) {}

  static checkType(u: Uniform<UniformData>, wantType: UniformType) {
    if (u.type_ !== wantType) {
      throw new TypeError(
        `Expected uniform with type ${wantType} got type ${u.type_}`);
    }
  }

  set(dataOrCb: IsOrReturns<Data>) {
    this.dataOrCb_ = dataOrCb;
    return this;
  }

  data() {
    if (typeof this.dataOrCb_ === 'function') {
      return (this.dataOrCb_ as () => Data)();
    }
    return this.dataOrCb_;
  }

  // virtual
  send(gl: WebGLRenderingContext, program: WebGLProgram) {}
}

type BytesUniformType =
  UniformType.BOOLEAN | UniformType.FLOAT | UniformType.INTEGER;

class BytesUniform extends Uniform<number> {
  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    if (isNaN(this.data())) {
      throw TypeError(`Data for ${this.type_} uniform should be a number`);
    }
    sendBytesUniform(gl, program, this.name, this.type_, this.data());
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

  private validateData_() {
    if (this.type_ == UniformType.VECTOR) {
      if (this.data().length != this.dimension) {
        throw new TypeError(
          `Dimension mismatch for a ${this.type_}${this.dimension} uniform`);
      }
    } else {
      if (this.data().length != this.dimension ** 2) {
        throw new TypeError(
          `Dimension mismatch for a ${this.type_}${this.dimension} uniform`);
      }
    }
  }

  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    this.validateData_();
    if (this.type_ === UniformType.VECTOR) {
      sendVectorUniform(gl, program, this.name, this.dimension, this.data());
    } else {
      sendMatrixUniform(gl, program, this.name, this.dimension, this.data());
    }
  }

  set(dataOrCb: IsOrReturns<Float32List>) {
    this.dataOrCb_ = dataOrCb;
    this.validateData_();
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
 * View matrix uniform with accessor and mutator methods for
 * the 
 */
export class ViewMatUniformImpl extends SequenceUniform {
  constructor(
    name: string,
    private eye_: Vector3,
    private at_: Vector3,
    private up_: Vector3,
  ) {
    super(
      UniformType.MATRIX, name, 4,
      () => lookAt(this.eye_, this.at_, this.up_));
  }

  eye(): Vector3 {
    return [...this.eye_];
  }

  at(): Vector3 {
    return [...this.at_];
  }

  up(): Vector3 {
    return [...this.up_];
  }

  private static validateData_(data: unknown) {
    if (!isVector3(data)) {
      throw new Error('Expected 3 numbers as arguments');
    }
  }

  setEye(...eye: Vector3) {
    ViewMatUniformImpl.validateData_(eye);
    this.eye_ = eye;
  }

  setAt(...at: Vector3) {
    ViewMatUniformImpl.validateData_(at);
    this.at_ = at.slice(0, 3) as Vector3;
  }

  setUp(...up: Vector3) {
    ViewMatUniformImpl.validateData_(up);
    this.up_ = [...up];
  }
}

/**
 * Sends a view matrix uniform for the given
 * eye, at, and up vectors.
 * 
 * TODO add some API surface for changing the vectors easily.
 */
export const ViewMatUniform =
  (name: string, eye: Vector3, at: Vector3, up: Vector3) =>
    new ViewMatUniformImpl(name, eye, at, up);

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
export type TextureData = CubeOr<TexImageSource>;

interface TextureBuffers {
  frameBuffer: WebGLFramebuffer | Cube<WebGLFramebuffer>;
  renderBuffer: WebGLFramebuffer | Cube<WebGLRenderbuffer>;
}

export class TextureUniform<Data extends TextureData> extends Uniform<Data> {
  protected offset_: number;
  protected texture_: WebGLTexture;
  protected textureBuffers_: TextureBuffers;

  protected shouldBuildTexture_() {
    return !this.textureBuffers_ // Not a texture whose source is a framebuffer.
      && this.dataOrCb_ // Has data. TODO caching?
      && (!this.texture_ || isVideo(this.data()));
  }

  prepare(gl: WebGLRenderingContext, p: WebGLProgram) {
    throw new Error('Virtual method should not be invoked');
  }

  buffers(gl: WebGLRenderingContext, v: Viewport): TextureBuffers {
    throw new Error('Virtual method should not be invoked');
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
    this.dataOrCb_ = dataOrCb;
    this.texture_ = undefined;
    return this;
  }

  prepare(gl: WebGLRenderingContext, program: WebGLProgram) {
    if (isNaN(this.offset_)) {
      this.offset_ = newTextureOffset(program, this.name);
    }
    if (this.shouldBuildTexture_()) {
      this.texture_ = texture2d(gl, this.data());
    }
  }

  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    send2DTexture(gl, program, this.name, this.offset_, this.texture_);
  }

  buffers(gl: WebGLRenderingContext, viewport: Viewport): TextureBuffers {
    if (this.textureBuffers_) return this.textureBuffers_;
    const frameBuffer = gl.createFramebuffer();
    const [,, width, height] = viewport;
    this.textureBuffers_ =
      {frameBuffer, renderBuffer: renderBuffer(gl, frameBuffer, width, height)};
    this.texture_ = texture2DFromFramebuffer(gl, frameBuffer, width, height);
    return this.textureBuffers_;
  }
}

/**
 * Sends a 2D texture uniform to a shader.
 */
export const Texture2DUniform =
  (name: string, data?: IsOrReturns<TexImageSource>) =>
    new Texture2DUniformImpl(UniformType.TEXTURE, name, data);

class CubeTextureImpl extends TextureUniform<Cube<TexImageSource>> {
  private validateData() {
    if (!isCube(this.data())) {
      throw new Error(
        'You must provide an object with "posx", "negx", "posy", "negy", ' +
        '"posz", and "negz" keys');
    }
  }

  set(dataOrCb: IsOrReturns<Cube<TexImageSource>>) {
    this.dataOrCb_ = dataOrCb;
    this.validateData();
    this.texture_ = undefined;
    return this;
  }

  prepare(gl: WebGLRenderingContext, program: WebGLProgram) {
    if (isNaN(this.offset_)) {
      this.offset_ = newTextureOffset(program, this.name);
    }
    if (this.shouldBuildTexture_()) {
      this.texture_ = cubeTexure(gl, this.data());
    }
  }

  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    sendCubeTexture(gl, program, this.name, this.offset_, this.texture_);
  }
  
  buffers(gl: WebGLRenderingContext, viewport: Viewport): TextureBuffers {
    if (this.textureBuffers_) return this.textureBuffers_;
    const fBuffers: Partial<Cube<WebGLFramebuffer>> = {};
    const rBuffers: Partial<Cube<WebGLRenderbuffer>> = {};
    const width = viewport[2] - viewport[0];
    const height = viewport[3] - viewport[1];
    for (const cf of cubeFaces()) {
      fBuffers[cf] = gl.createFramebuffer();
      rBuffers[cf] = renderBuffer(gl, fBuffers[cf], width, height);
    } 
    this.textureBuffers_ = {frameBuffer: fBuffers, renderBuffer: rBuffers};
    return this.textureBuffers_;
  }
}

/**
 * Sends a cube texture uniform to a shader.
 */
export const CubeTextureUniform =
  (name: string, data?: IsOrReturns<Cube<TexImageSource>>) =>
    new CubeTextureImpl(UniformType.TEXTURE, name, data);

// TODO CubeCameraUniform based on NormalMatUniform and CubeTextureUniform
