precision mediump float;

varying vec2 v_TexCoord;
varying vec3 v_Position;
varying vec3 v_Normal;

uniform sampler2D u_Texture;
uniform vec3 u_LightPos;
uniform vec3 u_AmbientLight;
uniform vec3 u_DiffuseLight;
uniform vec3 u_SpecularLight;
uniform float u_SpecularExp;

void main() {
  vec3 lightDir = normalize(u_LightPos - v_Position);
  vec3 texColor = texture2D(u_Texture, v_TexCoord).xyz;
  vec3 color = u_AmbientLight * texColor;
  float diffuse = clamp(dot(lightDir, normalize(v_Normal)), 0.0, 1.0);
  color += diffuse * u_DiffuseLight * texColor;
  // color += pow(diffuse, u_SpecularExp) * u_SpecularLight * texColor;

  gl_FragColor = vec4(color, 1.0);
}
