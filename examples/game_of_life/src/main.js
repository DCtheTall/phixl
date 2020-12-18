const {
  PLANE_N_VERTICES,
  PLANE_VERTICES,
  PLANE_TEX_COORDS,
  Shader,
  Texture2DUniform,
  Vec2Attribute,
  Vec2Uniform,
} = require('../../../dist');

const CANVAS_SIZE = 512;
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
  // Get the canvas from the DOM and set its dimensions.
  const canvas = document.getElementById('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  // Load the shaders, for this example I am using glslify-loader and raw-loader
  // to load the files into JS strings at build time.
  // We load two different fragment shaders, one is for iterating the game of life
  // algorithm, the other renders the result texture to a canvas.
  const vertShaderSrc = require('./vertex.glsl').default;
  const cellFragShaderSrc = require('./cells.fragment.glsl').default;
  const canvasFragShaderSrc = require('./canvas.fragment.glsl').default;

  // Every shader uses the same attributes.
  const attributes = [
    Vec2Attribute('a_Position', PLANE_VERTICES),
    Vec2Attribute('a_TexCoord', PLANE_TEX_COORDS),
  ];

  // Generate 2 textures to render the Game of Life cells to.
  // When we iterate the Game of Life algorithm, we use one
  // texture to store the previous board and render the next
  // board to the other texture.
  const cellsA = Texture2DUniform('u_CurrentCells', noisyCanvas());
  const cellsB = Texture2DUniform('u_CurrentCells');

  // These shaders compute the next generation in the Game of Life.
  // They render the result to a texture uniform using a framebuffer.
  // cellsAtoB uses the texture in cellsA to render a texture to cellsB.
  // cellsBtoA reverses the source and destination textures.
  const cellsShader = (sourceTexture) =>
    Shader(PLANE_N_VERTICES, vertShaderSrc, cellFragShaderSrc, {
      attributes,
      uniforms: [
        Vec2Uniform('u_Resolution', [CANVAS_SIZE, CANVAS_SIZE]),
        sourceTexture,
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

  // Render loop.
  // Each frame we alternate which texture we use as the source
  // and destination for each iteration of the Game of Life algorithm.
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

  // First render.
  animate();
};

document.body.onload = main;
