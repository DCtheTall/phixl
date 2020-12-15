precision highp float;

varying vec3 v_Normal;
varying vec3 v_ViewDirection;

uniform samplerCube u_CubeCamera;

void main() {
  gl_FragColor = textureCube(u_CubeCamera, -reflect(v_ViewDirection, v_Normal));
}
