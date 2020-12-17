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
  attributes?: Attribute<AttributeData>[];
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
                          prog: WebGLProgram,
                          opts: ShaderOptions) => {
  if (opts.indices) sendIndices(gl, prog, opts.indices);
  for (const attr of opts.attributes) {
    attr.send(gl, prog);
  }
  for (const uniform of opts.uniforms) {
    uniform.send(gl, prog);
  }
};

type TextureRenderFunc = (canvas: HTMLCanvasElement) => void;

const pendingTextureRenders =
  new WeakMap<TextureUniform<TextureData>, TextureRenderFunc[]>();

const renderPendingTextures = (gl: WebGLRenderingContext,
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

const renderShader = (canvas: HTMLCanvasElement,
                      nVertices: number,
                      vertexSrc: string,
                      fragmentSrc: string,
                      fBuffer: WebGLFramebuffer | null,
                      rBuffer: WebGLRenderbuffer | null,
                      opts: ShaderOptions) => {
  const gl = glContext(canvas);
  const prog = glProgram(gl, vertexSrc, fragmentSrc);

  renderPendingTextures(gl, prog, canvas, opts.uniforms);

  gl.useProgram(prog);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer);
  gl.bindRenderbuffer(gl.RENDERBUFFER, rBuffer);

  sendDataToShader(gl, prog, opts);
  glRender(
    gl, nVertices, clearOption(opts), opts.viewport || defaultViewport(canvas),
    opts.mode || defaultOpts.mode, /* drawElements= */ !!opts.indices);
};

const renderCubeTexture = (canvas: HTMLCanvasElement,
                           opts: ShaderOptions,
                           target: CubeTextureImpl,
                           nVertices: number,
                           vertexSrc: string,
                           fragmentSrc: string) => {
  if (target instanceof CubeCameraUniformImpl) {
    const gl = glContext(canvas);
    const viewport = opts.viewport || defaultViewport(canvas);
    const {frameBuffer, renderBuffer} = target.buffers(gl, viewport);
    target.render((cf: CubeFace) => {
      renderShader(
        canvas, nVertices, vertexSrc, fragmentSrc, frameBuffer[cf],
        renderBuffer[cf], opts);
    });
    return;
  }
  // TODO render to cube texture without cube camera.
  throw new Error('Not implemented');
};

const render2DTexture = (canvas: HTMLCanvasElement,
                         opts: ShaderOptions,
                         target: Texture2DUniformImpl,
                         nVertices: number,
                         vertexSrc: string,
                         fragmentSrc: string) => {
  const gl = glContext(canvas);
  const viewport = opts.viewport || defaultViewport(canvas);
  const {frameBuffer, renderBuffer} = target.buffers(gl, viewport);
  renderShader(
    canvas, nVertices, vertexSrc, fragmentSrc, frameBuffer,
    renderBuffer, opts);
};

const createTextureRenderFunc = (target: TextureUniform<TextureData>,
                                 nVertices: number,
                                 vertexSrc: string,
                                 fragmentSrc: string,
                                 opts: ShaderOptions): TextureRenderFunc =>
  (canvas: HTMLCanvasElement) => {
    if (isCubeTextureUniform(target)) {
      renderCubeTexture(
        canvas, opts, target, nVertices, vertexSrc, fragmentSrc);
      return;
    }
    render2DTexture(
      canvas, opts, target as Texture2DUniformImpl, nVertices, vertexSrc,
      fragmentSrc);
  };

const addTextureRenderFunc = (target: TextureUniform<TextureData>,
                              func: TextureRenderFunc) => {
  let funcs = pendingTextureRenders.get(target);
  if (!funcs) {
    funcs = [];
    pendingTextureRenders.set(target, funcs);
  }
  funcs.push(func);
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
      addTextureRenderFunc(
        target,
        createTextureRenderFunc(target, nVertices, vertexSrc, fragmentSrc, opts));
      return target;
    }
    throw new Error(
      'Shader function must be called with a canvas or texture uniform');
  };
};
