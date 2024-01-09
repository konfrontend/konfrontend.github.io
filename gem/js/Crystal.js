import * as THREE from 'three';
import {toRadians} from '@/utils/mathUtils.js';

// import vs from './glsl/crystal.vs';
// import fs from './glsl/crystal.fs';

const vs = `
#include <noise>

in vec3 position;
in vec2 uv;
in vec3 normal;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

uniform sampler2D normalMap;

out vec3 vPosition;
out vec2 vUv;
out float vNoise;

void main(void) {
  // get a turbulent 3d noise using the normal, normal to high freq
  float noise = 10.0 *  -.10 * turbulence( .5 * normal );
  // get a 3d noise using the position, low frequency
  float b = 5.0 * pnoise( 0.05 * position, vec3( 100.0 ) );
  // compose both noises
  float displacement = 5. * noise + b;

  // move the position along the normal and transform it
  vec3 newPosition = position + normal * displacement;

  // vec4 noiseTex = texture( normalMap, uv );
  vec4 mPosition = modelMatrix * vec4(position, 1.0);
  vPosition = mPosition.xyz;

  vUv = uv;
  vNoise = noise;

  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(newPosition, 1.0);
  // gl_Position = projectionMatrix * viewMatrix * mPosition;
}
`
const fs = `
precision highp float;

out vec4 FragColor;

uniform vec3 hsv;
uniform float time;
uniform sampler2D normalMap;
uniform sampler2D surfaceTex;
uniform sampler2D fogTex;

in vec3 vPosition;
in vec2 vUv;
in float vNoise;

//#pragma glslify: convertHsvToRgb = require(@ykob/glsl-util/src/convertHsvToRgb);
vec3 convertHsvToRgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  // the pointyness color
  vec3 surface = texture(surfaceTex, vUv).rgb;
  vec3 normal = texture(normalMap, vUv).rgb;
  vec4 fog1 = texture(fogTex, vUv + vec2(0.0, time * 0.06));
  vec4 fog2 = texture(fogTex, vUv + vec2(0.0, time * -0.03));
  vec4 fog3 = texture(fogTex, vUv + vec2(0.0, time * 0.03));
  vec4 fog4 = texture(fogTex, vUv + vec2(0.0, time * -0.06));

  vec3 rgb = convertHsvToRgb(hsv + vec3((fog3.r + fog4.r - 1.0) * 0.16, (1.0 - surface.r) * 0.05, surface.r + (fog1.r + fog2.g - 1.0) + 0.5));
  vec3 color = rgb;

  FragColor = vec4(color, 1.0);
  // FragColor = texture(surfaceTex, vUv).rgba + vec4(rgb, 1.0);

  // compose the colour using the UV coordinate
  // and modulate it with the noise like ambient occlusion
  // color = vec3( vUv * ( 1. - 2. * vNoise ), 0.0 );
  // FragColor = vec4( color.rgb, 1.0 );

}
`

function generateNoise () {
  const opacity = 0.2
  let number

  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;

  const ctx = canvas.getContext('2d');

  for ( let x = 0; x < canvas.width; x++ ) {
    for ( let y = 0; y < canvas.height; y++ ) {
      number = Math.floor( Math.random() * 60 );

      ctx.fillStyle = "rgba(" + number + "," + number + "," + number + "," + opacity + ")";
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const texture =  new THREE.Texture(canvas);

  texture.needsUpdate = true

  return texture
}

export default class Crystal extends THREE.Mesh {
  constructor(geometry) {
    geometry = new THREE.SphereGeometry(5, 4, 3, 9);
    // Define Material
    let material = new THREE.RawShaderMaterial({
      uniforms: {
        time: {
          type: 'f',
          value: 0
        },
        hsv: {
          type: 'v3',
          value: new THREE.Vector3()
        },
        normalMap: {
          type: 't',
          value: null
        },
        surfaceTex: {
          type: 't',
          value: null
        },
        fogTex: {
          type: 't',
          value: null
        },
      },
      vertexShader: vs,
      fragmentShader: fs,
      transparent: true,
      // depthWrite: false,
      // blending: THREE.AdditiveBlending,
      // blending: THREE.SubtractiveBlending,
      // blending: THREE.MultiplyBlending,
      glslVersion: THREE.GLSL3
    });

    // Create Object3D
    super(geometry, material);
    this.name = 'Mesh';

    this.rotation.set(
      toRadians((Math.random() * 2 - 1) * 30),
      0,
      toRadians((Math.random() * 2 - 1) * 30)
    );
    // this.axisBodyRotate = new THREE.Vector3().copy(this.up).applyEuler(this.rotation);
    // this.quaternionPrev = new THREE.Quaternion();
  }
  start(hex, normalMap, surfaceTex, fogTex) {
    // this.material.uniforms.hsv.value.set(hex, 0.65, 0.0);
    // this.material.uniforms.normalMap.value = normalMap;
    // this.material.uniforms.surfaceTex.value = surfaceTex;
    // this.material.uniforms.fogTex.value = fogTex;
  }
  update(time) {
    // this.material.uniforms.time.value += time;
    // this.quaternionPrev.copy(this.quaternion);
    // this.quaternion.setFromAxisAngle(this.axisBodyRotate, time * 0.1).multiply(this.quaternionPrev);
  }
}
