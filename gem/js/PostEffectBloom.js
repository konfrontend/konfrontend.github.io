import * as THREE from 'three';

// import vs from './glsl/PostEffect.vs';
// import fs from './glsl/PostEffectBloom.fs';

const fs = `
precision highp float;

uniform sampler2D texture1;
uniform sampler2D texture2;

varying vec2 vUv;

void main() {
  vec4 color1 = texture2D(texture1, vUv);
  vec4 color2 = texture2D(texture2, vUv);
  gl_FragColor = color1 + color2;
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

export default class PostEffectBloom extends THREE.Mesh {
  constructor() {
    // Define Geometry
    const geometry = new THREE.PlaneGeometry(2, 2);

    // Define Material
    const material = new THREE.RawShaderMaterial({
      uniforms: {
        texture1: {
          type: 't',
          value: null
        },
        texture2: {
          type: 't',
          value: null
        },
      },
      vertexShader: vs,
      fragmentShader: fs,
    });

    // Create Object3D
    super(geometry, material);
    this.name = 'PostEffectBloom';
  }
  start(texture1, texture2) {
    this.material.uniforms.texture1.value = texture1;
    this.material.uniforms.texture2.value = texture2;
  }
}
