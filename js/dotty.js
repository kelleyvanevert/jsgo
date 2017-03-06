

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
    document.addEventListener( 'mousewheel', this.onMouseWheel.bind(this), false )
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

  onMouseWheel (event) {}
  
  render () {
    //this.camera.lookAt(this.scene.position);
//    this.composer.render();
    this.renderer.render(this.scene, this.camera);
  }
}



Array.prototype.and = function () {
  return this.reduce(function(a,b){return a && b},true);
};



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

  constructor (x, y) {
    super();

    this.x = x;
    this.y = y;
    this.onboard = false;
    this.color = 0;

    this.box = new THREE.Mesh(GoDot.BOX_GEO, new THREE.MeshBasicMaterial({ color: 0xCA9C55 }));
    this.dot = new THREE.Mesh(GoDot.DOT_GEO, new THREE.MeshLambertMaterial({ color: GoView.colors.black_stone }));

    this.add(this.box);
    this.add(this.dot);

    this.box.godot = this;
    this.dot.scale.set(.05, .05, .05);
    this.box.material.visible = false;
  }

  setcolor (color) {
    this.color = color;
    this.dot.material.color.set(color ? GoView.colors.white_stone : GoView.colors.black_stone);
    return this;
  }

  remove (dt) {
    this.onboard = false;

    view.stopanim(this.dot);
    view.animate(this.dot, {
      start: Date.now() + (dt || 0),
      props: { scale: { x: true, y: true, z: true } },
      len: 100,
      fn: Ease.InOut.Cubic,
      from: this.dot.scale.x,
      to: .05,
    });
  }

  tempt () {
    view.animate(this.dot, {
      start: Date.now(),
      props: { scale: { x: true, y: true, z: true } },
      len: 100,
      fn: Ease.InOut.Cubic,
      from: .05,
      to: .4,
    });
  }

  place () {
    if (this.onboard) {
      return false;
    }

    this.onboard = true;

    view.stopanim(this.dot);
    view.animate(this.dot, {
      start: Date.now(),
      props: { scale: { x: true, y: true, z: true } },
      len: 100,
      fn: Ease.InOut.Cubic,
      from: this.dot.scale.x,
      to: 1,
    });
  }
}

GoDot.R = 9;
GoDot.PAD = 1;

GoDot.DOT_GEO = new THREE.SphereGeometry(GoDot.R, 10, 10);
GoDot.BOX_GEO = new THREE.BoxGeometry((GoDot.R + GoDot.PAD)*2, (GoDot.R + GoDot.PAD)*2, (GoDot.R + GoDot.PAD)*2);



class GoView extends ThreeView {

  init () {
    super.init();

    // game state
    this.turn = 0;

    // view state
    this.theta_off = 0;
    this.phi_off = 0;
  }

  populate () {

    // board group
    this.group = new THREE.Object3D();
    //this.group.rotateX(.5*Math.PI/2);
    this.scene.add(this.group);

    this.animate(this.group, {
      start: Date.now() + 200,
      props: { rotation: { x: true } },
      len: 1000,
      fn: Ease.InOut.Cubic,
      from: 0,
      to: (Math.PI/5)
    });

    this.grid = new THREE.GridHelper((GoDot.R + GoDot.PAD)*2*18, 18, 0x999999, 0x999999);
    this.grid.rotateX(Math.PI/2);
 //   this.group.add(this.grid);

    this.toruswire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.ParametricGeometry((u,v) => this.map_pos(u*19,v*19), 19, 19)),
      new THREE.MeshBasicMaterial( { color: 0x999999 } )
    );
    this.group.add(this.toruswire);

    this.torus = new THREE.Mesh(
      new THREE.TorusGeometry(150, 70, 19, 19),
      new THREE.MeshBasicMaterial( { color: 0xeeeeee, opacity: .8, side: THREE.DoubleSide, transparent: true } )
    );
    this.group.add(this.torus);

    this.boxes = [];

    this.m = [];
    for (var x = 0; x < 19; x++) {
      this.m[x] = [];
      for (var y = 0; y < 19; y++) {
        var godot = new GoDot(x, y);
        this.boxes.push(godot.box);
        this.m[x][y] = godot;

        godot.position.copy(this.map_pos(x, y));

        this.group.add(godot);

        if (Math.random() < .3) {
          godot.setcolor(Math.random() < .5)
          godot.place();
        }
      }
    }
  }

  map_pos_board (x, y) {
    return new THREE.Vector3(
      (x-(18/2)) * 2*(GoDot.R + GoDot.PAD),
      (y-(18/2)) * -2*(GoDot.R + GoDot.PAD),
      0
    );
  }

  map_pos (x, y) {
    var R = 150,
        r = 70,
        theta = this.theta_off + x * (2*Math.PI / 19),
        phi   = this.phi_off   + y * (2*Math.PI / 19),
        M = new THREE.Matrix4().makeRotationZ(theta)               // direct
          .multiply(new THREE.Matrix4().makeTranslation(R, 0, 0))  // move outwards (donut)
          .multiply(new THREE.Matrix4().makeRotationY(phi))        // direct
          .multiply(new THREE.Matrix4().makeTranslation(r, 0, 0))  // move outwards (tube)
          .multiply(new THREE.Matrix4().makeRotationY(Math.PI/2)); // orient face outwards (donut)
    
    return new THREE.Vector3(0,0,0).applyMatrix4(M);
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
        this.hover.remove();
        this.hover = undefined;
      }

      // => add new
      if (new_hover) {
        if (!new_hover.onboard) {
          this.hover = new_hover;
          this.hover.setcolor(this.turn % 2 == 1);
          this.hover.tempt();
        }
      }
    }

    this.render();
  }

  onMouseDown (e) {
    super.onMouseDown(e);

    // => place
    if (this.hover) {
      var x = this.hover.x,
          y = this.hover.y;

      this.hover = undefined;

      this.place(x, y);
    }
  }

  onMouseWheel (e) {
    super.onMouseWheel(e);

    // (e.deltaX and e.deltaY are typically somewhere between -40 and +40)
    this.theta_off -= e.deltaX * (Math.PI / 900); // left/right
    this.phi_off   -= e.deltaY * (Math.PI / 700); // pull in/out

    // just redraw the whole torus wire, why not?
    this.group.remove(this.toruswire);
    this.toruswire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.ParametricGeometry((u,v) => this.map_pos(u*19,v*19), 19, 19)),
      new THREE.MeshBasicMaterial( { color: 0x999999 } )
    );
    this.group.add(this.toruswire);

    // recalc.
    for (var x = 0; x < 19; x++) {
      for (var y = 0; y < 19; y++) {
        this.m[x][y].position.copy(this.map_pos(x, y));
      }
    }
  }

  place (x, y) {
    if (this.m[x][y].onboard) {
      return false;
    }

    this.m[x][y].setcolor(this.turn % 2 == 1).place();

    var remove = this.kill({x:x, y:y});
    // KO rule
    if (remove.length == 1) {
      console.log("KO: place ("+x+","+y+") to remove ("+remove[0].x+","+remove[0].y+")");
      if (this.possible_ko
        && this.possible_ko[0].x == remove[0].x && this.possible_ko[0].y == remove[0].y
        && this.possible_ko[1].x == x && this.possible_ko[1].y == y)
      {
        // invalidate move because of KO rule breach
        this.m[x][y].remove();
        return;
      } else {
        this.possible_ko = [{x:x, y:y}, remove[0]];
      }
    } else {
      this.possible_ko = false;
    }
    this.removeAll(remove);

    var c = this.die({x:x, y:y}, [], true);
    if (!c.live) {
      this.removeAll(c);
    }

    this.turn++;
  }

  removeAll (remove) {
    remove.map((g) => g.remove());
  }

  unmark () {
    for (var x2 = 0; x2 < 19; x2++) {
      for (var y2 = 0; y2 < 19; y2++) {
        this.m[x2][y2].marked = false;
      }
    }
  }

  neighbors (p) {
    var ns = [];
    if (p.x > 0)  ns.push({x: p.x - 1, y: p.y     });
    if (p.x < 18) ns.push({x: p.x + 1, y: p.y     });
    if (p.y > 0)  ns.push({x: p.x,     y: p.y - 1 });
    if (p.y < 18) ns.push({x: p.x,     y: p.y + 1 });
    return ns;
  }

  // Calls "die?" on all it's other-colored neighbors,
  //  then returns all stones to be removed.
  kill (p) {
    var remove = [];

    this.neighbors(p).map((q) => {
      var other = this.m[q.x][q.y];
      if (other.onboard && other.color != this.m[p.x][p.y].color) {
        var c = this.die(q, [], true);
        if (!c.live) {
          remove = remove.concat(c);
        }
      }
    });

    return remove;
  }

  // Checks whether its consellation must die.
  // Recursive check, and returns the constellation if top call.
  die (p, c, top) {
    c.push(this.m[p.x][p.y]);

    if (this.neighbors(p).map((q) => {
        var other = this.m[q.x][q.y];
        if (!other.onboard) {
          return false;
        }
        return (other.color != this.m[p.x][p.y].color) || (c.indexOf(other) >= 0) || this.die(q, c);
      }).and()) {

      return top ? c : true;
    } else {
      c.live = true;
      return top ? c : false;
    }
  }
}



/*
[controller]

  place(dot, x, y):
    set!
    dot.kill?
    dot.die?


[dot]

  kill?
    each other-colored n:
      n.die?

  die?
    mark
    if for all n:
      n has other color
        OR
      n same color && (n.marked || n.die?)
        OR
    then
      remove


*/




GoView.colors = {
  white_stone: 0xaaaaaa,
  black_stone: 0x333333,
  black: 0x000000,
  oak: 0xCA9C55,
};


window.addEventListener('load', function () {

  var view = window.view = new GoView(threeview);
  view.init();
  view.populate();
  view.loop();

}, false);
