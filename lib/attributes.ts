/**
 * @fileoverview Shader attributes module.
 */

import {sendAttribute, sendMatrixAttribute} from './gl';

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
  (name: string, data: BufferSource) =>
    (gl: WebGLRenderingContext, program: WebGLProgram) =>
      sendAttribute(gl, program, name, data, dimension);

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
    (gl: WebGLRenderingContext, program: WebGLProgram) =>
      sendMatrixAttribute(gl, program, name, data, dimension);

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
