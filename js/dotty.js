

var Ease = {
  In    : function (power) { return function (t) { return Math.pow(t, power); }; },
  Out   : function (power) { return function (t) { return 1 - Math.abs(Math.pow(t-1, power)); }; },
  InOut : function (power) { return function (t) { return t<.5 ? Ease.In(power)(t*2)/2 : Ease.Out(power)(t*2 - 1)/2+0.5; }; },
};


Ease.Linear = Ease.InOut(1);
Ease.In.Quad = Ease.In(2);
Ease.Out.Quad = Ease.Out(2);
Ease.InOut.Quad = Ease.InOut(2);
Ease.In.Cubic = Ease.In(3);
Ease.Out.Cubic = Ease.Out(3);
Ease.InOut.Cubic = Ease.InOut(3);
Ease.In.Quart = Ease.In(4);
Ease.Out.Quart = Ease.Out(4);
Ease.InOut.Quart = Ease.InOut(4);
Ease.In.Quint = Ease.In(5);
Ease.Out.Quint = Ease.Out(5);
Ease.InOut.Quint = Ease.InOut(5);



class ThreeView {
  constructor (viewdiv) {
    this.VIEWDIV = viewdiv;
  }
  
  init () {

    this.time = Date.now();
    this.anim = [];

    // scene
    this.scene = new THREE.Scene();
    
    // camera
    this.WIDTH = this.VIEWDIV.clientWidth;
    this.HEIGHT = this.VIEWDIV.clientHeight;
    this.camera = new THREE.PerspectiveCamera(
      40, this.WIDTH / this.HEIGHT, 1, 5000
    );
    this.camera.position.x = 0; // right
    this.camera.position.y = 700; // upwards
    this.camera.position.z = 0; // back
    this.camera.lookAt(this.scene.position);
    
//    this.controls = new THREE.OrbitControls(this.camera);
    
    // lights
    this.lights = {};
    this.lights.ambient = new THREE.AmbientLight(0xaaaaaa);
    this.scene.add(this.lights.ambient);

    this.lights.spot = new THREE.SpotLight(0x333333);
    this.lights.spot.position.set(450, 200, -60);
    this.lights.spot.castShadow = true;
    this.scene.add(this.lights.spot);


    this.lights.shadow = new THREE.DirectionalLight(0xffffff);
    this.lights.shadow.position.set(-150, 500, -150);
    // (x,y,z) = right, upwards, back

    this.lights.shadow.castShadow = true;

    this.lights.shadow.shadow.mapSize.width = 1024;
    this.lights.shadow.shadow.mapSize.height = 1024;

    var d = 400;
    this.lights.shadow.shadow.camera.left = -d;
    this.lights.shadow.shadow.camera.right = d;
    this.lights.shadow.shadow.camera.top = d;
    this.lights.shadow.shadow.camera.bottom = -d;

    this.lights.shadow.shadow.camera.near = 1;
    this.lights.shadow.shadow.camera.far = 1000;
    // ?? this.lights.shadow.shadowDarkness = 0.2;
    
    this.scene.add(this.lights.shadow);
    //this.scene.add(new THREE.DirectionalLightHelper(this.lights.shadow, 1.75));
    
    // renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true /*, antialias: true*/ });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.VIEWDIV.appendChild(this.renderer.domElement);

    // in order to perform calculations
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // subscribe to events
    window.addEventListener('resize', this.onResize.bind(this), false);
    this.onResize();
    document.addEventListener( 'mousemove', this.onMouseMove.bind(this), false );
    document.addEventListener( 'mousedown', this.onMouseDown.bind(this), false );
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

  onMouseMove (event) {
    this.mouse.x =   ( event.clientX / this.WIDTH  ) * 2 - 1;
    this.mouse.y = - ( event.clientY / this.HEIGHT ) * 2 + 1;
  }

  onMouseDown (event) {}
  
  render () {
    //this.camera.lookAt(this.scene.position);
//    this.composer.render();
    this.renderer.render(this.scene, this.camera);
  }
}


var setprops = function (obj, props, val) {
  for (var k in props) {
    if (props[k] === true) {
      obj[k] = val;
    } else {
      setprops(obj[k], props[k], val);
    }
  }
};



class GoDot extends THREE.Object3D {

  constructor () {
    super();

    this.box = new THREE.Mesh(GoDot.BOX_GEO, new THREE.MeshBasicMaterial());
    this.dot = new THREE.Mesh(GoDot.DOT_GEO, new THREE.MeshLambertMaterial({ color: GoBoard.colors.black_stone }));

    this.add(this.box);
    this.add(this.dot);

    this.box.godot = this;
    this.onboard = false;
    this.dot.scale.set(.05, .05, .05);
    this.box.material.visible = false;
  }

  color (color) {
    this.dot.material.color.set(color ? GoBoard.colors.black_stone : GoBoard.colors.white_stone);
  }
}

GoDot.R = 9;
GoDot.PAD = 1;

GoDot.DOT_GEO = new THREE.SphereGeometry(GoDot.R, 10, 10);
GoDot.BOX_GEO = new THREE.BoxGeometry((GoDot.R + GoDot.PAD)*2, (GoDot.R + GoDot.PAD)*2, (GoDot.R + GoDot.PAD)*2);



class GoBoard extends ThreeView {

  init () {
    super.init();

    this.turn = 0;
  }

  populate () {

    var start_anim = Date.now() + 500;
  
    // board group
    this.group = new THREE.Object3D();
    //this.group.rotateX(.5*Math.PI/2);
    this.scene.add(this.group);

    this.animate(this.group, {
      start: start_anim - 300,
      props: { rotation: { x: true } },
      len: 1000,
      fn: Ease.InOut.Cubic,
      from: 0,
      to: (Math.PI/3)
    });

    this.grid = new THREE.GridHelper((GoDot.R + GoDot.PAD)*2*18, 18, 0x999999, 0x999999);
    this.grid.rotateX(Math.PI/2);
    this.group.add(this.grid);

    this.boxes = [];

    this.m = [];
    for (var x = 0; x < 19; x++) {
      this.m[x] = [];
      for (var y = 0; y < 19; y++) {
        var godot = new GoDot();
        this.boxes.push(godot.box);
        this.m[x][y] = godot;

        godot.translateX((x-(18/2)) * 2*(GoDot.R + GoDot.PAD));
        godot.translateY((y-(18/2)) * -2*(GoDot.R + GoDot.PAD));

        this.group.add(godot);

        if (Math.random() < .3) {
          godot.color(Math.random() < .5)
          godot.onboard = true;
          godot.dot.visible = true;
          this.animate(godot.dot, {
            start: start_anim + x*20 + y*-20,
            props: { scale: { x: true, y: true, z: true } },
            len: 800,
            fn: Ease.InOut.Cubic,
            from: .05,
            to: 1
          });
        }
      }
    }
  }

  stopanim (mesh) {
    for (var i = this.anim.length - 1; i >= 0; i--) {
      var a = this.anim[i];
      if (a.mesh == mesh) {
        this.anim.splice(i, 1);
      }
    }
    mesh.animating = false;
  }

  animate (mesh, data) {
    var a = {
      mesh  : mesh,
      props : data.props || { scale: true },
      start : data.start || Date.now(),
      len   : data.len   || 500,
      fn    : data.fn    || Ease.Linear,
      from  : data.from  || 0,
      to    : data.to    || 1,
    };

    a.mesh.animating = false;

    this.anim.push(a);

    if (Date.now() <= a.start) {
      setprops(a.mesh, a.props, a.from);
    }
  }

  loop () {
    var timer = Date.now() * 0.0002;
   // this.camera.position.x = Math.cos(timer) * 300;
   // this.camera.position.z = Math.sin(timer) * 300;

    for (var i = this.anim.length - 1; i >= 0; i--) {

      var a = this.anim[i],
          n = Date.now(),
          p;

      if (n < a.start) {
        // noop
      } else if (n > a.start + a.len) {
        setprops(a.mesh, a.props, a.to); // not actually necc., but in order to ensure fully got at a.to
        a.mesh.animating = false;
        this.anim.splice(i, 1);
      } else {
        var at = a.fn((n - a.start) / a.len);
        p = a.from + at * (a.to - a.from);
        setprops(a.mesh, a.props, p);
        a.mesh.animating = true;
      }
    }

    requestAnimationFrame(this.loop.bind(this));

    // calculate mouse hover -> dot
    this.raycaster.setFromCamera(this.mouse, this.camera);
    var intersects = this.raycaster.intersectObjects(this.boxes, true),
        new_hover = (intersects.length > 0) ? intersects[0].object.godot : undefined;

    // change?
    if (this.hover != new_hover) {

      // => remove old
      if (this.hover) {
        this.stopanim(this.hover.dot);
        this.animate(this.hover.dot, {
          start: Date.now(),
          props: { scale: { x: true, y: true, z: true } },
          len: 100,
          fn: Ease.InOut.Cubic,
          from: this.hover.dot.scale.x,
          to: .05,
        });
        this.hover = undefined;
      }

      // => add new
      if (new_hover) {
        if (!new_hover.onboard) {
          new_hover.color(this.turn % 2 == 1);
          this.animate(new_hover.dot, {
            start: Date.now(),
            props: { scale: { x: true, y: true, z: true } },
            len: 100,
            fn: Ease.InOut.Cubic,
            from: .05,
            to: .4,
          });
          this.hover = new_hover;
        }
      }
    }

    this.render();
  }

  onMouseDown (e) {
    super.onMouseDown(e);

    // => place
    if (this.hover) {
      this.hover.color(this.turn % 2 == 1);
      this.turn++;

      this.hover.onboard = true;
      this.stopanim(this.hover.dot);
      this.animate(this.hover.dot, {
        start: Date.now(),
        props: { scale: { x: true, y: true, z: true } },
        len: 100,
        fn: Ease.InOut.Cubic,
        from: this.hover.dot.scale.x,
        to: 1,
      });
      this.hover = undefined;
    }
  }
}

GoBoard.colors = {
  white_stone: 0xaaaaaa,
  black_stone: 0x333333,
  black: 0x000000,
  oak: 0xCA9C55,
};


window.addEventListener('load', function () {

  var view = window.view = new GoBoard(threeview);
  view.init();
  view.populate();
  view.loop();

}, false);
