# Cube camera example

<img src="./screenshot.png" width="300">

This example shows how you can use phixl to render a scene to a cube camera to
create dynamic reflections.

It demonstrates how you can render a shader function to a `CubeCameraUniform`
and use environment mapping to map the cube camera to a teapot model.

## Topics covered in this example

### High level topics

- Skyboxes
- Cube textures
- Cube camera
- Environment mapping
- Rendering a 3D object
- Applying 3D transformations to objects
- Using 2D textures
- Diffuse and specular lighting
- Animating your scene
- Loading data into a shader from an OBJ file

### Code

- `CubeCameraUniform`
- `CubeTextureUniform`
- `ModelMatUniform`
- `NormalMatUniform`
- `PerspectiveMatUniform`
- `Shader`
- `Vec3Attribute`
- `ViewMatUniform`
- `Vec3Uniform`
