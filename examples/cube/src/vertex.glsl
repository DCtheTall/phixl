precision mediump float;

attribute vec4 a_Vertices;
attribute vec2 a_TexCoords;

varying vec2 v_TexCoords;

uniform mat4 u_ModelMat;
uniform mat4 u_ViewMat;
uniform mat4 u_PerspectiveMat;

void main() {
  v_TexCoords = a_TexCoords;
  mat4 MVP = u_PerspectiveMat * u_ViewMat * u_ModelMat;
  gl_Position = MVP * a_Vertices;
}
