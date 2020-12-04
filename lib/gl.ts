/**
 * @fileoverview Module for GL context related operations.
 */

import {isPowerOfTwo} from './math';

const contextCache =
  new WeakMap<HTMLCanvasElement, WebGLRenderingContext>();

/**
 * Get the current WebGL context.
 * If this is the first time you 
 */
export const context = (canvas: HTMLCanvasElement): WebGLRenderingContext => {
  const existing = contextCache.get(canvas);
  if (existing) return existing;

  const gl = canvas.getContext('webgl', {preserveDrawingBuffer: true})
      || canvas.getContext( 
          'experimental-webgl',
          {preserveDrawingBuffer: true}) as WebGLRenderingContext;
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  contextCache.set(canvas, gl);

  return gl;
};

/**
 * Compile one of the shaders.
 */
const compileShader = (gl: WebGLRenderingContext,
                       shader: WebGLShader,
                       src: string): WebGLShader => {
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`Shader failed to compile: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
};

type ShaderSrcMap = Map<string, Map<string, WebGLProgram>>;

const programCache =
  new WeakMap<WebGLRenderingContext, ShaderSrcMap>();

/**
 * Create and compile a shader program. 
 */
export const program = (gl: WebGLRenderingContext,
                        vertexSrc: string,
                        fragmentSrc: string): WebGLProgram => {
  const existing = programCache.get(gl)?.get(vertexSrc)?.get(fragmentSrc);
  if (existing) return existing;

  const vertexShader = compileShader(
    gl, gl.createShader(WebGLRenderingContext.VERTEX_SHADER), vertexSrc);
  const fragmentShader = compileShader(
    gl, gl.createShader(WebGLRenderingContext.FRAGMENT_SHADER), fragmentSrc);
  const result = gl.createProgram();
  gl.attachShader(result, vertexShader);
  gl.attachShader(result, fragmentShader);
  gl.linkProgram(result);
  if (!gl.getProgramParameter(result, gl.LINK_STATUS)) {
    throw new Error(
      `Shader failed to compile: ${gl.getProgramInfoLog(program)}`);
  }

  if (!programCache.get(gl)) programCache.set(gl, new Map());
  const ctxProgramCache = programCache.get(gl);
  if (!ctxProgramCache.get(vertexSrc)) {
    ctxProgramCache.set(vertexSrc, new Map());
  }
  ctxProgramCache.get(vertexSrc).set(fragmentSrc, result);

  return result;
};

/**
 * Send indices to the element array buffer.
 */
export const sendIndices = (gl: WebGLRenderingContext,
                            indices: BufferSource) => {
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
};

/**
 * Send an attribute to a shader's array buffer.
 */
export const sendAttribute = (gl: WebGLRenderingContext,
                              program: WebGLProgram,
                              name: string,
                              data: BufferSource,
                              size: number) => {
  const loc = gl.getAttribLocation(program, name);
  gl.enableVertexAttribArray(loc);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
};

/**
 * Send a matrix attribute to a shader's array buffer.
 * 
 * Matrix attributes are sent as vectors in column-major
 * order. Each element in "data" is the data for one column
 * for each vertex.
 */
export const sendMatrixAttribute = (gl: WebGLRenderingContext,
                                    program: WebGLProgram,
                                    name: string,
                                    data: BufferSource[],
                                    dimension: number) => {
  const loc = gl.getAttribLocation(program, name);
  for (let i = 0; i < dimension; i++) {
    gl.enableVertexAttribArray(loc + i);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, data[i], gl.STATIC_DRAW);
    gl.vertexAttribPointer(loc + i, dimension, gl.FLOAT, false, 0, 0);
  }
};

/**
 * Different possible types of uniforms.
 */
export enum UniformType {
  BOOLEAN = 'boolean',
  FLOAT = 'float',
  INTEGER = 'integer',
  VECTOR = 'vector',
  MATRIX = 'matrix',
  TEXTURE = 'texture',
}

/**
 * Send a uniform to a shader that can be represented
 * with just a few bytes (boolean, float, integer).
 */
export const sendBytesUniform = (gl: WebGLRenderingContext,
                                 program: WebGLProgram,
                                 name: string,
                                 type: UniformType,
                                 data: number) => {
  const loc = gl.getUniformLocation(program, name);
  switch (type) {
    case UniformType.BOOLEAN:
      gl.uniform1i(loc, data);
      break;
    case UniformType.FLOAT:
      gl.uniform1f(loc, data);
      break;
    case UniformType.INTEGER:
      gl.uniform1i(loc, data);
      break;
    default:
      throw new Error(`Unexpected uniform type: ${type}`);
  }
};

/**
 * Sends a vector uniform to a shader.
 */
export const sendMatrixUniform = (gl: WebGLRenderingContext,
                                  program: WebGLProgram,
                                  name: string,
                                  dimension: number,
                                  data: Float32List) => {
  const loc = gl.getUniformLocation(program, name);
  switch (dimension) {
    case 2:
      gl.uniformMatrix2fv(loc, false, data);
      break;
    case 3:
      gl.uniformMatrix3fv(loc, false, data);
      break;
    case 4:
      gl.uniformMatrix4fv(loc, false, data);
      break;
  }
}

/**
 * Sends a vector uniform to a shader.
 */
export const sendVectorUniform = (gl: WebGLRenderingContext,
                                  program: WebGLProgram,
                                  name: string,
                                  dimension: number,
                                  data: Float32List) => {
  const loc = gl.getUniformLocation(program, name);
  switch (dimension) {
    case 2:
      gl.uniform2fv(loc, data);
      break;
    case 3:
      gl.uniform3fv(loc, data);
      break;
    case 4:
      gl.uniform4fv(loc, data);
      break;
    default:
      throw new Error(`Unexpected dimension: ${dimension}`);
  }
};

const nextTextureAddress = new WeakMap<WebGLProgram, number>();

/**
 * Get the next available address to 
 */
export const newTextureOffset = (program: WebGLProgram): number => {
  const offset = nextTextureAddress.get(program) || 0;
  if (offset === 32) {
    throw new Error('Already at maximum number of textures for this program');
  }
  // Set the next available address in the map.
  nextTextureAddress.set(program, offset + 1);
  return offset;
};

const isVideo = (data: TexImageSource): data is HTMLVideoElement =>
  data instanceof HTMLVideoElement;

/**
 * Create a 2D texture with the provided data.
 */
export const texture2d = (gl: WebGLRenderingContext,
                          data: TexImageSource): WebGLTexture => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
  if (!isVideo(data) && isPowerOfTwo(data.width) && isPowerOfTwo(data.height)) {
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
  return texture;
};

/**
 * Send a 2D texture as a uniform to a shader.
 */
export const send2DTexture = (gl: WebGLRenderingContext,
                              program: WebGLProgram,
                              offset: number,
                              texture: WebGLTexture) => {
  const loc = gl.getUniformLocation(program, name);
  gl.uniform1i(loc, offset);
  gl.activeTexture(gl.TEXTURE0 + offset);
  gl.bindTexture(gl.TEXTURE_2D, texture);
};

/**
 * Creates a render buffer from a given frame buffer.
 */
export const renderBuffer = (gl: WebGLRenderingContext,
                             fBuffer: WebGLFramebuffer,
                             width: number,
                             height: number): WebGLRenderbuffer => {
  const rBuffer = gl.createRenderbuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer);
  gl.bindRenderbuffer(gl.RENDERBUFFER, rBuffer);
  gl.renderbufferStorage(
    gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
  gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rBuffer);
  return rBuffer;
};

/**
 * Create a 2D texture from a frame buffer.
 */
export const texture2DFromFramebuffer = (gl: WebGLRenderingContext,
                                         fBuffer: WebGLFramebuffer,
                                         width: number,
                                         height: number): WebGLTexture => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer);
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  return texture;
};

/**
 * Abstract type for the bounds of a viewport.
 */
export type Viewport = [number, number, number, number];

/**
 * Draws primitives to the bound buffers.
 */
export const render = (gl: WebGLRenderingContext,
                       nVertices: number,
                       viewport: Viewport,
                       mode: number,
                       drawElements: boolean) => {
  // TODO handle render ing to a frame buffer.
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.viewport(...viewport);
  if (drawElements) {
    gl.drawElements(mode, nVertices, gl.UNSIGNED_SHORT, 0);
  } else {
    gl.drawArrays(mode, 0, nVertices);
  }
};
