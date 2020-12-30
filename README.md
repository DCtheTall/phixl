# phixl

A library for WebGL which is for people who want to write their own shaders.

## Overview

This library provides a layer of abstraction over WebGL which allows users to
apply a shader to a canvas without having to worry about the WebGL API at all.

The library exports a factory function called `Shader` which takes the GLSL code
as strings and the data you want to supply to the shader as arguments.
`Shader` will return a function which will render that shader to a canvas.

You can also use the function returned by `Shader` to render to a texture using
`WebGLFramebuffer`. This lefts you sample from the result of other shaders as
textures. This lets your shaders become composable and lets you easily write
programs which take advantage of the parallelization of the GPU.

## Quickstart

Say you wanted to render a cube using phixl and WebGL using the following
data for `gl.drawElements`. For simplicity, we'll just color the cube using
the normal vectors.

```javascript
const CUBE_INDICES = new Uint16Array([...]);
const CUBE_VERTICES = new Float32Array([...]);
const CUBE_NORMALS = new Float32Array([...]);
```

Let's set up your vertex shader:

```glsl
precision mediump float;

attribute vec3 a_Vertex;
attribute vec3 a_Normal;

varying vec3 v_Normal;

uniform mat4 u_ModelMat;
uniform mat4 u_ViewMat;
uniform mat4 u_PerspectiveMat;

void main() {
  gl_Position =
    u_PerspectiveMat * u_ViewMat * u_ModelMat * vec4(a_Vertex, 1.0);
  v_Normal = a_Normal;
}
```

The fragment shader is straightforward:

```glsl
precision mediump float;

varying vec3 v_Normal;

void main() {
  gl_FragColor = vec4(abs(v_Normal), 1.0);
}
```

Let's say you are using [`glslify-loader`](https://www.npmjs.com/package/glslify-loader)
and [`raw-loader`](https://www.npmjs.com/package/raw-loader) with Webpack to load the
shaders into JS strings:

```javascript
const vertexSrc = require('vertex.glsl').default;
const fragmentSrc = require('fragment.glsl').default;
```

Now we want to import the relevant functions from phixl and create a shader:

```javascript
const {
  ModelMatUniform,
  NormalMatUniform,
  PerspectiveMatUniform,
  Shader,
  Vec3Attribute,
  ViewMatUniform,
} = require('phixl');

const aVertex = Vec3Attribute('a_Vertex', CUBE_VERTICES);
const aNormal = Vec3Attribute('a_Normal', CUBE_NORMALS);

const modelMat = ModelMatUniform('u_ModelMat', {
  scale: 5,
  rotate: [Math.PI / 4, 2, 1, 0],
});
const viewMat =
  ViewMatUniform(
    'u_ViewMat', /* eye */ [0, 0, 30], /* at */ [0, 0, 0], /* up */ [0, 1, 0]);
const perspectiveMat =
  PerspectiveMatUniform(
    'u_PerspectiveMat', /* fovy */ Math.PI / 3, /* aspect */ 1, /* near */ 1,
    /* far */ 1e6);

const shader = Shader(vertexSrc, fragmentSrc, {
  indices: CUBE_INDICES,
  attributes: [aVertex, aNormal],
  uniforms: [modelMat, viewMat, perspectiveMat],
  mode: WebGLRenderingContext.TRIANGLES,
});
```

The resulting function, `shader`, can be used to apply that shader to a render target
such as a canvas:

```javascript
const canvas = document.querySelector('canvas');
shader(canvas);
```

The `shader` function can also be called with a `Texture2DUniform` to render
the shader to a texture with a `WebGLFramebuffer`. The resulting texture can
later be sampled in other shaders. See `examples/game_of_life` and
`examples/ripple_effect` for some examples of how you can use this technique
for different things.

## Examples

For more examples of how to use phixl for various WebGL things, see the `examples`
directory in this repository. They include:

- Rendering a 3D cube
- Rendering a 3D cube with a video texture
- Edge detection algorithm on webcam video
- GPU accelerated Conway's Game of Life
- Water ripple effect using the 2D wave equation
- Dynamic reflections using a CubeCamera

## Documentation

### `Shader`

The most important function in the phixl library, `Shader`, is a factory function
that creates functions that apply a shader to a render target. It takes 3 arguments:

1. The vertex shader source code as a JS string

1. The fragment shader source code as a JS string

1. An object which should contain the following keys:
    - `attributes`: An array of attributes for the shader. See the _Attributes_ section below for
      what objects to use as elements for the array. This array must have at least one element.
    - `uniforms`: Optional. An array of uniforms for the shader. See the _Uniforms_ section below
      for what objects to use as elements of this array. This array may be empty or omitted.
    - `indices`: Optional. If provided the shader will render using `gl.drawElements` instead of
      `gl.drawArrays`.
    - `mode`: Optional. Which mode WebGL will use to draw the vertices. The default is
      `WebGLRenderingContext.TRIANGLE_STRIP`.
    - `clear`: Optional. Whether the shader should call `gl.clear`. If the option is omitted then
      the value will be treated as `true`.
    - `viewport`: Optional. The viewport that WebGL should use when rendering the shader. It should
      be an array of 4 numbers. The elements will be used as arguments for `gl.viewport`.

### Attributes

All attributes take 2 arguments:

1. The name of the attribute in the shader

1. The data for the attribute.

The value for the second argument depends on the type of the attribute.
For all attributes except for matrix attributes, the argument should be
a `Float32Array`. These uniforms are:

- `FloatAttribute`
- `Vec2Attribute`
- `Vec3Attribute`
- `Vec4Attribute`

#### Matrix attributes

Unlike all other attributes, matrix attributes take an array of `Float32Array`
as the second argument. Each element of the array is a vector attribute for each
column vector of the matrix. Matrix attributes are:

- `Mat2Attribute`
- `Mat3Attribute`
- `Mat4Attribute`

### Uniforms

Below are a list of uniforms available to phixl users. The parameters
of uniform functions and their behavior varies quite a bit more than
attributes.

All uniforms take the name of the uniform in the shader as their first
argument. Below is a list of the different uniforms and what parameters
they expect.

#### `BooleanUniform`

Sends a boolean value to a shader uniform. The second argument should be
a number or boolean. Example usage:

```javascript
const bool = BooleanUniform('u_Foo', true);
```

#### `IntegerUniform`

Sends an integer value to a shader uniform. The second argument should
be a whole number. Example usage:

```javascript
const int = IntegerUniform('u_Foo', 3);
```

TODO rest of uniforms

## License

TODO
