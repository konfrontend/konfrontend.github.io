import * as THREE from 'three';

import * as App from './App.js';
import Drag from './js/Drag.js';
import { debounce } from '@/utils/performance.js';

const resolution = new THREE.Vector2();
const panPosition = new THREE.Vector3();
const dd = new Drag(resolution);

// TODO show loader
// const preloader = document.querySelector('.p-preloader');
const canvas = document.getElementById('canvas');

const resize = () => {
  resolution.set(window.innerWidth, window.innerHeight);

  canvas.width = resolution.x;
  canvas.height = resolution.y;

  App.resize(resolution);
};
const touchstart = (e) => {
  dd.touchStart(e);
};
const touchmove = (e) => {
  dd.touchMove(e);
};
const touchend = (e) => {
  dd.touchEnd(e);
};
const addListeners = () => {
  // canvas.addEventListener('mousedown', touchstart, { passive: false });
  // window.addEventListener('mousemove', (e) => {
  //   touchmove(e);
  //   panPosition.set(
  //     (e.clientX / resolution.x * 2 - 1) * 0.1,
  //     (-e.clientY / resolution.y * 2 + 1) * 0.1,
  //     0
  //   );
  //   App.pan(panPosition);
  // });
  // document.addEventListener('mouseleave', (e) => {
  //   panPosition.set(0, 0, 0);
  //   App.pan(panPosition);
  // });
  // window.addEventListener('mouseup', touchend);
  // canvas.addEventListener('touchstart', touchstart, { passive: false });
  // window.addEventListener('touchmove', touchmove, { passive: false });
  // window.addEventListener('touchend', touchend);
  window.addEventListener('resize', debounce(resize, 100));
};
const update = () => {
  dd.update(resolution);
  App.update(dd);
  requestAnimationFrame(update);
};

try {
  App.mount(canvas).then(() => {
    addListeners();
    resize();
// preloader.classList.add('is-hidden');
    App.play(dd);
    update();
  });
} catch (err) {
  console.log(err);
}


