/**
 * @fileoverview Module contains the function for building a Shader.
 */

import {Attribute} from './attributes';
import {Viewport, context, program, render, sendIndices} from './gl';
import {Texture2DUniformImpl, Uniform, UniformData} from './uniforms';

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

/**
 * Create a shader function to render to a target.
 */
export const Shader = (nVertices: number,
                       vertexSrc: string,
                       fragmentSrc: string,
                       opts: ShaderOptions = defaultOpts): ShaderFunc =>
  (target: RenderTarget) => {
    if (!(target instanceof HTMLCanvasElement)) {
      throw new Error('Not implemented');
    }

    const gl = context(target);

    const p = program(gl, vertexSrc, fragmentSrc);
    gl.useProgram(p);

    if (opts.indices) sendIndices(gl, opts.indices);
    for (const attr of opts.attributes) {
      attr(gl, p);
    }
    for (const uniform of opts.uniforms) {
      uniform.send(gl, p);
    }

    render(
      gl, null, null, nVertices,
      opts.viewport || [0, 0, target.width, target.height],
      opts.mode || defaultOpts.mode,
      /* drawElements= */ !!opts.indices);
    return;
  };
