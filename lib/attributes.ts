/**
 * @fileoverview Shader attributes module.
 */

/**
 * Abstraction for sending data to shaders in attributes.
 */
export type Attribute = (gl: WebGLRenderingContext,
                         program: WebGLProgram) => void;

type AttributeBuilder = (name: string, data: BufferSource) => Attribute;

/**
 * Returns an attribute builder function for the appropriate type.
 */
const attribute = (dimension: number): AttributeBuilder =>
  (name: string, data: BufferSource, indices?: BufferSource) =>
    (gl: WebGLRenderingContext, program: WebGLProgram) => {
      const loc = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(loc);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.vertexAttribPointer(loc, dimension, gl.FLOAT, false, 0, 0);
    };

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

type MatAttributeBuilder = (name: string, data: BufferSource[]) => Attribute;

const matrixAttribute = (dimension: number): MatAttributeBuilder =>
  (name: string, data: BufferSource[]) =>
    (gl: WebGLRenderingContext, program: WebGLProgram) => {
      const loc = gl.getAttribLocation(program, name);
      for (let i = 0; i < dimension; i++) {
        gl.enableVertexAttribArray(loc + i);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, data[i], gl.STATIC_DRAW);
        gl.vertexAttribPointer(loc + i, dimension, gl.FLOAT, false, 0, 0);
      }
    };

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
