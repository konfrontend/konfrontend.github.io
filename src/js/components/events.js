import TweenMax from 'gsap';
import * as THREE from 'three';
// import Scene from './webgl';
var timeline = new TimelineMax();
var scene;
var interactiveElements = [];
var floor;
var observed;
var raycaster = new THREE.Raycaster();
var intersection = {
	intersects: null,
	point: new THREE.Vector3(),
};


export default function events() {
	scene = this;
	interactiveElements = scene.interactiveElements;

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'click', onDocumentMouseClick, false );
	window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize(event) {
	scene.camera.aspect = window.innerWidth / window.innerHeight;
	scene.camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseMove( event ) {
	var x, y;

	if ( event.changedTouches ) {
		x = event.changedTouches[ 0 ].pageX;
		y = event.changedTouches[ 0 ].pageY;
	} else {
		x = event.clientX;
		y = event.clientY;
	}
	scene.mouse.x = ( x / window.innerWidth ) * 2 - 1;
	scene.mouse.y = - ( y / window.innerHeight ) * 2 + 1;

	checkIntersection();
}

function onDocumentMouseClick(event) {
	//Interactive elements only
	if( !intersection.intersects ) return;

	var point;

	//Set focus on element
	if( intersection.intersects.isMesh && intersection.intersects != scene.floor) {

		//Clicked on option mesh
		if( Boolean(intersection.intersects.userData.isOption) ) {
			observed.material = intersection.intersects.material.clone();
			observed.material.opacity = 1;

			observed.castShadow = true;
			observed.receiveShadow = true;
			// console.log(observed);
			observed.needsUpdate = true;
		}

		//Clicked on interactive element
		else {
			point = intersection.intersects.position;
			scene.controls.moveTo( point.x, point.y, point.z , true );
			scene.controls.dollyTo(5 , true);

			observed = intersection.intersects;

			showOptions(intersection.intersects);
		}
	}
	//Defocus and move to point
	else {
		// console.log('test');
		point = intersection.point;
		scene.controls.moveTo( point.x, 0, point.z , true );
		// observed = null;
		scene.controls.dollyTo(1 , true);
	}

}

function checkIntersection() {
	if( !interactiveElements ) return;

	raycaster.setFromCamera( scene.mouse, scene.camera );

	var intersects = raycaster.intersectObjects( interactiveElements, false);

	if ( intersects.length ) {
		var intersect = intersects[ 0 ].object;
		intersection.point.copy( intersects[ 0 ].point );

		if ( intersection.intersects != intersect ) {
			if( intersection.intersects != null && intersection.intersects != scene.floor ) {
				intersection.intersects.material.opacity = 1;
			}

			intersection.intersects = intersect;

			if( intersection.intersects != scene.floor ) {

				intersection.intersects.material.opacity = 0.5;
				// console.log(intersect.userData.isOption, intersection.intersects.material.opacity );
				TweenMax.to( scene.mouseHelper.material, .15, {
					opacity: 0
				});
			}
		}
		if ( intersect === scene.floor) {
			scene.mouseHelper.position.copy( intersection.point );
			TweenMax.to( scene.mouseHelper.material, .15, {
				opacity: 1
			});
			scene.mouseHelper.position.y += 0.1;
		}
	}
	else {

		if ( intersection.intersects != null && intersection.intersects != scene.floor ) {
			intersection.intersects.material.opacity = 1;
		}
		intersection.intersects = null;
	}
}

function showOptions(el) {

	var vars = el.material.userData.vars;

	if ( !Boolean(vars) ) return;

	if ( scene.camera.children.length ) {
		for (var i = 0; i < scene.camera.children.length; i++) {
			scene.camera.remove( scene.camera.children[i] );
		}
	}



	var geometry = new THREE.OctahedronBufferGeometry(0.5);
	var group = new THREE.Group();

	for (var i = 0; i < vars.length; i++) {
		var material = vars[i];
		var mesh = new THREE.Mesh( geometry, material );

		var x = i - (( vars.length-1 ) * 0.5 );
		mesh.scale.set(0.7,0.7,0.7);
		mesh.position.set( x, -1, -3 );
		mesh.userData.isOption = true;

		//zIndex hack:
		mesh.renderOrder = 999;
		mesh.onBeforeRender = function( renderer ) { renderer.clearDepth(); };

		interactiveElements.push(mesh);
		group.add(mesh);
	}

	scene.camera.add(group);
}
