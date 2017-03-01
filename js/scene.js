
var Colors = {
  white: 0xd8d0d1,
  oak: 0xCA9C55,
  black: 0x111111,
  bg: 0x60544B,
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

  camera.position.x = 0;
  camera.position.z = 300;
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
  var d = 500;
  shadowLight.shadow.camera.left = -d;
  shadowLight.shadow.camera.right = d;
  shadowLight.shadow.camera.top = d;
  shadowLight.shadow.camera.bottom = -d;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;

  shadowLight.shadow.camera.visible = true;

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




class Stone {

  constructor(w,h,d) {
    this.mesh = new THREE.Object3D();
    this.mesh.name = "go_stone";

    this.w = w || 10;
    this.h = h || 10;
    this.d = d || 4;

    this.myM = Stone.M.clone().multiply(new THREE.Matrix4().set(
      this.w, 0, 0, 0,
      0, this.h, 0, 0,
      0, 0, this.d, 0,
      0, 0, 0, 1
    ));
    this.myMinv = new THREE.Matrix4().getInverse(this.myM);

    var geometry = new THREE.SphereGeometry(this.w / 2, 30, 30);
    geometry.applyMatrix(new THREE.Matrix4().makeScale(1, 1, .4));
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

Stone.M = new THREE.Matrix4().set(
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




class MyObj {
  constructor (geometry, color) {
    this.mesh = new THREE.Object3D();
    this.mesh.name = "my_obj";

    var material;
    if (color == 2) { // wireframe
      material = new THREE.MeshBasicMaterial( { wireframe: true } );
    } else if (typeof(color) == "object" && color.type == "ShaderMaterial") { // material
      material = color;
    } else if (typeof(color) == "object") { // texture
      material = new THREE.MeshBasicMaterial({ map: color });
    } else { // simple color
      material = new THREE.MeshPhongMaterial({color:color || Colors.white, shading:THREE.FlatShading});
    }

    this.mesh.add(new THREE.Mesh(geometry, material));
  }

  translate (x, y, z) {
    this.mesh.applyMatrix(new THREE.Matrix4().makeTranslation(x, y, z));
    return this;
  }

  rotateX (x) {
    this.mesh.applyMatrix(new THREE.Matrix4().makeRotationX(x));
    return this;
  }

  rotateY (y) {
    this.mesh.applyMatrix(new THREE.Matrix4().makeRotationY(y));
    return this;
  }

  rotateZ (z) {
    this.mesh.applyMatrix(new THREE.Matrix4().makeRotationZ(z));
    return this;
  }

  scale (x, y, z) {
    this.mesh.applyMatrix(new THREE.Matrix4().makeScale(x, y, z));
    return this;
  }
}






function addBlock(x, y, z) {
  var b = (new Block()).place(x || 0, y || 0, z || 0);
  scene.add(b.mesh);
  return b;
};

function addStone(x, y, z) {
  var b = (new Stone()).place(x || 0, y || 0, z || 0);
  scene.add(b.mesh);
  return b;
};

var rotate = 0,
    dir = 1,
    it = 0,
    off_dir = 0;

function loop(){

  if (rotate) {
    if (dir == 1 && go_board.rotation.y > 1.3) {
      dir = -1;
    } else if (dir == -1 && go_board.rotation.y < -1.3) {
      dir = 1;
    }
    
    go_board.rotateY(dir * .01);
    go_torus.rotateY(dir * .01);
  }


  it++;
  var SPEED = 15,
      DELAY = 40;
  if (it < SPEED) {
    x_off += (1-off_dir) * 1/SPEED;
    y_off += off_dir     * 1/SPEED;
  } else if (it == SPEED + DELAY) {
    x_off = Math.round(x_off);
    y_off = Math.round(y_off);
    it = 0;
    off_dir = Math.floor(Math.random()*2);
  }

  positionStones();


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

var table,
    tabletexture,
    flatten = new THREE.Matrix4().makeScale(1,1,.4),
    x_off = 0,
    y_off = 1,
    board_grid,
    go_board = new THREE.Object3D(),
    map_to_board = (x, y) => {
      x = (x + x_off + 19) % 19;
      y = (y + y_off + 19) % 19;
      return new THREE.Matrix4().makeTranslation(-95 + x*10, -95 + y*10, 0);
    },
    R = 70,
    r = 30,
    go_torus = new THREE.Object3D(),
    map_to_torus = (x, y) => {
      x = (x + x_off + 19) % 19;
      y = (y + y_off + 19) % 19;
      var theta = x * (2*Math.PI / 19),
          phi   = y * (2*Math.PI / 19),
          M = new THREE.Matrix4().makeRotationZ(theta)               // direct
            .multiply(new THREE.Matrix4().makeTranslation(R, 0, 0))  // move outwards (donut)
            .multiply(new THREE.Matrix4().makeRotationY(phi))        // direct
            .multiply(new THREE.Matrix4().makeTranslation(r, 0, 0))  // move outwards (tube)
            .multiply(new THREE.Matrix4().makeRotationY(Math.PI/2)); // orient face outwards (donut)
      return M;
    },
    stonedata = [];

go_board.stones = [];
go_torus.stones = [];
for (var i = 0; i < 19; i++) {
  go_board.stones[i] = [];
  go_torus.stones[i] = [];
}

for (var i = 0; i < 150; i++) {
  var x = Math.floor(Math.random() * 19),
      y = Math.floor(Math.random() * 19),
      color = Math.floor(Math.random() * 2);

  if (!stonedata[x + "," + y]) {
    stonedata[x + "," + y] = true;
    stonedata.push([x,y,color]);
  }
}



function init(event){
  document.addEventListener('mousemove', handleMouseMove, false);
  createScene();
  createLights();


  tabletexture = new THREE.ShadowMaterial();
  table = new MyObj(new THREE.PlaneGeometry(500,500), tabletexture);
  table.mesh.translateY(100);
  table.mesh.translateZ(-20);
  table.mesh.receiveShadow = true;
  scene.add(table.mesh);


  go_board.applyMatrix(new THREE.Matrix4().makeTranslation(-100,100,0));
  scene.add(go_board);

    board_grid = new THREE.GridHelper(190,19, Colors.black, Colors.black);
    board_grid.rotateX(Math.PI/2);
    board_grid.translateY(-2);
    go_board.add(board_grid);

    var wood = new THREE.TextureLoader().load("bamboo_02.jpg?" + Date.now());
    var board_1 = go_board.board = new MyObj(new THREE.BoxGeometry(200+10,200+10,10), wood).translate(0,0,-10);
    go_board.board.mesh.receiveShadow = true;
    board_1.mesh.castShadow = true;
    go_board.add(board_1.mesh);

    for (var i = 0; i < stonedata.length; i++) {
      var x = stonedata[i][0],
          y = stonedata[i][1],
          color = stonedata[i][2],
          stone = new MyObj(new THREE.SphereGeometry(5,10,10), [0xffffff,0x111111][color]);

      stone.mesh.applyMatrix(map_to_board(x, y));

      go_board.add(stone.mesh);
      go_board.stones[x][y] = stone.mesh;
    }


  go_torus.applyMatrix(new THREE.Matrix4().makeTranslation(130,100,0));
  scene.add(go_torus);

    var board_2 = new MyObj(new THREE.TorusGeometry(R, r, 19, 19), 2).translate(0,0,0);
    go_torus.add(board_2.mesh);

    for (var i = 0; i < stonedata.length; i++) {
      var x = stonedata[i][0],
          y = stonedata[i][1],
          color = stonedata[i][2],
          stone = new MyObj(new THREE.SphereGeometry(5,10,10), [0xffffff,0x111111][color]);

      stone.mesh.applyMatrix(map_to_torus(x, y));
      // stone.mesh.translateX(10); // rotate around tube
      // stone.mesh.translateY(10); // (meaningless)
      // stone.mesh.translateZ(10); // fly out

      go_torus.add(stone.mesh);
      go_torus.stones[x][y] = stone.mesh;
    }


  new MyObj(new THREE.PlaneGeometry(10,10));



  loop();
}

function positionStones() {
  for (var i = 0; i < stonedata.length; i++) {
    var x = stonedata[i][0],
        y = stonedata[i][1];

    go_board.stones[x][y].matrix.identity();
    go_board.stones[x][y].applyMatrix(flatten);
    go_board.stones[x][y].applyMatrix(map_to_board(x, y));

    go_torus.stones[x][y].matrix.identity();
    go_torus.stones[x][y].applyMatrix(flatten);
    go_torus.stones[x][y].applyMatrix(map_to_torus(x, y));
  }
}


// HANDLE MOUSE EVENTS

var mousePos = { x: 0, y: 0 };

function handleMouseMove(event) {
  var tx = -1 + (event.clientX / WIDTH)*2;
  var ty = 1 - (event.clientY / HEIGHT)*2;
  mousePos = {x:tx, y:ty};
}

window.addEventListener('load', init, false);
