const {
  PLANE_N_VERTICES,
  PLANE_VERTICES,
  PLANE_TEX_COORDS,
  ModelMatUniform,
  Shader,
  PerspectiveMatUniform,
  Texture2DUniform,
  Vec2Attribute,
  ViewMatUniform,
} = require('../../../dist');

function main() {
  const vertexShader = require('./vertex.glsl').default;
  const fragmentShader = require('./fragment.glsl').default;

  const canvas = document.getElementById('canvas');
  const img = document.getElementById('texture');

  const shader = Shader(PLANE_N_VERTICES, vertexShader, fragmentShader, {
    attributes: [
      Vec2Attribute('a_PlanePosition', PLANE_VERTICES),
      Vec2Attribute('a_PlaneTexCoords', PLANE_TEX_COORDS),
    ],
    uniforms: [
      ModelMatUniform('u_ModelMat', {
        scale: 0.4,
        translate: [0, 0, -10],
      }),
      Texture2DUniform('u_Texture', img),
      ViewMatUniform('u_ViewMat', [0, 0, 0], [0, 0, -1], [0, 1, 0]),
      PerspectiveMatUniform('u_PerspectiveMat', Math.PI / 4, 1, 0, 10),
    ],
  });

  shader(canvas);
}

document.body.onload = main;
