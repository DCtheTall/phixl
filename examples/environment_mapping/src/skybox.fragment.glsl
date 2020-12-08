precision highp float;

varying vec3 v_TexDirection;

uniform samplerCube u_Skybox;

void main() {
  gl_FragColor = textureCube(u_Skybox, v_TexDirection);
}
