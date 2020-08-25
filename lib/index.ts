import {Attribute} from './attributes';
import {createContext, createProgram} from './gl';

type RenderTarget = HTMLCanvasElement;

type RenderFunc = (target: RenderTarget) => void;

export interface ShaderInit {
  attributes?: {[index: string]: Attribute};
  // uniforms: {[index: string]: Uniform};
}

/**
 * Create a shader function to render to a target.
 */
export function Shader(vertexSrc: string, fragmentSrc: string, init: ShaderInit = {}): RenderFunc {
  return (target: RenderTarget) => {
    if (target instanceof HTMLCanvasElement) {
      const gl = createContext(target);
      const program = createProgram(gl, vertexSrc, fragmentSrc);
      for (const k in Object.keys(init.attributes)) {
        init.attributes[k](gl, program);
      }
    }
    throw new Error('Not implemented');
  };
}
