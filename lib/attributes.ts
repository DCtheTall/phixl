/**
 * @fileoverview Shader attributes module.
 */

import {sendAttribute, sendMatrixAttribute} from './gl';

/**
 * The type of data that can be sent to a shader as an attribute.
 */
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

  /**
   * Send the attribute data to the shader.
   */
  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    if (!this.buffer_) this.buffer_ = gl.createBuffer();
    sendAttribute(
      gl, program, this.buffer_, this.name_, this.data_ as Float32Array,
      this.dimension_);
  }

  /**
   * Get the number of vertices that will be sent to the shader.
   * This is only used if the shader is using gl.drawArrays(...).
   */
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

/**
 * Type of function used to create attributes.
 */
type AttributeBuilder =
  (name: string, data: Float32List) => Attribute<Float32List>;

/**
 * Returns an attribute builder function for the appropriate type.
 */
const attribute = (dimension: number): AttributeBuilder =>
  (name: string, data: Float32List) => new Attribute(name, dimension, data);

/**
 * Sends a float attribute to a shader.
 * @param name of the attribute in the shader
 * @param data the attribute will send
 */
export const FloatAttribute = attribute(1);

/**
 * Sends a 2-dimensional vector attribute to a shader.
 * @param name of the attribute in the shader
 * @param data the attribute will send
 */
export const Vec2Attribute = attribute(2);

/**
 * Sends a 3-dimensional vector attribute to a shader.
 * @param name of the attribute in the shader
 * @param data the attribute will send
 */
export const Vec3Attribute = attribute(3);

/**
 * Sends a 4-dimensional vector attribute to a shader.
 * @param name of the attribute in the shader
 * @param data the attribute will send
 */
export const Vec4Attribute = attribute(4);

/**
 * Abstraction for sending a matrix attribute to a shader.
 */
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

  /**
   * Send the data to the shader.
   */
  send(gl: WebGLRenderingContext, program: WebGLProgram) {
    if (!this.buffer_) this.buffer_ = gl.createBuffer();
    sendMatrixAttribute(
      gl, program, this.buffer_, this.name_, this.data_ as Float32Array[],
      this.dimension_);
  }
}

/**
 * Type of function used to create matrix attributes.
 */
type MatAttributeBuilder = (name: string, data: Float32List[]) =>
  MatrixAttribute;

/**
 * Returns a matrix attribute builder function for the appropriate type.
 */
const matrixAttribute = (dimension: number): MatAttributeBuilder =>
  (name: string, data: Float32List[]) =>
    new MatrixAttribute(name, dimension, data);

/**
 * Sends a 2-dimensional matrix attribute to a shader.
 * @param name of the attribute in the shader
 * @param data the attribute will send
 */
export const Mat2Attribute = matrixAttribute(2);

/**
 * Sends a 3-dimensional matrix attribute to a shader.
 * @param name of the attribute in the shader
 * @param data the attribute will send
 */
export const Mat3Attribute = matrixAttribute(3);

/**
 * Sends a 4-dimensional matrix attribute to a shader.
 * @param name of the attribute in the shader
 * @param data the attribute will send
 */
export const Mat4Attribute = matrixAttribute(4);
