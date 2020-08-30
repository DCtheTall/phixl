const {
  PLANE_VERTICES_TRIANGLE_STRIP,
  FloatAttribute,
  Vec2Attribute,
  Shader,
} = require('../../../dist');

const vertexShader = require('./vertex.glsl').default;
const fragmentShader = require('./fragment.glsl').default;

const canvas = document.getElementById('canvas');

Shader(4, vertexShader, fragmentShader, {
  attributes: {
    aPosition: Vec2Attribute('a_Position', PLANE_VERTICES_TRIANGLE_STRIP),
    aRed: FloatAttribute('a_Red', new Float32Array([1, 1, 0, 0])),
    aGreen: FloatAttribute('a_Green', new Float32Array([0, 1, 1, 0])),
    aBlue: FloatAttribute('a_Blue', new Float32Array([0, 0, 1, 1])),
  },
})(canvas);