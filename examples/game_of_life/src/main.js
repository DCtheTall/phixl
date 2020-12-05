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

const main = () => {
  const canvas = document.getElementById('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  // Load each shader source as a JS string.
  const vertShaderSrc = require('./vertex.glsl').default;
  const cellFragShaderSrc = require('./cells.fragment.glsl').default;
  const canvasFragShaderSrc = require('./canvas.fragment.glsl').default;

  // Every shader uses the same attributes.
  const attributes = [
    Vec2Attribute('a_Position', PLANE_VERTICES),
    Vec2Attribute('a_TexCoord', PLANE_TEX_COORDS),
  ];
  const resolutionUniform = Vec2Uniform('u_Resolution', [CANVAS_SIZE, CANVAS_SIZE]);

  const cellsA = Texture2DUniform('u_CurrentCells', noisyCanvas());
  const cellsB = Texture2DUniform('u_CurrentCells');

  // These shaders compute the next generation in the Game of Life.
  // They render the result to a texture uniform using a framebuffer.
  // cellsAtoB uses the texture in cellsA to render a texture to cellsB.
  // cellsBtoA reverses the source and destination textures.
  const cellsShader = (textureUniform) =>
    Shader(PLANE_N_VERTICES, vertShaderSrc, cellFragShaderSrc, {
      attributes,
      uniforms: [
        resolutionUniform,
        textureUniform,
      ],
    });
  const cellsAtoB = cellsShader(cellsA);
  const cellsBtoA = cellsShader(cellsB);

  // These shaders paint one of the texture uniforms to the canvas.
  // We use separate shaders for this depending on whether cellsA or cellsB
  // contains the most recently updated board.
  const canvasShader = (textureUniform) =>
    Shader(PLANE_N_VERTICES, vertShaderSrc, canvasFragShaderSrc, {
      attributes,
      uniforms: [textureUniform],
    });
  const canvasShaderA = canvasShader(cellsA);
  const canvasShaderB = canvasShader(cellsB);

  let flag = false;
  const animate = () => {
    flag = !flag;
    if (flag) {
      cellsAtoB(cellsB);
      canvasShaderB(canvas);
    } else {
      cellsBtoA(cellsA);
      canvasShaderA(canvas);
    }

    // // Recursively call animate on next paint.
    window.requestAnimationFrame(animate);
  };
  animate();
}

document.body.onload = main;
