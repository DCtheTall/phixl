const {
  PLANE_N_VERTICES,
  PLANE_VERTICES,
  PLANE_TEX_COORDS,
  Shader,
  Texture2DUniform,
  Vec2Attribute,
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

const main = () => {
  const canvas = document.getElementById('canvas');

  const vertShaderSrc = require('./vertex.glsl').default;
  const canvasFragShaderSrc = require('./canvas.fragment.glsl').default;

  const canvasShader = Shader(
    PLANE_N_VERTICES, vertShaderSrc, canvasFragShaderSrc, {
      attributes: [
        Vec2Attribute('a_Position', PLANE_VERTICES),
        Vec2Attribute('a_TexCoord', PLANE_TEX_COORDS),
      ],
      uniforms: [
        Texture2DUniform('u_CurrentFrame', noisyCanvas()),
      ],
    });

  canvasShader(canvas);
}

document.body.onload = main;
