
(function (root) {

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
      }
    });
    
    return Board;
  }());

  var State = (function () {

    var State = function (data) {
          data = data || {};
          this.board      = data.board || new Board();
          this.capt_black = data.capt_black || 0;
          this.capt_white = data.capt_white || 0;
          this.highlight  = data.highlight || false;
          this.turn       = data.turn || "black";
        };

    State.parse = function (s) {
      var m = s.match(/^(.*);(.*);(.*);(.*);(.*)$/);
      if (!m) throw "[State.parse] Format error";
      
      return new State({
        board      : Board.parse(m[1]),
        capt_black : parseInt(m[2]),
        capt_white : parseInt(m[3]),
        highlight  : (m[4] === "" ? false : Vec.parse(m[4])),
        turn       : m[5]
      });
    };

    _.extend(State.prototype, {
      serialize: function () {
        return [
          this.board.serialize(),
          (this.highlight ? this.highlight.toString() : ""),
          this.capt_black,
          this.capt_white,
          this.turn
        ].join(";");
      },
      equals: function (otherstate) {
        return this.serialize() === otherstate.serialize();
      },
      clone: function () {
        var clone = new State({
          board     : this.board.clone(),
          highlight : this.highlight,
          capt_black: this.capt_black,
          capt_white: this.capt_white,
          turn      : this.turn
        });
        return clone;
      },
      setHighlight: function (v) {
        this.highlight = v;
        return this;
      },
      captureChainIfSurrounded: function (init) {
        var color = this.board.cells[init],
            todo = [init],
            chain = {};
        
        if (color === false)
          throw "[captureChainIfSurrounded] Representing cell must contain a stone!";
        
        while (todo.length > 0) {
          var v = todo.pop(),
              nei = _.filter(v.neighbours(), withinBoard);
          chain[v] = v;
          for (var i = 0, n; i < nei.length && (n = nei[i]); i++) {
            if (this.board.cells[n] === false) {
              return false; // liberty found => no capturing & return false: "not captured"
            } else if (this.board.cells[n] === color && !chain.hasOwnProperty(n)) {
              todo.push(n);
            }
          }
        }
        
        // no liberties found => remove chain & return true: "captured"
        _.forEach(chain, this.board.removeStoneAt, this.board);
        this["capt_" + color] += _.size(chain);
        return true;
      }
    });
    
    return State;
  }());

  var HistoryNode = (function () {

    var HistoryNode = function (state) {
          this.parent = false;
          this.state = state;
          this.children = ko.observableArray([]);
          this.active_child = ko.observable(-1);
          this.activeChild = ko.computed(function () {
            return this.children()[ this.active_child() ];
          }, this);
          this.active = ko.observable(true);
        };
    
    _.extend(HistoryNode.prototype, {
      hasParent: function () {
        return !!this.parent;
      },
      hasChildren: function () {
        return this.children().length > 0;
      },
      rotateActiveChild: function (i) {
        this.active_child((this.active_child() + (i === 0 ? i : (i || 1)) + this.children().length) % this.children().length);
        return this;
      },
      addChild: function (child, set_active) {
        var i = this.children.push(child) - 1;
        child.parent = this;
        child.active = ko.computed(function () {
          return this.activeChild() === child;
        }, this);
        if (set_active)
          this.active_child(i);
        return this;
      }
    });
    
    return HistoryNode;
  }());

  var Game = function () {
        var self      = this,
            history   = this.history   = ko.observable(new HistoryNode(new State())),
            state     = this.state     = ko.computed(function () { return history().state; }),
            turn      = this.turn      = ko.computed(function () { return state().turn; }),
            stones    = this.stones    = [],
            highlight = this.highlight = ko.computed(function () { return state().highlight });
        
        // Observable facade viewmodel of history and stones for the view
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
        });
        
        // Operations
        var backward = this.backward = function () {
              if (history().hasParent())
                history(history().parent);
              return this;
            },
            forward = this.forward = function () {
              if (history().hasChildren())
                history(history().activeChild());
              return this;
            },
            rewind = this.rewind = function () {
              while (history().hasParent())
                backward();
              return this;
            },
            fastForward = this.fastForward = function () {
              while (history().hasChildren())
                forward();
              return this;
            },
            place = this.place = function (cell) {
              var v = new Vec(cell.x, cell.y),
                  currentHistoryNode = history(),
                  // Check whether this move choses a history path by identifying a child node
                  chosenHistoryPathChild = _.find(currentHistoryNode.children(), function (historyNode) {
                    return historyNode.state.board.stoneAt(v);
                  });

              if (chosenHistoryPathChild) {

                while (currentHistoryNode.activeChild() != chosenHistoryPathChild)
                  currentHistoryNode.rotateActiveChild();
                forward();

              } else {

                var color = turn(),
                    othercolor = (color === "black" ? "white" : "black"),
                    newstate = state().clone().setHighlight(v),
                    newboard = newstate.board.putStoneAt(v, color),
                    nei = _.filter(v.neighbours(), withinBoard);
                
                for (var i = 0, n; i < nei.length && (n = nei[i]); i++) {
                  if (newboard.stoneAt(n) === othercolor)
                    newstate.captureChainIfSurrounded(n);
                }
                newstate.captureChainIfSurrounded(v);
                
                // ko rule
                if (history().hasParent() > 0 && newboard.equals(history().parent.state.board))
                  return this;
                
                newstate.turn = othercolor;
                
                history().addChild(new HistoryNode(newstate), true);
                forward();

              }

              return this;
            };
      };

  root.jsgo = root.jsgo || {};
  _.extend(root.jsgo, {
    Vec         : Vec,
    Board       : Board,
    State       : State,
    HistoryNode : HistoryNode,
    Game        : Game
  });

}(this));
