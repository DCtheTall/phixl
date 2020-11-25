/**
 * @fileoverview Lib's main export script.
 */

import {Attribute} from './attributes';
import {Viewport, createContext, createProgram, render} from './gl';
import {Uniform, UniformData} from './uniforms';

export * from './attributes';
export * from './constants';
export * from './uniforms';

type RenderTarget = HTMLCanvasElement;

type RenderFunc = (target: RenderTarget) => void;

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
  drawElements?: boolean;
}

const defaultOpts: Required<Omit<ShaderOptions, 'viewport'>> = {
  attributes: [],
  uniforms: [],
  mode: WebGLRenderingContext.TRIANGLE_STRIP,
  drawElements: false,
};

/**
 * Create a shader function to render to a target.
 */
export const Shader = (nVertices: number,
                       vertexSrc: string,
                       fragmentSrc: string,
                       init: ShaderOptions = defaultOpts): RenderFunc =>
  (target: RenderTarget) => {
    if (target instanceof HTMLCanvasElement) {
      const gl = createContext(target);

      const program = createProgram(gl, vertexSrc, fragmentSrc);
      gl.useProgram(program);

      for (const attr of init.attributes) {
        attr(gl, program, init.drawElements);
      }

      for (const uniform of init.uniforms) {
        uniform.send(gl, program);
      }

      render(
        gl, null, null, nVertices,
        init.viewport || [0, 0, target.width, target.height],
        init.mode || defaultOpts.mode,
        init.drawElements);
      return;
    }
    throw new Error('Not implemented');
  };
