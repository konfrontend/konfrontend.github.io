import * as THREE from 'three';

export var lights = {
	init: function () {
		var group = new THREE.Group();

		this.dir = new THREE.DirectionalLight( 0xffffff, 1);
		this.dir.position.set( 0, 1, 1 );
		this.dir.position.multiplyScalar( 30 );

		this.dir.castShadow = true;

		this.dir.shadow.bias = -0.001; //to avoid getting the artifacts from self-shadowing (0 default)
		this.dir.shadow.radius = 0; // 1
		this.dir.shadow.mapSize.width = 2048; //512
		this.dir.shadow.mapSize.height = 2048; //512
		this.dir.shadow.near = 0.5; //0.5
		this.dir.shadow.far = 500; //500


		this.dir.shadowCameraHelper = new THREE.CameraHelper(this.dir.shadow.camera );
		this.scene.add( this.dir.shadowCameraHelper );

		var d = 10;
		this.dir.shadow.camera.left = -d;
		this.dir.shadow.camera.right = d;
		this.dir.shadow.camera.top = d;
		this.dir.shadow.camera.bottom = -d;
		group.add( this.dir );


		var dirLightHeper = new THREE.DirectionalLightHelper( this.dir, 10 );
		this.scene.add( dirLightHeper );


		this.hemi = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
		this.hemi.groundColor.set( this.config.groundColor );
		this.hemi.position.set( 0, 10, 0 );
		group.add( this.hemi );

		var hemiLightHelper = new THREE.HemisphereLightHelper( this.hemi, 1 );
		group.add( hemiLightHelper );

		this.scene.add( group );


		// var vertexShader = document.getElementById( 'vertexShader' ).textContent;
		// var fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
		// var uniforms = {
		// 	topColor:    { value: new THREE.Color( 0x0077ff ) },
		// 	bottomColor: { value: new THREE.Color( 0xffffff ) },
		// 	offset:      { value: 33 },
		// 	exponent:    { value: 0.6 }
		// };
		// uniforms.topColor.value.copy( lights.hemi.color );
		// scene.fog.color.copy( uniforms.bottomColor.value );
		// var skyGeo = new THREE.SphereGeometry( 4000, 32, 15 );
		// var skyMat = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: fragmentShader, uniforms: uniforms, side: THREE.BackSide } );
		// var sky = new THREE.Mesh( skyGeo, skyMat );
		// scene.add( sky );
	}
}

