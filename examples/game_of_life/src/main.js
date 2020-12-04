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
const BLACK = '#000';
const WHITE = '#fff';

/**
 * Draw a canvas with white or black pixels randomly to start.
 */
const noisyCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < CANVAS_SIZE; i++)
  for (let j = 0; j < CANVAS_SIZE; j++) {
    ctx.fillStyle = Math.random() >= 0.5 ? BLACK : WHITE;
    ctx.fillRect(i, j, 1, 1);
  }
  return canvas;
};

/**
 * Clone a canvas to a new one.
 */
const cloneCanvas = (canvas) => {
  const result = document.createElement('canvas');
  result.width = canvas.width;
  result.height = canvas.height;
  ctx = result.getContext('2d');
  ctx.drawImage(canvas, 0, 0);
  return result;
};

const main = () => {
  const canvas = document.getElementById('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  // Load each shader source as a JS string.
  const vertShaderSrc = require('./vertex.glsl').default;
  const canvasFragShaderSrc = require('./canvas.fragment.glsl').default;
  const cellsFragShaderSrc = require('./cells.fragment.glsl').default;

  const attributes = [
    Vec2Attribute('a_Position', PLANE_VERTICES),
    Vec2Attribute('a_TexCoord', PLANE_TEX_COORDS),
  ];
  const prevCells = Texture2DUniform('u_PreviousCells', noisyCanvas());
  const curCells = Texture2DUniform('u_CurrentCells');

  // Shader which computes the next generation for Game of Life.
  const cellsShader = Shader(
    PLANE_N_VERTICES, vertShaderSrc, cellsFragShaderSrc, {
      attributes,
      uniforms: [
        Vec2Uniform('u_Resolution', [CANVAS_SIZE, CANVAS_SIZE]),
        prevCells,
      ],
    });

  // Shader which renders the current game board to a canvas.
  const canvasShader = Shader(
    PLANE_N_VERTICES, vertShaderSrc, canvasFragShaderSrc,
    {attributes, uniforms: [curCells]});

  const animate = () => {
    // Render the current game board to a frame.
    cellsShader(curCells);

    // Render the current cells to a canvas.
    canvasShader(canvas);

    // Update the texture in the shader for computing the next generation
    // by cloning the canvas in the DOM to the previous board texture.
    prevCells.set(cloneCanvas(canvas));

    // Recursively call animate on next paint.
    window.requestAnimationFrame(animate);
  };
  animate();
}

document.body.onload = main;
