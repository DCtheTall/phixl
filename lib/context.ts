/**
 * @fileoverview Context module, an object used to partition state by
 * each call of the Shader() function in shader.ts.
 */

export interface ShaderContext {}

export const shaderContext = (): ShaderContext => ({});