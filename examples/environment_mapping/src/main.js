const {
  CUBE_N_VERTICES,
  CUBE_VERTICES,
  CUBE_INDICES,
  CubeTextureUniform,
  PerspectiveMatUniform,
  Shader,
  Vec3Attribute,
  ViewMatUniform,
} = require('../../../dist');

const CANVAS_SIZE = 600;

const main = () => {
  const canvas = document.getElementById('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  const skyboxVertSrc = require('./skybox.vertex.glsl').default;
  const skyboxFragSrc = require('./skybox.fragment.glsl').default;

  const skybox =
    Shader(CUBE_N_VERTICES, skyboxVertSrc, skyboxFragSrc, {
      mode: WebGLRenderingContext.TRIANGLES,
      indices: CUBE_INDICES,
      attributes: [Vec3Attribute('a_CubeVertex', CUBE_VERTICES)],
      uniforms: [
        ViewMatUniform(
          'u_ViewMat', /* eye */ [0, 0, 0], /* at */ [0, 0, -1],
          /* up */ [0, 1, 0]),
        PerspectiveMatUniform(
          'u_PerspectiveMat', /* fovy */ Math.PI / 3, /* aspect */ 1,
          /* near */ 1, /* far */ 1e6),
        CubeTextureUniform('u_Skybox', {
          posx: document.getElementById('skybox-right'),
          negx: document.getElementById('skybox-left'),
          posy: document.getElementById('skybox-top'),
          negy: document.getElementById('skybox-bottom'),
          posz: document.getElementById('skybox-front'),
          negz: document.getElementById('skybox-back'),
        }),
      ],
    });

  skybox(canvas);
};

document.body.onload = main;
