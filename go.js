
// Utils
var withinBoard = function (v) {
      return 0 <= v.x && v.x <= 18 && 0 <= v.y && v.y <= 18;
    },
    colors = ["white", "black"],
    otherColor = function (c) {
      return c == "white" ? "black" : "white";
    };

// Simple, immutable, vector class
var Vec = (function () {

  var Vec = function (x, y) {
        this.x = x;
        this.y = y;
      };

  Vec.parse = function (str) {
    var m = str.match(/^\(([0-9]+),[ ]*([0-9]+)\)$/);
    if (!m) throw "[Vec.parse] Format error";
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
  
  return Vec;
}());

var State = (function () {

  var State = function () {
        this.cells = {};
        for (var y = 0; y < 19; y++) {
          for (var x = 0; x < 19; x++) {
            this.cells[new Vec(x, y)] = false;
          }
        }
      };

  _.extend(State.prototype, {
    clone: function () {
      var s = new State();
      s.cells = _.clone(this.cells);
      s.highlight = this.highlight;
      return s;
    },
    stoneAt: function (v) {
      return this.cells[v];
    },
    putStoneAt: function (v, color) {
      this.cells[v] = color;
      return this;
    },
    removeStoneAt: function (v) {
      this.cells[v] = false;
      return this;
    },
    // discoverChain : Vec -> [Vec]
    discoverChain: function (v) {
      var cells = this.cells,
          color = cells[v],
          chain = {},
          todo = [v];
      
      if (color === false)
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
        return cells[v] === false;
      });
    }
  });
  
  return State;
}());

var Game = function () {
      var self    = this,
          history = this.history = ko.observableArray([ new State() ]),
          at      = this.at      = ko.observable(0),
          state   = this.state   = ko.computed(function () { return history()[ at() ]; }),
          turn    = this.turn    = ko.computed(function () { return ["white", "black"][ at() % 2 ]; }),
          stones  = this.stones  = [];
      
      // Stone observables for the UI
      // - When these are observables, performance goes down (or I must do less elegant/obvious stuff than what's above)
      // - Then the State class becomes a viewmodel, code simplicity isn't maintained and it'd have multiple responsibilities
      // > Therefore I put this thin viewmodel "facade" between the model and the view
      for (var y = 0; y < 19; y++) {
        stones[y] = [];
        for (var x = 0; x < 19; x++) {
          stones[y][x] = {
            x: x,
            y: y,
            color: ko.observable(false)
          };
        }
      }
      state.subscribe(function (newstate) {
        for (var y = 0; y < 19; y++) {
          for (var x = 0; x < 19; x++) {
            stones[y][x].color(newstate.stoneAt(new Vec(x, y)));
          }
        }
      });
      
      // Operations
      var backward = this.backward = function () {
            if (at() > 0)
              at(at() - 1);
            return this;
          },
          forward = this.forward = function () {
            if (at() < history().length - 1)
              at(at() + 1);
            return this;
          },
          rewind = this.rewind = function () {
            while (at() > 0)
              backward();
            return this;
          },
          fastForward = this.fastForward = function () {
            while (at() < history().length - 1)
              forward();
            return this;
          },
          place = this.place = function (cell) {
            var v = new Vec(cell.x, cell.y),
                color = turn(),
                othercolor = (color === "black" ? "white" : "black"),
                newstate = state().clone().putStoneAt(v, color);
            
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
            
            history.splice(at() + 1, history().length - at() - 1, newstate);
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
