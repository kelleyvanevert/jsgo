
(function (root) {

  // Simple, immutable, vector class
  var Vec = (function () {

    var Vec = function (x, y) {
          this.x = x;
          this.y = y;
        };

    Vec.prototype.toString = function () {
      return "(" + this.x + ", " + this.y + ")";
    };
    Vec.prototype.neighbours = function () {
      return [
        new Vec(this.x + 1, this.y),
        new Vec(this.x - 1, this.y),
        new Vec(this.x, this.y + 1),
        new Vec(this.x, this.y - 1)
      ];
    };
    
    return Vec;
  }());

  var GameState = (function () {
    
    var N = 0,
        GameState = function () {
          this.id = N++;
          this.parent = false;
          this.children = [];
        };

    // Initial data
    GameState.prototype.capt_black = 0;
    GameState.prototype.capt_white = 0;
    GameState.prototype.highlight = false;
    GameState.prototype.turn = "black";

    // Internal, side-effect-less operations and helpers
    var own = function (obj, prop) {
          return obj.hasOwnProperty(prop);
        },
        withinBoard = function (v) {
          return 0 <= v.x && v.x <= 18 && 0 <= v.y && v.y <= 18;
        },
        colors = ["black", "white"],
        otherColor = function (c) {
          return c == "white" ? "black" : "white";
        },
        boardsEqual = function (S, T) {
          var vec;
          for (var y = 0; y < 19; y++) {
            for (var x = 0; x < 19; x++) {
              vec = new Vec(x, y);
              if ((S[vec] || "") != (T[vec] || ""))
                return false;
            }
          }
          return true;
        },
        captureChainIfSurrounded = function (state, at) {
          var color = state[at],
              todo = [at],
              chain = {};

          if (!color)
            return state;

          // Discover the chain
          while (todo.length > 0) {
            var current = todo.pop(),
                neighbours = current.neighbours().filter(withinBoard);

            chain[current] = current;
            for (var i = neighbours.length - 1; i >= 0; i--) {
              var neighbour = neighbours[i];
              if (!state[neighbour]) {
                // liberty found, so we won't be capturing this chain
                return state;
              } else if (state[neighbour] === color && !chain[neighbour]) {
                // new stone in chain discovered
                todo.push(neighbour);
              }
            }
          }

          // Remove chain from board
          for (position in chain) {
            if (own(chain, position)) {
              state[position] = false;
              state["capt_" + color] += 1;
            }
          }

          return state;
        },
        fork = function (state) {
          var F = function () {},
              _ = F.prototype = state,
              forkedGameState = new F();

          GameState.call(forkedGameState);
          forkedGameState.parent = state;

          return forkedGameState;
        },
        putStone = function (state, position, color) {
          state[position] = color;
          return state;
        };

    // Attempt to make a move
    // This method will return either an existing child state corresponding
    //  to the given move, a new child state in which given move has been played,
    //  or the current state itself, in the case the KO rule has been violated.
    GameState.prototype.place = function (position) {
      
      for (var i = this.children.length - 1; i >= 0; i--) {
        // Check whether this move was already made in some child
        if (this.children[i][position]) {
          this.children.unshift(this.children.splice(i, 1)[0]);
          return this.children[0];
        }
      }

      var color = this.turn,
          othercolor = otherColor(color),
          newState = putStone(fork(this), position, color),
          neighbours = position.neighbours().filter(withinBoard),
          neighbour;

      // Capture chains if applicable
      for (var i = neighbours.length - 1; i >= 0; i--) {
        neighbour = neighbours[i];
        if (newState[neighbour] === othercolor)
          captureChainIfSurrounded(newState, neighbour);
      }
      captureChainIfSurrounded(newState, position);

      // Check whether KO rule violated, if so => abort
      if (this.parent && boardsEqual(this.parent, this))
        return this;

      // Accept the move
      newState.turn = othercolor;
      newState.highlight = position;
      this.children.unshift(newState);
      return newState;
    };

    return GameState;
  }());

  root.jsgo = root.jsgo || {};
  root.jsgo.Vec = Vec;
  root.jsgo.GameState = GameState;

}(this));
