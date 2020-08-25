export type Attribute =
    (gl: WebGLRenderingContext, program: WebGLProgram) => void;

type AttributeData = number[] | BufferSource;

type AttributeFunc = (name: string,
                      data: AttributeData,
                      indices?: AttributeData) => Attribute;

const attribute = (): AttributeFunc =>
  (name: string, data: AttributeData, indices?: AttributeData) => {
    let buffer: WebGLBuffer;
    let indicesBuffer: WebGLBuffer;
    let location: number;

    return (gl: WebGLRenderingContext, program: WebGLProgram) => {
      buffer = gl.createBuffer();
      if (indices) {
        indicesBuffer = gl.createBuffer();
      }
      location = gl.getAttribLocation(program, name);
    };
  };

export const FloatAttribute: AttributeFunc = attribute();

export const Vec2Attribute: AttributeFunc = attribute();

export const Vec3Attribute: AttributeFunc = attribute();

export const Vec4Attribute: AttributeFunc = attribute();

export const Mat2Attribute: AttributeFunc = attribute();

export const Mat3Attribute: AttributeFunc = attribute();

export const Mat4Attribute: AttributeFunc = attribute();
