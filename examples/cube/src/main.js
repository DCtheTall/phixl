const {
  CUBE_N_VERTICES,
  CUBE_VERTICES,
  CUBE_TEX_COORDS,
  CUBE_INDICES,
  CUBE_NORMALS,
  FloatUniform,
  ModelMatUniform,
  NormalMatUniform,
  PerspectiveMatUniform,
  Shader,
  Texture2DUniform,
  Vec2Attribute,
  Vec3Attribute,
  Vec3Uniform,
  ViewMatUniform,
} = require('../../../dist');

function main() {
  const vertexShader = require('./vertex.glsl').default;
  const fragmentShader = require('./fragment.glsl').default;

  const canvas = document.getElementById('canvas');
  const img = document.getElementById('texture');

  const modelMat = ModelMatUniform('u_ModelMat', {
    rotate: [Math.PI / 4, 1, 1, 0],
    translate: [0, 0, -5],
    scale: 3,
  });

  const shader = Shader(CUBE_N_VERTICES, vertexShader, fragmentShader, {
    mode: WebGLRenderingContext.TRIANGLES,
    drawElements: true,
    attributes: [
      Vec3Attribute('a_Position', CUBE_VERTICES, CUBE_INDICES),
      Vec2Attribute('a_TexCoord', CUBE_TEX_COORDS, CUBE_INDICES),
      Vec3Attribute('a_Normal', CUBE_NORMALS, CUBE_INDICES),
    ],
    uniforms: [
      modelMat,
      Texture2DUniform('u_Texture', img),
      ViewMatUniform('u_ViewMat', [0, 0, 10], [0, 0, 0], [0, 1, 0]),
      PerspectiveMatUniform('u_PerspectiveMat', Math.PI / 4, 1, 1, 1e6),
      Vec3Uniform('u_LightPos', [-3, 20, 3]),
      Vec3Uniform('u_AmbientLight', [0.3, 0.3, 0.4]),
      Vec3Uniform('u_DiffuseLight', [1, 1, 0.8]),
      Vec3Uniform('u_SpecularLight', [1, 1, 1]),
      FloatUniform('u_SpecularExp', 50),
      NormalMatUniform('u_NormalMat', modelMat),
    ],
  });

  shader(canvas);
}

document.body.onload = main;
