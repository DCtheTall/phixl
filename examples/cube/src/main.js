const {
  PLANE_VERTICES,
  PLANE_TEX_COORDS,
  IdentityMat4Uniform,
  Shader,
  Vec2Attribute,
  Texture2DUniform,
  Translate,
} = require('../../../dist');

function main() {
  const vertexShader = require('./vertex.glsl').default;
  const fragmentShader = require('./fragment.glsl').default;

  const canvas = document.getElementById('canvas');
  const img = document.getElementById('texture');

  const N_VERTICES = 4;

  const shader = Shader(N_VERTICES, vertexShader, fragmentShader, {
    attributes: [
      Vec2Attribute('a_PlanePosition', PLANE_VERTICES),
      Vec2Attribute('a_PlaneTexCoords', PLANE_TEX_COORDS),
    ],
    uniforms: [
      Texture2DUniform('u_Texture', img),
      Translate(0, 0, -10)(IdentityMat4Uniform('u_ModelViewMat')),
    ],
  });

  shader(canvas);
}

document.body.onload = main;
