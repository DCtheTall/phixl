/**
 * @fileoverview Shader uniforms module.
 */

export type Uniform = (gl: WebGLRenderingContext,
                       program: WebGLProgram) => void;

type UniformBuilder<DataType> = (name: string, data: DataType) => Uniform;

enum NumberUniformType {
  BOOLEAN = 'boolean',
  FLOAT = 'float',
  INTEGER = 'integer',
}

/**
 * Create a builder function for each type of numeric uniform.
 */
const numberUniform = (type: NumberUniformType): UniformBuilder<number> =>
  (name: string, data: number) =>
    (gl: WebGLRenderingContext, program: WebGLProgram) => {
      if (isNaN(data)) {
        throw TypeError(`Data for ${type} uniform should be a number`);
      }
      const loc = gl.getUniformLocation(program, name);
      switch (type) {
        case NumberUniformType.BOOLEAN:
          gl.uniform1i(loc, data);
        case NumberUniformType.FLOAT:
          gl.uniform1f(loc, data);
        case NumberUniformType.INTEGER:
          gl.uniform1i(loc, data);
      }
    };

export const BooleanUniform = numberUniform(NumberUniformType.BOOLEAN);

export const FloatUniform = numberUniform(NumberUniformType.FLOAT);

export const IntegerUniform = numberUniform(NumberUniformType.INTEGER);

enum UniformType {
  VECTOR = 'vec',
  MATRIX = 'mat',
}

/**
 * Creates builder functions for vector and matrix uniforms.
 */
const uniform = (type: UniformType, dimension: number): UniformBuilder<Float32List> =>
  (name: string, data: Float32List) =>
    (gl: WebGLRenderingContext, program: WebGLProgram) => {
      const loc = gl.getUniformLocation(program, name);
      if (type == UniformType.VECTOR) {
        if (data.length != dimension) {
          throw new TypeError(
              `Dimension mismatch for a ${type}${dimension} uniform`);
        }
        switch (dimension) {
          case 2:
            gl.uniform2fv(loc, data);
          case 3:
            gl.uniform3fv(loc, data);
          case 4:
            gl.uniform4fv(loc, data);
        }
      } else {
        if (data.length != dimension ** 2) {
          throw new TypeError(
              `Dimension mismatch for a ${type}${dimension} uniform`);
        }
        switch (dimension) {
          case 2:
            gl.uniformMatrix2fv(loc, false, data);
          case 3:
            gl.uniformMatrix3fv(loc, false, data);
          case 4:
            gl.uniformMatrix4fv(loc, false, data);
        }
      }
    };

export const Vec2Uniform = uniform(UniformType.VECTOR, 2);

export const Vec3Uniform = uniform(UniformType.VECTOR, 3);

export const Vec4Uniform = uniform(UniformType.VECTOR, 4);

export const Mat2Uniform = uniform(UniformType.MATRIX, 2);

export const Mat3Uniform = uniform(UniformType.MATRIX, 3);

export const Mat4Uniform = uniform(UniformType.MATRIX, 4);
