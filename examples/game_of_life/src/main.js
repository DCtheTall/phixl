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

  const vertShaderSrc = require('./vertex.glsl').default;
  const canvasFragShaderSrc = require('./canvas.fragment.glsl').default;
  const cellsFragShaderSrc = require('./cells.fragment.glsl').default;

  const attributes = [
    Vec2Attribute('a_Position', PLANE_VERTICES),
    Vec2Attribute('a_TexCoord', PLANE_TEX_COORDS),
  ];

  const prevCells = Texture2DUniform('u_PreviousCells', noisyCanvas());
  const curCells = Texture2DUniform('u_CurrentCells');

  const cellsShader = Shader(
    PLANE_N_VERTICES, vertShaderSrc, cellsFragShaderSrc, {
      attributes,
      uniforms: [
        Vec2Uniform('u_Resolution', [CANVAS_SIZE, CANVAS_SIZE]),
        prevCells,
      ],
    });

  const canvasShader = Shader(
    PLANE_N_VERTICES, vertShaderSrc, canvasFragShaderSrc,
    {attributes, uniforms: [curCells]});

  const animate = () => {
    cellsShader(curCells);
    canvasShader(canvas);
    prevCells.set(cloneCanvas(canvas));
    window.requestAnimationFrame(animate);
  };
  animate();
}

document.body.onload = main;
