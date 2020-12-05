precision highp float;

varying vec2 v_TexCoord;

uniform vec2 u_Resolution;
uniform sampler2D u_CurrentCells;

const vec3 kBlack = vec3(0.0);
const vec3 kWhite = vec3(1.0);
const vec3 kWarmBlue = vec3(0.6, 1.0, 0.8);
const vec3 kGreen = vec3(0.6, 1.0, 0.2);
const vec3 kDullGreen = vec3(0.4, 0.5, 0.0);

vec2 neighborCoords(int i, int j) {
  vec2 ds = 1.0 / u_Resolution;
  return vec2(float(i) * ds.x, float(j) * ds.y);
}

bool isAlive(vec2 coord) {
  vec3 color = texture2D(u_CurrentCells, coord).xyz;
  return length(color) > 0.0;
}

int aliveNeighbors() {
  int neighbors = 0;
  for (int i = -1; i < 2; i++) {
    for (int j = -1; j < 2; j++) {
      if (i == 0 && j == 0) {
        continue;
      }
      vec2 coord = v_TexCoord + neighborCoords(i, j);
      if (isAlive(coord)) {
        neighbors++;
      }
    }
  }
  return neighbors;
}

bool shouldLive(bool wasAlive) {
  int neighbors = aliveNeighbors();
  return (wasAlive && (neighbors == 2)) || (neighbors == 3);
}

vec3 nextColor(bool alive) {
  if (!alive) {
    return kBlack;
  }
  vec3 cur = texture2D(u_CurrentCells, v_TexCoord).xyz;
  if (cur == kBlack) {
    return kWhite;
  }
  if (cur == kWhite) {
    return kWarmBlue;
  }
  if (cur == kWarmBlue) {
    return kGreen;
  }
  return kDullGreen;
}

void main() {
  bool alive = shouldLive(isAlive(v_TexCoord));
  gl_FragColor = vec4(nextColor(alive), 1.0);
}
