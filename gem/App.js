import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { toRadians } from '@/utils/mathUtils.js';
import Camera from './js/Camera.js';
import Crystal from './js/Gem.js';
import Background from './js/Background.js';
import Fog from './js/Fog.js';
import PostEffectBright from './js/PostEffectBright.js';
import PostEffectBlur from './js/PostEffectBlur.js';
import PostEffectBloom from './js/PostEffectBloom.js';


// TODO procedural noise texture
// https://github.com/tuxalin/procedural-tileable-shaders/tree/master/screenshots


let renderer;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
camera.layers.enable(0)
camera.layers.enable(1)
camera.position.z = 1;

const clock = new THREE.Clock(false);
const objLoader = new OBJLoader();
const gltfLoader = new GLTFLoader();
const texLoader = new THREE.TextureLoader();

const rt = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
const backfaceMapTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
const envMapTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
const renderTarget2 = new THREE.WebGLRenderTarget();
const renderTarget3 = new THREE.WebGLRenderTarget();
const scenePE = new THREE.Scene();
const cameraPE = new THREE.OrthographicCamera();
cameraPE.layers.set(1);
cameraPE.position.z = 5;
//
const CRYSTALS_COUNT = 10;
const FOGS_COUNT = 20;
const crystals = [];
const crystalSparkles = [];
const fogs = [];
const lookPosition = new THREE.Vector3();
const panPosition = new THREE.Vector3();
let controls = null;
let lookIndex = 0;

const bg = new Background();

// For the post effect.
const postEffectBright = new PostEffectBright();
const postEffectBlurX = new PostEffectBlur();
const postEffectBlurY = new PostEffectBlur();
const postEffectBloom = new PostEffectBloom();

export async function mount(canvas) {
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    // antialias: true,
    canvas: canvas
  });
  // renderer.setPixelRatio(window.devicePixelRatio);
  renderer.autoClear = false;

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  // camera.start();


  // postEffectBright.start(envMapTarget.texture);
  // postEffectBlurX.start(renderTarget2.texture, 1, 0);
  // postEffectBlurY.start(renderTarget3.texture, 0, 1);
  // postEffectBloom.start(envMapTarget.texture, renderTarget2.texture);

  // scenePE.add(postEffectBlurX);
  // scenePE.add(postEffectBlurY);
  // scenePE.add(postEffectBloom);

  const [
    fogTex,
    patternTex
    // gltf
  ] = await Promise.all([
    texLoader.loadAsync(new URL('./img/fog.jpg', import.meta.url).href),
    // texLoader.loadAsync(new URL('./img/greens.jpg', import.meta.url).href)
  ]);

  fogTex.wrapS = THREE.RepeatWrapping;
  fogTex.wrapT = THREE.RepeatWrapping;
  // fogTex.minFilter = THREE.NearestFilter

  scene.add(bg);
  // bg.layers.set(1);


  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({
    map: fogTex,
    side: THREE.BackSide
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.scale.multiplyScalar(2)
  // plane.position.setZ(-25)
  plane.layers.set(1)
  scene.add(plane)

  for (let i = 0; i < CRYSTALS_COUNT; i++) {
    const radian = toRadians(i / CRYSTALS_COUNT * 360);
    const radius = 20;
    // crystals[i] = new Crystal(gltf.scene.children[0].geometry);
    crystals[i] = new Crystal();
    crystals[i].position.set(Math.cos(radian) * radius, 0, Math.sin(radian) * radius);
    // crystals[i].start(i / CRYSTALS_COUNT, crystalNormalMap, crystalSurfaceTex, fogTex);

    crystals[i].init(i / CRYSTALS_COUNT, envMapTarget.texture, fogTex, backfaceMapTarget.texture);
    // crystals[i].init(i / CRYSTALS_COUNT, rt.texture, fogTex, null);

    scene.add(crystals[i]);

    // crystals[i].layers.set(0)

    // crystalSparkles[i] = new CrystalSparkle();
    // crystalSparkles[i].position.copy(crystals[i].position);
    // crystalSparkles[i].start(i / CRYSTALS_COUNT);
    // scene.add(crystalSparkles[i]);
  }

  for (let i = 0; i < FOGS_COUNT; i++) {
    const radian1 = toRadians(i / FOGS_COUNT * 360);
    const radian2 = toRadians(i / FOGS_COUNT * -360 - 90);
    const radius = 100;

    fogs[i] = new Fog();

    // fogs[i].layers.set([0, 1]);
    // fogs[i].layers.enable(0);
    // fogs[i].layers.enable(1);

    fogs[i].position.set(
      Math.cos(radian1) * radius,
      -18 - Math.sin(toRadians(i / FOGS_COUNT * 360 * 8)) * 8,
      Math.sin(radian1) * radius
    );
    fogs[i].rotation.set(0, radian2, 0);

    fogs[i].init(i / FOGS_COUNT, fogTex);

    scene.add(fogs[i]);

    console.log(fogs[i].layers);
  }
  // lookPosition.copy(crystals[lookIndex].position);
}

export function play(dd) {
  clock.start();
  update(dd);
}

export function pause() {
  clock.stop();
}

export function update(dd) {
  if (clock.running === false) return;

  const delta = clock.getDelta();

  for (let i = 0; i < crystals.length; i++) {
    crystals[i].update(delta);
    // crystalSparkles[i].updates(delta);
  }
  for (let i = 0; i < fogs.length; i++) {
    fogs[i].update(delta);
  }

  // bg.update(delta, Math.atan2(camera.lookVelocity.z, camera.lookVelocity.x) / toRadians(360));
  bg.update(delta, 10 / toRadians(360));

  // lookPosition.set(Math.cos(toRadians(-dd.anchor.x * 0.6)), 0, Math.sin(toRadians(-dd.anchor.x * 0.6)));
  // camera.lookAnchor.copy(lookPosition.clone().add(panPosition.clone().applyQuaternion(camera.quaternion)));
  // camera.update();


  renderer.clear();

  camera.layers.set(1)

  renderer.setRenderTarget(envMapTarget);
  renderer.render(scene, camera);
  // console.log(camera.layers);

  renderer.clearDepth();

  camera.layers.set(0)

  // console.log(camera.layers);

  // renderer.setRenderTarget(null);
  // renderer.clearDepth();

  // render background to fbo
  // renderer.setRenderTarget(rt);
  // renderer.render(scene, camera);

  // render diamond back faces to fbo
  crystals.forEach(gem => {
    gem.material = gem.backfaceMaterial;
  });
  renderer.setRenderTarget(backfaceMapTarget);
  renderer.clearDepth();
  renderer.render(scene, camera);

  // crystals.forEach(gem => {
  //   gem.material = gem.frontFaceMaterial;
  // })
  // renderer.render(scene, camera);

  // render background to screen
  // renderer.setRenderTarget(null);
  // renderer.render(scene, cameraPE);
  renderer.clearDepth();

  renderer.setRenderTarget(null); // set default target
  // render diamond with refraction material to screen
  crystals.forEach(gem => {
    gem.material = gem.frontFaceMaterial;
  });
  renderer.render(scene, camera);


  // postEffectBright.start(envMapTarget.texture);
  // postEffectBlurX.start(renderTarget2.texture, 1, 0);
  // postEffectBlurY.start(renderTarget3.texture, 0, 1);
  // postEffectBloom.start(envMapTarget.texture, renderTarget2.texture);

  // TODO try https://threejs.org/docs/index.html?q=mult#api/en/renderers/WebGLMultipleRenderTargets or https://threejs.org/manual/#en/post-processing

  // 1. Save the original texture to the envMapTarget
  // renderer.setRenderTarget(envMapTarget);
  // renderer.render(scene, camera);

  // 2. Render postEffectBright to renderTarget2
  // scenePE.add(postEffectBright); // postEffectBright uses envMapTarget as texture input
  // renderer.setRenderTarget(renderTarget2);
  // renderer.render(scenePE, cameraPE); // save the result texture to the renderTarget2
  // scenePE.remove(postEffectBright); // Clean up

  // scenePE.add(postEffectBlurX);
  // renderer.setRenderTarget(renderTarget3);
  // renderer.render(scenePE, cameraPE);
  // scenePE.remove(postEffectBlurX);
  //
  // scenePE.add(postEffectBlurY);
  // renderer.setRenderTarget(renderTarget2); // reuse renderTarget2
  // renderer.render(scenePE, cameraPE);
  // scenePE.remove(postEffectBlurY);

  // scenePE.add(postEffectBloom);
  // renderer.setRenderTarget(null);
  // renderer.render(scenePE, cameraPE);
  // scenePE.remove(postEffectBloom);
}

export function resize(resolution) {
  // camera.resize(resolution);
  renderer.setSize(resolution.x, resolution.y);

  let w = resolution.x * renderer.getPixelRatio();
  let h = resolution.y * renderer.getPixelRatio();


  rt.setSize(w, h);
  backfaceMapTarget.setSize(w, h);
  envMapTarget.setSize(w, h);
  // renderTarget2.setSize(w, h);
  // renderTarget3.setSize(w, h);

  // const blurScale = 10;
  // const offsetX = resolution.x / blurScale;
  // const offsetY = resolution.y / blurScale;
  // postEffectBlurY.resize(offsetX, offsetY);
  // postEffectBlurX.resize(offsetY, offsetX);

  // bg.scale.set(h * 2, h, 1)
  // bg.scale.multiplyScalar(5)

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  // w = resolution.x
  // h = resolution.y

  // cameraPE.left = w / -2;
  // cameraPE.right = w / 2;
  // cameraPE.top = h / 2;
  // cameraPE.bottom = h / -2;
  // cameraPE.near = camera.near;
  // cameraPE.far = camera.far;
  // cameraPE.aspect = camera.aspect;
  // cameraPE.updateProjectionMatrix();
}

export function pan(v) {
  panPosition.copy(v);
}
