
// Utils
var withinBoard = function (v) {
      return 0 <= v.x && v.x <= 18 && 0 <= v.y && v.y <= 18;
    },
    colors = ["black", "white"],
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
        this.add(new Vec( 0,  1)),
        this.add(new Vec( 0, -1)),
        this.add(new Vec( 1,  0)),
        this.add(new Vec(-1,  0))
      ];
    },
    toString: function () {
      return "(X, Y)".replace("X", this.x).replace("Y", this.y);
    }
  });
  
  return Vec;
}());

var Board = (function () {

  var Board = function () {
        this.cells = {};
        for (var y = 0; y < 19; y++) {
          for (var x = 0; x < 19; x++) {
            this.cells[new Vec(x, y)] = false;
          }
        }
      };

  Board.parse = function (s) {
    var m = s.match(/^([wb\-]{361})$/),
        board,
        colormap = {
          "w": "white",
          "b": "black",
          "-": false
        };
    
    if (!m) throw "[Board.parse] Format error";
    
    board = new Board();
    for (var y = 0; y < 19; y++) {
      for (var x = 0; x < 19; x++) {
        board.cells[new Vec(x, y)] = colormap[ m[1][y * 19 + x] ];
      }
    }
    
    return board;
  };

  _.extend(Board.prototype, {
    serialize: function () {
      var s = [];
      for (var y = 0; y < 19; y++) {
        for (var x = 0; x < 19; x++) {
          s.push(this.cells[new Vec(x, y)][0] || "-");
        }
      }
      return s.join("");
    },
    equals: function (otherboard) {
      return this.serialize() === otherboard.serialize();
    },
    clone: function () {
      var clone = new Board();
      clone.cells = _.clone(this.cells);
      return clone;
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
    captureChainIfSurrounded: function (init) {
      var color = this.cells[init],
          todo = [init],
          chain = {};
      
      if (color === false)
        throw "[captureChainIfSurrounded] Representing cell must contain a stone!";
      
      while (todo.length > 0) {
        var v = todo.pop(),
            nei = _.filter(v.neighbours(), withinBoard);
        chain[v] = v;
        for (var i = 0, n; i < nei.length && (n = nei[i]); i++) {
          if (this.cells[n] === false) {
            return false; // liberty found => no capturing & return false: "not captured"
          } else if (this.cells[n] === color && !chain.hasOwnProperty(n)) {
            todo.push(n);
          }
        }
      }
      
      // no liberties found => remove chain & return true: "captured"
      _.map(chain, this.removeStoneAt, this);
      return true;
    }
  });
  
  return Board;
}());

var State = (function () {

  var State = function (board, highlight) {
        this.board     = board     || new Board();
        this.highlight = highlight || false;
      };

  State.parse = function (s) {
    var m = s.match(/^(.*);(.*)$/),
        board,
        highlight,
        state;
    
    if (!m) throw "[State.parse] Format error";
    
    board = Board.parse(m[1]);
    highlight = (m[2] === "" ? false : Vec.parse(m[2]));
    
    return new State(board, highlight);
  };

  _.extend(State.prototype, {
    serialize: function () {
      return this.board.serialize() + ";" + (this.highlight ? this.highlight.toString() : "");
    },
    equals: function (otherstate) {
      return this.serialize() === otherstate.serialize();
    },
    clone: function () {
      var clone = new State(this.board.clone(), this.highlight);
      return clone;
    },
    setHighlight: function (v) {
      this.highlight = v;
      return this;
    }
  });
  
  return State;
}());

var Game = function () {
      var self      = this,
          history   = this.history   = ko.observableArray([ new State() ]),
          at        = this.at        = ko.observable(0),
          state     = this.state     = ko.computed(function () { return history()[ at() ]; }),
          turn      = this.turn      = ko.computed(function () { return ["black", "white"][ at() % 2 ]; }),
          stones    = this.stones    = [],
          highlight = this.highlight = ko.observable();
      
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
            stones[y][x].color(newstate.board.stoneAt(new Vec(x, y)));
          }
        }
        highlight(newstate.highlight);
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
                newstate = state().clone().setHighlight(v),
                newboard = newstate.board.putStoneAt(v, color),
                nei = _.filter(v.neighbours(), withinBoard);
            
            for (var i = 0, n; i < nei.length && (n = nei[i]); i++) {
              if (newboard.stoneAt(n) === othercolor)
                newboard.captureChainIfSurrounded(n);
            }
            newboard.captureChainIfSurrounded(v);
            
            // ko rule
            if (at() > 0 && newboard.equals(history()[ at() - 1 ].board))
              return this;
            
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
