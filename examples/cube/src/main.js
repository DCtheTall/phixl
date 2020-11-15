const {
  PLANE_VERTICES,
  PLANE_TEX_COORDS,
  Shader,
  Vec2Attribute,
  Texture2DUniform,
} = require('../../../dist');

function main() {
  const vertexShader = require('./vertex.glsl').default;
  const fragmentShader = require('./fragment.glsl').default;

  const canvas = document.getElementById('canvas');
  const textureImg = document.getElementById('texture');

  const N_VERTICES = 4;

  Shader(N_VERTICES, vertexShader, fragmentShader, {
    attributes: {
      aPosition: Vec2Attribute('a_Position', PLANE_VERTICES),
      aTexCoords: Vec2Attribute('a_TexCoords', PLANE_TEX_COORDS),
    },
    uniforms: {
      uTexture: Texture2DUniform('u_Texture', textureImg),
    },
  })(canvas);
}

document.getElementById('texture').onload = main;