
class ThreeView {
  constructor (viewdiv) {
    this.VIEWDIV = viewdiv;
  }
  
  init () {
    // scene
    this.scene = new THREE.Scene();
    
    // camera
    this.WIDTH = this.VIEWDIV.clientWidth;
    this.HEIGHT = this.VIEWDIV.clientHeight;
    this.camera = new THREE.PerspectiveCamera(
      35, this.WIDTH / this.HEIGHT, 1, 10000
    );
    this.camera.position.x = 0; // right
    this.camera.position.y = 440; // upwards
    this.camera.position.z = 50; // back
    this.camera.lookAt(this.scene.position);
    
    var controls = new THREE.OrbitControls(this.camera);
    
    // lights
    this.lights = {};
    this.lights.ambient = new THREE.AmbientLight(0x444444);
    this.scene.add(this.lights.ambient);

    this.lights.spot = new THREE.SpotLight(0x555555);
    this.lights.spot.position.set(-450, 200, -60);
    this.lights.spot.castShadow = true;
    this.scene.add(this.lights.spot);


    this.lights.shadow = new THREE.DirectionalLight(0xffffff);
    this.lights.shadow.position.set(-150, 100, -50);
    // (x,y,z) = right, upwards, back

    this.lights.shadow.castShadow = true;

    this.lights.shadow.shadow.mapSize.width = 512;
    this.lights.shadow.shadow.mapSize.height = 512;

    var d = 400;
    this.lights.shadow.shadow.camera.left = -d;
    this.lights.shadow.shadow.camera.right = d;
    this.lights.shadow.shadow.camera.top = d;
    this.lights.shadow.shadow.camera.bottom = -d;

    this.lights.shadow.shadow.camera.near = 0.5;
    this.lights.shadow.shadow.camera.far = 1000;
    // ?? this.lights.shadow.shadowDarkness = 0.2;
    
    this.scene.add(this.lights.shadow);
    //this.scene.add(new THREE.DirectionalLightHelper(this.lights.shadow, 1.75));
    
    // renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.domElement.style.position = "relative";
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.VIEWDIV.appendChild(this.renderer.domElement);
    window.addEventListener('resize',
      this.onResize.bind(this), false);
    this.onResize();
  }
  
  onResize () {
    this.WIDTH = this.VIEWDIV.clientWidth;
    this.HEIGHT = this.VIEWDIV.clientHeight;
    if (this.camera) {
      this.camera.aspect = this.WIDTH / this.HEIGHT;
      this.camera.updateProjectionMatrix();
    }
    if (this.renderer) {
      this.renderer.setSize(this.WIDTH, this.HEIGHT);
    }
  }
  
  render () {
    this.camera.lookAt(this.scene.position);
    this.renderer.render(this.scene, this.camera);
  }
}


class GoBoard extends ThreeView {

  init () {
    super.init();
  }

  populate () {
  
    // board group
    this.group = new THREE.Object3D();
    this.group.rotateX(Math.PI/2);
    this.scene.add(this.group);

    // > table top
    this.makeTableTop();
    
    // > board
    this.makeBoard();

    // > stones
    this.stones = [];
    for (var x = 0; x < 19; x++) {
      for (var y = 0; y < 19; y++) {
        var r = Math.random(),
            color = (r > .75) ? "white_stone" : "black_stone";
        if (r > .5) {
          this.stones.push([x, y, color, this.makeStone(x, y, color)]);
        }
      }
    }

/*
    var boxgeometry = new THREE.CubeGeometry(100, 100, 100);
    var boxmaterial = new THREE.MeshLambertMaterial({
      color: 0x0aeedf
    });
    this.cube = new THREE.Mesh(boxgeometry, boxmaterial);
    this.cube.castShadow = true;
    this.cube.position.x = 0;
    this.cube.position.y = 100;
    this.cube.position.z = 0;

    this.scene.add(this.cube);
*/
  }
  
  mapToBoard (x, y, x_displace, y_displace) {
    return new THREE.Matrix4().makeTranslation(-90 + x*10 + (x_displace || 0), -90 + y*10 + (y_displace || 0), 0);
  }

  makeTableTop () {

    var rx = 5, ry = 3;

    var texture = new THREE.TextureLoader().load("bg_02.jpg?" + Date.now());
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(rx, ry);

    var bump = new THREE.TextureLoader().load("bg_02-bump.jpg?" + Date.now());
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;
    bump.repeat.set(rx, ry);

    this.tabletop = new THREE.Mesh(
      new THREE.BoxGeometry(rx*200, ry*200, 5),
      new THREE.MeshPhongMaterial({ map : texture, bumpMap : bump })
//      new THREE.MeshPhongMaterial({ color: 0x222222 })
    );
    this.tabletop.translateZ(16.7);
    this.tabletop.receiveShadow = true;

    this.group.add(this.tabletop);
  }
  
  makeBoard () {
    this.board = new THREE.Mesh(
      new THREE.BoxGeometry(190+10, 190+10, 10),
      new THREE.MeshPhongMaterial({ map : new THREE.TextureLoader().load("bamboo_02.jpg?" + Date.now()),
                                    bumpMap : new THREE.TextureLoader().load("bamboo_02-bump.jpg?" + Date.now()) })
    );
    this.board.translateZ(6.7);
    this.board.receiveShadow = true;
    this.board.castShadow = true;

    this.group.add(this.board);

    var lineMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 }),
        lineThickness = .5;
    this.lines = [ [], [] ];
    for (var dir = 0; dir < 2; dir++) {
      for (var i = 0; i < 19; i++) {
        this.lines[dir][i] = new THREE.Mesh(
          new THREE.BoxGeometry(
            (dir == 0) ? lineThickness : 180,
            (dir == 1) ? lineThickness : 180,
            lineThickness
          ),
          lineMaterial
        );
        this.lines[dir][i][dir == 0 ? "translateX" : "translateY"](-90 + i*10);
        this.group.add(this.lines[dir][i]);
      }
    }
  }
  
  makeStone (x, y, color) {
    var stone = new THREE.Mesh(
      new THREE.SphereGeometry(5, 10, 10),
      new THREE.MeshPhongMaterial({ color: GoBoard.colors[color] })
    );
    stone.castShadow = true;
    stone.scale.z = .4;

    var squashed = new THREE.Object3D();
    squashed.add(stone);

    squashed.applyMatrix(this.mapToBoard(x, y, Math.random()-.5, Math.random()-.5));
    this.group.add(squashed);
  }

  animate () {
    var timer = Date.now() * 0.0002;
   // this.camera.position.x = Math.cos(timer) * 300;
   // this.camera.position.z = Math.sin(timer) * 300;

//    this.cube.rotateX(.02);
//    this.cube.rotateY(.02);

    requestAnimationFrame(this.animate.bind(this));
    this.render();
  }
}

GoBoard.colors = {
  white_stone: 0xdddddd,
  black_stone: 0x333333,
  black: 0x000000,
  oak: 0xCA9C55,
};


window.addEventListener('load', function () {

  var view = window.view = new GoBoard(threeview);
  view.init();
  view.populate();
  view.animate();

}, false);
