/**
 * @fileoverview Module contains the function for building a Shader.
 */

import {Attribute} from './attributes';
import {Viewport, context, program, render, sendIndices} from './gl';
import {Texture2DUniformImpl, Uniform, UniformData, isTextureUniform} from './uniforms';

type RenderTarget = HTMLCanvasElement | Texture2DUniformImpl;

type ShaderFunc = (target: RenderTarget) => void;

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
}

const defaultOpts: Required<Omit<ShaderOptions, 'viewport' | 'indices'>> = {
  attributes: [],
  uniforms: [],
  mode: WebGLRenderingContext.TRIANGLE_STRIP,
};

const defaultViewport = (canvas: HTMLCanvasElement): Viewport =>
  [0, 0, canvas.width, canvas.height];

const sendDataToShader = (gl: WebGLRenderingContext,
                          p: WebGLProgram,
                          opts: ShaderOptions) => {
  // TODO add caching for animations
  if (opts.indices) sendIndices(gl, opts.indices);
  for (const attr of opts.attributes) {
    attr(gl, p);
  }
  for (const uniform of opts.uniforms) {
    uniform.send(gl, p);
  }
};

type TextureRenderFunc =
  (gl: WebGLRenderingContext, canvas: HTMLCanvasElement) => void;

const pendingTextureRenders =
  new WeakMap<Texture2DUniformImpl, TextureRenderFunc>();

const renderToCanvas = (canvas: HTMLCanvasElement,
                        nVertices: number,
                        vertexSrc: string,
                        fragmentSrc: string,
                        opts: ShaderOptions = defaultOpts) => {
  const gl = context(canvas);
  const viewport = opts.viewport || defaultViewport(canvas);

  for (const uniform of opts.uniforms) {
    if (!isTextureUniform(uniform)) continue;
    const renderTexture = pendingTextureRenders.get(uniform);
    if (!renderTexture) continue;
    renderTexture(gl, canvas);
  }

  const p = program(gl, vertexSrc, fragmentSrc);

  gl.useProgram(p);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);

  sendDataToShader(gl, p, opts);
  render(
    gl, nVertices, viewport, opts.mode || defaultOpts.mode,
    /* drawElements= */ !!opts.indices);
  return;
};

/**
 * Create a shader function to render to a target.
 */
export const Shader = (nVertices: number,
                       vertexSrc: string,
                       fragmentSrc: string,
                       opts: ShaderOptions = defaultOpts): ShaderFunc =>
  (target: RenderTarget) => {
    if (target instanceof HTMLCanvasElement) {
      renderToCanvas(target, nVertices, vertexSrc, fragmentSrc, opts);
      return;
    }
    pendingTextureRenders.set(
      target, (gl: WebGLRenderingContext, canvas: HTMLCanvasElement) => {
        const viewport = opts.viewport || defaultViewport(canvas);
        const {frameBuffer, renderBuffer} = target.buffers(gl, viewport);
        const p = program(gl, vertexSrc, fragmentSrc);

        gl.useProgram(p);
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);

        sendDataToShader(gl, p, opts);
        render(
          gl, nVertices, viewport,
          opts.mode || defaultOpts.mode, /* drawElements= */ !!opts.indices);
      });
  };
