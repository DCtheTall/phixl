/**
 * @fileoverview Shader uniforms module.
 */

import {
  UniformType,
  Viewport,
  cubeTexure,
  cubeTextureFromFramebuffer,
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
  CubeFace,
  CubeOr,
  Dimension,
  Matrix,
  Matrix3,
  Matrix4,
  Vector3,
  Vector4,
  add,
  cube,
  cubeFaces,
  identity,
  isCube,
  isVector3,
  lookAt,
  multiply,
  perspective,
  rotate,
  scale,
  translate,
} from './math';

type IsOrReturns<T> = T | (() => T);

/**
 * Types of data that uniforms accept.
 */
export type UniformData = number | Float32List | CubeOr<TexImageSource>;

/**
 * Uniform base class. All uniforms are a superclass of this
 * class.
 */
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

  static dataOrCallback<Data extends UniformData>(u: Uniform<Data>):
    IsOrReturns<Data> {
    return u.dataOrCb_;
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

  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    throw new Error('Virtual method should not be invoked');
  }
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

interface ModelMatOptions {
  scale?: number | Vector3;
  rotate?: Vector4,
  translate?: Vector3,
}

class ModelMatUniformImpl extends SequenceUniform {
  private scaleMatrix_: Matrix4;
  private rotationMatrix_: Matrix3;
  private translation_: Vector3;

  constructor(name: string, opts: ModelMatOptions) {
    super(UniformType.MATRIX, name, 4, () => this.matrix());
    this.scaleMatrix_ = identity(4) as Matrix4;
    if (opts.scale) {
      if (typeof opts.scale === 'number') {
        this.scaleMatrix_ = scale(this.scaleMatrix_, opts.scale);
      } else {
        this.scaleMatrix_ = scale(this.scaleMatrix_, ...opts.scale);
      }
    }
    this.rotationMatrix_ = identity(3) as Matrix3;
    if (opts.rotate) {
      this.rotationMatrix_ = rotate(this.rotationMatrix_, ...opts.rotate);
    }
    this.translation_ = [0, 0, 0];
    if (opts.translate) this.translation_ = opts.translate;
  }

  scaleMatrix(): Matrix4 {
    return [...this.scaleMatrix_];
  }

  rotationMatrix(): Matrix3 {
    return [...this.rotationMatrix_];
  }

  private rotationMatrix4_(): Matrix4 {
    const R = this.rotationMatrix_;
    return [
      R[0], R[1], R[2], 0,
      R[3], R[4], R[5], 0,
      R[6], R[7], R[8], 0,
      0, 0, 0, 1,
    ];
  }

  translation(): Vector3 {
    return [...this.translation_];
  }

  matrix(): Matrix4 {
    return translate(
      multiply(this.rotationMatrix4_(), this.scaleMatrix()) as Matrix4,
      ...this.translation_);
  }
  
  scale(...args: number[]) {
    this.scaleMatrix_ = scale(this.scaleMatrix_, ...args);
  }

  setScale(...args: number[]) {
    this.scaleMatrix_ = scale(identity(4) as Matrix4, ...args);
  }

  rotate(theta: number, ...axis: Vector3) {
    this.rotationMatrix_ = rotate(this.rotationMatrix_, theta, ...axis);
  }

  setRotate(theta: number, ...axis: Vector3) {
    this.rotationMatrix_ = rotate(identity(3) as Matrix3, theta, ...axis);
  }

  translate(...args: Vector3) {
    args = args.slice(0, 3) as Vector3;
    if (!isVector3(args)) {
      throw new Error('Expected 3 numeric arguments');
    }
    this.translation_ = add(this.translation_, args);
  }

  setTranslation(...args: Vector3) {
    args = args.slice(0, 3) as Vector3;
    if (!isVector3(args)) {
      throw new Error('Expected 3 numeric arguments');
    }
    this.translation_ = args;
  }
}

/**
 * Sends a model matrix to a shader as a uniform that applies
 * a scale, rotation, and translation (in that order).
 */
export const ModelMatUniform =
  (name: string, opts: ModelMatOptions = {}): ModelMatUniformImpl =>
    new ModelMatUniformImpl(name, opts);
  

/**
 * Sends the resulting normal matrix for a given
 * model matrix to a shader.
 * 
 * The normal matrix is the inverse transpose of
 * the rotation component of the model matrix.
 * Since for any rotation matrix R, it's inverse is
 * R^T.
 */
export const NormalMatUniform = (name: string, modelMat: ModelMatUniformImpl) => {
  return sequenceUniform(
    UniformType.MATRIX,
    3,
  )(name, () => modelMat.rotationMatrix()) as SequenceUniform;
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

  private static validateVector3 = (data: unknown) => {
    if (!isVector3(data)) {
      throw new Error('Expected 3 numbers as arguments');
    }
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

  setEye(...eye: Vector3) {
    ViewMatUniformImpl.validateVector3(eye);
    this.eye_ = eye;
  }

  setAt(...at: Vector3) {
    ViewMatUniformImpl.validateVector3(at);
    this.at_ = at.slice(0, 3) as Vector3;
  }

  setUp(...up: Vector3) {
    ViewMatUniformImpl.validateVector3(up);
    this.up_ = [...up];
  }
}

/**
 * Sends a view matrix uniform for the given
 * eye, at, and up vectors.
 */
export const ViewMatUniform =
  (name: string, eye: Vector3, at: Vector3, up: Vector3) =>
    new ViewMatUniformImpl(name, eye, at, up);

class PerspectiveMatUniformImpl extends SequenceUniform {
  constructor(
    name: string,
    private fovy_: number,
    private aspect_: number,
    private near_: number,
    private far_: number | null,
  ) {
    super(
      UniformType.MATRIX, name, 4,
      () => perspective(this.fovy_, this.aspect_, this.near_, this.far_));
  }

  fovy() {
    return this.fovy_;
  }

  aspect() {
    return this.aspect_;
  }

  near() {
    return this.near_;
  }

  far() {
    return this.far_;
  }

  setFovy(fovy: number) {
    this.fovy_ = fovy;
  }

  setAspect(aspect: number) {
    this.aspect_ = aspect;
  }

  setNear(near: number) {
    this.near_ = near;
  }

  setFar(far: number) {
    this.far_ = far;
  }
}

/**
 * Sends a perspective 4D matrix uniform.
 */
export const PerspectiveMatUniform = (name: string,
                                      fovy: number,
                                      aspect: number,
                                      near: number,
                                      far: number | null = null) =>
  new PerspectiveMatUniformImpl(name, fovy, aspect, near, far);

/**
 * Possible types to use as texture data sources.
 */
export type TextureData = CubeOr<TexImageSource>;

interface Texture2DBuffers {
  frameBuffer: WebGLFramebuffer;
  renderBuffer: WebGLRenderbuffer;
}

type CubeTextureBuffers =
  {[k in keyof Texture2DBuffers]: Cube<Texture2DBuffers[k]>};

type TextureBuffers = Texture2DBuffers | CubeTextureBuffers;

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

  set(dataOrCb: IsOrReturns<Data>): this {
    this.dataOrCb_ = dataOrCb;
    this.texture_ = undefined;
    return this;
  }
}

/**
 * Tests if a uniform is for a texture.
 */
export const isTextureUniform =
  (u: Uniform<UniformData>): u is TextureUniform<TextureData> =>
    u instanceof TextureUniform;

/**
 * Implementation of a 2D texture uniform.
 */
export class Texture2DUniformImpl extends TextureUniform<TexImageSource> {
  protected textureBuffers_: Texture2DBuffers;

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

  buffers(gl: WebGLRenderingContext, viewport: Viewport): Texture2DBuffers {
    if (this.textureBuffers_) return this.textureBuffers_;
    const frameBuffer = gl.createFramebuffer();
    const [,, width, height] = viewport;
    this.textureBuffers_ = {
      frameBuffer,
      renderBuffer: renderBuffer(gl, frameBuffer, width, height),
    };
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

export class CubeTextureImpl extends TextureUniform<Cube<TexImageSource>> {
  protected textureBuffers_: CubeTextureBuffers;

  private validateData() {
    if (!isCube(this.data())) {
      throw new Error(
        'You must provide an object with "posx", "negx", "posy", "negy", ' +
        '"posz", and "negz" keys');
    }
  }

  set(dataOrCb: IsOrReturns<Cube<TexImageSource>>): this {
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
  
  buffers(gl: WebGLRenderingContext, viewport: Viewport): CubeTextureBuffers {
    if (this.textureBuffers_) return this.textureBuffers_;
    const [,, width, height] = viewport;
    const frameBufferCube = cube(() => gl.createFramebuffer());
    this.textureBuffers_ = {
      frameBuffer: frameBufferCube,
      renderBuffer: cube((cf: CubeFace) =>
        renderBuffer(gl, frameBufferCube[cf], width, height)),
    };
    this.texture_ = cubeTextureFromFramebuffer(
      gl, this.buffers(gl, viewport).frameBuffer, width, height);
    return this.textureBuffers_;
  }
}

/**
 * Sends a cube texture uniform to a shader.
 */
export const CubeTextureUniform =
  (name: string, data?: IsOrReturns<Cube<TexImageSource>>) =>
    new CubeTextureImpl(UniformType.TEXTURE, name, data);

/**
 * Tests if a uniform is a cube texture uniform.
 */
export const isCubeTextureUniform =
  (u: TextureUniform<CubeOr<TexImageSource>>): u is CubeTextureImpl =>
    u instanceof CubeTextureImpl

/**
 * Implementation of a cube camera uniform.
 */
export class CubeCameraUniformImpl extends CubeTextureImpl {
  private static upVectors: Cube<Vector3> = {
    posx: [0, -1, 0],
    negx: [0, -1, 0],
    posy: [0, 0, 1],
    negy: [0, 0, 1],
    posz: [0, -1, 0],
    negz: [0, -1, 0],
  };
  private static atVectors: Cube<Vector3> = {
    posx: [1, 0, 0],
    negx: [-1, 0, 0],
    posy: [0, 1, 0],
    negy: [0, -1, 0],
    posz: [0, 0, 1],
    negz: [0, 0, -1],
  };

  constructor(
    name: string,
    private position_: Vector3,
    private viewMat_: ViewMatUniformImpl,
    private perspectiveMat_: PerspectiveMatUniformImpl,
  ) {
    super(UniformType.TEXTURE, name);
    if (!isVector3(position_)) {
      throw new Error('Expected array of 3 arguments as the first argument');
    }
    Uniform.checkType(viewMat_, UniformType.MATRIX);
    SequenceUniform.checkDimension(viewMat_, 4);
  }

  set(dataOrCb: IsOrReturns<Cube<TexImageSource>>): never {
    throw new Error(
      'Cube camera uniforms should get their data from a shader');
  }

  render(renderShader: (cf: CubeFace) => void) {
    const fovy = this.perspectiveMat_.fovy();
    this.perspectiveMat_.setFovy(Math.PI / 2);

    const viewMatDataOrCb = Uniform.dataOrCallback(this.viewMat_);

    for (const cf of cubeFaces()) {
      const at = add(CubeCameraUniformImpl.atVectors[cf], this.position_);
      const up = CubeCameraUniformImpl.upVectors[cf];
      this.viewMat_.set(lookAt(this.position_, at, up));
      renderShader(cf);
    }

    this.viewMat_.set(viewMatDataOrCb);
    this.perspectiveMat_.setFovy(fovy);
  }
}

/**
 * Sends a cube texture to a shader rendered from
 * a cube camera.
 */
export const CubeCameraUniform = (name: string,
                                  position?: Vector3,
                                  viewMat?: ViewMatUniformImpl,
                                  perspectiveMat?: PerspectiveMatUniformImpl) => {
  if (!position) position = [0, 0, 0];
  if (!viewMat) {
    viewMat = new ViewMatUniformImpl('', [0, 0, 1], [0, 0, 0], [0, 1, 0]);
  }
  return new CubeCameraUniformImpl(name, position, viewMat, perspectiveMat);
};
