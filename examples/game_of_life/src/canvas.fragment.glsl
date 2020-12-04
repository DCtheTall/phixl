precision highp float;

varying vec2 v_TexCoord;

uniform sampler2D u_CurrentCells;

void main() {
  gl_FragColor = texture2D(u_CurrentCells, v_TexCoord);
}
