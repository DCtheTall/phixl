const {
  CUBE_INDICES,
  CUBE_N_VERTICES,
  CUBE_NORMALS,
  CUBE_VERTICES,
  CubeTextureUniform,
  ModelMatUniform,
  NormalMatUniform,
  PerspectiveMatUniform,
  Shader,
  Vec3Attribute,
  ViewMatUniform,
  Vec3Uniform,
} = require('../../../dist');

const CANVAS_SIZE = 600;

const main = () => {
  // Get the canvas from the DOM and set its dimensions.
  const canvas = document.getElementById('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  // Load shaders for the background and cub.
  // For this example I am using glslify-loader and raw-loader
  // to load the files into JS strings at build time.
  const cubeVertSrc = require('./cube.vertex.glsl').default;
  const cubeFragSrc = require('./cube.fragment.glsl').default;
  const skyboxVertSrc = require('./skybox.vertex.glsl').default;
  const skyboxFragSrc = require('./skybox.fragment.glsl').default;

  // Both shaders render a cube, so we can use this
  // Vec3Attribute in both shaders.
  const cubeVertices = Vec3Attribute('a_CubeVertex', CUBE_VERTICES)

  // Create the model matrix uniform.
  const modelMat = ModelMatUniform('u_ModelMat', {
    scale: 2,
    translate: [0, 0, -10],
  });

  // Create the view and perspective matrix uniforms.
  const eyeVec = [0, 0, 0];
  const viewMat = ViewMatUniform(
    'u_ViewMat', eyeVec, /* at */ [0, 0, -1], /* up */ [0, 1, 0]);
  const perspectiveMat = PerspectiveMatUniform(
    'u_PerspectiveMat', /* fovy */ Math.PI / 3, /* aspect */ 1,
    /* near */ 1, /* far */ 1e6);

  // Create a cube texture from 6 images.
  const skyboxTexture = CubeTextureUniform('u_Skybox', {
    posx: document.getElementById('skybox-right'),
    negx: document.getElementById('skybox-left'),
    posy: document.getElementById('skybox-top'),
    negy: document.getElementById('skybox-bottom'),
    posz: document.getElementById('skybox-front'),
    negz: document.getElementById('skybox-back'),
  });

  // Create the shader for the skybox texture.
  const skybox =
    Shader(CUBE_N_VERTICES, skyboxVertSrc, skyboxFragSrc, {
      mode: WebGLRenderingContext.TRIANGLES,
      indices: CUBE_INDICES,
      attributes: [cubeVertices],
      uniforms: [
        viewMat,
        perspectiveMat,
        skyboxTexture,
      ],
    });

  // Create the shader for rendering the environment onto the cube.
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
        skyboxTexture,
        Vec3Uniform('u_CameraPosition', eyeVec),
      ],
    });

  const animate = () => {
    // Render the skybox to the canvas.
    skybox(canvas);

    // Apply a rotation to the cube model.
    modelMat.rotate(Math.PI / 512, 2, 1, 0);

    // Draw the environment onto a cube.
    drawCube(canvas);

    // Call animate again on next frame.
    window.requestAnimationFrame(animate);
  };
  animate();
};

document.body.onload = main;
