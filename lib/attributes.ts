/**
 * @fileoverview Shader attributes module.
 */

export type Attribute =
    (gl: WebGLRenderingContext, program: WebGLProgram) => void;

type AttributeFunc = (name: string,
                      data: BufferSource) => Attribute;

// TODO matrix attributes.
/**
 * Returns an attribute builder function for the appropriate type.
 */
const attribute = (dimension: number): AttributeFunc =>
    (name: string, data: BufferSource) =>
      (gl: WebGLRenderingContext, program: WebGLProgram) => {
        const loc = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(loc);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.vertexAttribPointer(loc, dimension, gl.FLOAT, false, 0, 0);
      };

export const FloatAttribute: AttributeFunc = attribute(1);

export const Vec2Attribute: AttributeFunc = attribute(2);

export const Vec3Attribute: AttributeFunc = attribute(3);

export const Vec4Attribute: AttributeFunc = attribute(4);

export const Mat2Attribute: AttributeFunc = attribute(2);

export const Mat3Attribute: AttributeFunc = attribute(3);

export const Mat4Attribute: AttributeFunc = attribute(4);
