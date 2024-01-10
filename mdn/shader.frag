#version 300 es
precision mediump float;

in lowp vec4 vColor;
in highp vec2 vTextureCoord;
in highp vec3 vLighting;

uniform sampler2D uSampler;
out vec4 fragColor;

void main() {
  highp vec4 texelColor = texture(uSampler, vTextureCoord);

  fragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
}
