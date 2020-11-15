/**
 * @fileoverview Lib's main export script.
 */

import {Attribute} from './attributes';
import {Viewport, createContext, createProgram, render} from './gl';
import {Uniform} from './uniforms';

export * from './attributes';
export * from './constants';
export * from './uniforms';

type RenderTarget = HTMLCanvasElement;

type RenderFunc = (target: RenderTarget) => void;

export interface ShaderInit {
  attributes?: {[index: string]: Attribute};
  uniforms?: {[index: string]: Uniform};
  viewport?: Viewport;
  // GLenum for primitive type to render. See:
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays
  mode?: number;
}

const defaultInit: Required<Omit<ShaderInit, 'viewport'>> = {
  attributes: {},
  uniforms: {},
  mode: WebGLRenderingContext.TRIANGLE_STRIP,
};

/**
 * Create a shader function to render to a target.
 */
export const Shader = (nVertices: number,
                       vertexSrc: string,
                       fragmentSrc: string,
                       init: ShaderInit = defaultInit): RenderFunc =>
  (target: RenderTarget) => {
    if (target instanceof HTMLCanvasElement) {
      const gl = createContext(target);

      const program = createProgram(gl, vertexSrc, fragmentSrc);
      gl.useProgram(program);

      for (const k of Object.getOwnPropertyNames(init.attributes || {})) {
        init.attributes[k](gl, program);
      }

      for (const k of Object.getOwnPropertyNames(init.uniforms || {})) {
        init.uniforms[k](gl, program);
      }

      render(
          gl, null, null, nVertices,
          init.viewport || [0, 0, target.width, target.height],
          init.mode || defaultInit.mode);
      return;
    }
    throw new Error('Not implemented');
  };
