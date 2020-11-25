const {
  CUBE_N_VERTICES,
  CUBE_VERTICES,
  CUBE_TEX_COORDS,
  CUBE_INDICES,
  ModelMatUniform,
  Shader,
  PerspectiveMatUniform,
  Texture2DUniform,
  Vec2Attribute,
  Vec3Attribute,
  ViewMatUniform,
} = require('../../../dist');

function main() {
  const vertexShader = require('./vertex.glsl').default;
  const fragmentShader = require('./fragment.glsl').default;

  const canvas = document.getElementById('canvas');
  const img = document.getElementById('texture');

  const shader = Shader(CUBE_N_VERTICES, vertexShader, fragmentShader, {
    mode: WebGLRenderingContext.TRIANGLES,
    drawElements: true,
    attributes: [
      Vec3Attribute('a_Vertices', CUBE_VERTICES, CUBE_INDICES),
      Vec2Attribute('a_TexCoords', CUBE_TEX_COORDS, CUBE_INDICES),
    ],
    uniforms: [
      ModelMatUniform('u_ModelMat', {
        translate: [0, 0, -5],
        rotate: [Math.PI / 4, 1, 1, 0],
      }),
      Texture2DUniform('u_Texture', img),
      ViewMatUniform('u_ViewMat', [0, 0, 5], [0, 0, 0], [0, 1, 0]),
      PerspectiveMatUniform('u_PerspectiveMat', Math.PI / 4, 1, 0, 1e6),
    ],
  });

  shader(canvas);
}

document.body.onload = main;
