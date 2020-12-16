precision mediump float;

attribute vec3 a_Position;
attribute vec2 a_TexCoord;
attribute vec3 a_Normal;

varying vec2 v_TexCoord;
varying vec3 v_Position;
varying vec3 v_Normal;

uniform mat4 u_ModelMat;
uniform mat4 u_ViewMat;
uniform mat4 u_PerspectiveMat;
uniform mat3 u_NormalMat;

void main() {
  v_TexCoord = a_TexCoord;
  vec4 pos = u_ModelMat * vec4(a_Position, 1.0);
  v_Position = pos.xyz;
  v_Normal = u_NormalMat * a_Normal;
  gl_Position = u_PerspectiveMat * u_ViewMat * pos;
}
