/**
 * @fileoverview Module for GL context related operations.
 */

import {Cube, CubeFace, cubeFaces, isCube, isPowerOfTwo} from './math';

const contextCache =
  new WeakMap<HTMLCanvasElement, WebGLRenderingContext>();

/**
 * Get the current WebGL context.
 * If this is the first time you 
 */
export const glContext = (canvas: HTMLCanvasElement): WebGLRenderingContext => {
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

type ShaderMap = Map<string, Map<string, WebGLProgram>>;

const programCache =
  new WeakMap<WebGLRenderingContext, ShaderMap>();

/**
 * Create and compile a shader program. 
 */
export const glProgram = (gl: WebGLRenderingContext,
                          vertexSrc: string,
                          fragmentSrc: string): WebGLProgram => {
  const existing =
    programCache.get(gl)?.get(vertexSrc)?.get(fragmentSrc);
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
      `Shader failed to compile: ${gl.getProgramInfoLog(result)}`);
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

const textureAddresses = new WeakMap<WebGLProgram, string[]>();

/**
 * Get the next available address for textures.
 */
export const newTextureOffset = (program: WebGLProgram,
                                 name: string): number => {
  const existing = textureAddresses.get(program) || [];

  for (let i = 0; i < existing.length; i++) {
    if (existing[i] === name) return i;
  }
  
  const curOffset = existing.length;
  if (curOffset === 32) {
    throw new Error('Already at maximum number of textures for this program');
  }

  existing.push(name);
  if (!curOffset) textureAddresses.set(program, existing);

  return curOffset;
};

/**
 * Get if texture data is for a video source.
 */
export const isVideo =
  (data: TexImageSource | Cube<TexImageSource>): boolean => {
    if (isCube(data)) {
      return Object.keys(
        data).some((k: CubeFace) => data[k] instanceof HTMLVideoElement);
    }
    return data instanceof HTMLVideoElement;
  };

/**
 * Create a 2D texture with the provided data.
 */
export const texture2d = (gl: WebGLRenderingContext,
                          data: TexImageSource): WebGLTexture => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
  if (!isVideo(data) && isPowerOfTwo(data.width) && isPowerOfTwo(data.height)) {
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
  return texture;
};

const glTexCubeMapFaces: Cube<GLenum> = {
  posx: WebGLRenderingContext.TEXTURE_CUBE_MAP_POSITIVE_X,
  negx: WebGLRenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_X,
  posy: WebGLRenderingContext.TEXTURE_CUBE_MAP_POSITIVE_Y,
  negy: WebGLRenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_Y,
  posz: WebGLRenderingContext.TEXTURE_CUBE_MAP_POSITIVE_Z,
  negz: WebGLRenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_Z,
};

const cubeFacesArePowersOfTwo = (data: Cube<TexImageSource>): boolean => {
  for (const cf of cubeFaces()) {
    if (!isPowerOfTwo(data[cf].width) || !isPowerOfTwo(data[cf].height)) {
      return false;
    }
  }
  return true;
};

/**
 * Create a cube texture with the provided data.
 */
export const cubeTexure = (gl: WebGLRenderingContext,
                           data: Cube<TexImageSource>): WebGLTexture => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  for (const cf of cubeFaces()) {
    gl.texImage2D(
      glTexCubeMapFaces[cf], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data[cf]);
  }
  if (!isVideo(data) && cubeFacesArePowersOfTwo(data)) {
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  } else {
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  return texture;
};

const sendTexture = (target: GLenum) =>
  (gl: WebGLRenderingContext,
   program: WebGLProgram,
   name: string,
   offset: number,
   texture: WebGLTexture) => {
     const loc = gl.getUniformLocation(program, name);
     gl.uniform1i(loc, offset);
     gl.activeTexture(gl.TEXTURE0 + offset);
     gl.bindTexture(target, texture);
   };

/**
 * Send a 2D texture as a uniform to a shader.
 */
export const send2DTexture = sendTexture(WebGLRenderingContext.TEXTURE_2D);

/**
 * Send a cube texture as a uniform to a shader.
 */
export const sendCubeTexture =
  sendTexture(WebGLRenderingContext.TEXTURE_CUBE_MAP);

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
 * Create a 2D texture that will sample from a framebuffer.
 */
export const texture2DFromFramebuffer = (gl: WebGLRenderingContext,
                                         fBuffer: WebGLFramebuffer,
                                         width: number,
                                         height: number): WebGLTexture => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer);
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    null);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  return texture;
};

/**
 * Generate a cube texture which will sample from a cube of framebuffers.
 */
export const cubeTextureFromFramebuffer = (gl: WebGLRenderingContext,
                                           frameBuffers: Cube<WebGLFramebuffer>,
                                           width: number,
                                           height: number): WebGLTexture => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  for (const cf of cubeFaces()) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffers[cf]);
    gl.texImage2D(
      glTexCubeMapFaces[cf], 0, gl.RGBA, width, height, 0, gl.RGBA,
      gl.UNSIGNED_BYTE, null);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, glTexCubeMapFaces[cf], texture, 0);
  }
  return texture;
};

/**
 * Abstract type for the bounds of a viewport.
 */
export type Viewport = [number, number, number, number];

/**
 * Draws primitives to the bound buffers.
 */
export const glRender = (gl: WebGLRenderingContext,
                         nVertices: number,
                         clear: boolean,
                         viewport: Viewport,
                         mode: number,
                         drawElements: boolean) => {
  gl.clearColor(0, 0, 0, 1);
  if (clear) gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.viewport(...viewport);
  if (drawElements) {
    gl.drawElements(mode, nVertices, gl.UNSIGNED_SHORT, 0);
  } else {
    gl.drawArrays(mode, 0, nVertices);
  }
};
