Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for(var i = 0, len = this.length; i < len; i++) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
		}
	}
}

var scene, camera, renderer;

function initGL() {
	console.log("Setting up WebGL...");
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
	camera.position.z = 400;
	camera.position.y = 400;
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	var controls = new THREE.OrbitControls(camera);
	controls.addEventListener('change', render);
	var planeGeometry = new THREE.PlaneGeometry(600, 600);
	var planeMaterial = new THREE.MeshBasicMaterial({color: 0xbbbbbb, side: THREE.DoubleSide});
	var planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
	planeMesh.rotation.x = Math.PI/2;
	planeMesh.receiveShadow = true;
	scene.add(planeMesh);
	var ambientLight = new THREE.AmbientLight(0x404040);
	scene.add(ambientLight);
	var directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
	directionalLight.position.set(375, 500, 300);
	directionalLight.castShadow = true;
	directionalLight.shadowDarkness = 0.2;
	directionalLight.shadowMapWidth = 1024;
	directionalLight.shadowMapHeight = 1024;
	scene.add(directionalLight);
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setClearColor(0x6495ED, 1);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMapEnabled = true;
	renderer.shadowMapType = THREE.PCFSoftShadowMap;
	document.body.appendChild(renderer.domElement);	
	console.log("done");
}

function render() {
	renderer.render(scene, camera);
}