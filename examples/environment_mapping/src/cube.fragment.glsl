precision highp float;

varying vec3 v_Normal;
varying vec3 v_ViewDirection;

uniform samplerCube u_Skybox;

void main() {
  gl_FragColor = textureCube(u_Skybox, reflect(v_ViewDirection, v_Normal));
}
