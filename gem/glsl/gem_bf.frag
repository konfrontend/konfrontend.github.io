precision highp float;

out vec4 FragColor;

in vec3 vWorldNormal;
in vec3 vWorldPosition;

void main() {
  FragColor = vec4(vWorldNormal, vWorldPosition.z);
//  FragColor = vec4(vWorldNormal, 1.0);
//  FragColor = vec4(vWorldPosition, 0.5);
}
