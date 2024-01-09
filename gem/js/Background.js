import * as THREE from 'three';

import vertexShader from '../glsl/background.vert';
import fragmentShader from '../glsl/background.frag';

export default class Background extends THREE.Mesh {
  constructor() {
    const geometry = new THREE.SphereGeometry(100, 12, 12);
    const material = new THREE.RawShaderMaterial({
      uniforms: {
        time: { value: 0 },
        hex: { value: 0 },
        tex: { value: null }
      },
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      depthTest: false
    });

    super(geometry, material);
  }

  init(texture) {
    this.material.uniforms.tex.value = texture;
  }

  update(delta, hex, resolution) {
    this.material.uniforms.time.value += delta;
    this.material.uniforms.hex.value = hex;
  }
}
