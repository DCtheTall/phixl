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
  indices?: BufferSource;
}

const defaultOpts: Required<Omit<ShaderOptions, 'viewport' | 'indices'>> = {
  attributes: [],
  uniforms: [],
  mode: WebGLRenderingContext.TRIANGLE_STRIP,
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

      if (init.indices) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, init.indices, gl.STATIC_DRAW);
      }

      for (const attr of init.attributes) {
        attr(gl, program);
      }

      for (const uniform of init.uniforms) {
        uniform.send(gl, program);
      }

      render(
        gl, null, null, nVertices,
        init.viewport || [0, 0, target.width, target.height],
        init.mode || defaultOpts.mode,
        !!init.indices);
      return;
    }
    throw new Error('Not implemented');
  };
