precision mediump float;

attribute vec3 a_Vertex;

varying vec3 v_TexDirection;

uniform mat4 u_ViewMat;
uniform mat4 u_PerspectiveMat;

const float kScale = 100.0;

void main() {
  v_TexDirection = a_Vertex;
  gl_Position =
    u_PerspectiveMat * u_ViewMat * vec4(kScale * a_Vertex, 1.0);
}
