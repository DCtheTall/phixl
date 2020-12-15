precision mediump float;

attribute vec3 a_CubeVertex;

varying vec3 v_TexDirection;

uniform mat4 u_ViewMat;
uniform mat4 u_PerspectiveMat;

const float kScale = 100.0;

void main() {
  v_TexDirection = a_CubeVertex;
  gl_Position =
    u_PerspectiveMat * u_ViewMat * vec4(kScale * a_CubeVertex, 1.0);
}
