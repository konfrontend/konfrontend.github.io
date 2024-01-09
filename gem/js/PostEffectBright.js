import * as THREE from 'three';

// import vs from './glsl/PostEffect.vs';
// import fs from './glsl/PostEffectBright.fs';

const fs = `
precision highp float;

uniform float minBright;
uniform sampler2D texture;

varying vec2 vUv;

void main() {
  vec4 bright = max(vec4(0.0), (texture2D(texture, vUv) - minBright));
  gl_FragColor = bright;
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
export default class PostEffectBright extends THREE.Mesh {
  constructor() {
    // Define Geometry
    const geometry = new THREE.PlaneGeometry(2, 2);

    // Define Material
    const material = new THREE.RawShaderMaterial({
      uniforms: {
        minBright: {
          type: 'f',
          value: 0.5
        },
        texture: {
          type: 't',
          value: null
        },
      },
      vertexShader: vs,
      fragmentShader: fs,
    });

    super(geometry, material);
    this.name = 'PostEffectBright';
  }
  start(texture) {
    this.material.uniforms.texture.value = texture;
  }
}
