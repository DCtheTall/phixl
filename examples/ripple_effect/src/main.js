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
  const canvas = document.getElementById('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  // Load each shader source as a JS string.
  const vertShaderSrc = require('./vertex.glsl').default;
  const canvasFragShaderSrc = require('./canvas.fragment.glsl').default;
  const waveFragShaderSrc = require('./wave.fragment.glsl').default;

  // Every shader uses the same attributes.
  const attributes = [
    Vec2Attribute('a_Position', PLANE_VERTICES),
    Vec2Attribute('a_TexCoord', PLANE_TEX_COORDS),
  ];
  const resolution = Vec2Uniform('u_Resolution', [CANVAS_SIZE, CANVAS_SIZE]);

  const heightMapA = Texture2DUniform('u_HeightMap', initialHeightMap());
  const heightMapB = Texture2DUniform('u_HeightMap', initialHeightMap());

  const mouseDown = BooleanUniform('u_MouseDown', false);
  canvas.addEventListener('mousedown', () => mouseDown.set(true));
  canvas.addEventListener('mouseup', () => mouseDown.set(false));

  const mousePosition = Vec2Uniform('u_MousePosition', [0, 0]);
  canvas.addEventListener('mousemove', (e) => {
    const {left, top} = e.target.getBoundingClientRect();
    let x = e.clientX - left;
    let y = e.clientY - top;
    x = x / CANVAS_SIZE;
    y = (CANVAS_SIZE - y) / CANVAS_SIZE;
    mousePosition.set([x, y]);
  });

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

  const riverbed =
    Texture2DUniform('u_Riverbed', document.getElementById('riverbed'));

  const canvasShader = (heightMap) =>
    Shader(PLANE_N_VERTICES, vertShaderSrc, canvasFragShaderSrc, {
      attributes,
      uniforms: [
        heightMap,
        riverbed,
        resolution,
      ],
    });
  const canvasShaderA = canvasShader(heightMapA);
  const canvasShaderB = canvasShader(heightMapB);

  let flag = false;
  let i = 0;
  const animate = () => {
    i++;
    flag = !flag;
    if (flag) {
      waveShaderAtoB(heightMapB);
      canvasShaderB(canvas);
    } else {
      waveShaderBtoA(heightMapA);
      canvasShaderA(canvas);
    }
    if (i === 3) {
      console.log('done');
      return;
    }
    setTimeout(animate, 500);
  };
  animate();
};

document.body.onload = main;
