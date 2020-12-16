precision highp float;

varying vec3 v_Position;
varying vec3 v_Normal;
varying vec3 v_ViewDirection;

uniform samplerCube u_Skybox;

const vec3 kLightPos = vec3(0.0, 80.0, 0.0);
const vec3 kAmbientLight = vec3(0.6, 0.6, 0.6);
const vec3 kDiffuseLight = vec3(1.0, 1.0, 0.8);
const float kSpecularExp = 300.0;
const vec3 kSpecularLight = vec3(1.0);

void main() {
  vec3 texColor = textureCube(u_Skybox, reflect(v_ViewDirection, v_Normal)).xyz;
  vec3 lightColor = kAmbientLight;
  vec3 lightDir = normalize(kLightPos - v_Position);
  float diffuse = clamp(dot(lightDir, normalize(v_Normal)), 0.0, 1.0);
  lightColor += diffuse * kDiffuseLight;
  lightColor += pow(diffuse, kSpecularExp) * kSpecularLight;
  gl_FragColor = vec4(texColor * lightColor, 1.0);
}
