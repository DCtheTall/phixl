const {
  CUBE_N_VERTICES,
  CUBE_VERTICES,
  CUBE_TEX_COORDS,
  CUBE_INDICES,
  CUBE_NORMALS,
  ModelMatUniform,
  NormalMatUniform,
  PerspectiveMatUniform,
  Shader,
  Texture2DUniform,
  Vec2Attribute,
  Vec3Attribute,
  ViewMatUniform,
} = require('../../../dist');

const CANVAS_SIZE = 512;

// Get the video from the DOM.
const video = document.getElementById('texture');

const main = () => {
  // Get the canvas from the DOM and set its dimensions.
  const canvas = document.getElementById('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  // Load the shaders, for this example I am using glslify-loader and raw-loader
  // to load the files into JS strings at build time.
  const vertexShader = require('./vertex.glsl').default;
  const fragmentShader = require('./fragment.glsl').default;

  // Create the model matrix uniform object.
  const modelMat = ModelMatUniform('u_ModelMat', {
    translate: [0, 0, 5],
    scale: 2,
  });

  // Build the shader that we will use to render the cube.
  // Shader returns a function which will render the shader to a
  // HTMLCanvasElement.
  const shader = Shader(CUBE_N_VERTICES, vertexShader, fragmentShader, {
    mode: WebGLRenderingContext.TRIANGLES,
    indices: CUBE_INDICES,
    attributes: [
      Vec3Attribute('a_Position', CUBE_VERTICES),
      Vec2Attribute('a_TexCoord', CUBE_TEX_COORDS),
      Vec3Attribute('a_Normal', CUBE_NORMALS),
    ],
    uniforms: [
      modelMat,
      ViewMatUniform(
        'u_ViewMat', /* eye */ [0, 0, -5], /* at */ [0, 0, 0],
        /* up */ [0, 1, 0]),
      PerspectiveMatUniform(
        'u_PerspectiveMat', /* fovy */ Math.PI / 3, /* aspect */ 1,
        /* near */ 1, /* far */ 1e6),
      // Normal matrix is automatically updated when model matrix is updated.
      NormalMatUniform('u_NormalMat', modelMat),
      // Send the video to the shader as a Texture2DUniform.
      Texture2DUniform('u_Texture', video),
    ],
  });

  // Render loop.
  const animate = () => {
    // ModelMatUniform has convenience methods for applying
    // transformations. You can use "rotate" for applying a rotation
    // to the existing rotation matrix, or you could use "setRotation"
    // to set the rotation matrix to apply the specific rotation.
    // Rotation and scale is always applied before translation.
    modelMat.rotate(
      /* theta */ Math.PI / 512, /* axis.x */ 2, /* axis.y */ 1,
      /* axis.z */ 0);

    // Render the shader on the given target.
    shader(canvas);

    // Call animate again on next frame.
    window.requestAnimationFrame(animate);
  };
  
  // Start the render loop.
  animate();
};

video.play();
video.oncanplaythrough = main;
