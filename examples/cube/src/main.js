const {
  PLANE_VERTICES,
  PLANE_TEX_COORDS,
  ModelMatUniform,
  Shader,
  Vec2Attribute,
  Texture2DUniform,
} = require('../../../dist');

function main() {
  const vertexShader = require('./vertex.glsl').default;
  const fragmentShader = require('./fragment.glsl').default;

  const canvas = document.getElementById('canvas');
  const img = document.getElementById('texture');

  const N_VERTICES = 4;

  const modelMat = ModelMatUniform('u_ModelMat', {
    scale: 0.4,
    translate: [0, 0, -10],
  });

  const shader = Shader(N_VERTICES, vertexShader, fragmentShader, {
    attributes: [
      Vec2Attribute('a_PlanePosition', PLANE_VERTICES),
      Vec2Attribute('a_PlaneTexCoords', PLANE_TEX_COORDS),
    ],
    uniforms: [
      modelMat,
      Texture2DUniform('u_Texture', img),
    ],
  });

  shader(canvas);
}

document.body.onload = main;
