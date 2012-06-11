
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

var Cell = function (pos) {
      this.pos = pos;
      this.color = ko.observable(false);
      this.empty = ko.computed(function () {
        return !this.color();
      }, this);
    };

var Board = function () {
      this.cells = [];
      for (var y = 0; y < 19; y++) {
        this.cells[y] = [];
        for (var x = 0; x < 19; x++) {
          this.cells[y][x] = new Cell(new Vec(x, y));
        }
      }
      
      this.highlight = ko.observable(false);
    };

Board.restrict = function (vs) {
  return _.filter(vs, function (v) {
    return 0 <= v.x && v.x <= 18 && 0 <= v.y && v.y <= 18;
  });
};

_.extend(Board.prototype, {
  get: function (v) {
    return this.cells[v.y][v.x];
  },
  putStoneAt: function (v, color) {
    this.get(v).color(color);
  },
  removeStoneAt: function (v) {
    this.get(v).color(false);
  },
  getLayoutObject: function () {
    var layout = {};
    _.map(this.cells, function (row) {
      _.map(row, function (cell) {
        if (!cell.empty())
          layout[cell.pos.toString()] = cell.color();
      });
    });
    return layout;
  },
  stellation: function (v) {
    if (this.get(v).empty())
      return [];
    
    var stellation = {},
        todo = [v];
    
    while (todo.length > 1) {
      var v = todo.pop(),
          nei = Board.restrict(v.neighbours());
      for (var i = 0, n; (i < nei.length) && (n = nei[i]); i++) {
        if (!stellation[n.toString()] && this.get(n).color === this.get(v).color)
          todo.push(n);
      }
      stellation[v.toString()] = this.get(v);
    }
    
    return _.toArray(stellation);
  },
  liberties: function (cells) {
    var self = this,
        liberties = _.reduce(cells, function (liberties, cell) {
          var lib = _.filter(Board.restrict(cell.pos.neighbours()), function (v) {
            return !liberties[v.toString()] && self.get(v).empty();
          });
          _.map(lib, function (v) {
            liberties[v.toString()] = self.get(v);
          });
          return liberties;
        }, {});
    
    return _.toArray(liberties);
  }
});

var History = function (board) {
      this.board = board;
      this.deltas = [];
      this.at = ko.observable(0);
    };

_.extend(History.prototype, {
  write: function (delta) {
    this.deltas.splice(this.at(), this.deltas.length - this.at(), delta);
    this.forward();
    return this;
  },
  backward: function () {
    var self = this,
        board = this.board,
        delta;
    
    if (this.at() > 0) {
      this.at(this.at() - 1);
      delta = this.deltas[this.at()];
      _.map(delta.added || {}, function (color, v) {
        board.removeStoneAt(Vec.parse(v));
      });
      _.map(delta.removed || {}, function (color, v) {
        board.putStoneAt(Vec.parse(v), color);
      });
      if (this.at() === 0) {
        board.highlight(false);
      } else {
        board.highlight(this.deltas[this.at() - 1].highlight);
      }
    }
    return this;
  },
  forward: function () {
    var self = this,
        board = this.board,
        delta;
    
    if (this.at() < this.deltas.length) {
      delta = this.deltas[this.at()];
      this.at(this.at() + 1);
      _.map(delta.added || {}, function (color, v) {
        board.putStoneAt(Vec.parse(v), color);
      });
      _.map(delta.removed || {}, function (color, v) {
        board.removeStoneAt(Vec.parse(v));
      });
      board.highlight(delta.highlight);
    }
    return this;
  },
  rewind: function () {
    while (this.at() > 0) {
      this.backward();
    }
    return this;
  },
  fastForward: function () {
    while (this.at() < this.deltas.length) {
      this.forward();
    }
    return this;
  }
});

var Game = function () {
      var self = this,
          board = this.board = new Board(),
          history = this.history = new History(this.board);
      
      this.turn = ko.computed(function () {
        return ["white", "black"][this.at() % 2];
      }, history);
      
      this.place = function (cell) {
        var color = self.turn(),
            othercolor = ["black", "white"][["white", "black"].indexOf(color)],
            vec = cell.pos.clone(),
            add = {},
            remove = {},
            layout = board.getLayoutObject();
        
        if (layout.hasOwnProperty(vec.toString()))
          throw "Weird Error";
        
        // Add this new stone
        add[vec.toString()] = color;
        layout[vec.toString()] = color;
        
        // Remove surrounded chains of other player
        _.map(Board.restrict(vec.neighbours()), function (n) {
          if (!layout.hasOwnProperty(n.toString()) || layout[n.toString()] == color)
            return;
          
          var chain = Game.chain(layout, n);
          if (Game.surrounded(layout, chain, othercolor)) {
            _.map(chain, function (v) {
              remove[v.toString()] = othercolor;
              delete layout[v.toString()];
            });
          }
        });
        
        // Possibly die
        var chain = Game.chain(layout, vec);
        if (Game.surrounded(layout, chain, color)) {
          _.map(chain, function (v) {
            remove[v.toString()] = layout[v.toString()];
            delete layout[v.toString()];
          });
          delete add[vec.toString()];
          delete remove[vec.toString()];
        }
        
        history.write({
          added: add,
          removed: remove,
          highlight: vec
        });
      };
    };

_.extend(Game, {
  chain: function (layout, init) {
    var chain = [],
        color = layout[init.toString()],
        done = {},
        todo = [init];
    
    while (todo.length > 0) {
      var v = todo.pop();
      chain.push(v);
      done[v.toString()] = true;
      _.forEach(Board.restrict(v.neighbours()), function (n) {
        if (done[n.toString()] || layout[n.toString()] != color) return;
        todo.push(n);
      });
    }
    
    return chain;
  },
  surrounded: function (layout, vs) {
    var color = layout[vs[0].toString()];
    
    return _.any(vs, function (v) {
      return _.any(Board.restrict(v.neighbours()), function (n) {
        return !layout.hasOwnProperty(n.toString());
      });
    });
  }
});

var game = new Game();

var keyDownActions = {
  "37": _.bind(game.history.backward,    game.history), // left
  "39": _.bind(game.history.forward,     game.history), // right
  "38": _.bind(game.history.rewind,      game.history), // up
  "40": _.bind(game.history.fastForward, game.history)  // down
};

$(function () {
  $(window).keydown(function (e) {
    if (keyDownActions.hasOwnProperty("" + e.which))
      keyDownActions["" + e.which]();
  });
  ko.applyBindings(game, $("#html")[0]);
});
