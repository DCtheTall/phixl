const {
  PLANE_VERTICES_TRIANGLE_STRIP,
  Shader,
  Vec2Attribute,
  FloatUniform,
} = require('../../../dist');

const vertexShader = require('./vertex.glsl').default;
const fragmentShader = require('./fragment.glsl').default;

const canvas = document.getElementById('canvas');

const N_VERTICES = 4;

Shader(N_VERTICES, vertexShader, fragmentShader, {
  attributes: {
    aPosition: Vec2Attribute('a_Position', PLANE_VERTICES_TRIANGLE_STRIP),
  },
  uniforms: {
    uRed: FloatUniform('u_Red', 0.5),
    uGreen: FloatUniform('u_Green', 0.2),
    uBlue: FloatUniform('u_Blue', 0.6),
  },
})(canvas);