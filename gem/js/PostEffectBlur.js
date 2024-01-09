import * as THREE from 'three';

// import vs from './glsl/PostEffect.vs';
// import fs from './glsl/PostEffectBlur.fs';

const fs = `
precision highp float;

uniform vec2 resolution;
uniform vec2 direction;
uniform sampler2D texture;

varying vec2 vUv;

vec4 gaussianBlur(sampler2D texture, vec2 uv, float radius, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 step = radius / resolution * direction;
  color += texture2D(texture, uv - 4.0 * step) * 0.02699548325659403;
  color += texture2D(texture, uv - 3.0 * step) * 0.06475879783294587;
  color += texture2D(texture, uv - 2.0 * step) * 0.12098536225957168;
  color += texture2D(texture, uv - 1.0 * step) * 0.17603266338214976;
  color += texture2D(texture, uv) * 0.19947114020071635;
  color += texture2D(texture, uv + 1.0 * step) * 0.17603266338214976;
  color += texture2D(texture, uv + 2.0 * step) * 0.12098536225957168;
  color += texture2D(texture, uv + 3.0 * step) * 0.06475879783294587;
  color += texture2D(texture, uv + 4.0 * step) * 0.02699548325659403;
  return color;
}

void main() {
  vec4 color = gaussianBlur(texture, vUv, 1.0, resolution, direction);
  gl_FragColor = color;
}

`
const vs = `
attribute vec3 position;
attribute vec2 uv;

varying vec2 vUv;

void main() {
  vUv = uv;

  gl_Position = vec4(position, 1.0);
}
`

export default class PostEffectBlur extends THREE.Mesh {
  constructor() {
    // Define Geometry
    const geometry = new THREE.PlaneGeometry(2, 2);

    // Define Material
    const material = new THREE.RawShaderMaterial({
      uniforms: {
        resolution: {
          type: 'v2',
          value: new THREE.Vector2()
        },
        direction: {
          type: 'v2',
          value: new THREE.Vector2()
        },
        texture: {
          type: 't',
          value: null
        },
      },
      vertexShader: vs,
      fragmentShader: fs,
    });

    // Create Object3D
    super(geometry, material);
    this.name = 'PostEffectBlur';
  }
  start(texture, x, y) {
    this.material.uniforms.texture.value = texture;
    this.material.uniforms.direction.value.set(x, y);
  }
  resize(x, y) {
    this.material.uniforms.resolution.value.set(x, y);
  }
}
