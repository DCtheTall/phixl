precision highp float;

varying vec2 v_TexCoord;

uniform sampler2D u_HeightMap;
uniform sampler2D u_Riverbed;

uniform vec2 u_Resolution;

const float kDepth = 5.0;
const float kPerturbance = 0.005;

const vec3 kViewVector = vec3(0.0, 0.0, 1.0);
const float kRefractiveIndex = 1.3;

const mat3 kBlurKernel = mat3(
  0.0625, 0.125, 0.0625,
  0.1250, 0.250, 0.1250,
  0.0625, 0.125, 0.0625);

float waveHeight(vec2 pos) {
  return 2.0 * texture2D(u_HeightMap, pos).x - 1.0;
}

float waterDepth(vec2 pos) {
  return kDepth + (kPerturbance * waveHeight(pos));
}

float convolution(mat3 A, mat3 B) {
  return dot(A[0], B[0]) + dot(A[1], B[1]) + dot(A[2], B[2]);
}

vec2 neighborCoord(int i, int j) {
  vec2 ds = 1.0 / u_Resolution;
  return vec2(float(i), float(j)) * ds;
}

float blurredDepth(vec2 pos) {
  mat3 M = mat3(0.0);
  for (int i = -1; i < 2; i++) {
    for (int j = -1; j < 2; j++) {
      M[i + 1][j + 1] = waterDepth(pos + neighborCoord(i, j));
    }
  }
  return convolution(M, kBlurKernel);
}

vec3 normal() {
  float h0 = blurredDepth(v_TexCoord);
  vec2 ds = 1.0 / u_Resolution;
  // Water lies on the xy-plane
  vec3 dx = vec3(ds.x, 0.0, blurredDepth(v_TexCoord + ds.x) - h0);
  vec3 dy = vec3(0.0, ds.y, blurredDepth(v_TexCoord + ds.y) - h0);
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
  // Snell's law.
  sine /= kRefractiveIndex;
  // Negative sign is for reflection through the Z plane.
  float h = blurredDepth(v_TexCoord);
  vec3 displacement = normalize(vec3(-(sine / cosine) * h * axial.xy, h));
  return v_TexCoord + displacement.xy;
}

void main() {
  gl_FragColor = texture2D(u_Riverbed, raytracedCoord());
}
