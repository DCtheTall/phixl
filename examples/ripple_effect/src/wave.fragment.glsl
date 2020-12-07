precision highp float;

varying vec2 v_TexCoord;

uniform sampler2D u_HeightMap;
uniform vec2 u_Resolution;
uniform bool u_MouseDown;
uniform vec2 u_MousePosition;

const float kOneSixth = 1.0 / 6.0;
const float kTwoThirds = 2.0 / 3.0;
const float kNegTenThirds = -10.0 / 3.0;
const mat3 kDiscreteLaplaceKernel = mat3(
  kOneSixth, kTwoThirds, kOneSixth,
  kTwoThirds, kNegTenThirds, kTwoThirds,
  kOneSixth, kTwoThirds, kOneSixth);

const mat3 kBlurKernel = mat3(
  0.0625, 0.125, 0.0625,
  0.1250, 0.250, 0.1250,
  0.0625, 0.125, 0.0625);

const float kRestHeight = 0.5;
const float kDampFactor = 0.01;

const float kDisplacementRadius = 0.01;

float convolution(mat3 A, mat3 B) {
  return dot(A[0], B[0]) + dot(A[1], B[1]) + dot(A[2], B[2]);
}

float u0() {
  return texture2D(u_HeightMap, v_TexCoord).y;
}

float u1(vec2 pos) {
  return texture2D(u_HeightMap, pos).x;
}

vec2 neighborCoord(int i, int j) {
  vec2 ds = 1.0 / u_Resolution;
  return vec2(float(i), float(j)) * ds;
}

float blur(vec2 pos) {
  mat3 M = mat3(0.0);
  for (int i = -1; i < 2; i++) {
    for (int j = -1; j < 2; j++) {
      M[i + 1][j + 1] = u1(pos + neighborCoord(i, j));
    }
  }
  return convolution(M, kBlurKernel);
}

float laplacian() {
  mat3 M = mat3(0.0);
  for (int i = -1; i < 2; i++) {
    for (int j = -1; j < 2; j++) {
      M[i + 1][j + 1] = blur(v_TexCoord + neighborCoord(i, j));
    }
  }
  return convolution(M, kDiscreteLaplaceKernel);
}

float verletIntegrate() {
  return (2.0 * u1(v_TexCoord)) - u0() + laplacian();
}

float damp(float u) {
  return kDampFactor * kRestHeight + (1.0 - kDampFactor) * u;
}

float displacement(float u) {
  if (!u_MouseDown) {
    return u;
  }
  vec2 ds = v_TexCoord - u_MousePosition;
  if (length(ds) > kDisplacementRadius) {
    return u;
  }
  return 0.0;
}

void main() {
  float u = damp(verletIntegrate());
  u = displacement(u);
  gl_FragColor = vec4(u, u1(v_TexCoord), 0.0, 1.0);
}
