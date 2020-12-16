precision highp float;

attribute vec3 a_CubeVertex;
attribute vec3 a_CubeNormal;

varying vec3 v_Position;
varying vec3 v_Normal;
varying vec3 v_ViewDirection;

uniform mat4 u_ModelMat;
uniform vec3 u_CameraPosition;
uniform mat3 u_NormalMat;
uniform mat4 u_PerspectiveMat;
uniform mat4 u_ViewMat;

void main() {
  vec4 cubeWorldPos = u_ModelMat * vec4(a_CubeVertex, 1.0);
  v_Position = cubeWorldPos.xyz;

  v_ViewDirection = normalize(cubeWorldPos.xyz - u_CameraPosition);
  v_Normal = u_NormalMat * a_CubeNormal;

  gl_Position = u_PerspectiveMat * u_ViewMat * cubeWorldPos;
}
