precision highp float;

varying vec2 v_TexCoord;

uniform vec2 u_Resolution;
uniform sampler2D u_Texture;

const mat3 kBlurKernel = mat3(0.0625, 0.125, 0.0625,
                              0.1250, 0.250, 0.1250,
                              0.0625, 0.125, 0.0625);

// Kernel for the x-component of the Sobel operator.
const mat3 kSobelKernelX = mat3(1.0, 0.0, -1.0,
                                2.0, 0.0, -2.0,
                                1.0, 0.0, -1.0);

// Kernel for the y-component of the Sobel operator.
const mat3 kSobelKernelY = mat3(1.0, 2.0, 1.0,
                                0.0, 0.0, 0.0,
                                -1.0, -2.0, -1.0);

const float kEdgeThreshold = 0.05;

vec2 neighborCoords(int i, int j) {
  vec2 ds = 1.0 / u_Resolution;
  return vec2(float(i), float(j)) * ds;
}

float convolution(mat3 A, mat3 B) {
  return dot(A[0], B[0]) + dot(A[1], B[1]) + dot(A[2], B[2]);
}

float intensity(vec3 color) {
  return pow(length(color), 2.0) / 3.0;
}

vec3 sampleTexture(vec2 pos) {
  vec2 coord = vec2(pos.x, 1.0 - pos.y);
  vec3 color = texture2D(u_Texture, coord).xyz;
  return color;
}

float blurredIntensity(vec2 pos) {
  vec2 ds = 1.0 / u_Resolution;
  mat3 M = mat3(0.0);
  for (int i = -1; i < 2; i++) {
    for (int j = -1; j < 2; j++) {
      vec2 coord = pos + neighborCoords(i, j);
      M[i + 1][j + 1] = intensity(sampleTexture(coord));
    }
  }
  return convolution(M, kBlurKernel);
}

vec2 gradient() {
  vec2 ds = 1.0 / u_Resolution;
  mat3 M = mat3(0.0);
  for (int i = -1; i < 2; i++) {
    for (int j = -1; j < 2; j++) {
      vec2 coord = v_TexCoord + neighborCoords(i, j);
      M[i + 1][j + 1] = blurredIntensity(coord);
    }
  }
  return vec2(convolution(M, kSobelKernelX), convolution(M, kSobelKernelY));
}

void main() {
  vec2 g = gradient();
  if (length(g) < kEdgeThreshold) {
    g = vec2(0.0);
  }
  gl_FragColor = vec4(vec3(length(g)), 1.0);
}
