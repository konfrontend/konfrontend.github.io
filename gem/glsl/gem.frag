precision highp float;

out vec4 FragColor;

uniform vec3 hsv;
uniform float time;
uniform sampler2D fogTex;
uniform sampler2D envMap;
uniform sampler2D backfaceMap;
uniform vec2 resolution;

in vec2 vUv;
in vec3 vWorldNormal;
in vec3 vViewDirection;
in vec3 vWorldPosition;

vec3 convertHsvToRgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float ior = 2.4;
float a = 0.33;
float diffuse = 0.2;

vec3 fogColor = vec3(1.0);
vec3 reflectionColor = vec3(1.0);

float fresnelFunc(vec3 viewDirection, vec3 worldNormal, float bias, float power, float scale) {
  float fresnelTerm = bias + scale * pow(1.0 + dot(viewDirection, worldNormal), power);
  return clamp(fresnelTerm, 0.0, 1.0);
}

void main() {
  // screen coordinates
  vec2 uv = gl_FragCoord.xy / resolution;
//  uv = vUv;

  // sample backface data from texture
  vec4 backfaceTex = texture(backfaceMap, uv);
  vec3 backfaceNormal = backfaceTex.rgb;
  float backfaceDepth = backfaceTex.a;

  float frontfaceDepth = vWorldPosition.z;

  // combine backface and frontface normal
  vec3 normal = vWorldNormal * (1.0 - a) - backfaceNormal * a;

  // calculate refraction and apply to uv
  vec3 refracted = refract(vViewDirection, normal, 1.0 / ior);
  uv += refracted.xy;

  // sample environment texture
  vec4 tex = texture(envMap, uv);

  // calculate fresnel
  float fresnel = fresnelFunc(vViewDirection, normal, 0.0, 3.0, 1.0);

  // calculate thickness
  vec3 thickness = vec3(frontfaceDepth - backfaceDepth) * 0.1 + 0.9;

  vec4 final = tex;

  // apply local fog
  final.rgb = mix(tex.rgb, fogColor, thickness * diffuse);

  // apply fresnel
  final.rgb = mix(final.rgb, reflectionColor, fresnel);

  // apply fog texture
  vec4 fog = texture(fogTex, uv);
  vec4 fog1 = texture(fogTex, uv + vec2(0.0, time * 0.06));
  vec4 fog2 = texture(fogTex, uv + vec2(0.0, time * -0.03));
  vec4 fog3 = texture(fogTex, uv + vec2(0.0, time * 0.03));
  vec4 fog4 = texture(fogTex, uv + vec2(0.0, time * -0.06));
  vec3 fogColor = vec3(
    (fog3.r + fog4.r - 1.0) * 0.16,
    (1.0 - fog.r) * 0.05,
    tex.r + (fog1.r + fog2.g - 1.0) + 0.5
  );
  vec3 rgb = convertHsvToRgb(hsv + fogColor);
//  rgb = convertHsvToRgb(hsv);
//  rgb = fogColor;

  final.rgb = mix(final.rgb, rgb, 0.5);

  FragColor = vec4(final.rgb, 1.0);
}
