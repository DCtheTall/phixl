precision mediump float;

uniform float u_Red;
uniform float u_Green;
uniform float u_Blue;

void main() {
  gl_FragColor = vec4(u_Red, u_Green, u_Blue, 1.0);
}
