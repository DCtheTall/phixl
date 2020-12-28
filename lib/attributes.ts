/**
 * @fileoverview Shader attributes module.
 */

import {sendAttribute, sendMatrixAttribute} from './gl';

/**
 * Different types of data attributes can use. For matrix
 * attributes we use an array of buffers which hold the matrix
 * values as a sequence of vectors in column-major order.
 */
export type AttributeData = BufferSource | BufferSource[];

/**
 * Abstraction for sending data to shaders in attributes.
 */
export class Attribute<Data extends AttributeData> {
  protected buffer_: WebGLBuffer;

  constructor(
    protected readonly name_: string,
    protected readonly dimension_: number,
    protected data_: Data,
  ) {}

  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    if (!this.buffer_) this.buffer_ = gl.createBuffer();
    sendAttribute(
      gl, program, this.buffer_, this.name_, this.data_ as BufferSource,
      this.dimension_);
  }
}

type AttributeBuilder = (name: string, data: BufferSource) =>
  Attribute<BufferSource>;

/**
 * Returns an attribute builder function for the appropriate type.
 */
const attribute = (dimension: number): AttributeBuilder =>
  (name: string, data: BufferSource) =>
    new Attribute(name, dimension, data);

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

class MatrixAttribute extends Attribute<BufferSource[]> {
  constructor(
    name: string,
    dimension: number,
    data: BufferSource[],
  ) {
    super(name, dimension, data);
  }

  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    if (!this.buffer_) this.buffer_ = gl.createBuffer();
    sendMatrixAttribute(
      gl, program, this.buffer_, this.name_, this.data_, this.dimension_);
  }
}

type MatAttributeBuilder = (name: string, data: BufferSource[]) =>
  MatrixAttribute;

const matrixAttribute = (dimension: number): MatAttributeBuilder =>
  (name: string, data: BufferSource[]) =>
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
