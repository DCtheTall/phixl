const {
  PLANE_N_VERTICES,
  PLANE_VERTICES,
  PLANE_TEX_COORDS,
  BooleanUniform,
  Shader,
  Texture2DUniform,
  Vec2Attribute,
  Vec2Uniform,
} = require('../../../dist');

const CANVAS_SIZE = 600;
const CANVAS_INITIAL_COLOR = 'rgb(127, 127, 0)';

/**
 * Initialize the height map by drawing to a canvas.
 */
const initialHeightMap = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  ctx.fillStyle = CANVAS_INITIAL_COLOR;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  return canvas;
};

const main = () => {
  // Get the canvas from the DOM and set its dimensions.
  const canvas = document.getElementById('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  // Load the shaders, for this example I am using glslify-loader and raw-loader
  // to load the files into JS strings at build time.
  // We load two different fragment shaders, one is for computing the height of
  // the ripple wave at each position and the second is for rendering the ripple
  // effect to a canvas.
  const vertShaderSrc = require('./vertex.glsl').default;
  const canvasFragShaderSrc = require('./canvas.fragment.glsl').default;
  const waveFragShaderSrc = require('./wave.fragment.glsl').default;

  // Every shader uses the same attributes.
  const attributes = [
    Vec2Attribute('a_Position', PLANE_VERTICES),
    Vec2Attribute('a_TexCoord', PLANE_TEX_COORDS),
  ];
  const resolution = Vec2Uniform('u_Resolution', [CANVAS_SIZE, CANVAS_SIZE]);

  // Generate 2 textures to render the Game of Life cells to.
  // When we iterate the discrete wave equation, we use one
  // texture to store the previous height maps and we render the
  // new height map to the other.
  // Since the wave equation requires the two previous frames, we use
  // the red and green channels of each texture to store the height
  // of 2 previous iterations.
  const heightMapA = Texture2DUniform('u_HeightMap', initialHeightMap());
  const heightMapB = Texture2DUniform('u_HeightMap', initialHeightMap());

  // Add a mousedown listener to the canvas that changes the value
  // of the u_MouseDown boolean uniform in the shader.
  const mouseDown = BooleanUniform('u_MouseDown', false);
  canvas.addEventListener('mousedown', () => mouseDown.set(true));
  canvas.addEventListener('mouseup', () => mouseDown.set(false));

  // Create a mousemove event listener that computes the mouse's coordinates
  // relative to the canvas, scaled to the interval [0, 1].
  const mousePosition = Vec2Uniform('u_MousePosition', [0, 0]);
  canvas.addEventListener('mousemove', (e) => {
    const {left, top} = e.target.getBoundingClientRect();
    let x = e.clientX - left;
    let y = e.clientY - top;
    x = x / CANVAS_SIZE;
    y = (CANVAS_SIZE - y) / CANVAS_SIZE;
    mousePosition.set([x, y]);
  });

  // Create the shaders used for computing the next iteration of the
  // wave. It solves the wave equation numerically using a discrete
  // Laplace operator and Verlet integration.
  // waveShaderAtoB samples heightMapA and renders to heightMapB.
  // waveShaderBtoA reverses the source and destination textures.
  const waveShader = (heightMap) =>
    Shader(PLANE_N_VERTICES, vertShaderSrc, waveFragShaderSrc, {
      attributes,
      uniforms: [
        resolution,
        heightMap,
        mouseDown,
        mousePosition,
      ],
    });
  const waveShaderAtoB = waveShader(heightMapA);
  const waveShaderBtoA = waveShader(heightMapB);

  // Create the shaders for rendering to the canvas.
  // Each shader uses a different height map to render the
  // wave to the canvas. It raytraces the surface of the
  // water onto a texture and then adds some diffuse and specular
  // lighting to the ripple wave.
  const canvasShader = (heightMap) =>
    Shader(PLANE_N_VERTICES, vertShaderSrc, canvasFragShaderSrc, {
      attributes,
      uniforms: [
        heightMap,
        Texture2DUniform('u_Riverbed', document.getElementById('riverbed')),
        resolution,
      ],
    });
  const canvasShaderA = canvasShader(heightMapA);
  const canvasShaderB = canvasShader(heightMapB);

  // Render loop.
  // We alternate which frame buffers to use as the source and destination
  // for rendering the height map so that all computation is done on the
  // GPU and we don't need expensive canvas copying in JS.
  let flag = false;
  const animate = () => {
    flag = !flag;
    if (flag) {
      waveShaderAtoB(heightMapB);
      canvasShaderB(canvas);
    } else {
      waveShaderBtoA(heightMapA);
      canvasShaderA(canvas);
    }
    window.requestAnimationFrame(animate);
  };
  animate();
};

document.body.onload = main;
