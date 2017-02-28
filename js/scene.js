//COLORS
var Colors = {
  red:0xf25346,
  white:0xd8d0d1,
  brown:0x59332e,
  pink:0xF5986E,
  brownDark:0x23190f,
  blue:0x68c3c0,
};

// THREEJS RELATED VARIABLES

var scene,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane,
    renderer, container;

//SCREEN & MOUSE VARIABLES

var HEIGHT, WIDTH,
    mousePos = { x: 0, y: 0 };

//INIT THREE JS, SCREEN AND MOUSE EVENTS

function createScene() {

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 60;
  nearPlane = 1;
  farPlane = 10000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
    );
  scene.fog = new THREE.Fog(0xf7d9aa, 100,950);
  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = 100;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMap.enabled = true;
  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', handleWindowResize, false);
}

// HANDLE SCREEN EVENTS

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}


// LIGHTS

var ambientLight, hemisphereLight, shadowLight;

function createLights() {

  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)
  shadowLight = new THREE.DirectionalLight(0xffffff, .9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;

  scene.add(hemisphereLight);
  scene.add(shadowLight);
}



class Block {

  constructor(w,h,d) {
    this.mesh = new THREE.Object3D();
    this.mesh.name = "origami";

    this.w = w || 10;
    this.h = h || 10;
    this.d = d || 10;

    this.myM = Block.M.clone().multiply(new THREE.Matrix4().set(
      this.w, 0, 0, 0,
      0, this.h, 0, 0,
      0, 0, this.d, 0,
      0, 0, 0, 1
    ));
    this.myMinv = new THREE.Matrix4().getInverse(this.myM);

    var geometry = new THREE.BoxGeometry(this.w, this.h, this.d);
    var mat = new THREE.MeshPhongMaterial({color:Colors.white, shading:THREE.FlatShading});
    var block = new THREE.Mesh(geometry, mat);
    this.mesh.add(block);

    this.code = ko.pureComputed({
      read: () => {
        var v = this.mesh.position.clone().applyMatrix4(this.myMinv);
        return "block(" + Math.round(v.x) + "," + Math.round(v.y) + "," + Math.round(v.z) + ")";
      },
      write: (v) => {
        console.log("write: " + v);
        var m;
        if (m = v.match(/^block\((-?[0-9]+),[ ]*(-?[0-9]+),[ ]*(-?[0-9]+)\)$/)) {
          var v = new THREE.Vector3(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));
          console.log("match: "+v.toString());
          v.applyMatrix4(this.myM);
          this.mesh.position.copy(v);
        }
      },
    });
  }

  place(x, y, z) {
    this.mesh.position.copy(new THREE.Vector3(x,y,z).applyMatrix4(this.myM));
    return this;
  }
}

Block.M = new THREE.Matrix4().set(
  1,0,0, -100,
  0,1,0,   30,
  0,0,1,    0,
  0,0,0,    1
).multiply(new THREE.Matrix4().set(
  1,0, 0,0,
  0,1, 0,0,
  0,0,-1,0,
  0,0, 0,1
));



function addBlock(x, y, z) {
  var b = (new Block()).place(x || 0, y || 0, z || 0);
  scene.add(b.mesh);
  return b;
};

function loop(){
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function updatePlane(){
  var targetY = normalize(mousePos.y,-.75,.75,25, 175);
  var targetX = normalize(mousePos.x,-.75,.75,-100, 100);
  airplane.mesh.position.y = targetY;
  airplane.mesh.position.x = targetX;
  airplane.propeller.rotation.x += 0.3;
}

function normalize(v,vmin,vmax,tmin, tmax){
  var nv = Math.max(Math.min(v,vmax), vmin);
  var dv = vmax-vmin;
  var pc = (nv-vmin)/dv;
  var dt = tmax-tmin;
  var tv = tmin + (pc*dt);
  return tv;
}

function init(event){
  document.addEventListener('mousemove', handleMouseMove, false);
  createScene();
  createLights();

  addBlock();

  loop();
}

// HANDLE MOUSE EVENTS

var mousePos = { x: 0, y: 0 };

function handleMouseMove(event) {
  var tx = -1 + (event.clientX / WIDTH)*2;
  var ty = 1 - (event.clientY / HEIGHT)*2;
  mousePos = {x:tx, y:ty};
}

window.addEventListener('load', init, false);
