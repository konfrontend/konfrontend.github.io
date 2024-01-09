import * as THREE from 'three';
import { toRadians } from '@/utils/mathUtils.js';

import vertexShader from '../glsl/Fog.vert';
import fragmentShader from '../glsl/Fog.frag';

export default class Fog extends THREE.Mesh {
  constructor() {
    const geometry = new THREE.PlaneGeometry(55, 55);
    const material = new THREE.RawShaderMaterial({
      uniforms: {
        time: { value: 0 },
        hex: { value: 0 },
        fogTex: { value: null },
        direction: { value: new THREE.Vector2() }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    super(geometry, material);
  }

  init(hex, fogTex) {
    const radians = toRadians(Math.random() * 360);

    this.material.uniforms.direction.value.set(Math.cos(radians), Math.sin(radians));
    this.material.uniforms.hex.value = hex;
    this.material.uniforms.fogTex.value = fogTex;
  }

  update(time) {
    this.material.uniforms.time.value += time;
  }
}
