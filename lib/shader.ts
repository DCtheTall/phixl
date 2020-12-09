/**
 * @fileoverview Module contains the function for building a Shader.
 */

import {Attribute} from './attributes';
import {Viewport, glContext, glRender, program, sendIndices} from './gl';
import {isCube} from './math';
import {TextureUniform, TextureData, Uniform, UniformData, isTextureUniform} from './uniforms';

/**
 * Interface for the options you can supply to Shader.
 */
export interface ShaderOptions {
  attributes?: Attribute[];
  uniforms?: Uniform<UniformData>[];
  viewport?: Viewport;
  // GLenum for primitive type to render. See:
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays
  mode?: number;
  indices?: BufferSource;
  clear?: boolean;
}

const defaultOpts: Required<Omit<ShaderOptions, 'viewport' | 'indices'>> = {
  attributes: [],
  uniforms: [],
  mode: WebGLRenderingContext.TRIANGLE_STRIP,
  clear: true,
};

const clearOption = (opts: ShaderOptions) =>
  (opts.clear === undefined) || opts.clear;

const defaultViewport = (canvas: HTMLCanvasElement): Viewport =>
  [0, 0, canvas.width, canvas.height];

const sendDataToShader = (gl: WebGLRenderingContext,
                          p: WebGLProgram,
                          opts: ShaderOptions) => {
  // TODO add caching for sending data.
  if (opts.indices) sendIndices(gl, opts.indices);
  for (const attr of opts.attributes) {
    attr(gl, p);
  }
  for (const uniform of opts.uniforms) {
    uniform.send(gl, p);
  }
};

type TextureRenderFunc = (canvas: HTMLCanvasElement) => void;

const pendingTextureRenders =
  new WeakMap<TextureUniform<TextureData>, TextureRenderFunc>();

const renderShader = (canvas: HTMLCanvasElement,
                      nVertices: number,
                      vertexSrc: string,
                      fragmentSrc: string,
                      fBuffer: WebGLFramebuffer | null,
                      rBuffer: WebGLRenderbuffer | null,
                      opts: ShaderOptions) => {
  const gl = glContext(canvas);
  const p = program(gl, vertexSrc, fragmentSrc);

  // Render any textures that this shader depends on.
  // TODO investigate cycle detection.
  for (let uniform of opts.uniforms) {
    if (!isTextureUniform(uniform)) continue;
    uniform.prepare(gl, program);
    const renderTexture = pendingTextureRenders.get(uniform);
    if (!renderTexture) continue;
    pendingTextureRenders.delete(uniform);
    renderTexture(canvas);
  }

  gl.useProgram(p);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer);
  gl.bindRenderbuffer(gl.RENDERBUFFER, rBuffer);

  sendDataToShader(gl, p, opts);
  glRender(
    gl, nVertices, clearOption(opts), opts.viewport || defaultViewport(canvas),
    opts.mode || defaultOpts.mode,
    /* drawElements= */ !!opts.indices);
};

const createTextureRenderFunc = (nVertices: number,
                                 vertexSrc: string,
                                 fragmentSrc: string,
                                 target: TextureUniform<TextureData>,
                                 opts: ShaderOptions): TextureRenderFunc =>
  (canvas: HTMLCanvasElement) => {
    const gl = glContext(canvas);
    const viewport = opts.viewport || defaultViewport(canvas);
    const {frameBuffer, renderBuffer} = target.buffers(gl, viewport);
    if (isCube(frameBuffer) && isCube(renderBuffer)) {
      // TODO render to cube texture
      // TODO render cube camera to texture (need new uniform type)
      throw new Error('Not implemented');
    }
    renderShader(
      canvas, nVertices, vertexSrc, fragmentSrc, frameBuffer,
      renderBuffer, opts);
  };

type RenderTarget = HTMLCanvasElement | TextureUniform<TextureData>;

type ShaderFunc = (target: RenderTarget) => RenderTarget;

/**
 * Create a shader function to render to a target.
 */
export const Shader = (nVertices: number,
                       vertexSrc: string,
                       fragmentSrc: string,
                       opts: ShaderOptions = defaultOpts): ShaderFunc => {
  return (target: RenderTarget) => {
    if (target instanceof HTMLCanvasElement) {
      renderShader(
        target, nVertices, vertexSrc, fragmentSrc, null, null, opts);
      return target;
    } else if (isTextureUniform(target)) {
      pendingTextureRenders.set(
        target,
        createTextureRenderFunc(
          nVertices, vertexSrc, fragmentSrc, target, opts));
      return target;
    }
    throw new Error(
      'Shader function must be called on a canvas or texture uniform');
  };
};
