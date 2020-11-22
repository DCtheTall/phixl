precision mediump float;

attribute vec2 a_Position;
attribute vec2 a_TexCoords;

varying vec2 v_TexCoords;

uniform mat4 u_ModelViewMat;
uniform mat4 u_PerspectiveMat;

void main() {
  v_TexCoords = a_TexCoords;
  gl_Position = vec4(a_Position, 0.0, 1.0);
}
