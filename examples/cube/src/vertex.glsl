precision mediump float;

attribute float a_Red;
attribute float a_Green;
attribute float a_Blue;
attribute vec2 a_Position;
attribute mat2 a_Identity;

varying vec3 color;

void main() {
  gl_Position = vec4(a_Identity * a_Position, 0.0, 1.0);
  color = vec3(a_Red, a_Green, a_Blue);
}
