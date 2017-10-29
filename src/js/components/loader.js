import * as THREE from 'three';
import OBJLoader from 'three-obj-loader';
OBJLoader(THREE);
import MTLLoader from 'three-mtl-loader';
MTLLoader(THREE);

export default function load(inject) {
	var mtlLoader = new MTLLoader();
	var objLoader = new THREE.OBJLoader();
	mtlLoader.setPath('./media/scene/');
	objLoader.setPath('./media/scene/');

	mtlLoader.load('Living Room 05 OBJ.mtl', function(materials) {
		materials.preload();

		objLoader.setMaterials( materials );

		objLoader.load( 'Living Room 05 OBJ.obj', function ( object) {
			inject(object);
		}, onProgress, onError );

	});
}



function onProgress ( xhr ) {
	if ( xhr.lengthComputable ) {
		var percentComplete = xhr.loaded / xhr.total * 100;
		console.log( Math.round(percentComplete, 2) + '% downloaded' );
	}
};
function onError( xhr ) {
};