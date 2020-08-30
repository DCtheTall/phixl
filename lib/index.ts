/**
 * @fileoverview Lib's main export script.
 */

import {Attribute} from './attributes';
import {createContext, createProgram, render} from './gl';

export {PLANE_VERTICES_TRIANGLE_STRIP} from './constants';
export {FloatAttribute, Vec2Attribute} from './attributes';

type RenderTarget = HTMLCanvasElement;

type RenderFunc = (target: RenderTarget) => void;

export interface ShaderInit {
  attributes?: {[index: string]: Attribute};
  // TODO uniforms: {[index: string]: Uniform};
}

/**
 * Create a shader function to render to a target.
 */
export const Shader = (vertexSrc: string,
                       fragmentSrc: string,
                       nVertices: number,
                       init: ShaderInit = {}): RenderFunc =>
  (target: RenderTarget) => {
    if (target instanceof HTMLCanvasElement) {
      const gl = createContext(target);

      const program = createProgram(gl, vertexSrc, fragmentSrc);
      gl.useProgram(program);

      for (const k of Object.keys(init.attributes || {})) {
        init.attributes[k](gl, program);
      }

      // TODO set viewport.
      render(gl, null, null, 4, [0, 0, target.width, target.height]);
      return;
    }
    throw new Error('Not implemented');
  };
