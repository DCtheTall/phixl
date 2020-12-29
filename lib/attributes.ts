/**
 * @fileoverview Shader attributes module.
 */

import {sendAttribute, sendMatrixAttribute} from './gl';

export type AttributeData = Float32List|Float32List[];

/**
 * Abstraction for sending data to shaders in attributes.
 */
export class Attribute<Data extends AttributeData> {
  protected buffer_: WebGLBuffer;

  constructor(
    protected readonly name_: string,
    protected readonly dimension_: number,
    protected data_: Data,
  ) {
    if (Array.isArray(this.data_) && !isNaN(this.data_[0])) {
      this.data_ = new Float32Array(this.data_) as Data;
    }
  }

  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    if (!this.buffer_) this.buffer_ = gl.createBuffer();
    sendAttribute(
      gl, program, this.buffer_, this.name_, this.data_ as Float32Array,
      this.dimension_);
  }

  length() {
    if (this.data_ instanceof Float32Array) {
      let result = this.data_.byteLength / this.data_.BYTES_PER_ELEMENT;
      result /= this.dimension_;
      return result;
    } else {
      return this.data_.length / this.dimension_;
    }
  }
}

type AttributeBuilder =
  (name: string, data: Float32List) => Attribute<Float32List>;

/**
 * Returns an attribute builder function for the appropriate type.
 */
const attribute = (dimension: number): AttributeBuilder =>
  (name: string, data: Float32List) => new Attribute(name, dimension, data);

/**
 * Sends a float attribute to a shader.
 */
export const FloatAttribute = attribute(1);

/**
 * Sends a 2-dimensional vector attribute to a shader.
 */
export const Vec2Attribute = attribute(2);

/**
 * Sends a 3-dimensional vector attribute to a shader.
 */
export const Vec3Attribute = attribute(3);

/**
 * Sends a 4-dimensional vector attribute to a shader.
 */
export const Vec4Attribute = attribute(4);

class MatrixAttribute extends Attribute<Float32List[]> {
  constructor(
    name: string,
    dimension: number,
    data: Float32List[],
  ) {
    super(name, dimension, data);
    if (Array.isArray(data[0]) && Array.isArray(data[0][0])) {
      this.data_ = this.data_.map((arr) => new Float32Array(arr));
    }
  }

  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    if (!this.buffer_) this.buffer_ = gl.createBuffer();
    sendMatrixAttribute(
      gl, program, this.buffer_, this.name_, this.data_ as Float32Array[],
      this.dimension_);
  }
}

type MatAttributeBuilder = (name: string, data: Float32List[]) =>
  MatrixAttribute;

const matrixAttribute = (dimension: number): MatAttributeBuilder =>
  (name: string, data: Float32List[]) =>
    new MatrixAttribute(name, dimension, data);

/**
 * Sends a 2-dimensional matrix attribute to a shader.
 */
export const Mat2Attribute = matrixAttribute(2);

/**
 * Sends a 3-dimensional matrix attribute to a shader.
 */
export const Mat3Attribute = matrixAttribute(3);

/**
 * Sends a 4-dimensional matrix attribute to a shader.
 */
export const Mat4Attribute = matrixAttribute(4);
