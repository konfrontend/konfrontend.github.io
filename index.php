<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no"/>
	<meta name="format-detection" content="telephone=no">
	<title>Arc</title>
	<link rel="stylesheet" href="css/style.css?v=<?php echo strtotime("now") ?>">
</head>
<body>
	<script type="x-shader/x-vertex" id="vertexShader">
		varying vec3 vWorldPosition;
		void main() {
			vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
			vWorldPosition = worldPosition.xyz;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}
	</script>

	<script type="x-shader/x-fragment" id="fragmentShader">
		uniform vec3 topColor;
		uniform vec3 bottomColor;
		uniform float offset;
		uniform float exponent;
		varying vec3 vWorldPosition;
		void main() {
			float h = normalize( vWorldPosition + offset ).y;
			gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
		}
	</script>
	<div id="webgl"></div>
	
	<script src="dist/bundle.js?v=<?php echo strtotime("now") ?>"></script>
</body>
</html>