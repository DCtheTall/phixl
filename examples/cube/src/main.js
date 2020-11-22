const {
  PLANE_VERTICES,
  PLANE_TEX_COORDS,
  IdentityMat4Uniform,
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

  const shader = Shader(N_VERTICES, vertexShader, fragmentShader, {
    attributes: [
      Vec2Attribute('a_Position', PLANE_VERTICES),
      Vec2Attribute('a_TexCoords', PLANE_TEX_COORDS),
    ],
    uniforms: [
      Texture2DUniform('u_Texture', textureImg),
      IdentityMat4Uniform('u_ModelViewMat'),
    ],
  })
  shader(canvas);
}

document.getElementById('texture').onload = main;