/**
 * @fileoverview Module contains the function for building a Shader.
 */

import {AttributeData, Attribute} from './attributes';
import {Viewport, glContext, glProgram, glRender, sendIndices} from './gl';
import {CubeFace} from './math';
import {
  CubeCameraUniformImpl,
  CubeTextureImpl,
  TextureUniform,
  Texture2DUniformImpl,
  TextureData,
  Uniform,
  UniformData,
  isCubeTextureUniform,
  isTextureUniform,
} from './uniforms';

/**
 * Interface for the options you can supply to Shader.
 */
export interface ShaderOptions {
  attributes: Attribute<AttributeData>[];
  uniforms?: Uniform<UniformData>[];
  viewport?: Viewport;
  // GLenum for primitive type to render. See:
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays
  mode?: number;
  indices?: Uint16Array;
  clear?: boolean;
}

const defaultOpts: Required<Omit<ShaderOptions, 'viewport' | 'indices'>> = {
  attributes: [],
  uniforms: [],
  mode: WebGLRenderingContext.TRIANGLE_STRIP,
  clear: true,
};

/**
 * Get the "clear" option value.
 */
const clearOption = (opts: ShaderOptions) =>
  (opts.clear === undefined) || opts.clear;

/**
 * The default viewport is the size of the canvas we render to.
 */
const defaultViewport = (canvas: HTMLCanvasElement): Viewport =>
  [0, 0, canvas.width, canvas.height];

/**
 * Get the number of vertices a shader will render.
 */
const nVertices = (opts: ShaderOptions): number =>
  opts.indices ? opts.indices.length : opts.attributes[0].length();

/**
 * Key for the cache which of rendering contexts and WebGLProgram that
 * we initialize with Shader.
 */
type CacheKey = {};

/**
 * The interface stored in the cache for each shader.
 */
interface CacheItem {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
}

const cache = new WeakMap<CacheKey, CacheItem>();

/**
 * Look up a rendering context and WebGLProgram for a shader.
 * If they don't exist already, create one.
 */
const lookup = (key: CacheKey,
                canvas: HTMLCanvasElement,
                vertexSrc: string,
                fragmentSrc: string): CacheItem => {
  let item = cache.get(key);
  if (!item) {
    const gl = glContext(canvas);
    item = {gl, program: glProgram(gl, vertexSrc, fragmentSrc)};
    cache.set(key, item);
  }
  return item;
};

/**
 * We render shaders to textures by storing each time a shader function
 * is called with a texture to a map. When we render to an actual canvas
 * the functions get executed with the canvas's rendering context.
 */
type TextureRenderFunc = (canvas: HTMLCanvasElement) => void;

const pendingTextureRenders =
  new WeakMap<TextureUniform<TextureData>, TextureRenderFunc[]>();

/**
 * Prepare a texture uniform for rendering.
 * If the texture's content is the output of a shader, we actually
 * render the shader to the texture here.
 */
const prepareTextureUniforms = (gl: WebGLRenderingContext,
                                prog: WebGLProgram,
                                canvas: HTMLCanvasElement,
                                uniforms: Uniform<UniformData>[]) => {
  for (const uniform of uniforms) {
    if (!isTextureUniform(uniform)) continue;
    uniform.prepare(gl, prog);
    const renderFuncs = pendingTextureRenders.get(uniform);
    if (!renderFuncs) continue;
    pendingTextureRenders.delete(uniform);
    for (const func of renderFuncs) {
      func(canvas);
    }
  }
};

/**
 * Send the attributes and uniforms to a shader. If the shader
 * is using gl.drawElements(...) then also send the indices.
 */
const sendDataToShader = (gl: WebGLRenderingContext,
                          prog: WebGLProgram,
                          opts: ShaderOptions) => {
  let firstLen: number;
  for (const attr of opts.attributes) {
    if (isNaN(firstLen)) {
      firstLen = attr.length();
    } else if (attr.length() != firstLen) {
      throw new Error('Mismatched attrbute size');
    }
    attr.send(gl, prog);
  }
  for (const uniform of opts.uniforms) {
    uniform.send(gl, prog);
  }
  if (opts.indices) sendIndices(gl, opts.indices);
};

/**
 * Render a shader to either a canvas for a WebGLFramebuffer.
 */
const renderShader = (key: CacheKey,
                      canvas: HTMLCanvasElement,
                      vertexSrc: string,
                      fragmentSrc: string,
                      frameBuffer: WebGLFramebuffer | null,
                      renderBuffer: WebGLRenderbuffer | null,
                      opts: ShaderOptions) => {
  const {gl, program} = lookup(key, canvas, vertexSrc, fragmentSrc);

  prepareTextureUniforms(gl, program, canvas, opts.uniforms);

  gl.useProgram(program);
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);

  sendDataToShader(gl, program, opts);
  glRender(
    gl, nVertices(opts), clearOption(opts),
    opts.viewport || defaultViewport(canvas), opts.mode || defaultOpts.mode,
    /* drawElements= */ !!opts.indices);
};

/**
 * Render a shader to a cube texture. So far only cube cameras are supported.
 */
const renderCubeTexture = (key: CacheKey,
                           canvas: HTMLCanvasElement,
                           opts: ShaderOptions,
                           target: CubeTextureImpl,
                           vertexSrc: string,
                           fragmentSrc: string) => {
  if (target instanceof CubeCameraUniformImpl) {
    const gl = glContext(canvas);
    const viewport = opts.viewport || defaultViewport(canvas);
    const {frameBuffer, renderBuffer} = target.buffers(gl, viewport);
    target.render((cf: CubeFace) => {
      renderShader(
        key, canvas, vertexSrc, fragmentSrc, frameBuffer[cf],
        renderBuffer[cf], opts);
    });
    return;
  }
  // TODO render to cube texture without cube camera.
  throw new Error('Not implemented');
};

/**
 * Render a shader to a 2D texture.
 */
const render2DTexture = (key: CacheKey,
                         canvas: HTMLCanvasElement,
                         opts: ShaderOptions,
                         target: Texture2DUniformImpl,
                         vertexSrc: string,
                         fragmentSrc: string) => {
  const gl = glContext(canvas);
  const viewport = opts.viewport || defaultViewport(canvas);
  const {frameBuffer, renderBuffer} = target.buffers(gl, viewport);
  renderShader(
    key, canvas, vertexSrc, fragmentSrc, frameBuffer,
    renderBuffer, opts);
};

/**
 * Create a function that delays rendering a shader to a texture
 * until a shader that uses the texture is rendered to a camera.
 */
const createTextureRenderFunc = (key: CacheKey,
                                 target: TextureUniform<TextureData>,
                                 vertexSrc: string,
                                 fragmentSrc: string,
                                 opts: ShaderOptions): TextureRenderFunc =>
  (canvas: HTMLCanvasElement) => {
    if (isCubeTextureUniform(target)) {
      renderCubeTexture(key, canvas, opts, target, vertexSrc, fragmentSrc);
      return;
    }
    render2DTexture(
      key, canvas, opts, target as Texture2DUniformImpl, vertexSrc, fragmentSrc);
  };

/**
 * Add a texture render function to the map.
 */
const addTextureRenderFunc = (target: TextureUniform<TextureData>,
                              func: TextureRenderFunc) => {
  let funcs = pendingTextureRenders.get(target);
  if (!funcs) {
    funcs = [];
    pendingTextureRenders.set(target, funcs);
  }
  funcs.push(func);
};

/**
 * The type of objects the function returned by Shader can be called with.
 */
type RenderTarget = HTMLCanvasElement | TextureUniform<TextureData>;

/**
 * The type of function returned by Shader.
 */
type ShaderFunc = (target: RenderTarget) => RenderTarget;

/**
 * Create a shader function to render to a target.
 * @param vertexSrc the vertex shader source
 * @param fragmentSrc the fragment shader source
 * @param options for the shader
 */
export const Shader = (vertexSrc: string,
                       fragmentSrc: string,
                       options: ShaderOptions): ShaderFunc => {
  if (typeof vertexSrc !== 'string') {
    throw new Error('The first argument of Shader must be a string');
  }
  if (typeof fragmentSrc !== 'string') {
    throw new Error('The second argument of Shader must be a string');
  }
  if (!(options && options.attributes?.length)) {
    throw new Error('Shader requires at least one attribute');
  }
  const key: CacheKey = {};
  return (target: RenderTarget) => {
    if (target instanceof HTMLCanvasElement) {
      renderShader(
        key, target, vertexSrc, fragmentSrc, null, null, options);
      return target;
    } else if (isTextureUniform(target)) {
      addTextureRenderFunc(
        target,
        createTextureRenderFunc(key, target, vertexSrc, fragmentSrc, options));
      return target;
    }
    throw new Error(
      'Shader function must be called with a canvas or texture uniform');
  };
};
