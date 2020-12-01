const {
  CUBE_N_VERTICES,
  CUBE_VERTICES,
  CUBE_TEX_COORDS,
  CUBE_INDICES,
  CUBE_NORMALS,
  ModelMatUniform,
  NormalMatUniform,
  PerspectiveMatUniform,
  Rotate,
  Shader,
  Texture2DUniform,
  Vec2Attribute,
  Vec3Attribute,
  ViewMatUniform,
} = require('../../../dist');

const video = document.getElementById('texture');

function main() {
  const vertexShader = require('./vertex.glsl').default;
  const fragmentShader = require('./fragment.glsl').default;

  const canvas = document.getElementById('canvas');

  // Create the model matrix uniform object.
  const modelMat = ModelMatUniform('u_ModelMat', {
    translate: [0, 0, 5],
    scale: 15,
  });
  
  // Create the rotation applied to the model matrix after every cube.
  const rotate = Rotate(Math.PI / 512, 1, 1, 0);

  const shader = Shader(CUBE_N_VERTICES, vertexShader, fragmentShader, {
    mode: WebGLRenderingContext.TRIANGLES,
    indices: CUBE_INDICES,
    attributes: [
      Vec3Attribute('a_Position', CUBE_VERTICES),
      Vec2Attribute('a_TexCoord', CUBE_TEX_COORDS),
      Vec3Attribute('a_Normal', CUBE_NORMALS),
    ],
    uniforms: [
      modelMat,
      ViewMatUniform(
        'u_ViewMat', /* eye */ [0, 0, 5], /* at */ [0, 0, 0],
        /* up */ [0, 1, 0]),
      PerspectiveMatUniform(
        'u_PerspectiveMat', /* fovy */ Math.PI / 3, /* aspect */ 1,
        /* near */ 1, /* far */ 1e6),
      // Normal matrix is automatically updated when model matrix is updated.
      NormalMatUniform('u_NormalMat', modelMat),
      Texture2DUniform('u_Texture', video),
    ],
  });

  // First render
  const animate = () => {
    // Apply transformations to uniforms.
    rotate(modelMat);

    // Render the shader on the given target.
    shader(canvas);

    // Call animate again on next frame.
    window.requestAnimationFrame(animate);
  };
  
  animate();
}

video.play();
video.oncanplaythrough = main;
