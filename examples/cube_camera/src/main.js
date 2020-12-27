const {
  CUBE_INDICES,
  CUBE_N_VERTICES,
  CUBE_NORMALS,
  CUBE_VERTICES,
  CubeCameraUniform,
  CubeTextureUniform,
  ModelMatUniform,
  NormalMatUniform,
  PerspectiveMatUniform,
  Shader,
  Vec3Attribute,
  ViewMatUniform,
  Vec3Uniform,
} = require('../../../dist');
const {mat4, vec3, vec4} = require('gl-matrix');
const {Mesh} = require('webgl-obj-loader');

const CANVAS_SIZE = 512;
const N_ORBITING_CUBES = 6;
const ORBIT_RADIUS = 40;

const TEAPOT_OBJ_URL = '/teapot.obj';

const randomVec3 = () =>
  vec3.fromValues(Math.random(), Math.random(), Math.random());

const rotateVector = (v, theta, axis) => {
  const R = mat4.fromRotation(mat4.create(), theta, axis);
  const v4 = vec4.transformMat4(
    vec4.create(), vec4.fromValues(v[0], v[1], v[2], 1), R);
  return vec3.fromValues(v4[0], v4[1], v4[2]);
};

const initializeOrbits = (modelMatrices) => {
  if (modelMatrices.length !== N_ORBITING_CUBES) {
    throw new Error('Incorrect number of model matrices');
  }

  const radialVecs = [
    vec3.fromValues(-ORBIT_RADIUS, 0, 0),
    vec3.fromValues(ORBIT_RADIUS, 0, 0),
    vec3.fromValues(0, -ORBIT_RADIUS, 0),
    vec3.fromValues(0, ORBIT_RADIUS, 0),
    vec3.fromValues(0, 0, ORBIT_RADIUS),
    vec3.fromValues(0, 0, -ORBIT_RADIUS),
  ];
  if (radialVecs.length !== N_ORBITING_CUBES) {
    throw new Error('Incorrect nmber of radial vectors');
  }

  const orbitAxisVecs = radialVecs.map((radial) => {
    const random = randomVec3();
    return vec3.normalize(
      vec3.create(), vec3.cross(vec3.create(), radial, random));
  });
  const rotationAxisVecs = orbitAxisVecs.map(
    () => vec3.normalize(vec3.create(), randomVec3()));
  const thetas = rotationAxisVecs.map(() => Math.random() * Math.PI / 256);

  let t = 0;

  return () => {
    t++;
    for (let i = 0; i < N_ORBITING_CUBES; i++) {
      modelMatrices[i].setTranslation(
        ...rotateVector(radialVecs[i], thetas[i] * t, orbitAxisVecs[i]));
      const axis = rotationAxisVecs[i];
      modelMatrices[i].rotate(thetas[i], axis[0], axis[1], axis[2]);
    }
  };
};

const loadTeapot = async () => {
  const resp = await fetch(TEAPOT_OBJ_URL);
  const mesh = new Mesh(await resp.text());
  return {
    indices: new Uint16Array(mesh.indices),
    normals: new Float32Array(mesh.vertexNormals),
    vertices: new Float32Array(mesh.vertices),
  };
};

const main = async () => {
  // Get the canvas from the DOM and set dimensions.
  const canvas = document.getElementById('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  // Load shaders for the background and cube.
  const cubeVertSrc = require('./cube.vertex.glsl').default;
  const cubeFragSrc = require('./cube.fragment.glsl').default;
  const skyboxVertSrc = require('./skybox.vertex.glsl').default;
  const skyboxFragSrc = require('./skybox.fragment.glsl').default;

  // Both shaders render a cube.
  const cubeVertices = Vec3Attribute('a_CubeVertex', CUBE_VERTICES)

  // View and perspective matrix uniforms.
  const eyeVec = [0, 0, 30];
  const viewMat =
    ViewMatUniform(
      'u_ViewMat', eyeVec, /* at */ [0, 0, 0], /* up */ [0, 1, 0]);
  const perspectiveMat =
    PerspectiveMatUniform(
      'u_PerspectiveMat', /* fovy */ Math.PI / 3, /* aspect */ 1, /* near */ 1,
      /* far */ 1e3);

  const skyboxCubeTexture = CubeTextureUniform('u_Skybox', {
    posx: document.getElementById('skybox-right'),
    negx: document.getElementById('skybox-left'),
    posy: document.getElementById('skybox-top'),
    negy: document.getElementById('skybox-bottom'),
    posz: document.getElementById('skybox-front'),
    negz: document.getElementById('skybox-back'),
  });

  const skybox =
    Shader(CUBE_N_VERTICES, skyboxVertSrc, skyboxFragSrc, {
      mode: WebGLRenderingContext.TRIANGLES,
      indices: CUBE_INDICES,
      attributes: [cubeVertices],
      uniforms: [
        viewMat,
        perspectiveMat,
        skyboxCubeTexture,
      ],
    });

  const cubeShader = (modelMatUniform) =>
    Shader(CUBE_N_VERTICES, cubeVertSrc, cubeFragSrc, {
      clear: false,
      mode: WebGLRenderingContext.TRIANGLES,
      indices: CUBE_INDICES,
      attributes: [
        cubeVertices,
        Vec3Attribute('a_CubeNormal', CUBE_NORMALS),
      ],
      uniforms: [
        modelMatUniform,
        viewMat,
        perspectiveMat,
        NormalMatUniform('u_NormalMat', modelMatUniform),
        skyboxCubeTexture,
        Vec3Uniform('u_CameraPosition', eyeVec),
      ],
    });

  // Create model matrix uniforms for each orbiting cube.
  const orbitCubesModelMatrices = [...Array(N_ORBITING_CUBES)].map(
    () => ModelMatUniform('u_ModelMat', {scale: 3 - (2 * Math.random())}));

  // Create a callback which ticks the oribiting cubes' animation.
  const tickOrbit = initializeOrbits(orbitCubesModelMatrices);

  // Create the shaders for each orbiting cube.
  const orbitCubeShaders = orbitCubesModelMatrices.map(
    modelMat => cubeShader(modelMat));

  // Model matrix for the reflective object.
  const reflectiveModelMat = ModelMatUniform('u_ModelMat', {
    scale: 0.3,
    rotate: [-Math.PI / 2, 1, 0, 0],
    translate: [0, -10, 0],
  });

  // Cube camera uniform lets you render a shader onto a cube texture.
  // You must supply the view and perspective matrix uniforms for the
  // shader you want to render to the cube camera as arguments.
  const cubeCamera =
    CubeCameraUniform(
      'u_Skybox', /* position */ [0, 0, 0], viewMat, perspectiveMat);

  const {indices, vertices, normals} = await loadTeapot();

  // const reflectiveCube = cubeShader(reflectiveModelMat, cubeCamera);
  const teapot = Shader(indices.length, cubeVertSrc, cubeFragSrc, {
    clear: false,
    mode: WebGLRenderingContext.TRIANGLES,
    indices: indices,
    attributes: [
      Vec3Attribute('a_CubeVertex', vertices),
      Vec3Attribute('a_CubeNormal', normals),
    ],
    uniforms: [
      reflectiveModelMat,
      viewMat,
      perspectiveMat,
      NormalMatUniform('u_NormalMat', reflectiveModelMat),
      cubeCamera,
      Vec3Uniform('u_CameraPosition', eyeVec),
    ],
  });

  const animate = () => {
    // Render the skybox.
    skybox(canvas);

    // Tick the orbiting cube's animation.
    tickOrbit();

    // Render the orbiting cubes.
    for (const shader of orbitCubeShaders) {
      shader(canvas);
    }

    // Apply a transformation to the cube model.
    // reflectiveModelMat.rotate(Math.PI / 1024, 2, 1, 0);

    // Render the skybox onto the cube camera texture.
    skybox(cubeCamera);

    // Render the orbiting cubes onto the cube camera.
    for (const shader of orbitCubeShaders) {
      shader(cubeCamera);
    }

    // Render the reflective cube to the canvas.
    teapot(canvas);

    // Call "animate" again on the next animation frame.
    window.requestAnimationFrame(animate);
  };
  animate();
};

document.body.onload = main;
