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
  const canvas = document.getElementById('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  // Load each shader source as a JS string.
  const vertShaderSrc = require('./vertex.glsl').default;
  const fragShaderSrc = require('./fragment.glsl').default;

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
  const video = document.getElementById('video');
  const localStream =
    await navigator.mediaDevices.getUserMedia({video: true});
  video.srcObject = localStream;
  video.play();
  video.onplaying = () => renderExample(video);
}

document.body.onload = main;
