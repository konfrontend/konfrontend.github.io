// Vendors
import * as THREE from 'three';

// 3rd party
import cameraControlsFactory from '../vendors/camera-controls.js';
import dat from '../vendors/dat.gui.js';

// Components
import loader from './loader';
import {lights} from './lights'; //TO DO: refactoring of the module structure
import events from './events'; //TO DO: refactoring of the module structure

export default function Scene( container ) {
	this.container = container;

	/*===========================
	=            GUI CONTROLS           =
	===========================*/
		var gui = new dat.GUI({});

		this.config = {
			groundColor: '#2194ce'
		};
		gui.addColor( this.config, 'groundColor').onChange( function () {
			this.hemi.groundColor.set( this.config.groundColor );
		}.bind(this));

	/*=====  End of GUI CONTROLS  ======*/



	this.mouse = new THREE.Vector2();
	this.clock = new THREE.Clock();

	this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 100 );
	this.camera.position.set( 0, 0, 0.01); // first person controls

	this.scene = new THREE.Scene();
	this.scene.background = new THREE.Color(0x333333);
	this.scene.fog = new THREE.Fog( this.scene.background, 1, 80 );
	this.scene.add( this.camera ); //for camera children

	this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
	this.renderer.setSize( window.innerWidth, window.innerHeight );
	this.renderer.setPixelRatio( window.devicePixelRatio );
	this.renderer.shadowMap.enabled = true;
	this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

	this.controls = cameraControlsFactory( THREE );
	this.controls = new this.controls( this.camera, this.renderer.domElement );

	this.raycaster = new THREE.Raycaster();

	this.container.appendChild( this.renderer.domElement );

	//Fill the scene with elements
	this.fill();

	this.light();

	this.action();

	this.listen();
}

Scene.prototype.fill = function() {
	var envMap = new THREE.CubeTextureLoader().setPath('./media/scene/').load( [
		'Archinteriors7_08_13.jpg',
		'Archinteriors7_08_13.jpg',
		'Archinteriors7_08_13.jpg',
		'Archinteriors7_08_13.jpg',
		'Archinteriors7_08_13.jpg',
		'Archinteriors7_08_13.jpg',
	]);

	envMap.minFilter = THREE.LinearFilter;
	envMap.mapping = THREE.CubeRefractionMapping;

	var geometry = new THREE.PlaneBufferGeometry( 40, 40, 10 );
	var material = new THREE.MeshPhongMaterial( {
		color: 0x2194ce,
		side: THREE.DoubleSide,
		envMap: envMap,
		depthWrite:true,
		combine    : THREE.MixOperation,
		refractionRatio: 0.15,
		reflectivity: 0.5,
	} );
	this.floor = new THREE.Mesh( geometry, material );
	this.floor.rotation.x = - Math.PI / 2;
	this.floor.position.set(0,-5,0);
	this.floor.receiveShadow = true;
	this.scene.add( this.floor );


	var gridHelper = new THREE.GridHelper( 50, 50, 0x0000ff, 0x808080 );
	gridHelper.rotation.x = - Math.PI / 2;
	gridHelper.position.z += 0.1;
	this.floor.add( gridHelper );

	addBoxes(this.scene);

	this.mouseHelper = new THREE.Mesh( new THREE.RingGeometry(0.3,0.5,32), new THREE.LineBasicMaterial( { side: THREE.DoubleSide, transparent: true } ) );
	this.mouseHelper.rotation.x = Math.PI / 2;
	this.scene.add( this.mouseHelper );

	//prepare interactive array
	this.interactiveElements = this.scene.children.filter(function (el,index) {
		return el.isMesh;
	});

	// loader.load(function (mesh) {
	// 	scene.add(mesh);
	// });
};

Scene.prototype.light = lights.init;

Scene.prototype.listen = events;

Scene.prototype.action = function() {
	var that = this;
	requestAnimationFrame(function () {
		that.action();
	});
	this.render();
};

Scene.prototype.render = function() {
	var delta = this.clock.getDelta();
	var elapsed = this.clock.getElapsedTime();
	var needsUpdate = this.controls.update(delta);
	this.renderer.render( this.scene, this.camera );
};

function addBoxes(scene) {

	var geometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
	var mesh;
	for (var i = 0; i < 20; i++) {
		var material = new THREE.MeshLambertMaterial( {
			color: Math.random() * 0xffffff,
			transparent: false,
			opacity: 1,
			flatShading: true
		});
		material.userData.vars = [];
		material.userData.vars.push(
			new THREE.MeshLambertMaterial({
				color: Math.random() * 0xffffff,
			}),
			new THREE.MeshPhongMaterial({
				color: Math.random() * 0xffffff,
				shininess: 0.5,
				reflectivity: 0.5,
			}),
			new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff }),
			new THREE.MeshStandardMaterial({
				color: Math.random() * 0xffffff,
				metalness: 0.5, // 0.5
				roughness: 0.5 // 0.5
			}),
		);

		mesh = new THREE.Mesh( geometry, material );
		mesh.position.set( 30 * Math.random() - 10, 20 * Math.random() - 10, 30 * Math.random() - 10);
		mesh.scale.set( Math.random() * 2, 5, Math.random() * 5);
		mesh.rotation.set( 6.3 * Math.random(), 1.57 * Math.random(), 3.14 * Math.random() );
		mesh.castShadow = true;
		mesh.receiveShadow = true;

		scene.add( mesh );
	}
}

