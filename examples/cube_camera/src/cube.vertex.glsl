precision highp float;

attribute vec3 a_CubeVertex;
attribute vec3 a_CubeNormal;

varying vec3 v_Normal;
varying vec3 v_ViewDirection;

uniform mat4 u_ModelMat;
uniform vec3 u_CameraPosition;
uniform mat4 u_NormalMat;
uniform mat4 u_PerspectiveMat;
uniform mat4 u_ViewMat;

void main() {
  vec4 p = u_ModelMat * vec4(a_CubeVertex, 1.0);
  v_ViewDirection = normalize(p.xyz - u_CameraPosition);

  vec4 n = u_NormalMat * vec4(normalize(a_CubeNormal), 1.0);
  v_Normal = normalize(n.xyz);

  gl_Position = u_PerspectiveMat * u_ViewMat * p;
}
