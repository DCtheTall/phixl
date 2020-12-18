const {
  PLANE_N_VERTICES,
  PLANE_VERTICES,
  PLANE_TEX_COORDS,
  Shader,
  Texture2DUniform,
  Vec2Attribute,
  Vec2Uniform,
} = require('../../../dist');

const CANVAS_SIZE = 600;

const renderExample = (video) => {
  // Get the canvas from the DOM.
  const canvas = document.getElementById('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  // Load the shaders, for this example I am using glslify-loader and raw-loader
  // to load the files into JS strings at build time.
  const vertShaderSrc = require('./vertex.glsl').default;
  const fragShaderSrc = require('./fragment.glsl').default;

  // Create the shader for the edge detection algorithm.
  const shader =
    Shader(PLANE_N_VERTICES, vertShaderSrc, fragShaderSrc, {
      attributes: [
        Vec2Attribute('a_Position', PLANE_VERTICES),
        Vec2Attribute('a_TexCoord', PLANE_TEX_COORDS),
      ],
      uniforms: [
        Vec2Uniform('u_Resolution', [CANVAS_SIZE, CANVAS_SIZE]),
        Texture2DUniform('u_Texture', video),
      ],
    });

  const animate = () => {
    // Render the shader to the canvas.
    shader(canvas);

    // // Recursively call animate on next paint.
    window.requestAnimationFrame(animate);
  };
  animate();
};

const main = async () => {
  // Get the video element from the DOM.
  const video = document.getElementById('video');

  // Get the webcam's video stream.
  const localStream =
    await navigator.mediaDevices.getUserMedia({video: true});

  // Set the video's source to the webcam's video stream.
  video.srcObject = localStream;

  // Play the video and then render the edge detection algorithm.
  video.play();
  video.onplaying = () => renderExample(video);
}

document.body.onload = main;
