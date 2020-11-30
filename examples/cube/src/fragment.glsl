precision mediump float;

varying vec2 v_TexCoord;
varying vec3 v_Position;
varying vec3 v_Normal;

uniform sampler2D u_Texture;

const vec3 kLightPos = vec3(0.0, 80.0, 1.0);
const vec3 kAmbientLight = vec3(0.3, 0.35, 0.4);
const vec3 kDiffuseLight = vec3(1.0, 1.0, 0.8);
const float kSpecularExp = 50.0;
const vec3 kSpecularLight = vec3(1.0);

void main() {
  vec3 color = kAmbientLight;
  vec3 lightDir = normalize(kLightPos - v_Position);
  float diffuse = clamp(dot(lightDir, normalize(v_Normal)), 0.0, 1.0);
  color += diffuse * kDiffuseLight;
  color += pow(diffuse, kSpecularExp) * kSpecularLight;
  color *= texture2D(u_Texture, v_TexCoord).xyz;

  gl_FragColor = vec4(color, 1.0);
}
