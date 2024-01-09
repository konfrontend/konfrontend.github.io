out vec3 vWorldNormal;
out vec3 vWorldPosition;
out vec3 vViewDirection;
out vec2 vUv;

void main () {
  vec4 worldPos = modelMatrix * vec4( position, 1.0);

  vWorldPosition = normalize(worldPos.xyz) * 0.5 + 0.5;
  vWorldPosition = normalize(worldPos.xyz);
//  vWorldNormal = normalize(normalMatrix * normal);
  vWorldNormal = normalize( modelViewMatrix * vec4(normal, 0.)).xyz;

  vViewDirection = normalize(vec3(modelViewMatrix * vec4(position, 1.0)).xyz);
//  vViewDirection = normalize(worldPos.xyz - cameraPosition);
  vUv = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
