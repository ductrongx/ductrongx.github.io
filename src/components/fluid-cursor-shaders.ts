export const vertexShader = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const copyShader = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uField;
void main() { gl_FragColor = texture2D(uField, vUv); }
`;

// RG: signed flow, B: surface height, A: previous height. RGBA8 needs no float extensions.
export const simulationShader = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uField;
uniform vec2 uTexel;
uniform vec2 uViewport;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uImpulse;
uniform float uRadius;
uniform float uDt;

vec2 decodeFlow(vec2 flowPacked) { return (flowPacked * 255.0 - 128.0) / 127.0; }
vec2 encodeFlow(vec2 flow) { return (clamp(flow, -1.0, 1.0) * 127.0 + 128.0) / 255.0; }

void main() {
  vec2 flow = decodeFlow(texture2D(uField, vUv).rg);
  vec2 uv = clamp(vUv - flow * 180.0 * uDt / uViewport, uTexel, 1.0 - uTexel);
  vec4 center = texture2D(uField, uv);
  vec4 left = texture2D(uField, uv - vec2(uTexel.x, 0.0));
  vec4 right = texture2D(uField, uv + vec2(uTexel.x, 0.0));
  vec4 down = texture2D(uField, uv - vec2(0.0, uTexel.y));
  vec4 up = texture2D(uField, uv + vec2(0.0, uTexel.y));
  float stepSize = min(uDt * 60.0, 1.0);
  float laplacian = left.b + right.b + down.b + up.b - 4.0 * center.b;
  float height = max(0.0, (center.b + (center.b - center.a) * 0.35
    + laplacian * 0.18 * stepSize) * exp(-uDt * 0.95) - 0.0004 * stepSize);
  vec2 averageFlow = (decodeFlow(left.rg) + decodeFlow(right.rg)
    + decodeFlow(down.rg) + decodeFlow(up.rg)) * 0.25;
  flow = mix(decodeFlow(center.rg), averageFlow, 0.04 * stepSize) * exp(-uDt * 3.2);

  vec2 point = vUv * uViewport;
  vec2 segment = uTo - uFrom;
  float along = clamp(dot(point - uFrom, segment) / max(dot(segment, segment), 0.001), 0.0, 1.0);
  vec2 offset = point - (uFrom + segment * along);
  float splat = exp(-dot(offset, offset) / (uRadius * uRadius) * 2.0) * uImpulse;
  vec2 direction = segment / max(length(segment), 1.0);
  vec2 tangent = vec2(-offset.y, offset.x) / max(uRadius, 1.0);
  flow += (direction * 0.45 + tangent * 0.12) * splat;
  height = max(height, splat * 0.65);
  gl_FragColor = vec4(encodeFlow(flow), min(height, 1.0), center.b);
}
`;

export const glassShader = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uField;
uniform vec2 uViewport;
uniform float uFade;

float heightAt(vec2 uv) { return texture2D(uField, uv).b; }
float band(float distance, float width) {
  float x = distance / max(width, 0.001);
  return exp(-x * x);
}

void main() {
  float height = heightAt(vUv);
  if (height < 0.012 || uFade <= 0.0) { gl_FragColor = vec4(0.0); return; }
  vec2 pixel = 2.0 / uViewport;
  vec2 slope = vec2(
    heightAt(vUv + vec2(pixel.x, 0.0)) - heightAt(vUv - vec2(pixel.x, 0.0)),
    heightAt(vUv + vec2(0.0, pixel.y)) - heightAt(vUv - vec2(0.0, pixel.y))
  ) * 0.25;
  float gradient = max(length(slope), 0.003);
  float edge = height - 0.12;
  // Three closely spaced contours approximate wavelength-dependent refraction.
  float peach = band(edge - gradient * 1.25, gradient * 0.65);
  float blue = band(edge + gradient * 1.25, gradient * 0.65);
  float violet = band(edge + gradient * 2.0, gradient * 0.55) * 0.55;
  float rim = band(edge, gradient * 0.7);
  float colorWeight = peach + blue + violet;
  vec3 pastel = (vec3(1.0, 0.84, 0.73) * peach
    + vec3(0.72, 0.85, 1.0) * blue
    + vec3(0.85, 0.78, 1.0) * violet) / max(colorWeight, 0.001);
  vec3 normal = normalize(vec3(-slope * 22.0, 1.0));
  float specular = pow(max(dot(normal, normalize(vec3(-0.4, 0.6, 0.85))), 0.0), 24.0);
  float whiteWeight = rim * 0.48 + band(edge, gradient * 2.3) * 0.06
    + specular * 0.055 + smoothstep(0.12, 0.4, height) * 0.012;
  float tintWeight = colorWeight * 0.30;
  float alpha = min(0.65, whiteWeight + tintWeight) * uFade;
  vec3 color = (vec3(1.0) * whiteWeight + pastel * tintWeight) / max(whiteWeight + tintWeight, 0.001);
  gl_FragColor = vec4(color * alpha, alpha);
}
`;
