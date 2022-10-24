# phixl

**This is not an officially supported Google product**

A library for WebGL which is for people who want to write their own shaders.

[NPM](https://npmjs.org/package/phixl) | [GitHub](https://github.com/DCtheTall/phixl)

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

This library provides an abstraction for sending attributes to shaders with just a function
call. This library assumes that a shader's attributes are _immutable_ and should not be changed
once they are initialized.

All attributes take 2 arguments:

1. The name of the attribute in the shader

1. The data for the attribute.

The value for the second argument depends on the type of the attribute.
For all attributes except for matrix attributes, the argument should be
a `Float32List`. These uniforms are:

- `FloatAttribute`
- `Vec2Attribute`
- `Vec3Attribute`
- `Vec4Attribute`

#### Matrix attributes

Unlike all other attributes, matrix attributes take an array of `Float32List`
as the second argument. Each element of the array is a vector attribute for each
column vector of the matrix. Matrix attributes are:

- `Mat2Attribute`
- `Mat3Attribute`
- `Mat4Attribute`

### Uniforms

This library also provides some abstractions for sending uniforms to WebGL shaders
as well.

Unlike attributes, uniforms are not immutable, and can have their value changed.
Almost all uniforms have a `set()` method for setting the uniforms data after
it is created and a `data()` method for retrieving the current value of the data.
The `set()` method can also be called with a callback with no arguments that
returns the uniform data. The callback will be invoked several times in phixl's
internals so it should **not** have side effects.

Below are a list of uniforms available to phixl users. The parameters of uniform
functions and their behavior varies quite a bit more than attributes. All uniforms
take the name of the uniform in the shader as their first argument. Below is a
list of the different uniforms and what parameters they expect.

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

#### `FloatUniform`

Sends a float value to a shader uniform. The second argument should be a number.
Example usage:

```javascript
const float = new FloatUniform('u_Foo', Math.PI);
```

#### Vector uniforms

Vector uniforms send a vector of float values to a shader uniform. The second
argument should be an array of numbers. The size of the array depends on the
dimension of the vector. Example usage:

```javascript
const vec2 = Vec2Uniform('u_Foo', [1, 2]);
const vec3 = Vec3Uniform('u_Bar', [1, 2, 3]);
const vec4 = Vec4Uniform('u_Baz', [1, 2, 3, 4]);
```

#### Matrix uniforms

Matrix uniforms sends a matrix of float values to a shader uniform. The second
argument should be an array of numbers. The size of the array depends on the
dimension of the matrix. Example usage with
[`gl-matrix`](https://www.npmjs.com/package/gl-matrix):

```javascript
const {mat2, mat3, mat4} = require('gl-matrix');

const mat2 = Mat2Uniform('u_Foo', mat2.create());
const mat3 = Mat3Uniform('u_Bar', mat3.create());
const mat4 = Mat4Uniform('u_Baz', mat4.create());
```

#### `ModelMatUniform`

The `ModelMatUniform` senda a 4D matrix uniform for shaders meant to transform
model vertices into the world coordinates. The second argument is an optional
object with the following (each optional) keys:

```javascript
const modelMat = ModelMatUniform('u_ModelMat', {
  scale: 2, // Can also be an array with 1, 3, or 4 elements.
  rotate: [
    /* theta */ Math.PI / 2,
    /* axis.x */ 2,
    /* axis.y */ 1,
    /* axis.z */ 0,
  ],
  translate: [10, 10, 0],
});
```

The uniform computes the 4D model matrix which applies the corresponding
combination of transformations, the scaling is applied first, then the rotation,
and finally the translation.

The object returned by `ModelMatUniform` has accessor methods which let you get
the different components of the model transformation:

```javascript
modelMat.scaleMatrix(); // Gets the scale matrix as a 4D matrix.
modelMat.rotationMatrix(); // Gets the rotation matrix as a 3D matrix.
modelMat.translation(); // Gets the translation as a 3D vector.
```

The object returned by `ModelMatUniform` has convenience methods which allow you
to change each individual part of the transformation:

```javascript
modelMat.scale(3); // Applies this scale to the existing scale.
modelMat.setScale(3); // Resets the scale component of the matrix to the new value.

modelMat.rotate(Math.PI / 2, 1, 1, 0); // Applies the rotation to the existing rotation matrix.
modelMat.setRotation(Math.PI / 2, 1, 1, 0); // Sets the rotation matrix to apply only the provided rotation.

modelMat.translate(1, 2, 3); // Adds the new values to the existing translation vector.
modelMat.setTranslation(1, 2, 3); // Sets the translation vector to this new one.
```

#### `NormalMatUniform`

The `NormalMatUniform` sends a 3D matrix uniform for transforming model normal vectors to
a shader. It takes an object returned by `ModelMatUniform` as a second argument and computes
the resulting normal matrix automatically. Below is an example:

```javascript
const modelMat = ModelMatUniform('u_ModelMat', ...);
const normalMat = NormalMatUniform('u_NormalMat', modelMat);
```

#### `ViewMatUniform`

The `ViewMatUniform` sends a 4D matrix to a shader which transforms vertices from world coordinates
to the view coordinates of the scene's camera. It takes multiple arguments to compute the view matrix
and is based on `gl-matrix`'s `lookAt` function. Below is an example:

```javascript
const viewMat =
  ViewMatUniform(
    'u_ViewMat', /* eye */ [0, 0, 30], /* at */ [0, 0, 0], /* up */ [0, 1, 0]);
```

The object returned by `ViewMatUniform` has accessor methods which let you get the eye, at, or up
vectors that is used to compute the view matrix:

```javascript
viewMat.eye();
viewMat.at();
viewMat.up();
```

The object also has setter methods for each vector as well:

```javascript
viewMat.setEye(10, 0, 30);
viewMat.setAt(10, 0, 0);
viewMat.setUp(1, 10, 0);
```

As you may notice, the up vector does not need to be normalized, the object will do that for you when
it computes the view matrix. The `up()` method will return the value passed to `setUp` before
normalization.

#### `PerspectiveMatUniform`

The `PerspectiveMatUniform` sends a 4D matrix to a shader which transforms vertices from the view
coordinates of the scene's camera to a coordinate system with linear perspective. It takes multiple
arguments to compute the perspective matrix and is based on `g-matrix`'s `perspective` function.
Below is an example:

```javascript
const perspectiveMat =
  PerspectiveMatUniform(
    'u_PerspectiveMat', /* fovy */ Math.PI / 3, /* aspect */ 1, /* near */ 1,
    /* far */ 1e6);
```

The object returned by `PerspectiveMatUniform` has accessor methods which let you get the
field of view (in radians), the width-to-height aspect ratio, the near plane, and the far
plane that is used to compute the perspective matrix:

```javascript
perspectiveMat.fovy();
perspectiveMat.aspect();
perspectiveMat.near();
perspectiveMat.far();
```

The object also has setter methods for each parameter for the perspective matrix:

```javascript
perspectiveMat.setFovy(Math.PI / 4);
perspectiveMat.setAspect(canvas.width / canvas.height);
perspectiveMat.setNear(0.1);
perspectiveMat.setFar(1e4);
```

#### `Texture2DUniform`

The `Texture2DUniform` sends a 2D texture to a shader in a `sampler2D`
uniform. The second argument is any object which can be used as the data
source for `gl.texImage2D(...)`. Below are some examples of how you can
initialize a `Texture2DUniform`:

```javascript
const image = document.querySelector('img');
const imageTexture = Texture2DUniform('u_Foo', image);

const video = document.querySelector('video');
const videoTexture = Texture2DUniform('u_Bar', video);

const canvas = document.querySelector('canvas');
const canvasTexture = Texture2DUniform('u_Baz', canvas);

// Also could use ImageBitmap, ImageData, or OffscreenCanvas...
```

The objects returned by uniforms like `Texture2DUniform` can be the argument
of functions returned by `Shader`. This allows you to apply shaders to textures
which can be then used in other shaders. Below is an example:

```javascript
const textureShader = Shader(...);
const texture = Texture2DUniform('u_Texture');

// We render the first shader to the texture.
textureShader(texture);

const shader = Shader(vertexSrc, fragmentSrc, {
  // attributes, other options...
  uniforms: [
    texture,
    // Other uniforms...
  ],
});

// The second shader renders to the canvas and can sample from the result
// of the first shader, textureShader.
shader(canvas);
```

#### `CubeTextureUniform`

The `CubeTextureUniform` sends a cube texture to a shader in a `samplerCube`
uniform. The second argument to `CubeTextureUniform` should be an object with
a key for each face of a cube: `posx`, `negx`, `posy`, `negy`, `posz`, and `negz`.
Each value of the object should be a data source for a 2D texture that you would
for `gl.texImage2D`:

```javascript
const cubeTexture = CubeTextureUniform('u_Texture', {
  posx: rightImage,
  negx: leftImage,
  posy: topImage,
  negy: bottomImage,
  posz: frontImage,
  negz: backImage,
});
```

Unlike `Texture2DUniform`, the object returned by `CubeTextureUniform` cannot be
used as the argument for a function returned by `Shader`, though it may be nice
at some point to support this!

#### `CubeCameraUniform`

`CubeCameraUniform` allows you to render a shader to a cube texture for things
like environment mapping and dynamic reflections. It should only be used for shaders
which have a view and perspective matrix, which is almost always present in 3D
scenes.

The arguments after the name of the uniform should be the position of the cube camera
in the scene as an array of numbers, the scene's `ViewMatUniform`, and the scene's
`PerspectiveMatUniform`.

For an example of how to use the `CubeCameraUniform` for dynamic reflections, see
`examples/cube_camera/src/main.js`.

## License

This code is publicly available under an Apache-2.0 license. See LICENSE for more
information.
