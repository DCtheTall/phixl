const {
  CUBE_INDICES,
  CUBE_N_VERTICES,
  CUBE_NORMALS,
  CUBE_VERTICES,
  CubeCameraUniform,
  CubeTextureUniform,
  ModelMatUniform,
  NormalMatUniform,
  PerspectiveMatUniform,
  Rotate,
  Shader,
  Vec3Attribute,
  ViewMatUniform,
  Vec3Uniform,
} = require('../../../dist');

const CANVAS_SIZE = 512;

const main = () => {
  const canvas = document.getElementById('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  // Load shaders for the background and cube.
  const cubeVertSrc = require('./cube.vertex.glsl').default;
  const cubeFragSrc = require('./cube.fragment.glsl').default;
  const skyboxVertSrc = require('./skybox.vertex.glsl').default;
  const skyboxFragSrc = require('./skybox.fragment.glsl').default;

  // Both shaders render a cube.
  const cubeVertices = Vec3Attribute('a_CubeVertex', CUBE_VERTICES)

  // Some uniforms can be shared across both shaders.
  const eyeVec = [0, 0, 5];
  const viewMat =
    ViewMatUniform(
      'u_ViewMat', eyeVec, /* at */ [0, 0, 0], /* up */ [0, 1, 0]);
  const perspectiveMat =
    PerspectiveMatUniform(
      'u_PerspectiveMat', /* fovy */ Math.PI / 3, /* aspect */ 1, /* near */ 1,
      /* far */ 1e3);

  const skybox =
    Shader(CUBE_N_VERTICES, skyboxVertSrc, skyboxFragSrc, {
      mode: WebGLRenderingContext.TRIANGLES,
      indices: CUBE_INDICES,
      attributes: [cubeVertices],
      uniforms: [
        viewMat,
        perspectiveMat,
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

  const rotate = Rotate(Math.PI / 512, 2, 1, 0);

  const modelMat = ModelMatUniform('u_ModelMat');
  const cubeCamera =
    CubeCameraUniform('u_CubeCamera', [0, 0, 0], viewMat, perspectiveMat);

  const drawCube =
    Shader(CUBE_N_VERTICES, cubeVertSrc, cubeFragSrc, {
      clear: false,
      mode: WebGLRenderingContext.TRIANGLES,
      indices: CUBE_INDICES,
      attributes: [
        cubeVertices,
        Vec3Attribute('a_CubeNormal', CUBE_NORMALS),
      ],
      uniforms: [
        modelMat,
        viewMat,
        perspectiveMat,
        NormalMatUniform('u_NormalMat', modelMat),
        cubeCamera,
        Vec3Uniform('u_CameraPosition', eyeVec),
      ],
    });

  const animate = () => {
    rotate(modelMat);
    skybox(canvas);
    skybox(cubeCamera);

    drawCube(canvas);
    window.requestAnimationFrame(animate);
  };
  animate();
};

document.body.onload = main;
