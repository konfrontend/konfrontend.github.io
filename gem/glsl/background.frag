precision highp float;

uniform float time;
uniform float hex;
uniform sampler2D tex;

varying vec2 vUv;

void main() {
  float offset = abs(sin(vUv.y + time * 0.2));
  offset = vUv.y + 0.2;

  vec3 topColor = vec3(0.0);
  vec3 bottomColor = vec3(0.5, 0.2, 0.3);
  vec3 gradient = mix(bottomColor, topColor, offset);

  gl_FragColor = vec4(gradient, 1.0);
}
