/**
 * Initialize a WebGL context.
 */
export function createContext(canvas: HTMLCanvasElement): WebGLRenderingContext {
  const gl = canvas.getContext('webgl', {preserveDrawingBuffer: true})
      || canvas.getContext( 
          'experimental-webgl',
          {preserveDrawingBuffer: true}) as WebGLRenderingContext;
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  return gl;
}

/**
 * Compile one of the shaders.
 */
function compileShader(gl: WebGLRenderingContext,
                       shader: WebGLShader,
                       src: string): WebGLShader {
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(`Shader failed to compile: ${gl.getShaderInfoLog(shader)}`);
    return null;
  }
  return shader;
}

/**
 * Create and compile a shader program. 
 */
export function createProgram(gl: WebGLRenderingContext,
                              vertexSrc: string,
                              fragmentSrc: string): WebGLProgram {
  const vertexShader = compileShader(
      gl, gl.createShader(WebGLRenderingContext.VERTEX_SHADER), vertexSrc);
  if (!vertexShader) {
    throw new Error(`Failed to compile vertex shader.`);
  }
  const fragmentShader = compileShader(
      gl, gl.createShader(WebGLRenderingContext.FRAGMENT_SHADER), fragmentSrc);
  if (!fragmentShader) {
    throw new Error(`Failed to compile fragment shader.`);
  }
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  return program;
}

/**
 * Abstract type for the bounds of a viewport.
 */
export type Viewport = [number, number, number, number];

/**
 * Render a scene onto the provided frame and render buffers.
 */
export function render(gl: WebGLRenderingContext,
                       frameBuffer: WebGLFramebuffer,
                       renderBuffer: WebGLRenderbuffer,
                       nVertices: number,
                       viewport: Viewport,
                       mode: number,
                       drawElements: boolean) {
  // TODO handle rendering to a frame buffer.
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
  gl.viewport(...viewport);
  if (drawElements) {
    gl.drawElements(mode, nVertices, gl.UNSIGNED_SHORT, 0);
  } else {
    gl.drawArrays(mode, 0, nVertices);
  }
}
