precision mediump float;

attribute vec2 a_PlanePosition;
attribute vec2 a_PlaneTexCoords;

varying vec2 v_PlaneTexCoords;

uniform mat4 u_ModelMat;
uniform mat4 u_ViewMat;
uniform mat4 u_PerspectiveMat;

void main() {
  v_PlaneTexCoords = a_PlaneTexCoords;
  gl_Position = vec4(a_PlanePosition, 0.0, 1.0);
}
