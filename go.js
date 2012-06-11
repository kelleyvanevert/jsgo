
// Utils
var withinBoard = function (v) {
  return 0 <= v.x && v.x <= 18 && 0 <= v.y && v.y <= 18;
};

// Immutable
var Vec = function (x, y) {
      this.x = x;
      this.y = y;
    };

Vec.parse = function (str) {
  var m = str.match(/^\(([0-9]+),[ ]*([0-9]+)\)$/);
  if (!m) return false;
  return new Vec(parseInt(m[1]), parseInt(m[2]));
};

_.extend(Vec.prototype, {
  clone: function () {
    return new Vec(this.x, this.y);
  },
  add: function (v) {
    return new Vec(this.x + v.x, this.y + v.y);
  },
  times: function (s) {
    return new Vec(s * this.x, s * this.y);
  },
  negate: function () {
    return this.times(-1);
  },
  subtract: function (v) {
    return this.add(v.negate());
  },
  neighbours: function () {
    return [
      this.add( 0,  1),
      this.add( 0, -1),
      this.add( 1,  0),
      this.add(-1,  0)
    ];
  },
  toString: function () {
    return "(X, Y)".replace("X", this.x).replace("Y", this.y);
  }
});

// Immutable
var State = function () {
      //  0: none
      //  1: white
      // -1: black
      this.cells = {};
      for (var y = 0; y < 19; y++) {
        for (var x = 0; x < 19; x++) {
          this.cells[new Vec(x, y)] = 0;
        }
      }
      
      this.highlight = false;
    };

_.extend(State.prototype, {
  clone: function () {
    var s = new State();
    s.cells = _.clone(this.cells);
    s.highlight = this.highlight;
    return s;
  },
  stoneAt: function (v) {
    var i = this.cells[v];
    if (i === 0) return false;
    if (i === 1) return "white";
    return "black";
  },
  putStoneAt: function (v, color) {
    var s = this.clone();
    s.cells[v] = ["black", "and", "white"].indexOf(color) - 1;
    return s;
  },
  removeStoneAt: function (v) {
    var s = this.clone();
    s.cells[v] = 0;
    return s;
  },
  // discoverChain : Vec -> [Vec]
  discoverChain: function (v) {
    var cells = this.cells,
        color = cells[v],
        chain = {},
        todo = [v];
    
    if (color === 0)
      throw "[discoverChain] Given vector must refer to a stone";
    
    while (todo.length > 0) {
      var v = todo.pop();
      chain[v] = v;
      _(v.neighbours()).chain().filter(withinBoard).forEach(function (n) {
        if (cells[n] === color && !chain[v])
          todo.push(n);
      });
    }
    
    return _.toArray(chain);
  },
  // alive: [Vec] -> Boolean
  alive: function (chain) {
    if (chain.length === 0)
      throw "[alive] Given chain must be non-empty";
    
    var cells = this.cells;
    
    return _(chain).chain().map(function (v) {
      return v.neighbours();
    }).flatten().filter(withinBoard).any(function (v) {
      return cells[v] === 0;
    });
  }
});

var Game = function () {
      var self    = this,
          history = this.history = ko.observableArray([ new State() ]),
          at      = this.at      = ko.observable(0),
          state   = this.state   = ko.computed(function () { return history()[ at() ]; }),
          turn    = this.turn    = ko.computed(function () { return ["white", "black"][ at() % 2 ]; }),
          stones  = this.stones  = [];
      
      _.map(ko.utils.range(0, 18), function (y) {
        stones[y] = [];
        _.map(ko.utils.range(0, 18), function (x) {
          stones[y][x] = {
            x: x,
            y: y,
            color: ko.computed(function () {
              return state().stoneAt(new Vec(x, y));
            })
          };
        });
      });
      
      // Operations
      var backward = this.backward = function () {
            if (at() > 0)
              at(at() - 1);
            return this;
          },
          forward = this.forward = function () {
            if (at() < history().length)
              at(at() + 1);
            return this;
          },
          rewind = this.rewind = function () {
            while (at() > 0)
              backward();
            return this;
          },
          fastForward = this.fastForward = function () {
            while (at() < history().length)
              forward();
            return this;
          },
          place = this.place = function (cell) {
            var v = new Vec(cell.x, cell.y),
                color = turn(),
                othercolor = (color === "black" ? "white" : "black"),
                newstate = state().putStoneAt(v, color);
            
            // Remove surrounded neighbouring chains of other player
            _(v.neighbours()).chain().filter(withinBoard).forEach(function (n) {
              if (newstate.stoneAt(n) !== othercolor) return;
              console.log("maybe remove noughbouring chain of other player...");
              var chain = newstate.discoverChain(n);
              if (!newstate.alive(chain)) {
                console.log("remove!");
                _.map(chain, function (w) {
                  newstate = newstate.removeStoneAt(w);
                });
              }
            });
            
            // Possibly die
            var chain = newstate.discoverChain(v);
            if (!newstate.alive(chain)) {
              _.map(chain, function (w) {
                newstate = newstate.removeStoneAt(w);
              });
            }
            
            history.push(newstate);
            at(at() + 1);
            return this;
          };
    };

var game = new Game();

var keyDownActions = {
  "37": function () { game.backward()    }, // left
  "39": function () { game.forward()     }, // right
  "38": function () { game.rewind()      }, // up
  "40": function () { game.fastForward() }  // down
};

$(function () {
  $(window).keydown(function (e) {
    if (keyDownActions.hasOwnProperty("" + e.which))
      keyDownActions["" + e.which]();
  });
  ko.applyBindings(game, $("#html")[0]);
});
