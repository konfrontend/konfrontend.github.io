import * as THREE from 'three';
import {randomArbitrary, randomInt, spherical as sphere, toRadians} from '@/utils/mathUtils.js';

// import vs from './glsl/crystalSparkle.vs';
// import fs from './glsl/crystalSparkle.fs';
const vs = `attribute vec3 position;
attribute float delay;
attribute float speed;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float time;
uniform float pixelRatio;
uniform float hex;

varying vec3 vColor;
varying float vOpacity;

// #pragma glslify: convertHsvToRgb = require(@ykob/glsl-util/src/convertHsvToRgb);
// #pragma glslify: calcRotateMat4 = require(@ykob/glsl-util/src/calcRotateMat4);


mat4 calcRotateMat4X(float radian) {
  return mat4(
    1.0, 0.0, 0.0, 0.0,
    0.0, cos(radian), -sin(radian), 0.0,
    0.0, sin(radian), cos(radian), 0.0,
    0.0, 0.0, 0.0, 1.0
  );
}
mat4 calcRotateMat4Y(float radian) {
  return mat4(
    cos(radian), 0.0, sin(radian), 0.0,
    0.0, 1.0, 0.0, 0.0,
    -sin(radian), 0.0, cos(radian), 0.0,
    0.0, 0.0, 0.0, 1.0
  );
}
mat4 calcRotateMat4Z(float radian) {
  return mat4(
    cos(radian), -sin(radian), 0.0, 0.0,
    sin(radian), cos(radian), 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
  );
}

mat4 calcRotateMat4(vec3 radian) {
  return calcRotateMat4X(radian.x) * calcRotateMat4Y(radian.y) * calcRotateMat4Z(radian.z);
}

vec3 convertHsvToRgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}


const float duration = 3.0;

void main() {
  // calculate interval time from 0 to 1
  float interval = mod(time + delay * duration, duration) / duration;

  // update position and size
  float size = 3.0 * sin(interval * 4.0);
  float blink = max(
    (sin(interval * 4.0) + cos(interval * 27.0) * 0.3 + cos(interval * 36.0) * 0.2) / 1.5 * 2.0 - 1.0,
    0.0
    );
  mat4 rotateMat = calcRotateMat4(vec3(
    radians(time * speed * 0.3),
    radians(time * speed),
    radians(time * speed * 0.3)
    ));

  // calculate colors
  vec3 hsv = vec3(hex, 0.6, 1.0);
  vec3 rgb = convertHsvToRgb(hsv);

  // coordinate transformation
  vec4 mvPosition = modelViewMatrix * rotateMat * vec4(position, 1.0);
  float distanceFromCamera = 35.0 / length(mvPosition.xyz);

  vColor = rgb;
  vOpacity = blink * clamp(distanceFromCamera, 0.5, 1.0);

  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = distanceFromCamera * pixelRatio * size;
}
`
const fs = `precision highp float;

uniform sampler2D texture;

varying vec3 vColor;
varying float vOpacity;

void main() {
  // convert PointCoord to range from -1.0 to 1.0
  vec2 p = gl_PointCoord * 2.0 - 1.0;

  // draw double circle
  float r = (1.0 - smoothstep(0.95, 1.0, length(p)));

  gl_FragColor = vec4(vColor * r, vOpacity);
}
`
const NUM = 500;

export default class CrystalSparkle extends THREE.Points {
  constructor() {
    // Define Geometry
    const geometry = new THREE.BufferGeometry();

    // Define attributes of the instancing geometry
    const baPositions = new THREE.BufferAttribute(new Float32Array(NUM * 3), 3);
    const baDelay = new THREE.BufferAttribute(new Float32Array(NUM), 1, 1);
    const baSpeed = new THREE.BufferAttribute(new Float32Array(NUM), 1, 1);
    for (var i = 0, ul = NUM; i < ul; i++) {
      const radian1 = toRadians(randomArbitrary(0, 150) - 75);
      const radian2 = toRadians(randomArbitrary(0, 360));
      const radius = Math.random() * Math.random() * 4 + 2;
      const spherical = sphere(radian1, radian2, radius);
      baPositions.setXYZ(i, spherical[0], spherical[1], spherical[2]);
      baDelay.setXYZ(i, Math.random());
      baSpeed.setXYZ(i, randomArbitrary(1, 10) * (randomInt(0, 1) * 2.0 - 1.0));
    }
    geometry.setAttribute('position', baPositions);
    geometry.setAttribute('delay', baDelay);
    geometry.setAttribute('speed', baSpeed);

    // Define Material
    const material = new THREE.RawShaderMaterial({
      uniforms: {
        time: {
          type: 'f',
          value: 0
        },
        pixelRatio: {
          type: 'f',
          value: window.devicePixelRatio
        },
        hex: {
          type: 'f',
          value: 0
        },
      },
      vertexShader: vs,
      fragmentShader: fs,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });


    // Create Object3D
    super(geometry, material);
    this.name = 'CrystalSparkle';
  }
  start(hex) {
    this.material.uniforms.hex.value = hex;
  }
  update(time) {
    this.material.uniforms.time.value += time;
  }
}
