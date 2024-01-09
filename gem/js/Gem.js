import * as THREE from 'three';
import {toRadians} from '@/utils/mathUtils.js';
// https://tympanus.net/codrops/2021/10/27/creating-the-effect-of-transparent-glass-and-plastic-in-three-js/
// https://tympanus.net/codrops/2019/10/29/real-time-multiside-refraction-in-three-steps/

import vertexShader from '../glsl/gem.vert';
import fragmentShader from '../glsl/gem.frag?raw';

import vertexShaderBf from '../glsl/gem_bf.vert';
import fragmentShaderBf from '../glsl/gem_bf.frag';

export default class Crystal extends THREE.Mesh {
  constructor(geometry) {
    // console.log(geometry);
    geometry = new THREE.SphereGeometry(5, 4, 3);
    geometry = new THREE.SphereGeometry(5, 14, 13);
    // geometry = new THREE.OctahedronGeometry(2, 12);
    geometry = new THREE.BoxGeometry(7, 7, 7);
    // console.log(geometry.parameters);
    const material = new THREE.ShaderMaterial({
      // https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram
      uniforms: {
        time: {
          type: 'f',
          value: 0
        },
        hsv: {
          type: 'v3',
          value: new THREE.Vector3()
        },
        fogTex: {
          type: 't',
          value: null
        },
        envMap: {
          type: 't',
          value: null
        },
        backfaceMap: { value: null },
        resolution: {
          type: 'v2',
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      // side: THREE.DoubleSide,
      // depthWrite: false,
      // blending: THREE.AdditiveBlending,
      // blending: THREE.SubtractiveBlending,
      // blending: THREE.MultiplyBlending,
      glslVersion: THREE.GLSL3
    });

    // Create Object3D
    super(geometry, material);

    this.frontFaceMaterial = material
    this.backfaceMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: vertexShaderBf,
      fragmentShader: fragmentShaderBf,
      side: THREE.BackSide,
      glslVersion: THREE.GLSL3
    })

    this.name = 'Mesh';

    this.rotation.set(
      toRadians((Math.random() * 2 - 1) * 30),
      0,
      toRadians((Math.random() * 2 - 1) * 30)
    );

    // this.axisBodyRotate = new THREE.Vector3().copy(this.up).applyEuler(this.rotation);
    // this.quaternionPrev = new THREE.Quaternion();
  }
  init(hex, envMap, fogTex, backfaceMap) {
    this.material.uniforms.resolution.x = 400
    this.material.uniforms.resolution.y = 400
    this.material.uniforms.envMap.value = envMap
    this.material.uniforms.backfaceMap.value = backfaceMap;

    this.material.uniforms.hsv.value.set(hex, 0.65, 0.45);
    this.material.uniforms.fogTex.value = fogTex;

    // this.scale.multiplyScalar(3)
    // this.geometry.computeVertexNormals()

    // this.material = this.backfaceMaterial;
  }
  update(delta) {
    this.material.uniforms.time.value += delta;
    this.rotation.y += delta * 0.09;
    this.rotation.x += delta * 0.05;
    this.rotation.z += delta * 0.01;

    // this.quaternionPrev.copy(this.quaternion);
    // this.quaternion.setFromAxisAngle(this.axisBodyRotate, time * 0.1).multiply(this.quaternionPrev);
  }
}
