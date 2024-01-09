out vec3 vWorldNormal;
out vec3 vWorldPosition;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);

  vWorldPosition = normalize(worldPos.xyz) * 0.5 + 0.5;
  vWorldNormal = normalize(normalMatrix * normal);

  vWorldNormal = normalize( modelViewMatrix * vec4(normal, 0.)).xyz;
//  viewDirection = normalize(worldPos.xyz - cameraPosition);
//  worldPosition = normalize(worldPos.xyz) * 0.5 + 0.5;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
