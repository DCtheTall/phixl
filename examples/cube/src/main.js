const {
  PLANE_VERTICES_TRIANGLE_STRIP,
  FloatAttribute,
  Mat2Attribute,
  Vec2Attribute,
  Shader,
} = require('../../../dist');

const vertexShader = require('./vertex.glsl').default;
const fragmentShader = require('./fragment.glsl').default;

const canvas = document.getElementById('canvas');

const N_VERTICES = 4;

Shader(N_VERTICES, vertexShader, fragmentShader, {
  attributes: {
    aPosition: Vec2Attribute('a_Position', PLANE_VERTICES_TRIANGLE_STRIP),
    aIdentity: Mat2Attribute('a_Identity', [
      new Float32Array([
        1, 0, 1, 0,
        1, 0, 1, 0,
      ]),
      new Float32Array([
        0, 1, 0, 1,
        0, 1, 0, 1,
      ]),
    ]),
    aRed: FloatAttribute('a_Red', new Float32Array([1, 0, 0, 1])),
    aGreen: FloatAttribute('a_Green', new Float32Array([0, 1, 0, 1])),
    aBlue: FloatAttribute('a_Blue', new Float32Array([0, 0, 1, 0])),
  },
})(canvas);