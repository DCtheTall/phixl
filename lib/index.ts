/**
 * Initialize a WebGL context.
 */
function createContext(canvas: HTMLCanvasElement): WebGLRenderingContext {
  const gl = canvas.getContext('webgl', {preserveDrawingBuffer: true})
      || canvas.getContext( 
          'experimental-webgl',
          {preserveDrawingBuffer: true}) as WebGLRenderingContext;
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  return gl;
}

type RenderTarget = HTMLCanvasElement;

type RenderFunc = (target: RenderTarget) => void;

/**
 * Create a shader function to render to a target.
 */
export function Shader(vertexSrc: string, fragmentSrc: string): RenderFunc {
  return (target: RenderTarget) => {
    if (target instanceof HTMLCanvasElement) {
      const gl = createContext(target);
      console.log(gl);
    }
  };
}
