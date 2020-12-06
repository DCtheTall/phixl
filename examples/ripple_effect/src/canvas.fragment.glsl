precision highp float;

varying vec2 v_TexCoord;

uniform sampler2D u_HeightMap;

void main() {
  gl_FragColor = vec4(vec3(texture2D(u_HeightMap, v_TexCoord).x), 1.0);
}
