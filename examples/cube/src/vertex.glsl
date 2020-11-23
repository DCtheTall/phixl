precision mediump float;

attribute vec2 a_PlanePosition;
attribute vec2 a_PlaneTexCoords;

varying vec2 v_PlaneTexCoords;

uniform mat4 u_ModelMat;
uniform mat4 u_PerspectiveMat;
uniform mat4 u_ViewMat;

void main() {
  v_TexCoords = a_TexCoords;
  gl_Position = vec4(a_Position, 0.0, 1.0);
}
