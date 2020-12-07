precision highp float;

varying vec2 v_TexCoord;

uniform sampler2D u_HeightMap;
uniform sampler2D u_Riverbed;

uniform vec2 u_Resolution;

const float kDepth = 10.0;
const float kPerturbance = 0.05;

const vec3 kViewVector = vec3(0.0, 0.0, 1.0);
const float kRefractiveIndex = 1.33;

const vec3 kLightPosition = normalize(vec3(4.0, 6.0, 1.0));
const vec3 kAmbientLight = vec3(0.5, 0.6, 0.6);
const vec3 kDiffuseLight = vec3(1.0, 1.0, 0.8);
const float kDiffuseWeight = 0.4;
const vec3 kSpecularLight = vec3(1.0);
const float kSpecularExp = 50.0;

float waveHeight(vec2 pos) {
  return 2.0 * texture2D(u_HeightMap, pos).x - 1.0;
}

float waterDepth(vec2 pos) {
  return kDepth + (kPerturbance * waveHeight(pos));
}

vec3 normal() {
  float h0 = waterDepth(v_TexCoord);
  vec2 ds = 1.0 / u_Resolution;
  // Water lies on the xy-plane
  vec3 dx = vec3(ds.x, 0.0, waterDepth(v_TexCoord + ds.x) - h0);
  vec3 dy = vec3(0.0, ds.y, waterDepth(v_TexCoord + ds.y) - h0);
  return normalize(cross(dx, dy));
}

vec2 raytracedCoord() {
  vec3 norm = normal();
  float cosine = dot(norm, kViewVector);
  if (cosine >= 0.99) {
    return v_TexCoord;
  }
  vec3 axial = normalize(norm - kViewVector);
  float sine = length(cross(norm, kViewVector));
  sine /= kRefractiveIndex;
  // Negative sign is for reflection through the Z plane.
  float h = waterDepth(v_TexCoord);
  vec3 displacement = vec3(-(sine / cosine) * h * axial.xy, h);
  return v_TexCoord + displacement.xy;
}

void main() {
  gl_FragColor = texture2D(u_Riverbed, v_TexCoord);
}
