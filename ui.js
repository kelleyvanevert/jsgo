
var UI = {
      gameState: ko.observable(new jsgo.GameState()),
      forward: function () {
        var next = UI.gameState().children[0];
        if (next)
          UI.gameState(next);
      },
      backward: function () {
        var prev = UI.gameState().parent;
        if (prev)
          UI.gameState(prev);
      },
      fastForward: function () {
        var current = UI.gameState(),
            next;
        while (next = current.children[0])
          current = next;
        UI.gameState(current);
      },
      rewind: function () {
        var current = UI.gameState(),
            prev;
        while (prev = current.parent)
          current = prev;
        UI.gameState(current);
      },
      makeMove: function (cell) {
        UI.gameState(UI.gameState().place(new jsgo.Vec(cell.x, cell.y)));
      }
    },
    keyDownActions = {
      "40": function () { UI.backward()    }, // down
      "38": function () { UI.forward()     }, // up
      "37": function () { UI.backward()    }, // left
      "39": function () { UI.forward()     }, // right
      "36": function () { UI.rewind()      }, // home
      "35": function () { UI.fastForward() }  // end
    };

$(function () {
  $(window).keydown(function (e) {
    if (keyDownActions.hasOwnProperty("" + e.which)) {
      keyDownActions["" + e.which](e);
      e.preventDefault();
      return false;
    }
  });
  UI.forwardPossible = ko.computed(function () {
    return UI.gameState().children.length > 0;
  });
  UI.backwardPossible = ko.computed(function () {
    return UI.gameState().parent;
  });
  UI.positions = [];
  for (var y = 0; y < 19; y++) {
    for (var x = 0; x < 19; x++) {
      UI.positions.push(new jsgo.Vec(x, y));
    }
  }
  ko.applyBindings(UI, $("#html")[0]);
});
